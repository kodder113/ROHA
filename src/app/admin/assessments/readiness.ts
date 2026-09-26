import { parseScoringConfig } from "@/lib/scoring/config";
import { pickRulesForAssessment, type RulesRow } from "@/lib/scoring/pairing";

/** Publication checklist for an assessment version (shared by page and actions). */
export interface ReadinessInput {
  title: string;
  versionNumber: number;
  /** Published scoring rule versions (any assessment version). */
  publishedRules: RulesRow[];
  dimensions: { id: string; name: string; description: string; code?: string }[];
  questions: { dimension_id: string; prompt: string; focus: string }[];
  qualitative: { prompt: string }[];
}

export interface ReadinessCheck {
  label: string;
  ok: boolean;
  detail?: string;
}

/**
 * Supported structures: version 1 is 6 × 4, version 2 is 5 × 5. Any balanced
 * structure within these bounds is accepted so a later version is not blocked
 * by a hardcoded shape; every dimension must have the same number of items.
 */
export const DIMENSION_COUNT_RANGE = [5, 6] as const;
export const QUESTIONS_PER_DIMENSION_RANGE = [4, 6] as const;

export function checkReadiness(v: ReadinessInput): ReadinessCheck[] {
  const perDim = new Map<string, number>();
  for (const q of v.questions) perDim.set(q.dimension_id, (perDim.get(q.dimension_id) ?? 0) + 1);
  const counts = v.dimensions.map((d) => perDim.get(d.id) ?? 0);
  const perDimension = counts[0] ?? 0;
  const balanced = counts.length > 0 && counts.every((c) => c === perDimension);
  const [minQ, maxQ] = QUESTIONS_PER_DIMENSION_RANGE;
  const [minD, maxD] = DIMENSION_COUNT_RANGE;
  const orphan = v.questions.filter((q) => !v.dimensions.some((d) => d.id === q.dimension_id)).length;
  const badPrompts = v.questions.filter((q) => q.prompt.trim().length < 10 || q.prompt.trim().length > 400).length;
  const missingFocus = v.questions.filter((q) => !q.focus.trim()).length;
  const incompleteDims = v.dimensions.filter((d) => !d.name.trim() || !d.description.trim()).length;
  const qualitativeOk = v.qualitative.length > 0 && v.qualitative.every((q) => q.prompt.trim().length > 0);

  const rules = pickRulesForAssessment(v.versionNumber, v.publishedRules);
  let rulesDetail = `No published scoring rules declare assessment version ${v.versionNumber}. Publish matching scoring rules first.`;
  let rulesOk = false;
  if (rules) {
    const cfg = parseScoringConfig(rules.config);
    const perDimMin = cfg.minValidCurrentPerDimension;
    const achievable = cfg.minValidCurrentRatings <= v.questions.length && (perDimMin === undefined || perDimMin <= perDimension);
    rulesOk = achievable;
    rulesDetail = achievable
      ? `Scoring rules v${rules.version_number}`
      : `Scoring rules v${rules.version_number} require more valid ratings than this version has`;
  }

  return [
    { label: "Version title is set", ok: v.title.trim().length > 0 },
    {
      label: `${minD}–${maxD} dimensions`,
      ok: v.dimensions.length >= minD && v.dimensions.length <= maxD,
      detail: `${v.dimensions.length} found`,
    },
    {
      label: `Every dimension has the same number of questions (${minQ}–${maxQ})`,
      ok: balanced && perDimension >= minQ && perDimension <= maxQ && orphan === 0,
      detail: balanced
        ? `${v.dimensions.length} × ${perDimension} = ${v.questions.length} questions`
        : `Unequal: ${v.dimensions.map((d) => `${d.code ?? d.name} ${perDim.get(d.id) ?? 0}`).join(", ")}`,
    },
    { label: "Every dimension has a name and description", ok: incompleteDims === 0, detail: incompleteDims ? `${incompleteDims} incomplete` : undefined },
    { label: "Every question prompt is 10–400 characters", ok: badPrompts === 0, detail: badPrompts ? `${badPrompts} invalid` : undefined },
    { label: "Every question has a focus", ok: missingFocus === 0, detail: missingFocus ? `${missingFocus} missing` : undefined },
    { label: "Open-ended questions have prompts", ok: qualitativeOk, detail: `${v.qualitative.length} open-ended questions` },
    { label: "Published scoring rules exist for this version and fit its structure", ok: rulesOk, detail: rulesDetail },
  ];
}
