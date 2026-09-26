import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderExecutiveReportPdf } from "./render";
import { SAMPLE_PDF_INPUT } from "./sample";

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
});
