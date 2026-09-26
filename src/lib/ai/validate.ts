/**
 * Guards against invented statistics in AI narrative: every number that looks
 * like a statistic must match a value present in the input snapshot.
 */
import type { ExecutiveReport, ReportInputSnapshot } from "./report-schema";

function collectAllowed(snapshot: ReportInputSnapshot): Set<string> {
  const allowed = new Set<string>();
  const add = (v: number | null | undefined) => {
    if (v === null || v === undefined || Number.isNaN(v)) return;
    const r1 = Math.round(v * 10) / 10;
    allowed.add(r1.toFixed(1));
    allowed.add(String(Math.round(v)));
    allowed.add(Math.abs(r1).toFixed(1));
    allowed.add(String(Math.abs(Math.round(v))));
  };
  add(snapshot.participation.responses);
  add(snapshot.participation.validResponses);
  add(snapshot.participation.expected);
  add(snapshot.participation.ratePercent);
  add(snapshot.overall.currentIndex);
  add(snapshot.overall.desiredIndex);
  add(snapshot.overall.gap);
  add(snapshot.methodology.minGroupSize);
  add(snapshot.methodology.scoringRuleVersion);
  add(snapshot.methodology.assessmentVersion);
  for (const d of snapshot.dimensions) [d.current, d.desired, d.gap, d.respondents, d.notApplicable].forEach(add);
  for (const i of snapshot.items) [i.current, i.desired, i.gap, i.respondents, i.notApplicable, i.currentFavorablePercent].forEach(add);
  for (const c of snapshot.comments) add(c.count);
  // Structural numbers that are always legitimate.
  for (const n of [0, 1, 2, 3, 4, 5, 6, 12, 24, 30, 48, 60, 90, 100]) allowed.add(String(n));
  return allowed;
}

function textFields(report: ExecutiveReport): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") out.push({ path, text: value });
    else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(report, "");
  return out;
}

// Numbers such as 42, 42.5, 42.5%, but not item keys like LE1 or phase labels.
const NUMBER = /(?<![A-Za-z0-9.])[-+−]?\d+(?:\.\d+)?(?![A-Za-z0-9])/g;

export interface NumericWarning {
  path: string;
  value: string;
  context: string;
}

export function findUnsupportedNumbers(report: ExecutiveReport, snapshot: ReportInputSnapshot): NumericWarning[] {
  const allowed = collectAllowed(snapshot);
  const warnings: NumericWarning[] = [];
  for (const { path, text } of textFields(report)) {
    if (path.endsWith("phase") || path.endsWith("dimension_key") || path.endsWith("question_key")) continue;
    for (const match of text.matchAll(NUMBER)) {
      const raw = match[0].replace(/^[+−-]/, "");
      const value = Number(raw);
      if (Number.isNaN(value)) continue;
      // Years and day ranges (e.g. 2026, "within 30 days") are not statistics.
      if (value >= 1900 && value <= 2100) continue;
      const candidates = [raw, value.toFixed(1), String(Math.round(value))];
      if (candidates.some((c) => allowed.has(c))) continue;
      const start = Math.max(0, (match.index ?? 0) - 40);
      warnings.push({ path, value: match[0], context: text.slice(start, (match.index ?? 0) + raw.length + 40) });
    }
  }
  return warnings;
}
