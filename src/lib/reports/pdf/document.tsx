/**
 * ROHA Executive PDF — document tree.
 *
 * Narrative text comes from the ExecutiveReport (AI or rules generated).
 * Every number printed comes from the deterministic ReportInputSnapshot.
 */
import type { ReactNode } from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { numberWord } from "../../text";
import { analysisSectionsFor, type AnalysisSectionDef, type AnalysisSection, type ActionItem, type ExecutiveReport, type ReportInputSnapshot } from "../../ai/report-schema";
import { BRAND } from "../../brand";
import { GapChart, GroupedBarChart, BrandMark, IndexGauge, RadarChart } from "./charts";
import {
  AccentCard,
  Bullets,
  DataTable,
  Empty,
  FINDING_TAG,
  HYPOTHESIS_TAG,
  KeyFigure,
  LabelValue,
  MinorHeading,
  Paragraphs,
  REPORT_TITLE,
  RunningChrome,
  SectionHeading,
  SubHeading,
  Tag,
  type PageRegistry,
} from "./components";
import {
  DASH,
  bandLabel,
  capitalize,
  dimensionNamer,
  fmtDate,
  fmtGap,
  fmtInt,
  fmtPercent,
  fmtScore,
  generatorLabel,
  isNum,
  privacyModeLabel,
} from "./format";
import { CONTENT_WIDTH, COLORS, FONTS, styles } from "./styles";

export interface ReportDocumentProps {
  report: ExecutiveReport;
  snapshot: ReportInputSnapshot;
  generator: "anthropic" | "rules";
  model: string | null;
  generatedAt: string;
  reportId: string;
  /** Filled during layout with the page each section starts on. */
  registry?: PageRegistry;
  /** Page numbers from a previous layout pass, shown on the contents page. */
  pageNumbers?: Map<string, number>;
}

export const SECTIONS = [
  { id: "summary", title: "Executive Summary" },
  { id: "methodology", title: "Assessment Methodology" },
  { id: "participation", title: "Respondent Population and Participation" },
  { id: "index", title: "Organizational Health Index" },
  { id: "profile", title: "Organizational Profile by Dimension" },
  { id: "comparison", title: "Current versus Desired Comparison" },
  { id: "strengths", title: "Organizational Strengths" },
  { id: "development", title: "Development Opportunities" },
  { id: "feedback", title: "Employee Feedback Themes" },
  { id: "recommendations", title: "Executive Recommendations" },
  { id: "roadmap", title: "Proposed 90-Day Improvement Roadmap" },
  { id: "limitations", title: "Methodological Limitations" },
  { id: "about", title: "About Rodrik Consulting" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function sectionNumber(id: SectionId): number {
  return SECTIONS.findIndex((s) => s.id === id) + 1;
}

const QUESTION_LABELS: Record<string, string> = {
  does_well: "What the organization does particularly well",
  makes_harder: "What makes work more difficult than it needs to be",
  recommend: "Recommended organizational improvements",
};

const PREVALENCE_ORDER = ["frequently mentioned", "mentioned by several respondents", "mentioned occasionally"];

// ---------------------------------------------------------------------------
// Cover
// ---------------------------------------------------------------------------

function CoverPage({ snapshot, generatedAt }: { snapshot: ReportInputSnapshot; generatedAt: string }) {
  const org = snapshot.organization.name;
  return (
    <Page size="LETTER" style={{ fontFamily: FONTS.sans, backgroundColor: COLORS.white }}>
      {/* Navy band */}
      <View style={{ backgroundColor: COLORS.navy, height: 520, paddingHorizontal: 60, paddingTop: 56 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <BrandMark size={40} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 24, fontFamily: FONTS.sansBold, color: COLORS.white, letterSpacing: 5 }}>ROHA</Text>
              <Text style={{ fontSize: 7.5, color: "#b7c3d9", letterSpacing: 1.2, marginTop: 1 }}>{BRAND.productFull.toUpperCase()}</Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 7.5,
              fontFamily: FONTS.sansBold,
              color: COLORS.white,
              letterSpacing: 2,
              borderWidth: 0.8,
              borderColor: COLORS.emerald,
              paddingHorizontal: 8,
              paddingTop: 4,
              paddingBottom: 3,
            }}
          >
            CONFIDENTIAL
          </Text>
        </View>

        <View style={{ marginTop: 120 }}>
          <View style={{ width: 56, height: 3, backgroundColor: COLORS.emerald, marginBottom: 18 }} />
          <Text style={{ fontSize: 34, fontFamily: FONTS.serifBold, color: COLORS.white, lineHeight: 1.12, maxWidth: 440 }}>{REPORT_TITLE}</Text>
          <Text style={{ fontSize: 10.5, color: "#b7c3d9", marginTop: 16, letterSpacing: 0.4 }}>{BRAND.tagline}</Text>
        </View>

        <View style={{ marginTop: 44 }}>
          <Text style={{ fontSize: 7.5, color: COLORS.emerald, fontFamily: FONTS.sansBold, letterSpacing: 1.5 }}>PREPARED FOR</Text>
          <Text style={{ fontSize: 17, color: COLORS.white, fontFamily: FONTS.serif, marginTop: 5 }}>{org}</Text>
        </View>
      </View>
      <View style={{ height: 5, backgroundColor: COLORS.emerald }} />

      {/* Lower panel */}
      <View style={{ paddingHorizontal: 60, paddingTop: 34, flexDirection: "row" }}>
        <View style={{ width: "50%", paddingRight: 20 }}>
          <CoverField label="Assessment campaign" value={snapshot.campaign.name} />
          <CoverField label="Campaign closed" value={fmtDate(snapshot.campaign.closedAt)} />
          <CoverField label="Report date" value={fmtDate(generatedAt)} />
        </View>
        <View style={{ width: "50%", paddingLeft: 20, borderLeftWidth: 0.6, borderLeftColor: COLORS.rule }}>
          <CoverField label="Prepared by" value={BRAND.company} />
          <CoverField label="Principal" value={BRAND.founder} />
          <CoverField label="Classification" value="Confidential — for leadership use" />
        </View>
      </View>

      <View style={{ position: "absolute", bottom: 32, left: 60, right: 60, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 7, color: COLORS.muted }}>{`© ${new Date(generatedAt).getUTCFullYear() || ""} ${BRAND.company}. All rights reserved.`}</Text>
        <Text style={{ fontSize: 7, color: COLORS.muted }}>rodrikconsulting.com</Text>
      </View>
    </Page>
  );
}

function CoverField({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={{ fontSize: 10.5, color: COLORS.navy, fontFamily: FONTS.sansBold, marginTop: 3 }}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Contents
// ---------------------------------------------------------------------------

function ContentsPage({ snapshot, pageNumbers }: { snapshot: ReportInputSnapshot; pageNumbers?: Map<string, number> }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <RunningChrome orgName={snapshot.organization.name} />
      <View style={styles.sectionHead}>
        <Text style={styles.sectionKicker}>Report structure</Text>
        <Text style={styles.sectionTitle}>Contents</Text>
        <View style={styles.sectionRule} />
      </View>
      <View style={{ marginTop: 10 }}>
        {SECTIONS.map((s, i) => (
          <View
            key={s.id}
            style={{ flexDirection: "row", alignItems: "flex-end", paddingVertical: 8.5, borderBottomWidth: 0.5, borderBottomColor: COLORS.ruleLight }}
          >
            <Text style={{ width: 34, fontSize: 13, fontFamily: FONTS.serifBold, color: COLORS.emerald }}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={{ flex: 1, fontSize: 11, color: COLORS.navy, fontFamily: FONTS.sansBold }}>{s.title}</Text>
            <Text style={{ width: 40, textAlign: "right", fontSize: 10, color: COLORS.muted }}>
              {pageNumbers?.get(s.id) ? String(pageNumbers.get(s.id)) : ""}
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.note, { marginTop: 28 }]}>
        <Text style={{ fontFamily: FONTS.sansBold, marginBottom: 2 }}>How to read this report</Text>
        <Text style={styles.noteText}>
          All scores are reported on a 0–100 index derived from employee ratings. Narrative conclusions are labeled either as findings, which are
          directly supported by the response data, or as hypotheses, which are plausible explanations that leadership should test before acting on
          them. A dash (—) indicates a value that is unavailable or suppressed to protect respondent privacy.
        </Text>
      </View>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function ExecutiveSummary({ report, snapshot, registry }: SectionProps) {
  const { overall, participation } = snapshot;
  return (
    <View>
      <SectionHeading id="summary" number={sectionNumber("summary")} title="Executive Summary" registry={registry} />
      <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: COLORS.navy, borderBottomWidth: 0.6, borderBottomColor: COLORS.rule, paddingVertical: 10, marginBottom: 16 }} wrap={false}>
        <KeyFigure label="Current index" value={fmtScore(overall.currentIndex)} sub={bandLabel(overall.band)} />
        <KeyFigure label="Desired index" value={fmtScore(overall.desiredIndex)} sub="Employee aspiration" accent={COLORS.emerald} />
        <KeyFigure label="Gap" value={fmtGap(overall.gap)} sub="Desired – current" />
        <KeyFigure label="Valid responses" value={fmtInt(participation.validResponses)} sub={`of ${fmtInt(participation.responses)} submitted`} />
        <KeyFigure label="Participation" value={fmtPercent(participation.ratePercent)} sub={participation.expected ? `of ${fmtInt(participation.expected)} invited` : "Invitation count n/a"} />
      </View>
      <Paragraphs text={report.executive_summary} lead />
    </View>
  );
}

function Methodology({ snapshot, generator, model, registry }: SectionProps) {
  const m = snapshot.methodology;
  const dimCount = snapshot.dimensions.length;
  const itemCount = snapshot.items.length;
  const perDim = dimCount > 0 ? Math.round(itemCount / dimCount) : 0;
  return (
    <View break>
      <SectionHeading
        id="methodology"
        number={sectionNumber("methodology")}
        title="Assessment Methodology"
        intro="How the numbers in this report were produced, and how the narrative relates to them."
        registry={registry}
      />
      <Text style={styles.paragraph}>
        {`The Rodrik Organizational Health Assessment (ROHA) examines ${dimCount} organizational dimensions${
          perDim > 0 ? `, each measured by ${perDim} items (${itemCount} items in total)` : ""
        }. For every item, respondents rate their agreement twice: once for how the organization operates today (current state) and once for how they believe it should operate (desired state). Ratings use a five-point agreement scale from 1 (strongly disagree) to 5 (strongly agree); respondents may mark an item as not applicable where permitted.`}
      </Text>

      <SubHeading>Scoring rules</SubHeading>
      <View style={styles.panel} wrap={false}>
        <LabelValue label="Rating scale" value={m.scale} />
        <LabelValue label="Normalization" value={`${m.normalization === "linear_0_100" ? "Linear, 0–100" : m.normalization}  —  index = ((rating – 1) ÷ 4) × 100`} />
        <LabelValue label="Weighting" value="Equal weights for items within a dimension and for dimensions within the overall index" />
        <LabelValue label="Gap" value={`${m.gapDefinition}  —  gap = desired – current`} />
        <LabelValue label="Not applicable" value="N/A and missing ratings are excluded from all averages" />
        {snapshot.participation.inclusionRule ? (
          <LabelValue label="Inclusion rule" value={`A response is scored only with ${snapshot.participation.inclusionRule}`} />
        ) : null}
        <LabelValue label="Minimum group size" value={`${m.minGroupSize} valid respondents; smaller groups are suppressed (—)`} />
        <LabelValue label="Scoring engine" value={`Engine ${m.engineVersion} · Scoring rules v${m.scoringRuleVersion} · Assessment v${m.assessmentVersion}`} />
      </View>

      <Text style={styles.paragraph}>
        The overall Organizational Health Index is the equally weighted mean of the dimension indices. A positive gap indicates that respondents
        want more of what the dimension describes than they experience today; larger gaps highlight where perceived reality and aspiration are
        furthest apart. Gap categories (aligned, notable, substantial) follow the thresholds defined in the scoring rules version cited above.
      </Text>

      <SubHeading>Role of the narrative</SubHeading>
      <Text style={styles.paragraph}>
        All scores, gaps, counts and percentages in this report are calculated by the deterministic ROHA scoring engine and are reproduced
        directly from its output. The written interpretation was generated from these aggregate results only; it never alters or recalculates
        any score, and it did not have access to individual responses or identities.
      </Text>
      <View style={styles.note} wrap={false}>
        <Text style={styles.noteText}>
          <Text style={{ fontFamily: FONTS.sansBold, fontSize: 8.5, lineHeight: 1.4 }}>Narrative generation: </Text>
          {generatorLabel(generator, model)}.{" "}
          {generator === "anthropic"
            ? "AI-generated interpretation has been structured to separate data-supported findings from hypotheses and should be reviewed by leadership in context."
            : "The narrative was assembled from predefined rules applied to the aggregate scores."}
        </Text>
      </View>
    </View>
  );
}

function Participation({ snapshot, registry }: SectionProps) {
  const p = snapshot.participation;
  const mode = snapshot.campaign.privacyMode;
  const privacyText =
    mode === "anonymous"
      ? "This campaign ran in anonymous mode. No demographic or profile information was retained with responses, so results are reported for the organization as a whole only."
      : mode === "confidential"
        ? "This campaign ran in confidential mode. Responses are stored securely and are never shown individually; leadership sees only aggregated results, and any group smaller than the minimum group size is suppressed. This executive report presents organization-wide aggregates only and contains no segment or subgroup breakdowns."
        : "Responses are reported in aggregate only, and groups below the minimum group size are suppressed.";
  return (
    <View break>
      <SectionHeading
        id="participation"
        number={sectionNumber("participation")}
        title="Respondent Population and Participation"
        registry={registry}
      />
      <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: COLORS.navy, borderBottomWidth: 0.6, borderBottomColor: COLORS.rule, paddingVertical: 10, marginBottom: 12 }} wrap={false}>
        <KeyFigure label="Responses submitted" value={fmtInt(p.responses)} />
        <KeyFigure label="Valid responses" value={fmtInt(p.validResponses)} sub="Included in scoring" />
        <KeyFigure label="Expected participants" value={fmtInt(p.expected)} />
        <KeyFigure label="Participation rate" value={fmtPercent(p.ratePercent)} accent={COLORS.emerald} />
      </View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: "50%", paddingRight: 14 }}>
          <MinorHeading>Organization</MinorHeading>
          <LabelValue label="Organization" value={snapshot.organization.name} />
          <LabelValue label="Industry" value={snapshot.organization.industry ?? DASH} />
          <LabelValue label="Employee count" value={snapshot.organization.employeeCountRange ?? DASH} />
          <LabelValue label="Campaign" value={snapshot.campaign.name} />
          <LabelValue label="Closed" value={fmtDate(snapshot.campaign.closedAt)} />
        </View>
        <View style={{ width: "50%", paddingLeft: 14 }}>
          <MinorHeading>{`Privacy mode: ${privacyModeLabel(mode)}`}</MinorHeading>
          <Text style={styles.paragraph}>{privacyText}</Text>
          <Text style={styles.paragraph}>
            {`A response is counted as valid when it meets the inclusion rule${p.inclusionRule ? `: ${p.inclusionRule}` : " (a minimum number of current-state ratings)"}. ${
              p.validResponses < p.responses ? `${fmtInt(p.responses - p.validResponses)} submitted response(s) did not meet this rule and were excluded.` : "All submitted responses met this rule."
            }`}
          </Text>
          {p.exclusionReasons?.length ? <Bullets items={p.exclusionReasons.map((r) => `${r}.`)} /> : null}
        </View>
      </View>
    </View>
  );
}

function HealthIndex({ snapshot, registry }: SectionProps) {
  const o = snapshot.overall;
  return (
    <View style={{ marginTop: 22 }}>
      <SectionHeading
        id="index"
        number={sectionNumber("index")}
        title="Organizational Health Index"
        intro={`A single, equally weighted summary of all ${numberWord(snapshot.dimensions.length)} dimensions.`}
        registry={registry}
      />
      <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 6 }} wrap={false}>
        <BigNumber label="Current state" value={fmtScore(o.currentIndex)} color={COLORS.navy} />
        <BigNumber label="Desired state" value={fmtScore(o.desiredIndex)} color={COLORS.emerald} />
        <BigNumber label="Gap" value={fmtGap(o.gap)} color={COLORS.ink} />
        <View style={{ flex: 1.3, paddingLeft: 12, borderLeftWidth: 0.6, borderLeftColor: COLORS.rule }}>
          <Text style={styles.label}>Band</Text>
          <Text style={{ fontSize: 13, fontFamily: FONTS.serifBold, color: COLORS.navy, marginTop: 4 }}>{bandLabel(o.band)}</Text>
        </View>
      </View>
      <View wrap={false} style={{ marginTop: 8 }}>
        <IndexGauge current={o.currentIndex} desired={o.desiredIndex} width={CONTENT_WIDTH} />
      </View>
    </View>
  );
}

function BigNumber({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, paddingRight: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={{ fontSize: 34, fontFamily: FONTS.serifBold, color, lineHeight: 1.05, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function Profile({ snapshot, registry }: SectionProps) {
  const dims = snapshot.dimensions;
  return (
    <View break>
      <SectionHeading
        id="profile"
        number={sectionNumber("profile")}
        title="Organizational Profile by Dimension"
        intro="Current and desired indices for each dimension of organizational health."
        registry={registry}
      />
      <View wrap={false} style={{ alignItems: "center", marginBottom: 4 }}>
        <RadarChart dimensions={dims} width={360} height={300} />
        <Legend />
      </View>
      <DataTable
        rows={dims}
        keyOf={(d) => d.key}
        columns={[
          { header: "Dimension", width: "34%", bold: true, render: (d) => d.name },
          { header: "Current", width: "11%", align: "right", render: (d) => fmtScore(d.current) },
          { header: "Desired", width: "11%", align: "right", render: (d) => fmtScore(d.desired) },
          { header: "Gap", width: "10%", align: "right", render: (d) => fmtGap(d.gap) },
          { header: "Band", width: "26%", render: (d) => bandLabel(d.band) },
          { header: "n", width: "8%", align: "right", render: (d) => fmtInt(d.respondents) },
        ]}
      />
    </View>
  );
}

function Legend() {
  const item = (color: string, label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 10 }}>
      <View style={{ width: 14, height: 6, backgroundColor: color, marginRight: 5 }} />
      <Text style={{ fontSize: 7.5, color: COLORS.body }}>{label}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 4 }}>
      {item(COLORS.navy, "Current state")}
      {item(COLORS.emerald, "Desired state")}
    </View>
  );
}

function Comparison({ snapshot, registry }: SectionProps) {
  const dims = snapshot.dimensions;
  const itemsByDim = dims.map((d) => ({ dim: d, items: snapshot.items.filter((it) => it.dimension === d.key) }));
  const orphanItems = snapshot.items.filter((it) => !dims.some((d) => d.key === it.dimension));
  if (orphanItems.length > 0) {
    itemsByDim.push({
      dim: { key: "_other", name: "Other items", current: null, desired: null, gap: null, gapCategory: null, band: null, respondents: 0, notApplicable: 0 },
      items: orphanItems,
    });
  }
  return (
    <View break>
      <SectionHeading
        id="comparison"
        number={sectionNumber("comparison")}
        title="Current versus Desired Comparison"
        intro="Where employees' experience today differs most from the organization they want."
        registry={registry}
      />
      <View wrap={false}>
        <SubHeading style={{ marginTop: 0 }}>Current and desired index by dimension</SubHeading>
        <GroupedBarChart dimensions={dims} width={CONTENT_WIDTH} />
        <Legend />
      </View>
      <View wrap={false} style={{ marginTop: 10 }}>
        <SubHeading>Gap by dimension (desired – current)</SubHeading>
        <GapChart dimensions={dims} width={CONTENT_WIDTH} />
      </View>

      <View break>
        <SubHeading style={{ marginTop: 0 }}>Item-level results</SubHeading>
        <Text style={styles.small}>
          {`Index values on the 0–100 scale. “Favorable” is the share of current-state ratings of 4 or 5. n = respondents with a numeric rating. Values below the minimum group size (${snapshot.methodology.minGroupSize}) are shown as —.`}
        </Text>
        {snapshot.items.length === 0 ? (
          <Empty />
        ) : (
          <View style={styles.table}>
            <View style={styles.thRow} fixed>
              <Text style={[styles.th, { width: "52%" }]}>Item</Text>
              <Text style={[styles.th, { width: "10%", textAlign: "right" }]}>Current</Text>
              <Text style={[styles.th, { width: "10%", textAlign: "right" }]}>Desired</Text>
              <Text style={[styles.th, { width: "9%", textAlign: "right" }]}>Gap</Text>
              <Text style={[styles.th, { width: "11%", textAlign: "right" }]}>Favorable</Text>
              <Text style={[styles.th, { width: "8%", textAlign: "right" }]}>n</Text>
            </View>
            {itemsByDim.map(({ dim, items }) => (
              <View key={dim.key}>
                {items.map((it, idx) => {
                  const row = (
                    <View key={it.key} style={styles.tr} wrap={false}>
                      <View style={{ width: "52%", paddingHorizontal: 3 }}>
                        <Text style={{ fontSize: 8.2, fontFamily: FONTS.sansBold, color: COLORS.ink }}>{`${it.key} · ${it.focus}`}</Text>
                        <Text style={{ fontSize: 7.3, color: COLORS.muted, marginTop: 1, lineHeight: 1.3 }}>{it.statement}</Text>
                      </View>
                      <Text style={[styles.tdNum, { width: "10%" }]}>{fmtScore(it.current)}</Text>
                      <Text style={[styles.tdNum, { width: "10%" }]}>{fmtScore(it.desired)}</Text>
                      <Text style={[styles.tdNum, { width: "9%", fontFamily: FONTS.sansBold }]}>{fmtGap(it.gap)}</Text>
                      <Text style={[styles.tdNum, { width: "11%" }]}>{fmtPercent(it.currentFavorablePercent)}</Text>
                      <Text style={[styles.tdNum, { width: "8%" }]}>{fmtInt(it.respondents)}</Text>
                    </View>
                  );
                  // Keep each dimension label together with its first item.
                  return idx === 0 ? (
                    <View key={it.key} wrap={false}>
                      <GroupRow name={dim.name} />
                      {row}
                    </View>
                  ) : (
                    row
                  );
                })}
                {items.length === 0 ? (
                  <View wrap={false}>
                    <GroupRow name={dim.name} />
                    <View style={styles.tr}>
                      <Text style={styles.empty}>No items identified.</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function GroupRow({ name }: { name: string }) {
  return (
    <View style={styles.groupRow}>
      <Text style={{ fontSize: 8, fontFamily: FONTS.sansBold, color: COLORS.navy }}>{name}</Text>
    </View>
  );
}

function DimensionNotes({ notes, accent, snapshot }: { notes: ExecutiveReport["strengths"]; accent: string; snapshot: ReportInputSnapshot }) {
  const nameOf = dimensionNamer(snapshot);
  if (notes.length === 0) return <Empty />;
  return (
    <View>
      {notes.map((n, i) => {
        const dim = snapshot.dimensions.find((d) => d.key === n.dimension_key);
        return (
          <AccentCard key={i} accent={accent} background={COLORS.panel}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={{ fontSize: 7, fontFamily: FONTS.sansBold, color: accent, letterSpacing: 0.8, textTransform: "uppercase" }}>
                {nameOf(n.dimension_key)}
              </Text>
              {dim ? (
                <Text style={{ fontSize: 7, color: COLORS.muted }}>
                  {`Current ${fmtScore(dim.current)} · Desired ${fmtScore(dim.desired)} · Gap ${fmtGap(dim.gap)}`}
                </Text>
              ) : null}
            </View>
            <Text style={{ fontSize: 10.5, fontFamily: FONTS.serifBold, color: COLORS.navy, marginBottom: 3 }}>{n.title}</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.4 }}>{n.explanation}</Text>
          </AccentCard>
        );
      })}
    </View>
  );
}

function Strengths({ report, snapshot, registry }: SectionProps) {
  return (
    <View break>
      <SectionHeading
        id="strengths"
        number={sectionNumber("strengths")}
        title="Organizational Strengths"
        intro="Areas where employees report the most favorable current experience — assets to protect and build upon."
        registry={registry}
      />
      <DimensionNotes notes={report.strengths} accent={COLORS.emerald} snapshot={snapshot} />
    </View>
  );
}

function AnalysisBlock({ def, section, dimensionName, dim, items }: {
  def: AnalysisSectionDef;
  section: AnalysisSection | undefined;
  dimensionName: string;
  dim: ReportInputSnapshot["dimensions"][number] | undefined;
  items: ReportInputSnapshot["items"];
}) {
  const title = def.title;
  const itemLine = [...(def.itemKeys ?? []), ...(def.contextItemKeys ?? [])]
    .map((k) => items.find((i) => i.key === k))
    .filter((i): i is ReportInputSnapshot["items"][number] => !!i)
    .map((i) => `${i.key} ${fmtScore(i.current)} (gap ${fmtGap(i.gap)})`)
    .join(" · ");
  return (
    <View style={{ marginTop: 16 }}>
      <View wrap={false} style={{ flexDirection: "row", alignItems: "flex-end", borderBottomWidth: 0.6, borderBottomColor: COLORS.rule, paddingBottom: 4, marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontFamily: FONTS.serifBold, color: COLORS.navy, flex: 1 }}>{title}</Text>
        <Text style={{ fontSize: 7.5, color: COLORS.muted }}>
          {dim ? `${dimensionName} · Current ${fmtScore(dim.current)} · Desired ${fmtScore(dim.desired)} · Gap ${fmtGap(dim.gap)}` : dimensionName}
        </Text>
      </View>
      {def.scope ? (
        <Text style={{ fontSize: 8, color: COLORS.muted, marginBottom: 6, lineHeight: 1.35 }}>
          {def.scope}
          {itemLine ? `  Item current scores: ${itemLine}.` : ""}
        </Text>
      ) : null}
      {!section ? (
        <Empty />
      ) : (
        <>
          <Paragraphs text={section.summary} />
          <KeepWithFirst
            heading="Findings (supported by response data)"
            items={section.findings.map((f, i) => (
              <AccentCard key={`f${i}`} accent={COLORS.emerald} background={COLORS.white}>
                <Tag {...FINDING_TAG} />
                <Text style={{ fontSize: 9, color: COLORS.ink, fontFamily: FONTS.sansBold, marginTop: 4, lineHeight: 1.35 }}>{f.statement}</Text>
                <Text style={{ fontSize: 8, color: COLORS.muted, marginTop: 2, lineHeight: 1.35 }}>
                  <Text style={{ fontFamily: FONTS.sansBold, color: COLORS.emeraldDark }}>Evidence: </Text>
                  {f.evidence}
                </Text>
              </AccentCard>
            ))}
          />
          <KeepWithFirst
            heading="Hypotheses for further investigation"
            items={section.hypotheses.map((h, i) => (
              <AccentCard key={`h${i}`} accent={COLORS.amber} background={COLORS.amberTint}>
                <Tag {...HYPOTHESIS_TAG} />
                <Text style={{ fontSize: 9, color: COLORS.ink, fontFamily: FONTS.sansOblique, marginTop: 4, lineHeight: 1.35 }}>{h.statement}</Text>
                <Text style={{ fontSize: 8, color: COLORS.muted, marginTop: 2, lineHeight: 1.35 }}>
                  <Text style={{ fontFamily: FONTS.sansBold, color: COLORS.amber }}>How to investigate: </Text>
                  {h.how_to_investigate}
                </Text>
              </AccentCard>
            ))}
          />
        </>
      )}
    </View>
  );
}

/** A minor heading kept on the same page as the first item that follows it. */
function KeepWithFirst({ heading, items }: { heading: string; items: ReactNode[] }) {
  const [first, ...rest] = items;
  return (
    <>
      <View wrap={false}>
        <MinorHeading>{heading}</MinorHeading>
        {first ?? <Empty />}
      </View>
      {rest}
    </>
  );
}

function Development({ report, snapshot, registry }: SectionProps) {
  const nameOf = dimensionNamer(snapshot);
  return (
    <View style={{ marginTop: 22 }}>
      <SectionHeading
        id="development"
        number={sectionNumber("development")}
        title="Development Opportunities"
        intro="Where the gap between current experience and aspiration is widest, followed by a dimension-by-dimension analysis."
        registry={registry}
      />
      <DimensionNotes notes={report.development_opportunities} accent={COLORS.navy} snapshot={snapshot} />

      <View break wrap={false}>
        <SubHeading style={{ marginTop: 0 }}>Dimension analysis</SubHeading>
        <View style={{ flexDirection: "row", marginBottom: 2 }}>
          <View style={{ marginRight: 12 }}>
            <Tag {...FINDING_TAG} />
          </View>
          <Text style={{ fontSize: 8, color: COLORS.muted, flex: 1 }}>
            Conclusions directly supported by the aggregate response data, with the supporting evidence cited.
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginTop: 4 }}>
          <View style={{ marginRight: 12 }}>
            <Tag {...HYPOTHESIS_TAG} />
          </View>
          <Text style={{ fontSize: 8, color: COLORS.muted, flex: 1 }}>
            Plausible explanations not established by the data; each should be tested before action is taken.
          </Text>
        </View>
      </View>
      {analysisSectionsFor(snapshot.dimensions.map((d) => d.key)).map((s) => (
        <AnalysisBlock
          key={s.key}
          def={s}
          section={report[s.key] as AnalysisSection | undefined}
          dimensionName={nameOf(s.dimension)}
          dim={snapshot.dimensions.find((d) => d.key === s.dimension)}
          items={snapshot.items}
        />
      ))}
    </View>
  );
}

function Feedback({ report, snapshot, registry }: SectionProps) {
  const keys = Array.from(new Set([...snapshot.comments.map((c) => c.questionKey), ...report.qualitative_themes.map((t) => t.question_key)]));
  const promptFor = (key: string) => snapshot.comments.find((c) => c.questionKey === key)?.prompt;
  const countFor = (key: string) => snapshot.comments.find((c) => c.questionKey === key)?.count;
  return (
    <View break>
      <SectionHeading
        id="feedback"
        number={sectionNumber("feedback")}
        title="Employee Feedback Themes"
        intro="Recurring themes from the open-ended questions, summarized in aggregate."
        registry={registry}
      />
      <View style={styles.note} wrap={false}>
        <Text style={styles.noteText}>
          Themes are paraphrased summaries of written comments. No comment is quoted verbatim and no individual is identified. Prevalence labels
          describe how often a theme appeared relative to other themes and are not statistical estimates.
        </Text>
      </View>
      {keys.length === 0 ? <Empty /> : null}
      {keys.map((key) => {
        const themes = report.qualitative_themes
          .filter((t) => t.question_key === key)
          .sort((a, b) => PREVALENCE_ORDER.indexOf(a.prevalence) - PREVALENCE_ORDER.indexOf(b.prevalence));
        const count = countFor(key);
        return (
          <View key={key} style={{ marginTop: 10 }}>
            <View wrap={false} minPresenceAhead={70} style={{ borderBottomWidth: 0.6, borderBottomColor: COLORS.rule, paddingBottom: 4, marginBottom: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Text style={{ fontSize: 12, fontFamily: FONTS.serifBold, color: COLORS.navy, flex: 1 }}>{QUESTION_LABELS[key] ?? capitalize(key.replace(/_/g, " "))}</Text>
                <Text style={{ fontSize: 7.5, color: COLORS.muted }}>{isNum(count) ? `${fmtInt(count)} comment${count === 1 ? "" : "s"}` : `${DASH} comments`}</Text>
              </View>
              {promptFor(key) ? <Text style={{ fontSize: 7.8, color: COLORS.muted, fontFamily: FONTS.sansOblique, marginTop: 2 }}>{`“${promptFor(key)}”`}</Text> : null}
            </View>
            {themes.length === 0 ? (
              <Empty />
            ) : (
              themes.map((t, i) => (
                <View key={i} style={{ flexDirection: "row", marginBottom: 7 }} wrap={false}>
                  <View style={{ width: 118, paddingRight: 8 }}>
                    <Text style={{ fontSize: 6.8, fontFamily: FONTS.sansBold, color: COLORS.emeraldDark, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {t.prevalence}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONTS.sansBold, color: COLORS.ink }}>{t.theme}</Text>
                    <Text style={{ fontSize: 8.8, marginTop: 1.5, lineHeight: 1.4 }}>{t.description}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}

function Recommendations({ report, registry }: SectionProps) {
  const priorities = report.organizational_priorities;
  return (
    <View break>
      <SectionHeading
        id="recommendations"
        number={sectionNumber("recommendations")}
        title="Executive Recommendations"
        intro="Organizational priorities in recommended order, each tagged by the strength of its evidential basis."
        registry={registry}
      />
      {priorities.length === 0 ? (
        <Empty />
      ) : (
        priorities.map((p, i) => {
          const isFinding = p.basis === "finding";
          return (
            <View key={i} style={{ flexDirection: "row", marginBottom: 12, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.ruleLight }} wrap={false}>
              <Text style={{ width: 38, fontSize: 22, fontFamily: FONTS.serifBold, color: COLORS.emerald, lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, fontFamily: FONTS.serifBold, color: COLORS.navy, marginBottom: 4 }}>{p.priority}</Text>
                <Text style={{ fontSize: 9, marginBottom: 5, lineHeight: 1.4 }}>{p.rationale}</Text>
                <Tag {...(isFinding ? { ...FINDING_TAG, label: "Basis: finding" } : { ...HYPOTHESIS_TAG, label: "Basis: hypothesis — validate first" })} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const PHASES: { phase: ActionItem["phase"]; title: string; subtitle: string }[] = [
  { phase: "30", title: "Days 1–30", subtitle: "Stabilize and listen" },
  { phase: "60", title: "Days 31–60", subtitle: "Design and pilot" },
  { phase: "90", title: "Days 61–90", subtitle: "Embed and measure" },
];

function Roadmap({ report, snapshot, registry }: SectionProps) {
  const nameOf = dimensionNamer(snapshot);
  return (
    <View break>
      <SectionHeading
        id="roadmap"
        number={sectionNumber("roadmap")}
        title="Proposed 90-Day Improvement Roadmap"
        intro="A phased plan for leadership review. Owners are indicated by role; timeframes and metrics should be confirmed before launch."
        registry={registry}
      />
      {report.action_plan.length === 0 ? <Empty /> : null}
      {report.action_plan.length > 0 &&
        PHASES.map((ph) => {
          const actions = report.action_plan.filter((a) => a.phase === ph.phase);
          return (
            <View key={ph.phase} style={{ marginBottom: 8 }}>
              <View wrap={false} minPresenceAhead={80} style={{ flexDirection: "row", alignItems: "center", backgroundColor: COLORS.navy, paddingHorizontal: 8, paddingVertical: 5, marginTop: 6 }}>
                <Text style={{ fontSize: 9.5, fontFamily: FONTS.sansBold, color: COLORS.white, width: 90 }}>{ph.title}</Text>
                <Text style={{ fontSize: 8.5, color: "#b7c3d9" }}>{ph.subtitle}</Text>
                <Text style={{ fontSize: 7.5, color: COLORS.emerald, marginLeft: "auto", fontFamily: FONTS.sansBold }}>{`${actions.length} action${actions.length === 1 ? "" : "s"}`}</Text>
              </View>
              {actions.length === 0 ? (
                <Empty />
              ) : (
                <DataTable
                  rows={actions}
                  keyOf={(_, i) => `${ph.phase}-${i}`}
                  columns={[
                    { header: "Action", width: "24%", render: (a) => <Text style={{ fontSize: 7.8, fontFamily: FONTS.sansBold, color: COLORS.navy }}>{a.action}</Text> },
                    { header: "Dimension", width: "13%", render: (a) => <Text style={{ fontSize: 7.5 }}>{nameOf(a.dimension_key)}</Text> },
                    { header: "Rationale", width: "22%", render: (a) => <Text style={{ fontSize: 7.5 }}>{a.rationale}</Text> },
                    { header: "Owner role", width: "13%", render: (a) => <Text style={{ fontSize: 7.5 }}>{a.owner_role}</Text> },
                    { header: "Timeframe", width: "11%", render: (a) => <Text style={{ fontSize: 7.5 }}>{a.timeframe}</Text> },
                    { header: "Success metric", width: "17%", render: (a) => <Text style={{ fontSize: 7.5 }}>{a.success_metric}</Text> },
                  ]}
                />
              )}
            </View>
          );
        })}
    </View>
  );
}

function standardLimitations(snapshot: ReportInputSnapshot): string[] {
  const p = snapshot.participation;
  return [
    "Perception data. ROHA measures employees' self-reported perceptions and aspirations at a point in time. Perceptions are meaningful organizational signals but are not direct measures of operational performance or outcomes.",
    `Instrument status. ${BRAND.independenceStatement}`,
    "No external benchmarks. Scores are interpreted on their own 0–100 scale and relative to the organization's own desired state. No industry or normative benchmarks are applied, and comparisons with other organizations should not be inferred.",
    `Sample and participation. Results reflect the ${fmtInt(p.validResponses)} valid response(s) received${
      isNum(p.ratePercent) ? ` (a ${fmtPercent(p.ratePercent)} participation rate)` : ""
    }. Employees who chose not to participate may hold different views, so results may not represent the entire workforce.`,
    `Small-group suppression. To protect confidentiality, any result based on fewer than ${snapshot.methodology.minGroupSize} valid respondents is suppressed and shown as —. Suppression can limit the granularity of the analysis.`,
    ...(snapshot.methodology.assessmentVersion >= 2
      ? [
          `Assessment version. These results use assessment version ${snapshot.methodology.assessmentVersion}, whose dimensions, items and inclusion rule differ from version 1. Overall and dimension scores should not be compared directly with results from a different assessment version.`,
          ...(snapshot.dimensions.some((d) => d.key === "strategy_innovation")
            ? [
                "Integrated dimension. Strategic Alignment & Innovation combines direction and adaptive-innovation aspects in one score. Whether a single score represents it well has not yet been tested, so its aspects are discussed using item-level results.",
              ]
            : []),
          "Desired-state ratings. Desired ratings for most items are expected to be high, so gaps largely mirror current scores. Gaps are presented as indicators of where employees most want improvement; the value of the desired rating is being evaluated in the pilot.",
        ]
      : []),
    "Cross-sectional design. This assessment is a single snapshot. It cannot establish causes or trends; repeating the assessment after interventions is needed to measure change.",
    "Narrative interpretation. Findings and hypotheses are interpretations of aggregate data. Hypotheses in particular are not conclusions and should be validated through follow-up inquiry before significant decisions are made.",
  ];
}

function Limitations({ report, snapshot, registry }: SectionProps) {
  const std = standardLimitations(snapshot);
  return (
    <View break>
      <SectionHeading
        id="limitations"
        number={sectionNumber("limitations")}
        title="Methodological Limitations"
        intro="Considerations that should inform how the results in this report are used."
        registry={registry}
      />
      <SubHeading style={{ marginTop: 0 }}>Standard limitations of this assessment</SubHeading>
      <View>
        {std.map((s, i) => {
          const [head, ...rest] = s.split(". ");
          return (
            <View key={i} style={styles.bulletRow} wrap={false}>
              <Text style={styles.bulletDot}>•</Text>
              <View style={styles.bulletBody}>
                <Text style={styles.bulletText}>
                  <Text style={{ fontFamily: FONTS.sansBold, color: COLORS.navy }}>{`${head}. `}</Text>
                  {rest.join(". ")}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <SubHeading>Limitations specific to this report</SubHeading>
      <Bullets items={report.limitations} />
    </View>
  );
}

function About({ reportId, generator, model, generatedAt, snapshot, registry }: SectionProps) {
  return (
    <View break>
      <SectionHeading id="about" number={sectionNumber("about")} title="About Rodrik Consulting" registry={registry} />
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <BrandMark size={34} onDark={false} />
        <View style={{ marginLeft: 10 }}>
          <Text style={{ fontSize: 13, fontFamily: FONTS.sansBold, color: COLORS.navy }}>{BRAND.company}</Text>
          <Text style={{ fontSize: 8.5, color: COLORS.muted }}>{BRAND.tagline}</Text>
        </View>
      </View>
      <Text style={styles.paragraph}>
        {`${BRAND.company} developed ROHA — the ${BRAND.productFull} — to give leadership teams a clear, structured view of how their organization is experienced by the people who work in it, and of the organization those people want it to become.`}
      </Text>
      <SubHeading>Founder</SubHeading>
      <Text style={styles.paragraph}>
        <Text style={{ fontFamily: FONTS.sansBold, color: COLORS.navy }}>{BRAND.founder}</Text>
        {` — founder of ${BRAND.company}. ${BRAND.founderName} holds the ${BRAND.founderCredential} degree.`}
      </Text>
      <SubHeading>Independence statement</SubHeading>
      <View style={styles.note}>
        <Text style={styles.noteText}>{BRAND.independenceStatement}</Text>
      </View>
      <SubHeading>Contact</SubHeading>
      <LabelValue label="Website" value={BRAND.companyUrl.replace(/^https?:\/\//, "")} />
      <LabelValue label="Engagement" value="Follow-up diagnostics, executive interviews and facilitated action planning are available on request." />

      <View style={{ marginTop: 26, paddingTop: 8, borderTopWidth: 0.6, borderTopColor: COLORS.rule }} wrap={false}>
        <Text style={styles.label}>Report record</Text>
        <Text style={{ fontSize: 7.5, color: COLORS.muted, marginTop: 3 }}>
          {`Report ID ${reportId} · Generated ${fmtDate(generatedAt)} · ${generatorLabel(generator, model)} · Scoring engine ${snapshot.methodology.engineVersion}, rules v${snapshot.methodology.scoringRuleVersion}, assessment v${snapshot.methodology.assessmentVersion}`}
        </Text>
        <Text style={{ fontSize: 7.5, color: COLORS.muted, marginTop: 3 }}>
          {`This report is confidential and prepared solely for the leadership of ${snapshot.organization.name}. It should not be distributed outside the organization without the consent of ${BRAND.company}.`}
        </Text>
      </View>
    </View>
  );
}

type SectionProps = ReportDocumentProps;

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export function ExecutiveReportDocument(props: ReportDocumentProps) {
  const { snapshot } = props;
  const org = snapshot.organization.name;
  return (
    <Document
      title={`${REPORT_TITLE} — ${org}`}
      author={BRAND.company}
      subject={`${BRAND.productFull} — ${snapshot.campaign.name}`}
      creator={`${BRAND.product} · ${BRAND.company}`}
      producer={BRAND.product}
      keywords="ROHA, organizational health, executive report"
      language="en-US"
    >
      <CoverPage snapshot={snapshot} generatedAt={props.generatedAt} />
      <ContentsPage snapshot={snapshot} pageNumbers={props.pageNumbers} />
      <Page size="LETTER" style={styles.page} wrap>
        <RunningChrome orgName={org} />
        <ExecutiveSummary {...props} />
        <Methodology {...props} />
        <Participation {...props} />
        <HealthIndex {...props} />
        <Profile {...props} />
        <Comparison {...props} />
        <Strengths {...props} />
        <Development {...props} />
        <Feedback {...props} />
        <Recommendations {...props} />
        <Roadmap {...props} />
        <Limitations {...props} />
        <About {...props} />
      </Page>
    </Document>
  );
}
