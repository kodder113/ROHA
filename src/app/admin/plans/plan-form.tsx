import type { Tables } from "@/lib/database.types";
import { planFeaturesSchema } from "@/lib/billing/entitlements";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { createPlan, updatePlan } from "./actions";

const FEATURE_LABELS: Record<string, { label: string; hint: string }> = {
  segment_comparisons: { label: "Segment comparisons", hint: "Department / location / level breakdowns" },
  ai_report: { label: "AI executive report", hint: "Basic summary or full intelligence report" },
  pdf_export: { label: "PDF export", hint: "Download executive PDF reports" },
  historical_comparisons: { label: "Historical comparisons", hint: "Trend across campaigns" },
  recurring_assessments: { label: "Recurring assessments", hint: "Scheduled repeat campaigns" },
  advanced_dashboards: { label: "Advanced dashboards", hint: "Heatmaps and gap analysis" },
  access_codes: { label: "Access codes", hint: "Restrict surveys with access codes" },
  consulting: { label: "Consulting", hint: "Rodrik Consulting advisory sessions" },
};

export function PlanForm({ plan }: { plan: Tables<"plans"> | null }) {
  const features = planFeaturesSchema.safeParse(plan?.features ?? {});
  const f = features.success ? features.data : planFeaturesSchema.parse({});
  const keys = Object.keys(planFeaturesSchema.shape);
  const numberValue = (v: number | null | undefined) => (v === null || v === undefined ? "" : v);

  return (
    <ActionForm action={plan ? updatePlan : createPlan} className="space-y-6">
      {plan ? <input type="hidden" name="planId" value={plan.id} /> : null}

      <Card>
        <CardHeader title="Identity & pricing" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          {plan ? (
            <Field label="Key (immutable)" htmlFor="key">
              <Input id="key" value={plan.key} readOnly disabled className="font-mono" />
            </Field>
          ) : (
            <Field label="Key" htmlFor="key" required hint="Permanent identifier, e.g. growth_annual. Cannot be changed later.">
              <Input id="key" name="key" required pattern="[a-z][a-z0-9_]*" maxLength={60} className="font-mono" />
            </Field>
          )}
          <Field label="Name" htmlFor="name" required>
            <Input id="name" name="name" required minLength={2} maxLength={120} defaultValue={plan?.name ?? ""} />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <Input id="tagline" name="tagline" maxLength={200} defaultValue={plan?.tagline ?? ""} />
          </Field>
          {plan ? (
            <Field label="Billing interval" htmlFor="billing_interval" hint="Fixed after creation.">
              <Input id="billing_interval" value={`${plan.billing_interval} · ${plan.currency.toUpperCase()}`} readOnly disabled />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Billing interval" htmlFor="billing_interval" required>
                <Select id="billing_interval" name="billing_interval" defaultValue="one_time">
                  <option value="free">Free</option>
                  <option value="one_time">One-time</option>
                  <option value="month">Monthly</option>
                  <option value="custom">Custom / quoted</option>
                </Select>
              </Field>
              <Field label="Currency" htmlFor="currency" required>
                <Input id="currency" name="currency" defaultValue="usd" maxLength={3} className="uppercase" />
              </Field>
            </div>
          )}
          <Field label="Description" htmlFor="description" className="md:col-span-2">
            <Textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={plan?.description ?? ""} />
          </Field>
          <Field label="Price (cents)" htmlFor="price_cents" hint="e.g. 150000 = $1,500. Blank = custom pricing.">
            <Input id="price_cents" name="price_cents" type="number" min={0} defaultValue={numberValue(plan?.price_cents)} />
          </Field>
          <Field label="Stripe price ID" htmlFor="stripe_price_id" hint="Required for self-serve checkout.">
            <Input id="stripe_price_id" name="stripe_price_id" placeholder="price_…" className="font-mono" defaultValue={plan?.stripe_price_id ?? ""} />
          </Field>
          <Field label="Sort order" htmlFor="sort_order" required hint="Higher-ranked plans take precedence for features.">
            <Input id="sort_order" name="sort_order" type="number" min={0} max={1000} required defaultValue={plan?.sort_order ?? 0} />
          </Field>
          <div className="flex flex-wrap items-center gap-6 pt-6">
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox name="is_public" defaultChecked={plan?.is_public ?? true} /> Shown on public pricing
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox name="active" defaultChecked={plan?.active ?? true} /> Active (available for purchase / grants)
            </Label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Limits" description="Leave blank for unlimited." />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Max campaigns" htmlFor="max_campaigns" hint="Per purchase for one-time plans.">
            <Input id="max_campaigns" name="max_campaigns" type="number" min={0} defaultValue={numberValue(plan?.max_campaigns)} />
          </Field>
          <Field label="Max responses / campaign" htmlFor="max_responses_per_campaign">
            <Input id="max_responses_per_campaign" name="max_responses_per_campaign" type="number" min={1} defaultValue={numberValue(plan?.max_responses_per_campaign)} />
          </Field>
          <Field label="Max administrators" htmlFor="max_admins">
            <Input id="max_admins" name="max_admins" type="number" min={1} defaultValue={numberValue(plan?.max_admins)} />
          </Field>
          <Field label="Access months" htmlFor="access_months">
            <Input id="access_months" name="access_months" type="number" min={1} defaultValue={numberValue(plan?.access_months)} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Features" />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          {keys.map((k) => {
            const meta = FEATURE_LABELS[k] ?? { label: k, hint: "" };
            if (k === "ai_report") {
              return (
                <Field key={k} label={meta.label} htmlFor="feature_ai_report" hint={meta.hint} required>
                  <Select id="feature_ai_report" name="feature_ai_report" defaultValue={f.ai_report}>
                    <option value="basic">Basic</option>
                    <option value="full">Full</option>
                  </Select>
                </Field>
              );
            }
            return (
              <label key={k} className="flex items-start gap-3 rounded-lg border border-line p-3 hover:bg-navy-50/50">
                <Checkbox name={`feature_${k}`} defaultChecked={Boolean(f[k as keyof typeof f])} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium text-navy-900">{meta.label}</span>
                  <span className="block text-xs text-muted">{meta.hint}</span>
                </span>
              </label>
            );
          })}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Marketing bullets" description="One bullet per line, shown on the pricing page." />
        <CardBody>
          <Textarea name="marketing_bullets" rows={6} defaultValue={(plan?.marketing_bullets ?? []).join("\n")} aria-label="Marketing bullets" />
        </CardBody>
      </Card>

      <SubmitButton size="lg">{plan ? "Save plan" : "Create plan"}</SubmitButton>
    </ActionForm>
  );
}
