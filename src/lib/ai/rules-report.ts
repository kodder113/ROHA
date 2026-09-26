/**
 * Deterministic executive summary generator. Used for ROHA Discover ("basic
 * executive summary") and as a transparent fallback when the AI provider is not
 * configured. Every statement is derived mechanically from the snapshot.
 */
import type { AnalysisSectionDef, ExecutiveReport, ReportInputSnapshot } from "./report-schema";
import { analysisSectionsFor, DIMENSION_KEYS } from "./report-schema";
import { numberWord } from "@/lib/text";

type DimKey = (typeof DIMENSION_KEYS)[number];

const f = (v: number | null) => (v === null ? "not available" : v.toFixed(1));
const signed = (v: number | null) => (v === null ? "not available" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`);

export function generateRulesReport(s: ReportInputSnapshot): ExecutiveReport {
  const dims = s.dimensions.filter((d) => d.current !== null);
  const byCurrent = [...dims].sort((a, b) => (b.current ?? 0) - (a.current ?? 0));
  const byGap = [...dims].filter((d) => d.gap !== null).sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));
  const strongest = byCurrent.slice(0, 2);
  const largestGaps = byGap.filter((d) => (d.gap ?? 0) > 0).slice(0, 3);
  const negativeGaps = byGap.filter((d) => (d.gap ?? 0) < 0);
  const lowParticipation = s.participation.ratePercent !== null && s.participation.ratePercent < 50;
  const smallSample = s.participation.validResponses < 20;

  const summary = [
    `${s.participation.validResponses} valid responses were received for "${s.campaign.name}"${
      s.participation.ratePercent !== null ? `, a participation rate of ${f(s.participation.ratePercent)}% of the expected population` : ""
    }.`,
    `The overall current organizational health index is ${f(s.overall.currentIndex)} on a 0–100 scale (${s.overall.band ?? "no band"}), compared with a desired index of ${f(s.overall.desiredIndex)}, an overall gap of ${signed(s.overall.gap)}.`,
    strongest.length ? `The most favorably rated dimension${strongest.length > 1 ? "s were" : " was"} ${strongest.map((d) => `${d.name} (${f(d.current)})`).join(" and ")}.` : "",
    largestGaps.length
      ? `The largest differences between current and desired states appeared in ${largestGaps.map((d) => `${d.name} (gap ${signed(d.gap)})`).join(", ")}.`
      : "No dimension showed a positive gap between the current and desired states.",
    smallSample || lowParticipation
      ? "Because the number of responses or the participation rate is limited, these results should be interpreted with caution."
      : "",
    "This summary was generated automatically from the aggregate scores using fixed rules; it does not include interpretive analysis.",
  ]
    .filter(Boolean)
    .join(" ");

  const itemsFor = (dimName: string) => s.items.filter((i) => i.dimension === dimName && i.current !== null);

  const sectionFor = (sec: AnalysisSectionDef) => {
    const d = s.dimensions.find((x) => x.key === sec.dimension);
    if (!d || d.current === null) {
      return { summary: "Data for this dimension is insufficient to report while protecting confidentiality.", findings: [], hypotheses: [] };
    }
    if (sec.itemKeys) return aspectSection(sec, d);
    const items = itemsFor(d.name).sort((a, b) => (a.current ?? 0) - (b.current ?? 0));
    const lowest = items[0];
    const highest = items[items.length - 1];
    const findings = [
      {
        statement: `${d.name} has a current score of ${f(d.current)} and a desired score of ${f(d.desired)} (gap ${signed(d.gap)}).`,
        evidence: `${d.respondents} respondents provided numeric current-state ratings for this dimension.`,
      },
    ];
    if (highest && lowest && highest.key !== lowest.key) {
      findings.push({
        statement: `Within this dimension, "${highest.focus}" was rated highest (${f(highest.current)}) and "${lowest.focus}" lowest (${f(lowest.current)}).`,
        evidence: `Items ${highest.key} and ${lowest.key}.`,
      });
    }
    return {
      summary: `${d.name} is currently in the "${d.band ?? "unbanded"}" range. ${
        (d.gap ?? 0) >= 10
          ? "Employees indicated a notably stronger desired state than they currently experience."
          : (d.gap ?? 0) <= -10
            ? "Employees indicated a preference for less of this characteristic than they currently experience."
            : "Current and desired states are relatively close."
      }`,
      findings,
      hypotheses: [],
    };
  };

  /** A section covering some items of a dimension: item-level figures only, never a sub-score. */
  const aspectSection = (sec: AnalysisSectionDef, d: ReportInputSnapshot["dimensions"][number]) => {
    const pick = (keys: string[] | undefined) =>
      (keys ?? []).map((k) => s.items.find((i) => i.key === k)).filter((i): i is ReportInputSnapshot["items"][number] => !!i && i.current !== null);
    const items = pick(sec.itemKeys);
    const context = pick(sec.contextItemKeys);
    const findings = items.map((i) => ({
      statement: `"${i.focus}" (${i.key}) has a current score of ${f(i.current)} and a desired score of ${f(i.desired)} (gap ${signed(i.gap)}).`,
      evidence: `Item ${i.key}: ${i.respondents} respondents provided numeric current-state ratings.`,
    }));
    for (const i of context) {
      findings.push({
        statement: `For context, the related leadership item "${i.focus}" (${i.key}) has a current score of ${f(i.current)} (gap ${signed(i.gap)}).`,
        evidence: `Item ${i.key}.`,
      });
    }
    return {
      summary: `This section reports item-level results for part of ${d.name} (overall dimension score ${f(d.current)}, gap ${signed(d.gap)}). ROHA does not calculate a separate score for this aspect.`,
      findings,
      hypotheses: [],
    };
  };

  const sections = Object.fromEntries(
    analysisSectionsFor(s.dimensions.map((d) => d.key)).map((sec) => [sec.key, sectionFor(sec)]),
  ) as unknown as Pick<
    ExecutiveReport,
    "leadership_analysis" | "cultural_analysis" | "employee_engagement" | "operational_effectiveness" | "innovation_readiness" | "strategic_alignment"
  >;
  const dimensionCount = s.dimensions.length;
  const countWord = numberWord(dimensionCount);

  return {
    executive_summary: summary,
    strengths: strongest.map((d) => ({
      dimension_key: d.key as DimKey,
      title: d.name,
      explanation: `Current score ${f(d.current)} (${d.band ?? "unbanded"}), among the highest of the ${countWord} dimensions.`,
    })),
    development_opportunities: largestGaps.map((d) => ({
      dimension_key: d.key as DimKey,
      title: d.name,
      explanation: `Current score ${f(d.current)} versus desired ${f(d.desired)} — a gap of ${signed(d.gap)}.`,
    })),
    ...sections,
    qualitative_themes: [],
    organizational_priorities: largestGaps.map((d) => ({
      priority: `Explore the drivers behind the ${d.name} gap`,
      rationale: `This dimension shows a gap of ${signed(d.gap)} between desired and current states.`,
      basis: "finding" as const,
    })),
    action_plan: largestGaps.slice(0, 3).flatMap((d, i) => [
      {
        phase: "30" as const,
        action: `Share the ${d.name} results with employees and hold listening sessions to understand the gap.`,
        dimension_key: d.key as DimKey,
        rationale: `Gap of ${signed(d.gap)} requires context that survey scores alone cannot provide.`,
        owner_role: i === 0 ? "Chief Executive Officer" : "Senior leadership team",
        timeframe: "Within 30 days",
        success_metric: "Listening sessions completed and themes documented",
      },
      {
        phase: "90" as const,
        action: `Implement and communicate one targeted improvement for ${d.name}.`,
        dimension_key: d.key as DimKey,
        rationale: "Visible follow-through on assessment results builds trust in the process.",
        owner_role: "Senior leadership team",
        timeframe: "Within 90 days",
        success_metric: `Change in the ${d.name} current score in the next ROHA assessment`,
      },
    ]),
    limitations: [
      "This is a rules-based summary; it does not interpret qualitative comments or provide contextual analysis.",
      ...(s.participation.partialResponses
        ? [
            `The overall index is based on the ${s.participation.validResponses} respondents who met the requirement in every dimension; ${s.participation.partialResponses} further response${
              s.participation.partialResponses === 1 ? " is" : "s are"
            } counted only in the dimensions where the requirement was met, so dimension scores and the overall index can rest on different respondents (see each dimension's n).`,
          ]
        : []),
      ...(s.participation.excludedResponses
        ? [
            `${s.participation.excludedResponses} response${s.participation.excludedResponses === 1 ? " was" : "s were"} excluded because ${
              s.participation.excludedResponses === 1 ? "it" : "they"
            } did not meet the inclusion rule (${s.participation.inclusionRule ?? "minimum number of current-state ratings"}).`,
          ]
        : []),
      ...(negativeGaps.length ? [`Negative gaps in ${negativeGaps.map((d) => d.name).join(", ")} indicate a preference for less of the measured characteristic and are not necessarily problems.`] : []),
      ...(smallSample ? ["The number of valid responses is small; individual perceptions may strongly influence the results."] : []),
    ],
  };
}
