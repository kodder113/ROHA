"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import type { ResultsView, TrendPoint } from "@/lib/results/types";
import type { PlanFeatures } from "@/lib/billing/entitlements";
import { Alert } from "@/components/ui/alert";
import { formatGap, formatScore } from "@/lib/utils";
import { CurrentDesiredRadar } from "./current-desired-radar";
import { DepartmentComparisonChart } from "./department-comparison-chart";
import { DistributionChart } from "./distribution-chart";
import { GapChart } from "./gap-chart";
import { HealthBarChart } from "./health-bar-chart";
import { HealthHeatmap } from "./health-heatmap";
import { ParticipationPanel } from "./participation-panel";
import { DimensionalAnalysis, HealthOverview, ItemDetail, MethodologyNote, QualitativePanel } from "./results-sections";
import { SegmentFilter, type SegmentSelection } from "./segment-filter";
import { attributeLabel } from "./segment-utils";
import { TrendChart } from "./trend-chart";

export interface ResultsDashboardProps {
  view: Extract<ResultsView, { status: "ready" }>;
  /** Gates segment comparisons, the heatmap and historical trends. */
  features: PlanFeatures;
  /** Historical points (only used when features.historical_comparisons). */
  trend?: TrendPoint[] | null;
  campaignName: string;
  /** Shows a "Synthetic demonstration data" ribbon. */
  isDemo?: boolean;
}

export function DemoRibbon() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900"
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden />
      Synthetic demonstration data
    </div>
  );
}

export function ResultsDashboard({ view, features, trend, campaignName, isDemo = false }: ResultsDashboardProps) {
  const { payload, participation } = view;
  const segments = payload.segments;
  const comparisonsEnabled = features.segment_comparisons;
  const [selection, setSelection] = useState<SegmentSelection>({ viewBy: "organization", groupKey: null });

  // Resolve the active slice. Segment slices are only honoured when the plan allows them.
  const analysis = comparisonsEnabled && selection.viewBy !== "organization" ? segments[selection.viewBy] : undefined;
  const group = analysis?.segments.find((s) => s.key === selection.groupKey && s.visible && s.result) ?? null;
  const active = group?.result ?? payload.overall;
  const scopeLabel = group ? group.label : "Organization";
  const comparisonAttribute = analysis ? analysis.attribute : null;
  const allHidden = analysis !== undefined && group === null;

  return (
    <div className="space-y-6 animate-fade-in">
      {isDemo ? <DemoRibbon /> : null}
      <p className="sr-only" aria-live="polite">
        Showing results for {campaignName}: {group && analysis ? `${attributeLabel(analysis.attribute)} — ${group.label}` : "whole organization"}.
      </p>

      <HealthOverview result={payload.overall} participation={participation} />

      <SegmentFilter
        segments={segments}
        minGroupSize={payload.minGroupSize}
        enabled={comparisonsEnabled}
        value={comparisonsEnabled ? selection : { viewBy: "organization", groupKey: null }}
        onChange={setSelection}
      />

      {group && analysis ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg bg-navy-50 px-4 py-2.5 text-sm text-navy-800">
          <span>
            <span className="text-muted">{attributeLabel(analysis.attribute)}:</span> <span className="font-semibold">{group.label}</span>
          </span>
          <span className="tabular-nums">
            Current <span className="font-semibold">{formatScore(active.overall.currentIndex)}</span>
          </span>
          <span className="tabular-nums">
            Desired <span className="font-semibold">{formatScore(active.overall.desiredIndex)}</span>
          </span>
          <span className="tabular-nums">
            Gap <span className="font-semibold">{formatGap(active.overall.gap.value)}</span>
          </span>
          {group.n !== null ? <span className="tabular-nums text-muted">{group.n} valid responses</span> : null}
        </div>
      ) : null}
      {allHidden ? (
        <Alert tone="privacy" title="All groups are hidden for this attribute">
          No group is large enough to report without risking identification, so organization-wide results are shown below.
        </Alert>
      ) : null}

      <DimensionalAnalysis dimensions={active.dimensions} scopeLabel={scopeLabel} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CurrentDesiredRadar dimensions={active.dimensions} scopeLabel={scopeLabel} />
        <HealthBarChart dimensions={active.dimensions} scopeLabel={scopeLabel} />
        <GapChart dimensions={active.dimensions} scopeLabel={scopeLabel} />
        <DistributionChart result={active} scopeLabel={scopeLabel} />
      </div>

      {/* Full width: the heatmap needs a column per dimension. */}
      <div className="grid gap-6">
        <DepartmentComparisonChart
          segments={segments}
          organization={payload.overall}
          attribute={comparisonAttribute}
          enabled={comparisonsEnabled}
        />
        <HealthHeatmap segments={segments} organization={payload.overall} attribute={comparisonAttribute} enabled={comparisonsEnabled} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart trend={trend} enabled={features.historical_comparisons} dimensions={payload.overall.dimensions} />
        <ParticipationPanel
          participation={participation}
          excludedResponses={payload.overall.excludedResponses}
          minGroupSize={payload.minGroupSize}
        />
      </div>

      <ItemDetail result={active} scopeLabel={scopeLabel} minGroupSize={payload.minGroupSize} />

      <QualitativePanel qualitative={payload.qualitative} />

      <MethodologyNote payload={payload} />
    </div>
  );
}
