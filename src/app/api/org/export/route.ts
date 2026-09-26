import { NextResponse } from "next/server";
import { assertOrgRole, ForbiddenError, getOrgContext } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResultsView } from "@/lib/results/service";
import { logAudit } from "@/lib/audit";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Organization data export (owner only). Includes organization settings,
 * team, subscriptions, campaigns with privacy-screened aggregate results,
 * reports and the audit trail. Raw individual responses are intentionally
 * excluded to protect respondent confidentiality.
 */
export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await assertOrgRole(ctx.org.id, ["owner"]);
    await rateLimit("org-export", ctx.org.id, 5, 3600);
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Only the organization owner can export organization data." }, { status: 403 });
    if (err instanceof RateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
    throw err;
  }
  const admin = createAdminClient();
  const orgId = ctx.org.id;
  const [org, members, subs, campaigns, reports, audit] = await Promise.all([
    admin.from("organizations").select("*").eq("id", orgId).single(),
    admin.from("organization_members").select("user_id, role_key, status, invited_email, created_at").eq("org_id", orgId),
    admin.from("subscriptions").select("*, plans(key, name)").eq("org_id", orgId),
    admin.from("campaigns").select("*").eq("org_id", orgId).order("created_at"),
    admin.from("ai_reports").select("id, campaign_id, status, report_level, generator, model, content, created_at, completed_at").eq("org_id", orgId),
    admin.from("audit_logs").select("created_at, actor_email, action, target_type, target_id, metadata").eq("org_id", orgId).eq("scope", "organization").order("created_at"),
  ]);
  const campaignExports = [];
  for (const c of campaigns.data ?? []) {
    const view = await getResultsView(c);
    const { data: options } = await admin.from("campaign_segment_options").select("kind, label").eq("campaign_id", c.id);
    campaignExports.push({
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      privacy_mode: c.privacy_mode,
      opens_at: c.opens_at,
      closes_at: c.closes_at,
      closed_at: c.closed_at,
      expected_participants: c.expected_participants,
      structure_options: options ?? [],
      participation: view.participation,
      results: view.status === "ready" ? view.payload : null,
    });
  }
  const bundle = {
    exported_at: new Date().toISOString(),
    exported_by: ctx.user.email,
    notice: "Individual survey responses are not included in exports to protect respondent confidentiality. Results are privacy-screened aggregates.",
    organization: org.data,
    members: members.data,
    subscriptions: subs.data,
    campaigns: campaignExports,
    reports: reports.data,
    audit_log: audit.data,
  };
  await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "organization.exported", targetType: "organization", targetId: orgId });
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="roha-organization-export-${ctx.org.slug}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
