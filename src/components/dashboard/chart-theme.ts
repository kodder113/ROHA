/**
 * Chart parameters for the ROHA results dashboard.
 *
 * Colors were checked with the dataviz palette validator against a white
 * surface: current ↔ desired and positive ↔ negative gap both clear the CVD
 * (ΔE ≥ 16) and normal-vision floors. The Likert scale is a diverging pair
 * (red ↔ navy, warm/cool) around a neutral gray midpoint; each arm is a single
 * hue that steps light → dark. The heatmap uses one hue (navy), binned.
 */
import type { DimensionResult, Distribution } from "@/lib/scoring/types";

export const CHART = {
  current: "#18335f",
  desired: "#059669",
  gapPositive: "#b45309",
  gapNegative: "#6d28d9",
  grid: "#e2e7ef",
  axis: "#5a6778",
  ink: "#0f1b2d",
  muted: "#5a6778",
  surface: "#ffffff",
  hiddenFill: "#eef1f5",
} as const;

export const AXIS_TICK = { fill: CHART.axis, fontSize: 12 } as const;

export const LIKERT: { key: string; label: string; short: string; color: string; text: string }[] = [
  { key: "r1", label: "Strongly disagree", short: "SD", color: "#b42318", text: "#ffffff" },
  { key: "r2", label: "Disagree", short: "D", color: "#e8998d", text: "#0f1b2d" },
  { key: "r3", label: "Neutral", short: "N", color: "#cfd6df", text: "#0f1b2d" },
  { key: "r4", label: "Agree", short: "A", color: "#8ea6c9", text: "#0f1b2d" },
  { key: "r5", label: "Strongly agree", short: "SA", color: "#18335f", text: "#ffffff" },
];

/** Sequential single-hue bins for 0–100 indices (heatmap). */
export const HEAT_BINS: { min: number; max: number; color: string; text: string }[] = [
  { min: 0, max: 20, color: "#e3e9f2", text: "#0f1b2d" },
  { min: 20, max: 40, color: "#c3d0e3", text: "#0f1b2d" },
  { min: 40, max: 60, color: "#8ea6c9", text: "#0f1b2d" },
  { min: 60, max: 80, color: "#34598f", text: "#ffffff" },
  { min: 80, max: 100.0001, color: "#18335f", text: "#ffffff" },
];

export function heatBin(score: number) {
  return HEAT_BINS.find((b) => score >= b.min && score < b.max) ?? HEAT_BINS[HEAT_BINS.length - 1];
}

/**
 * Converts rating counts into display shares (percent of numeric ratings).
 * Returns null when there is nothing to show (no ratings, or redacted cells,
 * which arrive as all-zero distributions).
 */
export function distributionShares(dist: Distribution | null | undefined): number[] | null {
  if (!dist || dist.length === 0) return null;
  const total = dist.reduce((s, v) => s + v, 0);
  if (total <= 0) return null;
  return LIKERT.map((_, i) => ((dist[i] ?? 0) / total) * 100);
}

export function dimensionShortLabel(d: Pick<DimensionResult, "code" | "name">, narrow: boolean): string {
  return narrow ? d.code : d.name;
}

export function gapColor(value: number | null): string {
  if (value === null) return CHART.hiddenFill;
  return value >= 0 ? CHART.gapPositive : CHART.gapNegative;
}

export const UPGRADE_HREF = "/app/settings/billing";
