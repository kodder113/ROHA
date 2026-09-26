"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertOrgRole, ForbiddenError, MANAGE_ROLES } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadEntitlements } from "@/lib/org/entitlements";
import { assertCanCreateCampaign, assertFeature, effectiveLimits, EntitlementError, type PlanRecord } from "@/lib/billing/entitlements";
import { logAppError, logAudit } from "@/lib/audit";
import { accessCode, normalizeAccessCode, participationHash } from "@/lib/security/tokens";
import { finalizeCampaign } from "@/lib/results/service";
import { getCampaign } from "@/lib/campaigns/queries";
import { pickRulesForAssessment } from "@/lib/scoring/pairing";

export interface CampaignFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  message?: string;
  codes?: string[];
}

const lines = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) =>
      Array.from(
        new Set(
          (v ?? "")
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ),
    )
    .refine((arr) => arr.length <= max, `Enter at most ${max} options.`)
    .refine((arr) => arr.every((s) => s.length <= 120), "Each option must be 120 characters or fewer.");

const campaignSchema = z
  .object({
    orgId: z.uuid(),
    name: z.string().trim().min(2, "Enter an assessment name.").max(160),
    description: z.string().trim().max(2000).optional(),
    opens_at: z.string().min(1, "Choose a launch date."),
    closes_at: z.string().min(1, "Choose a closing date."),
    timezone_offset: z.coerce.number().int().min(-900).max(900).default(0),
    expected_participants: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .refine((v) => v === null || (Number.isInteger(v) && v > 0 && v <= 1_000_000), "Enter a whole number greater than zero."),
    departments: lines(60),
    locations: lines(60),
    levels: lines(20),
    privacy_mode: z.enum(["confidential", "anonymous"]),
    require_access_code: z.string().optional().transform((v) => v === "on"),
    collect_levels: z.string().optional().transform((v) => v === "on"),
  })
  .transform((v) => {
    // datetime-local values are interpreted in the administrator's browser timezone.
    const toIso = (local: string) => new Date(new Date(`${local}:00Z`).getTime() + v.timezone_offset * 60_000).toISOString();
    return { ...v, opensIso: toIso(v.opens_at), closesIso: toIso(v.closes_at) };
  })
  .refine((v) => !Number.isNaN(Date.parse(v.opensIso)), { path: ["opens_at"], message: "Enter a valid launch date." })
  .refine((v) => !Number.isNaN(Date.parse(v.closesIso)), { path: ["closes_at"], message: "Enter a valid closing date." })
  .refine((v) => Date.parse(v.closesIso) > Date.parse(v.opensIso) + 3600_000, {
    path: ["closes_at"],
    message: "The closing date must be at least one hour after the launch date.",
  })
  .refine((v) => Date.parse(v.closesIso) - Date.parse(v.opensIso) <= 180 * 86400_000, {
    path: ["closes_at"],
    message: "Assessments can stay open for at most 180 days.",
  });

function echo(formData: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}

function toFieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

function friendly(err: unknown): string {
  if (err instanceof EntitlementError || err instanceof ForbiddenError) return err.message;
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  if (msg.includes("ROHA_IMMUTABLE")) return "This change is not allowed once an assessment has launched.";
  return "Something went wrong. Please try again.";
}

async function latestPublished() {
  const admin = createAdminClient();
  const [{ data: version }, { data: rulesRows }] = await Promise.all([
    admin.from("assessment_versions").select("id, version_number").eq("status", "published").order("version_number", { ascending: false }).limit(1).single(),
    admin.from("scoring_rule_versions").select("id, version_number, config").eq("status", "published"),
  ]);
  if (!version) throw new Error("No published assessment version is available.");
  // Scoring rules are paired with the assessment version they were designed for.
  const rules = pickRulesForAssessment(version.version_number, rulesRows ?? []);
  if (!rules) throw new Error(`No published scoring rules are available for assessment version ${version.version_number}.`);
  return { versionId: version.id, rulesId: rules.id };
}

async function replaceOptions(campaignId: string, data: { departments: string[]; locations: string[]; levels: string[] }) {
  const admin = createAdminClient();
  const { error: delError } = await admin.from("campaign_segment_options").delete().eq("campaign_id", campaignId);
  if (delError) throw delError;
  const rows = [
    ...data.departments.map((label, i) => ({ campaign_id: campaignId, kind: "department", label, sort_order: i })),
    ...data.locations.map((label, i) => ({ campaign_id: campaignId, kind: "location", label, sort_order: i })),
    ...data.levels.map((label, i) => ({ campaign_id: campaignId, kind: "level", label, sort_order: i })),
  ];
  if (rows.length) {
    const { error } = await admin.from("campaign_segment_options").insert(rows);
    if (error) throw error;
  }
}

export async function createCampaign(_: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), error: "Please correct the highlighted fields.", values: echo(formData) };
  const data = parsed.data;
  let campaignId: string;
  try {
    const ctx = await assertOrgRole(data.orgId, MANAGE_ROLES);
    const ent = await loadEntitlements(data.orgId);
    const subscriptionId = assertCanCreateCampaign(ent);
    if (data.require_access_code) assertFeature(ent, "access_codes");
    const { versionId, rulesId } = await latestPublished();
    const admin = createAdminClient();
    const { data: campaign, error } = await admin
      .from("campaigns")
      .insert({
        org_id: data.orgId,
        assessment_version_id: versionId,
        scoring_rule_version_id: rulesId,
        subscription_id: subscriptionId,
        name: data.name,
        description: data.description || null,
        opens_at: data.opensIso,
        closes_at: data.closesIso,
        expected_participants: data.expected_participants,
        privacy_mode: data.privacy_mode,
        require_access_code: data.require_access_code,
        collect_levels: data.collect_levels && data.levels.length > 0,
        created_by: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    campaignId = campaign.id;
    await replaceOptions(campaignId, data);
    await logAudit({
      orgId: data.orgId,
      actorUserId: ctx.user.id,
      actorEmail: ctx.user.email,
      action: "campaign.created",
      targetType: "campaign",
      targetId: campaignId,
      metadata: { name: data.name, privacy_mode: data.privacy_mode },
    });
  } catch (err) {
    if (!(err instanceof EntitlementError || err instanceof ForbiddenError)) await logAppError("campaign.create", err, {}, data.orgId);
    return { error: friendly(err), values: echo(formData) };
  }
  revalidatePath("/app");
  redirect(`/app/campaigns/${campaignId}?created=1`);
}

export async function updateDraftCampaign(_: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  const campaignId = String(formData.get("campaignId") ?? "");
  const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), error: "Please correct the highlighted fields.", values: echo(formData) };
  const data = parsed.data;
  try {
    const ctx = await assertOrgRole(data.orgId, MANAGE_ROLES);
    const found = await getCampaign(data.orgId, campaignId);
    if (!found) throw new ForbiddenError("Assessment not found.");
    if (found.campaign.status !== "draft") throw new ForbiddenError("Only draft assessments can be fully edited.");
    const ent = await loadEntitlements(data.orgId);
    if (data.require_access_code) assertFeature(ent, "access_codes");
    const { error } = await createAdminClient()
      .from("campaigns")
      .update({
        name: data.name,
        description: data.description || null,
        opens_at: data.opensIso,
        closes_at: data.closesIso,
        expected_participants: data.expected_participants,
        privacy_mode: data.privacy_mode,
        require_access_code: data.require_access_code,
        collect_levels: data.collect_levels && data.levels.length > 0,
      })
      .eq("id", campaignId)
      .eq("org_id", data.orgId);
    if (error) throw error;
    await replaceOptions(campaignId, data);
    await logAudit({ orgId: data.orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "campaign.updated", targetType: "campaign", targetId: campaignId });
  } catch (err) {
    return { error: friendly(err), values: echo(formData) };
  }
  revalidatePath(`/app/campaigns/${campaignId}`);
  redirect(`/app/campaigns/${campaignId}?updated=1`);
}

const idSchema = z.object({ orgId: z.uuid(), campaignId: z.uuid() });

async function loadForAction(formData: FormData) {
  const { orgId, campaignId } = idSchema.parse({ orgId: formData.get("orgId"), campaignId: formData.get("campaignId") });
  const ctx = await assertOrgRole(orgId, MANAGE_ROLES);
  const found = await getCampaign(orgId, campaignId);
  if (!found) throw new ForbiddenError("Assessment not found.");
  return { ctx, orgId, campaignId, campaign: found.campaign };
}

export async function launchCampaign(_: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  try {
    const { ctx, orgId, campaignId, campaign } = await loadForAction(formData);
    if (campaign.status !== "draft") return { error: "This assessment has already been launched." };
    if (new Date(campaign.closes_at).getTime() <= Date.now()) return { error: "The closing date has passed. Update the dates before launching." };
    const admin = createAdminClient();
    // Snapshot the response limit from the subscription this campaign consumes.
    let responseLimit: number | null = null;
    if (campaign.subscription_id) {
      const { data: sub } = await admin.from("subscriptions").select("*, plans(*)").eq("id", campaign.subscription_id).single();
      if (sub?.plans) {
        responseLimit = effectiveLimits({
          id: sub.id,
          status: sub.status,
          source: sub.source as "free",
          campaign_credits: sub.campaign_credits,
          limit_overrides: sub.limit_overrides,
          started_at: sub.started_at,
          current_period_end: sub.current_period_end,
          plan: sub.plans as unknown as PlanRecord,
        }).maxResponsesPerCampaign;
      }
    } else {
      responseLimit = (await loadEntitlements(orgId)).maxResponsesPerCampaign;
    }
    // Launch dates in the past or within the next 30 minutes open the survey immediately.
    const opensAt = new Date(campaign.opens_at).getTime() < Date.now() + 30 * 60_000 ? new Date().toISOString() : campaign.opens_at;
    const { error } = await admin
      .from("campaigns")
      .update({ status: "open", response_limit: responseLimit, opens_at: opensAt })
      .eq("id", campaignId)
      .eq("status", "draft");
    if (error) throw error;
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "campaign.launched", targetType: "campaign", targetId: campaignId, metadata: { response_limit: responseLimit } });
    revalidatePath(`/app/campaigns/${campaignId}`);
    return { message: "The assessment has been launched. Share the survey link with employees." };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export async function closeCampaign(_: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  let closedId: string;
  try {
    const { ctx, orgId, campaignId, campaign } = await loadForAction(formData);
    if (campaign.status !== "open") return { error: "Only active assessments can be closed." };
    if (new Date(campaign.opens_at).getTime() > Date.now()) {
      return { error: "This assessment has not opened yet. Delete it instead if it is no longer needed." };
    }
    await finalizeCampaign(campaign);
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "campaign.closed", targetType: "campaign", targetId: campaignId });
    revalidatePath(`/app/campaigns/${campaignId}`);
    closedId = campaignId;
  } catch (err) {
    await logAppError("campaign.close", err);
    return { error: friendly(err) };
  }
  redirect(`/app/campaigns/${closedId}/results?released=1`);
}

export async function extendCampaign(_: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  try {
    const { ctx, orgId, campaignId, campaign } = await loadForAction(formData);
    if (campaign.status !== "open") return { error: "Only active assessments can be extended." };
    const local = String(formData.get("closes_at") ?? "");
    const offset = Number(formData.get("timezone_offset") ?? 0);
    const closes = new Date(new Date(`${local}:00Z`).getTime() + offset * 60_000);
    if (Number.isNaN(closes.getTime()) || closes.getTime() <= new Date(campaign.closes_at).getTime()) {
      return { error: "Choose a closing date later than the current one." };
    }
    if (closes.getTime() - new Date(campaign.opens_at).getTime() > 180 * 86400_000) return { error: "Assessments can stay open for at most 180 days." };
    const { error } = await createAdminClient().from("campaigns").update({ closes_at: closes.toISOString() }).eq("id", campaignId);
    if (error) throw error;
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "campaign.extended", targetType: "campaign", targetId: campaignId, metadata: { closes_at: closes.toISOString() } });
    revalidatePath(`/app/campaigns/${campaignId}`);
    return { message: "The closing date has been extended." };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export async function deleteCampaign(_: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  try {
    const { ctx, orgId, campaignId, campaign } = await loadForAction(formData);
    if (campaign.status !== "draft" && ctx.role !== "owner") {
      return { error: "Only the organization owner can delete a launched assessment and its data." };
    }
    if (campaign.status !== "draft" && String(formData.get("confirm") ?? "").trim() !== campaign.name) {
      return { error: "Type the assessment name exactly to confirm deletion." };
    }
    const { error } = await createAdminClient().from("campaigns").delete().eq("id", campaignId).eq("org_id", orgId);
    if (error) throw error;
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: campaign.status === "draft" ? "campaign.deleted" : "campaign.data_deleted", targetType: "campaign", targetId: campaignId, metadata: { name: campaign.name, status: campaign.status } });
  } catch (err) {
    return { error: friendly(err) };
  }
  revalidatePath("/app/campaigns");
  redirect("/app/campaigns?deleted=1");
}

export async function generateAccessCodes(_: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  try {
    const { ctx, orgId, campaignId, campaign } = await loadForAction(formData);
    if (!campaign.require_access_code) return { error: "This assessment does not use access codes." };
    if (campaign.status === "closed") return { error: "This assessment is closed." };
    const count = z.coerce.number().int().min(1).max(2000).safeParse(formData.get("count"));
    if (!count.success) return { error: "Enter a number of codes between 1 and 2,000." };
    const admin = createAdminClient();
    const { count: existing } = await admin.from("participation_tokens").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("kind", "access_code");
    if ((existing ?? 0) + count.data > 5000) return { error: "An assessment can have at most 5,000 access codes." };
    const codes = Array.from({ length: count.data }, () => accessCode());
    const { error } = await admin.from("participation_tokens").insert(
      codes.map((code) => ({
        campaign_id: campaignId,
        kind: "access_code",
        token_hash: participationHash(campaign.survey_token, normalizeAccessCode(code)),
      })),
    );
    if (error) throw error;
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "campaign.access_codes_generated", targetType: "campaign", targetId: campaignId, metadata: { count: count.data } });
    return { codes, message: `${count.data} single-use access codes generated. Download them now — they cannot be shown again.` };
  } catch (err) {
    return { error: friendly(err) };
  }
}

/** Creates a new draft that reuses an existing campaign's configuration (recurring assessments). */
export async function duplicateCampaign(_: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
  let newId: string;
  try {
    const { ctx, orgId, campaign } = await loadForAction(formData);
    const ent = await loadEntitlements(orgId);
    const subscriptionId = assertCanCreateCampaign(ent);
    const { versionId, rulesId } = await latestPublished();
    const admin = createAdminClient();
    const duration = new Date(campaign.closes_at).getTime() - new Date(campaign.opens_at).getTime();
    const opens = new Date(Date.now() + 86400_000);
    const { data, error } = await admin
      .from("campaigns")
      .insert({
        org_id: orgId,
        assessment_version_id: versionId,
        scoring_rule_version_id: rulesId,
        subscription_id: subscriptionId,
        name: `${campaign.name} (follow-up)`.slice(0, 160),
        description: campaign.description,
        opens_at: opens.toISOString(),
        closes_at: new Date(opens.getTime() + Math.max(duration, 7 * 86400_000)).toISOString(),
        expected_participants: campaign.expected_participants,
        privacy_mode: campaign.privacy_mode,
        require_access_code: campaign.require_access_code && ent.features.access_codes,
        collect_levels: campaign.collect_levels,
        created_by: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    newId = data.id;
    const { data: options } = await admin.from("campaign_segment_options").select("kind, label, sort_order").eq("campaign_id", campaign.id);
    if (options?.length) {
      await admin.from("campaign_segment_options").insert(options.map((o) => ({ ...o, campaign_id: newId })));
    }
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "campaign.duplicated", targetType: "campaign", targetId: newId, metadata: { source: campaign.id } });
  } catch (err) {
    return { error: friendly(err) };
  }
  redirect(`/app/campaigns/${newId}?created=1`);
}
