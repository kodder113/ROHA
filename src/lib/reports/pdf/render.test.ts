import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderExecutiveReportPdf } from "./render";
import { SAMPLE_PDF_INPUT } from "./sample";
import { DEFAULT_SCORING_CONFIG, parseScoringConfig } from "@/lib/scoring/config";
import { fixtureV2Dimensions, fixtureV2Questions, responseFromV2 } from "@/lib/scoring/fixtures";
import { scorePopulation } from "@/lib/results/segments";
import { buildReportSnapshot } from "@/lib/ai/snapshot";
import { generateRulesReport } from "@/lib/ai/rules-report";

function pageCount(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}

describe("renderExecutiveReportPdf", () => {
  it("renders the synthetic sample to a multi-page PDF", async () => {
    const pdf = await renderExecutiveReportPdf(SAMPLE_PDF_INPUT);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20_000);
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(10);
    // Optional: write the sample for visual review, e.g.
    // ROHA_PDF_SAMPLE_OUT=/tmp/sample.pdf npx vitest run src/lib/reports/pdf
    if (process.env.ROHA_PDF_SAMPLE_OUT) writeFileSync(process.env.ROHA_PDF_SAMPLE_OUT, pdf);
  });

  it("handles null scores and empty narrative arrays", async () => {
    const { snapshot, report } = SAMPLE_PDF_INPUT;
    const pdf = await renderExecutiveReportPdf({
      ...SAMPLE_PDF_INPUT,
      generator: "rules",
      model: null,
      snapshot: {
        ...snapshot,
        campaign: { ...snapshot.campaign, closedAt: null, privacyMode: "anonymous" },
        participation: { responses: 3, validResponses: 3, expected: null, ratePercent: null },
        overall: { currentIndex: null, desiredIndex: null, gap: null, band: null },
        dimensions: snapshot.dimensions.map((d) => ({ ...d, current: null, desired: null, gap: null, gapCategory: null, band: null })),
        items: snapshot.items.map((i) => ({ ...i, current: null, desired: null, gap: null, currentFavorablePercent: null })),
        comments: [],
      },
      report: {
        ...report,
        strengths: [],
        development_opportunities: [],
        leadership_analysis: { summary: "", findings: [], hypotheses: [] },
        qualitative_themes: [],
        organizational_priorities: [],
        action_plan: [],
        limitations: [],
      },
    });
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(8);
  });

  it("renders a five-dimension (assessment version 2) report", async () => {
    let seed = 3;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const responses = Array.from({ length: 24 }, () => responseFromV2(() => ({ current: 1 + Math.floor(rand() * 5), desired: 3 + Math.floor(rand() * 3) })));
    responses.push(responseFromV2((q) => (q.key === "SI3" || q.key === "SI5" ? { current: "NA", desired: "NA" } : { current: 4, desired: 4 })));
    const config = parseScoringConfig({ ...DEFAULT_SCORING_CONFIG, minValidCurrentRatings: 20, minValidCurrentPerDimension: 4, assessmentVersion: 2 });
    const overall = scorePopulation(responses, { dimensions: fixtureV2Dimensions, questions: fixtureV2Questions, config });
    const snapshot = buildReportSnapshot({
      organization: { name: "Pilot Org", industry: null, employee_count_range: null },
      campaign: { id: "c", name: "Pilot", closed_at: "2026-09-01T00:00:00Z", closes_at: "2026-09-01T00:00:00Z", privacy_mode: "confidential" },
      payload: {
        engineVersion: overall.engineVersion,
        scoringRuleVersion: 2,
        assessmentVersion: 2,
        minGroupSize: 5,
        computedAt: "2026-09-01T00:00:00Z",
        overall,
        segments: {},
        qualitative: [],
        privacyMode: "confidential",
      },
      participation: { responses: 25, validResponses: 24, expected: 30, rate: 83.3, daily: [] },
      comments: {},
    });
    const pdf = await renderExecutiveReportPdf({ ...SAMPLE_PDF_INPUT, generator: "rules", model: null, snapshot, report: generateRulesReport(snapshot) });
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(8);
    if (process.env.ROHA_PDF_V2_SAMPLE_OUT) writeFileSync(process.env.ROHA_PDF_V2_SAMPLE_OUT, pdf);
  });
});
