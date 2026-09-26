import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadEntitlements } from "@/lib/org/entitlements";
import type { Entitlements } from "@/lib/billing/entitlements";
import type { Tables } from "@/lib/database.types";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { DataTable, EmptyRow, SectionTitle, ShortId, StatusBadge, TBody, Td, Th, THead } from "@/components/admin/table";
import { countResponses, loadUserEmails, prettyJson } from "../../_lib/queries";
import { formatDate, formatDateTime, pluralize } from "@/lib/utils";
import {
  clearPilotFlag,
  grantComplimentaryPilot,
  grantManualSubscription,
  setDataRetention,
  setOrganizationStatus,
  setSubscriptionStatus,
  updatePilotNotes,
  updateSubscriptionLimits,
} from "../actions";

export const metadata: Metadata = { title: "Organization" };

type Plan = Pick<Tables<"plans">, "id" | "key" | "name" | "active">;

const LIMITS_EXAMPLE = `{ "max_campaigns": 3, "max_responses_per_campaign": 500, "features": { "pdf_export": true, "ai_report": "full" } }`;

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const admin = createAdminClient();

  const { data: org } = await admin.from("organizations").select("*").eq("id", id).maybeSingle();
  if (!org) notFound();

  const [{ data: members }, { data: subs }, { data: plans }, { data: campaigns }, { data: aiReports }, { data: pdfs }] = await Promise.all([
    admin.from("organization_members").select("*").eq("org_id", id).order("created_at"),
    admin.from("subscriptions").select("*").eq("org_id", id).order("created_at", { ascending: false }),
    admin.from("plans").select("id, key, name, active").order("sort_order"),
    admin.from("campaigns").select("id, name, status, opens_at, closes_at, response_limit, expected_participants, subscription_id, created_at").eq("org_id", id).order("created_at", { ascending: false }).limit(50),
    admin.from("ai_reports").select("id, campaign_id, status, report_level, generator, model, created_at, error").eq("org_id", id).order("created_at", { ascending: false }).limit(20),
    admin.from("generated_reports").select("id, campaign_id, format, byte_size, created_at").eq("org_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  let entitlements: Entitlements | null = null;
  let entitlementsError: string | null = null;
  try {
    entitlements = await loadEntitlements(id);
  } catch (err) {
    entitlementsError = (err as Error).message ?? "Could not resolve entitlements.";
  }

  const [emails, responseCounts] = await Promise.all([
    loadUserEmails((members ?? []).map((m) => m.user_id)),
    Promise.all((campaigns ?? []).map(async (c) => [c.id, await countResponses(c.id)] as const)).then((e) => new Map(e)),
  ]);
  const planById = new Map((plans ?? []).map((p) => [p.id, p]));
  const campaignName = new Map((campaigns ?? []).map((c) => [c.id, c.name]));

  return (
    <div>
      <Link href="/admin/organizations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All organizations
      </Link>
      <PageHeader
        eyebrow="Organization"
        title={org.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={org.status} />
            {org.is_demo ? <Badge tone="violet">Demonstration (synthetic data)</Badge> : null}
            {org.is_pilot ? <Badge tone="amber">Complimentary pilot</Badge> : null}
            <span className="font-mono text-xs">{org.slug}</span>
            <span className="text-xs">· Created {formatDate(org.created_at)}</span>
          </span>
        }
      />

      <Alert tone="privacy" className="mt-6" title="Respondent privacy">
        Platform administrators see counts and aggregates only. Individual survey responses and comments are never displayed here.
      </Alert>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <CardBody>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Detail label="Industry" value={org.industry} />
              <Detail label="Employees" value={org.employee_count_range} />
              <Detail label="Country / region" value={[org.country, org.region].filter(Boolean).join(" · ") || null} />
              <Detail label="Website" value={org.website} />
              <Detail label="Primary contact" value={[org.contact_name, org.contact_title].filter(Boolean).join(", ") || null} />
              <Detail label="Contact email" value={org.contact_email} />
              <Detail label="Contact phone" value={org.contact_phone} />
              <Detail label="Stripe customer" value={org.stripe_customer_id} mono />
              <Detail label="Data retention" value={`${org.data_retention_months} months`} />
              <Detail label="Organization ID" value={org.id} mono />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Access & data retention" />
          <CardBody className="space-y-6">
            <ActionForm
              action={setOrganizationStatus}
              confirm={org.status === "active" ? `Suspend ${org.name}? Members will lose access immediately.` : `Reactivate ${org.name}?`}
              className="space-y-3"
            >
              <input type="hidden" name="orgId" value={org.id} />
              <input type="hidden" name="status" value={org.status === "active" ? "suspended" : "active"} />
              <Field label="Reason (recorded in the audit trail)" htmlFor="reason">
                <Input id="reason" name="reason" maxLength={500} placeholder={org.status === "active" ? "e.g. Non-payment, contract ended" : "e.g. Payment received"} />
              </Field>
              <SubmitButton variant={org.status === "active" ? "danger" : "primary"}>
                {org.status === "active" ? "Suspend organization access" : "Reactivate organization access"}
              </SubmitButton>
            </ActionForm>

            <ActionForm action={setDataRetention} className="space-y-3 border-t border-line pt-5">
              <input type="hidden" name="orgId" value={org.id} />
              <Field label="Data retention (months)" htmlFor="months" required hint="Between 6 and 120 months. Governs how long campaign data is kept.">
                <Input id="months" name="months" type="number" min={6} max={120} required defaultValue={org.data_retention_months} className="max-w-[10rem]" />
              </Field>
              <SubmitButton variant="outline">Save retention</SubmitButton>
            </ActionForm>
          </CardBody>
        </Card>
      </div>

      <SectionTitle>Entitlements</SectionTitle>
      {entitlementsError ? (
        <Alert tone="error">Entitlements could not be resolved: {entitlementsError}</Alert>
      ) : entitlements ? (
        <EntitlementsSummary ent={entitlements} />
      ) : null}

      <SectionTitle>Subscriptions</SectionTitle>
      <DataTable>
        <THead>
          <Th>Plan</Th>
          <Th>Status</Th>
          <Th>Source</Th>
          <Th>Started</Th>
          <Th>Period end</Th>
          <Th>Credits</Th>
          <Th>Overrides</Th>
          <Th>Actions</Th>
        </THead>
        <TBody>
          {(subs ?? []).length === 0 ? <EmptyRow colSpan={8}>No subscriptions.</EmptyRow> : null}
          {(subs ?? []).map((s) => {
            const overrides = s.limit_overrides && typeof s.limit_overrides === "object" && Object.keys(s.limit_overrides).length > 0;
            const live = s.status === "active" || s.status === "trialing" || s.status === "past_due" || s.status === "incomplete";
            return (
              <tr key={s.id}>
                <Td>
                  <p className="font-medium text-navy-900">{planById.get(s.plan_id)?.name ?? "Unknown plan"}</p>
                  <ShortId id={s.id} />
                  {s.notes ? <p className="mt-1 max-w-xs text-xs text-muted">{s.notes}</p> : null}
                </Td>
                <Td>
                  <StatusBadge status={s.status} />
                </Td>
                <Td>
                  <Badge tone={s.source === "complimentary" ? "amber" : s.source === "stripe" ? "violet" : "outline"}>{s.source}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-xs">{formatDate(s.started_at)}</Td>
                <Td className="whitespace-nowrap text-xs">{s.current_period_end ? formatDate(s.current_period_end) : "No end"}</Td>
                <Td className="text-xs tabular-nums">{s.campaign_credits ?? "—"}</Td>
                <Td className="max-w-[14rem]">
                  {overrides ? <code className="block truncate text-xs" title={prettyJson(s.limit_overrides)}>{JSON.stringify(s.limit_overrides)}</code> : <span className="text-xs text-muted">None</span>}
                </Td>
                <Td className="min-w-[16rem]">
                  <div className="flex flex-wrap gap-2">
                    {live ? (
                      <>
                        <ActionForm action={setSubscriptionStatus} compact confirm="Cancel this subscription? The organization loses the entitlements it grants.">
                          <input type="hidden" name="subscriptionId" value={s.id} />
                          <input type="hidden" name="status" value="canceled" />
                          <SubmitButton size="sm" variant="outline">Cancel</SubmitButton>
                        </ActionForm>
                        <ActionForm action={setSubscriptionStatus} compact confirm="Expire this subscription now?">
                          <input type="hidden" name="subscriptionId" value={s.id} />
                          <input type="hidden" name="status" value="expired" />
                          <SubmitButton size="sm" variant="ghost">Expire</SubmitButton>
                        </ActionForm>
                      </>
                    ) : null}
                  </div>
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer text-xs font-medium text-emerald-700">Edit limits & period</summary>
                    <ActionForm action={updateSubscriptionLimits} className="mt-2 space-y-2">
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <Field label="Limit overrides (JSON)" htmlFor={`lo-${s.id}`}>
                        <Textarea id={`lo-${s.id}`} name="limitOverrides" rows={4} className="font-mono text-xs" defaultValue={overrides ? prettyJson(s.limit_overrides) : ""} placeholder={LIMITS_EXAMPLE} />
                      </Field>
                      <Field label="Period end" htmlFor={`pe-${s.id}`} hint="Blank = no end date.">
                        <Input id={`pe-${s.id}`} name="currentPeriodEnd" type="date" defaultValue={s.current_period_end?.slice(0, 10) ?? ""} />
                      </Field>
                      <Field label="Notes" htmlFor={`nt-${s.id}`}>
                        <Input id={`nt-${s.id}`} name="notes" defaultValue={s.notes ?? ""} maxLength={2000} />
                      </Field>
                      <SubmitButton size="sm" variant="secondary">Save</SubmitButton>
                    </ActionForm>
                  </details>
                </Td>
              </tr>
            );
          })}
        </TBody>
      </DataTable>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Complimentary pilot"
            description="Flags the organization as a pilot and grants a complimentary subscription on the chosen plan."
          />
          <CardBody className="space-y-6">
            <ActionForm action={grantComplimentaryPilot} resetOnSuccess className="space-y-3">
              <input type="hidden" name="orgId" value={org.id} />
              <GrantFields prefix="pilot" plans={plans ?? []} />
              <Field label="Pilot notes" htmlFor="pilot-notes">
                <Textarea id="pilot-notes" name="pilotNotes" rows={2} defaultValue={org.pilot_notes ?? ""} maxLength={2000} />
              </Field>
              <SubmitButton>Grant complimentary pilot</SubmitButton>
            </ActionForm>
            {org.is_pilot ? (
              <div className="space-y-4 border-t border-line pt-5">
                <ActionForm action={updatePilotNotes} className="space-y-3">
                  <input type="hidden" name="orgId" value={org.id} />
                  <input type="hidden" name="isPilot" value="on" />
                  <Field label="Update pilot notes" htmlFor="pilot-notes-edit">
                    <Textarea id="pilot-notes-edit" name="pilotNotes" rows={2} defaultValue={org.pilot_notes ?? ""} maxLength={2000} />
                  </Field>
                  <SubmitButton variant="outline" size="sm">Save notes</SubmitButton>
                </ActionForm>
                <ActionForm action={clearPilotFlag} confirm="Remove the pilot flag? Complimentary subscriptions are not canceled automatically.">
                  <input type="hidden" name="orgId" value={org.id} />
                  <SubmitButton variant="ghost" size="sm">Remove pilot flag</SubmitButton>
                </ActionForm>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Grant manual subscription" description="For invoiced or negotiated agreements handled outside Stripe." />
          <CardBody>
            <ActionForm action={grantManualSubscription} resetOnSuccess className="space-y-3">
              <input type="hidden" name="orgId" value={org.id} />
              <GrantFields prefix="manual" plans={plans ?? []} withCredits />
              <Field label="Notes" htmlFor="manual-notes">
                <Input id="manual-notes" name="notes" maxLength={2000} placeholder="e.g. Invoice #1042, signed 2026-09-01" />
              </Field>
              <SubmitButton variant="secondary">Grant subscription</SubmitButton>
            </ActionForm>
          </CardBody>
        </Card>
      </div>

      <SectionTitle>Members</SectionTitle>
      <DataTable>
        <THead>
          <Th>Email</Th>
          <Th>Role</Th>
          <Th>Status</Th>
          <Th>Joined</Th>
        </THead>
        <TBody>
          {(members ?? []).length === 0 ? <EmptyRow colSpan={4}>No members.</EmptyRow> : null}
          {(members ?? []).map((m) => (
            <tr key={m.user_id}>
              <Td>
                {emails.get(m.user_id) ?? m.invited_email ?? <span className="text-muted">Email unavailable</span>}
                <div>
                  <ShortId id={m.user_id} />
                </div>
              </Td>
              <Td className="capitalize">{m.role_key}</Td>
              <Td>
                <StatusBadge status={m.status} />
              </Td>
              <Td className="whitespace-nowrap text-xs text-muted">{formatDate(m.created_at)}</Td>
            </tr>
          ))}
        </TBody>
      </DataTable>

      <SectionTitle action={<Link href={`/admin/campaigns?org=${org.id}`} className="text-sm font-medium text-emerald-700 hover:underline">View in campaigns</Link>}>
        Campaigns
      </SectionTitle>
      <DataTable>
        <THead>
          <Th>Campaign</Th>
          <Th>Status</Th>
          <Th>Window</Th>
          <Th className="text-right">Responses</Th>
          <Th className="text-right">Expected</Th>
          <Th className="text-right">Limit</Th>
        </THead>
        <TBody>
          {(campaigns ?? []).length === 0 ? <EmptyRow colSpan={6}>No campaigns yet.</EmptyRow> : null}
          {(campaigns ?? []).map((c) => {
            const n = responseCounts.get(c.id);
            const rate = n !== null && n !== undefined && c.expected_participants ? Math.round((n / c.expected_participants) * 100) : null;
            return (
              <tr key={c.id}>
                <Td className="font-medium text-navy-900">{c.name}</Td>
                <Td>
                  <StatusBadge status={c.status} />
                </Td>
                <Td className="whitespace-nowrap text-xs text-muted">
                  {formatDate(c.opens_at)} – {formatDate(c.closes_at)}
                </Td>
                <Td className="text-right tabular-nums">
                  {n ?? "—"}
                  {rate !== null ? <span className="ml-1 text-xs text-muted">({rate}%)</span> : null}
                </Td>
                <Td className="text-right tabular-nums text-muted">{c.expected_participants ?? "—"}</Td>
                <Td className="text-right tabular-nums text-muted">{c.response_limit ?? "None"}</Td>
              </tr>
            );
          })}
        </TBody>
      </DataTable>

      <SectionTitle>Reports</SectionTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <DataTable>
          <THead>
            <Th>AI report</Th>
            <Th>Status</Th>
            <Th>Level</Th>
            <Th>Created</Th>
          </THead>
          <TBody>
            {(aiReports ?? []).length === 0 ? <EmptyRow colSpan={4}>No AI reports.</EmptyRow> : null}
            {(aiReports ?? []).map((r) => (
              <tr key={r.id}>
                <Td>
                  <p className="text-sm">{campaignName.get(r.campaign_id) ?? "Campaign"}</p>
                  <p className="text-xs text-muted">
                    {r.generator}
                    {r.model ? ` · ${r.model}` : ""}
                  </p>
                  {r.error ? <p className="mt-1 text-xs text-red-600">{r.error}</p> : null}
                </Td>
                <Td>
                  <StatusBadge status={r.status} />
                </Td>
                <Td className="capitalize">{r.report_level}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(r.created_at)}</Td>
              </tr>
            ))}
          </TBody>
        </DataTable>
        <DataTable>
          <THead>
            <Th>Export</Th>
            <Th>Format</Th>
            <Th>Size</Th>
            <Th>Generated</Th>
          </THead>
          <TBody>
            {(pdfs ?? []).length === 0 ? <EmptyRow colSpan={4}>No exports.</EmptyRow> : null}
            {(pdfs ?? []).map((g) => (
              <tr key={g.id}>
                <Td>{campaignName.get(g.campaign_id) ?? "Campaign"}</Td>
                <Td className="uppercase">{g.format}</Td>
                <Td className="text-xs tabular-nums">{g.byte_size ? `${Math.round(g.byte_size / 1024)} KB` : "—"}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(g.created_at)}</Td>
              </tr>
            ))}
          </TBody>
        </DataTable>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className={mono ? "mt-0.5 break-all font-mono text-xs text-navy-900" : "mt-0.5 break-words text-navy-900"}>{value || "—"}</dd>
    </div>
  );
}

function GrantFields({ prefix, plans, withCredits = false }: { prefix: string; plans: Plan[]; withCredits?: boolean }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Plan" htmlFor={`${prefix}-plan`} required>
          <Select id={`${prefix}-plan`} name="planId" required defaultValue="">
            <option value="" disabled>
              Select a plan…
            </option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.active ? "" : " (inactive)"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor={`${prefix}-status`} required>
          <Select id={`${prefix}-status`} name="status" defaultValue="active">
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
          </Select>
        </Field>
        <Field label="Period end" htmlFor={`${prefix}-end`} hint="Blank = no end date.">
          <Input id={`${prefix}-end`} name="currentPeriodEnd" type="date" />
        </Field>
        {withCredits ? (
          <Field label="Campaign credits" htmlFor={`${prefix}-credits`} hint="One-time plans: purchases granted.">
            <Input id={`${prefix}-credits`} name="campaignCredits" type="number" min={0} />
          </Field>
        ) : null}
      </div>
      <Field label="Limit overrides (JSON)" htmlFor={`${prefix}-limits`} hint="Keys: max_campaigns, max_responses_per_campaign, max_admins (null = unlimited), features.">
        <Textarea id={`${prefix}-limits`} name="limitOverrides" rows={3} className="font-mono text-xs" placeholder={LIMITS_EXAMPLE} />
      </Field>
    </>
  );
}

function EntitlementsSummary({ ent }: { ent: Entitlements }) {
  const features = Object.entries(ent.features);
  return (
    <Card>
      <CardBody className="space-y-4">
        {!ent.hasActiveSubscription ? (
          <Alert tone="warning">No active subscription — the organization cannot launch new campaigns.</Alert>
        ) : null}
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
          <Stat label="Primary plan" value={ent.planName ?? "None"} />
          <Stat label="Source" value={ent.source ?? "—"} />
          <Stat label="Campaigns remaining" value={ent.campaignsRemaining === null ? "Unlimited" : String(ent.campaignsRemaining)} />
          <Stat label="Responses / campaign" value={ent.maxResponsesPerCampaign === null ? "Unlimited" : ent.maxResponsesPerCampaign.toLocaleString("en-US")} />
          <Stat label="Admin seats" value={ent.maxAdmins === null ? "Unlimited" : String(ent.maxAdmins)} />
        </dl>
        <div className="flex flex-wrap gap-2">
          {features.map(([k, v]) => (
            <Badge key={k} tone={v === false ? "outline" : "emerald"} className={v === false ? "text-muted line-through" : undefined}>
              {k.replace(/_/g, " ")}
              {typeof v === "string" ? `: ${v}` : ""}
            </Badge>
          ))}
        </div>
        {ent.capacities.length > 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {pluralize(ent.capacities.length, "active subscription")} ·{" "}
            {ent.capacities.map((c) => `${c.planKey}: ${c.campaignsUsed} used${c.campaignsRemaining === null ? "" : `, ${c.campaignsRemaining} left`}`).join(" · ")}
            {ent.expiresAt ? ` · primary expires ${formatDate(ent.expiresAt)}` : ""}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1 font-semibold capitalize text-navy-900">{value}</dd>
    </div>
  );
}
