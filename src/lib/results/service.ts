import "server-only";
import type { Json, Tables } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseScoringConfig } from "@/lib/scoring/config";
import { ENGINE_VERSION, engineMajor } from "@/lib/scoring/engine";
import type { DimensionDef, QuestionDef, ScoringConfig } from "@/lib/scoring/types";
import { scrubPII, seededShuffle } from "@/lib/privacy/redact";
import { toDimensionDefs, toProfiledResponses, toQuestionDefs, type ResponseItemRow, type ResponseRow } from "./mapping";
import { analyzeSegments, scorePopulation, SEGMENT_ATTRIBUTES, TENURE_OPTIONS, type SegmentAttribute, type SegmentOption } from "./segments";
import type { ParticipationSummary, QualitativeSummary, ResultsPayload, ResultsView, TrendPoint } from "./types";
import { scoredPopulation } from "./exclusions";

type Campaign = Tables<"campaigns">;

export interface CampaignDefinition {
  dimensions: DimensionDef[];
  questions: QuestionDef[];
  qualitative: Tables<"qualitative_questions">[];
  config: ScoringConfig;
  assessmentVersion: number;
  scoringRuleVersion: number;
}

const PAGE = 1000;

async function fetchAll<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function loadCampaignDefinition(campaign: Pick<Campaign, "assessment_version_id" | "scoring_rule_version_id">): Promise<CampaignDefinition> {
  const admin = createAdminClient();
  const [dims, qs, qual, rules, version] = await Promise.all([
    admin.from("dimensions").select("*").eq("version_id", campaign.assessment_version_id).order("sort_order"),
    admin.from("questions").select("*").eq("version_id", campaign.assessment_version_id).order("sort_order"),
    admin.from("qualitative_questions").select("*").eq("version_id", campaign.assessment_version_id).order("sort_order"),
    admin.from("scoring_rule_versions").select("*").eq("id", campaign.scoring_rule_version_id).single(),
    admin.from("assessment_versions").select("version_number").eq("id", campaign.assessment_version_id).single(),
  ]);
  for (const r of [dims, qs, qual, rules, version]) if (r.error) throw r.error;
  return {
    dimensions: toDimensionDefs(dims.data!),
    questions: toQuestionDefs(qs.data!),
    qualitative: qual.data!,
    config: parseScoringConfig(rules.data!.config),
    assessmentVersion: version.data!.version_number,
    scoringRuleVersion: rules.data!.version_number,
  };
}

export async function loadParticipation(campaign: Campaign, validResponses: number | null = null): Promise<ParticipationSummary> {
  const admin = createAdminClient();
  const [{ count }, { data: daily }] = await Promise.all([
    admin.from("responses").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id),
    admin.from("campaign_daily_participation").select("day, submissions").eq("campaign_id", campaign.id).order("day"),
  ]);
  const responses = count ?? 0;
  const expected = campaign.expected_participants;
  return {
    responses,
    validResponses,
    expected,
    rate: expected ? Math.min(100, (responses / expected) * 100) : null,
    daily: daily ?? [],
  };
}

async function loadSegmentOptions(campaignId: string): Promise<Record<SegmentAttribute, SegmentOption[]>> {
  const { data, error } = await createAdminClient()
    .from("campaign_segment_options")
    .select("id, kind, label, sort_order")
    .eq("campaign_id", campaignId)
    .order("sort_order");
  if (error) throw error;
  const by = (kind: string) => (data ?? []).filter((o) => o.kind === kind).map((o) => ({ key: o.id, label: o.label }));
  return { department: by("department"), location: by("location"), level: by("level"), tenure: TENURE_OPTIONS };
}

async function loadQualitative(campaign: Campaign, def: CampaignDefinition, validResponses: number): Promise<QualitativeSummary[]> {
  const comments = await fetchAll<{ qualitative_question_id: string; body: string; consent_to_quote: boolean }>((from, to) =>
    createAdminClient()
      .from("response_comments")
      .select("qualitative_question_id, body, consent_to_quote")
      .eq("campaign_id", campaign.id)
      .order("id")
      .range(from, to),
  );
  const showQuotes = validResponses >= def.config.minGroupSize;
  return def.qualitative.map((q) => {
    const forQuestion = comments.filter((c) => c.qualitative_question_id === q.id);
    const quotes = showQuotes
      ? seededShuffle(
          forQuestion.filter((c) => c.consent_to_quote).map((c) => scrubPII(c.body)),
          `${campaign.id}:${q.id}`,
        )
      : [];
    return { key: q.key, prompt: q.prompt, commentCount: forQuestion.length, quotes };
  });
}

/** All comments, PII-scrubbed and shuffled, for AI theme analysis (never shown verbatim). */
export async function loadCommentsForAnalysis(campaign: Campaign, def: CampaignDefinition): Promise<Record<string, string[]>> {
  const comments = await fetchAll<{ qualitative_question_id: string; body: string }>((from, to) =>
    createAdminClient()
      .from("response_comments")
      .select("qualitative_question_id, body")
      .eq("campaign_id", campaign.id)
      .order("id")
      .range(from, to),
  );
  const out: Record<string, string[]> = {};
  for (const q of def.qualitative) {
    out[q.key] = seededShuffle(
      comments.filter((c) => c.qualitative_question_id === q.id).map((c) => scrubPII(c.body)),
      `ai:${campaign.id}:${q.id}`,
    );
  }
  return out;
}

/** Computes the full, privacy-screened results payload from raw responses. */
export async function computeResultsPayload(campaign: Campaign): Promise<ResultsPayload> {
  const admin = createAdminClient();
  const def = await loadCampaignDefinition(campaign);
  const responses = await fetchAll<ResponseRow>((from, to) =>
    admin
      .from("responses")
      .select("id, department_option_id, location_option_id, level_option_id, tenure_range")
      .eq("campaign_id", campaign.id)
      .order("id")
      .range(from, to),
  );
  const ids = responses.map((r) => r.id);
  const items: ResponseItemRow[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    items.push(
      ...(await fetchAll<ResponseItemRow>((from, to) =>
        admin
          .from("response_items")
          .select("response_id, question_id, current_value, current_na, desired_value, desired_na")
          .in("response_id", chunk)
          .order("response_id")
          .order("question_id")
          .range(from, to),
      )),
    );
  }
  const profiled = toProfiledResponses(responses, items);
  const ctx = { dimensions: def.dimensions, questions: def.questions, config: def.config };
  const overall = scorePopulation(profiled, ctx);

  const segments: ResultsPayload["segments"] = {};
  if (campaign.privacy_mode === "confidential" && scoredPopulation(overall) >= def.config.minGroupSize) {
    const options = await loadSegmentOptions(campaign.id);
    for (const attribute of SEGMENT_ATTRIBUTES) {
      if (options[attribute].length === 0) continue;
      segments[attribute] = analyzeSegments(attribute, options[attribute], profiled, ctx);
    }
  }

  return {
    engineVersion: ENGINE_VERSION,
    scoringRuleVersion: def.scoringRuleVersion,
    assessmentVersion: def.assessmentVersion,
    minGroupSize: def.config.minGroupSize,
    computedAt: new Date().toISOString(),
    overall,
    segments,
    qualitative: await loadQualitative(campaign, def, overall.validResponses),
    privacyMode: campaign.privacy_mode as ResultsPayload["privacyMode"],
  };
}

/**
 * Closes a campaign: marks it closed, destroys participation tokens (no longer
 * needed for duplicate prevention), and freezes the aggregated results.
 */
export async function finalizeCampaign(campaign: Campaign): Promise<Campaign> {
  const admin = createAdminClient();
  let current = campaign;
  if (campaign.status !== "closed") {
    const { data, error } = await admin
      .from("campaigns")
      .update({ status: "closed", closes_at: new Date(Math.min(Date.now(), new Date(campaign.closes_at).getTime())).toISOString() })
      .eq("id", campaign.id)
      .select("*")
      .single();
    if (error) throw error;
    current = data;
  }
  await admin.from("participation_tokens").delete().eq("campaign_id", campaign.id);
  await getOrComputeResults(current, true);
  return current;
}

/** Returns frozen aggregates for a closed campaign, computing them once. */
async function getOrComputeResults(campaign: Campaign, force = false): Promise<ResultsPayload> {
  const admin = createAdminClient();
  if (!force) {
    const { data } = await admin
      .from("aggregated_results")
      .select("payload, engine_version")
      .eq("campaign_id", campaign.id)
      .eq("scoring_rule_version_id", campaign.scoring_rule_version_id)
      .maybeSingle();
    // Frozen results are reused for any engine release with the same major version,
    // so historical results are never recomputed by backward-compatible engine updates.
    if (data && engineMajor(data.engine_version) === engineMajor(ENGINE_VERSION)) return data.payload as unknown as ResultsPayload;
    if (data) {
      // Raw responses may have been purged under the retention policy; keep the frozen aggregates.
      const { count } = await admin.from("responses").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id);
      if (!count) return data.payload as unknown as ResultsPayload;
    }
  }
  const payload = await computeResultsPayload(campaign);
  const { error } = await admin.from("aggregated_results").upsert(
    {
      campaign_id: campaign.id,
      scoring_rule_version_id: campaign.scoring_rule_version_id,
      engine_version: ENGINE_VERSION,
      payload: payload as unknown as Json,
      valid_responses: payload.overall.validResponses,
      computed_at: payload.computedAt,
    },
    { onConflict: "campaign_id,scoring_rule_version_id" },
  );
  if (error) throw error;
  return payload;
}

/** Closes campaigns whose closing date has passed. Returns the updated campaign. */
export async function ensureCampaignState(campaign: Campaign): Promise<Campaign> {
  if (campaign.status === "open" && new Date(campaign.closes_at).getTime() <= Date.now()) {
    return finalizeCampaign(campaign);
  }
  return campaign;
}

/**
 * The privacy-screened results view for a campaign. Results are released only
 * after a campaign closes so that aggregates cannot be differenced over time.
 * Callers must have authorized access to the campaign's organization.
 */
export async function getResultsView(campaignInput: Campaign): Promise<ResultsView> {
  const campaign = await ensureCampaignState(campaignInput);
  if (campaign.status !== "closed") {
    return { status: "not_released", participation: await loadParticipation(campaign), closesAt: campaign.closes_at };
  }
  const payload = await getOrComputeResults(campaign);
  const participation = await loadParticipation(campaign, payload.overall.validResponses);
  if (scoredPopulation(payload.overall) < payload.minGroupSize) {
    return { status: "insufficient", participation, minGroupSize: payload.minGroupSize };
  }
  return { status: "ready", participation, payload };
}

/** Historical organizational health trend across closed campaigns. */
export async function getHistoricalTrend(orgId: string): Promise<TrendPoint[]> {
  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from("campaigns")
    .select("*")
    .eq("org_id", orgId)
    .in("status", ["open", "closed"])
    .order("closes_at");
  if (error) throw error;
  const points: TrendPoint[] = [];
  for (const c of campaigns ?? []) {
    const view = await getResultsView(c);
    if (view.status !== "ready") continue;
    const o = view.payload.overall;
    points.push({
      campaignId: c.id,
      name: c.name,
      closedAt: c.closed_at ?? c.closes_at,
      assessmentVersion: view.payload.assessmentVersion,
      dimensionLabels: Object.fromEntries(o.dimensions.map((d) => [d.key, { code: d.code, name: d.name }])),
      validResponses: o.validResponses,
      currentIndex: o.overall.currentIndex,
      desiredIndex: o.overall.desiredIndex,
      dimensions: Object.fromEntries(o.dimensions.map((d) => [d.key, { current: d.current.score, desired: d.desired.score }])),
    });
  }
  return points;
}
