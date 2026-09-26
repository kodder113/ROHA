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
import { countResponses, likePattern, loadOrgMap } from "../_lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Campaigns" };

const PAGE_SIZE = 25;

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const status = param(sp, "status");
  const q = param(sp, "q");
  const org = param(sp, "org");
  const page = pageFrom(sp);
  const admin = createAdminClient();

  const statusCounts = await Promise.all(
    (["draft", "open", "closed"] as const).map(async (s) => {
      const { count } = await admin.from("campaigns").select("id", { count: "exact", head: true }).eq("status", s);
      return [s, count ?? 0] as const;
    }),
  );

  let query = admin
    .from("campaigns")
    .select("id, org_id, name, status, privacy_mode, opens_at, closes_at, launched_at, closed_at, response_limit, expected_participants, assessment_version_id, scoring_rule_version_id, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (status === "draft" || status === "open" || status === "closed") query = query.eq("status", status);
  if (q) query = query.ilike("name", likePattern(q));
  if (/^[0-9a-f-]{36}$/i.test(org)) query = query.eq("org_id", org);
  const { data: campaigns, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;

  const rows = campaigns ?? [];
  const [orgMap, { data: versions }, { data: scoring }, counts] = await Promise.all([
    loadOrgMap(rows.map((c) => c.org_id)),
    admin.from("assessment_versions").select("id, version_number, title"),
    admin.from("scoring_rule_versions").select("id, version_number"),
    Promise.all(rows.map(async (c) => [c.id, await countResponses(c.id)] as const)).then((e) => new Map(e)),
  ]);
  const versionMap = new Map((versions ?? []).map((v) => [v.id, v]));
  const scoringMap = new Map((scoring ?? []).map((v) => [v.id, v.version_number]));

  return (
    <div>
      <PageHeader
        eyebrow="Cross-tenant tracking"
        title="Campaigns"
        description="Every assessment campaign across all organizations. Response figures are counts only."
        actions={
          <div className="flex flex-wrap gap-2">
            {statusCounts.map(([s, n]) => (
              <Badge key={s} tone={s === "open" ? "emerald" : s === "draft" ? "amber" : "neutral"} className="capitalize">
                {s}: {n}
              </Badge>
            ))}
          </div>
        }
        className="mb-6"
      />

      <FilterBar resetHref="/admin/campaigns">
        <FilterField label="Campaign name" className="min-w-[14rem] flex-1">
          <Input name="q" defaultValue={q} placeholder="Search campaigns" />
        </FilterField>
        <FilterField label="Status">
          <Select name="status" defaultValue={status}>
            <option value="">Any status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>
        </FilterField>
        {org ? <input type="hidden" name="org" value={org} /> : null}
      </FilterBar>
      {org ? <p className="mb-3 text-sm text-muted">Filtered to one organization.</p> : null}

      <DataTable>
        <THead>
          <Th>Campaign</Th>
          <Th>Organization</Th>
          <Th>Status</Th>
          <Th>Window</Th>
          <Th className="text-right">Responses</Th>
          <Th className="text-right">Limit</Th>
          <Th>Assessment</Th>
          <Th>Scoring</Th>
        </THead>
        <TBody>
          {rows.length === 0 ? <EmptyRow colSpan={8}>No campaigns match these filters.</EmptyRow> : null}
          {rows.map((c) => {
            const n = counts.get(c.id);
            const v = versionMap.get(c.assessment_version_id);
            return (
              <tr key={c.id} className="hover:bg-navy-50/40">
                <Td>
                  <p className="font-medium text-navy-900">{c.name}</p>
                  <p className="text-xs capitalize text-muted">{c.privacy_mode}</p>
                </Td>
                <Td>
                  <OrgLabel id={c.org_id} org={orgMap.get(c.org_id)} />
                </Td>
                <Td>
                  <StatusBadge status={c.status} />
                </Td>
                <Td className="whitespace-nowrap text-xs text-muted">
                  {formatDate(c.opens_at)} – {formatDate(c.closes_at)}
                  {c.closed_at ? <span className="block">Closed {formatDate(c.closed_at)}</span> : null}
                </Td>
                <Td className="text-right tabular-nums">
                  {n ?? "—"}
                  {n !== null && n !== undefined && c.expected_participants ? (
                    <span className="block text-xs text-muted">of {c.expected_participants} expected</span>
                  ) : null}
                </Td>
                <Td className="text-right tabular-nums text-muted">{c.response_limit ?? "None"}</Td>
                <Td className="text-xs">{v ? `v${v.version_number}` : "—"}</Td>
                <Td className="text-xs">{scoringMap.has(c.scoring_rule_version_id) ? `v${scoringMap.get(c.scoring_rule_version_id)}` : "—"}</Td>
              </tr>
            );
          })}
        </TBody>
      </DataTable>
      <Pagination path="/admin/campaigns" searchParams={sp} page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
    </div>
  );
}
