import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BarChartHorizontal,
  CalendarClock,
  ClipboardList,
  Database,
  FileDown,
  Fingerprint,
  GitBranch,
  Grid3x3,
  History,
  KeyRound,
  Layers,
  LineChart,
  ListFilter,
  Radar,
  ScrollText,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { Eyebrow, FeatureCard, PageHero, Section, SectionHeading } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Executive dashboards, privacy-aware filters, an AI organizational intelligence report, executive PDF reporting, campaign management, and enterprise-grade security in ROHA.",
};

const visualizations = [
  { Icon: Radar, title: "Current vs. desired radar", body: "The organization's profile across every dimension, today and as employees believe it should be, in a single view." },
  { Icon: BarChart3, title: "Organizational health bar chart", body: "Dimension indices side by side, with descriptive bands for quick orientation." },
  { Icon: BarChartHorizontal, title: "Dimension gap chart", body: "Where the distance between experience and aspiration is greatest—ranked for prioritization." },
  { Icon: Layers, title: "Response distribution", body: "How ratings are spread across the scale, so averages never hide polarized opinion." },
  { Icon: Users, title: "Departmental comparison", body: "Dimension results by department, shown only for groups that meet the privacy threshold." },
  { Icon: LineChart, title: "Historical trend", body: "Movement across successive campaigns, scored under consistent, versioned rules." },
  { Icon: Activity, title: "Participation dashboard", body: "Response counts and participation over the life of the campaign, without revealing who responded." },
  { Icon: Grid3x3, title: "Organizational health heatmap", body: "Every statement across every eligible group, making patterns visible at a glance." },
];

const reportSections = [
  "Executive summary",
  "Organizational strengths",
  "Development opportunities",
  "Leadership analysis",
  "Culture analysis",
  "Engagement analysis",
  "Operations analysis",
  "Innovation analysis",
  "Strategy analysis",
  "Qualitative themes",
  "Strategic priorities",
  "30/60/90-day action plan",
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="An executive intelligence platform—not another survey tool."
        description="ROHA pairs a focused assessment with the analytical depth leaders expect from business intelligence: purpose-built visualizations, disciplined AI analysis, and security designed for sensitive organizational data."
      />

      {/* Dashboard */}
      <Section aria-labelledby="dashboard-heading">
        <SectionHeading
          id="dashboard-heading"
          eyebrow="Executive dashboard"
          title="Eight visualizations, each answering a leadership question."
          description="Every chart is designed to be read in a leadership meeting: clear hierarchy, consistent color for current and desired states, and honest treatment of small groups."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visualizations.map(({ Icon, title, body }) => (
            <li key={title} className="rounded-xl border border-line bg-white p-5 shadow-card">
              <Icon className="h-5 w-5 text-emerald-600" aria-hidden />
              <h3 className="mt-4 font-sans text-base font-semibold text-navy-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-6 rounded-2xl border border-line bg-canvas p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-emerald-400">
            <ListFilter className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h3 className="font-sans text-lg font-semibold text-navy-900">Filters that respect privacy thresholds</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Explore results by department, location, level and tenure. Any combination that would describe fewer than five respondents is
              suppressed automatically, and complementary suppression prevents small groups from being inferred by subtraction.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted">
          <Link href="/demo" className="font-semibold text-navy-900 underline-offset-4 hover:text-emerald-700 hover:underline">
            View the demonstration dashboard — synthetic data →
          </Link>
        </p>
      </Section>

      {/* AI report */}
      <Section tone="navy" aria-labelledby="ai-heading">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              id="ai-heading"
              inverted
              eyebrow="AI organizational intelligence report"
              title="A consultant-style analysis, built on calculated evidence."
              description="ROHA's AI report reads like a structured briefing from an organizational advisor. It interprets the scores ROHA has already calculated—it never produces or alters them."
            />
            <ul className="mt-10 space-y-5 text-sm leading-relaxed text-navy-200">
              <li className="border-l-2 border-emerald-500 pl-4">
                <strong className="text-white">Findings versus hypotheses.</strong> Observations drawn directly from the data are clearly separated
                from possible explanations that leaders may wish to test.
              </li>
              <li className="border-l-2 border-emerald-500 pl-4">
                <strong className="text-white">Qualitative themes.</strong> Written comments, screened for identifiers, are synthesized into
                themes. Quotations appear only where respondents gave permission.
              </li>
              <li className="border-l-2 border-emerald-500 pl-4">
                <strong className="text-white">Aggregate inputs only.</strong> No personal employee information is sent for AI processing.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-navy-700 bg-navy-800/60 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-300">Report structure</p>
            <ol className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {reportSections.map((s, i) => (
                <li key={s} className="flex items-baseline gap-3 text-sm text-white">
                  <span className="font-mono text-xs text-emerald-400 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-navy-700 pt-5 text-xs leading-relaxed text-navy-300">
              Full reports are included in ROHA Professional and above; ROHA Discover includes a basic executive summary.
            </p>
          </div>
        </div>
      </Section>

      {/* Reporting & campaign management */}
      <Section aria-labelledby="operate-heading">
        <SectionHeading
          id="operate-heading"
          eyebrow="Reporting and campaign management"
          title="Everything required to run the assessment well."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={<FileDown className="h-5 w-5" aria-hidden />} title="Executive PDF report">
            A print-ready report with the dashboard&rsquo;s key visualizations and the AI analysis, formatted for leadership teams and boards.
          </FeatureCard>
          <FeatureCard icon={<CalendarClock className="h-5 w-5" aria-hidden />} title="Campaign scheduling">
            Set opening and closing dates. Results are released when the campaign closes, so no one reads partial results mid-flight.
          </FeatureCard>
          <FeatureCard icon={<ClipboardList className="h-5 w-5" aria-hidden />} title="Departments and locations">
            Define the organizational structure that matters for comparison, and choose between confidential and anonymous campaigns.
          </FeatureCard>
          <FeatureCard icon={<KeyRound className="h-5 w-5" aria-hidden />} title="One shareable link">
            A single anonymous survey link—optionally protected by an access code—distributed through the channels you already use.
          </FeatureCard>
          <FeatureCard icon={<History className="h-5 w-5" aria-hidden />} title="Recurring assessments">
            Measure again on a regular cadence and compare results over time with historical trend analysis.
          </FeatureCard>
          <FeatureCard icon={<Users className="h-5 w-5" aria-hidden />} title="Multiple administrators">
            Invite colleagues to share responsibility for campaigns and results, with role-based permissions.
          </FeatureCard>
        </div>
      </Section>

      {/* Security */}
      <Section tone="canvas" aria-labelledby="security-heading">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading
            id="security-heading"
            eyebrow="Security and privacy"
            title="Designed for sensitive organizational data."
            description="Organizational health data deserves the same care as financial data. ROHA's controls are enforced in the database and application, not just described in policy."
          />
          <ul className="grid gap-5 sm:grid-cols-2">
            {[
              { Icon: Fingerprint, title: "Tenant isolation", body: "Each organization's data is logically isolated from every other organization's." },
              { Icon: Database, title: "Row-level security", body: "Database policies restrict every query to the data a signed-in user is entitled to see." },
              { Icon: ShieldCheck, title: "Role-based access", body: "Owner and administrator roles determine who can manage campaigns, billing and results." },
              { Icon: ScrollText, title: "Audit logging", body: "Significant administrative actions are recorded in an audit trail, without survey content." },
              { Icon: Trash2, title: "Export and deletion", body: "Organization owners can export their data and request deletion of their organization." },
              { Icon: CalendarClock, title: "Retention settings", body: "Survey data is retained for 36 months by default, configurable from 6 to 120 months." },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="rounded-xl border border-line bg-white p-5 shadow-card">
                <Icon className="h-5 w-5 text-emerald-600" aria-hidden />
                <h3 className="mt-3 font-sans text-base font-semibold text-navy-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Versioning */}
      <Section aria-labelledby="versioning-heading">
        <div className="grid items-center gap-10 rounded-2xl border border-line bg-white p-8 shadow-card sm:p-12 lg:grid-cols-[auto_1fr] lg:gap-14">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 text-emerald-400">
            <GitBranch className="h-8 w-8" aria-hidden />
          </span>
          <div>
            <Eyebrow>Versioned assessment and scoring</Eyebrow>
            <h2 id="versioning-heading" className="mt-3 text-3xl font-semibold text-navy-900">
              Results you can reproduce, compare and defend.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
              Each campaign is tied to a specific version of the ROHA framework and a specific version of the scoring rules. When either
              evolves, earlier results remain exactly as they were calculated—so trends reflect real change in perception, not changes in
              methodology.
            </p>
            <Link href="/framework" className="mt-6 inline-flex text-sm font-semibold text-navy-900 hover:text-emerald-700">
              Review the published framework →
            </Link>
          </div>
        </div>
      </Section>

      <CtaBand
        secondary={{ href: "/pricing", label: "Compare plans" }}
      />
    </>
  );
}
