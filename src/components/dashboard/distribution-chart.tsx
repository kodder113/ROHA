"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AssessmentResult, Distribution } from "@/lib/scoring/types";
import { Select } from "@/components/ui/form";
import { formatPercent } from "@/lib/utils";
import { AXIS_TICK, CHART, LIKERT, distributionShares } from "./chart-theme";
import { ChartCard, ChartLegend, SegmentedToggle, tooltipFor, useIsNarrow } from "./chart-primitives";

type Level = "dimension" | "items";
type Perspective = "current" | "desired";

interface DistDatum {
  label: string;
  name: string;
  detail?: string;
  n: number;
  naCount: number;
  hidden: boolean;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  r5: number | null;
}

function toDatum(label: string, name: string, dist: Distribution, n: number, naCount: number, detail?: string): DistDatum {
  const shares = distributionShares(dist);
  return {
    label,
    name,
    detail,
    n,
    naCount,
    hidden: shares === null,
    r1: shares ? shares[0] : null,
    r2: shares ? shares[1] : null,
    r3: shares ? shares[2] : null,
    r4: shares ? shares[3] : null,
    r5: shares ? shares[4] : null,
  };
}

const PERSPECTIVE_LABEL: Record<Perspective, string> = { current: "Current state", desired: "Desired state" };

export function DistributionChart({ result, scopeLabel }: { result: AssessmentResult; scopeLabel: string }) {
  const narrow = useIsNarrow();
  const [level, setLevel] = useState<Level>("dimension");
  const [perspective, setPerspective] = useState<Perspective>("current");
  const [dimensionKey, setDimensionKey] = useState<string>(result.dimensions[0]?.key ?? "");

  const activeDimension = result.dimensions.find((d) => d.key === dimensionKey) ?? result.dimensions[0];

  const data: DistDatum[] =
    level === "dimension"
      ? result.dimensions.map((d) =>
          toDatum(narrow ? d.code : d.name, d.name, d[perspective].distribution, d[perspective].n, d[perspective].naCount),
        )
      : result.questions
          .filter((q) => q.dimensionKey === activeDimension?.key)
          .map((q) => toDatum(narrow ? q.key : q.focus, `${q.key} · ${q.focus}`, q[perspective].distribution, q[perspective].n, q[perspective].naCount, q.prompt));

  const scopeText = level === "dimension" ? "all dimensions" : (activeDimension?.name ?? "");
  const summary =
    `100% stacked bar chart of ${PERSPECTIVE_LABEL[perspective].toLowerCase()} ratings for ${scopeText}, ${scopeLabel}. ` +
    data
      .map((d) =>
        d.hidden
          ? `${d.name}: hidden for privacy`
          : `${d.name}: ` + LIKERT.map((l, i) => `${formatPercent([d.r1, d.r2, d.r3, d.r4, d.r5][i])} ${l.label.toLowerCase()}`).join(", "),
      )
      .join("; ") +
    ".";

  return (
    <ChartCard
      title="Employee response distribution"
      description="Share of ratings at each point of the five-point scale (Not applicable excluded)."
      summary={summary}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedToggle<Level>
            label="Level of detail"
            value={level}
            onChange={setLevel}
            options={[
              { value: "dimension", label: "Dimensions" },
              { value: "items", label: "Items" },
            ]}
          />
          <SegmentedToggle<Perspective>
            label="Perspective"
            value={perspective}
            onChange={setPerspective}
            options={[
              { value: "current", label: "Current" },
              { value: "desired", label: "Desired" },
            ]}
          />
        </div>
      }
      table={{
        caption: `Response distribution (${PERSPECTIVE_LABEL[perspective]}) — ${scopeText}, ${scopeLabel}`,
        columns: [level === "dimension" ? "Dimension" : "Item", ...LIKERT.map((l) => l.label), "n", "N/A"],
        rows: data.map((d) => [
          d.name,
          ...[d.r1, d.r2, d.r3, d.r4, d.r5].map((v) => (d.hidden ? "Hidden" : formatPercent(v))),
          d.hidden ? "—" : d.n,
          d.naCount,
        ]),
      }}
    >
      {level === "items" ? (
        <div className="mb-3 max-w-sm">
          <label htmlFor="dist-dimension" className="sr-only">
            Dimension
          </label>
          <Select id="dist-dimension" value={activeDimension?.key ?? ""} onChange={(e) => setDimensionKey(e.target.value)}>
            {result.dimensions.map((d) => (
              <option key={d.key} value={d.key}>
                {d.code} — {d.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <ChartLegend className="mb-2" items={LIKERT.map((l) => ({ label: l.label, color: l.color }))} />
      <div className="w-full" style={{ height: data.length * 40 + 36 }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" stackOffset="none" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barCategoryGap="28%">
            <CartesianGrid horizontal={false} stroke={CHART.grid} />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={narrow ? 40 : 200}
              tick={{ ...AXIS_TICK, fill: CHART.ink }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(24, 51, 95, 0.04)" }}
              content={tooltipFor<DistDatum>((d) => ({
                title: d.name,
                subtitle: d.detail,
                rows: d.hidden
                  ? []
                  : LIKERT.map((l, i) => ({ label: l.label, value: formatPercent([d.r1, d.r2, d.r3, d.r4, d.r5][i]), color: l.color })),
                note: d.hidden ? "Hidden for privacy — too few ratings." : `n = ${d.n}${d.naCount ? ` · ${d.naCount} not applicable` : ""}`,
              }))}
            />
            {LIKERT.map((l, i) => (
              <Bar
                key={l.key}
                dataKey={l.key}
                name={l.label}
                stackId="dist"
                fill={l.color}
                stroke={CHART.surface}
                strokeWidth={2}
                barSize={16}
                radius={i === 0 ? [4, 0, 0, 4] : i === LIKERT.length - 1 ? [0, 4, 4, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.some((d) => d.hidden) ? (
        <p className="mt-2 text-xs text-muted">Rows without bars are hidden for privacy because too few people gave a rating.</p>
      ) : null}
    </ChartCard>
  );
}
