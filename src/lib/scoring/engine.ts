/**
 * ROHA deterministic scoring engine.
 *
 * Methodology (scoring rules v1):
 *  - Each of the 24 core items is rated twice (current and desired) on a 1–5 scale.
 *  - Normalized score = ((rating − min) / (max − min)) × 100, i.e. ((r − 1) / 4) × 100.
 *  - Question score = normalized mean of the valid numeric ratings for that item.
 *  - Dimension score = weighted mean (equal weights by default) of its question
 *    scores that have data.
 *  - Overall index = weighted mean (equal weights by default) of dimension scores.
 *  - Gap = desired − current at every level.
 *  - "Not applicable" and missing ratings are excluded from averages but counted.
 *  - A response is valid only if it contains at least `minValidCurrentRatings`
 *    numeric current-state ratings; invalid responses are excluded entirely.
 *
 * Scoring rules v2+ (`minValidCurrentPerDimension` set) — partial inclusion:
 *  - A respondent is eligible for a dimension when it has at least
 *    `minValidCurrentPerDimension` numeric current ratings in that dimension.
 *  - Item and dimension statistics use the respondents eligible for that
 *    dimension, so an eligible dimension still counts when another falls short.
 *  - The overall index uses only respondents eligible for EVERY dimension (and
 *    meeting `minValidCurrentRatings`): it is the weighted mean of dimension
 *    scores recomputed on that population. It can therefore differ from the
 *    mean of the displayed dimension scores; both populations are reported.
 *
 * The engine is pure and has no I/O, so it can be tested and audited in isolation.
 */
import type {
  AssessmentResult,
  DimensionDef,
  DimensionPerspective,
  DimensionResult,
  Distribution,
  GapInfo,
  PerspectiveStats,
  QuestionDef,
  QuestionResult,
  Rating,
  ResponseRecord,
  ScoringConfig,
} from "./types";

export const ENGINE_VERSION = "roha-scoring-engine/1.2.0";

/** Major version of an engine version string; cached results are reused within a major version. */
export function engineMajor(version: string): string {
  return version.replace(/^.*\//, "").split(".")[0];
}

type Perspective = "current" | "desired";

/** Classifies a raw rating as numeric, not-applicable, missing, or invalid. */
export function classifyRating(
  rating: Rating | undefined,
  config: Pick<ScoringConfig, "scaleMin" | "scaleMax">,
): { kind: "value"; value: number } | { kind: "na" } | { kind: "missing" } | { kind: "invalid" } {
  if (rating === "NA") return { kind: "na" };
  if (rating === null || rating === undefined) return { kind: "missing" };
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < config.scaleMin || rating > config.scaleMax) {
    return { kind: "invalid" };
  }
  return { kind: "value", value: rating };
}

/** ((rating − min) / (max − min)) × 100 */
export function normalize(rating: number, config: Pick<ScoringConfig, "scaleMin" | "scaleMax">): number {
  return ((rating - config.scaleMin) / (config.scaleMax - config.scaleMin)) * 100;
}

export function bandFor(score: number | null, config: Pick<ScoringConfig, "bands">): string | null {
  if (score === null) return null;
  const sorted = [...config.bands].sort((a, b) => a.min - b.min);
  let label: string | null = null;
  for (const band of sorted) {
    if (score >= band.min) label = band.label;
  }
  return label;
}

export function gapInfo(
  current: number | null,
  desired: number | null,
  config: Pick<ScoringConfig, "gapThresholds">,
): GapInfo {
  if (current === null || desired === null) return { value: null, category: null, direction: null };
  const value = desired - current;
  const magnitude = Math.abs(value);
  const category =
    magnitude >= config.gapThresholds.substantial
      ? "substantial"
      : magnitude >= config.gapThresholds.notable
        ? "notable"
        : "aligned";
  const direction = value > 0 ? "increase" : value < 0 ? "decrease" : "none";
  return { value, category, direction };
}

function emptyDistribution(config: ScoringConfig): Distribution {
  return new Array(config.scaleMax - config.scaleMin + 1).fill(0);
}

function weightedMean(values: { value: number; weight: number }[]): number | null {
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  if (values.length === 0 || totalWeight === 0) return null;
  return values.reduce((sum, v) => sum + v.value * v.weight, 0) / totalWeight;
}

export interface ValidityCheck {
  valid: boolean;
  belowOverall: boolean;
  /** Dimension ids that fell short of the per-dimension threshold. */
  shortDimensions: string[];
  /** True when N/A answers contributed to a dimension shortfall. */
  shortfallInvolvesNA: boolean;
}

/**
 * Decides whether a response is included in scoring.
 *  - rules v1: at least `minValidCurrentRatings` numeric current ratings overall;
 *  - rules v2+: additionally at least `minValidCurrentPerDimension` numeric
 *    current ratings in every dimension. N/A never counts as a valid rating.
 */
export function checkResponseValidity(response: ResponseRecord, questions: QuestionDef[], config: ScoringConfig): ValidityCheck {
  let numeric = 0;
  const perDim = new Map<string, { numeric: number; na: number; items: number }>();
  for (const q of questions) {
    const c = classifyRating(response.items[q.id]?.current, config);
    const d = perDim.get(q.dimensionId) ?? { numeric: 0, na: 0, items: 0 };
    d.items += 1;
    if (c.kind === "value") {
      numeric += 1;
      d.numeric += 1;
    } else if (c.kind === "na") {
      d.na += 1;
    }
    perDim.set(q.dimensionId, d);
  }
  const belowOverall = numeric < Math.min(config.minValidCurrentRatings, questions.length);
  const shortDimensions: string[] = [];
  let shortfallInvolvesNA = false;
  if (config.minValidCurrentPerDimension !== undefined) {
    for (const [dimId, d] of perDim) {
      if (d.numeric < Math.min(config.minValidCurrentPerDimension, d.items)) {
        shortDimensions.push(dimId);
        if (d.na > 0) shortfallInvolvesNA = true;
      }
    }
  }
  return { valid: !belowOverall && shortDimensions.length === 0, belowOverall, shortDimensions, shortfallInvolvesNA };
}

/** True when the rules use per-dimension eligibility (scoring rules v2+). */
export function usesPartialInclusion(config: ScoringConfig): boolean {
  return config.minValidCurrentPerDimension !== undefined;
}

/**
 * Whether a response contributes to any score. Rules v1: only valid responses.
 * Rules v2+: any response eligible for at least one dimension.
 */
export function contributesToScoring(response: ResponseRecord, questions: QuestionDef[], config: ScoringConfig): boolean {
  const check = checkResponseValidity(response, questions, config);
  if (!usesPartialInclusion(config)) return check.valid;
  const dimensionIds = new Set(questions.map((q) => q.dimensionId));
  return check.shortDimensions.length < dimensionIds.size;
}

/** Counts numeric current-state ratings (overall and, where configured, per dimension) to decide validity. */
export function isValidResponse(response: ResponseRecord, questions: QuestionDef[], config: ScoringConfig): boolean {
  return checkResponseValidity(response, questions, config).valid;
}

export function describeInclusionRule(config: ScoringConfig, questionCount: number): string {
  const overall = `at least ${Math.min(config.minValidCurrentRatings, questionCount)} numeric current-state ratings`;
  return config.minValidCurrentPerDimension !== undefined
    ? `${overall}, including at least ${config.minValidCurrentPerDimension} in every dimension, for the overall index; a dimension also includes any respondent with at least ${config.minValidCurrentPerDimension} numeric current-state ratings in that dimension; Not Applicable does not count as a rating`
    : `${overall}; Not Applicable does not count as a rating`;
}

function perspectiveStats(
  responses: ResponseRecord[],
  questionId: string,
  perspective: Perspective,
  config: ScoringConfig,
  invalidCounter: { count: number },
): PerspectiveStats {
  const distribution = emptyDistribution(config);
  let n = 0;
  let naCount = 0;
  let missingCount = 0;
  let sum = 0;
  let sumSq = 0;
  for (const response of responses) {
    const c = classifyRating(response.items[questionId]?.[perspective], config);
    if (c.kind === "value") {
      n += 1;
      sum += c.value;
      sumSq += c.value * c.value;
      distribution[c.value - config.scaleMin] += 1;
    } else if (c.kind === "na") {
      naCount += 1;
    } else {
      if (c.kind === "invalid") invalidCounter.count += 1;
      missingCount += 1;
    }
  }
  const meanRating = n > 0 ? sum / n : null;
  const variance = n > 0 && meanRating !== null ? Math.max(0, sumSq / n - meanRating * meanRating) : null;
  return {
    n,
    naCount,
    missingCount,
    meanRating,
    score: meanRating === null ? null : normalize(meanRating, config),
    sd: variance === null ? null : Math.sqrt(variance),
    distribution,
  };
}

function dimensionPerspective(
  responses: ResponseRecord[],
  dimQuestions: QuestionDef[],
  questionResults: Map<string, QuestionResult>,
  perspective: Perspective,
  config: ScoringConfig,
): DimensionPerspective {
  const distribution = emptyDistribution(config);
  let naCount = 0;
  let missingCount = 0;
  const scored: { value: number; weight: number }[] = [];
  for (const q of dimQuestions) {
    const stats = questionResults.get(q.id)![perspective];
    stats.distribution.forEach((count, i) => (distribution[i] += count));
    naCount += stats.naCount;
    missingCount += stats.missingCount;
    if (stats.score !== null) scored.push({ value: stats.score, weight: config.questionWeights[q.key] ?? 1 });
  }
  const n = responses.filter((r) =>
    dimQuestions.some((q) => classifyRating(r.items[q.id]?.[perspective], config).kind === "value"),
  ).length;
  return {
    score: weightedMean(scored),
    n,
    naCount,
    missingCount,
    questionsScored: scored.length,
    distribution,
  };
}

export interface ScoreInput {
  dimensions: DimensionDef[];
  questions: QuestionDef[];
  responses: ResponseRecord[];
  config: ScoringConfig;
}

/** Scores a set of responses. Deterministic: identical input ⇒ identical output. */
export function scoreAssessment({ dimensions, questions, responses, config }: ScoreInput): AssessmentResult {
  const sortedDimensions = [...dimensions].sort((a, b) => a.sortOrder - b.sortOrder);
  const dimById = new Map(sortedDimensions.map((d) => [d.id, d]));
  const sortedQuestions = [...questions].sort((a, b) => {
    const da = dimById.get(a.dimensionId)?.sortOrder ?? 0;
    const db = dimById.get(b.dimensionId)?.sortOrder ?? 0;
    return da - db || a.sortOrder - b.sortOrder;
  });

  const checks = responses.map((r) => checkResponseValidity(r, sortedQuestions, config));
  const valid = responses.filter((_, i) => checks[i].valid);
  const partial = usesPartialInclusion(config);
  // Population for each dimension: rules v1 use the valid responses; rules v2+
  // use every response eligible for that dimension.
  const populationFor = (dimId: string): ResponseRecord[] =>
    partial ? responses.filter((_, i) => !checks[i].shortDimensions.includes(dimId)) : valid;
  const populations = new Map(sortedDimensions.map((d) => [d.id, populationFor(d.id)]));
  const contributing = partial ? responses.filter((_, i) => checks[i].shortDimensions.length < sortedDimensions.length) : valid;
  const invalidCounter = { count: 0 };
  const belowDimensionThreshold: Record<string, number> = {};
  for (const c of checks) {
    for (const dimId of c.shortDimensions) {
      const key = dimById.get(dimId)?.key ?? dimId;
      belowDimensionThreshold[key] = (belowDimensionThreshold[key] ?? 0) + 1;
    }
  }

  const questionResults = new Map<string, QuestionResult>();
  for (const q of sortedQuestions) {
    const dim = dimById.get(q.dimensionId);
    const population = populations.get(q.dimensionId) ?? valid;
    const current = perspectiveStats(population, q.id, "current", config, invalidCounter);
    const desired = perspectiveStats(population, q.id, "desired", config, invalidCounter);
    questionResults.set(q.id, {
      questionId: q.id,
      key: q.key,
      dimensionKey: dim?.key ?? "unknown",
      focus: q.focus,
      prompt: q.prompt,
      current,
      desired,
      gap: gapInfo(current.score, desired.score, config),
    });
  }

  const dimensionResults: DimensionResult[] = sortedDimensions.map((d) => {
    const dimQuestions = sortedQuestions.filter((q) => q.dimensionId === d.id);
    const population = populations.get(d.id) ?? valid;
    const current = dimensionPerspective(population, dimQuestions, questionResults, "current", config);
    const desired = dimensionPerspective(population, dimQuestions, questionResults, "desired", config);
    return {
      dimensionId: d.id,
      key: d.key,
      code: d.code,
      name: d.name,
      current,
      desired,
      gap: gapInfo(current.score, desired.score, config),
      band: bandFor(current.score, config),
    };
  });

  // Overall index. Rules v1: mean of the dimension scores (one population).
  // Rules v2+: dimension scores recomputed on the respondents eligible for
  // every dimension, so the index describes one consistent population.
  const overallBasis = partial
    ? sortedDimensions.map((d) => {
        const dimQuestions = sortedQuestions.filter((q) => q.dimensionId === d.id);
        const scratch = { count: 0 };
        const itemStats = new Map<string, QuestionResult>(
          dimQuestions.map((q) => {
            const current = perspectiveStats(valid, q.id, "current", config, scratch);
            const desired = perspectiveStats(valid, q.id, "desired", config, scratch);
            return [q.id, { ...questionResults.get(q.id)!, current, desired }];
          }),
        );
        return {
          key: d.key,
          current: dimensionPerspective(valid, dimQuestions, itemStats, "current", config).score,
          desired: dimensionPerspective(valid, dimQuestions, itemStats, "desired", config).score,
        };
      })
    : dimensionResults.map((d) => ({ key: d.key, current: d.current.score, desired: d.desired.score }));
  const overallCurrent = weightedMean(
    overallBasis.filter((d) => d.current !== null).map((d) => ({ value: d.current!, weight: config.dimensionWeights[d.key] ?? 1 })),
  );
  const overallDesired = weightedMean(
    overallBasis.filter((d) => d.desired !== null).map((d) => ({ value: d.desired!, weight: config.dimensionWeights[d.key] ?? 1 })),
  );

  return {
    engineVersion: ENGINE_VERSION,
    totalResponses: responses.length,
    validResponses: valid.length,
    excludedResponses: responses.length - contributing.length,
    ...(partial ? { contributingResponses: contributing.length, partialResponses: contributing.length - valid.length } : {}),
    invalidRatings: invalidCounter.count,
    exclusions: {
      rule: describeInclusionRule(config, sortedQuestions.length),
      belowOverallThreshold: checks.filter((c) => c.belowOverall).length,
      belowDimensionThreshold,
      withNotApplicable: checks.filter((c) => !c.valid && c.shortfallInvolvesNA).length,
      ...(partial ? { basis: "per-dimension" as const } : {}),
    },
    overall: {
      currentIndex: overallCurrent,
      desiredIndex: overallDesired,
      gap: gapInfo(overallCurrent, overallDesired, config),
      band: bandFor(overallCurrent, config),
      dimensionsScored: dimensionResults.filter((d) => d.current.score !== null).length,
    },
    dimensions: dimensionResults,
    questions: [...questionResults.values()],
  };
}

/** Rounds to one decimal place for display and reporting. */
export function round1(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round(value * 10) / 10;
}
