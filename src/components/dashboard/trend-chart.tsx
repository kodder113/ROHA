"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/results/types";
import type { DimensionResult } from "@/lib/scoring/types";
import { EmptyState } from "@/components/ui/misc";
import { Select } from "@/components/ui/form";
import { formatDate, formatScore } from "@/lib/utils";
import { AXIS_TICK, CHART } from "./chart-theme";
import { ChartCard, ChartLegend, LockedState, tooltipFor } from "./chart-primitives";

interface TrendDatum {
  id: string;
  label: string;
  name: string;
  date: string;
  validResponses: number;
  current: number | null;
  desired: number | null;
}

const UTC_DATE: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeZone: "UTC" };
const UTC_MONTH: Intl.DateTimeFormatOptions = { month: "short", year: "numeric", timeZone: "UTC" };

export function TrendChart({
  trend,
  enabled,
  dimensions = [],
}: {
  trend?: TrendPoint[] | null;
  /** features.historical_comparisons */
  enabled: boolean;
  /** Used to label dimension series (key → name). */
  dimensions?: Pick<DimensionResult, "key" | "code" | "name">[];
}) {
  const [series, setSeries] = useState<string>("overall");
  const title = "Organizational health over time";
  const description = "Overall current and desired index across closed assessments.";

  if (!enabled) {
    return (
      <ChartCard title={title} description={description}>
        <LockedState
          title="Track progress across assessments"
          description="Historical trend comparisons are available on ROHA Enterprise."
          planName="ROHA Enterprise"
        />
      </ChartCard>
    );
  }

  const points = [...(trend ?? [])].sort((a, b) => a.closedAt.localeCompare(b.closedAt));
  if (points.length < 2) {
    return (
      <ChartCard title={title} description={description}>
        <EmptyState
          icon={<TrendingUp className="h-6 w-6" aria-hidden />}
          title="Trends appear after two closed assessments"
          description="Once your organization has closed at least two assessments, this chart shows how health has changed between them."
        />
      </ChartCard>
    );
  }

  const dimKeys = Array.from(new Set(points.flatMap((p) => Object.keys(p.dimensions))));
  const dimMeta = (key: string) => dimensions.find((d) => d.key === key);
  const activeDim = series !== "overall" && dimKeys.includes(series) ? series : null;
  const seriesLabel = activeDim ? (dimMeta(activeDim)?.name ?? activeDim) : "Overall health index";

  const data: TrendDatum[] = points.map((p) => ({
    id: p.campaignId,
    label: formatDate(p.closedAt, UTC_MONTH),
    name: p.name,
    date: formatDate(p.closedAt, UTC_DATE),
    validResponses: p.validResponses,
    current: activeDim ? (p.dimensions[activeDim]?.current ?? null) : p.currentIndex,
    desired: activeDim ? (p.dimensions[activeDim]?.desired ?? null) : p.desiredIndex,
  }));

  const summary =
    `Line chart of ${seriesLabel.toLowerCase()} across ${data.length} assessments. ` +
    data.map((d) => `${d.name} (${d.date}): current ${formatScore(d.current)}, desired ${formatScore(d.desired)}`).join("; ") +
    ".";

  return (
    <ChartCard
      title={title}
      description={description}
      summary={summary}
      action={
        dimKeys.length > 0 ? (
          <div className="w-full sm:w-60">
            <label htmlFor="trend-series" className="sr-only">
              Series
            </label>
            <Select id="trend-series" value={activeDim ?? "overall"} onChange={(e) => setSeries(e.target.value)} className="h-9">
              <option value="overall">Overall health index</option>
              {dimKeys.map((k) => {
                const m = dimMeta(k);
                return (
                  <option key={k} value={k}>
                    {m ? `${m.code} — ${m.name}` : k}
                  </option>
                );
              })}
            </Select>
          </div>
        ) : undefined
      }
      table={{
        caption: `${seriesLabel} by assessment`,
        columns: ["Assessment", "Closed", "Valid responses", "Current", "Desired"],
        rows: data.map((d) => [d.name, d.date, d.validResponses, formatScore(d.current), formatScore(d.desired)]),
      }}
    >
      <ChartLegend
        className="mb-2"
        items={[
          { label: "Current state", color: CHART.current, shape: "line" },
          { label: "Desired state", color: CHART.desired, shape: "line" },
        ]}
      />
      <div className="h-64 w-full sm:h-72" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="id" tickFormatter={(id: string) => data.find((d) => d.id === id)?.label ?? ""} tick={AXIS_TICK} axisLine={{ stroke: CHART.grid }} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
              content={tooltipFor<TrendDatum>((d) => ({
                title: d.name,
                subtitle: `Closed ${d.date} · ${d.validResponses} valid responses`,
                rows: [
                  { label: "Current", value: formatScore(d.current), color: CHART.current },
                  { label: "Desired", value: formatScore(d.desired), color: CHART.desired },
                ],
              }))}
            />
            <Line
              type="linear"
              dataKey="current"
              name="Current state"
              stroke={CHART.current}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART.current, stroke: CHART.surface, strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: CHART.surface, strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="desired"
              name="Desired state"
              stroke={CHART.desired}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART.desired, stroke: CHART.surface, strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: CHART.surface, strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted">
        Compare assessments with care: changes in who responded, or in the assessment version, can affect scores.
      </p>
    </ChartCard>
  );
}
