import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Eye, FileText, Pencil } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { campaignPhase, getCampaign, PHASE_LABEL, PHASE_TONE, surveyUrl } from "@/lib/campaigns/queries";
import { loadParticipation } from "@/lib/results/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/ui/misc";
import {
  AccessCodesForm,
  CloseForm,
  CopySurveyLink,
  DeleteForm,
  DuplicateForm,
  ExtendForm,
  LaunchForm,
} from "@/components/app/campaign-actions";
import { formatDateTime, formatPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Assessment" };

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const ctx = await requireOrgContext();
  const found = await getCampaign(ctx.org.id, id);
  if (!found) notFound();
  const { campaign, options } = found;
  const phase = campaignPhase(campaign);
  const participation = await loadParticipation(campaign);
  const admin = createAdminClient();
  const [{ data: version }, { data: rules }, { count: codeCount }, { count: usedCodes }] = await Promise.all([
    admin.from("assessment_versions").select("version_number, title").eq("id", campaign.assessment_version_id).single(),
    admin.from("scoring_rule_versions").select("version_number").eq("id", campaign.scoring_rule_version_id).single(),
    admin.from("participation_tokens").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id).eq("kind", "access_code"),
    admin.from("participation_tokens").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id).eq("kind", "access_code").eq("status", "submitted"),
  ]);
  const canManage = ctx.role !== "viewer";
  const ids = { orgId: ctx.org.id, campaignId: campaign.id };
  const url = surveyUrl(publicEnv.appUrl(), campaign.survey_token);
  const by = (kind: string) => options.filter((o) => o.kind === kind).map((o) => o.label);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Link href="/app/campaigns" className="hover:underline">
              Assessments
            </Link>
          </span>
        }
        title={campaign.name}
        description={campaign.description ?? undefined}
        actions={
          <>
            <Badge tone={PHASE_TONE[phase]} className="text-sm">
              {PHASE_LABEL[phase]}
            </Badge>
            {phase === "closed" ? (
              <>
                <ButtonLink href={`/app/campaigns/${campaign.id}/results`}>
                  <BarChart3 className="h-4 w-4" /> View results
                </ButtonLink>
                <ButtonLink href={`/app/campaigns/${campaign.id}/report`} variant="secondary">
                  <FileText className="h-4 w-4" /> Executive report
                </ButtonLink>
              </>
            ) : null}
          </>
        }
      />

      {sp.created ? <Alert tone="success">Assessment draft created. Review the details, preview the survey, and launch when ready.</Alert> : null}
      {sp.updated ? <Alert tone="success">Changes saved.</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Responses" value={participation.responses.toLocaleString()} hint={campaign.response_limit ? `Plan limit: ${campaign.response_limit.toLocaleString()}` : undefined} tone="navy" />
        <StatTile label="Participation" value={formatPercent(participation.rate)} hint={campaign.expected_participants ? `of ${campaign.expected_participants.toLocaleString()} expected` : "Set expected participants to track"} />
        <StatTile label="Opens" value={<span className="text-lg">{formatDateTime(campaign.opens_at)}</span>} />
        <StatTile label={phase === "closed" ? "Closed" : "Closes"} value={<span className="text-lg">{formatDateTime(campaign.closed_at ?? campaign.closes_at)}</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Employee survey link"
              description={
                phase === "draft"
                  ? "The link becomes active once you launch the assessment."
                  : phase === "closed"
                    ? "This assessment is closed and no longer accepts responses."
                    : "Share this link through email, Slack, Microsoft Teams or your intranet. Employees do not need an account."
              }
              action={
                <ButtonLink href={`/app/campaigns/${campaign.id}/preview`} size="sm" variant="outline">
                  <Eye className="h-4 w-4" /> Preview survey
                </ButtonLink>
              }
            />
            <CardBody>
              {phase === "draft" ? (
                canManage ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted">
                      Launching locks the question set (version {version?.version_number}), privacy mode and structure options so
                      every response is comparable. You can still extend the closing date.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <LaunchForm {...ids} />
                      <ButtonLink href={`/app/campaigns/${campaign.id}/edit`} variant="outline">
                        <Pencil className="h-4 w-4" /> Edit draft
                      </ButtonLink>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted">An administrator has not launched this assessment yet.</p>
                )
              ) : (
                <CopySurveyLink url={url} campaignName={campaign.name} />
              )}
              {phase === "scheduled" ? (
                <p className="mt-3 text-sm text-amber-800">Employees opening the link before {formatDateTime(campaign.opens_at)} will be asked to come back later.</p>
              ) : null}
            </CardBody>
          </Card>

          {campaign.require_access_code && phase !== "closed" && canManage ? (
            <Card>
              <CardHeader
                title="Single-use access codes"
                description={`${(codeCount ?? 0).toLocaleString()} codes issued · ${(usedCodes ?? 0).toLocaleString()} used. Distribute one code per employee. Codes are never linked to responses.`}
              />
              <CardBody>
                <AccessCodesForm {...ids} campaignName={campaign.name} />
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Configuration" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Confidentiality</dt>
                  <dd className="font-medium text-navy-900">
                    {campaign.privacy_mode === "anonymous" ? "Anonymous — no demographics collected" : "Confidential — optional demographics, groups of 5+"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Assessment version</dt>
                  <dd className="font-medium text-navy-900">
                    {version?.title} · Scoring rules v{rules?.version_number}
                  </dd>
                </div>
                {campaign.privacy_mode === "confidential" ? (
                  <>
                    <div>
                      <dt className="text-muted">Departments</dt>
                      <dd className="text-navy-900">{by("department").join(", ") || "Not collected"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Office locations</dt>
                      <dd className="text-navy-900">{by("location").join(", ") || "Not collected"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Organizational levels</dt>
                      <dd className="text-navy-900">{campaign.collect_levels ? by("level").join(", ") || "Not collected" : "Not collected"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Employment tenure</dt>
                      <dd className="text-navy-900">Standard ranges</dd>
                    </div>
                  </>
                ) : null}
                <div>
                  <dt className="text-muted">Access</dt>
                  <dd className="text-navy-900">{campaign.require_access_code ? "Single-use access codes required" : "Open link with browser-based duplicate prevention"}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {phase !== "closed" && phase !== "draft" ? (
            <Alert tone="privacy" title="Results are released when the assessment closes">
              To protect confidentiality, scores are not shown while responses are still arriving. Participation counts update live.
            </Alert>
          ) : null}
          {canManage ? (
            <Card>
              <CardHeader title="Manage" />
              <CardBody className="space-y-5">
                {phase === "active" || phase === "scheduled" ? (
                  <>
                    <div>
                      <p className="mb-2 text-sm font-medium text-navy-900">Extend closing date</p>
                      <ExtendForm {...ids} closesAt={campaign.closes_at} />
                    </div>
                    {phase === "active" ? <CloseForm {...ids} /> : null}
                  </>
                ) : null}
                {phase === "closed" ? <DuplicateForm {...ids} /> : null}
                <DeleteForm {...ids} name={campaign.name} launched={campaign.status !== "draft"} />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
