import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import {
  DataTable,
  EmptyRow,
  FilterBar,
  FilterField,
  pageFrom,
  Pagination,
  param,
  SectionTitle,
  StatusBadge,
  TBody,
  Td,
  Th,
  THead,
  type SearchParamsRecord,
} from "@/components/admin/table";
import { OrgLabel } from "@/components/admin/org-label";
import { loadCampaignMap, loadOrgMap } from "../_lib/queries";
import { formatDateTime } from "@/lib/utils";
import { deleteFailedReport } from "./actions";

export const metadata: Metadata = { title: "Reports" };

const PAGE_SIZE = 25;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const status = param(sp, "status");
  const level = param(sp, "level");
  const page = pageFrom(sp);
  const admin = createAdminClient();

  let query = admin
    .from("ai_reports")
    .select("id, org_id, campaign_id, status, report_level, generator, model, instructions_version_id, validation_warnings, error, created_at, completed_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (["pending", "running", "completed", "failed"].includes(status)) query = query.eq("status", status);
  if (level === "basic" || level === "full") query = query.eq("report_level", level);
  const [{ data: reports, count, error }, { data: pdfs }, { data: instructions }] = await Promise.all([
    query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    admin.from("generated_reports").select("id, org_id, campaign_id, ai_report_id, format, byte_size, created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("ai_report_instructions").select("id, version_number"),
  ]);
  if (error) throw error;

  const rows = reports ?? [];
  const [orgMap, campaignMap] = await Promise.all([
    loadOrgMap([...rows.map((r) => r.org_id), ...(pdfs ?? []).map((p) => p.org_id)]),
    loadCampaignMap([...rows.map((r) => r.campaign_id), ...(pdfs ?? []).map((p) => p.campaign_id)]),
  ]);
  const instructionVersion = new Map((instructions ?? []).map((i) => [i.id, i.version_number]));

  return (
    <div>
      <PageHeader eyebrow="Cross-tenant" title="Reports" description="AI executive reports and PDF exports generated across all organizations." className="mb-6" />

      <FilterBar resetHref="/admin/reports">
        <FilterField label="Status">
          <Select name="status" defaultValue={status}>
            <option value="">Any status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
          </Select>
        </FilterField>
        <FilterField label="Level">
          <Select name="level" defaultValue={level}>
            <option value="">Any level</option>
            <option value="basic">Basic</option>
            <option value="full">Full</option>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable>
        <THead>
          <Th>Organization</Th>
          <Th>Campaign</Th>
          <Th>Level</Th>
          <Th>Generator</Th>
          <Th>Status</Th>
          <Th className="text-right">Warnings</Th>
          <Th>Created</Th>
          <Th>Error / actions</Th>
        </THead>
        <TBody>
          {rows.length === 0 ? <EmptyRow colSpan={8}>No reports match these filters.</EmptyRow> : null}
          {rows.map((r) => {
            const warnings = Array.isArray(r.validation_warnings) ? r.validation_warnings.length : 0;
            const iv = r.instructions_version_id ? instructionVersion.get(r.instructions_version_id) : undefined;
            return (
              <tr key={r.id}>
                <Td>
                  <OrgLabel id={r.org_id} org={orgMap.get(r.org_id)} />
                </Td>
                <Td className="text-sm">{campaignMap.get(r.campaign_id) ?? "—"}</Td>
                <Td className="capitalize">{r.report_level}</Td>
                <Td className="text-xs">
                  <Badge tone={r.generator === "anthropic" ? "violet" : "outline"}>{r.generator}</Badge>
                  {r.model ? <p className="mt-1 font-mono text-muted">{r.model}</p> : null}
                  {iv ? <p className="text-muted">instructions v{iv}</p> : null}
                </Td>
                <Td>
                  <StatusBadge status={r.status} />
                </Td>
                <Td className="text-right tabular-nums">{warnings ? <Badge tone="amber">{warnings}</Badge> : <span className="text-muted">0</span>}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(r.created_at)}</Td>
                <Td className="max-w-xs">
                  {r.error ? (
                    <p className="line-clamp-3 text-xs text-red-700" title={r.error}>
                      {r.error}
                    </p>
                  ) : null}
                  {r.status === "failed" ? (
                    <ActionForm action={deleteFailedReport} compact confirm="Delete this failed report record?" className="mt-1">
                      <input type="hidden" name="id" value={r.id} />
                      <SubmitButton size="sm" variant="ghost" className="text-red-700 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                      </SubmitButton>
                    </ActionForm>
                  ) : null}
                </Td>
              </tr>
            );
          })}
        </TBody>
      </DataTable>
      <Pagination path="/admin/reports" searchParams={sp} page={page} pageSize={PAGE_SIZE} total={count ?? 0} />

      <SectionTitle>Recent report exports</SectionTitle>
      <DataTable>
        <THead>
          <Th>Organization</Th>
          <Th>Campaign</Th>
          <Th>Format</Th>
          <Th className="text-right">Size</Th>
          <Th>From AI report</Th>
          <Th>Generated</Th>
        </THead>
        <TBody>
          {(pdfs ?? []).length === 0 ? <EmptyRow colSpan={6}>No exports yet.</EmptyRow> : null}
          {(pdfs ?? []).map((g) => (
            <tr key={g.id}>
              <Td>
                <OrgLabel id={g.org_id} org={orgMap.get(g.org_id)} />
              </Td>
              <Td className="text-sm">{campaignMap.get(g.campaign_id) ?? "—"}</Td>
              <Td className="uppercase">{g.format}</Td>
              <Td className="text-right text-xs tabular-nums">{g.byte_size ? `${Math.round(g.byte_size / 1024).toLocaleString("en-US")} KB` : "—"}</Td>
              <Td className="text-xs text-muted">{g.ai_report_id ? "Yes" : "No"}</Td>
              <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(g.created_at)}</Td>
            </tr>
          ))}
        </TBody>
      </DataTable>
    </div>
  );
}
