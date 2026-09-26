import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { safeEqual } from "@/lib/security/tokens";
import { ensureCampaignState } from "@/lib/results/service";
import { logAppError, logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Scheduled maintenance (run daily; see vercel.json). Requires
 * `Authorization: Bearer $CRON_SECRET`.
 *  1. Closes campaigns whose closing date has passed (freezing results and
 *     destroying participation tokens).
 *  2. Enforces each organization's data-retention setting by deleting raw
 *     response records and comments for campaigns closed longer ago than the
 *     retention period. Privacy-screened aggregates and reports are kept.
 */
export async function GET(request: NextRequest) {
  const secret = serverEnv.cronSecret();
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const summary = { closed: 0, purgedCampaigns: 0, errors: 0 };

  const { data: expired } = await admin.from("campaigns").select("*").eq("status", "open").lte("closes_at", new Date().toISOString()).limit(200);
  for (const c of expired ?? []) {
    try {
      await ensureCampaignState(c);
      summary.closed += 1;
    } catch (err) {
      summary.errors += 1;
      await logAppError("cron.close", err, { campaignId: c.id }, c.org_id);
    }
  }

  const { data: closed } = await admin
    .from("campaigns")
    .select("id, org_id, closed_at, organizations(data_retention_months)")
    .eq("status", "closed")
    .not("closed_at", "is", null)
    .limit(1000);
  for (const c of closed ?? []) {
    const months = (c.organizations as { data_retention_months: number } | null)?.data_retention_months ?? 36;
    const cutoff = new Date(c.closed_at!);
    cutoff.setMonth(cutoff.getMonth() + months);
    if (cutoff.getTime() > Date.now()) continue;
    try {
      // Aggregates must exist before raw data is removed.
      const { data: agg } = await admin.from("aggregated_results").select("id").eq("campaign_id", c.id).limit(1);
      if (!agg?.length) continue;
      const { count: responses } = await admin.from("responses").select("id", { count: "exact", head: true }).eq("campaign_id", c.id);
      const { count: comments } = await admin.from("response_comments").select("id", { count: "exact", head: true }).eq("campaign_id", c.id);
      if (!responses && !comments) continue;
      await admin.from("response_comments").delete().eq("campaign_id", c.id);
      await admin.from("responses").delete().eq("campaign_id", c.id);
      summary.purgedCampaigns += 1;
      await logAudit({ orgId: c.org_id, action: "retention.raw_data_deleted", targetType: "campaign", targetId: c.id, metadata: { months, responses, comments } });
    } catch (err) {
      summary.errors += 1;
      await logAppError("cron.retention", err, { campaignId: c.id }, c.org_id);
    }
  }
  return NextResponse.json(summary);
}
