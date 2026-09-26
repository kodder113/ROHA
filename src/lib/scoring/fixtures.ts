/**
 * Test fixtures mirroring the ROHA v1 framework structure (6 dimensions × 4 items).
 * Used by unit tests only.
 */
import type { DimensionDef, ItemRating, QuestionDef, ResponseRecord } from "./types";

export const DIMENSION_KEYS = ["leadership", "culture", "engagement", "operations", "innovation", "strategy"] as const;
export const DIMENSION_CODES = ["LE", "OC", "EE", "OE", "IA", "SA"] as const;

export const fixtureDimensions: DimensionDef[] = DIMENSION_KEYS.map((key, i) => ({
  id: `dim-${key}`,
  key,
  code: DIMENSION_CODES[i],
  name: key,
  sortOrder: i + 1,
}));

export const fixtureQuestions: QuestionDef[] = fixtureDimensions.flatMap((d) =>
  [1, 2, 3, 4].map((n) => ({
    id: `q-${d.code}${n}`,
    key: `${d.code}${n}`,
    dimensionId: d.id,
    focus: `${d.name} focus ${n}`,
    prompt: `${d.name} statement ${n}`,
    sortOrder: n,
    allowNa: n === 3,
  })),
);

/** Builds a response where every item gets the same current/desired rating. */
export function uniformResponse(current: ItemRating["current"], desired: ItemRating["desired"]): ResponseRecord {
  return {
    items: Object.fromEntries(fixtureQuestions.map((q) => [q.id, { current, desired }])),
  };
}

/** Builds a response from a function of (question, index). */
export function responseFrom(fn: (q: QuestionDef, index: number) => ItemRating): ResponseRecord {
  return { items: Object.fromEntries(fixtureQuestions.map((q, i) => [q.id, fn(q, i)])) };
}
