import { parseScoringConfig } from "@/lib/scoring/config";
import { pickRulesForAssessment, type RulesRow } from "@/lib/scoring/pairing";

export interface RulesCandidate extends RulesRow {
  status: string;
}

export interface AiInstructionsCandidate {
  id: string;
  version_number: number;
  status: string;
  supported_assessment_versions: number[];
}

export interface ReleasePlan {
  rules: RulesCandidate | null;
  ai: AiInstructionsCandidate | null;
  /** Assessment versions that will be available for new campaigns after the release. */
  versionsInUse: number[];
}

/**
 * Chooses what an assessment release publishes together: the newest draft or
 * published scoring rules designed for the version, and AI reporting
 * instructions (the active version if compatible, otherwise the newest
 * compatible draft) that support every assessment version still in use.
 */
export function planRelease(
  versionNumber: number,
  rules: RulesCandidate[],
  ai: AiInstructionsCandidate[],
  otherPublishedVersions: number[],
  retirePrevious: boolean,
): ReleasePlan {
  const versionsInUse = [...(retirePrevious ? [] : otherPublishedVersions), versionNumber].sort((a, b) => a - b);
  const pickedRules = pickRulesForAssessment(
    versionNumber,
    rules.filter((r) => r.status === "draft" || r.status === "published"),
  );
  const supports = (a: AiInstructionsCandidate) => versionsInUse.every((v) => a.supported_assessment_versions.includes(v));
  const active = ai.find((a) => a.status === "active" && supports(a));
  const draft = ai.filter((a) => a.status === "draft" && supports(a)).sort((a, b) => b.version_number - a.version_number)[0];
  return { rules: pickedRules, ai: active ?? draft ?? null, versionsInUse };
}

/** Publication checklist for an assessment version (shared by page and actions). */
export interface ReadinessInput {
  title: string;
  versionNumber: number;
  /** The release plan (scoring rules and AI instructions published with the version). */
  plan: ReleasePlan;
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

  const rules = v.plan.rules;
  let rulesDetail = `No draft or published scoring rules declare assessment version ${v.versionNumber}.`;
  let rulesOk = false;
  if (rules) {
    const cfg = parseScoringConfig(rules.config);
    const perDimMin = cfg.minValidCurrentPerDimension;
    const achievable = cfg.minValidCurrentRatings <= v.questions.length && (perDimMin === undefined || perDimMin <= perDimension);
    rulesOk = achievable;
    rulesDetail = achievable
      ? `Scoring rules v${rules.version_number} (${rules.status === "draft" ? "published with this release" : "already published"})`
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
    { label: "Scoring rules for this version exist and fit its structure", ok: rulesOk, detail: rulesDetail },
    {
      label: "Compatible AI reporting instructions",
      ok: v.plan.ai !== null,
      detail: v.plan.ai
        ? `AI instructions v${v.plan.ai.version_number} (${v.plan.ai.status === "active" ? "already active" : "activated with this release"}) support assessment version${v.plan.versionsInUse.length > 1 ? "s" : ""} ${v.plan.versionsInUse.join(", ")}`
        : `No active or draft AI instructions support assessment version${v.plan.versionsInUse.length > 1 ? "s" : ""} ${v.plan.versionsInUse.join(", ")}`,
    },
  ];
}
