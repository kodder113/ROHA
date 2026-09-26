import { describe, expect, it } from "vitest";
import { computeSuppression } from "./suppression";
import { redactSmallCells, scrubPII, seededShuffle } from "./redact";
import { DEFAULT_SCORING_CONFIG } from "@/lib/scoring/config";
import { scoreAssessment } from "@/lib/scoring/engine";
import { fixtureDimensions, fixtureQuestions, fixtureV2Dimensions, fixtureV2Questions, responseFrom, responseFromV2, uniformResponse } from "@/lib/scoring/fixtures";
import { parseScoringConfig } from "@/lib/scoring/config";
import { analyzeSegments, type ProfiledResponse } from "@/lib/results/segments";

const K = 5;
const visibleKeys = (d: ReturnType<typeof computeSuppression>) => d.filter((x) => x.visible).map((x) => x.key);

describe("computeSuppression", () => {
  it("hides every group when the population is below the threshold", () => {
    const d = computeSuppression([{ key: "a", label: "A", n: 3 }, { key: "b", label: "B", n: 1 }], 4, K);
    expect(visibleKeys(d)).toEqual([]);
    expect(d[0].reason).toBe("population_below_threshold");
  });

  it("suppresses groups below the minimum (primary suppression)", () => {
    const d = computeSuppression(
      [
        { key: "a", label: "A", n: 20 },
        { key: "b", label: "B", n: 12 },
        { key: "c", label: "C", n: 3 },
        { key: "d", label: "D", n: 4 },
      ],
      39,
      K,
    );
    expect(visibleKeys(d)).toEqual(["a", "b"]);
    expect(d.find((x) => x.key === "c")!.reason).toBe("below_threshold");
  });

  it("applies complementary suppression when a single small group could be derived by subtraction", () => {
    // Total 30 is shown. Hiding only C (n=2) would let anyone compute C = total − A − B.
    const d = computeSuppression(
      [
        { key: "a", label: "A", n: 20 },
        { key: "b", label: "B", n: 8 },
        { key: "c", label: "C", n: 2 },
      ],
      30,
      K,
    );
    expect(visibleKeys(d)).toEqual(["a"]);
    expect(d.find((x) => x.key === "b")!.reason).toBe("complementary");
  });

  it("protects the complement of a visible group (total − group < k)", () => {
    // A has 27 of 30 — showing A next to the total would reveal the other 3.
    const d = computeSuppression(
      [
        { key: "a", label: "A", n: 27 },
        { key: "b", label: "B", n: 3 },
      ],
      30,
      K,
    );
    expect(visibleKeys(d)).toEqual([]);
  });

  it("counts the hidden 'not specified' group toward the remainder", () => {
    const withUnspecified = computeSuppression(
      [
        { key: "a", label: "A", n: 20 },
        { key: "b", label: "B", n: 8 },
        { key: "c", label: "C", n: 2 },
        { key: "u", label: "Not specified", n: 6, hidden: true },
      ],
      36,
      K,
    );
    // Remainder = 2 + 6 = 8 ≥ 5, so no complementary suppression is needed.
    expect(visibleKeys(withUnspecified)).toEqual(["a", "b"]);

    const smallUnspecified = computeSuppression(
      [
        { key: "a", label: "A", n: 20 },
        { key: "b", label: "B", n: 8 },
        { key: "u", label: "Not specified", n: 1, hidden: true },
      ],
      29,
      K,
    );
    // One unspecified respondent could be isolated → suppress B too.
    expect(visibleKeys(smallUnspecified)).toEqual(["a"]);
  });

  it("never shows empty groups", () => {
    const d = computeSuppression([{ key: "a", label: "A", n: 10 }, { key: "b", label: "B", n: 0 }], 10, K);
    expect(visibleKeys(d)).toEqual(["a"]);
    expect(d.find((x) => x.key === "b")!.reason).toBeNull();
  });
});

describe("redactSmallCells", () => {
  const cfg = DEFAULT_SCORING_CONFIG;
  it("withholds all numbers when fewer than k valid responses", () => {
    const result = scoreAssessment({
      dimensions: fixtureDimensions,
      questions: fixtureQuestions,
      responses: [uniformResponse(4, 5), uniformResponse(3, 5)],
      config: cfg,
    });
    const red = redactSmallCells(result, K);
    expect(red.overall.currentIndex).toBeNull();
    expect(red.dimensions.every((d) => d.current.score === null)).toBe(true);
    expect(red.questions.every((q) => q.current.distribution.every((c) => c === 0))).toBe(true);
  });

  it("withholds individual items rated numerically by fewer than k people", () => {
    const responses = Array.from({ length: 6 }, (_, i) =>
      responseFrom((q) => (q.key === "OE3" && i < 2 ? { current: "NA", desired: "NA" } : { current: 3, desired: 4 })),
    );
    // OE3: 4 numeric ratings < 5 → suppressed, others visible.
    const red = redactSmallCells(
      scoreAssessment({ dimensions: fixtureDimensions, questions: fixtureQuestions, responses, config: cfg }),
      K,
    );
    expect(red.questions.find((q) => q.key === "OE3")!.current.score).toBeNull();
    expect(red.questions.find((q) => q.key === "OE1")!.current.score).toBe(50);
    expect(red.overall.currentIndex).not.toBeNull();
  });
});

describe("analyzeSegments", () => {
  const ctx = { dimensions: fixtureDimensions, questions: fixtureQuestions, config: DEFAULT_SCORING_CONFIG };
  const make = (dept: string | null, rating: number): ProfiledResponse => ({
    ...uniformResponse(rating, 5),
    profile: { department: dept },
  });

  it("suppresses a 3-person department and its complement, and shows no results for hidden groups", () => {
    const responses = [
      ...Array.from({ length: 10 }, () => make("ops", 3)),
      ...Array.from({ length: 6 }, () => make("fin", 4)),
      ...Array.from({ length: 3 }, () => make("legal", 1)),
    ];
    const analysis = analyzeSegments(
      "department",
      [
        { key: "ops", label: "Operations" },
        { key: "fin", label: "Finance" },
        { key: "legal", label: "Legal" },
      ],
      responses,
      ctx,
    );
    const legal = analysis.segments.find((s) => s.key === "legal")!;
    const fin = analysis.segments.find((s) => s.key === "fin")!;
    const ops = analysis.segments.find((s) => s.key === "ops")!;
    expect(legal.visible).toBe(false);
    expect(legal.result).toBeNull();
    expect(legal.n).toBeNull();
    // remainder 3 < 5 → Finance (smallest visible) is also suppressed.
    expect(fin.visible).toBe(false);
    expect(fin.reason).toBe("complementary");
    expect(ops.visible).toBe(true);
    expect(ops.result!.overall.currentIndex).toBe(50);
  });
});

describe("privacy with per-dimension inclusion (scoring rules v2)", () => {
  const config = parseScoringConfig({ ...DEFAULT_SCORING_CONFIG, minValidCurrentRatings: 20, minValidCurrentPerDimension: 4, assessmentVersion: 2 });
  const ctx = { dimensions: fixtureV2Dimensions, questions: fixtureV2Questions, config };
  const full = (dept: string): ProfiledResponse => ({ ...responseFromV2(() => ({ current: 4, desired: 5 })), profile: { department: dept } });
  const noSI = (dept: string): ProfiledResponse => ({
    ...responseFromV2((q) => (q.key === "SI3" || q.key === "SI5" ? { current: "NA", desired: "NA" } : { current: 2, desired: 5 })),
    profile: { department: dept },
  });
  const score = (responses: ProfiledResponse[]) => redactSmallCells(scoreAssessment({ ...ctx, responses }), K);
  const dim = (r: ReturnType<typeof score>, key: string) => r.dimensions.find((d) => d.key === key)!;

  it("hides the overall index and small dimensions while showing dimensions with at least five respondents", () => {
    const r = score([...Array.from({ length: 4 }, () => full("a")), ...Array.from({ length: 3 }, () => noSI("a"))]);
    expect(r.validResponses).toBe(4);
    expect(r.overall.currentIndex).toBeNull();
    expect(dim(r, "leadership").current.n).toBe(7);
    expect(dim(r, "leadership").current.score).not.toBeNull();
    expect(dim(r, "strategy_innovation").current.n).toBe(4);
    expect(dim(r, "strategy_innovation").current.score).toBeNull();
    expect(r.questions.find((q) => q.key === "SI1")!.current.score).toBeNull();
  });

  it("withholds everything when fewer than five respondents contribute to any score", () => {
    const r = score([...Array.from({ length: 2 }, () => full("a")), ...Array.from({ length: 2 }, () => noSI("a"))]);
    expect(r.overall.currentIndex).toBeNull();
    expect(r.dimensions.every((d) => d.current.score === null)).toBe(true);
  });

  it("sizes segments by every contributing respondent and applies cell thresholds within them", () => {
    const responses = [...Array.from({ length: 3 }, () => full("ops")), ...Array.from({ length: 3 }, () => noSI("ops")), ...Array.from({ length: 6 }, () => full("fin"))];
    const analysis = analyzeSegments("department", [{ key: "ops", label: "Ops" }, { key: "fin", label: "Finance" }], responses, ctx);
    const ops = analysis.segments.find((s) => s.key === "ops")!;
    expect(ops.visible).toBe(true);
    expect(ops.n).toBe(6); // 3 eligible everywhere + 3 eligible in four dimensions
    expect(ops.result!.overall.currentIndex).toBeNull(); // only 3 in the overall index
    expect(ops.result!.dimensions.find((d) => d.key === "strategy_innovation")!.current.score).toBeNull(); // n = 3
    expect(ops.result!.dimensions.find((d) => d.key === "leadership")!.current.score).not.toBeNull(); // n = 6
    expect(ops.result!.exclusions).toBeUndefined();
  });

  it("hides a group of fewer than five contributors and protects its complement", () => {
    const responses = [...Array.from({ length: 8 }, () => full("ops")), ...Array.from({ length: 6 }, () => full("fin")), ...Array.from({ length: 2 }, () => noSI("legal"))];
    const analysis = analyzeSegments("department", [{ key: "ops", label: "Ops" }, { key: "fin", label: "Finance" }, { key: "legal", label: "Legal" }], responses, ctx);
    expect(analysis.segments.find((s) => s.key === "legal")!.visible).toBe(false);
    expect(analysis.segments.find((s) => s.key === "fin")!.visible).toBe(false); // remainder 2 < 5
    expect(analysis.segments.find((s) => s.key === "ops")!.visible).toBe(true);
  });
});

describe("scrubPII", () => {
  it("removes emails, phone numbers, links and titled names", () => {
    const out = scrubPII(
      "Email me at jane.doe@acme.com or call +1 (555) 123-4567. Dr. Smith and my manager Carlos ignore https://intranet/x",
    );
    expect(out).not.toMatch(/jane\.doe|555|Smith|Carlos|intranet/);
    expect(out).toContain("[email removed]");
    expect(out).toContain("manager [name removed]");
  });

  it("leaves ordinary feedback unchanged", () => {
    expect(scrubPII("Approvals take too long.")).toBe("Approvals take too long.");
  });
});

describe("seededShuffle", () => {
  it("is deterministic for a seed and preserves elements", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(seededShuffle(items, "x")).toEqual(seededShuffle(items, "x"));
    expect([...seededShuffle(items, "x")].sort()).toEqual(items);
  });
});
