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

export const ENGINE_VERSION = "roha-scoring-engine/1.0.0";

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

/** Counts numeric current-state ratings to decide response validity. */
export function isValidResponse(response: ResponseRecord, questions: QuestionDef[], config: ScoringConfig): boolean {
  let numeric = 0;
  for (const q of questions) {
    if (classifyRating(response.items[q.id]?.current, config).kind === "value") numeric += 1;
  }
  return numeric >= Math.min(config.minValidCurrentRatings, questions.length);
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

  const valid = responses.filter((r) => isValidResponse(r, sortedQuestions, config));
  const invalidCounter = { count: 0 };

  const questionResults = new Map<string, QuestionResult>();
  for (const q of sortedQuestions) {
    const dim = dimById.get(q.dimensionId);
    const current = perspectiveStats(valid, q.id, "current", config, invalidCounter);
    const desired = perspectiveStats(valid, q.id, "desired", config, invalidCounter);
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
    const current = dimensionPerspective(valid, dimQuestions, questionResults, "current", config);
    const desired = dimensionPerspective(valid, dimQuestions, questionResults, "desired", config);
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

  const overallCurrent = weightedMean(
    dimensionResults
      .filter((d) => d.current.score !== null)
      .map((d) => ({ value: d.current.score!, weight: config.dimensionWeights[d.key] ?? 1 })),
  );
  const overallDesired = weightedMean(
    dimensionResults
      .filter((d) => d.desired.score !== null)
      .map((d) => ({ value: d.desired.score!, weight: config.dimensionWeights[d.key] ?? 1 })),
  );

  return {
    engineVersion: ENGINE_VERSION,
    totalResponses: responses.length,
    validResponses: valid.length,
    excludedResponses: responses.length - valid.length,
    invalidRatings: invalidCounter.count,
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
