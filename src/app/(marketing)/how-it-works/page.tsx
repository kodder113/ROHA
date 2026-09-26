import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  CalendarRange,
  FileText,
  LayoutDashboard,
  Link2,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { CtaBand } from "@/components/marketing/cta-band";
import { INTERPRETATION_BANDS } from "@/components/marketing/nav";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "How ROHA Works",
  description:
    "From registration to executive intelligence: how ROHA collects confidential employee perspectives, calculates organizational health scores, and releases results with privacy thresholds.",
};

const steps = [
  {
    Icon: Building2,
    title: "Register your organization",
    body: "Create an organization account in a few minutes. The person who registers becomes the organization owner and can invite additional administrators as the plan allows.",
  },
  {
    Icon: CalendarRange,
    title: "Configure the campaign",
    body: "Name the assessment, set opening and closing dates, and define the departments and locations that are meaningful for your organization. Choose whether the campaign is confidential or anonymous.",
  },
  {
    Icon: Link2,
    title: "Share one survey link",
    body: "ROHA generates a single anonymous link for the campaign. Distribute it however you normally communicate—email, Slack, Microsoft Teams, or your intranet. Employees do not create accounts or sign in.",
  },
  {
    Icon: ListChecks,
    title: "Employees share their perspective",
    body: "Each participant rates every assessment statement twice—once for the current state and once for the desired state—and may answer three optional open-ended questions.",
  },
  {
    Icon: LockKeyhole,
    title: "Results are released at close",
    body: "Results become available when the campaign closes. Privacy thresholds are applied automatically: any group with fewer than five respondents is suppressed, overall and in every filter.",
  },
  {
    Icon: LayoutDashboard,
    title: "Executive intelligence",
    body: "Leaders review the executive dashboard, the AI organizational intelligence report, and an executive PDF suitable for board and leadership-team discussions.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How ROHA Works"
        title="A disciplined path from employee perspective to executive decision."
        description="ROHA is designed to be simple for employees, consistent in how it calculates results, and transparent about how data is protected. Here is exactly what happens, step by step."
      />

      <Section aria-labelledby="steps-heading">
        <SectionHeading id="steps-heading" eyebrow="The process" title="Six steps. One clear picture." />
        <ol className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative rounded-xl border border-line bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-emerald-400">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-serif text-3xl font-semibold text-navy-100" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy-900">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="canvas" aria-labelledby="scoring-heading">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              id="scoring-heading"
              eyebrow="How scores are calculated"
              title="Transparent arithmetic, applied consistently."
              description="ROHA converts every rating to a common 0–100 index so that statements, dimensions and groups can be compared on the same scale. Scoring is deterministic and versioned: the same responses always produce the same results."
            />
            <div className="mt-10 space-y-5 text-sm leading-relaxed text-muted">
              <p>
                <strong className="text-navy-900">Not Applicable is excluded.</strong> When a participant marks a statement as not applicable, that
                rating is left out of the calculation entirely rather than being treated as a low or neutral score.
              </p>
              <p>
                <strong className="text-navy-900">Dimensions aggregate statements.</strong> A dimension index combines the indices of its
                statements; the overall organizational health index combines the dimensions.
              </p>
              <p>
                <strong className="text-navy-900">Interpretation bands are descriptive.</strong> ROHA labels index ranges to help readers orient
                themselves. They are interpretive aids, not validated cut-offs.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">The index</p>
              <p className="mt-3 font-mono text-lg text-navy-900">index = ((rating − 1) ÷ 4) × 100</p>
              <div className="mt-5 grid grid-cols-5 gap-2 text-center">
                {[
                  [1, 0],
                  [2, 25],
                  [3, 50],
                  [4, 75],
                  [5, 100],
                ].map(([rating, index]) => (
                  <div key={rating} className="rounded-lg border border-line bg-canvas px-1 py-3">
                    <p className="text-xs text-muted">Rating {rating}</p>
                    <p className="mt-1 font-serif text-xl font-semibold tabular-nums text-navy-900">{index}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">The gap</p>
              <p className="mt-3 font-mono text-lg text-navy-900">gap = desired − current</p>
              <dl className="mt-5 space-y-4 text-sm leading-relaxed">
                <div>
                  <dt className="font-semibold text-navy-900">Positive gap</dt>
                  <dd className="mt-1 text-muted">
                    Employees want more of this than they experience today. The larger the gap, the greater the distance between aspiration and
                    reality—often a useful place to begin a leadership conversation.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-900">Negative gap</dt>
                  <dd className="mt-1 text-muted">
                    Employees rate the current state above what they consider necessary. This is not automatically a problem—it may indicate an
                    area of strength, or an emphasis that could be rebalanced. Context matters.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Descriptive interpretation bands</p>
              <ul className="mt-4 space-y-2.5">
                {INTERPRETATION_BANDS.map((b) => (
                  <li key={b.label} className="flex items-center gap-3 text-sm">
                    <span className={`h-2.5 w-8 rounded-full ${b.tone}`} aria-hidden />
                    <span className="w-16 font-mono tabular-nums text-navy-900">{b.range}</span>
                    <span className="text-muted">{b.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="confidentiality-heading" id="confidentiality" className="scroll-mt-20">
        <SectionHeading
          id="confidentiality-heading"
          eyebrow="Confidentiality and anonymity"
          title="What we protect, and precisely how."
          description="Trust depends on accuracy, so we are careful with these words. Here is an honest account of what ROHA collects, what it does not, and who could technically access what."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Confidential campaigns</p>
            <h3 className="mt-3 text-2xl font-semibold text-navy-900">Group comparisons, protected by thresholds.</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Participants may optionally indicate demographic information such as department, location, level and tenure. This enables
              comparisons between groups, but only where each group has at least five respondents. Smaller groups are suppressed and cannot be
              revealed through filters or by subtraction from other totals.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Anonymous campaigns</p>
            <h3 className="mt-3 text-2xl font-semibold text-navy-900">No demographic questions at all.</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              When the strongest possible protection matters more than segment analysis, an anonymous campaign collects no demographic
              information. Results are reported for the organization as a whole, still subject to the minimum group size.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-line bg-canvas p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-navy-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
              In every campaign
            </h3>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-ink">
              {[
                "ROHA does not collect participant names, email addresses or employee IDs.",
                "ROHA does not store IP addresses or submission times with survey responses.",
                "Administrators never see individual responses—only aggregated results for groups of five or more.",
                "Written comments are screened for names and other identifiers before they are analyzed or displayed.",
                "Comments are quoted verbatim only when the respondent has given permission; otherwise they inform themes without being quoted.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Alert tone="info" title="An honest note on platform access" className="h-fit">
            <p>
              {BRAND.company} operates the ROHA platform. As with any hosted software, its authorized database administrators could technically
              access raw response records. That access is restricted to operating and supporting the service, governed by strict internal
              controls, and never used to identify respondents or to share individual responses with your organization.
            </p>
            <p className="mt-2">
              Because ROHA never collects names, emails or employee IDs, raw records are not linked to any named individual.
            </p>
          </Alert>
        </div>
        <p className="mt-8 text-sm text-muted">
          For full details, see our{" "}
          <Link href="/privacy" className="font-medium text-navy-900 underline underline-offset-4 hover:text-emerald-700">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section tone="canvas" aria-labelledby="outputs-heading">
        <SectionHeading
          id="outputs-heading"
          eyebrow="What leaders receive"
          title="Three complementary views of the same evidence."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              Icon: LayoutDashboard,
              title: "Executive dashboard",
              body: "Eight purpose-built visualizations, from the current-versus-desired radar to departmental comparisons and a health heatmap, with privacy-aware filters.",
            },
            {
              Icon: FileText,
              title: "AI intelligence report",
              body: "A structured narrative covering strengths, development opportunities, qualitative themes and a 30/60/90-day action plan, grounded in calculated scores.",
            },
            {
              Icon: FileText,
              title: "Executive PDF",
              body: "A polished, print-ready report for leadership teams and boards, consistent with what appears in the dashboard.",
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-line bg-white p-6 shadow-card">
              <Icon className="h-5 w-5 text-emerald-600" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">
          Plan availability varies.{" "}
          <Link href="/features" className="font-medium text-navy-900 underline underline-offset-4 hover:text-emerald-700">
            Explore all features
          </Link>{" "}
          or{" "}
          <Link href="/pricing" className="font-medium text-navy-900 underline underline-offset-4 hover:text-emerald-700">
            compare plans
          </Link>
          .
        </p>
      </Section>

      <CtaBand />
    </>
  );
}
