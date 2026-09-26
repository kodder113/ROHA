import type { Metadata } from "next";
import { Mail } from "lucide-react";
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
import { likePattern } from "../_lib/queries";
import { formatDateTime } from "@/lib/utils";
import { setInquiryStatus } from "./actions";

export const metadata: Metadata = { title: "Inquiries" };

const PAGE_SIZE = 25;

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const status = param(sp, "status");
  const q = param(sp, "q");
  const page = pageFrom(sp);
  const admin = createAdminClient();

  let query = admin.from("contact_inquiries").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status === "new" || status === "responded" || status === "archived") query = query.eq("status", status);
  if (q) {
    const p = likePattern(q).replace(/[,()]/g, " ");
    query = query.or(`name.ilike.${p},email.ilike.${p},organization.ilike.${p}`);
  }
  const [{ data: inquiries, count, error }, { count: newCount }] = await Promise.all([
    query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    admin.from("contact_inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  if (error) throw error;

  return (
    <div>
      <PageHeader
        eyebrow="Commercial"
        title="Contact inquiries"
        description="Messages submitted through the public contact form."
        actions={<Badge tone="amber">{newCount ?? 0} new</Badge>}
        className="mb-6"
      />
      <FilterBar resetHref="/admin/inquiries">
        <FilterField label="Status">
          <Select name="status" defaultValue={status}>
            <option value="">Any status</option>
            <option value="new">New</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </Select>
        </FilterField>
        <FilterField label="Name, email or organization" className="min-w-[14rem] flex-1">
          <Input name="q" defaultValue={q} />
        </FilterField>
      </FilterBar>

      <DataTable>
        <THead>
          <Th>Received</Th>
          <Th>From</Th>
          <Th>Topic</Th>
          <Th>Message</Th>
          <Th>Status</Th>
        </THead>
        <TBody>
          {(inquiries ?? []).length === 0 ? <EmptyRow colSpan={5}>No inquiries match these filters.</EmptyRow> : null}
          {(inquiries ?? []).map((i) => (
            <tr key={i.id}>
              <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(i.created_at)}</Td>
              <Td className="min-w-[12rem]">
                <p className="font-medium text-navy-900">{i.name}</p>
                <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                  <Mail className="h-3 w-3" aria-hidden /> {i.email}
                </a>
                {i.organization ? <p className="text-xs text-muted">{i.organization}</p> : null}
              </Td>
              <Td className="text-xs">{i.topic ?? "—"}</Td>
              <Td className="min-w-[16rem] max-w-xl">
                <details>
                  <summary className="cursor-pointer text-sm">
                    <span className="line-clamp-2 inline">{i.message}</span>
                  </summary>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{i.message}</p>
                </details>
              </Td>
              <Td className="min-w-[11rem]">
                <StatusBadge status={i.status} />
                <ActionForm action={setInquiryStatus} compact className="mt-2 flex items-center gap-1.5">
                  <input type="hidden" name="id" value={i.id} />
                  <Select name="status" defaultValue={i.status} aria-label="Inquiry status" className="h-8 py-0 text-xs">
                    <option value="new">New</option>
                    <option value="responded">Responded</option>
                    <option value="archived">Archived</option>
                  </Select>
                  <SubmitButton size="sm" variant="outline">
                    Save
                  </SubmitButton>
                </ActionForm>
              </Td>
            </tr>
          ))}
        </TBody>
      </DataTable>
      <Pagination path="/admin/inquiries" searchParams={sp} page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
    </div>
  );
}
