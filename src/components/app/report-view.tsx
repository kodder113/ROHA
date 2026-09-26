import { AlertTriangle, FlaskConical, Lightbulb, Search } from "lucide-react";
import type { AnalysisSection, ExecutiveReport, ReportInputSnapshot } from "@/lib/ai/report-schema";
import { analysisSectionsFor } from "@/lib/ai/report-schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/misc";
import { cn, formatGap, formatPercent, formatScore } from "@/lib/utils";

const QUESTION_LABELS: Record<string, string> = {
  does_well: "What the organization does well",
  makes_harder: "What makes work more difficult",
  recommend: "Recommended improvements",
};

function Section({ letter, title, children, className }: { letter: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="flex items-baseline gap-3 text-xl font-semibold text-navy-900 sm:text-2xl">
        <span className="font-sans text-sm font-semibold text-emerald-700">{letter}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-3 leading-relaxed text-navy-800">
      {text
        .split(/\n{2,}|\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}

function Analysis({ section }: { section: AnalysisSection }) {
  return (
    <div className="space-y-4">
      <Paragraphs text={section.summary} />
      {section.findings.length > 0 ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
            <Search className="h-3.5 w-3.5" aria-hidden /> Findings supported by response data
          </p>
          <ul className="space-y-2">
            {section.findings.map((f, i) => (
              <li key={i} className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 px-4 py-3">
                <p className="text-sm font-medium text-navy-900">{f.statement}</p>
                <p className="mt-1 text-xs text-muted">Evidence: {f.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {section.hypotheses.length > 0 ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-violet-800">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Hypotheses requiring further investigation
          </p>
          <ul className="space-y-2">
            {section.hypotheses.map((h, i) => (
              <li key={i} className="rounded-lg border-l-4 border-violet-400 bg-violet-50/50 px-4 py-3">
                <p className="text-sm font-medium text-navy-900">{h.statement}</p>
                <p className="mt-1 text-xs text-muted">How to investigate: {h.how_to_investigate}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ReportView({ report, snapshot }: { report: ExecutiveReport; snapshot: ReportInputSnapshot }) {
  const dimName = (key: string) => snapshot.dimensions.find((d) => d.key === key)?.name ?? key;
  const dim = (key: string) => snapshot.dimensions.find((d) => d.key === key);
  const phases = ["30", "60", "90"] as const;
  return (
    <div className="space-y-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile tone="navy" label="Current health index" value={formatScore(snapshot.overall.currentIndex)} hint={snapshot.overall.band ?? undefined} />
        <StatTile label="Desired health index" value={formatScore(snapshot.overall.desiredIndex)} />
        <StatTile label="Organizational gap" value={formatGap(snapshot.overall.gap)} hint="Desired minus current" />
        <StatTile
          label={snapshot.participation.partialResponses !== undefined ? "In overall index" : "Valid responses"}
          value={snapshot.participation.validResponses.toLocaleString()}
          hint={snapshot.participation.ratePercent !== null ? `${formatPercent(snapshot.participation.ratePercent, 1)} participation` : undefined}
        />
      </div>

      <Section letter="A" title="Executive summary">
        <Paragraphs text={report.executive_summary} />
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section letter="B" title="Organizational strengths">
          <ul className="space-y-3">
            {report.strengths.length === 0 ? <li className="text-sm text-muted">No strengths identified.</li> : null}
            {report.strengths.map((s, i) => (
              <li key={i} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-navy-900">{s.title}</p>
                  <Badge tone="emerald">{formatScore(dim(s.dimension_key)?.current)}</Badge>
                </div>
                {s.title !== dimName(s.dimension_key) ? <p className="mt-1 text-sm text-muted">{dimName(s.dimension_key)}</p> : null}
                <p className="mt-2 text-sm leading-relaxed text-navy-800">{s.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
        <Section letter="C" title="Development opportunities">
          <ul className="space-y-3">
            {report.development_opportunities.length === 0 ? <li className="text-sm text-muted">No development opportunities identified.</li> : null}
            {report.development_opportunities.map((s, i) => (
              <li key={i} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-navy-900">{s.title}</p>
                  <Badge tone="amber">Gap {formatGap(dim(s.dimension_key)?.gap)}</Badge>
                </div>
                {s.title !== dimName(s.dimension_key) ? <p className="mt-1 text-sm text-muted">{dimName(s.dimension_key)}</p> : null}
                <p className="mt-2 text-sm leading-relaxed text-navy-800">{s.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {analysisSectionsFor(snapshot.dimensions.map((d) => d.key)).map((sec) => {
        const d = dim(sec.dimension);
        const items = [...(sec.itemKeys ?? []), ...(sec.contextItemKeys ?? [])]
          .map((k) => snapshot.items.find((i) => i.key === k))
          .filter((i): i is ReportInputSnapshot["items"][number] => !!i);
        return (
          <Section key={sec.key} letter={sec.letter} title={sec.title}>
            {d ? (
              <p className="text-sm text-muted">
                {d.name}: current {formatScore(d.current)} · desired {formatScore(d.desired)} · gap {formatGap(d.gap)} · n = {d.respondents}
              </p>
            ) : null}
            {sec.scope ? (
              <div className="rounded-lg border border-line bg-navy-50/40 p-3 text-sm text-navy-800">
                <p>{sec.scope}</p>
                {items.length ? (
                  <p className="mt-1 text-muted">
                    {items.map((i) => `${i.key} ${formatScore(i.current)} (gap ${formatGap(i.gap)})`).join(" · ")}
                  </p>
                ) : null}
              </div>
            ) : null}
            <Analysis section={report[sec.key as keyof ExecutiveReport] as AnalysisSection} />
          </Section>
        );
      })}

      <Section letter="J" title="Qualitative themes">
        {report.qualitative_themes.length === 0 ? (
          <p className="text-sm text-muted">No qualitative themes were identified for this report.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(["does_well", "makes_harder", "recommend"] as const).map((key) => {
              const themes = report.qualitative_themes.filter((t) => t.question_key === key);
              const count = snapshot.comments.find((c) => c.questionKey === key)?.count ?? 0;
              return (
                <Card key={key}>
                  <CardHeader title={QUESTION_LABELS[key]} description={`${count} comment${count === 1 ? "" : "s"}`} />
                  <CardBody>
                    {themes.length === 0 ? (
                      <p className="text-sm text-muted">No recurring themes.</p>
                    ) : (
                      <ul className="space-y-3">
                        {themes.map((t, i) => (
                          <li key={i}>
                            <p className="text-sm font-medium text-navy-900">{t.theme}</p>
                            <p className="text-xs text-emerald-800">{t.prevalence}</p>
                            <p className="mt-1 text-sm text-navy-800">{t.description}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted">Themes are paraphrased summaries of identifier-scrubbed comments. No individual comment is quoted or attributed.</p>
      </Section>

      <Section letter="K" title="Organizational priorities">
        <ol className="space-y-3">
          {report.organizational_priorities.map((p, i) => (
            <li key={i} className="flex gap-4 rounded-xl border border-line bg-white p-4">
              <span className="font-serif text-2xl font-semibold text-emerald-700">{i + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-navy-900">{p.priority}</p>
                  <Badge tone={p.basis === "finding" ? "emerald" : "violet"}>{p.basis === "finding" ? "Supported finding" : "Hypothesis"}</Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-navy-800">{p.rationale}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section letter="L" title="30 / 60 / 90-day action plan">
        <div className="grid gap-4 lg:grid-cols-3">
          {phases.map((phase) => (
            <div key={phase} className="space-y-3">
              <p className="rounded-lg bg-navy-900 px-3 py-2 text-sm font-semibold text-white">First {phase} days</p>
              {report.action_plan.filter((a) => a.phase === phase).length === 0 ? <p className="text-sm text-muted">No actions proposed.</p> : null}
              {report.action_plan
                .filter((a) => a.phase === phase)
                .map((a, i) => (
                  <div key={i} className="rounded-xl border border-line bg-white p-4 text-sm">
                    <p className="font-medium text-navy-900">{a.action}</p>
                    <dl className="mt-3 space-y-1.5 text-xs">
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-muted">Dimension</dt>
                        <dd className="text-navy-800">{dimName(a.dimension_key)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-muted">Owner</dt>
                        <dd className="text-navy-800">{a.owner_role}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-muted">Timeframe</dt>
                        <dd className="text-navy-800">{a.timeframe}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-muted">Success metric</dt>
                        <dd className="text-navy-800">{a.success_metric}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-muted">Rationale</dt>
                        <dd className="text-navy-800">{a.rationale}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </Section>

      <section className="space-y-3 rounded-xl border border-line bg-canvas p-5">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-navy-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden /> Methodological limitations
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-navy-800">
          {report.limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
          <li>Scores describe the perceptions of responding employees. They are not validated benchmarks and do not establish productivity, retention or financial performance.</li>
        </ul>
        <p className="flex items-start gap-2 text-xs text-muted">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          All figures come from ROHA&apos;s deterministic scoring engine (v{snapshot.methodology.scoringRuleVersion} rules, assessment v
          {snapshot.methodology.assessmentVersion}). Narrative text does not alter official scores.
        </p>
      </section>
    </div>
  );
}
