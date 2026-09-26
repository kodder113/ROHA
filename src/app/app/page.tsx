import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Circle, ClipboardList, FileText, Plus } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { listCampaigns, PHASE_LABEL, PHASE_TONE } from "@/lib/campaigns/queries";
import { getResultsView } from "@/lib/results/service";
import { loadEntitlements } from "@/lib/org/entitlements";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/ui/misc";
import { cn, formatDate, formatGap, formatPercent, formatScore } from "@/lib/utils";

export const metadata: Metadata = { title: "Organization overview" };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ welcome?: string; denied?: string; password?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const [campaigns, ent] = await Promise.all([listCampaigns(ctx.org.id), loadEntitlements(ctx.org.id)]);
  const active = campaigns.filter((c) => c.phase === "active" || c.phase === "scheduled");
  const closed = campaigns
    .filter((c) => c.phase === "closed")
    .sort((a, b) => (b.closed_at ?? b.closes_at).localeCompare(a.closed_at ?? a.closes_at));
  const latest = closed[0];
  const latestView = latest ? await getResultsView(latest) : null;
  const latestResult = latestView?.status === "ready" ? latestView.payload.overall : null;
  const totalResponses = campaigns.reduce((sum, c) => sum + c.responseCount, 0);
  const canManage = ctx.role !== "viewer";

  const checklist = [
    { done: true, label: "Register your organization" },
    { done: campaigns.length > 0, label: "Create your first assessment", href: "/app/campaigns/new" },
    { done: campaigns.some((c) => c.status !== "draft"), label: "Launch it and share the survey link", href: campaigns[0] ? `/app/campaigns/${campaigns[0].id}` : undefined },
    { done: closed.length > 0, label: "Close the assessment to release results" },
    { done: false, label: "Review the executive report with your leadership team" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Organization overview"
        title={ctx.org.name}
        description={`${ent.planName ?? "No active plan"} · ${ctx.org.industry ?? "Industry not set"}${ctx.org.region ? ` · ${ctx.org.region}` : ""}`}
        actions={
          canManage ? (
            <ButtonLink href="/app/campaigns/new">
              <Plus className="h-4 w-4" /> Create assessment
            </ButtonLink>
          ) : null
        }
      />

      {sp.welcome ? (
        <Alert tone="success" title="Welcome to ROHA">
          Your organization&apos;s private workspace is ready on ROHA Discover. Create your first assessment to begin.
        </Alert>
      ) : null}
      {sp.denied ? <Alert tone="warning">You do not have permission to access that page.</Alert> : null}
      {sp.password ? <Alert tone="success">Your password has been updated.</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          tone="navy"
          label="Current health index"
          value={formatScore(latestResult?.overall.currentIndex)}
          hint={latestResult ? `${latest?.name} · ${latestResult.overall.band ?? ""}` : "Available after your first assessment closes"}
        />
        <StatTile
          label="Organizational gap"
          value={formatGap(latestResult?.overall.gap.value)}
          hint={latestResult ? `Desired index ${formatScore(latestResult.overall.desiredIndex)}` : "Desired minus current"}
        />
        <StatTile label="Active assessments" value={active.length} hint={`${campaigns.length} total`} />
        <StatTile label="Responses collected" value={totalResponses.toLocaleString()} hint="Across all assessments" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Assessments"
            action={
              <Link href="/app/campaigns" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                View all
              </Link>
            }
          />
          {campaigns.length === 0 ? (
            <CardBody>
              <p className="text-sm text-muted">No assessments yet.</p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {campaigns.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/app/campaigns/${c.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-canvas">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{c.name}</p>
                      <p className="text-xs text-muted">
                        {formatDate(c.opens_at)} – {formatDate(c.closes_at)} · {c.responseCount.toLocaleString()} responses
                        {c.expected_participants ? ` · ${formatPercent(Math.min(100, (c.responseCount / c.expected_participants) * 100))} participation` : ""}
                      </p>
                    </div>
                    <Badge tone={PHASE_TONE[c.phase]}>{PHASE_LABEL[c.phase]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Getting started" />
          <CardBody>
            <ol className="space-y-3 text-sm">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-start gap-2.5">
                  {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-navy-300" />}
                  {item.href && !item.done && canManage ? (
                    <Link href={item.href} className="font-medium text-navy-900 underline decoration-navy-200 underline-offset-2 hover:decoration-emerald-600">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={cn(item.done ? "text-muted line-through decoration-navy-200" : "text-navy-900")}>{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      {latestResult ? (
        <Card>
          <CardHeader
            title={`Latest results · ${latest?.name}`}
            description="Current and desired scores by dimension (0–100 index)."
            action={
              <div className="flex gap-2">
                <ButtonLink href={`/app/campaigns/${latest!.id}/results`} size="sm" variant="outline">
                  <BarChart3 className="h-4 w-4" /> Dashboard
                </ButtonLink>
                <ButtonLink href={`/app/campaigns/${latest!.id}/report`} size="sm" variant="secondary">
                  <FileText className="h-4 w-4" /> Report
                </ButtonLink>
              </div>
            }
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestResult.dimensions.map((d) => (
                <div key={d.key} className="rounded-lg border border-line p-4">
                  <p className="text-sm font-medium text-navy-900">{d.name}</p>
                  <div className="mt-3 space-y-1.5">
                    {(["current", "desired"] as const).map((p) => (
                      <div key={p} className="flex items-center gap-2 text-xs">
                        <span className="w-14 text-muted capitalize">{p}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-50">
                          <div
                            className={cn("h-full rounded-full", p === "current" ? "bg-navy-700" : "bg-emerald-600")}
                            style={{ width: `${d[p].score ?? 0}%` }}
                          />
                        </div>
                        <span className="w-9 text-right font-semibold tabular-nums text-navy-900">{formatScore(d[p].score)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted">Gap {formatGap(d.gap.value)}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden />
              <p className="text-sm text-navy-800">
                Organizational health results appear here once an assessment closes with at least five valid responses. Want to see what
                they look like?
              </p>
            </div>
            <ButtonLink href="/demo" variant="outline" size="sm">
              View demonstration dashboard <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
