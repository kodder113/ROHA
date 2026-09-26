/** Publication checklist for an assessment version (shared by page and actions). */
export interface ReadinessInput {
  title: string;
  dimensions: { id: string; name: string; description: string }[];
  questions: { dimension_id: string; prompt: string; focus: string }[];
  qualitative: { prompt: string }[];
}

export interface ReadinessCheck {
  label: string;
  ok: boolean;
  detail?: string;
}

export const REQUIRED_DIMENSIONS = 6;
export const QUESTIONS_PER_DIMENSION = 4;

export function checkReadiness(v: ReadinessInput): ReadinessCheck[] {
  const perDim = new Map<string, number>();
  for (const q of v.questions) perDim.set(q.dimension_id, (perDim.get(q.dimension_id) ?? 0) + 1);
  const wrongDims = v.dimensions.filter((d) => (perDim.get(d.id) ?? 0) !== QUESTIONS_PER_DIMENSION);
  const orphan = v.questions.filter((q) => !v.dimensions.some((d) => d.id === q.dimension_id)).length;
  const badPrompts = v.questions.filter((q) => q.prompt.trim().length < 10 || q.prompt.trim().length > 400).length;
  const missingFocus = v.questions.filter((q) => !q.focus.trim()).length;
  const incompleteDims = v.dimensions.filter((d) => !d.name.trim() || !d.description.trim()).length;
  const qualitativeOk = v.qualitative.length > 0 && v.qualitative.every((q) => q.prompt.trim().length > 0);

  return [
    { label: "Version title is set", ok: v.title.trim().length > 0 },
    {
      label: `Exactly ${REQUIRED_DIMENSIONS} dimensions`,
      ok: v.dimensions.length === REQUIRED_DIMENSIONS,
      detail: `${v.dimensions.length} found`,
    },
    {
      label: `Exactly ${QUESTIONS_PER_DIMENSION} questions in every dimension (${REQUIRED_DIMENSIONS * QUESTIONS_PER_DIMENSION} total)`,
      ok: wrongDims.length === 0 && orphan === 0 && v.questions.length === REQUIRED_DIMENSIONS * QUESTIONS_PER_DIMENSION,
      detail: wrongDims.length ? `Check: ${wrongDims.map((d) => d.name || d.id).join(", ")}` : `${v.questions.length} questions`,
    },
    { label: "Every dimension has a name and description", ok: incompleteDims === 0, detail: incompleteDims ? `${incompleteDims} incomplete` : undefined },
    { label: "Every question prompt is 10–400 characters", ok: badPrompts === 0, detail: badPrompts ? `${badPrompts} invalid` : undefined },
    { label: "Every question has a focus", ok: missingFocus === 0, detail: missingFocus ? `${missingFocus} missing` : undefined },
    { label: "Open-ended questions have prompts", ok: qualitativeOk, detail: `${v.qualitative.length} open-ended questions` },
  ];
}
