"use client";

import { useState } from "react";
import { ChevronDown, MessageSquareQuote, ShieldCheck } from "lucide-react";
import type { ParticipationSummary, QualitativeSummary, ResultsPayload } from "@/lib/results/types";
import type { AssessmentResult, DimensionResult, Distribution, QuestionResult } from "@/lib/scoring/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/misc";
import { cn, formatDate, formatGap, formatPercent, formatScore } from "@/lib/utils";
import { LIKERT, distributionShares } from "./chart-theme";
import { GapBadge, HATCH_STYLE } from "./chart-primitives";

/* -------------------------------------------------------------------------- */
/* (a) Overall organizational health                                          */
/* -------------------------------------------------------------------------- */

export function HealthOverview({ result, participation }: { result: AssessmentResult; participation: ParticipationSummary }) {
  const { overall } = result;
  const gapDirection =
    overall.gap.direction === "increase"
      ? "Employees would prefer more"
      : overall.gap.direction === "decrease"
        ? "Employees would prefer less"
        : overall.gap.value !== null
          ? "Current and desired states are aligned"
          : "Not available";
  const gapCategory =
    overall.gap.category === "substantial" ? "Substantial gap" : overall.gap.category === "notable" ? "Notable gap" : overall.gap.category === "aligned" ? "Aligned" : null;

  return (
    <section aria-labelledby="overall-health-heading" className="animate-fade-up">
      <h2 id="overall-health-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
        Overall organizational health
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatTile
          tone="navy"
          label="Current health index"
          value={formatScore(overall.currentIndex)}
          hint={overall.band ? overall.band : "Band not available"}
          className="min-[420px]:col-span-2 lg:col-span-1"
        />
        <StatTile tone="emerald" label="Desired health index" value={formatScore(overall.desiredIndex)} hint="Where employees would like to be" />
        <StatTile
          label="Organizational gap"
          value={formatGap(overall.gap.value)}
          hint={gapCategory ? `${gapDirection} · ${gapCategory}` : gapDirection}
        />
        <StatTile
          label="Survey participation"
          value={participation.rate !== null ? formatPercent(participation.rate) : participation.responses.toLocaleString("en-US")}
          hint={
            participation.rate !== null && participation.expected !== null
              ? `${participation.responses.toLocaleString("en-US")} of ${participation.expected.toLocaleString("en-US")} expected`
              : "Responses received"
          }
        />
        <StatTile
          label="Valid responses"
          value={result.validResponses.toLocaleString("en-US")}
          hint={
            result.excludedResponses > 0
              ? `${result.excludedResponses.toLocaleString("en-US")} excluded for answering too few items`
              : "No responses excluded"
          }
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Compact distribution bar                                                    */
/* -------------------------------------------------------------------------- */

export function MiniDistribution({ distribution, className }: { distribution: Distribution; className?: string }) {
  const shares = distributionShares(distribution);
  if (!shares) {
    return (
      <div className={cn("h-2.5 w-full rounded-full", className)} style={HATCH_STYLE} role="img" aria-label="Distribution hidden for privacy" />
    );
  }
  const label = LIKERT.map((l, i) => `${formatPercent(shares[i])} ${l.label.toLowerCase()}`).join(", ");
  return (
    <div className={cn("flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full", className)} role="img" aria-label={label} title={label}>
      {LIKERT.map((l, i) =>
        shares[i] > 0 ? <span key={l.key} className="h-full" style={{ flex: `${shares[i]} 1 0`, backgroundColor: l.color }} /> : null,
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* (c) Dimensional analysis                                                    */
/* -------------------------------------------------------------------------- */

function BandText({ band }: { band: string | null }) {
  return band ? <span className="text-sm text-navy-800">{band}</span> : <span className="text-sm text-muted">—</span>;
}

export function DimensionalAnalysis({ dimensions, scopeLabel }: { dimensions: DimensionResult[]; scopeLabel: string }) {
  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Dimensional analysis"
        description={`Six dimensions of organizational health — ${scopeLabel}. The bar shows how current-state ratings are spread from strongly disagree to strongly agree.`}
      />
      {/* Table (md and up) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Dimension scores — {scopeLabel}</caption>
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="px-5 py-2.5 font-medium">Dimension</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Current</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Desired</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Gap</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Band</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">n</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">N/A</th>
              <th scope="col" className="w-40 px-5 py-2.5 font-medium">Distribution (current)</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {dimensions.map((d) => (
              <tr key={d.key} className="border-b border-line/70 last:border-0 hover:bg-canvas/60">
                <th scope="row" className="px-5 py-3 font-medium text-navy-900">
                  <span className="mr-2 inline-block w-7 text-xs font-semibold text-muted">{d.code}</span>
                  {d.name}
                </th>
                <td className="px-3 py-3 text-right font-semibold text-navy-900">{formatScore(d.current.score)}</td>
                <td className="px-3 py-3 text-right text-emerald-800">{formatScore(d.desired.score)}</td>
                <td className="px-3 py-3">
                  <GapBadge gap={d.gap} />
                </td>
                <td className="px-3 py-3">
                  <BandText band={d.band} />
                </td>
                <td className="px-3 py-3 text-right text-muted">{d.current.score === null ? "—" : d.current.n}</td>
                <td className="px-3 py-3 text-right text-muted">{d.current.naCount}</td>
                <td className="px-5 py-3">
                  <MiniDistribution distribution={d.current.distribution} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Cards (phones) */}
      <ul className="divide-y divide-line md:hidden">
        {dimensions.map((d) => (
          <li key={d.key} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-navy-900">
                <span className="mr-1.5 text-xs font-semibold text-muted">{d.code}</span>
                {d.name}
              </p>
              <GapBadge gap={d.gap} className="shrink-0" />
            </div>
            <dl className="mt-2 grid grid-cols-4 gap-2 text-xs tabular-nums">
              <div>
                <dt className="text-muted">Current</dt>
                <dd className="text-base font-semibold text-navy-900">{formatScore(d.current.score)}</dd>
              </div>
              <div>
                <dt className="text-muted">Desired</dt>
                <dd className="text-base font-semibold text-emerald-800">{formatScore(d.desired.score)}</dd>
              </div>
              <div>
                <dt className="text-muted">n</dt>
                <dd className="text-base text-navy-900">{d.current.score === null ? "—" : d.current.n}</dd>
              </div>
              <div>
                <dt className="text-muted">N/A</dt>
                <dd className="text-base text-navy-900">{d.current.naCount}</dd>
              </div>
            </dl>
            <div className="mt-2 flex items-center justify-between gap-3">
              <BandText band={d.band} />
            </div>
            <MiniDistribution distribution={d.current.distribution} className="mt-2" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* (e) Item-level detail                                                       */
/* -------------------------------------------------------------------------- */

function ItemRow({ q, minGroupSize }: { q: QuestionResult; minGroupSize: number }) {
  const hidden = q.current.score === null;
  return (
    <tr className="border-b border-line/70 align-top last:border-0">
      <th scope="row" className="py-2.5 pr-3 font-normal">
        <span className="block text-xs font-semibold text-muted">
          {q.key} · {q.focus}
        </span>
        <span className="text-sm text-ink">{q.prompt}</span>
      </th>
      {hidden ? (
        <td colSpan={5} className="py-2.5 text-xs text-muted">
          <span className="inline-block rounded px-2 py-1" style={HATCH_STYLE}>
            Hidden (fewer than {minGroupSize} ratings)
          </span>
          {q.current.naCount > 0 ? <span className="ml-2">{q.current.naCount} not applicable</span> : null}
        </td>
      ) : (
        <>
          <td className="px-2 py-2.5 text-right font-semibold text-navy-900">{formatScore(q.current.score)}</td>
          <td className="px-2 py-2.5 text-right text-emerald-800">{formatScore(q.desired.score)}</td>
          <td className="px-2 py-2.5">
            <GapBadge gap={q.gap} />
          </td>
          <td className="px-2 py-2.5 text-right text-muted">{q.current.n}</td>
          <td className="px-2 py-2.5 text-right text-muted">{q.current.naCount}</td>
        </>
      )}
    </tr>
  );
}

export function ItemDetail({
  result,
  scopeLabel,
  minGroupSize,
}: {
  result: AssessmentResult;
  scopeLabel: string;
  minGroupSize: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Item-level detail"
        description={`All ${result.questions.length} statements, grouped by dimension — ${scopeLabel}.`}
        action={
          <button
            type="button"
            aria-expanded={open}
            aria-controls="item-detail-body"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-navy-900 hover:bg-navy-50"
          >
            {open ? "Collapse" : "Expand"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        }
      />
      <div id="item-detail-body" hidden={!open}>
        <CardBody className="space-y-6">
          {result.dimensions.map((d) => {
            const items = result.questions.filter((q) => q.dimensionKey === d.key);
            if (items.length === 0) return null;
            return (
              <div key={d.key}>
                <h4 className="flex items-center gap-2 font-sans text-sm font-semibold text-navy-900">
                  <Badge tone="outline">{d.code}</Badge>
                  {d.name}
                </h4>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
                    <caption className="sr-only">
                      {d.name} items — {scopeLabel}
                    </caption>
                    <thead>
                      <tr className="border-b border-line text-xs text-muted">
                        <th scope="col" className="py-2 pr-3 font-medium">Statement</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Current</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Desired</th>
                        <th scope="col" className="px-2 py-2 font-medium">Gap</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">n</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">N/A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((q) => (
                        <ItemRow key={q.questionId} q={q} minGroupSize={minGroupSize} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </CardBody>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* (f) Qualitative feedback                                                    */
/* -------------------------------------------------------------------------- */

const QUOTE_PREVIEW = 4;

function QualitativeQuestion({ q }: { q: QualitativeSummary }) {
  const [showAll, setShowAll] = useState(false);
  const quotes = showAll ? q.quotes : q.quotes.slice(0, QUOTE_PREVIEW);
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-navy-900">{q.prompt}</p>
        <Badge tone="neutral" className="tabular-nums">
          {q.commentCount.toLocaleString("en-US")} {q.commentCount === 1 ? "comment" : "comments"}
        </Badge>
      </div>
      {q.quotes.length > 0 ? (
        <>
          <ul className="mt-3 space-y-2">
            {quotes.map((text, i) => (
              <li key={i}>
                <blockquote className="border-l-2 border-emerald-300 bg-canvas/70 py-2 pl-3 pr-2 text-sm leading-relaxed text-ink">
                  “{text}”
                </blockquote>
              </li>
            ))}
          </ul>
          {q.quotes.length > QUOTE_PREVIEW ? (
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="mt-2 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
            >
              {showAll ? "Show fewer" : `Show all ${q.quotes.length} quotes`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">No comments can be quoted for this question.</p>
      )}
    </div>
  );
}

export function QualitativePanel({ qualitative }: { qualitative: QualitativeSummary[] }) {
  const anyQuotes = qualitative.some((q) => q.quotes.length > 0);
  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="What employees said"
        description="Responses to the optional open-ended questions."
        action={<MessageSquareQuote className="h-5 w-5 text-muted" aria-hidden />}
      />
      <CardBody className="space-y-4">
        <p className="flex items-start gap-2 text-xs text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          {anyQuotes
            ? "Shared with the respondent's permission. Identifiers have been removed."
            : "Comments are only quoted when the respondent gives permission and enough people have responded. Identifiers are always removed before comments are shown."}
        </p>
        {qualitative.length > 0 ? (
          qualitative.map((q) => <QualitativeQuestion key={q.key} q={q} />)
        ) : (
          <p className="text-sm text-muted">This assessment did not include open-ended questions, or none were answered.</p>
        )}
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* (g) Methodology                                                             */
/* -------------------------------------------------------------------------- */

export function MethodologyNote({ payload }: { payload: ResultsPayload }) {
  return (
    <footer className="rounded-xl border border-line bg-canvas px-5 py-4 text-xs leading-relaxed text-muted">
      <p className="font-semibold text-navy-800">Methodology</p>
      <p className="mt-1">
        Scores are 0–100 indices of the mean rating on a five-point scale; gaps are desired minus current. “Not applicable” answers are
        excluded from scores. Groups and cells with fewer than {payload.minGroupSize} valid responses are hidden, and further groups
        may be hidden so that small groups cannot be calculated by subtraction.
      </p>
      <p className="mt-1 font-medium text-navy-800">Scores describe employee perceptions and are not validated benchmarks.</p>
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 tabular-nums">
        <div className="flex gap-1">
          <dt>Scoring engine</dt>
          <dd className="font-medium text-navy-800">{payload.engineVersion}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Scoring rules</dt>
          <dd className="font-medium text-navy-800">v{payload.scoringRuleVersion}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Assessment</dt>
          <dd className="font-medium text-navy-800">v{payload.assessmentVersion}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Minimum group size</dt>
          <dd className="font-medium text-navy-800">{payload.minGroupSize}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Privacy mode</dt>
          <dd className="font-medium capitalize text-navy-800">{payload.privacyMode}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Computed</dt>
          <dd className="font-medium text-navy-800">{formatDate(payload.computedAt, { dateStyle: "medium", timeZone: "UTC" })}</dd>
        </div>
      </dl>
    </footer>
  );
}
