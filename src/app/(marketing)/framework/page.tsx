import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MessageSquareText } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CtaBand } from "@/components/marketing/cta-band";
import { FALLBACK_DIMENSION_NAMES, INTERPRETATION_BANDS } from "@/components/marketing/nav";
import { Container, PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { BRAND } from "@/lib/brand";
import { getPublishedFramework } from "@/lib/content/public";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The ROHA Framework",
  description:
    "The ROHA Organizational Health Framework: six dimensions, the complete set of assessment statements, the rating scale, and how results are interpreted.",
};

const SCALE = [
  { value: "1", label: "Strongly disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly agree" },
];

export default async function FrameworkPage() {
  const framework = await getPublishedFramework();
  const totalQuestions = framework?.dimensions.reduce((sum, d) => sum + d.questions.length, 0) ?? 0;

  return (
    <>
      <PageHero
        eyebrow="The ROHA Framework"
        title="The ROHA Organizational Health Framework."
        description="A structured, transparent model of organizational health. Every statement employees are asked to rate is published here, so leaders and participants alike can see exactly what ROHA measures."
      >
        {framework ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-navy-600 bg-navy-800/60 px-3 py-1 text-sm text-navy-100">
            <BookOpen className="h-4 w-4 text-emerald-400" aria-hidden />
            {framework.title} · Version {framework.versionNumber}
          </p>
        ) : null}
      </PageHero>

      {framework ? (
        <>
          {/* Dimension index */}
          <div className="border-b border-line bg-canvas">
            <Container className="py-6">
              <nav aria-label="Dimensions">
                <ul className="flex flex-wrap gap-2">
                  {framework.dimensions.map((d) => (
                    <li key={d.key}>
                      <a
                        href={`#dimension-${d.key}`}
                        className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy-900 hover:border-navy-300"
                      >
                        <span className="text-xs font-semibold text-emerald-700">{d.code}</span>
                        {d.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </Container>
          </div>

          <Section aria-labelledby="dimensions-heading">
            <SectionHeading
              id="dimensions-heading"
              eyebrow={`${framework.dimensions.length} dimensions · ${totalQuestions} statements`}
              title="What ROHA measures."
              description="Each dimension reflects an area where employees hold direct, first-hand experience. Statements are written to be specific and observable, so that ratings describe everyday organizational life rather than abstract sentiment."
            />
            <div className="mt-14 space-y-8">
              {framework.dimensions.map((d, i) => (
                <article
                  key={d.key}
                  id={`dimension-${d.key}`}
                  aria-labelledby={`dimension-${d.key}-title`}
                  className="scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-white shadow-card"
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
                    <header className="border-b border-line bg-navy-900 p-6 text-white sm:p-8 lg:border-r lg:border-b-0">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-sm font-semibold text-emerald-400">{String(i + 1).padStart(2, "0")}</span>
                        <span className="rounded-md bg-navy-800 px-2 py-0.5 text-[11px] font-semibold tracking-[0.1em] text-navy-100">{d.code}</span>
                      </div>
                      <h3 id={`dimension-${d.key}-title`} className="mt-4 text-2xl font-semibold">
                        {d.name}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-navy-200">{d.description}</p>
                    </header>
                    <ol className="divide-y divide-line px-6 pb-2 sm:px-8 lg:py-2 lg:pl-0">
                      {d.questions.map((q, qi) => (
                        <li key={q.key} className="flex gap-4 py-5">
                          <span className="mt-0.5 font-mono text-xs font-semibold text-muted tabular-nums">
                            {d.code}
                            {qi + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">{q.focus}</p>
                            <p className="mt-1 text-base leading-relaxed text-ink">{q.prompt}</p>
                            {q.allowNa ? (
                              <Badge tone="outline" className="mt-2">
                                Not Applicable available
                              </Badge>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              ))}
            </div>
          </Section>

          {/* Scale & perspectives */}
          <Section tone="canvas" aria-labelledby="scale-heading">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
              <div>
                <SectionHeading
                  id="scale-heading"
                  eyebrow="The rating scale"
                  title="A familiar five-point agreement scale."
                  description="Participants indicate how strongly they agree with each statement. Where a statement may not apply to someone's role, a Not Applicable option is offered; those responses are excluded from scoring."
                />
                <ol className="mt-8 grid gap-2 sm:grid-cols-5">
                  {SCALE.map((s) => (
                    <li key={s.value} className="rounded-lg border border-line bg-white p-3 text-center">
                      <span className="block font-serif text-2xl font-semibold text-navy-900">{s.value}</span>
                      <span className="mt-1 block text-xs leading-snug text-muted">{s.label}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs text-muted">Not Applicable (N/A) is offered where appropriate and is not scored.</p>
              </div>
              <div>
                <SectionHeading
                  eyebrow="Two perspectives"
                  title="Every statement, rated twice."
                  description="The dual perspective is central to the ROHA method. It separates what employees experience from what they believe the organization needs—revealing both the level and the direction of desired change."
                />
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-white p-5">
                    <span className="inline-block h-1 w-10 rounded-full bg-chart-current" aria-hidden />
                    <h3 className="mt-3 font-sans text-base font-semibold text-navy-900">Current state</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">How employees experience the organization today.</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white p-5">
                    <span className="inline-block h-1 w-10 rounded-full bg-chart-desired" aria-hidden />
                    <h3 className="mt-3 font-sans text-base font-semibold text-navy-900">Desired state</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">How employees believe the organization should operate.</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Open-ended */}
          {framework.qualitative.length > 0 ? (
            <Section aria-labelledby="qualitative-heading">
              <SectionHeading
                id="qualitative-heading"
                eyebrow="Open-ended questions"
                title="In their own words."
                description="Participants may also respond to optional open-ended questions. Comments are screened for identifying details and are quoted verbatim only with the respondent's permission."
              />
              <ol className="mt-10 grid gap-5 md:grid-cols-3">
                {framework.qualitative.map((q, i) => (
                  <li key={q.key} className="rounded-xl border border-line bg-white p-6 shadow-card">
                    <MessageSquareText className="h-5 w-5 text-emerald-600" aria-hidden />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Optional question {i + 1}</p>
                    <p className="mt-2 font-serif text-lg leading-snug text-navy-900">{q.prompt}</p>
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}
        </>
      ) : (
        <Section aria-labelledby="unavailable-heading">
          <div className="mx-auto max-w-3xl">
            <h2 id="unavailable-heading" className="sr-only">
              Framework content unavailable
            </h2>
            <Alert tone="info" title="The framework content could not be loaded right now.">
              ROHA publishes its assessment statements directly from the versioned framework used in live campaigns, so we never show a copy that
              could be out of date. Please try again shortly, or{" "}
              <Link href="/contact" className="font-medium underline underline-offset-4">
                contact us
              </Link>{" "}
              and we will be glad to share it.
            </Alert>
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">The six dimensions</p>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {FALLBACK_DIMENSION_NAMES.map((name, i) => (
                  <li key={name} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-card">
                    <span className="font-serif text-sm font-semibold text-emerald-700">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-medium text-navy-900">{name}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Section>
      )}

      {/* Interpretation */}
      <Section tone={framework && framework.qualitative.length > 0 ? "canvas" : "white"} aria-labelledby="bands-heading">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <SectionHeading
            id="bands-heading"
            eyebrow="Interpreting results"
            title="Descriptive bands to guide the conversation."
            description="Ratings are converted to a 0–100 index using ((rating − 1) ÷ 4) × 100. To help readers orient themselves, ROHA labels ranges of the index with plain-language descriptions."
          />
          <div>
            <ul className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              {INTERPRETATION_BANDS.map((b) => (
                <li key={b.label} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
                  <span className={`h-8 w-1.5 rounded-full ${b.tone}`} aria-hidden />
                  <span className="w-20 font-mono text-sm tabular-nums text-navy-900">{b.range}</span>
                  <span className="font-medium text-navy-900">{b.label}</span>
                </li>
              ))}
            </ul>
            <Alert tone="warning" className="mt-5" title="Interpretive aids, not validated cut-offs">
              These bands are descriptive conventions intended to support discussion. They have not been empirically validated as thresholds and
              should not be read as diagnostic categories or benchmarks against other organizations.
            </Alert>
          </div>
        </div>
      </Section>

      {/* Methodological note */}
      <Section aria-labelledby="method-note-heading">
        <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-canvas p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Methodological note</p>
          <h2 id="method-note-heading" className="mt-3 text-2xl font-semibold text-navy-900">
            What the framework is—and is not.
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              ROHA scores describe the perceptions of the employees who responded. They are a structured summary of how people experience the
              organization; they are not a clinical or psychometric measurement, and they do not establish organizational effectiveness,
              productivity, financial performance or retention risk.
            </p>
            <p>
              The framework is versioned. Each campaign records the framework and scoring rule versions it used, so results remain reproducible
              and comparable over time.
            </p>
            <p className="border-l-2 border-emerald-500 pl-4 text-navy-800">{BRAND.independenceStatement}</p>
          </div>
        </div>
      </Section>

      <CtaBand
        title="See your organization through this framework."
        description="Launch a free ROHA Discover assessment and receive a clear, six-dimension view of how your people experience the organization today—and where they believe it should go."
      />
    </>
  );
}
