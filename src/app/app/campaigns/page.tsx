import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { listCampaigns, PHASE_LABEL, PHASE_TONE, type CampaignPhase, type CampaignSummary } from "@/lib/campaigns/queries";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Alert } from "@/components/ui/alert";
import { formatDate, formatPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Assessments" };

function CampaignTable({ campaigns }: { campaigns: CampaignSummary[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Assessment</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Window</th>
              <th className="px-5 py-3 text-right font-medium">Responses</th>
              <th className="px-5 py-3 text-right font-medium">Participation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-canvas/60">
                <td className="px-5 py-3">
                  <Link href={`/app/campaigns/${c.id}`} className="font-medium text-navy-900 hover:text-emerald-700">
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted">{c.privacy_mode === "anonymous" ? "Anonymous" : "Confidential"}</p>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={PHASE_TONE[c.phase]}>{PHASE_LABEL[c.phase]}</Badge>
                </td>
                <td className="px-5 py-3 text-muted">
                  {formatDate(c.opens_at)} – {formatDate(c.closes_at)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {c.responseCount.toLocaleString()}
                  {c.response_limit ? <span className="text-muted"> / {c.response_limit.toLocaleString()}</span> : null}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {c.expected_participants ? formatPercent(Math.min(100, (c.responseCount / c.expected_participants) * 100)) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const ctx = await requireOrgContext();
  const campaigns = await listCampaigns(ctx.org.id);
  const groups: { title: string; phases: CampaignPhase[] }[] = [
    { title: "Active assessments", phases: ["active", "scheduled"] },
    { title: "Drafts", phases: ["draft"] },
    { title: "Completed assessments", phases: ["closed"] },
  ];
  const canManage = ctx.role !== "viewer";
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Assessments"
        title="Assessment campaigns"
        description="Create, launch and monitor organizational health assessments."
        actions={
          canManage ? (
            <ButtonLink href="/app/campaigns/new">
              <Plus className="h-4 w-4" /> Create assessment
            </ButtonLink>
          ) : null
        }
      />
      {deleted ? <Alert tone="success">The assessment was deleted.</Alert> : null}
      {campaigns.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No assessments yet"
          description="Create your first organizational health assessment to begin gathering employee perspectives."
          action={canManage ? <ButtonLink href="/app/campaigns/new">Create assessment</ButtonLink> : null}
        />
      ) : (
        groups.map((g) => {
          const list = campaigns.filter((c) => g.phases.includes(c.phase));
          if (list.length === 0) return null;
          return (
            <section key={g.title} className="space-y-3">
              <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-muted">{g.title}</h2>
              <CampaignTable campaigns={list} />
            </section>
          );
        })
      )}
    </div>
  );
}
