import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  EmptyRow,
  FilterBar,
  FilterField,
  pageFrom,
  Pagination,
  param,
  StatusBadge,
  TBody,
  Td,
  Th,
  THead,
  type SearchParamsRecord,
} from "@/components/admin/table";
import { OrgLabel } from "@/components/admin/org-label";
import { ACTIVE_SUB_STATUSES, likePattern } from "../_lib/queries";
import { formatDate } from "@/lib/utils";
import { isSubscriptionActive } from "@/lib/billing/entitlements";

export const metadata: Metadata = { title: "Organizations" };

const PAGE_SIZE = 25;

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const status = param(sp, "status");
  const planKey = param(sp, "plan");
  const pilot = param(sp, "pilot");
  const page = pageFrom(sp);
  const admin = createAdminClient();

  const { data: plans } = await admin.from("plans").select("id, key, name, sort_order").order("sort_order");
  const planById = new Map((plans ?? []).map((p) => [p.id, p]));

  // Plan filter: organizations holding an active subscription on the plan.
  let planOrgIds: string[] | null = null;
  const filterPlan = (plans ?? []).find((p) => p.key === planKey);
  if (filterPlan) {
    const { data } = await admin
      .from("subscriptions")
      .select("org_id")
      .eq("plan_id", filterPlan.id)
      .in("status", [...ACTIVE_SUB_STATUSES])
      .limit(10000);
    planOrgIds = [...new Set((data ?? []).map((s) => s.org_id))];
  }

  let query = admin.from("organizations").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (q) query = query.ilike("name", likePattern(q));
  if (status === "active" || status === "suspended") query = query.eq("status", status);
  if (pilot === "pilot") query = query.eq("is_pilot", true);
  if (pilot === "demo") query = query.eq("is_demo", true);
  if (pilot === "standard") query = query.eq("is_pilot", false).eq("is_demo", false);
  if (planOrgIds) query = query.in("id", planOrgIds.length ? planOrgIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: orgs, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;

  const ids = (orgs ?? []).map((o) => o.id);
  const [{ data: subs }, { data: members }, { data: campaigns }] = ids.length
    ? await Promise.all([
        admin.from("subscriptions").select("org_id, plan_id, status, current_period_end").in("org_id", ids).in("status", [...ACTIVE_SUB_STATUSES]),
        admin.from("organization_members").select("org_id").in("org_id", ids).eq("status", "active"),
        admin.from("campaigns").select("org_id, status").in("org_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const primaryPlan = resolvePrimaryPlans(subs ?? [], planById);
  const memberCount = new Map<string, number>();
  for (const m of members ?? []) memberCount.set(m.org_id, (memberCount.get(m.org_id) ?? 0) + 1);
  const campaignCount = new Map<string, { total: number; open: number }>();
  for (const c of campaigns ?? []) {
    const e = campaignCount.get(c.org_id) ?? { total: 0, open: 0 };
    e.total += 1;
    if (c.status === "open") e.open += 1;
    campaignCount.set(c.org_id, e);
  }

  return (
    <div>
      <PageHeader eyebrow="Tenants" title="Organizations" description="All client organizations on the ROHA platform. Open an organization to manage access, pilots, subscriptions and retention." className="mb-6" />

      <FilterBar resetHref="/admin/organizations">
        <FilterField label="Search by name" className="min-w-[14rem] flex-1">
          <Input name="q" defaultValue={q} placeholder="Organization name" />
        </FilterField>
        <FilterField label="Status">
          <Select name="status" defaultValue={status}>
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </FilterField>
        <FilterField label="Plan (active subscription)">
          <Select name="plan" defaultValue={planKey}>
            <option value="">Any plan</option>
            {(plans ?? []).map((p) => (
              <option key={p.id} value={p.key}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Type">
          <Select name="pilot" defaultValue={pilot}>
            <option value="">All types</option>
            <option value="pilot">Pilot</option>
            <option value="demo">Demonstration</option>
            <option value="standard">Standard</option>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable>
        <THead>
          <Th>Organization</Th>
          <Th>Status</Th>
          <Th>Plan</Th>
          <Th className="text-right">Members</Th>
          <Th className="text-right">Campaigns</Th>
          <Th>Industry</Th>
          <Th>Created</Th>
        </THead>
        <TBody>
          {(orgs ?? []).length === 0 ? <EmptyRow colSpan={7}>No organizations match these filters.</EmptyRow> : null}
          {(orgs ?? []).map((o) => {
            const cc = campaignCount.get(o.id);
            return (
              <tr key={o.id} className="hover:bg-navy-50/40">
                <Td>
                  <OrgLabel id={o.id} org={o} />
                  <p className="mt-0.5 font-mono text-xs text-muted">{o.slug}</p>
                </Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
                <Td>{primaryPlan.get(o.id)?.name ?? <Badge tone="outline">No active plan</Badge>}</Td>
                <Td className="text-right tabular-nums">{memberCount.get(o.id) ?? 0}</Td>
                <Td className="text-right tabular-nums">
                  {cc?.total ?? 0}
                  {cc?.open ? <span className="ml-1 text-xs text-emerald-700">({cc.open} open)</span> : null}
                </Td>
                <Td className="text-xs text-muted">{o.industry ?? "—"}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDate(o.created_at)}</Td>
              </tr>
            );
          })}
        </TBody>
      </DataTable>
      <Pagination path="/admin/organizations" searchParams={sp} page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
    </div>
  );
}

/** Highest-ranked currently active plan per organization. */
function resolvePrimaryPlans(
  subs: { org_id: string; plan_id: string; status: string; current_period_end: string | null }[],
  planById: Map<string, { name: string; sort_order: number }>,
) {
  const now = new Date();
  const out = new Map<string, { name: string; sort: number }>();
  for (const s of subs) {
    if (!isSubscriptionActive(s, now)) continue;
    const p = planById.get(s.plan_id);
    if (!p) continue;
    const cur = out.get(s.org_id);
    if (!cur || p.sort_order > cur.sort) out.set(s.org_id, { name: p.name, sort: p.sort_order });
  }
  return out;
}
