import type { AssessmentResult } from "@/lib/scoring/types";

/**
 * Plain-language description of the responses the inclusion rule excluded.
 * Only overall (whole-campaign) counts are described; segment results never
 * carry exclusion detail. Returns null for results from engine 1.0, which did
 * not record reasons. A response can fall short in several dimensions, so the
 * per-dimension counts can add up to more than the number excluded.
 */
export function describeExclusions(result: Pick<AssessmentResult, "excludedResponses" | "exclusions" | "dimensions">): {
  rule: string;
  excluded: number;
  reasons: string[];
} | null {
  const ex = result.exclusions;
  if (!ex) return null;
  const reasons: string[] = [];
  const resp = (n: number) => `${n} response${n === 1 ? "" : "s"}`;
  if (ex.belowOverallThreshold > 0) {
    reasons.push(`${resp(ex.belowOverallThreshold)} had fewer current-state ratings than the overall minimum`);
  }
  for (const d of result.dimensions) {
    const n = ex.belowDimensionThreshold[d.key] ?? 0;
    if (n > 0) reasons.push(`${resp(n)} had too few current-state ratings in ${d.name}`);
  }
  if (ex.withNotApplicable > 0) {
    reasons.push(`Not Applicable answers contributed to the shortfall in ${ex.withNotApplicable} of the excluded responses`);
  }
  return { rule: ex.rule, excluded: result.excludedResponses, reasons };
}
