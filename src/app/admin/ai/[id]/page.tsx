import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { StatusBadge } from "@/components/admin/table";
import { formatDateTime } from "@/lib/utils";
import { activateAiInstructions, deleteAiInstructionsDraft, updateAiInstructionsDraft } from "../actions";

export const metadata: Metadata = { title: "AI instructions" };

export default async function AiInstructionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: v } = await createAdminClient().from("ai_report_instructions").select("*").eq("id", id).maybeSingle();
  if (!v) notFound();
  const isDraft = v.status === "draft";

  return (
    <div className="max-w-5xl">
      <Link href="/admin/ai" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> AI reporting
      </Link>
      <PageHeader
        eyebrow={`AI instructions v${v.version_number}`}
        title={v.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={v.status} />
            <span className="text-xs">Created {formatDateTime(v.created_at)}</span>
          </span>
        }
        actions={
          v.status !== "active" ? (
            <ActionForm action={activateAiInstructions} confirm={`Activate v${v.version_number}? The current active version will be retired.`}>
              <input type="hidden" name="id" value={v.id} />
              <SubmitButton>Activate this version</SubmitButton>
            </ActionForm>
          ) : null
        }
        className="mb-6"
      />

      {!isDraft ? (
        <Alert tone="info" className="mb-6" title="Read-only">
          {v.status === "active" ? "This version is in use." : "This version is retired."} Existing reports record the instructions they were generated
          with, so only drafts can be edited. Create a new version from the AI reporting page to make changes.
        </Alert>
      ) : null}

      <Alert tone="privacy" className="mb-6" title="Guardrails">
        Instructions must keep the evidence rules: the model may only cite the official computed figures, must separate findings from hypotheses, and must
        never quote comments verbatim or speculate about individuals.
      </Alert>

      {isDraft ? (
        <Card>
          <CardHeader title="Edit draft" />
          <CardBody className="space-y-6">
            <ActionForm action={updateAiInstructionsDraft} className="space-y-4">
              <input type="hidden" name="id" value={v.id} />
              <Field label="Name" htmlFor="name" required>
                <Input id="name" name="name" required maxLength={160} defaultValue={v.name} />
              </Field>
              <Field label="System prompt" htmlFor="system_prompt" required hint="Sent to the model as system instructions for every executive report.">
                <Textarea id="system_prompt" name="system_prompt" rows={28} required minLength={50} maxLength={50000} defaultValue={v.system_prompt} className="font-mono text-xs leading-relaxed" />
              </Field>
              <SubmitButton variant="secondary">Save draft</SubmitButton>
            </ActionForm>
            <ActionForm action={deleteAiInstructionsDraft} confirm="Delete this draft permanently?" className="border-t border-line pt-4">
              <input type="hidden" name="id" value={v.id} />
              <SubmitButton variant="ghost" size="sm" className="text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" aria-hidden /> Delete draft
              </SubmitButton>
            </ActionForm>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="System prompt" />
          <CardBody>
            <pre className="whitespace-pre-wrap rounded-lg bg-canvas p-4 font-mono text-xs leading-relaxed text-ink">{v.system_prompt}</pre>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
