import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/session";
import { getCampaign } from "@/lib/campaigns/queries";
import { loadSurvey } from "@/lib/survey/load";
import { SurveyApp } from "@/components/survey/survey-app";

export const metadata: Metadata = { title: "Survey preview" };

export default async function SurveyPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const found = await getCampaign(ctx.org.id, id);
  if (!found) notFound();
  const result = await loadSurvey(found.campaign.survey_token, { preview: true });
  if (result.state !== "open") notFound();
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-10">
      <SurveyApp survey={result.survey} preview />
    </div>
  );
}
