import "server-only";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCampaignState } from "@/lib/results/service";

export type Campaign = Tables<"campaigns">;
export type SegmentOptionRow = Tables<"campaign_segment_options">;

export type CampaignPhase = "draft" | "scheduled" | "active" | "closed";

export function campaignPhase(c: Pick<Campaign, "status" | "opens_at" | "closes_at">, now = Date.now()): CampaignPhase {
  if (c.status === "draft") return "draft";
  if (c.status === "closed" || new Date(c.closes_at).getTime() <= now) return "closed";
  if (new Date(c.opens_at).getTime() > now) return "scheduled";
  return "active";
}

export const PHASE_LABEL: Record<CampaignPhase, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  closed: "Completed",
};

export const PHASE_TONE: Record<CampaignPhase, "neutral" | "emerald" | "amber" | "navy"> = {
  draft: "neutral",
  scheduled: "amber",
  active: "emerald",
  closed: "navy",
};

export interface CampaignSummary extends Campaign {
  phase: CampaignPhase;
  responseCount: number;
}

/** Campaigns for an organization (RLS-scoped) with response counts. */
export async function listCampaigns(orgId: string): Promise<CampaignSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("campaigns").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  if (error) throw error;
  const campaigns = await Promise.all((data ?? []).map((c) => ensureCampaignState(c)));
  const admin = createAdminClient();
  const counts = await Promise.all(
    campaigns.map(async (c) => {
      const { count } = await admin.from("responses").select("id", { count: "exact", head: true }).eq("campaign_id", c.id);
      return count ?? 0;
    }),
  );
  return campaigns.map((c, i) => ({ ...c, phase: campaignPhase(c), responseCount: counts[i] }));
}

/** A single campaign, fetched through RLS so cross-tenant access is impossible. */
export async function getCampaign(orgId: string, campaignId: string): Promise<{ campaign: Campaign; options: SegmentOptionRow[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return null;
  const supabase = await createClient();
  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", campaignId).eq("org_id", orgId).maybeSingle();
  if (!campaign) return null;
  const { data: options } = await supabase
    .from("campaign_segment_options")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("kind")
    .order("sort_order");
  return { campaign: await ensureCampaignState(campaign), options: options ?? [] };
}

export function surveyUrl(appUrl: string, token: string): string {
  return `${appUrl}/s/${token}`;
}
