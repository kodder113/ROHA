import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { PlanCard } from "@/components/marketing/plan-card";
import { formatLimit, planPrice } from "@/components/marketing/plan-utils";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import type { PlanFeatures } from "@/lib/billing/entitlements";
import { BRAND } from "@/lib/brand";
import { getPublicPlans, type PublicPlan } from "@/lib/content/public";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ROHA plans for every stage: ROHA Discover (free), ROHA Professional, ROHA Enterprise, and ROHA Strategic consulting engagements with Rodrik Consulting LLC.",
};

type Cell = boolean | string;

const featureRows: { label: string; value: (f: PlanFeatures) => Cell }[] = [
  { label: "AI organizational intelligence report", value: (f) => (f.ai_report === "full" ? "Full report" : "Basic summary") },
  { label: "Departmental and segment comparisons", value: (f) => f.segment_comparisons },
  { label: "Executive PDF report", value: (f) => f.pdf_export },
  { label: "Survey access codes", value: (f) => f.access_codes },
  { label: "Advanced organizational dashboards", value: (f) => f.advanced_dashboards },
  { label: "Recurring assessments", value: (f) => f.recurring_assessments },
  { label: "Historical comparisons", value: (f) => f.historical_comparisons },
  { label: "Rodrik Consulting engagement", value: (f) => f.consulting },
];

const limitRows: { label: string; value: (p: PublicPlan) => string }[] = [
  { label: "Responses per campaign", value: (p) => formatLimit(p.maxResponsesPerCampaign, p) },
  { label: "Assessment campaigns", value: (p) => formatLimit(p.maxCampaigns, p) },
  { label: "Administrators", value: (p) => formatLimit(p.maxAdmins, p) },
];

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do I need a payment card to start with ROHA Discover?",
    a: "No. ROHA Discover is free and does not require a payment card. You can register your organization, run an assessment campaign within the plan's limits, and review your results without entering any billing information.",
  },
  {
    q: "How are payments processed?",
    a: "Paid plans are processed securely by Stripe, a PCI DSS–certified payment provider. Card details are entered directly with Stripe; ROHA never receives or stores your full card number.",
  },
  {
    q: "What is the difference between Professional and Enterprise?",
    a: "ROHA Professional is a one-time purchase covering a single comprehensive assessment with full reporting. ROHA Enterprise is a monthly subscription for organizations that want to assess regularly, compare results over time, and involve more administrators.",
  },
  {
    q: "What happens if we reach our response limit?",
    a: "Each campaign's response limit is set by your plan when the campaign launches. Once the limit is reached, the survey stops accepting new submissions; responses already received are unaffected and results are calculated as usual. If you expect more participants, choose a plan with a higher limit before launching.",
  },
  {
    q: "Can we upgrade later?",
    a: "Yes. You can purchase a paid plan at any time after registering. Your existing campaigns and results remain available.",
  },
  {
    q: "Can I cancel an Enterprise subscription?",
    a: "Yes. Enterprise subscriptions can be canceled at any time and remain active until the end of the current billing period. Please review the Terms of Service for full details.",
  },
  {
    q: "What does a ROHA Strategic engagement include?",
    a: (
      <>
        ROHA Strategic combines the platform with a professional engagement led by {BRAND.company}: organizational diagnosis, executive
        interviews, strategic recommendations and a transformation roadmap. Scope and fees are agreed individually.{" "}
        <Link href="/contact?topic=strategic" className="font-medium text-navy-900 underline underline-offset-4">
          Start a conversation
        </Link>
        .
      </>
    ),
  },
  {
    q: "Are prices shown in U.S. dollars?",
    a: "Yes. Prices are listed in U.S. dollars and do not include taxes that may apply in your jurisdiction.",
  },
];

function CellValue({ value }: { value: Cell }) {
  if (typeof value === "string") return <span className="text-sm text-ink">{value}</span>;
  return value ? (
    <>
      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
      <span className="sr-only">Included</span>
    </>
  ) : (
    <>
      <Minus className="mx-auto h-5 w-5 text-navy-200" aria-hidden />
      <span className="sr-only">Not included</span>
    </>
  );
}

export default async function PricingPage() {
  const plans = await getPublicPlans();

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Organizational intelligence at every stage."
        description="Start with a free assessment, commission a single comprehensive study, build a continuous view of organizational health, or engage Rodrik Consulting directly."
      />

      <Section aria-label="Plans" className="pt-16 sm:pt-20">
        <div className="grid gap-6 pt-3 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.key} plan={plan} featured={plan.key === "professional"} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Prices in USD. Payments are processed securely by Stripe. No payment card is required for ROHA Discover.
        </p>
      </Section>

      <Section tone="canvas" aria-labelledby="compare-heading">
        <SectionHeading id="compare-heading" eyebrow="Compare plans" title="Plan comparison." />
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">Comparison of ROHA plan limits and features</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="w-[32%] px-5 py-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Plan
                </th>
                {plans.map((p) => {
                  const price = planPrice(p);
                  return (
                    <th key={p.key} scope="col" className="px-4 py-5 text-center align-bottom">
                      <span className="block font-serif text-base font-semibold text-navy-900">{p.name}</span>
                      <span className="mt-1 block text-xs font-normal text-muted">
                        {price.amount}
                        {price.suffix ? ` ${price.suffix}` : ""}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-canvas">
                <th scope="colgroup" colSpan={plans.length + 1} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Limits
                </th>
              </tr>
              {limitRows.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <th scope="row" className="px-5 py-4 text-sm font-medium text-navy-900">
                    {row.label}
                  </th>
                  {plans.map((p) => (
                    <td key={p.key} className="px-4 py-4 text-center text-sm tabular-nums text-ink">
                      {row.value(p)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line bg-canvas">
                <th scope="colgroup" colSpan={plans.length + 1} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Capabilities
                </th>
              </tr>
              {featureRows.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <th scope="row" className="px-5 py-4 text-sm font-medium text-navy-900">
                    {row.label}
                  </th>
                  {plans.map((p) => (
                    <td key={p.key} className="px-4 py-4 text-center">
                      <CellValue value={row.value(p.features)} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line">
                <th scope="row" className="px-5 py-4 text-sm font-medium text-navy-900">
                  Executive dashboard, privacy thresholds and security controls
                </th>
                {plans.map((p) => (
                  <td key={p.key} className="px-4 py-4 text-center">
                    <CellValue value />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">
          Minimum group size of five and all privacy safeguards apply on every plan. Organizational limits may be adjusted for specific agreements.
        </p>
      </Section>

      <Section aria-labelledby="faq-heading">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading
            id="faq-heading"
            eyebrow="Questions"
            title="Frequently asked questions."
            description={
              <>
                Something else on your mind?{" "}
                <Link href="/contact?topic=pricing" className="font-medium text-navy-900 underline underline-offset-4 hover:text-emerald-700">
                  Ask us about pricing
                </Link>
                .
              </>
            }
          />
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-md [&::-webkit-details-marker]:hidden">
                  <span className="font-sans text-base font-semibold text-navy-900">{f.q}</span>
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-navy-700 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="mt-3 pr-10 text-sm leading-relaxed text-muted">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
