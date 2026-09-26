"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DimensionResult } from "@/lib/scoring/types";
import { formatGap, formatScore } from "@/lib/utils";
import { AXIS_TICK, CHART, dimensionShortLabel } from "./chart-theme";
import { ChartCard, ChartLegend, DimensionKey, tooltipFor, useIsNarrow } from "./chart-primitives";

interface BarDatum {
  label: string;
  name: string;
  current: number | null;
  desired: number | null;
  gap: number | null;
  band: string | null;
  n: number;
}

export function HealthBarChart({ dimensions, scopeLabel }: { dimensions: DimensionResult[]; scopeLabel: string }) {
  const narrow = useIsNarrow();
  const data: BarDatum[] = dimensions.map((d) => ({
    label: dimensionShortLabel(d, narrow),
    name: d.name,
    current: d.current.score,
    desired: d.desired.score,
    gap: d.gap.value,
    band: d.band,
    n: d.current.n,
  }));

  const summary =
    `Bar chart of current and desired scores (0 to 100) by dimension for ${scopeLabel}. ` +
    data
      .map((d) =>
        d.current === null ? `${d.name}: hidden for privacy` : `${d.name}: current ${formatScore(d.current)}, desired ${formatScore(d.desired)}`,
      )
      .join("; ") +
    ".";

  return (
    <ChartCard
      title="Organizational health by dimension"
      description="Current and desired scores side by side on a 0–100 index."
      summary={summary}
      table={{
        caption: `Organizational health by dimension — ${scopeLabel}`,
        columns: ["Dimension", "Current", "Desired", "Gap", "Band"],
        rows: data.map((d) => [d.name, formatScore(d.current), formatScore(d.desired), formatGap(d.gap), d.band ?? "—"]),
      }}
    >
      <ChartLegend
        className="mb-2"
        items={[
          { label: "Current state", color: CHART.current },
          { label: "Desired state", color: CHART.desired },
        ]}
      />
      <div className="w-full" style={{ height: data.length * 52 + 36 }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid horizontal={false} stroke={CHART.grid} />
            <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={narrow ? 36 : 188}
              tick={{ ...AXIS_TICK, fill: CHART.ink }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(24, 51, 95, 0.04)" }}
              content={tooltipFor<BarDatum>((d) => ({
                title: d.name,
                subtitle: d.band ?? undefined,
                rows: [
                  { label: "Current", value: formatScore(d.current), color: CHART.current },
                  { label: "Desired", value: formatScore(d.desired), color: CHART.desired },
                  { label: "Gap", value: formatGap(d.gap) },
                ],
                note: d.current === null ? "Hidden for privacy — too few ratings." : `n = ${d.n}`,
              }))}
            />
            <Bar dataKey="current" name="Current state" fill={CHART.current} barSize={10} radius={[0, 4, 4, 0]} isAnimationActive={false} />
            <Bar dataKey="desired" name="Desired state" fill={CHART.desired} barSize={10} radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {narrow ? <DimensionKey dimensions={dimensions} /> : null}
    </ChartCard>
  );
}
