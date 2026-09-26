import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Lock, Trash2 } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { rulesAssessmentVersion } from "@/lib/scoring/pairing";
import { scoringConfigSchema } from "@/lib/scoring/config";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { StatusBadge } from "@/components/admin/table";
import { formatDateTime } from "@/lib/utils";
import { formatZodIssues } from "../../_lib/action";
import { prettyJson } from "../../_lib/queries";
import { deleteScoringDraft, publishScoringDraft, updateScoringDraft } from "../actions";

export const metadata: Metadata = { title: "Scoring rules" };

export default async function ScoringVersionPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const admin = createAdminClient();
  const { data: v } = await admin.from("scoring_rule_versions").select("*").eq("id", id).maybeSingle();
  if (!v) notFound();
  const { count } = await admin.from("campaigns").select("id", { count: "exact", head: true }).eq("scoring_rule_version_id", v.id);

  const isDraft = v.status === "draft";
  const validation = scoringConfigSchema.safeParse(v.config);
  const forAssessment = validation.success ? rulesAssessmentVersion(validation.data) : null;

  return (
    <div className="max-w-5xl">
      <Link href="/admin/scoring" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All scoring versions
      </Link>
      <PageHeader
        eyebrow={`Scoring rules v${v.version_number}`}
        title={v.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={v.status} />
            <span className="text-xs">
              Created {formatDateTime(v.created_at)}
              {v.published_at ? ` · Published ${formatDateTime(v.published_at)}` : ""} · Pinned by {count ?? 0} campaign(s)
              {forAssessment ? ` · For assessment version ${forAssessment}` : ""}
            </span>
          </span>
        }
        className="mb-6"
      />

      {!isDraft ? (
        <Alert tone="info" title="Published scoring rules are immutable" className="mb-6">
          <span className="inline-flex items-start gap-1.5">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Campaigns scored with this version must always reproduce the same results. Create a new draft to change the rules; new campaigns
            use the latest published rules designed for their assessment version (the <code>assessmentVersion</code> setting; absent means
            version 1), while existing campaigns keep their pinned version.
          </span>
        </Alert>
      ) : null}

      {isDraft && !validation.success ? (
        <Alert tone="warning" title="The stored configuration does not pass validation" className="mb-6">
          <ul className="list-disc pl-4 font-mono text-xs">
            {formatZodIssues(validation.error).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {isDraft ? (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Edit draft" description="The configuration is validated against the ROHA scoring schema when you save." />
            <CardBody>
              <ActionForm action={updateScoringDraft} className="space-y-4">
                <input type="hidden" name="id" value={v.id} />
                <Field label="Name" htmlFor="name" required>
                  <Input id="name" name="name" required maxLength={160} defaultValue={v.name} />
                </Field>
                <Field label="Methodology notes" htmlFor="notes">
                  <Textarea id="notes" name="notes" rows={4} maxLength={5000} defaultValue={v.notes ?? ""} />
                </Field>
                <Field
                  label="Configuration (JSON)"
                  htmlFor="config"
                  required
                  hint="Keys: scaleMin, scaleMax, normalization (linear_0_100), questionWeights, dimensionWeights, minValidCurrentRatings, minValidCurrentPerDimension (optional), assessmentVersion (optional; absent = 1), minGroupSize (3–50), gapThresholds {notable, substantial}, bands [{min, label}]."
                >
                  <Textarea id="config" name="config" rows={24} spellCheck={false} required defaultValue={prettyJson(v.config)} className="font-mono text-xs leading-relaxed" />
                </Field>
                <SubmitButton variant="secondary">Validate & save draft</SubmitButton>
              </ActionForm>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Publish" description={`Publishing makes this version permanently read-only and the default for new campaigns that use assessment version ${forAssessment ?? 1}.`} />
            <CardBody className="flex flex-wrap items-start justify-between gap-4">
              <ActionForm action={publishScoringDraft} confirm={`Publish scoring rules v${v.version_number}? This cannot be undone.`}>
                <input type="hidden" name="id" value={v.id} />
                <SubmitButton disabled={!validation.success}>Publish v{v.version_number}</SubmitButton>
              </ActionForm>
              <ActionForm action={deleteScoringDraft} confirm="Delete this draft permanently?">
                <input type="hidden" name="id" value={v.id} />
                <SubmitButton variant="ghost" className="text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" aria-hidden /> Delete draft
                </SubmitButton>
              </ActionForm>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {v.notes ? (
            <Card>
              <CardHeader title="Methodology notes" />
              <CardBody className="whitespace-pre-line text-sm leading-relaxed">{v.notes}</CardBody>
            </Card>
          ) : null}
          <Card>
            <CardHeader title="Configuration" />
            <CardBody>
              <pre className="overflow-x-auto rounded-lg bg-navy-950 p-4 text-xs leading-relaxed text-navy-100">{prettyJson(v.config)}</pre>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
