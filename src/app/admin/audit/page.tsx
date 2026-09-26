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
  TBody,
  Td,
  Th,
  THead,
  type SearchParamsRecord,
} from "@/components/admin/table";
import { OrgLabel } from "@/components/admin/org-label";
import { likePattern, loadOrgMap, prettyJson } from "../_lib/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit trail" };

const PAGE_SIZE = 50;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const scope = param(sp, "scope");
  const org = param(sp, "org");
  const action = param(sp, "action");
  const actor = param(sp, "actor");
  const from = param(sp, "from");
  const to = param(sp, "to");
  const page = pageFrom(sp);
  const admin = createAdminClient();

  let query = admin.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (scope === "platform" || scope === "organization") query = query.eq("scope", scope);
  if (/^[0-9a-f-]{36}$/i.test(org)) query = query.eq("org_id", org);
  if (action) query = query.ilike("action", likePattern(action));
  if (actor) query = query.ilike("actor_email", likePattern(actor));
  if (DATE.test(from)) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (DATE.test(to)) query = query.lte("created_at", `${to}T23:59:59.999Z`);

  const [{ data: entries, count, error }, { data: orgs }] = await Promise.all([
    query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    admin.from("organizations").select("id, name").order("name").limit(500),
  ]);
  if (error) throw error;
  const orgMap = await loadOrgMap((entries ?? []).map((e) => e.org_id));

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Audit trail"
        description="Every administrative action across the platform and within organizations. Entries are append-only and never contain survey response content."
        className="mb-6"
      />
      <FilterBar resetHref="/admin/audit">
        <FilterField label="Scope">
          <Select name="scope" defaultValue={scope}>
            <option value="">All scopes</option>
            <option value="platform">Platform</option>
            <option value="organization">Organization</option>
          </Select>
        </FilterField>
        <FilterField label="Organization">
          <Select name="org" defaultValue={org}>
            <option value="">All organizations</option>
            {(orgs ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Action contains">
          <Input name="action" defaultValue={action} placeholder="e.g. subscription" />
        </FilterField>
        <FilterField label="Actor email">
          <Input name="actor" defaultValue={actor} placeholder="name@company.com" />
        </FilterField>
        <FilterField label="From">
          <Input name="from" type="date" defaultValue={from} />
        </FilterField>
        <FilterField label="To">
          <Input name="to" type="date" defaultValue={to} />
        </FilterField>
      </FilterBar>

      <DataTable>
        <THead>
          <Th>When</Th>
          <Th>Actor</Th>
          <Th>Action</Th>
          <Th>Target</Th>
          <Th>Organization</Th>
          <Th>Details</Th>
        </THead>
        <TBody>
          {(entries ?? []).length === 0 ? <EmptyRow colSpan={6}>No audit entries match these filters.</EmptyRow> : null}
          {(entries ?? []).map((e) => {
            const hasMeta = e.metadata && typeof e.metadata === "object" && Object.keys(e.metadata).length > 0;
            return (
              <tr key={e.id}>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(e.created_at)}</Td>
                <Td className="text-xs">{e.actor_email ?? <span className="text-muted">system</span>}</Td>
                <Td>
                  <span className="font-mono text-xs text-navy-900">{e.action}</span>
                  {e.scope === "platform" ? (
                    <Badge tone="navy" className="ml-2">
                      platform
                    </Badge>
                  ) : null}
                </Td>
                <Td className="text-xs text-muted">
                  {e.target_type ?? "—"}
                  {e.target_id ? (
                    <span className="block font-mono" title={e.target_id}>
                      {e.target_id.length > 12 ? `${e.target_id.slice(0, 8)}…` : e.target_id}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-xs">{e.org_id ? <OrgLabel id={e.org_id} org={orgMap.get(e.org_id)} /> : "—"}</Td>
                <Td className="max-w-sm">
                  {hasMeta ? (
                    <details>
                      <summary className="cursor-pointer text-xs font-medium text-emerald-700">Metadata</summary>
                      <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-canvas p-2 text-[11px]">{prettyJson(e.metadata)}</pre>
                    </details>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </Td>
              </tr>
            );
          })}
        </TBody>
      </DataTable>
      <Pagination path="/admin/audit" searchParams={sp} page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
    </div>
  );
}
