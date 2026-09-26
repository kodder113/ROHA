"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SegmentAttribute } from "@/lib/results/segments";
import type { AssessmentResult } from "@/lib/scoring/types";
import { EmptyState } from "@/components/ui/misc";
import { Select } from "@/components/ui/form";
import { formatGap, formatScore } from "@/lib/utils";
import { AXIS_TICK, CHART } from "./chart-theme";
import { ChartCard, ChartLegend, LockedState, tooltipFor, useIsNarrow } from "./chart-primitives";
import { HiddenGroupsList } from "./hidden-groups-list";
import { attributeLabel, hiddenSegments, pickComparisonAttribute, visibleSegments, type Segments } from "./segment-utils";

interface GroupDatum {
  label: string;
  name: string;
  n: number | null;
  current: number | null;
  desired: number | null;
  gap: number | null;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function DepartmentComparisonChart({
  segments,
  organization,
  attribute,
  enabled,
}: {
  segments: Segments;
  organization: AssessmentResult;
  /** Attribute to compare; defaults to department, then the first available. */
  attribute?: SegmentAttribute | null;
  /** features.segment_comparisons */
  enabled: boolean;
}) {
  const narrow = useIsNarrow();
  const [measure, setMeasure] = useState<string>("overall");
  const resolved = pickComparisonAttribute(segments, attribute);
  const title = resolved ? `${attributeLabel(resolved)} comparison` : "Departmental comparison";
  const description = "Current and desired health for each group large enough to report.";

  if (!enabled) {
    return (
      <ChartCard title="Departmental comparison" description={description}>
        <LockedState
          title="Compare departments and other groups"
          description="Departmental comparisons are available on ROHA Professional and above."
          planName="ROHA Professional"
        />
      </ChartCard>
    );
  }

  const analysis = resolved ? segments[resolved] : undefined;
  if (!resolved || !analysis) {
    return (
      <ChartCard title={title} description={description}>
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden />}
          title="No group comparisons for this assessment"
          description="Comparisons appear when the assessment asks optional demographic questions such as department."
        />
      </ChartCard>
    );
  }

  const visible = visibleSegments(analysis);
  const hidden = hiddenSegments(analysis);
  const dimension = organization.dimensions.find((d) => d.key === measure) ?? null;
  const measureLabel = dimension ? dimension.name : "Overall health index";

  const pick = (r: AssessmentResult) => {
    if (!dimension) return { current: r.overall.currentIndex, desired: r.overall.desiredIndex, gap: r.overall.gap.value };
    const d = r.dimensions.find((x) => x.key === dimension.key);
    return { current: d?.current.score ?? null, desired: d?.desired.score ?? null, gap: d?.gap.value ?? null };
  };

  const data: GroupDatum[] = visible.map((s) => ({
    label: truncate(s.label, narrow ? 12 : 26),
    name: s.label,
    n: s.n,
    ...pick(s.result!),
  }));
  const orgValue = pick(organization).current;

  const summary =
    `Bar chart comparing ${measureLabel.toLowerCase()} across ${attributeLabel(resolved).toLowerCase()} groups. ` +
    data.map((d) => `${d.name}: current ${formatScore(d.current)}, desired ${formatScore(d.desired)}`).join("; ") +
    `. Organization current: ${formatScore(orgValue)}. ${hidden.length} group(s) hidden for privacy.`;

  return (
    <ChartCard
      title={title}
      description={description}
      summary={summary}
      action={
        <div className="w-full sm:w-64">
          <label htmlFor="comparison-measure" className="sr-only">
            Measure
          </label>
          <Select id="comparison-measure" value={measure} onChange={(e) => setMeasure(e.target.value)} className="h-9">
            <option value="overall">Overall health index</option>
            {organization.dimensions.map((d) => (
              <option key={d.key} value={d.key}>
                {d.code} — {d.name}
              </option>
            ))}
          </Select>
        </div>
      }
      table={{
        caption: `${measureLabel} by ${attributeLabel(resolved).toLowerCase()}`,
        columns: ["Group", "Current", "Desired", "Gap", "Valid responses"],
        rows: [
          ...data.map((d) => [d.name, formatScore(d.current), formatScore(d.desired), formatGap(d.gap), d.n ?? "—"]),
          ...hidden.map((h) => [h.label, "Hidden", "Hidden", "Hidden", "—"]),
        ],
      }}
    >
      <ChartLegend
        className="mb-2"
        items={[
          { label: "Current state", color: CHART.current },
          { label: "Desired state", color: CHART.desired },
          { label: `Organization current (${formatScore(orgValue)})`, color: CHART.axis, shape: "line" },
        ]}
      />
      {data.length > 0 ? (
        <div className="w-full" style={{ height: data.length * 48 + 36 }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={2} barCategoryGap="26%">
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={narrow ? 92 : 170}
                tick={{ ...AXIS_TICK, fill: CHART.ink }}
                axisLine={false}
                tickLine={false}
              />
              {orgValue !== null ? <ReferenceLine x={orgValue} stroke={CHART.axis} strokeWidth={1} strokeDasharray="3 3" /> : null}
              <Tooltip
                cursor={{ fill: "rgba(24, 51, 95, 0.04)" }}
                content={tooltipFor<GroupDatum>((d) => ({
                  title: d.name,
                  subtitle: measureLabel,
                  rows: [
                    { label: "Current", value: formatScore(d.current), color: CHART.current },
                    { label: "Desired", value: formatScore(d.desired), color: CHART.desired },
                    { label: "Gap", value: formatGap(d.gap) },
                  ],
                  note: d.current === null ? "Hidden for privacy — too few ratings." : d.n !== null ? `${d.n} valid responses` : undefined,
                }))}
              />
              <Bar dataKey="current" name="Current state" fill={CHART.current} barSize={10} radius={[0, 4, 4, 0]} isAnimationActive={false} />
              <Bar dataKey="desired" name="Desired state" fill={CHART.desired} barSize={10} radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted">
          Every group is hidden for privacy. Only the organization-wide results can be reported for this attribute.
        </p>
      )}
      <HiddenGroupsList groups={hidden} className="mt-4 border-t border-line pt-3" />
    </ChartCard>
  );
}
