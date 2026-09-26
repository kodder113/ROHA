/**
 * SYNTHETIC sample input for the ROHA Executive PDF.
 *
 * Every number and every sentence below is fabricated demonstration data for
 * previews, tests and design review. It does not describe any real
 * organization, respondent or engagement.
 */
import type { ExecutiveReport, ReportInputSnapshot } from "../../ai/report-schema";
import type { PdfReportInput } from "./render";

const DIMENSIONS = [
  { key: "leadership", name: "Leadership Effectiveness" },
  { key: "culture", name: "Organizational Culture" },
  { key: "engagement", name: "Employee Engagement" },
  { key: "operations", name: "Operational Effectiveness" },
  { key: "innovation", name: "Innovation and Adaptability" },
  { key: "strategy", name: "Strategic Alignment" },
] as const;

type ItemSeed = [key: string, dimension: string, focus: string, statement: string, current: number | null, desired: number | null, n: number, na: number, fav: number | null];

const ITEMS: ItemSeed[] = [
  ["LE1", "leadership", "Leadership integrity and trust", "I trust senior leaders to be honest with employees.", 58.4, 91.2, 112, 0, 52],
  ["LE2", "leadership", "Clarity of organizational direction", "Leadership has communicated a clear direction for where the organization is heading.", 49.1, 89.8, 112, 0, 41],
  ["LE3", "leadership", "Management accountability and consistency", "Managers are held to the same standards of accountability as the people they lead.", 44.6, 88.5, 104, 8, 36],
  ["LE4", "leadership", "Confidence in leadership decisions", "I have confidence in the decisions made by leadership.", 52.7, 88.1, 112, 0, 45],
  ["OC1", "culture", "Collaboration and teamwork", "People here work together effectively to accomplish shared goals.", 72.3, 90.4, 113, 0, 71],
  ["OC2", "culture", "Respect and inclusion", "Employees are treated as valued members of the organization regardless of their background or position.", 69.8, 93.6, 113, 0, 67],
  ["OC3", "culture", "Psychological safety", "I can speak up about problems or concerns without fear of negative consequences.", 55.2, 92.1, 113, 0, 49],
  ["OC4", "culture", "Values and behavior alignment", "The way people actually behave here reflects the organization's stated values.", 60.9, 89.0, 113, 0, 56],
  ["EE1", "engagement", "Sense of purpose", "My work gives me a sense of purpose.", 76.5, 90.8, 114, 0, 78],
  ["EE2", "engagement", "Recognition and appreciation", "I receive meaningful recognition when I do good work.", 51.3, 87.9, 114, 0, 43],
  ["EE3", "engagement", "Professional development", "I have access to opportunities to grow professionally.", 48.7, 89.3, 114, 0, 40],
  ["EE4", "engagement", "Commitment to the organization", "I feel committed to helping this organization succeed.", 79.4, 88.6, 114, 0, 81],
  ["OE1", "operations", "Process efficiency", "Our work processes allow tasks to be completed without unnecessary steps or delays.", 41.2, 88.7, 113, 0, 30],
  ["OE2", "operations", "Tools and technology", "I have the tools and technology I need to do my job well.", 57.6, 90.2, 113, 0, 51],
  ["OE3", "operations", "Interdepartmental coordination", "Departments coordinate effectively when work depends on more than one team.", 38.9, 87.4, 101, 12, 27],
  ["OE4", "operations", "Clarity of responsibilities and procedures", "It is clear who is responsible for each part of the work I am involved in.", 50.4, 89.9, 113, 0, 44],
  ["IA1", "innovation", "Openness to new ideas", "New ideas are welcomed here, even when they challenge established ways of working.", 56.8, 88.2, 112, 0, 50],
  ["IA2", "innovation", "Responsiveness to change", "The organization adapts effectively when circumstances change.", 54.1, 86.9, 107, 5, 47],
  ["IA3", "innovation", "Improving inefficient processes", "When a process is not working well, the organization takes action to improve it.", 45.3, 88.4, 112, 0, 37],
  ["IA4", "innovation", "Support for employee-driven innovation", "Employees receive the support they need to try out their ideas for improvement.", null, null, 4, 108, null],
  ["SA1", "strategy", "Understanding of organizational goals", "I understand the organization's most important goals.", 70.2, 91.5, 113, 0, 69],
  ["SA2", "strategy", "Alignment of daily work with objectives", "My day-to-day work directly supports the organization's business objectives.", 74.8, 89.7, 113, 0, 75],
  ["SA3", "strategy", "Communication of strategic priorities", "Strategic priorities are communicated to employees on a regular basis.", 53.9, 88.3, 113, 0, 46],
  ["SA4", "strategy", "Understanding of individual contribution", "I understand how my individual contributions affect the organization's success.", 73.6, 90.1, 113, 0, 74],
];

const round1 = (v: number) => Math.round(v * 10) / 10;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function band(v: number | null): string | null {
  if (v === null) return null;
  if (v >= 80) return "Strongly favorable";
  if (v >= 60) return "Generally favorable";
  if (v >= 40) return "Mixed perceptions";
  return "Needs focused attention";
}

function gapCategory(g: number | null): string | null {
  if (g === null) return null;
  const a = Math.abs(g);
  return a >= 20 ? "substantial" : a >= 10 ? "notable" : "aligned";
}

const items: ReportInputSnapshot["items"] = ITEMS.map(([key, dimension, focus, statement, current, desired, n, na, fav]) => ({
  key,
  dimension,
  focus,
  statement,
  current,
  desired,
  gap: current !== null && desired !== null ? round1(desired - current) : null,
  respondents: n,
  notApplicable: na,
  currentFavorablePercent: fav,
}));

const dimensions: ReportInputSnapshot["dimensions"] = DIMENSIONS.map((d) => {
  const its = items.filter((i) => i.dimension === d.key);
  const cur = mean(its.map((i) => i.current).filter((v): v is number => v !== null));
  const des = mean(its.map((i) => i.desired).filter((v): v is number => v !== null));
  const current = cur === null ? null : round1(cur);
  const desired = des === null ? null : round1(des);
  const gap = current !== null && desired !== null ? round1(desired - current) : null;
  return {
    key: d.key,
    name: d.name,
    current,
    desired,
    gap,
    gapCategory: gapCategory(gap),
    band: band(current),
    respondents: Math.max(...its.map((i) => i.respondents)),
    notApplicable: its.reduce((a, i) => a + i.notApplicable, 0),
  };
});

const overallCurrent = round1(mean(dimensions.map((d) => d.current as number))!);
const overallDesired = round1(mean(dimensions.map((d) => d.desired as number))!);

export const SAMPLE_SNAPSHOT: ReportInputSnapshot = {
  organization: { name: "Demonstration Organization (Synthetic Data)", industry: "Professional services (synthetic)", employeeCountRange: "101–250" },
  campaign: { id: "00000000-0000-4000-8000-000000000001", name: "2026 Organizational Health Baseline (Demo)", closedAt: "2026-09-18T21:00:00.000Z", privacyMode: "confidential" },
  methodology: {
    scale: "1–5 agreement (1 = strongly disagree, 5 = strongly agree)",
    normalization: "linear_0_100",
    gapDefinition: "Desired-state index minus current-state index",
    minGroupSize: 5,
    engineVersion: "1.0.0",
    scoringRuleVersion: 1,
    assessmentVersion: 1,
  },
  participation: { responses: 118, validResponses: 114, expected: 162, ratePercent: 72.8 },
  overall: { currentIndex: overallCurrent, desiredIndex: overallDesired, gap: round1(overallDesired - overallCurrent), band: band(overallCurrent) },
  dimensions,
  items,
  segmentsIncluded: false,
  comments: [
    { questionKey: "does_well", prompt: "What is one thing this organization does particularly well?", count: 87, comments: [] },
    { questionKey: "makes_harder", prompt: "What is one thing that makes your work more difficult than it needs to be?", count: 92, comments: [] },
    { questionKey: "recommend", prompt: "If you could recommend one organizational improvement to leadership, what would it be?", count: 79, comments: [] },
  ],
};

const d = (key: string) => dimensions.find((x) => x.key === key)!;
const f1 = (v: number | null) => (v === null ? "—" : v.toFixed(1));

export const SAMPLE_REPORT: ExecutiveReport = {
  executive_summary: `This synthetic demonstration report summarizes the responses of 114 valid participants (a 72.8% participation rate). The overall Organizational Health Index stands at ${f1(overallCurrent)} against a desired state of ${f1(overallDesired)}, placing the organization in the "${band(overallCurrent)}" band with a substantial gap between today's experience and employees' aspirations.

Employees describe a workforce that is committed, purpose-driven and collaborative: Employee Engagement items on purpose (EE1) and commitment (EE4) and the Strategic Alignment items on understanding goals and individual contribution are the most favorable results in the assessment. At the same time, Operational Effectiveness (${f1(d("operations").current)}) and Leadership Effectiveness (${f1(d("leadership").current)}) show the lowest current scores and the widest gaps, driven by process efficiency, interdepartmental coordination, management accountability and clarity of direction.

The pattern suggests a highly committed workforce whose energy is being absorbed by operational friction and uneven leadership consistency. Leadership should treat the operational and leadership findings as the first priority, while testing — through structured follow-up conversations — the hypotheses offered in this report about their underlying causes.`,
  strengths: [
    { dimension_key: "engagement", title: "Strong sense of purpose and commitment", explanation: "Items on purpose (EE1, 76.5) and commitment to the organization's success (EE4, 79.4) are the two highest current-state scores in the assessment, with roughly four in five respondents rating them favorably." },
    { dimension_key: "strategy", title: "Employees connect their work to organizational goals", explanation: "Respondents report a clear understanding of the organization's goals (SA1, 70.2) and of how their own contribution matters (SA4, 73.6), indicating a solid foundation for strategic execution." },
    { dimension_key: "culture", title: "Collaborative and respectful working relationships", explanation: "Collaboration and teamwork (OC1, 72.3) and respect and inclusion (OC2, 69.8) are rated favorably by about two-thirds or more of respondents." },
  ],
  development_opportunities: [
    { dimension_key: "operations", title: "Reduce process friction and improve cross-team coordination", explanation: "Operational Effectiveness has the lowest dimension score. Interdepartmental coordination (OE3, 38.9) and process efficiency (OE1, 41.2) are the two lowest items in the assessment, each with gaps above 45 points." },
    { dimension_key: "leadership", title: "Strengthen accountability and clarity of direction", explanation: "Management accountability (LE3, 44.6) and clarity of organizational direction (LE2, 49.1) are well below the organizational average, and fewer than half of respondents rate leadership decisions favorably." },
    { dimension_key: "engagement", title: "Invest in recognition and professional growth", explanation: "Despite strong purpose and commitment, recognition (EE2, 51.3) and professional development (EE3, 48.7) lag considerably, a combination that can put retention of committed employees at risk over time." },
  ],
  leadership_analysis: {
    summary: "Leadership Effectiveness is among the two lowest-scoring dimensions. Trust in senior leaders' honesty is moderate, while accountability and clarity of direction are the weakest leadership items. The desired-state ratings are uniformly high, signalling that employees place significant value on leadership that is consistent and clear.",
    findings: [
      { statement: "Management accountability is the lowest-rated leadership item.", evidence: "LE3 current 44.6 vs desired 88.5 (gap +43.9); 36% favorable; 8 respondents marked the item not applicable." },
      { statement: "Clarity of direction trails trust in leadership honesty by roughly nine points.", evidence: "LE2 current 49.1 vs LE1 current 58.4; both carry gaps above 30 points." },
    ],
    hypotheses: [
      { statement: "Accountability expectations may be applied inconsistently across management layers.", how_to_investigate: "Hold facilitated listening sessions with front-line staff and review how performance expectations for managers are set and reviewed." },
      { statement: "Strategic direction may be communicated at the senior level but diluted as it cascades through middle management.", how_to_investigate: "Map the communication path of a recent strategic decision and interview managers about the information they received and passed on." },
    ],
  },
  cultural_analysis: {
    summary: "The culture is experienced as collaborative and respectful, but psychological safety is notably lower than the other cultural items. Employees work well together yet are less certain that raising concerns is safe.",
    findings: [
      { statement: "Psychological safety is the weakest cultural item and carries the largest cultural gap.", evidence: "OC3 current 55.2 vs desired 92.1 (gap +36.9); 49% favorable, compared with 71% for collaboration (OC1)." },
    ],
    hypotheses: [
      { statement: "Past responses to raised concerns may have discouraged employees from speaking up.", how_to_investigate: "Review how recent concerns or suggestions were handled and closed out, and ask teams in small-group sessions what happens after issues are raised." },
    ],
  },
  employee_engagement: {
    summary: "Engagement shows the sharpest internal contrast in the assessment: purpose and commitment are strengths, while recognition and professional development are among the weaker items overall.",
    findings: [
      { statement: "Purpose and commitment are the organization's strongest items.", evidence: "EE1 76.5 and EE4 79.4 current; 78% and 81% favorable respectively." },
      { statement: "Professional development has a gap of roughly 40 points.", evidence: "EE3 current 48.7 vs desired 89.3 (gap +40.6); 40% favorable." },
    ],
    hypotheses: [
      { statement: "Career pathways may be unclear outside a small number of roles.", how_to_investigate: "Inventory current development programs and promotion paths by function and compare with employee awareness through a short pulse check." },
    ],
  },
  operational_effectiveness: {
    summary: "Operational Effectiveness is the lowest-scoring dimension. The two lowest items in the entire assessment — interdepartmental coordination and process efficiency — sit in this dimension.",
    findings: [
      { statement: "Interdepartmental coordination is the lowest-rated item in the assessment.", evidence: "OE3 current 38.9 vs desired 87.4 (gap +48.5); 27% favorable; 12 respondents marked the item not applicable." },
      { statement: "Process efficiency is rated unfavorably by most respondents.", evidence: "OE1 current 41.2 (30% favorable) vs desired 88.7." },
    ],
    hypotheses: [
      { statement: "Hand-offs between departments may lack clear ownership, creating rework and delays.", how_to_investigate: "Conduct a process walk-through of two or three high-volume cross-functional workflows and document hand-off points, delays and decision rights." },
      { statement: "Approval steps may have accumulated over time without periodic review.", how_to_investigate: "Audit approval requirements in core processes and identify steps that could be removed or delegated." },
    ],
  },
  innovation_readiness: {
    summary: "Openness to new ideas is moderate, while acting on inefficient processes is weaker. One item (IA4, support for employee-driven innovation) was suppressed because too few respondents provided a numeric rating.",
    findings: [
      { statement: "Employees see ideas welcomed more readily than they see processes actually improved.", evidence: "IA1 current 56.8 vs IA3 current 45.3; IA3 gap +43.1." },
      { statement: "The item on support for employee-driven innovation could not be reported.", evidence: "IA4 had only 4 numeric ratings (108 not applicable), below the minimum group size of 5." },
    ],
    hypotheses: [
      { statement: "The high rate of 'not applicable' responses to IA4 may indicate that few employees perceive a channel for proposing improvements.", how_to_investigate: "Ask in follow-up sessions whether employees know how to propose and test an improvement idea, and review whether such a channel exists." },
    ],
  },
  strategic_alignment: {
    summary: "Strategic Alignment is a relative strength. Employees understand the goals and their own contribution, but regular communication of strategic priorities is rated noticeably lower.",
    findings: [
      { statement: "Regular communication of priorities lags understanding of goals by about 16 points.", evidence: "SA3 current 53.9 vs SA1 current 70.2; SA3 gap +34.4." },
    ],
    hypotheses: [
      { statement: "Understanding of goals may rest on an annual planning event rather than on an ongoing communication rhythm.", how_to_investigate: "Review the cadence and channels of strategic communication over the past two quarters." },
    ],
  },
  qualitative_themes: [
    { theme: "Committed, mission-focused colleagues", question_key: "does_well", prevalence: "frequently mentioned", description: "Respondents frequently describe colleagues as dedicated to clients and to the organization's mission, and willing to help one another under pressure." },
    { theme: "Quality of client service", question_key: "does_well", prevalence: "mentioned by several respondents", description: "Several respondents highlight the organization's reputation for responsive, high-quality service." },
    { theme: "Supportive immediate teams", question_key: "does_well", prevalence: "mentioned occasionally", description: "Some comments point to supportive team-level relationships and flexible working arrangements." },
    { theme: "Slow approvals and duplicated steps", question_key: "makes_harder", prevalence: "frequently mentioned", description: "Many comments describe multiple approval layers and repeated data entry that slow routine work." },
    { theme: "Unclear hand-offs between departments", question_key: "makes_harder", prevalence: "mentioned by several respondents", description: "Respondents describe uncertainty about who owns work that crosses departmental boundaries." },
    { theme: "Outdated or disconnected systems", question_key: "makes_harder", prevalence: "mentioned occasionally", description: "Some respondents mention systems that do not share information, requiring manual workarounds." },
    { theme: "More regular updates from leadership", question_key: "recommend", prevalence: "frequently mentioned", description: "Respondents frequently recommend more frequent, two-way communication about priorities and decisions." },
    { theme: "Visible career development paths", question_key: "recommend", prevalence: "mentioned by several respondents", description: "Several respondents recommend clearer development opportunities and transparent criteria for advancement." },
  ],
  organizational_priorities: [
    { priority: "Simplify cross-functional workflows and clarify ownership", rationale: "Operational Effectiveness is the lowest-scoring dimension, and coordination and process efficiency are the two lowest items, consistent with the most frequent comment theme.", basis: "finding" },
    { priority: "Establish consistent management accountability standards", rationale: "Management accountability is the lowest leadership item with a gap above 40 points.", basis: "finding" },
    { priority: "Create a regular two-way leadership communication rhythm", rationale: "Clarity of direction and communication of priorities are weak relative to understanding of goals, and more regular updates are the most frequent recommendation.", basis: "finding" },
    { priority: "Build a structured channel for employee improvement ideas", rationale: "The suppressed IA4 item and weaker process-improvement results may indicate the absence of a clear channel; this should be confirmed before significant investment.", basis: "hypothesis" },
  ],
  action_plan: [
    { phase: "30", action: "Share assessment results with all employees and commit to specific follow-up", dimension_key: "leadership", rationale: "Demonstrates that feedback is heard and supports trust and psychological safety.", owner_role: "Chief Executive Officer", timeframe: "Weeks 1–3", success_metric: "Results briefing delivered to 100% of teams" },
    { phase: "30", action: "Run listening sessions on cross-department hand-offs", dimension_key: "operations", rationale: "Tests hypotheses about unclear ownership before redesigning processes.", owner_role: "Chief Operating Officer", timeframe: "Weeks 2–4", success_metric: "Six sessions held; top five friction points documented" },
    { phase: "60", action: "Redesign two high-volume cross-functional workflows", dimension_key: "operations", rationale: "Targets the lowest-scoring items (OE1, OE3) and the most frequent comment theme.", owner_role: "Director of Operations", timeframe: "Weeks 5–8", success_metric: "Cycle time reduced on both workflows; approval steps documented and reduced" },
    { phase: "60", action: "Define and communicate manager accountability expectations", dimension_key: "leadership", rationale: "Addresses the lowest leadership item (LE3).", owner_role: "Chief Human Resources Officer", timeframe: "Weeks 5–9", success_metric: "Expectations published; included in all manager check-ins" },
    { phase: "60", action: "Launch a monthly leadership update with a question-and-answer segment", dimension_key: "strategy", rationale: "Improves regular communication of priorities (SA3) and clarity of direction (LE2).", owner_role: "Chief Executive Officer", timeframe: "Weeks 6–8", success_metric: "Monthly cadence maintained; attendance tracked" },
    { phase: "90", action: "Pilot a recognition practice and publish development pathways", dimension_key: "engagement", rationale: "Addresses the recognition (EE2) and development (EE3) gaps.", owner_role: "Chief Human Resources Officer", timeframe: "Weeks 9–12", success_metric: "Pathways published for all job families; pilot feedback collected" },
    { phase: "90", action: "Conduct a pulse re-assessment of priority items", dimension_key: "operations", rationale: "Measures early change on the prioritized items and informs the next cycle.", owner_role: "Chief Operating Officer", timeframe: "Week 12", success_metric: "Pulse completed with participation at or above baseline" },
  ],
  limitations: [
    "Item IA4 (support for employee-driven innovation) could not be reported because fewer than five respondents provided a numeric rating.",
    "Roughly 27% of invited employees did not respond; their views may differ from those of participants.",
    "No segment-level (e.g., department or tenure) analysis is included in this executive report.",
  ],
};

export const SAMPLE_PDF_INPUT: PdfReportInput = {
  report: SAMPLE_REPORT,
  snapshot: SAMPLE_SNAPSHOT,
  generator: "anthropic",
  model: "claude-sample-model",
  generatedAt: "2026-09-26T15:00:00.000Z",
  reportId: "SAMPLE-SYNTHETIC-0001",
};
