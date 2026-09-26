/**
 * Server-side renderer for the ROHA Executive PDF report.
 *
 * Node runtime only — never import this module from a client component.
 * Uses built-in PDF fonts, so rendering performs no network access.
 */
import { createElement, type ReactElement } from "react";
import { Font, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ExecutiveReport, ReportInputSnapshot } from "../../ai/report-schema";
import { ExecutiveReportDocument } from "./document";
import { sanitizeForPdf } from "./text";

// Executive prose reads better without automatic mid-word hyphenation.
Font.registerHyphenationCallback((word) => [word]);

export interface PdfReportInput {
  /** Narrative (AI or rules-generated). */
  report: ExecutiveReport;
  /** Official deterministic aggregates — every number in the PDF comes from here. */
  snapshot: ReportInputSnapshot;
  generator: "anthropic" | "rules";
  model: string | null;
  /** ISO timestamp. */
  generatedAt: string;
  reportId: string;
}

function buildDocument(input: PdfReportInput, registry: Map<string, number>, pageNumbers?: Map<string, number>) {
  return createElement(ExecutiveReportDocument, { ...input, registry, pageNumbers }) as unknown as ReactElement<DocumentProps>;
}

/**
 * Renders the Executive report to a PDF buffer.
 *
 * Rendering happens in two passes: the first lays out the document to learn
 * the page on which each section starts, the second prints those page
 * numbers on the contents page. The contents page is a fixed single page,
 * so page numbers are stable between passes.
 */
export async function renderExecutiveReportPdf(rawInput: PdfReportInput): Promise<Buffer> {
  const input = sanitizeForPdf(rawInput);
  const firstPass = new Map<string, number>();
  const draft = await renderToBuffer(buildDocument(input, firstPass));
  if (firstPass.size === 0) return draft;
  return renderToBuffer(buildDocument(input, new Map(), firstPass));
}
