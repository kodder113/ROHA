import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { Input, Select } from "@/components/ui/form";
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
  StatusBadge,
  TBody,
  Td,
  Th,
  THead,
  type SearchParamsRecord,
} from "@/components/admin/table";
import { OrgLabel } from "@/components/admin/org-label";
import { likePattern, loadOrgMap, prettyJson } from "../_lib/queries";
import { formatDateTime } from "@/lib/utils";
import { setErrorResolved } from "./actions";

export const metadata: Metadata = { title: "Error log" };

const PAGE_SIZE = 30;

export default async function ErrorsPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const show = param(sp, "show") || "unresolved";
  const level = param(sp, "level");
  const source = param(sp, "source");
  const page = pageFrom(sp);
  const admin = createAdminClient();

  let query = admin.from("app_errors").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (show === "unresolved") query = query.eq("resolved", false);
  if (show === "resolved") query = query.eq("resolved", true);
  if (level === "warn" || level === "error" || level === "fatal") query = query.eq("level", level);
  if (source) query = query.ilike("source", likePattern(source));
  const { data: errors, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;
  const orgMap = await loadOrgMap((errors ?? []).map((e) => e.org_id));

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Error log" description="Application errors recorded by the server. Expand a row for the stack trace and context." className="mb-6" />
      <FilterBar resetHref="/admin/errors">
        <FilterField label="Show">
          <Select name="show" defaultValue={show}>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </Select>
        </FilterField>
        <FilterField label="Level">
          <Select name="level" defaultValue={level}>
            <option value="">Any level</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="fatal">Fatal</option>
          </Select>
        </FilterField>
        <FilterField label="Source contains" className="min-w-[14rem] flex-1">
          <Input name="source" defaultValue={source} placeholder="e.g. stripe.webhook" />
        </FilterField>
      </FilterBar>

      <DataTable>
        <THead>
          <Th>When</Th>
          <Th>Level</Th>
          <Th>Source</Th>
          <Th>Message</Th>
          <Th>Organization</Th>
          <Th>Status</Th>
        </THead>
        <TBody>
          {(errors ?? []).length === 0 ? <EmptyRow colSpan={6}>No errors match these filters.</EmptyRow> : null}
          {(errors ?? []).map((e) => (
            <tr key={e.id} className={e.resolved ? "opacity-70" : undefined}>
              <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(e.created_at)}</Td>
              <Td>
                <StatusBadge status={e.level} />
              </Td>
              <Td className="font-mono text-xs">{e.source}</Td>
              <Td className="min-w-[18rem] max-w-xl">
                <details>
                  <summary className="cursor-pointer text-sm text-navy-900 marker:text-muted">
                    <span className="break-words">{e.message}</span>
                  </summary>
                  <div className="mt-2 space-y-2">
                    {e.stack ? <pre className="max-h-72 overflow-auto rounded-lg bg-navy-950 p-3 text-[11px] leading-relaxed text-navy-100">{e.stack}</pre> : <p className="text-xs text-muted">No stack trace.</p>}
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Context</p>
                    <pre className="max-h-60 overflow-auto rounded-lg bg-canvas p-3 text-[11px] text-ink">{prettyJson(e.context)}</pre>
                  </div>
                </details>
              </Td>
              <Td>{e.org_id ? <OrgLabel id={e.org_id} org={orgMap.get(e.org_id)} /> : <span className="text-muted">—</span>}</Td>
              <Td className="whitespace-nowrap">
                {e.resolved ? <Badge tone="emerald">Resolved</Badge> : <Badge tone="amber">Open</Badge>}
                <ActionForm action={setErrorResolved} compact className="mt-1">
                  <input type="hidden" name="id" value={e.id} />
                  {e.resolved ? null : <input type="hidden" name="resolved" value="on" />}
                  <SubmitButton size="sm" variant="ghost">
                    {e.resolved ? "Reopen" : "Mark resolved"}
                  </SubmitButton>
                </ActionForm>
              </Td>
            </tr>
          ))}
        </TBody>
      </DataTable>
      <Pagination path="/admin/errors" searchParams={sp} page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
    </div>
  );
}
