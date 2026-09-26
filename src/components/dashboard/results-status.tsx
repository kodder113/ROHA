"use client";

import { Clock, ShieldCheck } from "lucide-react";
import type { ResultsView } from "@/lib/results/types";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { DemoRibbon } from "./results-dashboard";
import { ParticipationPanel } from "./participation-panel";

export function ResultsNotReleased({
  view,
  isDemo = false,
}: {
  view: Extract<ResultsView, { status: "not_released" }>;
  isDemo?: boolean;
}) {
  const closes = formatDate(view.closesAt, { dateStyle: "long", timeZone: "UTC" });
  return (
    <div className="space-y-6 animate-fade-in">
      {isDemo ? <DemoRibbon /> : null}
      <Alert tone="privacy" title="Results are not available yet">
        <span className="flex items-start gap-1.5">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Results are released when the campaign closes on {closes} to protect respondent confidentiality.
        </span>
      </Alert>
      <ParticipationPanel participation={view.participation} />
    </div>
  );
}

export function ResultsInsufficient({
  view,
  isDemo = false,
}: {
  view: Extract<ResultsView, { status: "insufficient" }>;
  isDemo?: boolean;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {isDemo ? <DemoRibbon /> : null}
      <Alert tone="privacy" title="Not enough responses to report results">
        <span className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            ROHA reports results only when at least {view.minGroupSize} valid responses have been received, so that no individual&apos;s
            answers can be identified. This campaign closed below that threshold; no scores are shown.
          </span>
        </span>
      </Alert>
      <ParticipationPanel participation={view.participation} minGroupSize={view.minGroupSize} />
    </div>
  );
}
