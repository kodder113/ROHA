/**
 * Structure of the ROHA Executive Organizational Intelligence Report.
 *
 * The same shape is produced by the AI generator (full reports) and by the
 * deterministic rules generator (basic summaries / fallback), so dashboards
 * and the PDF renderer only need to understand one format.
 *
 * Official scores are NEVER stored in this structure — they are always taken
 * from the scoring engine's input snapshot when rendering.
 */
import { z } from "zod";

/** Assessment version 1 dimension keys (six dimensions × four items). */
export const V1_DIMENSION_KEYS = ["leadership", "culture", "engagement", "operations", "innovation", "strategy"] as const;
/** Assessment version 2 dimension keys (five dimensions × five items). */
export const V2_DIMENSION_KEYS = ["leadership", "culture", "engagement", "operations", "strategy_innovation"] as const;
/** Every dimension key a stored report may reference (all versions). */
export const DIMENSION_KEYS = ["leadership", "culture", "engagement", "operations", "innovation", "strategy", "strategy_innovation"] as const;

export const findingSchema = z.object({
  statement: z.string().describe("A finding directly supported by the aggregate response data."),
  evidence: z.string().describe("The specific dimension(s), item(s) and figures from the input that support the finding."),
});

export const hypothesisSchema = z.object({
  statement: z.string().describe("A plausible explanation that is NOT established by the data."),
  how_to_investigate: z.string().describe("How leadership could test this hypothesis (e.g. focus groups, process review)."),
});

export const analysisSectionSchema = z.object({
  summary: z.string(),
  findings: z.array(findingSchema),
  hypotheses: z.array(hypothesisSchema),
});

const dimensionNote = (keys: readonly [string, ...string[]]) =>
  z.object({
    dimension_key: z.enum(keys),
    title: z.string(),
    explanation: z.string(),
  });

export const qualitativeThemeSchema = z.object({
  theme: z.string(),
  question_key: z.enum(["does_well", "makes_harder", "recommend"]),
  prevalence: z.enum(["frequently mentioned", "mentioned by several respondents", "mentioned occasionally"]),
  description: z.string().describe("Paraphrased summary of the theme. Never quote or identify individuals."),
});

export const prioritySchema = z.object({
  priority: z.string(),
  rationale: z.string(),
  basis: z.enum(["finding", "hypothesis"]),
});

const actionItem = (keys: readonly [string, ...string[]]) =>
  z.object({
    phase: z.enum(["30", "60", "90"]),
    action: z.string(),
    dimension_key: z.enum(keys),
    rationale: z.string(),
    owner_role: z.string().describe("A role, never a named person (e.g. 'Chief Operating Officer')."),
    timeframe: z.string(),
    success_metric: z.string(),
  });

/**
 * Report structure whose dimension keys are limited to `keys`. The AI is given
 * the schema for the assessment version being reported on, so it cannot cite a
 * dimension that version does not have. The section keys (A–L) are the same for
 * every version so stored reports keep one format.
 */
export function buildExecutiveReportSchema(keys: readonly [string, ...string[]]) {
  return z.object({
    executive_summary: z.string(),
    strengths: z.array(dimensionNote(keys)),
    development_opportunities: z.array(dimensionNote(keys)),
    leadership_analysis: analysisSectionSchema,
    cultural_analysis: analysisSectionSchema,
    employee_engagement: analysisSectionSchema,
    operational_effectiveness: analysisSectionSchema,
    innovation_readiness: analysisSectionSchema,
    strategic_alignment: analysisSectionSchema,
    qualitative_themes: z.array(qualitativeThemeSchema),
    organizational_priorities: z.array(prioritySchema),
    action_plan: z.array(actionItem(keys)),
    limitations: z.array(z.string()),
  });
}

/** Accepts reports for any assessment version (used to read stored reports). */
export const executiveReportSchema = buildExecutiveReportSchema(DIMENSION_KEYS);
export const dimensionNoteSchema = dimensionNote(DIMENSION_KEYS);
export const actionItemSchema = actionItem(DIMENSION_KEYS);

export type ExecutiveReport = z.infer<typeof executiveReportSchema>;
export type AnalysisSection = z.infer<typeof analysisSectionSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;

export type AnalysisSectionKey =
  | "leadership_analysis"
  | "cultural_analysis"
  | "employee_engagement"
  | "operational_effectiveness"
  | "innovation_readiness"
  | "strategic_alignment";

export interface AnalysisSectionDef {
  key: AnalysisSectionKey;
  letter: string;
  title: string;
  /** Dimension whose official score heads the section. */
  dimension: string;
  /** When set, the section discusses only these items of the dimension (no sub-score is computed). */
  itemKeys?: string[];
  /** Items from other dimensions that give context to the section. */
  contextItemKeys?: string[];
  /** Plain-language scope shown under the section title. */
  scope?: string;
}

/** Sections D–I for assessment version 1: one section per dimension. */
export const ANALYSIS_SECTIONS: AnalysisSectionDef[] = [
  { key: "leadership_analysis", letter: "D", title: "Leadership Analysis", dimension: "leadership" },
  { key: "cultural_analysis", letter: "E", title: "Cultural Analysis", dimension: "culture" },
  { key: "employee_engagement", letter: "F", title: "Employee Engagement", dimension: "engagement" },
  { key: "operational_effectiveness", letter: "G", title: "Operational Effectiveness", dimension: "operations" },
  { key: "innovation_readiness", letter: "H", title: "Innovation Readiness", dimension: "innovation" },
  { key: "strategic_alignment", letter: "I", title: "Strategic Alignment", dimension: "strategy" },
];

/**
 * Sections D–I for assessment version 2. Strategic Alignment & Innovation is one
 * dimension; sections H and I discuss its aspects using item-level figures only.
 */
export const V2_ANALYSIS_SECTIONS: AnalysisSectionDef[] = [
  ...ANALYSIS_SECTIONS.slice(0, 4),
  {
    key: "innovation_readiness",
    letter: "H",
    title: "Innovation Readiness",
    dimension: "strategy_innovation",
    itemKeys: ["SI3", "SI4", "SI5"],
    scope: "Adaptation and ideas aspects of Strategic Alignment & Innovation (items SI3–SI5). No separate score is calculated for this aspect.",
  },
  {
    key: "strategic_alignment",
    letter: "I",
    title: "Strategic Alignment",
    dimension: "strategy_innovation",
    itemKeys: ["SI1", "SI2"],
    contextItemKeys: ["LE2", "LE5"],
    scope:
      "Direction aspects of Strategic Alignment & Innovation (items SI1–SI2), with leadership's direction-setting (LE2, LE5) as context. No separate score is calculated for this aspect.",
  },
];

/** The D–I section layout for the dimensions present in a report snapshot. */
export function analysisSectionsFor(dimensionKeys: readonly string[]): AnalysisSectionDef[] {
  return dimensionKeys.includes("strategy_innovation") ? V2_ANALYSIS_SECTIONS : ANALYSIS_SECTIONS;
}

/**
 * The aggregate-only data sent to the AI provider and stored with the report.
 * Contains no personal information: no names, emails, demographics or
 * individual responses — only rounded aggregates and PII-scrubbed comments.
 */
export interface ReportInputSnapshot {
  organization: { name: string; industry: string | null; employeeCountRange: string | null };
  campaign: { id: string; name: string; closedAt: string | null; privacyMode: string };
  methodology: {
    scale: string;
    normalization: string;
    gapDefinition: string;
    minGroupSize: number;
    engineVersion: string;
    scoringRuleVersion: number;
    assessmentVersion: number;
  };
  participation: {
    responses: number;
    validResponses: number;
    expected: number | null;
    ratePercent: number | null;
    /** Present from scoring engine 1.1: responses excluded by the inclusion rule, with reasons. */
    excludedResponses?: number;
    inclusionRule?: string;
    exclusionReasons?: string[];
  };
  overall: { currentIndex: number | null; desiredIndex: number | null; gap: number | null; band: string | null };
  dimensions: {
    key: string;
    name: string;
    current: number | null;
    desired: number | null;
    gap: number | null;
    gapCategory: string | null;
    band: string | null;
    respondents: number;
    notApplicable: number;
  }[];
  items: {
    key: string;
    dimension: string;
    focus: string;
    statement: string;
    current: number | null;
    desired: number | null;
    gap: number | null;
    respondents: number;
    notApplicable: number;
    /** Percent of numeric current-state ratings that were 4 or 5. */
    currentFavorablePercent: number | null;
  }[];
  segmentsIncluded: false;
  comments: { questionKey: string; prompt: string; count: number; comments: string[] }[];
}
