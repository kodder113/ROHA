import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { integrations } from "@/lib/env";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import {
  DataTable,
  EmptyRow,
  FilterBar,
  FilterField,
  pageFrom,
  Pagination,
  param,
  SectionTitle,
  TBody,
  Td,
  Th,
  THead,
  type SearchParamsRecord,
} from "@/components/admin/table";
import { OrgLabel } from "@/components/admin/org-label";
import { likePattern, loadOrgMap, loadSubscriptionMatrix, SUBSCRIPTION_SOURCES, SUBSCRIPTION_STATUSES } from "../_lib/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

const PAGE_SIZE = 30;

export default async function BillingPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const type = param(sp, "type");
  const errorsOnly = param(sp, "errors") === "1";
  const page = pageFrom(sp);
  const admin = createAdminClient();

  let query = admin.from("billing_events").select("id, type, org_id, processed_at, error", { count: "exact" }).order("processed_at", { ascending: false });
  if (type) query = query.ilike("type", likePattern(type));
  if (errorsOnly) query = query.not("error", "is", null);

  const [{ data: events, count, error }, { data: plans }] = await Promise.all([
    query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    admin.from("plans").select("id, key, name, billing_interval, stripe_price_id, active, is_public").order("sort_order"),
  ]);
  if (error) throw error;
  const orgMap = await loadOrgMap((events ?? []).map((e) => e.org_id));

  const matrix = await loadSubscriptionMatrix((plans ?? []).map((p) => p.id));

  const checks = [
    { label: "Stripe secret key", ok: integrations.stripe(), hint: "STRIPE_SECRET_KEY — enables checkout" },
    { label: "Stripe webhooks", ok: integrations.stripeWebhooks(), hint: "STRIPE_WEBHOOK_SECRET — activates purchases automatically" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Commercial" title="Billing" description="Stripe configuration, subscription mix and the webhook event log." className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader title="Stripe configuration" description="Secret values are never displayed." />
          <CardBody className="space-y-4">
            <ul className="space-y-3">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden /> : <XCircle className="mt-0.5 h-4 w-4 text-red-600" aria-hidden />}
                  <span>
                    <span className="font-medium text-navy-900">{c.label}</span> — {c.ok ? "configured" : "not configured"}
                    <span className="block text-xs text-muted">{c.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Plan price mapping</p>
              <ul className="space-y-1.5 text-sm">
                {(plans ?? []).map((p) => {
                  const needs = p.billing_interval === "one_time" || p.billing_interval === "month";
                  return (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/admin/plans/${p.id}`} className="text-navy-900 hover:text-emerald-700 hover:underline">
                        {p.name}
                        {!p.active ? <span className="ml-1 text-xs text-muted">(inactive)</span> : null}
                      </Link>
                      {p.stripe_price_id ? (
                        <code className="text-xs text-emerald-800">{p.stripe_price_id}</code>
                      ) : needs ? (
                        <Badge tone="amber">No Stripe price</Badge>
                      ) : (
                        <span className="text-xs text-muted">Not sold via Stripe</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Subscriptions by plan and status"
            description={`Active by source: ${SUBSCRIPTION_SOURCES.map((s) => `${s} ${matrix.bySource[s] ?? 0}`).join(" · ")}`}
          />
          <CardBody className="overflow-x-auto p-0">
            <table className="min-w-full text-sm">
              <thead className="bg-navy-50/70">
                <tr>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Plan</th>
                  {SUBSCRIPTION_STATUSES.map((s) => (
                    <th key={s} className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                      {s.replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(plans ?? []).map((p) => {
                  const row = matrix.byPlan.get(p.id) ?? {};
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-medium text-navy-900">{p.name}</td>
                      {SUBSCRIPTION_STATUSES.map((s) => (
                        <td key={s} className={`px-3 py-2 text-right tabular-nums ${row[s] ? "text-navy-900" : "text-navy-200"}`}>
                          {row[s] ?? 0}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      <SectionTitle>Stripe webhook events</SectionTitle>
      <FilterBar resetHref="/admin/billing">
        <FilterField label="Event type contains" className="min-w-[14rem] flex-1">
          <Input name="type" defaultValue={type} placeholder="e.g. checkout.session" />
        </FilterField>
        <FilterField label="Show">
          <Select name="errors" defaultValue={errorsOnly ? "1" : ""}>
            <option value="">All events</option>
            <option value="1">Errors only</option>
          </Select>
        </FilterField>
      </FilterBar>
      <DataTable>
        <THead>
          <Th>Event ID</Th>
          <Th>Type</Th>
          <Th>Organization</Th>
          <Th>Processed</Th>
          <Th>Result</Th>
        </THead>
        <TBody>
          {(events ?? []).length === 0 ? <EmptyRow colSpan={5}>No billing events recorded.</EmptyRow> : null}
          {(events ?? []).map((e) => (
            <tr key={e.id}>
              <Td className="font-mono text-xs">{e.id}</Td>
              <Td className="font-mono text-xs">{e.type}</Td>
              <Td>{e.org_id ? <OrgLabel id={e.org_id} org={orgMap.get(e.org_id)} /> : <span className="text-muted">—</span>}</Td>
              <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(e.processed_at)}</Td>
              <Td className="max-w-sm">{e.error ? <p className="text-xs text-red-700">{e.error}</p> : <Badge tone="emerald">OK</Badge>}</Td>
            </tr>
          ))}
        </TBody>
      </DataTable>
      <Pagination path="/admin/billing" searchParams={sp} page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
    </div>
  );
}
