import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { getCampaign } from "@/lib/campaigns/queries";
import { getHistoricalTrend, getResultsView } from "@/lib/results/service";
import { loadEntitlements } from "@/lib/org/entitlements";
import { ResultsDashboard, ResultsInsufficient, ResultsNotReleased } from "@/components/dashboard";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Organizational health results" };

export default async function CampaignResultsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ released?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const ctx = await requireOrgContext();
  const found = await getCampaign(ctx.org.id, id);
  if (!found) notFound();
  const { campaign } = found;
  const [view, ent] = await Promise.all([getResultsView(campaign), loadEntitlements(ctx.org.id)]);
  const trend = view.status === "ready" && ent.features.historical_comparisons ? await getHistoricalTrend(ctx.org.id) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <Link href={`/app/campaigns/${campaign.id}`} className="hover:underline">
            {campaign.name}
          </Link>
        }
        title="Organizational health results"
        description={
          campaign.status === "closed"
            ? `Assessment closed ${formatDate(campaign.closed_at ?? campaign.closes_at)}. All figures are aggregated and privacy-screened.`
            : "Results are released when the assessment closes."
        }
        actions={
          view.status === "ready" ? (
            <>
              <ButtonLink href={`/app/campaigns/${campaign.id}/report`} variant="secondary">
                <FileText className="h-4 w-4" /> Executive report
              </ButtonLink>
              <ButtonLink href={`/api/campaigns/${campaign.id}/export?format=csv`} variant="outline" prefetch={false}>
                <Download className="h-4 w-4" /> Export aggregates
              </ButtonLink>
            </>
          ) : null
        }
      />
      {sp.released ? <Alert tone="success">The assessment is closed and results have been released.</Alert> : null}
      {view.status === "ready" ? (
        <ResultsDashboard view={view} features={ent.features} trend={trend} campaignName={campaign.name} isDemo={ctx.org.is_demo} />
      ) : view.status === "insufficient" ? (
        <ResultsInsufficient view={view} isDemo={ctx.org.is_demo} />
      ) : (
        <ResultsNotReleased view={view} isDemo={ctx.org.is_demo} />
      )}
    </div>
  );
}
