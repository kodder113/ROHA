/**
 * Formatting helpers for the PDF report. Numbers always come from the
 * deterministic snapshot; these helpers only present them.
 */
import type { ReportInputSnapshot } from "../../ai/report-schema";
import { formatDate, formatGap, formatPercent, formatScore } from "../../utils";

export const DASH = "—";

export const fmtScore = (v: number | null | undefined): string => formatScore(v, 1);
// The built-in PDF fonts have no U+2212 minus glyph; use an en dash instead.
export const fmtGap = (v: number | null | undefined): string => formatGap(v, 1).replace(/\u2212/g, "\u2013");
export const fmtPercent = (v: number | null | undefined): string => formatPercent(v, 0);
export const fmtInt = (v: number | null | undefined): string =>
  v === null || v === undefined || Number.isNaN(v) ? DASH : v.toLocaleString("en-US");

export function fmtDate(v: string | null | undefined): string {
  if (!v) return DASH;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return DASH;
  return formatDate(d, { dateStyle: "long", timeZone: "UTC" });
}

export function isNum(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Clamp to the 0–100 index range for chart geometry. */
export function clamp100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/** Maps a dimension key to its display name using the snapshot's dimension list. */
export function dimensionNamer(snapshot: ReportInputSnapshot): (key: string) => string {
  const names = new Map(snapshot.dimensions.map((d) => [d.key, d.name]));
  return (key: string) => names.get(key) ?? humanize(key);
}

export function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function capitalize(s: string | null | undefined): string {
  if (!s) return DASH;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function privacyModeLabel(mode: string): string {
  if (mode === "anonymous") return "Anonymous";
  if (mode === "confidential") return "Confidential";
  return humanize(mode);
}

export function generatorLabel(generator: "anthropic" | "rules", model: string | null): string {
  if (generator === "anthropic") {
    return `AI-assisted narrative (Anthropic Claude${model ? `, model ${model}` : ""})`;
  }
  return "Deterministic rules-based narrative (no AI model used)";
}

/** Short band label for the index, or a dash. */
export function bandLabel(band: string | null | undefined): string {
  return band && band.trim() ? band : DASH;
}
