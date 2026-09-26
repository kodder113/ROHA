import type { ResultsPayload } from "./types";
import { ATTRIBUTE_LABELS, type SegmentAttribute } from "./segments";
import { round1 } from "@/lib/scoring/engine";
import type { AssessmentResult } from "@/lib/scoring/types";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsFor(group: string, groupValue: string, result: AssessmentResult): unknown[][] {
  const rows: unknown[][] = [];
  rows.push([group, groupValue, "overall", "Overall health index", "", round1(result.overall.currentIndex), round1(result.overall.desiredIndex), round1(result.overall.gap.value), result.validResponses, ""]);
  for (const d of result.dimensions) {
    rows.push([group, groupValue, "dimension", d.name, d.key, round1(d.current.score), round1(d.desired.score), round1(d.gap.value), d.current.n, d.current.naCount]);
  }
  for (const q of result.questions) {
    rows.push([group, groupValue, "item", q.prompt, q.key, round1(q.current.score), round1(q.desired.score), round1(q.gap.value), q.current.n, q.current.naCount]);
  }
  return rows;
}

/**
 * Aggregate-only CSV export. Contains exactly the privacy-screened figures
 * shown on the dashboard: suppressed groups and cells are omitted/blank.
 */
export function resultsToCsv(payload: ResultsPayload): string {
  const header = ["group", "group_value", "level", "label", "key", "current_score", "desired_score", "gap", "respondents", "not_applicable"];
  const rows: unknown[][] = [header, ...rowsFor("organization", "All respondents", payload.overall)];
  for (const [attribute, analysis] of Object.entries(payload.segments)) {
    if (!analysis) continue;
    for (const seg of analysis.segments) {
      if (!seg.visible || !seg.result) continue;
      rows.push(...rowsFor(ATTRIBUTE_LABELS[attribute as SegmentAttribute], seg.label, seg.result));
    }
  }
  const meta = [
    [],
    ["# ROHA aggregate export — privacy-screened. Groups with fewer than", payload.minGroupSize, "valid responses are omitted."],
    ["# Scoring engine", payload.engineVersion, "scoring rules v", payload.scoringRuleVersion, "assessment v", payload.assessmentVersion],
  ];
  return [...rows, ...meta].map((r) => r.map(csvCell).join(",")).join("\n");
}
