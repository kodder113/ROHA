/**
 * Segment (subgroup) analysis with privacy suppression. Pure — no I/O.
 */
import { scoreAssessment, contributesToScoring } from "@/lib/scoring/engine";
import type { AssessmentResult, DimensionDef, QuestionDef, ResponseRecord, ScoringConfig } from "@/lib/scoring/types";
import { computeSuppression, type SuppressionReason } from "@/lib/privacy/suppression";
import { redactSmallCells } from "@/lib/privacy/redact";

export const SEGMENT_ATTRIBUTES = ["department", "location", "level", "tenure"] as const;
export type SegmentAttribute = (typeof SEGMENT_ATTRIBUTES)[number];

export const TENURE_OPTIONS: { key: string; label: string }[] = [
  { key: "lt_1", label: "Less than 1 year" },
  { key: "1_2", label: "1–2 years" },
  { key: "3_5", label: "3–5 years" },
  { key: "6_10", label: "6–10 years" },
  { key: "gt_10", label: "More than 10 years" },
];

export const ATTRIBUTE_LABELS: Record<SegmentAttribute, string> = {
  department: "Department",
  location: "Office location",
  level: "Organizational level",
  tenure: "Employment tenure",
};

export interface ProfiledResponse extends ResponseRecord {
  profile: Partial<Record<SegmentAttribute, string | null>>;
}

export interface SegmentOption {
  key: string;
  label: string;
}

export interface SegmentResult {
  key: string;
  label: string;
  /** Contributing responses in the group. Reported only when the group is visible. */
  n: number | null;
  visible: boolean;
  reason: SuppressionReason | null;
  result: AssessmentResult | null;
}

export interface SegmentAnalysis {
  attribute: SegmentAttribute;
  minGroupSize: number;
  segments: SegmentResult[];
  hiddenGroups: number;
}

export interface ScoringContext {
  dimensions: DimensionDef[];
  questions: QuestionDef[];
  config: ScoringConfig;
}

/** Scores the whole population and redacts cells below the threshold. */
export function scorePopulation(responses: ResponseRecord[], ctx: ScoringContext): AssessmentResult {
  const result = scoreAssessment({ ...ctx, responses });
  return redactSmallCells(result, ctx.config.minGroupSize);
}

/**
 * Breaks results down by a single attribute with primary and complementary
 * suppression. Respondents who did not specify the attribute form a hidden
 * group that is never displayed.
 */
export function analyzeSegments(
  attribute: SegmentAttribute,
  options: SegmentOption[],
  responses: ProfiledResponse[],
  ctx: ScoringContext,
): SegmentAnalysis {
  const k = ctx.config.minGroupSize;
  // Group sizes count every respondent who contributes to a score (rules v1:
  // valid responses; rules v2+: eligible for at least one dimension), so
  // suppression protects everyone whose answers could appear in a group.
  const valid = responses.filter((r) => contributesToScoring(r, ctx.questions, ctx.config));
  const byKey = new Map<string, ProfiledResponse[]>();
  const unspecified: ProfiledResponse[] = [];
  const optionKeys = new Set(options.map((o) => o.key));
  for (const r of valid) {
    const value = r.profile[attribute];
    if (value && optionKeys.has(value)) {
      if (!byKey.has(value)) byKey.set(value, []);
      byKey.get(value)!.push(r);
    } else {
      unspecified.push(r);
    }
  }

  const decisions = computeSuppression(
    [
      ...options.map((o) => ({ key: o.key, label: o.label, n: byKey.get(o.key)?.length ?? 0 })),
      { key: "__unspecified__", label: "Not specified", n: unspecified.length, hidden: true },
    ],
    valid.length,
    k,
  );

  const segments: SegmentResult[] = decisions
    .filter((d) => !d.hidden)
    .map((d) => {
      if (!d.visible) {
        return { key: d.key, label: d.label, n: null, visible: false, reason: d.reason, result: null };
      }
      // Exclusion reasons are reported organization-wide only, never per segment.
      const { exclusions: _exclusions, ...result } = scoreAssessment({ ...ctx, responses: byKey.get(d.key) ?? [] });
      void _exclusions;
      return { key: d.key, label: d.label, n: d.n, visible: true, reason: null, result: redactSmallCells(result, k) };
    });

  return {
    attribute,
    minGroupSize: k,
    segments,
    hiddenGroups: segments.filter((s) => !s.visible).length,
  };
}
