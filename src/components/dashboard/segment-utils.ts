import type { ResultsPayload } from "@/lib/results/types";
import { ATTRIBUTE_LABELS, SEGMENT_ATTRIBUTES, type SegmentAnalysis, type SegmentAttribute, type SegmentResult } from "@/lib/results/segments";
import { SUPPRESSION_MESSAGES } from "@/lib/privacy/suppression";

export type Segments = ResultsPayload["segments"];

/** Attributes present in the payload, in canonical order. */
export function availableAttributes(segments: Segments): SegmentAttribute[] {
  return SEGMENT_ATTRIBUTES.filter((a) => segments[a] !== undefined);
}

/** Preferred attribute if present, else department, else the first available. */
export function pickComparisonAttribute(segments: Segments, preferred?: SegmentAttribute | null): SegmentAttribute | null {
  if (preferred && segments[preferred]) return preferred;
  if (segments.department) return "department";
  return availableAttributes(segments)[0] ?? null;
}

export function attributeLabel(attribute: SegmentAttribute): string {
  return ATTRIBUTE_LABELS[attribute];
}

export function suppressionText(segment: Pick<SegmentResult, "reason">): string {
  return segment.reason ? SUPPRESSION_MESSAGES[segment.reason] : "Hidden to protect confidentiality.";
}

export function visibleSegments(analysis: SegmentAnalysis | undefined): SegmentResult[] {
  return (analysis?.segments ?? []).filter((s) => s.visible && s.result !== null);
}

export function hiddenSegments(analysis: SegmentAnalysis | undefined): SegmentResult[] {
  return (analysis?.segments ?? []).filter((s) => !s.visible || s.result === null);
}
