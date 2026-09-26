/**
 * Small-group privacy protection for ROHA results.
 *
 * Rules (with minGroupSize k, default 5):
 *  1. Population threshold — if the whole population has fewer than k valid
 *     responses, nothing is shown.
 *  2. Primary suppression — any subgroup with 0 < n < k is suppressed.
 *  3. Complementary (secondary) suppression — the organization total is always
 *     displayed, so the combined results of all hidden groups (suppressed groups
 *     plus respondents who did not specify the attribute) could be derived by
 *     subtraction. Whenever that hidden remainder is non-empty but smaller than
 *     k, the next-smallest visible group is suppressed as well, repeating until
 *     the remainder reaches k or no visible groups remain.
 *  4. Only one attribute can be filtered at a time (no intersections), which
 *     prevents isolating individuals by overlapping filters (enforced by the
 *     results API, not this module).
 *  5. Results are released only after a campaign closes, so repeated queries
 *     always return identical, frozen aggregates and cannot be differenced
 *     over time.
 */

export type SuppressionReason = "population_below_threshold" | "below_threshold" | "complementary";

export interface SegmentCount {
  key: string;
  label: string;
  n: number;
  /**
   * A group that is never displayed (e.g. "not specified"). It still matters
   * for complementary suppression because its size is derivable.
   */
  hidden?: boolean;
}

export interface SuppressionDecision {
  key: string;
  label: string;
  n: number;
  hidden: boolean;
  visible: boolean;
  reason: SuppressionReason | null;
}

export function computeSuppression(segments: SegmentCount[], total: number, minGroupSize: number): SuppressionDecision[] {
  const decisions: SuppressionDecision[] = segments.map((s) => ({
    key: s.key,
    label: s.label,
    n: s.n,
    hidden: Boolean(s.hidden),
    visible: !s.hidden && s.n > 0,
    reason: null,
  }));

  if (total < minGroupSize) {
    for (const d of decisions) {
      if (!d.hidden) {
        d.visible = false;
        d.reason = d.n > 0 ? "population_below_threshold" : null;
      }
    }
    return decisions;
  }

  for (const d of decisions) {
    if (!d.hidden && d.n > 0 && d.n < minGroupSize) {
      d.visible = false;
      d.reason = "below_threshold";
    }
  }

  // Complementary suppression loop.
  for (;;) {
    const hiddenRemainder = decisions.filter((d) => !d.visible).reduce((sum, d) => sum + d.n, 0);
    if (hiddenRemainder === 0 || hiddenRemainder >= minGroupSize) break;
    const candidates = decisions.filter((d) => d.visible).sort((a, b) => a.n - b.n || a.key.localeCompare(b.key));
    if (candidates.length === 0) break;
    candidates[0].visible = false;
    candidates[0].reason = "complementary";
  }

  return decisions;
}

export const SUPPRESSION_MESSAGES: Record<SuppressionReason, string> = {
  population_below_threshold: "Not enough valid responses to report results while protecting confidentiality.",
  below_threshold: "Hidden: fewer than the minimum number of respondents in this group.",
  complementary: "Hidden to prevent the results of a smaller group from being calculated by subtraction.",
};
