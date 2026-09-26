import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext, MANAGE_ROLES } from "@/lib/auth/session";
import { getCampaign } from "@/lib/campaigns/queries";
import { loadEntitlements } from "@/lib/org/entitlements";
import { CampaignForm } from "@/components/app/campaign-form";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Edit assessment" };

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(MANAGE_ROLES);
  const found = await getCampaign(ctx.org.id, id);
  if (!found) notFound();
  if (found.campaign.status !== "draft") redirect(`/app/campaigns/${id}`);
  const ent = await loadEntitlements(ctx.org.id);
  const { campaign, options } = found;
  const by = (kind: string) => options.filter((o) => o.kind === kind).map((o) => o.label);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Draft assessment" title={`Edit “${campaign.name}”`} />
      <CampaignForm
        orgId={ctx.org.id}
        mode="edit"
        accessCodesAvailable={ent.features.access_codes}
        defaults={{
          campaignId: campaign.id,
          name: campaign.name,
          description: campaign.description,
          opensAt: campaign.opens_at,
          closesAt: campaign.closes_at,
          expectedParticipants: campaign.expected_participants,
          departments: by("department"),
          locations: by("location"),
          levels: by("level"),
          privacyMode: campaign.privacy_mode as "confidential" | "anonymous",
          requireAccessCode: campaign.require_access_code,
          collectLevels: campaign.collect_levels,
        }}
      />
    </div>
  );
}
