import type { Metadata } from "next";
import { Check } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { loadEntitlements } from "@/lib/org/entitlements";
import { getPublicPlans } from "@/lib/content/public";
import { createClient } from "@/lib/supabase/server";
import { integrations } from "@/lib/env";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BillingPortalButton, CheckoutButton } from "@/components/app/settings-forms";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Plan & billing" };

const SOURCE_LABEL: Record<string, string> = { free: "Free", stripe: "Paid", complimentary: "Complimentary", manual: "Arranged by Rodrik Consulting" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string; plan?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const supabase = await createClient();
  const [ent, plans, { data: subs }] = await Promise.all([
    loadEntitlements(ctx.org.id),
    getPublicPlans(),
    supabase.from("subscriptions").select("*, plans(name, key)").eq("org_id", ctx.org.id).order("created_at", { ascending: false }),
  ]);
  const isOwner = ctx.role === "owner";
  const stripeReady = integrations.stripe();

  return (
    <div className="space-y-6">
      {sp.checkout === "success" ? (
        <Alert tone="success" title="Thank you — payment received">
          Your plan will update as soon as Stripe confirms the payment (usually within a few seconds). Refresh this page if it has not changed yet.
        </Alert>
      ) : null}
      {sp.checkout === "canceled" ? <Alert tone="info">Checkout was cancelled. No payment was taken.</Alert> : null}
      {ctx.org.is_pilot ? (
        <Alert tone="success" title="Complimentary pilot organization">
          Your organization is participating in a complimentary ROHA pilot arranged by Rodrik Consulting.
        </Alert>
      ) : null}

      <Card>
        <CardHeader title="Current plan" />
        <CardBody className="grid gap-6 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Plan</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-navy-900">{ent.planName ?? "None"}</p>
            {ent.source ? <p className="text-xs text-muted">{SOURCE_LABEL[ent.source]}</p> : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Assessments remaining</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-navy-900">{ent.campaignsRemaining === null ? "Unlimited" : ent.campaignsRemaining}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Responses per assessment</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-navy-900">{ent.maxResponsesPerCampaign?.toLocaleString() ?? "Unlimited"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Administrators</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-navy-900">{ent.maxAdmins ?? "Unlimited"}</p>
          </div>
          {ent.expiresAt ? <p className="text-sm text-muted md:col-span-4">Current period ends {formatDate(ent.expiresAt)}.</p> : null}
          {isOwner && ctx.org.stripe_customer_id && stripeReady ? (
            <div className="md:col-span-4">
              <BillingPortalButton orgId={ctx.org.id} />
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        {plans.map((p) => {
          const current = ent.planKey === p.key;
          const highlighted = sp.plan === p.key;
          const purchasable = p.key === "professional" || p.key === "enterprise";
          return (
            <Card key={p.key} className={cn("flex flex-col", highlighted && "ring-2 ring-emerald-500", current && "border-navy-800")}>
              <CardBody className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-navy-900">{p.name}</p>
                  {current ? <Badge tone="navy">Current</Badge> : null}
                </div>
                <p className="mt-2 font-serif text-3xl font-semibold text-navy-900">
                  {BRAND.pilot.active ? (
                    p.billingInterval === "custom" ? "Custom" : <>Free<span className="text-base font-normal text-muted"> during the pilot</span></>
                  ) : (
                    <>
                      {p.billingInterval === "custom" ? "Custom" : p.priceCents === 0 ? "Free" : formatCurrency(p.priceCents, p.currency)}
                      {p.billingInterval === "month" ? <span className="text-base font-normal text-muted">/month</span> : null}
                      {p.billingInterval === "one_time" ? <span className="text-base font-normal text-muted"> per assessment</span> : null}
                    </>
                  )}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-navy-800">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {purchasable && BRAND.pilot.active ? (
                    current ? null : (
                      <ButtonLink href={`mailto:${BRAND.pilot.contactEmail}?subject=${encodeURIComponent(`ROHA pilot access: ${ctx.org.name}`)}`} variant="outline" className="w-full">
                        Request pilot access
                      </ButtonLink>
                    )
                  ) : purchasable && isOwner ? (
                    <CheckoutButton
                      orgId={ctx.org.id}
                      planKey={p.key as "professional" | "enterprise"}
                      label={p.key === "professional" ? (current ? "Purchase another assessment" : "Purchase Professional") : current ? "Subscribed" : "Subscribe to Enterprise"}
                      disabled={p.key === "enterprise" && current}
                    />
                  ) : p.key === "strategic" ? (
                    <ButtonLink href="/contact?topic=strategic" variant="outline" className="w-full">
                      Contact Rodrik Consulting
                    </ButtonLink>
                  ) : purchasable ? (
                    <p className="text-xs text-muted">Only the organization owner can change plans.</p>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
      {BRAND.pilot.active ? (
        <Alert tone="info">
          {BRAND.pilot.banner} {BRAND.pilot.detail} Email{" "}
          <a className="font-medium underline" href={`mailto:${BRAND.pilot.contactEmail}`}>
            {BRAND.pilot.contactEmail}
          </a>
          .
        </Alert>
      ) : !stripeReady ? (
        <Alert tone="info">
          Online payments are not enabled in this environment. Free ROHA Discover assessments work without payment configuration; contact Rodrik
          Consulting to arrange a paid or pilot plan.
        </Alert>
      ) : (
        <p className="text-xs text-muted">Payments are processed securely by Stripe. ROHA never receives or stores card details.</p>
      )}

      <Card className="overflow-hidden">
        <CardHeader title="Plan history" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Ends</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(subs ?? []).map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-medium text-navy-900">{(s.plans as { name: string } | null)?.name}</td>
                  <td className="px-5 py-3 text-muted">{SOURCE_LABEL[s.source] ?? s.source}</td>
                  <td className="px-5 py-3">
                    <Badge tone={s.status === "active" ? "emerald" : "neutral"}>{s.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDate(s.started_at)}</td>
                  <td className="px-5 py-3 text-muted">{s.current_period_end ? formatDate(s.current_period_end) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
