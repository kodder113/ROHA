import type { Metadata } from "next";
import Link from "next/link";
import { requireOrgContext, MANAGE_ROLES } from "@/lib/auth/session";
import { loadEntitlements } from "@/lib/org/entitlements";
import { CampaignForm } from "@/components/app/campaign-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Create assessment" };

export default async function NewCampaignPage() {
  const ctx = await requireOrgContext(MANAGE_ROLES);
  const ent = await loadEntitlements(ctx.org.id);
  const now = new Date();
  const suggestedOpens = new Date(Math.ceil(now.getTime() / 900_000) * 900_000).toISOString(); // next quarter hour
  const suggestedCloses = new Date(now.getTime() + 15 * 86400_000).toISOString();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="New assessment"
        title="Create an organizational health assessment"
        description="Configure the campaign, then launch it and share one survey link with employees. Employees never need an account."
      />
      {!ent.nextCampaignSubscriptionId ? (
        <Alert tone="warning" title="Your plan has no remaining assessment campaigns">
          <p>
            {ent.planName ?? "Your current plan"} allows a limited number of campaigns. Upgrade to create another assessment.
          </p>
          <div className="mt-3">
            <ButtonLink href="/app/settings/billing" size="sm">
              View plans
            </ButtonLink>
          </div>
        </Alert>
      ) : (
        <>
          <Alert tone="info">
            This assessment will use <strong>{ent.planName}</strong>
            {ent.maxResponsesPerCampaign ? <> and accept up to {ent.maxResponsesPerCampaign.toLocaleString()} responses</> : null}.{" "}
            <Link href="/framework" className="font-medium underline" target="_blank">
              Review the assessment statements
            </Link>
            .
          </Alert>
          <CampaignForm
            orgId={ctx.org.id}
            mode="create"
            accessCodesAvailable={ent.features.access_codes}
            suggestedOpensAt={suggestedOpens}
            suggestedClosesAt={suggestedCloses}
          />
        </>
      )}
    </div>
  );
}
