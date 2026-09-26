import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_CONFIG } from "./config";
import { pickRulesForAssessment, rulesAssessmentVersion } from "./pairing";
import { checkReadiness, planRelease, type AiInstructionsCandidate, type ReadinessInput } from "@/app/admin/assessments/readiness";

const v1Rules = { id: "r1", version_number: 1, status: "published", config: DEFAULT_SCORING_CONFIG };
const v2Rules = {
  id: "r2",
  version_number: 2,
  status: "draft",
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

const aiV1: AiInstructionsCandidate = { id: "a1", version_number: 1, status: "active", supported_assessment_versions: [1] };
const aiV2: AiInstructionsCandidate = { id: "a2", version_number: 2, status: "draft", supported_assessment_versions: [1, 2] };

function structure(dimCount: number, perDim: number | number[], versionNumber: number, rules = [v1Rules, v2Rules], ai = [aiV1, aiV2]): ReadinessInput {
  const counts = Array.isArray(perDim) ? perDim : Array(dimCount).fill(perDim);
  const dimensions = counts.map((_, i) => ({ id: `d${i}`, code: `D${i}`, name: `Dimension ${i}`, description: "A description." }));
  return {
    title: "Version",
    versionNumber,
    plan: planRelease(versionNumber, rules, ai, versionNumber === 1 ? [] : [1], true),
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

  it("accepts version 2 (5 × 5) only with matching scoring rules and compatible AI instructions", () => {
    expect(failing(structure(5, 5, 2))).toEqual([]);
    expect(failing(structure(5, 5, 2, [v1Rules]))).toEqual(["Scoring rules for this version exist and fit its structure"]);
    expect(failing(structure(5, 5, 2, [v1Rules, v2Rules], [aiV1]))).toEqual(["Compatible AI reporting instructions"]);
  });

  it("rejects unbalanced or out-of-range structures", () => {
    expect(failing(structure(5, [5, 5, 5, 5, 4], 2))).toContain("Every dimension has the same number of questions (4–6)");
    expect(failing(structure(4, 5, 2))).toContain("5–6 dimensions");
    expect(failing(structure(5, 3, 2))).toEqual(
      expect.arrayContaining(["Every dimension has the same number of questions (4–6)", "Scoring rules for this version exist and fit its structure"]),
    );
  });
});

describe("release plan", () => {
  it("publishes draft rules v2 and activates AI instructions v2 with assessment version 2", () => {
    const plan = planRelease(2, [v1Rules, v2Rules], [aiV1, aiV2], [1], true);
    expect(plan.rules?.id).toBe("r2");
    expect(plan.ai?.id).toBe("a2");
    expect(plan.versionsInUse).toEqual([2]);
  });

  it("keeps compatible active instructions and requires support for every version left in use", () => {
    const aiBoth: AiInstructionsCandidate = { ...aiV2, status: "active" };
    expect(planRelease(2, [v2Rules], [aiBoth], [1], false).ai?.id).toBe("a2");
    const v2Only: AiInstructionsCandidate = { id: "a3", version_number: 3, status: "draft", supported_assessment_versions: [2] };
    expect(planRelease(2, [v2Rules], [aiV1, v2Only], [1], false).ai).toBeNull();
    expect(planRelease(2, [v2Rules], [aiV1, v2Only], [1], true).ai?.id).toBe("a3");
  });

  it("ignores retired scoring rules", () => {
    expect(planRelease(2, [{ ...v2Rules, status: "retired" }], [aiV2], [], true).rules).toBeNull();
  });
});

