import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_CONFIG, parseScoringConfig } from "./config";
import { bandFor, checkResponseValidity, classifyRating, engineMajor, ENGINE_VERSION, gapInfo, isValidResponse, normalize, round1, scoreAssessment } from "./engine";
import { fixtureDimensions, fixtureQuestions, responseFrom, uniformResponse } from "./fixtures";
import type { ResponseRecord, ScoringConfig } from "./types";

const config = DEFAULT_SCORING_CONFIG;
const score = (responses: ResponseRecord[], cfg: ScoringConfig = config) =>
  scoreAssessment({ dimensions: fixtureDimensions, questions: fixtureQuestions, responses, config: cfg });

describe("normalization", () => {
  it("maps the 1–5 Likert scale onto 0–100 using ((r − 1) / 4) × 100", () => {
    expect([1, 2, 3, 4, 5].map((r) => normalize(r, config))).toEqual([0, 25, 50, 75, 100]);
  });

  it("classifies ratings", () => {
    expect(classifyRating(3, config)).toEqual({ kind: "value", value: 3 });
    expect(classifyRating("NA", config)).toEqual({ kind: "na" });
    expect(classifyRating(null, config)).toEqual({ kind: "missing" });
    expect(classifyRating(undefined, config)).toEqual({ kind: "missing" });
    expect(classifyRating(0, config)).toEqual({ kind: "invalid" });
    expect(classifyRating(6, config)).toEqual({ kind: "invalid" });
    expect(classifyRating(2.5, config)).toEqual({ kind: "invalid" });
  });
});

describe("framework coverage", () => {
  it("has exactly six dimensions with four questions each (24 items, 48 ratings)", () => {
    expect(fixtureDimensions).toHaveLength(6);
    expect(fixtureQuestions).toHaveLength(24);
    for (const d of fixtureDimensions) {
      expect(fixtureQuestions.filter((q) => q.dimensionId === d.id)).toHaveLength(4);
    }
    const result = score([uniformResponse(4, 5)]);
    const ratingsCounted = result.questions.reduce((sum, q) => sum + q.current.n + q.desired.n, 0);
    expect(ratingsCounted).toBe(48);
  });

  it("scores every one of the 24 items independently for current and desired", () => {
    // Each item gets a distinct current/desired pattern so a mis-mapped item would be caught.
    const response = responseFrom((_, i) => ({ current: (i % 5) + 1, desired: ((i + 2) % 5) + 1 }));
    const result = score([response]);
    result.questions.forEach((q) => {
      const i = fixtureQuestions.findIndex((fq) => fq.id === q.questionId);
      expect(q.current.score).toBe(normalize((i % 5) + 1, config));
      expect(q.desired.score).toBe(normalize(((i + 2) % 5) + 1, config));
      expect(q.gap.value).toBe(q.desired.score! - q.current.score!);
    });
  });
});

describe("aggregation", () => {
  it("computes question, dimension and overall scores with equal weights", () => {
    const responses = [uniformResponse(2, 5), uniformResponse(4, 5), uniformResponse(3, 4)];
    const result = score(responses);
    // mean current rating = 3 → 50; desired = 14/3 → (14/3 − 1)/4 × 100 = 91.666…
    for (const q of result.questions) {
      expect(q.current.score).toBeCloseTo(50, 10);
      expect(q.desired.score).toBeCloseTo(((14 / 3 - 1) / 4) * 100, 10);
      expect(q.current.distribution).toEqual([0, 1, 1, 1, 0]);
    }
    for (const d of result.dimensions) {
      expect(d.current.score).toBeCloseTo(50, 10);
      expect(d.current.n).toBe(3);
      expect(d.current.distribution).toEqual([0, 4, 4, 4, 0]);
    }
    expect(result.overall.currentIndex).toBeCloseTo(50, 10);
    expect(result.overall.gap.value).toBeCloseTo(41.6667, 3);
    expect(result.overall.gap.direction).toBe("increase");
  });

  it("hand-verified mixed example", () => {
    // Two respondents; leadership items differ, everything else = 3/3.
    const a = responseFrom((q) => (q.key.startsWith("LE") ? { current: 1, desired: 5 } : { current: 3, desired: 3 }));
    const b = responseFrom((q) => (q.key === "LE1" ? { current: 3, desired: 4 } : q.key.startsWith("LE") ? { current: 2, desired: 5 } : { current: 3, desired: 3 }));
    const result = score([a, b]);
    const le = result.dimensions.find((d) => d.key === "leadership")!;
    // LE1 current mean 2 → 25; LE2–4 mean 1.5 → 12.5. Dimension = (25 + 12.5·3)/4 = 15.625
    expect(le.current.score).toBeCloseTo(15.625, 10);
    // LE1 desired mean 4.5 → 87.5; LE2–4 mean 5 → 100. Dimension = (87.5 + 300)/4 = 96.875
    expect(le.desired.score).toBeCloseTo(96.875, 10);
    expect(le.gap.value).toBeCloseTo(81.25, 10);
    expect(le.gap.category).toBe("substantial");
    // Overall current = (15.625 + 50·5)/6
    expect(result.overall.currentIndex).toBeCloseTo((15.625 + 250) / 6, 10);
    expect(result.overall.desiredIndex).toBeCloseTo((96.875 + 250) / 6, 10);
  });

  it("is deterministic and independent of response order", () => {
    const responses = Array.from({ length: 20 }, (_, r) =>
      responseFrom((_, i) => ({ current: ((r * 7 + i * 3) % 5) + 1, desired: ((r * 3 + i) % 5) + 1 })),
    );
    const forward = score(responses);
    const reversed = score([...responses].reverse());
    expect(reversed).toEqual(forward);
    expect(score(responses)).toEqual(forward);
  });
});

describe("Not Applicable and missing ratings", () => {
  it("excludes N/A from averages but counts it", () => {
    const withNa = responseFrom((q) => (q.key === "LE3" ? { current: "NA", desired: "NA" } : { current: 4, desired: 5 }));
    const plain = uniformResponse(2, 5);
    const result = score([withNa, plain]);
    const le3 = result.questions.find((q) => q.key === "LE3")!;
    expect(le3.current.n).toBe(1);
    expect(le3.current.naCount).toBe(1);
    expect(le3.current.score).toBe(25); // only the "2" counts
    const le1 = result.questions.find((q) => q.key === "LE1")!;
    expect(le1.current.score).toBe(50); // (4 + 2) / 2 = 3 → 50
    const le = result.dimensions.find((d) => d.key === "leadership")!;
    expect(le.current.naCount).toBe(1);
    expect(le.current.score).toBeCloseTo((50 * 3 + 25) / 4, 10);
  });

  it("drops a question from the dimension mean when nobody rated it numerically", () => {
    const r = responseFrom((q) => (q.key === "OE3" ? { current: "NA", desired: 5 } : { current: 5, desired: 5 }));
    const result = score([r]);
    const oe = result.dimensions.find((d) => d.key === "operations")!;
    expect(oe.current.questionsScored).toBe(3);
    expect(oe.current.score).toBe(100);
    expect(oe.desired.questionsScored).toBe(4);
    expect(result.questions.find((q) => q.key === "OE3")!.gap.value).toBeNull();
  });

  it("treats missing and out-of-range ratings as missing and reports invalid ratings", () => {
    const r = responseFrom((q, i) => (i === 0 ? { current: 7, desired: null } : { current: 3, desired: 3 }));
    const result = score([r]);
    expect(result.invalidRatings).toBe(1);
    const le1 = result.questions.find((q) => q.key === "LE1")!;
    expect(le1.current.missingCount).toBe(1);
    expect(le1.desired.missingCount).toBe(1);
    expect(le1.current.score).toBeNull();
  });

  it("excludes incomplete responses below the validity threshold", () => {
    const incomplete = responseFrom((_, i) => (i < 11 ? { current: 1, desired: 1 } : { current: null, desired: null }));
    const enough = responseFrom((_, i) => (i < 12 ? { current: 5, desired: 5 } : { current: null, desired: null }));
    expect(isValidResponse(incomplete, fixtureQuestions, config)).toBe(false);
    expect(isValidResponse(enough, fixtureQuestions, config)).toBe(true);
    const result = score([incomplete, enough]);
    expect(result.totalResponses).toBe(2);
    expect(result.validResponses).toBe(1);
    expect(result.excludedResponses).toBe(1);
    expect(result.questions[0].current.score).toBe(100);
  });

  it("returns null scores (not zeros) when there are no responses", () => {
    const result = score([]);
    expect(result.overall.currentIndex).toBeNull();
    expect(result.overall.gap.value).toBeNull();
    expect(result.dimensions.every((d) => d.current.score === null)).toBe(true);
  });
});

describe("gaps and bands", () => {
  it("computes gaps as desired minus current, including negative gaps", () => {
    expect(gapInfo(40, 70, config)).toEqual({ value: 30, category: "substantial", direction: "increase" });
    expect(gapInfo(80, 65, config)).toEqual({ value: -15, category: "notable", direction: "decrease" });
    expect(gapInfo(50, 55, config)).toEqual({ value: 5, category: "aligned", direction: "increase" });
    expect(gapInfo(50, 50, config)).toEqual({ value: 0, category: "aligned", direction: "none" });
    expect(gapInfo(null, 50, config)).toEqual({ value: null, category: null, direction: null });
  });

  it("negative gaps are preserved at every level", () => {
    const result = score([uniformResponse(5, 3)]);
    expect(result.overall.gap.value).toBe(-50);
    expect(result.overall.gap.direction).toBe("decrease");
  });

  it("assigns descriptive bands by current score", () => {
    expect(bandFor(10, config)).toBe("Needs focused attention");
    expect(bandFor(40, config)).toBe("Mixed perceptions");
    expect(bandFor(79.9, config)).toBe("Generally favorable");
    expect(bandFor(80, config)).toBe("Strongly favorable");
    expect(bandFor(null, config)).toBeNull();
  });
});

describe("configurable, versioned rules", () => {
  it("applies question and dimension weights from configuration", () => {
    const cfg = parseScoringConfig({
      ...config,
      questionWeights: { LE1: 3 },
      dimensionWeights: { leadership: 2 },
    });
    const r = responseFrom((q) => (q.key === "LE1" ? { current: 5, desired: 5 } : { current: 1, desired: 5 }));
    const result = score([r], cfg);
    const le = result.dimensions.find((d) => d.key === "leadership")!;
    expect(le.current.score).toBeCloseTo((100 * 3) / 6, 10); // (100·3 + 0·3) / 6
    expect(result.overall.currentIndex).toBeCloseTo((50 * 2) / 7, 10);
  });

  it("rejects invalid configurations", () => {
    expect(() => parseScoringConfig({ ...config, scaleMax: 1 })).toThrow();
    expect(() => parseScoringConfig({ ...config, gapThresholds: { notable: 20, substantial: 10 } })).toThrow();
    expect(() => parseScoringConfig({ ...config, minGroupSize: 1 })).toThrow();
  });
});

describe("independent verification", () => {
  /** A deliberately naive re-implementation used to cross-check the engine. */
  function naiveOverall(responses: ResponseRecord[]) {
    const dimScores: number[] = [];
    for (const d of fixtureDimensions) {
      const qScores: number[] = [];
      for (const q of fixtureQuestions.filter((x) => x.dimensionId === d.id)) {
        const vals = responses.map((r) => r.items[q.id]?.current).filter((v): v is number => typeof v === "number");
        if (vals.length) qScores.push(((vals.reduce((a, b) => a + b, 0) / vals.length - 1) / 4) * 100);
      }
      if (qScores.length) dimScores.push(qScores.reduce((a, b) => a + b, 0) / qScores.length);
    }
    return dimScores.reduce((a, b) => a + b, 0) / dimScores.length;
  }

  it("matches a naive implementation on pseudo-random data", () => {
    let seed = 12345;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let trial = 0; trial < 25; trial++) {
      const responses = Array.from({ length: 5 + Math.floor(rand() * 60) }, () =>
        responseFrom((q) => ({
          current: q.allowNa && rand() < 0.1 ? "NA" : 1 + Math.floor(rand() * 5),
          desired: 1 + Math.floor(rand() * 5),
        })),
      );
      const result = score(responses);
      expect(result.overall.currentIndex).toBeCloseTo(naiveOverall(responses), 9);
    }
  });

  it("rounds for display only", () => {
    expect(round1(41.66666)).toBe(41.7);
    expect(round1(null)).toBeNull();
  });
});

describe("per-dimension inclusion rule (scoring rules v2)", () => {
  const v2Config = parseScoringConfig({ ...config, minValidCurrentRatings: 20, minValidCurrentPerDimension: 4, assessmentVersion: 2 });
  // Five dimensions × five items, mirroring the Version 2 structure.
  const dims5 = ["LE", "OC", "EE", "OE", "SI"].map((code, i) => ({ id: `d-${code}`, key: code.toLowerCase(), code, name: code, sortOrder: i + 1 }));
  const qs25 = dims5.flatMap((d) => [1, 2, 3, 4, 5].map((n) => ({ id: `q-${d.code}${n}`, key: `${d.code}${n}`, dimensionId: d.id, focus: "", prompt: "", sortOrder: n, allowNa: true })));
  const resp = (fn: (key: string) => ResponseRecord["items"][string]) => ({ items: Object.fromEntries(qs25.map((q) => [q.id, fn(q.key)])) });
  const score25 = (responses: ResponseRecord[], cfg: ScoringConfig) => scoreAssessment({ dimensions: dims5, questions: qs25, responses, config: cfg });

  it("includes a respondent with at least four valid current ratings in every dimension", () => {
    const oneNaPerDimension = resp((k) => (k.endsWith("3") ? { current: "NA", desired: "NA" } : { current: 4, desired: 5 }));
    expect(checkResponseValidity(oneNaPerDimension, qs25, v2Config).valid).toBe(true);
  });

  it("excludes a respondent with only three valid ratings in one dimension, even with 23 valid overall", () => {
    const twoNaInSI = resp((k) => (k === "SI3" || k === "SI5" ? { current: "NA", desired: "NA" } : { current: 4, desired: 5 }));
    const check = checkResponseValidity(twoNaInSI, qs25, v2Config);
    expect(check.valid).toBe(false);
    expect(check.belowOverall).toBe(false);
    expect(check.shortDimensions).toEqual(["d-SI"]);
    expect(check.shortfallInvolvesNA).toBe(true);
  });

  it("counts respondents in every dimension where they are eligible, and in the overall index only when eligible everywhere", () => {
    const ok = resp(() => ({ current: 3, desired: 5 }));
    const naSI = resp((k) => (k === "SI3" || k === "SI5" ? { current: "NA", desired: "NA" } : { current: 3, desired: 5 }));
    const missingLE = resp((k) => (k.startsWith("LE") && k !== "LE1" ? { current: null, desired: null } : { current: 3, desired: 5 }));
    const result = score25([ok, ok, naSI, missingLE], v2Config);
    expect(result.validResponses).toBe(2);
    expect(result.contributingResponses).toBe(4);
    expect(result.partialResponses).toBe(2);
    expect(result.excludedResponses).toBe(0);
    const n = Object.fromEntries(result.dimensions.map((d) => [d.key, d.current.n]));
    expect(n).toEqual({ le: 3, oc: 4, ee: 4, oe: 4, si: 3 });
    expect(result.exclusions?.belowDimensionThreshold).toEqual({ si: 1, le: 1 });
    expect(result.exclusions?.withNotApplicable).toBe(1);
    expect(result.exclusions?.basis).toBe("per-dimension");
    expect(result.exclusions?.rule).toMatch(/at least 4 in every dimension, for the overall index/);
    expect(result.overall.currentIndex).toBe(50);
  });

  it("excludes a respondent eligible in no dimension from every score", () => {
    const ok = resp(() => ({ current: 4, desired: 5 }));
    const empty = resp(() => ({ current: "NA", desired: "NA" }));
    const result = score25([ok, empty], v2Config);
    expect(result.excludedResponses).toBe(1);
    expect(result.contributingResponses).toBe(1);
    expect(result.dimensions.every((d) => d.current.n === 1)).toBe(true);
  });

  it("leaves rules without the per-dimension setting (v1) unchanged", () => {
    const naSI = resp((k) => (k === "SI3" || k === "SI5" ? { current: "NA", desired: "NA" } : { current: 3, desired: 5 }));
    expect(checkResponseValidity(naSI, qs25, config).valid).toBe(true);
    expect(score25([naSI], config).exclusions?.belowDimensionThreshold).toEqual({});
  });

  it("keeps cached results valid within the same engine major version", () => {
    expect(engineMajor("roha-scoring-engine/1.0.0")).toBe(engineMajor(ENGINE_VERSION));
  });
});

describe("statistical implications of separate populations (scoring rules v2)", () => {
  const v2Config = parseScoringConfig({ ...config, minValidCurrentRatings: 20, minValidCurrentPerDimension: 4, assessmentVersion: 2 });
  const dims5 = ["LE", "OC", "EE", "OE", "SI"].map((code, i) => ({ id: `d-${code}`, key: code.toLowerCase(), code, name: code, sortOrder: i + 1 }));
  const qs25 = dims5.flatMap((d) => [1, 2, 3, 4, 5].map((n) => ({ id: `q-${d.code}${n}`, key: `${d.code}${n}`, dimensionId: d.id, focus: "", prompt: "", sortOrder: n, allowNa: true })));
  const resp = (fn: (key: string) => ResponseRecord["items"][string]) => ({ items: Object.fromEntries(qs25.map((q) => [q.id, fn(q.key)])) });
  // Five respondents rate everything 5; five others rate everything 1 but mark SI3 and SI5 N/A.
  const full = Array.from({ length: 5 }, () => resp(() => ({ current: 5, desired: 5 })));
  const partial = Array.from({ length: 5 }, () => resp((k) => (k === "SI3" || k === "SI5" ? { current: "NA", desired: "NA" } : { current: 1, desired: 5 })));
  const result = scoreAssessment({ dimensions: dims5, questions: qs25, responses: [...full, ...partial], config: v2Config });
  const byKey = Object.fromEntries(result.dimensions.map((d) => [d.key, d]));

  it("scores each dimension on its own eligible respondents", () => {
    expect(byKey.le.current.n).toBe(10);
    expect(byKey.le.current.score).toBe(50);
    expect(byKey.si.current.n).toBe(5);
    expect(byKey.si.current.score).toBe(100);
  });

  it("computes the overall index on respondents eligible in every dimension, so it can differ from the mean of displayed dimension scores", () => {
    const meanOfDisplayed = result.dimensions.reduce((sum, d) => sum + d.current.score!, 0) / result.dimensions.length;
    expect(meanOfDisplayed).toBe(60);
    expect(result.validResponses).toBe(5);
    expect(result.overall.currentIndex).toBe(100);
    expect(result.overall.desiredIndex).toBe(100);
  });

  it("gives identical results to the single-population method when every respondent is eligible everywhere", () => {
    const all = [...full, ...Array.from({ length: 5 }, () => resp(() => ({ current: 1, desired: 5 })))];
    const v2 = scoreAssessment({ dimensions: dims5, questions: qs25, responses: all, config: v2Config });
    const single = scoreAssessment({ dimensions: dims5, questions: qs25, responses: all, config: { ...config, minValidCurrentRatings: 20 } });
    expect(v2.overall.currentIndex).toBe(single.overall.currentIndex);
    expect(v2.dimensions.map((d) => d.current.score)).toEqual(single.dimensions.map((d) => d.current.score));
    expect(v2.partialResponses).toBe(0);
  });
});

