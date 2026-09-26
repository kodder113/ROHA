import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { listCampaigns } from "@/lib/campaigns/queries";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Health results" };

export default async function ResultsIndexPage() {
  const ctx = await requireOrgContext();
  const campaigns = await listCampaigns(ctx.org.id);
  const closed = campaigns
    .filter((c) => c.phase === "closed")
    .sort((a, b) => (b.closed_at ?? b.closes_at).localeCompare(a.closed_at ?? a.closes_at));
  if (closed.length > 0) redirect(`/app/campaigns/${closed[0].id}/results`);
  const active = campaigns.filter((c) => c.phase === "active" || c.phase === "scheduled");
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Results" title="Organizational health results" />
      <EmptyState
        icon={<BarChart3 className="h-8 w-8" />}
        title="No results released yet"
        description={
          active.length > 0
            ? "Results appear here after an assessment closes. You can monitor participation on the assessment page in the meantime."
            : "Create and launch an assessment to begin collecting employee perspectives."
        }
        action={
          active.length > 0 ? (
            <ButtonLink href={`/app/campaigns/${active[0].id}`}>View {active[0].name}</ButtonLink>
          ) : ctx.role !== "viewer" ? (
            <ButtonLink href="/app/campaigns/new">Create assessment</ButtonLink>
          ) : (
            <Link href="/app/campaigns">View assessments</Link>
          )
        }
      />
    </div>
  );
}
