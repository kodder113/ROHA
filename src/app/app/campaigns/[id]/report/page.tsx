import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Lock, Sparkles } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { getCampaign } from "@/lib/campaigns/queries";
import { getResultsView } from "@/lib/results/service";
import { listCampaignReports } from "@/lib/reports/service";
import { loadEntitlements } from "@/lib/org/entitlements";
import { integrations } from "@/lib/env";
import { ReportView } from "@/components/app/report-view";
import { GenerateReportForm } from "@/components/app/report-controls";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Executive report" };
export const maxDuration = 300;

export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ report?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const ctx = await requireOrgContext();
  const found = await getCampaign(ctx.org.id, id);
  if (!found) notFound();
  const { campaign } = found;
  const [view, ent, reports] = await Promise.all([getResultsView(campaign), loadEntitlements(ctx.org.id), listCampaignReports(campaign.id)]);
  const completed = reports.filter((r) => r.status === "completed" && r.report && r.snapshot);
  const selected = completed.find((r) => r.id === sp.report) ?? completed[0] ?? null;
  const lastFailure = reports[0]?.status === "failed" ? reports[0] : null;
  const canManage = ctx.role !== "viewer";
  const fullAllowed = ent.features.ai_report === "full";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <Link href={`/app/campaigns/${campaign.id}`} className="hover:underline">
            {campaign.name}
          </Link>
        }
        title="Executive Intelligence Report"
        description="Narrative analysis grounded in ROHA's deterministic scores. AI never calculates or alters official numbers."
        actions={
          selected ? (
            ent.features.pdf_export ? (
              <ButtonLink href={`/api/reports/${selected.id}/pdf`} prefetch={false} variant="secondary">
                <Download className="h-4 w-4" /> Download PDF
              </ButtonLink>
            ) : (
              <ButtonLink href="/app/settings/billing" variant="outline">
                <Lock className="h-4 w-4" /> Executive PDF (Professional)
              </ButtonLink>
            )
          ) : null
        }
      />

      {view.status !== "ready" ? (
        <EmptyState
          title={view.status === "not_released" ? "Reports are available after the assessment closes" : "Not enough responses for a report"}
          description={
            view.status === "not_released"
              ? "Once the assessment closes and results are released, you can generate the executive report here."
              : `At least ${view.minGroupSize} valid responses are required to report results while protecting confidentiality.`
          }
        />
      ) : (
        <>
          {canManage ? (
            <Card>
              <CardHeader
                title={selected ? "Generate a new version" : "Generate the executive report"}
                description={
                  fullAllowed
                    ? integrations.anthropic()
                      ? "The AI analyzes aggregated scores and identifier-scrubbed comment themes only — no personal employee information is sent."
                      : "The AI service is not configured in this environment; a rules-based summary will be generated instead."
                    : "ROHA Discover includes a basic executive summary. Upgrade for the full AI-generated organizational analysis."
                }
              />
              <CardBody className="flex flex-wrap items-start gap-4">
                {fullAllowed ? (
                  <GenerateReportForm orgId={ctx.org.id} campaignId={campaign.id} level="full" label="Generate AI executive report" />
                ) : (
                  <>
                    <GenerateReportForm orgId={ctx.org.id} campaignId={campaign.id} level="basic" label="Generate basic executive summary" />
                    <ButtonLink href="/app/settings/billing" variant="outline">
                      <Sparkles className="h-4 w-4" /> Upgrade for AI analysis
                    </ButtonLink>
                  </>
                )}
              </CardBody>
            </Card>
          ) : null}

          {lastFailure ? <Alert tone="error" title="The most recent report attempt failed">{lastFailure.error}</Alert> : null}

          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <Badge tone={selected.generator === "anthropic" ? "emerald" : "neutral"}>
                  {selected.generator === "anthropic" ? "AI-generated analysis" : "Rules-based summary"}
                </Badge>
                <span>
                  Generated {formatDateTime(selected.completedAt ?? selected.createdAt)}
                  {selected.model ? ` · ${selected.model}` : ""}
                </span>
                {completed.length > 1 ? (
                  <span className="flex flex-wrap gap-1">
                    · Versions:
                    {completed.map((r, i) => (
                      <Link
                        key={r.id}
                        href={`?report=${r.id}`}
                        className={r.id === selected.id ? "font-semibold text-navy-900" : "text-emerald-700 underline"}
                      >
                        {completed.length - i}
                      </Link>
                    ))}
                  </span>
                ) : null}
              </div>
              {selected.warnings.length > 0 ? (
                <Alert tone="warning" title="Automated accuracy check">
                  {selected.warnings.length} number{selected.warnings.length === 1 ? "" : "s"} in the narrative could not be matched to the
                  official aggregates (for example &ldquo;{selected.warnings[0].value}&rdquo;). Rely on the figures in the tables and dashboard,
                  which come directly from the scoring engine.
                </Alert>
              ) : null}
              <ReportView report={selected.report!} snapshot={selected.snapshot!} />
            </>
          ) : (
            <EmptyState title="No report generated yet" description={canManage ? "Generate the report above." : "An administrator has not generated a report yet."} />
          )}
        </>
      )}
    </div>
  );
}
