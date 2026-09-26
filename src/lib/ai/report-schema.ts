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

export const DIMENSION_KEYS = ["leadership", "culture", "engagement", "operations", "innovation", "strategy"] as const;

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

export const dimensionNoteSchema = z.object({
  dimension_key: z.enum(DIMENSION_KEYS),
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

export const actionItemSchema = z.object({
  phase: z.enum(["30", "60", "90"]),
  action: z.string(),
  dimension_key: z.enum(DIMENSION_KEYS),
  rationale: z.string(),
  owner_role: z.string().describe("A role, never a named person (e.g. 'Chief Operating Officer')."),
  timeframe: z.string(),
  success_metric: z.string(),
});

export const executiveReportSchema = z.object({
  executive_summary: z.string(),
  strengths: z.array(dimensionNoteSchema),
  development_opportunities: z.array(dimensionNoteSchema),
  leadership_analysis: analysisSectionSchema,
  cultural_analysis: analysisSectionSchema,
  employee_engagement: analysisSectionSchema,
  operational_effectiveness: analysisSectionSchema,
  innovation_readiness: analysisSectionSchema,
  strategic_alignment: analysisSectionSchema,
  qualitative_themes: z.array(qualitativeThemeSchema),
  organizational_priorities: z.array(prioritySchema),
  action_plan: z.array(actionItemSchema),
  limitations: z.array(z.string()),
});

export type ExecutiveReport = z.infer<typeof executiveReportSchema>;
export type AnalysisSection = z.infer<typeof analysisSectionSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;

export const ANALYSIS_SECTIONS: { key: keyof ExecutiveReport & string; letter: string; title: string; dimension: (typeof DIMENSION_KEYS)[number] }[] = [
  { key: "leadership_analysis", letter: "D", title: "Leadership Analysis", dimension: "leadership" },
  { key: "cultural_analysis", letter: "E", title: "Cultural Analysis", dimension: "culture" },
  { key: "employee_engagement", letter: "F", title: "Employee Engagement", dimension: "engagement" },
  { key: "operational_effectiveness", letter: "G", title: "Operational Effectiveness", dimension: "operations" },
  { key: "innovation_readiness", letter: "H", title: "Innovation Readiness", dimension: "innovation" },
  { key: "strategic_alignment", letter: "I", title: "Strategic Alignment", dimension: "strategy" },
];

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
  participation: { responses: number; validResponses: number; expected: number | null; ratePercent: number | null };
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
