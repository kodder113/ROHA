import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Compass,
  EyeOff,
  GraduationCap,
  Layers,
  LineChart,
  Lock,
  MessageSquareQuote,
  ShieldCheck,
  UserX,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CtaBand } from "@/components/marketing/cta-band";
import { IllustrativeDashboard } from "@/components/marketing/illustrative-dashboard";
import { FALLBACK_DIMENSION_NAMES } from "@/components/marketing/nav";
import { capitalize, numberWord } from "@/lib/text";
import { PlanCard } from "@/components/marketing/plan-card";
import { Container, Eyebrow, FeatureCard, HeroBackdrop, Section, SectionHeading } from "@/components/marketing/section";
import { darkOutlineButton } from "@/components/marketing/buttons";
import { BRAND } from "@/lib/brand";
import { getPublicPlans, getPublishedFramework } from "@/lib/content/public";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "ROHA — Rodrik Organizational Health Assessment" },
  description:
    "ROHA transforms employee perspectives into organizational intelligence—helping leaders understand their people, identify opportunities, and make more informed decisions.",
};

export default async function HomePage() {
  const [framework, plans] = await Promise.all([getPublishedFramework(), getPublicPlans()]);
  const dimensions =
    framework?.dimensions.map((d) => ({ key: d.key, code: d.code, name: d.name, description: d.description })) ??
    FALLBACK_DIMENSION_NAMES.map((name) => ({ key: name, code: null, name, description: null }));
  const questionCount = framework?.dimensions.reduce((sum, d) => sum + d.questions.length, 0) ?? FALLBACK_DIMENSION_NAMES.length * 4;
  const perDimension = dimensions.length ? Math.round(questionCount / dimensions.length) : 0;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <HeroBackdrop />
        <Container className="relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-28">
          <div className="animate-fade-up">
            <Eyebrow inverted>{BRAND.productFull}</Eyebrow>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              Discover what your employees know about your organization that you don&rsquo;t.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">
              ROHA transforms employee perspectives into organizational intelligence—helping leaders understand their people, identify
              opportunities, and make more informed decisions.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/get-started" size="lg">
                Start Your Free Assessment
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <Link href="/framework" className={darkOutlineButton("lg")}>
                Explore the ROHA Framework
              </Link>
            </div>
            <p className="mt-6 text-sm text-navy-300">
              <Link href="/demo" className="inline-flex items-center gap-1.5 font-medium text-emerald-300 underline-offset-4 hover:underline">
                View the demonstration dashboard — synthetic data
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </p>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-navy-700 pt-6">
              {[
                ["6", "dimensions of organizational health"],
                [String(questionCount), "statements, rated twice"],
                ["5", "minimum respondents per reported group"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <span className="block font-serif text-3xl font-semibold text-white">{value}</span>
                    <span aria-hidden className="mt-1 block text-xs leading-snug text-navy-300">{label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="animate-fade-in lg:pl-4">
            <IllustrativeDashboard codes={dimensions.map((d) => d.code).filter((c): c is string => !!c)} />
          </div>
        </Container>
      </section>

      {/* The problem */}
      <Section aria-labelledby="problem-heading">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <SectionHeading
            id="problem-heading"
            eyebrow="The leadership blind spot"
            title="The higher you rise, the more filtered your view becomes."
            description="Information travels upward through layers of interpretation, caution and good intentions. By the time it reaches the executive table, the most useful signals—friction in how work gets done, erosion of trust, misalignment on priorities—are often softened or missing altogether."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FeatureCard icon={<EyeOff className="h-5 w-5" aria-hidden />} title="Filtered feedback">
              Employees are understandably careful about what they say to the people who shape their careers. Candor needs a safe channel.
            </FeatureCard>
            <FeatureCard icon={<Layers className="h-5 w-5" aria-hidden />} title="Fragmented signals">
              Engagement pulses, exit interviews and hallway conversations rarely connect into a coherent picture leaders can act on.
            </FeatureCard>
            <FeatureCard icon={<Compass className="h-5 w-5" aria-hidden />} title="Unclear priorities">
              Knowing that something is wrong is not the same as knowing where to focus first. Leaders need to see where the gaps are widest.
            </FeatureCard>
            <FeatureCard icon={<LineChart className="h-5 w-5" aria-hidden />} title="No baseline">
              Without a consistent measure, it is difficult to tell whether initiatives are changing how people experience the organization.
            </FeatureCard>
          </div>
        </div>
      </Section>

      {/* Dimensions */}
      <Section tone="canvas" aria-labelledby="dimensions-heading">
        <SectionHeading
          id="dimensions-heading"
          eyebrow="The ROHA Framework"
          title={`${capitalize(numberWord(dimensions.length))} dimensions of organizational health.`}
          description={`ROHA examines the organization as an integrated system. Each dimension is measured through ${numberWord(perDimension)} carefully worded statements, giving leaders a structured view of how employees experience leadership, culture, work and direction.`}
        />
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dimensions.map((d, i) => (
            <li key={d.key} className="group relative rounded-xl border border-line bg-white p-6 shadow-card transition-shadow hover:shadow-elevated">
              <div className="flex items-center justify-between">
                <span className="font-serif text-sm font-semibold text-emerald-700">{String(i + 1).padStart(2, "0")}</span>
                {d.code ? (
                  <span className="rounded-md bg-navy-50 px-2 py-0.5 text-[11px] font-semibold tracking-[0.1em] text-navy-700">{d.code}</span>
                ) : null}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-navy-900">{d.name}</h3>
              {d.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{d.description}</p> : null}
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Link href="/framework" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 hover:text-emerald-700">
            Read all {questionCount} statements in the ROHA Framework
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Section>

      {/* Current vs desired */}
      <Section aria-labelledby="method-heading">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              id="method-heading"
              eyebrow="Methodology"
              title="Where you are. Where your people believe you should be."
              description="Every statement is rated from two perspectives: how things are today, and how employees believe they should be. The distance between the two is often more instructive than either rating alone."
            />
            <dl className="mt-10 space-y-6">
              <div className="flex gap-4">
                <dt className="mt-1 h-3 w-3 shrink-0 rounded-full bg-chart-current" aria-hidden />
                <dd>
                  <p className="font-semibold text-navy-900">Current state</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">How employees experience the organization now, on a five-point agreement scale.</p>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="mt-1 h-3 w-3 shrink-0 rounded-full bg-chart-desired" aria-hidden />
                <dd>
                  <p className="font-semibold text-navy-900">Desired state</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">What employees believe the organization should look like to be healthy and effective.</p>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="mt-1 h-3 w-3 shrink-0 rounded-full bg-amber-600" aria-hidden />
                <dd>
                  <p className="font-semibold text-navy-900">The gap</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Desired minus current, on a 0–100 index. Large positive gaps highlight where aspirations and experience diverge most—a
                    practical starting point for leadership conversations, not a verdict.
                  </p>
                </dd>
              </div>
            </dl>
            <Link href="/how-it-works" className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 hover:text-emerald-700">
              See how scores are calculated
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-canvas p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">One statement, two perspectives</p>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-800 ring-1 ring-amber-200 ring-inset">
                Illustrative
              </span>
            </div>
            <div className="mt-6 space-y-5" aria-hidden>
              {[
                { label: "Current", selected: 2, color: "bg-chart-current" },
                { label: "Desired", selected: 4, color: "bg-chart-desired" },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-sm font-semibold text-navy-900">{row.label}</p>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={
                          n - 1 === row.selected
                            ? `flex h-10 items-center justify-center rounded-lg text-sm font-semibold text-white ${row.color}`
                            : "flex h-10 items-center justify-center rounded-lg border border-line bg-white text-sm text-muted"
                        }
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-[11px] uppercase tracking-[0.1em] text-muted">
                <span>Strongly disagree</span>
                <span>Strongly agree</span>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-line bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">How ROHA converts ratings</p>
              <p className="mt-3 font-mono text-sm text-navy-900">index = ((rating − 1) ÷ 4) × 100</p>
              <p className="mt-2 font-mono text-sm text-navy-900">gap = desired − current</p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Scores are calculated deterministically from responses under a versioned scoring rule. The same data always produces the same
                results.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Privacy */}
      <Section tone="navy" aria-labelledby="privacy-heading" className="relative overflow-hidden">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading
            id="privacy-heading"
            inverted
            eyebrow="Privacy-first design"
            title="Candor requires confidence. ROHA is confidential by design."
            description="Employees answer honestly when they trust the process. ROHA's safeguards are built into the platform—not left to policy—so leaders see patterns, never individuals."
          />
          <ul className="grid gap-5 sm:grid-cols-2">
            {[
              {
                Icon: Users,
                title: "Minimum group size of five",
                body: "Results for any group—overall or by department, location, level or tenure—are shown only when at least five people responded.",
              },
              {
                Icon: EyeOff,
                title: "No individual responses",
                body: "Administrators see aggregated results only. Individual response records are never displayed in the dashboard or reports.",
              },
              {
                Icon: UserX,
                title: "No employee accounts",
                body: "Employees respond through a single shared link. ROHA does not ask for names, email addresses or employee IDs.",
              },
              {
                Icon: Lock,
                title: "Protected comments",
                body: "Written comments are screened for identifying details, and are quoted verbatim only with the respondent's permission.",
              },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="rounded-xl border border-navy-700 bg-navy-800/60 p-6">
                <Icon className="h-5 w-5 text-emerald-400" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-200">{body}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-12 text-sm text-navy-300">
          Read exactly what ROHA collects—and what it does not—in{" "}
          <Link href="/how-it-works#confidentiality" className="font-medium text-emerald-300 underline-offset-4 hover:underline">
            our confidentiality explanation
          </Link>
          .
        </p>
      </Section>

      {/* AI intelligence */}
      <Section aria-labelledby="ai-heading">
        <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <SectionHeading
            id="ai-heading"
            eyebrow="AI executive intelligence"
            title="Analysis that explains the numbers—without inventing them."
            description="ROHA's AI organizational intelligence report turns aggregated results into a structured executive narrative: strengths, development opportunities, themes from written comments, and a prioritized 30/60/90-day action plan."
          />
          <div className="space-y-4">
            {[
              {
                Icon: BarChart3,
                title: "Grounded in deterministic scores",
                body: "Every index, gap and distribution is calculated by ROHA's scoring engine before the AI is involved. The AI never calculates, adjusts or estimates a score.",
              },
              {
                Icon: BrainCircuit,
                title: "Findings distinguished from hypotheses",
                body: "The report separates what the data shows from possible explanations worth exploring, so leaders know which statements are observations and which are informed conjecture.",
              },
              {
                Icon: MessageSquareQuote,
                title: "Aggregate inputs only",
                body: "The AI receives aggregated results and comments that have been screened for identifiers. No personal employee information is sent for analysis.",
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-xl border border-line p-5">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-sans text-base font-semibold text-navy-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Founder */}
      <Section tone="canvas" aria-labelledby="founder-heading">
        <div className="grid items-center gap-12 rounded-2xl border border-line bg-white p-8 shadow-card sm:p-12 lg:grid-cols-[auto_1fr] lg:gap-16">
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-navy-900 text-emerald-400 sm:h-36 sm:w-36">
            <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16" aria-hidden />
          </div>
          <div>
            <Eyebrow>Grounded in strategic leadership</Eyebrow>
            <h2 id="founder-heading" className="mt-3 text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
              Built by {BRAND.company}.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">
              ROHA was created by {BRAND.founder}, founder of {BRAND.company}. Dr. Rodriguez holds a {BRAND.founderCredential} and focuses on
              strategic leadership and organizational development. ROHA brings that perspective to a platform designed for leaders who want
              disciplined insight rather than another engagement survey.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <Link href="/about" className="inline-flex items-center gap-1.5 font-semibold text-navy-900 hover:text-emerald-700">
                About ROHA and its founder
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a href={BRAND.companyUrl} className="inline-flex items-center gap-1.5 font-semibold text-navy-900 hover:text-emerald-700">
                Visit rodrikconsulting.com
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* Pricing teaser */}
      <Section aria-labelledby="pricing-heading">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="pricing-heading"
            eyebrow="Pricing"
            title="Start free. Scale when you are ready."
            description="Begin with a complimentary assessment, then choose a single comprehensive assessment, an ongoing subscription, or a full consulting engagement."
          />
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 hover:text-emerald-700">
            Compare plans in detail
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.key} plan={plan} featured={plan.key === "professional"} compact />
          ))}
        </div>
      </Section>

      <div className="border-t border-line bg-white">
        <Container className="flex flex-col items-start gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
            Want to see ROHA before you begin? Explore a complete dashboard populated with synthetic data.
          </p>
          <Link href="/demo" className="font-semibold text-navy-900 hover:text-emerald-700">
            View the demonstration dashboard →
          </Link>
        </Container>
      </div>

      <CtaBand />
    </>
  );
}

