import "server-only";
import type { Json, Tables } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { integrations } from "@/lib/env";
import { getResultsView, loadCampaignDefinition, loadCommentsForAnalysis } from "@/lib/results/service";
import { buildReportSnapshot } from "@/lib/ai/snapshot";
import { generateRulesReport } from "@/lib/ai/rules-report";
import { AIReportError, generateAIReport } from "@/lib/ai/anthropic-report";
import { findUnsupportedNumbers } from "@/lib/ai/validate";
import { executiveReportSchema, type ExecutiveReport, type ReportInputSnapshot } from "@/lib/ai/report-schema";
import { logAppError } from "@/lib/audit";

type Campaign = Tables<"campaigns">;
type Organization = Tables<"organizations">;

export type ReportLevel = "basic" | "full";

export interface StoredReport {
  id: string;
  campaignId: string;
  status: string;
  level: ReportLevel;
  generator: "rules" | "anthropic";
  model: string | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  warnings: { path: string; value: string; context: string }[];
  report: ExecutiveReport | null;
  snapshot: ReportInputSnapshot | null;
}

export function toStoredReport(row: Tables<"ai_reports">): StoredReport {
  const parsed = row.content ? executiveReportSchema.safeParse(row.content) : null;
  return {
    id: row.id,
    campaignId: row.campaign_id,
    status: row.status,
    level: row.report_level as ReportLevel,
    generator: row.generator as StoredReport["generator"],
    model: row.model,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
    warnings: (Array.isArray(row.validation_warnings) ? row.validation_warnings : []) as StoredReport["warnings"],
    report: parsed?.success ? parsed.data : null,
    snapshot: (row.input_snapshot as unknown as ReportInputSnapshot) ?? null,
  };
}

/**
 * Generates an executive report for a closed campaign. The deterministic
 * scoring engine produces every number; the AI (full level) only writes
 * narrative from the aggregate snapshot. Basic level — or any environment
 * without an Anthropic key — uses the transparent rules-based generator.
 */
export async function generateReport(args: {
  org: Organization;
  campaign: Campaign;
  level: ReportLevel;
  userId: string;
}): Promise<StoredReport> {
  const { org, campaign, level, userId } = args;
  const admin = createAdminClient();
  const view = await getResultsView(campaign);
  if (view.status !== "ready") {
    throw new AIReportError(
      view.status === "not_released" ? "Reports are available after the assessment closes." : "There are not enough valid responses to produce a report.",
      false,
    );
  }

  const def = await loadCampaignDefinition(campaign);
  // Comments are only analyzed for full reports, and only after PII scrubbing.
  const comments = level === "full" ? await loadCommentsForAnalysis(campaign, def) : {};
  const snapshot = buildReportSnapshot({ organization: org, campaign, payload: view.payload, participation: view.participation, comments });
  const useAI = level === "full" && integrations.anthropic();

  const { data: instructions } = await admin
    .from("ai_report_instructions")
    .select("id, system_prompt, supported_assessment_versions")
    .eq("status", "active")
    .maybeSingle();

  const { data: row, error } = await admin
    .from("ai_reports")
    .insert({
      org_id: org.id,
      campaign_id: campaign.id,
      status: "running",
      report_level: level,
      generator: useAI ? "anthropic" : "rules",
      instructions_version_id: useAI ? (instructions?.id ?? null) : null,
      input_snapshot: snapshot as unknown as Json,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;

  try {
    let report: ExecutiveReport;
    let model: string | null = null;
    let usage: Record<string, unknown> | null = null;
    if (useAI) {
      if (!instructions) throw new AIReportError("No active AI reporting instructions are configured.", false);
      // Instructions describe specific assessment versions; never apply them to another.
      if (!instructions.supported_assessment_versions.includes(view.payload.assessmentVersion)) {
        throw new AIReportError(
          `The active AI reporting instructions do not support assessment version ${view.payload.assessmentVersion}. A platform administrator must activate compatible instructions.`,
          false,
        );
      }
      const result = await generateAIReport(snapshot, instructions.system_prompt);
      report = result.report;
      model = result.model;
      usage = result.usage;
    } else {
      report = generateRulesReport(snapshot);
    }
    const warnings = findUnsupportedNumbers(report, snapshot);
    const { data: done, error: updateError } = await admin
      .from("ai_reports")
      .update({
        status: "completed",
        content: report as unknown as Json,
        model,
        usage: usage as Json,
        validation_warnings: warnings as unknown as Json,
        completed_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .select("*")
      .single();
    if (updateError) throw updateError;
    return toStoredReport(done);
  } catch (err) {
    const message = err instanceof AIReportError ? err.message : "Report generation failed unexpectedly.";
    await admin.from("ai_reports").update({ status: "failed", error: message, completed_at: new Date().toISOString() }).eq("id", row.id);
    if (!(err instanceof AIReportError) || err.retryable) await logAppError("reports.generate", err, { reportId: row.id, level }, org.id);
    throw err instanceof AIReportError ? err : new AIReportError(message, true);
  }
}

/** Reports for a campaign (newest first), read through the caller's RLS scope by id filter. */
export async function listCampaignReports(campaignId: string): Promise<StoredReport[]> {
  const { data } = await createAdminClient()
    .from("ai_reports")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map(toStoredReport);
}
