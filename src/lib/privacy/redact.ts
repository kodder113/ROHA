/**
 * Cell-level redaction of scored results and PII scrubbing of free text.
 */
import type { AssessmentResult, DimensionPerspective, PerspectiveStats } from "@/lib/scoring/types";

function redactPerspective(stats: PerspectiveStats, minGroupSize: number): PerspectiveStats & { suppressed?: boolean } {
  if (stats.n >= minGroupSize) return stats;
  return {
    ...stats,
    meanRating: null,
    score: null,
    sd: null,
    distribution: stats.distribution.map(() => 0),
    suppressed: true,
  };
}

function redactDimension(p: DimensionPerspective, minGroupSize: number): DimensionPerspective & { suppressed?: boolean } {
  if (p.n >= minGroupSize) return p;
  return { ...p, score: null, distribution: p.distribution.map(() => 0), suppressed: true };
}

/**
 * Removes any statistic computed from fewer than `minGroupSize` respondents
 * (e.g. an item where most people in a group answered "Not applicable").
 * If the result as a whole is below the threshold, everything is withheld.
 */
export function redactSmallCells(result: AssessmentResult, minGroupSize: number): AssessmentResult {
  if (result.validResponses < minGroupSize) {
    return {
      ...result,
      overall: { ...result.overall, currentIndex: null, desiredIndex: null, band: null, dimensionsScored: 0, gap: { value: null, category: null, direction: null } },
      dimensions: result.dimensions.map((d) => ({
        ...d,
        current: redactDimension({ ...d.current, n: 0 }, minGroupSize),
        desired: redactDimension({ ...d.desired, n: 0 }, minGroupSize),
        gap: { value: null, category: null, direction: null },
        band: null,
      })),
      questions: result.questions.map((q) => ({
        ...q,
        current: redactPerspective({ ...q.current, n: 0 }, minGroupSize),
        desired: redactPerspective({ ...q.desired, n: 0 }, minGroupSize),
        gap: { value: null, category: null, direction: null },
      })),
    };
  }
  return {
    ...result,
    dimensions: result.dimensions.map((d) => {
      const current = redactDimension(d.current, minGroupSize);
      const desired = redactDimension(d.desired, minGroupSize);
      const hidden = current.score === null || desired.score === null;
      return {
        ...d,
        current,
        desired,
        gap: hidden ? { value: null, category: null, direction: null } : d.gap,
        band: current.score === null ? null : d.band,
      };
    }),
    questions: result.questions.map((q) => {
      const current = redactPerspective(q.current, minGroupSize);
      const desired = redactPerspective(q.desired, minGroupSize);
      const hidden = current.score === null || desired.score === null;
      return { ...q, current, desired, gap: hidden ? { value: null, category: null, direction: null } : q.gap };
    }),
  };
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_RE = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;
const PHONE = /(?:\+?\d[\s().-]*){7,}\d/g;
const LONG_NUMBER = /\b\d{5,}\b/g;
// Honorific followed by a capitalized word (e.g. "Mr. Smith", "Dr Jones").
const TITLED_NAME = /\b(?:Mr|Mrs|Ms|Miss|Mx|Dr|Prof)\.?\s+[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+)?/g;
// "my manager John", "supervisor Maria" …
const ROLE_NAME = /\b(manager|supervisor|boss|director|lead|coworker|co-worker|colleague)\s+([A-Z][a-zA-Z'’-]+)/g;

/**
 * Best-effort removal of direct identifiers from free-text comments before they
 * are displayed or sent to the AI provider. This cannot guarantee that a
 * comment is non-identifying (people may describe themselves), which is why
 * verbatim comments are only shown with the author's explicit consent.
 */
export function scrubPII(text: string): string {
  return text
    .replace(EMAIL, "[email removed]")
    .replace(URL_RE, "[link removed]")
    .replace(PHONE, "[number removed]")
    .replace(LONG_NUMBER, "[number removed]")
    .replace(TITLED_NAME, "[name removed]")
    .replace(ROLE_NAME, (_m, role: string) => `${role} [name removed]`)
    .replace(/\s+/g, " ")
    .trim();
}

/** Deterministic Fisher–Yates shuffle (seeded) so displayed order leaks nothing about submission order. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
