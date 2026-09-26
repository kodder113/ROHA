import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_CONFIG } from "./config";
import { pickRulesForAssessment, rulesAssessmentVersion } from "./pairing";
import { checkReadiness, type ReadinessInput } from "@/app/admin/assessments/readiness";

const v1Rules = { id: "r1", version_number: 1, config: DEFAULT_SCORING_CONFIG };
const v2Rules = {
  id: "r2",
  version_number: 2,
  config: { ...DEFAULT_SCORING_CONFIG, minValidCurrentRatings: 20, minValidCurrentPerDimension: 4, assessmentVersion: 2 },
};

describe("scoring rules ↔ assessment version pairing", () => {
  it("treats rules without assessmentVersion as version 1 rules", () => {
    expect(rulesAssessmentVersion(DEFAULT_SCORING_CONFIG)).toBe(1);
    expect(rulesAssessmentVersion(v2Rules.config)).toBe(2);
  });

  it("pairs each assessment version with its own newest rules", () => {
    expect(pickRulesForAssessment(1, [v1Rules, v2Rules])?.id).toBe("r1");
    expect(pickRulesForAssessment(2, [v1Rules, v2Rules])?.id).toBe("r2");
    // Publishing v2 rules alone must not pull them into v1 campaigns, and vice versa.
    expect(pickRulesForAssessment(2, [v1Rules])).toBeNull();
    expect(pickRulesForAssessment(1, [v2Rules])).toBeNull();
  });

  it("ignores rules with an invalid configuration", () => {
    expect(pickRulesForAssessment(1, [{ id: "bad", version_number: 9, config: { nope: true } }, v1Rules])?.id).toBe("r1");
  });
});

function structure(dimCount: number, perDim: number | number[], versionNumber: number, rules = [v1Rules, v2Rules]): ReadinessInput {
  const counts = Array.isArray(perDim) ? perDim : Array(dimCount).fill(perDim);
  const dimensions = counts.map((_, i) => ({ id: `d${i}`, code: `D${i}`, name: `Dimension ${i}`, description: "A description." }));
  return {
    title: "Version",
    versionNumber,
    publishedRules: rules,
    dimensions,
    questions: dimensions.flatMap((d, i) => Array.from({ length: counts[i] }, (_, n) => ({ dimension_id: d.id, prompt: `Statement number ${n + 1}.`, focus: "Focus" }))),
    qualitative: [{ prompt: "What works well?" }],
  };
}
const failing = (input: ReadinessInput) => checkReadiness(input).filter((c) => !c.ok).map((c) => c.label);

describe("assessment publication checklist", () => {
  it("accepts version 1 (6 × 4) with version 1 rules", () => {
    expect(failing(structure(6, 4, 1))).toEqual([]);
  });

  it("accepts version 2 (5 × 5) only when matching scoring rules are published", () => {
    expect(failing(structure(5, 5, 2))).toEqual([]);
    expect(failing(structure(5, 5, 2, [v1Rules]))).toEqual(["Published scoring rules exist for this version and fit its structure"]);
  });

  it("rejects unbalanced or out-of-range structures", () => {
    expect(failing(structure(5, [5, 5, 5, 5, 4], 2))).toContain("Every dimension has the same number of questions (4–6)");
    expect(failing(structure(4, 5, 2))).toContain("5–6 dimensions");
    expect(failing(structure(5, 3, 2))).toEqual(
      expect.arrayContaining(["Every dimension has the same number of questions (4–6)", "Published scoring rules exist for this version and fit its structure"]),
    );
  });
});
