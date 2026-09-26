import type { AssessmentResult } from "@/lib/scoring/types";
import type { SegmentAnalysis, SegmentAttribute } from "./segments";

export interface ParticipationSummary {
  responses: number;
  validResponses: number | null;
  expected: number | null;
  /** 0–100, null when the expected number of participants is unknown. */
  rate: number | null;
  daily: { day: string; submissions: number }[];
}

export interface QualitativeSummary {
  key: string;
  prompt: string;
  commentCount: number;
  /** Consented, PII-scrubbed, shuffled comments. Empty unless thresholds are met. */
  quotes: string[];
}

export interface ResultsPayload {
  engineVersion: string;
  scoringRuleVersion: number;
  assessmentVersion: number;
  minGroupSize: number;
  computedAt: string;
  overall: AssessmentResult;
  segments: Partial<Record<SegmentAttribute, SegmentAnalysis>>;
  qualitative: QualitativeSummary[];
  privacyMode: "confidential" | "anonymous";
}

export type ResultsView =
  | { status: "not_released"; participation: ParticipationSummary; closesAt: string }
  | { status: "insufficient"; participation: ParticipationSummary; minGroupSize: number }
  | { status: "ready"; participation: ParticipationSummary; payload: ResultsPayload };

export interface TrendPoint {
  campaignId: string;
  name: string;
  closedAt: string;
  /**
   * Assessment version the campaign used. Points from different versions measure
   * different constructs with different items and inclusion rules, so they are
   * never joined by a line and no change is calculated across versions.
   */
  assessmentVersion: number;
  /** Dimension labels for this campaign's own assessment version. */
  dimensionLabels: Record<string, { code: string; name: string }>;
  validResponses: number;
  currentIndex: number | null;
  desiredIndex: number | null;
  dimensions: Record<string, { current: number | null; desired: number | null }>;
}
