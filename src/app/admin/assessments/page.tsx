import Link from "next/link";
import type { Metadata } from "next";
import { CopyPlus, Lock } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { Alert } from "@/components/ui/alert";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { DataTable, EmptyRow, StatusBadge, TBody, Td, Th, THead } from "@/components/admin/table";
import { formatDate } from "@/lib/utils";
import { createAssessmentDraft } from "./actions";

export const metadata: Metadata = { title: "Assessment versions" };

export default async function AssessmentsPage() {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  const [{ data: versions, error }, { data: templates }] = await Promise.all([
    admin.from("assessment_versions").select("*").order("version_number", { ascending: false }),
    admin.from("assessment_templates").select("id, name, key"),
  ]);
  if (error) throw error;

  const counts = await Promise.all(
    (versions ?? []).map(async (v) => {
      const [{ count: campaigns }, { count: questions }] = await Promise.all([
        admin.from("campaigns").select("id", { count: "exact", head: true }).eq("assessment_version_id", v.id),
        admin.from("questions").select("id", { count: "exact", head: true }).eq("version_id", v.id),
      ]);
      return { id: v.id, campaigns: campaigns ?? 0, questions: questions ?? 0 };
    }),
  );
  const campaignCounts = new Map(counts.map((c) => [c.id, c.campaigns]));
  const questionCount = new Map(counts.map((c) => [c.id, c.questions]));
  const templateName = new Map((templates ?? []).map((t) => [t.id, t.name]));
  const latestPublished = (versions ?? []).find((v) => v.status === "published");
  const hasDraft = (versions ?? []).some((v) => v.status === "draft");

  return (
    <div>
      <PageHeader
        eyebrow="Methodology"
        title="Assessment versions"
        description="The ROHA instrument is versioned. Published versions are immutable; campaigns pin the version they launched with, so historical results never change."
        actions={
          <ActionForm action={createAssessmentDraft} confirm={`Create a new draft by cloning version ${latestPublished?.version_number ?? "?"}?`}>
            <SubmitButton disabled={!latestPublished || hasDraft} title={hasDraft ? "A draft already exists" : undefined}>
              <CopyPlus className="h-4 w-4" aria-hidden /> Create new draft version
            </SubmitButton>
          </ActionForm>
        }
        className="mb-6"
      />
      <Alert tone="info" className="mb-6" title="How versioning works">
        New campaigns use the latest published version. Drafts are cloned from the latest published version and can be edited freely until
        published. {hasDraft ? "A draft is already in progress — publish or delete it before creating another." : null}
      </Alert>

      <DataTable>
        <THead>
          <Th>Version</Th>
          <Th>Title</Th>
          <Th>Status</Th>
          <Th className="text-right">Questions</Th>
          <Th className="text-right">Campaigns</Th>
          <Th>Published</Th>
          <Th>Created</Th>
        </THead>
        <TBody>
          {(versions ?? []).length === 0 ? <EmptyRow colSpan={7}>No assessment versions.</EmptyRow> : null}
          {(versions ?? []).map((v) => (
            <tr key={v.id} className="hover:bg-navy-50/40">
              <Td>
                <Link href={`/admin/assessments/${v.id}`} className="inline-flex items-center gap-1.5 font-semibold text-navy-900 hover:text-emerald-700 hover:underline">
                  {v.status !== "draft" ? <Lock className="h-3.5 w-3.5 text-muted" aria-label="Immutable" /> : null}v{v.version_number}
                </Link>
                <p className="text-xs text-muted">{templateName.get(v.template_id) ?? ""}</p>
              </Td>
              <Td className="max-w-md">{v.title}</Td>
              <Td>
                <StatusBadge status={v.status} />
                {v.id === latestPublished?.id ? <p className="mt-1 text-xs text-emerald-700">Used for new campaigns</p> : null}
              </Td>
              <Td className="text-right tabular-nums">{questionCount.get(v.id) ?? 0}</Td>
              <Td className="text-right tabular-nums">{campaignCounts.get(v.id) ?? 0}</Td>
              <Td className="whitespace-nowrap text-xs text-muted">{formatDate(v.published_at)}</Td>
              <Td className="whitespace-nowrap text-xs text-muted">{formatDate(v.created_at)}</Td>
            </tr>
          ))}
        </TBody>
      </DataTable>
    </div>
  );
}
