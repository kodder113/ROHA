import type { ReportInputSnapshot } from "./report-schema";
import type { ParticipationSummary, ResultsPayload } from "@/lib/results/types";
import { round1 } from "@/lib/scoring/engine";
import { describeExclusions } from "@/lib/results/exclusions";

/**
 * Builds the aggregate-only snapshot that is (a) sent to the AI provider and
 * (b) stored with the report as the source of every official number.
 * Contains no personal information and no subgroup results.
 */
export function buildReportSnapshot(args: {
  organization: { name: string; industry: string | null; employee_count_range: string | null };
  campaign: { id: string; name: string; closed_at: string | null; closes_at: string; privacy_mode: string };
  payload: ResultsPayload;
  participation: ParticipationSummary;
  comments: Record<string, string[]>;
}): ReportInputSnapshot {
  const { payload, participation } = args;
  const o = payload.overall;
  const dimName = new Map(o.dimensions.map((d) => [d.key, d.name]));
  const exclusions = describeExclusions(o);
  return {
    organization: {
      name: args.organization.name,
      industry: args.organization.industry,
      employeeCountRange: args.organization.employee_count_range,
    },
    campaign: {
      id: args.campaign.id,
      name: args.campaign.name,
      closedAt: args.campaign.closed_at ?? args.campaign.closes_at,
      privacyMode: args.campaign.privacy_mode,
    },
    methodology: {
      scale: "1 = Strongly disagree, 2 = Disagree, 3 = Neither agree nor disagree, 4 = Agree, 5 = Strongly agree; Not Applicable excluded from averages",
      normalization: "Normalized score = ((rating − 1) / 4) × 100; question scores averaged with equal weights into dimensions, dimensions averaged with equal weights into the overall index. Only responses meeting the inclusion rule (see participation) are scored",
      gapDefinition: "Gap = desired score − current score. Positive: employees prefer more of the characteristic. Negative: employees prefer less.",
      minGroupSize: payload.minGroupSize,
      engineVersion: payload.engineVersion,
      scoringRuleVersion: payload.scoringRuleVersion,
      assessmentVersion: payload.assessmentVersion,
    },
    participation: {
      responses: participation.responses,
      validResponses: o.validResponses,
      expected: participation.expected,
      ratePercent: participation.rate === null ? null : round1(participation.rate),
      ...(exclusions
        ? { excludedResponses: exclusions.excluded, inclusionRule: exclusions.rule, exclusionReasons: exclusions.reasons }
        : {}),
    },
    overall: {
      currentIndex: round1(o.overall.currentIndex),
      desiredIndex: round1(o.overall.desiredIndex),
      gap: round1(o.overall.gap.value),
      band: o.overall.band,
    },
    dimensions: o.dimensions.map((d) => ({
      key: d.key,
      name: d.name,
      current: round1(d.current.score),
      desired: round1(d.desired.score),
      gap: round1(d.gap.value),
      gapCategory: d.gap.category,
      band: d.band,
      respondents: d.current.n,
      notApplicable: d.current.naCount,
    })),
    items: o.questions.map((q) => {
      const favorable = q.current.n > 0 && q.current.score !== null ? ((q.current.distribution[3] + q.current.distribution[4]) / q.current.n) * 100 : null;
      return {
        key: q.key,
        dimension: dimName.get(q.dimensionKey) ?? q.dimensionKey,
        focus: q.focus,
        statement: q.prompt,
        current: round1(q.current.score),
        desired: round1(q.desired.score),
        gap: round1(q.gap.value),
        respondents: q.current.n,
        notApplicable: q.current.naCount,
        currentFavorablePercent: round1(favorable),
      };
    }),
    segmentsIncluded: false,
    comments: payload.qualitative.map((q) => ({
      questionKey: q.key,
      prompt: q.prompt,
      count: q.commentCount,
      comments: (args.comments[q.key] ?? []).slice(0, 150),
    })),
  };
}
