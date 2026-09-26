import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Maps organization ids to display names (plus demo/pilot flags). */
export async function loadOrgMap(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  const map = new Map<string, { name: string; is_demo: boolean; is_pilot: boolean; status: string }>();
  if (unique.length === 0) return map;
  const { data } = await createAdminClient().from("organizations").select("id, name, is_demo, is_pilot, status").in("id", unique);
  for (const o of data ?? []) map.set(o.id, { name: o.name, is_demo: o.is_demo, is_pilot: o.is_pilot, status: o.status });
  return map;
}

/** Maps campaign ids to names. */
export async function loadCampaignMap(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data } = await createAdminClient().from("campaigns").select("id, name").in("id", unique);
  for (const c of data ?? []) map.set(c.id, c.name);
  return map;
}

/**
 * Resolves auth user emails. Failures (deleted users, auth API issues) are
 * tolerated and yield null so pages keep rendering.
 */
export async function loadUserEmails(ids: (string | null | undefined)[], max = 100): Promise<Map<string, string | null>> {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))].slice(0, max);
  const admin = createAdminClient();
  const entries = await Promise.all(
    unique.map(async (id) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error) return [id, null] as const;
        return [id, data.user?.email ?? null] as const;
      } catch {
        return [id, null] as const;
      }
    }),
  );
  return new Map(entries);
}

/** Response count for a campaign (count only — raw responses are never read). */
export async function countResponses(campaignId: string): Promise<number | null> {
  const { count, error } = await createAdminClient()
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  return error ? null : (count ?? 0);
}

/** Escapes LIKE wildcards in user-supplied search text. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

export const ACTIVE_SUB_STATUSES = ["active", "trialing"] as const;

export function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value);
  }
}

export const SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "incomplete", "canceled", "expired"] as const;
export const SUBSCRIPTION_SOURCES = ["free", "stripe", "complimentary", "manual"] as const;

/**
 * Subscription counts per plan × status and active counts per source, using
 * head-only count queries (not subject to the API's row cap).
 */
export async function loadSubscriptionMatrix(planIds: string[]) {
  const admin = createAdminClient();
  const [cells, sources] = await Promise.all([
    Promise.all(
      planIds.flatMap((planId) =>
        SUBSCRIPTION_STATUSES.map(async (status) => {
          const { count } = await admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan_id", planId).eq("status", status);
          return { planId, status, count: count ?? 0 };
        }),
      ),
    ),
    Promise.all(
      SUBSCRIPTION_SOURCES.map(async (source) => {
        const { count } = await admin
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("source", source)
          .in("status", [...ACTIVE_SUB_STATUSES]);
        return [source, count ?? 0] as const;
      }),
    ),
  ]);
  const byPlan = new Map<string, Record<string, number>>();
  for (const c of cells) {
    const row = byPlan.get(c.planId) ?? {};
    row[c.status] = c.count;
    byPlan.set(c.planId, row);
  }
  const activeByPlan = new Map<string, number>();
  for (const [planId, row] of byPlan) activeByPlan.set(planId, (row.active ?? 0) + (row.trialing ?? 0));
  return { byPlan, activeByPlan, bySource: Object.fromEntries(sources) as Record<string, number> };
}
