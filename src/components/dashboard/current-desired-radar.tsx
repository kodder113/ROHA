"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DimensionResult } from "@/lib/scoring/types";
import { formatGap, formatScore } from "@/lib/utils";
import { AXIS_TICK, CHART } from "./chart-theme";
import { ChartCard, ChartLegend, DimensionKey, tooltipFor } from "./chart-primitives";

interface RadarDatum {
  code: string;
  name: string;
  current: number;
  desired: number;
  gap: number | null;
}

export function CurrentDesiredRadar({ dimensions, scopeLabel }: { dimensions: DimensionResult[]; scopeLabel: string }) {
  const data: RadarDatum[] = dimensions
    .filter((d) => d.current.score !== null && d.desired.score !== null)
    .map((d) => ({ code: d.code, name: d.name, current: d.current.score!, desired: d.desired.score!, gap: d.gap.value }));
  const hidden = dimensions.filter((d) => d.current.score === null || d.desired.score === null);

  const summary =
    data.length > 0
      ? `Radar chart for ${scopeLabel}. ` +
        data.map((d) => `${d.name}: current ${formatScore(d.current)}, desired ${formatScore(d.desired)}`).join("; ") +
        "."
      : `No dimension scores are available for ${scopeLabel}.`;

  return (
    <ChartCard
      title="Current vs. desired profile"
      description={`How ${scopeLabel === "Organization" ? "employees" : scopeLabel} rate each dimension today and where they would like it to be.`}
      summary={summary}
      table={{
        caption: `Current and desired scores by dimension — ${scopeLabel}`,
        columns: ["Dimension", "Current", "Desired", "Gap"],
        rows: dimensions.map((d) => [d.name, formatScore(d.current.score), formatScore(d.desired.score), formatGap(d.gap.value)]),
      }}
    >
      <ChartLegend
        className="mb-2"
        items={[
          { label: "Current state", color: CHART.current, shape: "line" },
          { label: "Desired state", color: CHART.desired, shape: "line" },
        ]}
      />
      {data.length >= 3 ? (
        <div className="h-72 w-full sm:h-80" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid stroke={CHART.grid} />
              <PolarAngleAxis dataKey="code" tick={{ ...AXIS_TICK, fontWeight: 600 }} />
              <PolarRadiusAxis domain={[0, 100]} tickCount={5} angle={90} tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} />
              <Radar
                name="Current state"
                dataKey="current"
                stroke={CHART.current}
                strokeWidth={2}
                fill={CHART.current}
                fillOpacity={0.1}
                dot={{ r: 4, fill: CHART.current, stroke: CHART.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Radar
                name="Desired state"
                dataKey="desired"
                stroke={CHART.desired}
                strokeWidth={2}
                fill={CHART.desired}
                fillOpacity={0.08}
                dot={{ r: 4, fill: CHART.desired, stroke: CHART.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Tooltip
                cursor={false}
                content={tooltipFor<RadarDatum>((d) => ({
                  title: d.name,
                  rows: [
                    { label: "Current", value: formatScore(d.current), color: CHART.current },
                    { label: "Desired", value: formatScore(d.desired), color: CHART.desired },
                    { label: "Gap", value: formatGap(d.gap) },
                  ],
                }))}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-muted">
          Too few dimensions have enough ratings to draw a profile for this group.
        </p>
      )}
      {data.length >= 3 ? <DimensionKey dimensions={dimensions} /> : null}
      {hidden.length > 0 ? (
        <p className="mt-2 text-xs text-muted">
          Hidden for privacy: {hidden.map((d) => d.name).join(", ")} (too few ratings).
        </p>
      ) : null}
    </ChartCard>
  );
}
