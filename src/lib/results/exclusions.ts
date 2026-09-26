import type { AssessmentResult } from "@/lib/scoring/types";

/** Respondents whose answers appear in at least one score (rules v1: the valid responses). */
export function scoredPopulation(result: Pick<AssessmentResult, "validResponses" | "contributingResponses">): number {
  return result.contributingResponses ?? result.validResponses;
}

/**
 * Plain-language description of how the inclusion rule applied. Only
 * organization-wide counts are described; segment results never carry this
 * detail. Returns null for results from engine 1.0, which did not record it.
 * A response can fall short in several dimensions, so per-dimension counts can
 * add up to more than the number of responses affected.
 */
export function describeExclusions(
  result: Pick<AssessmentResult, "excludedResponses" | "exclusions" | "dimensions" | "validResponses" | "partialResponses">,
): {
  rule: string;
  /** Responses counted in no score at all. */
  excluded: number;
  /** Rules v2+: responses counted in some dimensions but not in the overall index. */
  partial: number;
  perDimension: boolean;
  reasons: string[];
} | null {
  const ex = result.exclusions;
  if (!ex) return null;
  const perDimension = ex.basis === "per-dimension";
  const partial = result.partialResponses ?? 0;
  const resp = (n: number) => `${n} response${n === 1 ? "" : "s"}`;
  const reasons: string[] = [];
  if (perDimension) {
    if (partial > 0) {
      reasons.push(`${resp(partial)} met the requirement in some dimensions only: counted in those dimensions, not in the overall index`);
    }
    for (const d of result.dimensions) {
      const n = ex.belowDimensionThreshold[d.key] ?? 0;
      if (n > 0) reasons.push(`${resp(n)} had too few current-state ratings in ${d.name} and ${n === 1 ? "is" : "are"} not counted in that dimension`);
    }
    if (result.excludedResponses > 0) reasons.push(`${resp(result.excludedResponses)} met the requirement in no dimension and ${result.excludedResponses === 1 ? "is" : "are"} not counted in any score`);
    if (ex.withNotApplicable > 0) {
      reasons.push(`Not Applicable answers contributed to the shortfall for ${resp(ex.withNotApplicable)}`);
    }
  } else {
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
  }
  return { rule: ex.rule, excluded: result.excludedResponses, partial, perDimension, reasons };
}
