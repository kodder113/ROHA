import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, EmptyRow, TBody, Td, Th, THead } from "@/components/admin/table";
import { loadSubscriptionMatrix } from "../_lib/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Plans & pricing" };

const unlimited = (v: number | null) => (v === null ? "∞" : v.toLocaleString("en-US"));

export default async function PlansPage() {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  const { data: plans, error } = await admin.from("plans").select("*").order("sort_order");
  if (error) throw error;
  const { activeByPlan: activeCount } = await loadSubscriptionMatrix((plans ?? []).map((p) => p.id));

  return (
    <div>
      <PageHeader
        eyebrow="Commercial"
        title="Plans & pricing"
        description="Pricing plans drive entitlements for every organization. Changes apply immediately to all subscriptions on the plan (per-subscription overrides still win)."
        actions={
          <ButtonLink href="/admin/plans/new">
            <Plus className="h-4 w-4" aria-hidden /> New plan
          </ButtonLink>
        }
        className="mb-6"
      />
      <DataTable>
        <THead>
          <Th>Plan</Th>
          <Th>Price</Th>
          <Th>Interval</Th>
          <Th>Visibility</Th>
          <Th className="text-right">Campaigns</Th>
          <Th className="text-right">Responses</Th>
          <Th className="text-right">Admins</Th>
          <Th>Stripe price</Th>
          <Th className="text-right">Active subs</Th>
        </THead>
        <TBody>
          {(plans ?? []).length === 0 ? <EmptyRow colSpan={9}>No plans configured.</EmptyRow> : null}
          {(plans ?? []).map((p) => (
            <tr key={p.id} className="hover:bg-navy-50/40">
              <Td>
                <Link href={`/admin/plans/${p.id}`} className="font-medium text-navy-900 hover:text-emerald-700 hover:underline">
                  {p.name}
                </Link>
                <p className="font-mono text-xs text-muted">
                  {p.key} · order {p.sort_order}
                </p>
              </Td>
              <Td className="whitespace-nowrap tabular-nums">{p.billing_interval === "free" ? "Free" : formatCurrency(p.price_cents, p.currency)}</Td>
              <Td className="text-xs capitalize">{p.billing_interval.replace("_", " ")}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {p.active ? <Badge tone="emerald">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                  {p.is_public ? <Badge tone="outline">Public</Badge> : <Badge tone="violet">Private</Badge>}
                </div>
              </Td>
              <Td className="text-right tabular-nums">{unlimited(p.max_campaigns)}</Td>
              <Td className="text-right tabular-nums">{unlimited(p.max_responses_per_campaign)}</Td>
              <Td className="text-right tabular-nums">{unlimited(p.max_admins)}</Td>
              <Td>
                {p.stripe_price_id ? (
                  <code className="text-xs">{p.stripe_price_id}</code>
                ) : p.billing_interval === "free" || p.billing_interval === "custom" ? (
                  <span className="text-xs text-muted">Not required</span>
                ) : (
                  <Badge tone="amber">Missing</Badge>
                )}
              </Td>
              <Td className="text-right tabular-nums">{activeCount.get(p.id) ?? 0}</Td>
            </tr>
          ))}
        </TBody>
      </DataTable>
    </div>
  );
}
