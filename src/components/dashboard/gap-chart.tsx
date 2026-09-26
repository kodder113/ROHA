"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DimensionResult, GapInfo } from "@/lib/scoring/types";
import { formatGap, formatScore } from "@/lib/utils";
import { AXIS_TICK, CHART, dimensionShortLabel, gapColor } from "./chart-theme";
import { ChartCard, ChartLegend, DimensionKey, tooltipFor, useIsNarrow } from "./chart-primitives";

interface GapDatum {
  label: string;
  name: string;
  gap: number;
  current: number | null;
  desired: number | null;
  category: GapInfo["category"];
  direction: GapInfo["direction"];
}

const CATEGORY_TEXT: Record<NonNullable<GapInfo["category"]>, string> = {
  aligned: "Aligned",
  notable: "Notable gap",
  substantial: "Substantial gap",
};

/** Bar shape with a rounded data-end and a square baseline, for either sign. */
function DivergingBarShape(props: unknown) {
  const { x = 0, y = 0, width = 0, height = 0, fill } = props as { x?: number; y?: number; width?: number; height?: number; fill?: string };
  const left = Math.min(x, x + width);
  const w = Math.abs(width);
  const h = Math.abs(height);
  if (w < 0.5 || h < 0.5) return <g />;
  const r = Math.min(4, w / 2, h / 2);
  // Positive bars grow right from the zero line (width > 0); negative grow left.
  const roundRight = width >= 0;
  const right = left + w;
  const top = y;
  const bottom = y + h;
  const d = roundRight
    ? `M${left},${top} H${right - r} Q${right},${top} ${right},${top + r} V${bottom - r} Q${right},${bottom} ${right - r},${bottom} H${left} Z`
    : `M${right},${top} H${left + r} Q${left},${top} ${left},${top + r} V${bottom - r} Q${left},${bottom} ${left + r},${bottom} H${right} Z`;
  return <path d={d} fill={fill} />;
}

export function GapChart({ dimensions, scopeLabel }: { dimensions: DimensionResult[]; scopeLabel: string }) {
  const narrow = useIsNarrow();
  const data: GapDatum[] = dimensions
    .filter((d) => d.gap.value !== null)
    .map((d) => ({
      label: dimensionShortLabel(d, narrow),
      name: d.name,
      gap: d.gap.value!,
      current: d.current.score,
      desired: d.desired.score,
      category: d.gap.category,
      direction: d.gap.direction,
    }))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  const hidden = dimensions.filter((d) => d.gap.value === null);
  const maxAbs = data.reduce((m, d) => Math.max(m, Math.abs(d.gap)), 0);
  const extent = Math.max(10, Math.ceil(maxAbs / 10) * 10);

  const summary =
    data.length > 0
      ? `Gap chart for ${scopeLabel}, sorted by size. ` +
        data
          .map((d) => `${d.name}: ${formatGap(d.gap)} (${d.category ? CATEGORY_TEXT[d.category] : "uncategorized"})`)
          .join("; ") +
        "."
      : `No gaps are available for ${scopeLabel}.`;

  return (
    <ChartCard
      title="Dimension gaps"
      description="Desired minus current, sorted by size of the gap."
      summary={summary}
      table={{
        caption: `Gap between desired and current by dimension — ${scopeLabel}`,
        columns: ["Dimension", "Gap", "Category", "Current", "Desired"],
        rows: dimensions.map((d) => [
          d.name,
          formatGap(d.gap.value),
          d.gap.category ? CATEGORY_TEXT[d.gap.category] : "Hidden",
          formatScore(d.current.score),
          formatScore(d.desired.score),
        ]),
      }}
    >
      <ChartLegend
        className="mb-2"
        items={[
          { label: "Employees would prefer more", color: CHART.gapPositive },
          { label: "Employees would prefer less", color: CHART.gapNegative },
        ]}
      />
      {data.length > 0 ? (
        <div className="w-full" style={{ height: data.length * 40 + 36 }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 0 }} barCategoryGap="30%">
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis
                type="number"
                domain={[-extent, extent]}
                tickCount={5}
                tickFormatter={(v: number) => formatGap(v, 0)}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={narrow ? 36 : 188}
                tick={{ ...AXIS_TICK, fill: CHART.ink }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine x={0} stroke={CHART.axis} strokeWidth={1} />
              <Tooltip
                cursor={{ fill: "rgba(24, 51, 95, 0.04)" }}
                content={tooltipFor<GapDatum>((d) => ({
                  title: d.name,
                  subtitle: d.category ? CATEGORY_TEXT[d.category] : undefined,
                  rows: [
                    { label: "Gap", value: formatGap(d.gap), color: gapColor(d.gap) },
                    { label: "Current", value: formatScore(d.current) },
                    { label: "Desired", value: formatScore(d.desired) },
                  ],
                  note:
                    d.direction === "increase"
                      ? "Employees would prefer more of this."
                      : d.direction === "decrease"
                        ? "Employees would prefer less of this."
                        : undefined,
                }))}
              />
              <Bar dataKey="gap" name="Gap" barSize={14} shape={DivergingBarShape} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.name} fill={gapColor(d.gap)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-muted">No gaps can be shown for this group.</p>
      )}
      {narrow && data.length > 0 ? <DimensionKey dimensions={dimensions} /> : null}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Negative gaps indicate a preference for less of a characteristic and are not automatically problems.
        {hidden.length > 0 ? ` Hidden for privacy: ${hidden.map((d) => d.name).join(", ")}.` : ""}
      </p>
    </ChartCard>
  );
}
