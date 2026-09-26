"use client";

import { Grid3x3 } from "lucide-react";
import type { SegmentAttribute } from "@/lib/results/segments";
import type { AssessmentResult } from "@/lib/scoring/types";
import { EmptyState } from "@/components/ui/misc";
import { cn, formatScore } from "@/lib/utils";
import { HEAT_BINS, heatBin } from "./chart-theme";
import { ChartCard, HATCH_STYLE, LockedState } from "./chart-primitives";
import { attributeLabel, pickComparisonAttribute, suppressionText, type Segments } from "./segment-utils";

function ScoreCell({ score, label }: { score: number | null; label: string }) {
  if (score === null) {
    return (
      <td className="p-0.5">
        <div
          className="flex h-10 items-center justify-center rounded-md text-xs text-muted"
          style={HATCH_STYLE}
          title={`${label}: hidden for privacy`}
        >
          <span aria-hidden>—</span>
          <span className="sr-only">Hidden for privacy</span>
        </div>
      </td>
    );
  }
  const bin = heatBin(score);
  return (
    <td className="p-0.5">
      <div
        className="flex h-10 items-center justify-center rounded-md text-sm font-semibold tabular-nums transition-transform hover:scale-[1.04]"
        style={{ backgroundColor: bin.color, color: bin.text }}
        title={`${label}: ${formatScore(score)}`}
      >
        {formatScore(score)}
      </div>
    </td>
  );
}

export function HealthHeatmap({
  segments,
  organization,
  attribute,
  enabled,
}: {
  segments: Segments;
  organization: AssessmentResult;
  attribute?: SegmentAttribute | null;
  /** features.segment_comparisons */
  enabled: boolean;
}) {
  const description = "Current-state scores for every reportable group and dimension.";
  if (!enabled) {
    return (
      <ChartCard title="Organizational health heatmap" description={description}>
        <LockedState
          title="See every group at a glance"
          description="The health heatmap is available on ROHA Professional and above."
          planName="ROHA Professional"
        />
      </ChartCard>
    );
  }

  const resolved = pickComparisonAttribute(segments, attribute);
  const analysis = resolved ? segments[resolved] : undefined;
  if (!resolved || !analysis) {
    return (
      <ChartCard title="Organizational health heatmap" description={description}>
        <EmptyState
          icon={<Grid3x3 className="h-6 w-6" aria-hidden />}
          title="No groups to map"
          description="The heatmap appears when the assessment asks optional demographic questions such as department."
        />
      </ChartCard>
    );
  }

  const dims = organization.dimensions;
  const groupWord = attributeLabel(resolved).toLowerCase();
  const visibleCount = analysis.segments.filter((s) => s.visible && s.result).length;

  return (
    <ChartCard
      title={`Health heatmap by ${groupWord}`}
      description={description}
      summary={`Heatmap of current-state scores by ${groupWord} and dimension. ${visibleCount} groups shown, ${analysis.segments.length - visibleCount} hidden for privacy. The table is fully readable by screen readers.`}
    >
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
          <caption className="sr-only">Current-state scores by {groupWord} and dimension (0–100)</caption>
          <thead>
            <tr>
              <th scope="col" className="w-40 pb-2 pr-2 text-xs font-medium text-muted">
                {attributeLabel(resolved)}
              </th>
              {dims.map((d) => (
                <th key={d.key} scope="col" className="px-0.5 pb-2 text-center text-xs font-semibold text-navy-800" title={d.name}>
                  <abbr title={d.name} className="no-underline">
                    {d.code}
                  </abbr>
                </th>
              ))}
              <th scope="col" className="px-0.5 pb-2 text-center text-xs font-semibold text-navy-800">
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="truncate py-0.5 pr-2 text-sm font-semibold text-navy-900">
                Organization
                <span className="block text-[11px] font-normal text-muted">{organization.contributingResponses ?? organization.validResponses} responses</span>
              </th>
              {dims.map((d) => (
                <ScoreCell key={d.key} score={d.current.score} label={`Organization · ${d.name}`} />
              ))}
              <ScoreCell score={organization.overall.currentIndex} label="Organization · Overall" />
            </tr>
            <tr aria-hidden>
              <td colSpan={dims.length + 2} className="py-1">
                <div className="h-px bg-line" />
              </td>
            </tr>
            {analysis.segments.map((s) => {
              if (!s.visible || !s.result) {
                return (
                  <tr key={s.key}>
                    <th scope="row" className="py-0.5 pr-2 text-sm font-medium text-muted">
                      {s.label}
                    </th>
                    <td colSpan={dims.length + 1} className="p-0.5">
                      <div
                        className="flex h-10 items-center justify-center rounded-md px-3 text-xs text-muted"
                        style={HATCH_STYLE}
                      >
                        <span className="truncate">Hidden — {suppressionText(s)}</span>
                      </div>
                    </td>
                  </tr>
                );
              }
              const r = s.result;
              return (
                <tr key={s.key}>
                  <th scope="row" className="max-w-40 truncate py-0.5 pr-2 text-sm font-medium text-navy-900" title={s.label}>
                    {s.label}
                    {s.n !== null ? <span className="block text-[11px] font-normal text-muted">{s.n} responses</span> : null}
                  </th>
                  {dims.map((d) => (
                    <ScoreCell
                      key={d.key}
                      score={r.dimensions.find((x) => x.key === d.key)?.current.score ?? null}
                      label={`${s.label} · ${d.name}`}
                    />
                  ))}
                  <ScoreCell score={r.overall.currentIndex} label={`${s.label} · Overall`} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span>Current score</span>
          <ol className="flex overflow-hidden rounded" aria-label="Color scale">
            {HEAT_BINS.map((b, i) => (
              <li
                key={b.min}
                className={cn("flex h-5 w-12 items-center justify-center text-[10px] font-medium tabular-nums", i > 0 && "ml-0.5")}
                style={{ backgroundColor: b.color, color: b.text }}
              >
                {i === 0 ? `<${Math.round(b.max)}` : `${b.min}+`}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-4 w-6 rounded ring-1 ring-inset ring-line" style={HATCH_STYLE} />
          <span>Hidden for privacy</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {dims.map((d) => (
            <span key={d.key}>
              <span className="font-semibold text-navy-800">{d.code}</span> {d.name}
            </span>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
