/**
 * Types for the ROHA deterministic scoring engine.
 *
 * The scoring engine is the single source of truth for every official number
 * ROHA reports. The AI reporting layer only ever receives its output.
 */

export interface ScoringBand {
  /** Inclusive lower bound on the 0–100 index. */
  min: number;
  label: string;
}

export interface ScoringConfig {
  scaleMin: number;
  scaleMax: number;
  normalization: "linear_0_100";
  /** Optional per-question weights by question key (default 1). */
  questionWeights: Record<string, number>;
  /** Optional per-dimension weights by dimension key (default 1). */
  dimensionWeights: Record<string, number>;
  /** A response is valid when it has at least this many numeric current-state ratings. */
  minValidCurrentRatings: number;
  /** Minimum valid respondents before any group's results are shown. */
  minGroupSize: number;
  gapThresholds: { notable: number; substantial: number };
  bands: ScoringBand[];
}

export interface DimensionDef {
  id: string;
  key: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface QuestionDef {
  id: string;
  key: string;
  dimensionId: string;
  focus: string;
  prompt: string;
  sortOrder: number;
  allowNa?: boolean;
}

/** A single perspective rating: 1–5, "NA" (not applicable), or null (missing). */
export type Rating = number | "NA" | null;

export interface ItemRating {
  current: Rating;
  desired: Rating;
}

export interface ResponseRecord {
  /** Keyed by question id. Questions absent from the map count as missing. */
  items: Record<string, ItemRating>;
}

/** Counts for each scale point, index 0 = rating 1 … index 4 = rating 5. */
export type Distribution = number[];

export interface PerspectiveStats {
  /** Number of numeric ratings contributing to the mean. */
  n: number;
  naCount: number;
  missingCount: number;
  /** Mean raw rating on the 1–5 scale, or null when n = 0. */
  meanRating: number | null;
  /** Normalized 0–100 index, or null when n = 0. */
  score: number | null;
  /** Population standard deviation of the raw ratings (dispersion). */
  sd: number | null;
  distribution: Distribution;
}

export type GapCategory = "aligned" | "notable" | "substantial";
export type GapDirection = "increase" | "decrease" | "none";

export interface GapInfo {
  value: number | null;
  category: GapCategory | null;
  direction: GapDirection | null;
}

export interface QuestionResult {
  questionId: string;
  key: string;
  dimensionKey: string;
  focus: string;
  prompt: string;
  current: PerspectiveStats;
  desired: PerspectiveStats;
  gap: GapInfo;
}

export interface DimensionPerspective {
  /** Weighted mean of question scores with data (0–100), or null. */
  score: number | null;
  /** Valid respondents with at least one numeric rating in this dimension. */
  n: number;
  naCount: number;
  missingCount: number;
  questionsScored: number;
  distribution: Distribution;
}

export interface DimensionResult {
  dimensionId: string;
  key: string;
  code: string;
  name: string;
  current: DimensionPerspective;
  desired: DimensionPerspective;
  gap: GapInfo;
  band: string | null;
}

export interface OverallResult {
  currentIndex: number | null;
  desiredIndex: number | null;
  gap: GapInfo;
  band: string | null;
  dimensionsScored: number;
}

export interface AssessmentResult {
  engineVersion: string;
  totalResponses: number;
  validResponses: number;
  excludedResponses: number;
  invalidRatings: number;
  overall: OverallResult;
  dimensions: DimensionResult[];
  questions: QuestionResult[];
}
