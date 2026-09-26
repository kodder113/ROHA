import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Circle, Lock, Trash2 } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/database.types";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Field, Input, Label, Textarea } from "@/components/ui/form";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { SectionTitle, StatusBadge } from "@/components/admin/table";
import { formatDate, formatDateTime } from "@/lib/utils";
import { checkReadiness } from "../readiness";
import {
  deleteAssessmentDraft,
  publishAssessmentVersion,
  updateDimension,
  updateQualitativeQuestions,
  updateVersionMeta,
} from "../actions";

export const metadata: Metadata = { title: "Assessment version" };

export default async function AssessmentVersionPage({ params }: { params: Promise<{ versionId: string }> }) {
  await requirePlatformAdmin();
  const { versionId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(versionId)) notFound();
  const admin = createAdminClient();

  const { data: version } = await admin.from("assessment_versions").select("*").eq("id", versionId).maybeSingle();
  if (!version) notFound();

  const [{ data: dimensions }, { data: questions }, { data: qualitative }, { count: campaignCount }, { data: published }] = await Promise.all([
    admin.from("dimensions").select("*").eq("version_id", version.id).order("sort_order"),
    admin.from("questions").select("*").eq("version_id", version.id).order("sort_order"),
    admin.from("qualitative_questions").select("*").eq("version_id", version.id).order("sort_order"),
    admin.from("campaigns").select("id", { count: "exact", head: true }).eq("assessment_version_id", version.id),
    admin.from("assessment_versions").select("version_number").eq("template_id", version.template_id).eq("status", "published").order("version_number"),
  ]);

  const isDraft = version.status === "draft";
  const dims = dimensions ?? [];
  const qs = questions ?? [];
  const qual = qualitative ?? [];
  const checks = checkReadiness({ title: version.title, dimensions: dims, questions: qs, qualitative: qual });
  const ready = checks.every((c) => c.ok);
  const byDim = (dimId: string) => qs.filter((q) => q.dimension_id === dimId);

  return (
    <div>
      <Link href="/admin/assessments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All versions
      </Link>
      <PageHeader
        eyebrow={`Assessment version ${version.version_number}`}
        title={version.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={version.status} />
            <span className="text-xs">
              Created {formatDate(version.created_at)}
              {version.published_at ? ` · Published ${formatDateTime(version.published_at)}` : ""} · Used by {campaignCount ?? 0} campaign(s)
            </span>
          </span>
        }
        className="mb-6"
      />

      {!isDraft ? (
        <Alert tone="info" title={`This version is ${version.status} and read-only`} className="mb-6">
          <span className="inline-flex items-start gap-1.5">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Published assessment content is immutable. Campaigns pin the exact questions they were launched with, which guarantees that historical
            results can always be reproduced. To change the instrument, create a new draft version from the versions list.
          </span>
        </Alert>
      ) : null}

      {isDraft ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Version details" />
            <CardBody>
              <ActionForm action={updateVersionMeta} className="space-y-4">
                <input type="hidden" name="versionId" value={version.id} />
                <Field label="Title" htmlFor="title" required>
                  <Input id="title" name="title" required maxLength={200} defaultValue={version.title} />
                </Field>
                <Field label="Current-state label" htmlFor="current_label" required>
                  <Input id="current_label" name="current_label" required maxLength={300} defaultValue={version.current_label} />
                </Field>
                <Field label="Desired-state label" htmlFor="desired_label" required>
                  <Input id="desired_label" name="desired_label" required maxLength={300} defaultValue={version.desired_label} />
                </Field>
                <Field label="Change notes" htmlFor="change_notes" hint="Summarize what changed versus the previous version.">
                  <Textarea id="change_notes" name="change_notes" rows={4} maxLength={4000} defaultValue={version.change_notes ?? ""} />
                </Field>
                <SubmitButton variant="secondary">Save details</SubmitButton>
              </ActionForm>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Publication checklist" description="All checks must pass before publishing." />
            <CardBody className="space-y-5">
              <ul className="space-y-2 text-sm">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2">
                    {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Passed" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-label="Failing" />}
                    <span>
                      <span className={c.ok ? "text-navy-900" : "font-medium text-red-700"}>{c.label}</span>
                      {c.detail ? <span className="block text-xs text-muted">{c.detail}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
              <ActionForm
                action={publishAssessmentVersion}
                confirm={`Publish version ${version.version_number}? Its content becomes permanently read-only.`}
                className="space-y-3 border-t border-line pt-4"
              >
                <input type="hidden" name="versionId" value={version.id} />
                {(published ?? []).length > 0 ? (
                  <Label className="flex items-start gap-2 font-normal">
                    <Checkbox name="retirePrevious" defaultChecked className="mt-0.5" />
                    <span>
                      Retire the currently published version{(published ?? []).length > 1 ? "s" : ""} (v{(published ?? []).map((p) => p.version_number).join(", v")}).
                      <span className="block text-xs text-muted">Existing campaigns keep their pinned version either way.</span>
                    </span>
                  </Label>
                ) : null}
                <SubmitButton disabled={!ready}>Publish version {version.version_number}</SubmitButton>
              </ActionForm>
              <ActionForm action={deleteAssessmentDraft} confirm="Delete this draft permanently?" className="border-t border-line pt-4">
                <input type="hidden" name="versionId" value={version.id} />
                <SubmitButton variant="ghost" size="sm" className="text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" aria-hidden /> Delete draft
                </SubmitButton>
              </ActionForm>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card>
          <CardBody>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Current-state label</dt>
                <dd className="mt-1">{version.current_label}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Desired-state label</dt>
                <dd className="mt-1">{version.desired_label}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Change notes</dt>
                <dd className="mt-1 whitespace-pre-line">{version.change_notes || "—"}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      )}

      <SectionTitle>Dimensions & questions</SectionTitle>
      <div className="space-y-5">
        {dims.map((d) =>
          isDraft ? (
            <DimensionEditor key={d.id} versionId={version.id} dimension={d} questions={byDim(d.id)} />
          ) : (
            <DimensionReadOnly key={d.id} dimension={d} questions={byDim(d.id)} />
          ),
        )}
        {dims.length === 0 ? <Alert tone="warning">This version has no dimensions.</Alert> : null}
      </div>

      <SectionTitle>Open-ended questions</SectionTitle>
      <Card>
        <CardBody>
          {isDraft ? (
            <ActionForm action={updateQualitativeQuestions} className="space-y-4">
              <input type="hidden" name="versionId" value={version.id} />
              {qual.map((q) => (
                <Field key={q.id} label={<span className="font-mono text-xs">{q.key}</span>} htmlFor={`qq-${q.id}`} required>
                  <Textarea id={`qq-${q.id}`} name={`qq_${q.id}`} rows={2} minLength={10} maxLength={500} required defaultValue={q.prompt} />
                </Field>
              ))}
              {qual.length ? <SubmitButton variant="secondary">Save open-ended questions</SubmitButton> : <p className="text-sm text-muted">None.</p>}
            </ActionForm>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {qual.map((q) => (
                <li key={q.id}>
                  {q.prompt} <span className="font-mono text-xs text-muted">({q.key})</span>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function DimensionEditor({ versionId, dimension, questions }: { versionId: string; dimension: Tables<"dimensions">; questions: Tables<"questions">[] }) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {dimension.name}
            <Badge tone="outline" className="font-mono">
              {dimension.code} · {dimension.key}
            </Badge>
            <Badge tone={questions.length === 4 ? "emerald" : "red"}>{questions.length} questions</Badge>
          </span>
        }
      />
      <CardBody>
        <ActionForm action={updateDimension} className="space-y-4">
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="dimensionId" value={dimension.id} />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Field label="Dimension name" htmlFor={`dn-${dimension.id}`} required>
              <Input id={`dn-${dimension.id}`} name="name" required maxLength={120} defaultValue={dimension.name} />
            </Field>
            <Field label="Description" htmlFor={`dd-${dimension.id}`} required>
              <Textarea id={`dd-${dimension.id}`} name="description" rows={2} required maxLength={1000} defaultValue={dimension.description} className="min-h-0" />
            </Field>
          </div>
          <div className="divide-y divide-line rounded-lg border border-line">
            {questions.map((q) => (
              <div key={q.id} className="grid gap-3 p-3 md:grid-cols-[4.5rem_minmax(0,1fr)_14rem]">
                <p className="pt-2 font-mono text-xs font-semibold text-navy-700">{q.key}</p>
                <Field label="Prompt" htmlFor={`qp-${q.id}`} required>
                  <Textarea id={`qp-${q.id}`} name={`q_${q.id}_prompt`} rows={2} minLength={10} maxLength={400} required defaultValue={q.prompt} className="min-h-0" />
                </Field>
                <div className="space-y-2">
                  <Field label="Focus" htmlFor={`qf-${q.id}`} required>
                    <Input id={`qf-${q.id}`} name={`q_${q.id}_focus`} required maxLength={200} defaultValue={q.focus} />
                  </Field>
                  <Label className="flex items-center gap-2 text-xs font-normal">
                    <Checkbox name={`q_${q.id}_allow_na`} defaultChecked={q.allow_na} /> Allow “Not applicable”
                  </Label>
                </div>
              </div>
            ))}
          </div>
          <SubmitButton variant="secondary">Save {dimension.name}</SubmitButton>
        </ActionForm>
      </CardBody>
    </Card>
  );
}

function DimensionReadOnly({ dimension, questions }: { dimension: Tables<"dimensions">; questions: Tables<"questions">[] }) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {dimension.name}
            <Badge tone="outline" className="font-mono">
              {dimension.code}
            </Badge>
          </span>
        }
        description={dimension.description}
      />
      <CardBody className="p-0">
        <ul className="divide-y divide-line">
          {questions.map((q) => (
            <li key={q.id} className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-[4.5rem_minmax(0,1fr)_12rem]">
              <span className="font-mono text-xs font-semibold text-navy-700">{q.key}</span>
              <span>{q.prompt}</span>
              <span className="text-xs text-muted">
                {q.focus}
                {q.allow_na ? " · N/A allowed" : ""}
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
