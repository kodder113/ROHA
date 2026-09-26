"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ParticipationSummary } from "@/lib/results/types";
import { cn, formatDate, formatPercent } from "@/lib/utils";
import { AXIS_TICK, CHART } from "./chart-theme";
import { ChartCard, tooltipFor } from "./chart-primitives";

interface DayDatum {
  day: string;
  label: string;
  full: string;
  submissions: number;
}

const DAY_SHORT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
const DAY_FULL: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" };

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold text-navy-900">{value}</dd>
      {hint ? <dd className="text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}

export function ParticipationPanel({
  participation,
  excludedResponses,
  minGroupSize,
  className,
}: {
  participation: ParticipationSummary;
  /** Responses excluded by the scoring engine, when known. */
  excludedResponses?: number | null;
  /** Shown as context for the reporting threshold. */
  minGroupSize?: number;
  className?: string;
}) {
  const { responses, validResponses, expected, rate, daily } = participation;
  const excluded =
    excludedResponses ?? (validResponses !== null && responses >= validResponses ? responses - validResponses : null);
  const clampedRate = rate === null ? null : Math.max(0, Math.min(100, rate));

  const data: DayDatum[] = daily.map((d) => ({
    day: d.day,
    label: formatDate(d.day, DAY_SHORT),
    full: formatDate(d.day, DAY_FULL),
    submissions: d.submissions,
  }));
  const peak = data.reduce<DayDatum | null>((m, d) => (m === null || d.submissions > m.submissions ? d : m), null);

  const summary =
    `Participation: ${responses} responses` +
    (expected !== null ? ` of ${expected} expected (${formatPercent(rate)})` : "") +
    (validResponses !== null ? `, ${validResponses} valid` : "") +
    (excluded ? `, ${excluded} excluded` : "") +
    `. Daily submissions over ${data.length} days` +
    (peak ? `, peaking at ${peak.submissions} on ${peak.full}.` : ".");

  return (
    <ChartCard
      className={className}
      title="Participation"
      description="Who has responded, and when."
      summary={summary}
      table={
        data.length > 0
          ? { caption: "Daily submissions", columns: ["Day", "Submissions"], rows: data.map((d) => [d.full, d.submissions]) }
          : null
      }
    >
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Figure
          label="Response rate"
          value={clampedRate !== null ? formatPercent(clampedRate) : "—"}
          hint={expected !== null ? `${responses.toLocaleString("en-US")} of ${expected.toLocaleString("en-US")} expected` : "Expected participants not set"}
        />
        <Figure label="Responses" value={responses.toLocaleString("en-US")} />
        <Figure label="Valid" value={validResponses !== null ? validResponses.toLocaleString("en-US") : "—"} hint={validResponses === null ? "Counted at close" : undefined} />
        <Figure
          label="Excluded"
          value={excluded !== null ? excluded.toLocaleString("en-US") : "—"}
          hint={excluded ? "Too few items answered" : undefined}
        />
      </dl>

      {clampedRate !== null ? (
        <div className="mt-4">
          <div
            role="meter"
            aria-label="Response rate"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clampedRate)}
            className="h-2 w-full overflow-hidden rounded-full bg-emerald-100"
          >
            <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-700" style={{ width: `${clampedRate}%` }} />
          </div>
          {minGroupSize ? (
            <p className="mt-1.5 text-xs text-muted">Results are reported only when at least {minGroupSize} valid responses are received.</p>
          ) : null}
        </div>
      ) : minGroupSize ? (
        <p className="mt-4 text-xs text-muted">Results are reported only when at least {minGroupSize} valid responses are received.</p>
      ) : null}

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold text-navy-800">Daily submissions</p>
        {data.length > 0 ? (
          <div className={cn("h-40 w-full")} aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} minTickGap={12} />
                <YAxis allowDecimals={false} tick={{ ...AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  cursor={{ fill: "rgba(24, 51, 95, 0.05)" }}
                  content={tooltipFor<DayDatum>((d) => ({
                    title: d.full,
                    rows: [{ label: "Submissions", value: d.submissions.toLocaleString("en-US"), color: CHART.current }],
                  }))}
                />
                <Bar dataKey="submissions" name="Submissions" fill={CHART.current} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="rounded-lg bg-canvas px-3 py-6 text-center text-sm text-muted">No submissions yet.</p>
        )}
      </div>
    </ChartCard>
  );
}
