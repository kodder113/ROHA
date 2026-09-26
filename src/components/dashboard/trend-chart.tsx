"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  version: number;
  validResponses: number;
  current: number | null;
  desired: number | null;
  /** Per-version series values: only the point's own version is set, so lines never join versions. */
  [series: `current_v${number}` | `desired_v${number}`]: number | null;
}

/** Visually distinct stroke patterns so versions stay separate without relying on color alone. */
const VERSION_DASH = ["", "6 4", "2 3"];

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
  const description = "Overall current and desired index across closed assessments, shown separately for each assessment version.";
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

  const versions = Array.from(new Set(points.map((p) => p.assessmentVersion))).sort((a, b) => a - b);
  const multiVersion = versions.length > 1;
  // Series options are per version: a dimension key shared by two versions
  // (e.g. "leadership") measures a different set of items in each.
  const seriesOptions = versions.flatMap((v) => {
    const keys = Array.from(new Set(points.filter((p) => p.assessmentVersion === v).flatMap((p) => Object.keys(p.dimensions))));
    return keys.map((key) => {
      const label = points.find((p) => p.assessmentVersion === v && p.dimensionLabels?.[key])?.dimensionLabels[key] ?? dimensions.find((d) => d.key === key);
      return { value: `v${v}:${key}`, version: v, key, label: label ? `${label.code} — ${label.name}` : key, name: label?.name ?? key };
    });
  });
  const active = series === "overall" ? null : (seriesOptions.find((o) => o.value === series) ?? null);
  const seriesLabel = active ? `${active.name} (assessment version ${active.version})` : "Overall health index";
  const shown = active ? points.filter((p) => p.assessmentVersion === active.version) : points;

  const data: TrendDatum[] = shown.map((p) => {
    const current = active ? (p.dimensions[active.key]?.current ?? null) : p.currentIndex;
    const desired = active ? (p.dimensions[active.key]?.desired ?? null) : p.desiredIndex;
    const row: TrendDatum = {
      id: p.campaignId,
      label: formatDate(p.closedAt, UTC_MONTH),
      name: p.name,
      date: formatDate(p.closedAt, UTC_DATE),
      version: p.assessmentVersion,
      validResponses: p.validResponses,
      current,
      desired,
    };
    for (const v of versions) {
      row[`current_v${v}`] = v === p.assessmentVersion ? current : null;
      row[`desired_v${v}`] = v === p.assessmentVersion ? desired : null;
    }
    return row;
  });
  const lineVersions = active ? [active.version] : versions;
  // First point of each later version, where the chart marks a version boundary.
  const boundaries = active
    ? []
    : versions.slice(1).map((v) => ({ version: v, id: data.find((d) => d.version === v)?.id })).filter((b): b is { version: number; id: string } => !!b.id);

  const summary =
    `Line chart of ${seriesLabel.toLowerCase()} across ${data.length} assessments. ` +
    data.map((d) => `${d.name} (${d.date}, assessment version ${d.version}): current ${formatScore(d.current)}, desired ${formatScore(d.desired)}`).join("; ") +
    "." +
    (multiVersion && !active ? " Assessment versions are shown as separate lines and are not directly comparable." : "");

  return (
    <ChartCard
      title={title}
      description={description}
      summary={summary}
      action={
        seriesOptions.length > 0 ? (
          <div className="w-full sm:w-72">
            <label htmlFor="trend-series" className="sr-only">
              Series
            </label>
            <Select id="trend-series" value={active?.value ?? "overall"} onChange={(e) => setSeries(e.target.value)} className="h-9">
              <option value="overall">Overall health index</option>
              {versions.map((v) => (
                <optgroup key={v} label={`Assessment version ${v}`}>
                  {seriesOptions
                    .filter((o) => o.version === v)
                    .map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </Select>
          </div>
        ) : undefined
      }
      table={{
        caption: `${seriesLabel} by assessment`,
        columns: ["Assessment", "Version", "Closed", "Valid responses", "Current", "Desired"],
        rows: data.map((d) => [d.name, `v${d.version}`, d.date, d.validResponses, formatScore(d.current), formatScore(d.desired)]),
      }}
    >
      <ChartLegend
        className="mb-2"
        items={[
          { label: "Current state", color: CHART.current, shape: "line" },
          { label: "Desired state", color: CHART.desired, shape: "line" },
        ]}
      />
      {multiVersion && !active ? (
        <p className="mb-2 text-xs text-muted">
          {versions.map((v, i) => `Version ${v}: ${i === 0 ? "solid" : i === 1 ? "dashed" : "dotted"} lines`).join(" · ")}. A vertical marker shows where a new
          assessment version begins.
        </p>
      ) : null}
      <div className="h-64 w-full sm:h-72" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 18, right: 16, bottom: 4, left: -16 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="id" tickFormatter={(id: string) => data.find((d) => d.id === id)?.label ?? ""} tick={AXIS_TICK} axisLine={{ stroke: CHART.grid }} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
              content={tooltipFor<TrendDatum>((d) => ({
                title: d.name,
                subtitle: `Assessment version ${d.version} · closed ${d.date} · ${d.validResponses} valid responses`,
                rows: [
                  { label: "Current", value: formatScore(d.current), color: CHART.current },
                  { label: "Desired", value: formatScore(d.desired), color: CHART.desired },
                ],
              }))}
            />
            {boundaries.map((b) => (
              <ReferenceLine
                key={b.version}
                x={b.id}
                stroke={CHART.axis}
                strokeWidth={1}
                strokeDasharray="4 3"
                label={{ value: `v${b.version}`, position: "top", fontSize: 11, fontWeight: 600, fill: CHART.axis }}
              />
            ))}
            {lineVersions.flatMap((v) => {
              const dash = VERSION_DASH[Math.min(versions.indexOf(v), VERSION_DASH.length - 1)] || undefined;
              return [
                <Line
                  key={`current_v${v}`}
                  type="linear"
                  dataKey={`current_v${v}`}
                  name={`Current state (version ${v})`}
                  stroke={CHART.current}
                  strokeWidth={2}
                  strokeDasharray={dash}
                  dot={{ r: 4, fill: CHART.current, stroke: CHART.surface, strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: CHART.surface, strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />,
                <Line
                  key={`desired_v${v}`}
                  type="linear"
                  dataKey={`desired_v${v}`}
                  name={`Desired state (version ${v})`}
                  stroke={CHART.desired}
                  strokeWidth={2}
                  strokeDasharray={dash}
                  dot={{ r: 4, fill: CHART.desired, stroke: CHART.surface, strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: CHART.surface, strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />,
              ];
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted">
        {multiVersion
          ? "Assessment versions use different dimensions, items and inclusion rules, so their overall and dimension scores are not directly comparable and no change is calculated between them. Within a version, changes in who responded can also affect scores."
          : "Compare assessments with care: changes in who responded can affect scores."}
      </p>
    </ChartCard>
  );
}
