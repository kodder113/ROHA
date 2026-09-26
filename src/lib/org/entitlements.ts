import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveEntitlements, type Entitlements, type PlanRecord, type SubscriptionRecord } from "@/lib/billing/entitlements";

/**
 * Loads an organization's subscriptions and campaign usage and resolves its
 * entitlements. Callers must have already authorized access to `orgId`.
 */
export async function loadEntitlements(orgId: string): Promise<Entitlements> {
  const admin = createAdminClient();
  const [{ data: subs, error }, { data: campaigns }] = await Promise.all([
    admin.from("subscriptions").select("*, plans(*)").eq("org_id", orgId),
    admin.from("campaigns").select("subscription_id").eq("org_id", orgId),
  ]);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const c of campaigns ?? []) {
    if (c.subscription_id) counts[c.subscription_id] = (counts[c.subscription_id] ?? 0) + 1;
  }
  const records: SubscriptionRecord[] = (subs ?? [])
    .filter((s) => s.plans)
    .map((s) => ({
      id: s.id,
      status: s.status,
      source: s.source as SubscriptionRecord["source"],
      campaign_credits: s.campaign_credits,
      limit_overrides: s.limit_overrides,
      started_at: s.started_at,
      current_period_end: s.current_period_end,
      plan: s.plans as unknown as PlanRecord,
    }));
  return resolveEntitlements(records, counts);
}
