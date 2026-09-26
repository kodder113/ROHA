import type { Metadata } from "next";
import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/session";
import { getHistoricalTrend } from "@/lib/results/service";
import { getPublishedFramework } from "@/lib/content/public";
import { loadEntitlements } from "@/lib/org/entitlements";
import { TrendChart } from "@/components/dashboard";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { formatDate, formatGap, formatScore } from "@/lib/utils";

export const metadata: Metadata = { title: "Historical trends" };

export default async function HistoryPage() {
  const ctx = await requireOrgContext();
  const ent = await loadEntitlements(ctx.org.id);
  const [trend, framework] = await Promise.all([getHistoricalTrend(ctx.org.id), getPublishedFramework()]);
  const dimensions = framework?.dimensions.map((d) => ({ key: d.key, code: d.code, name: d.name })) ?? [];
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Historical assessments"
        title="Organizational health over time"
        description="Compare completed assessments to see how employee perceptions are changing. Only assessments with released, privacy-screened results are included."
      />
      <TrendChart trend={trend} enabled={ent.features.historical_comparisons} dimensions={dimensions} />
      <Card className="overflow-hidden">
        <CardHeader title="Completed assessments" description="Each assessment keeps the question set and scoring rules it was launched with." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Assessment</th>
                <th className="px-5 py-3 font-medium">Closed</th>
                <th className="px-5 py-3 text-right font-medium">Valid responses</th>
                <th className="px-5 py-3 text-right font-medium">Current</th>
                <th className="px-5 py-3 text-right font-medium">Desired</th>
                <th className="px-5 py-3 text-right font-medium">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {trend.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted">
                    No completed assessments with released results yet.
                  </td>
                </tr>
              ) : (
                [...trend].reverse().map((t) => (
                  <tr key={t.campaignId}>
                    <td className="px-5 py-3">
                      <Link href={`/app/campaigns/${t.campaignId}/results`} className="font-medium text-navy-900 hover:text-emerald-700">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(t.closedAt)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{t.validResponses}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatScore(t.currentIndex)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatScore(t.desiredIndex)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {t.currentIndex !== null && t.desiredIndex !== null ? formatGap(t.desiredIndex - t.currentIndex) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
