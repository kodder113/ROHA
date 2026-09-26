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
import { createScoringDraft } from "./actions";

export const metadata: Metadata = { title: "Scoring rules" };

export default async function ScoringPage() {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  const { data: versions, error } = await admin.from("scoring_rule_versions").select("id, version_number, name, status, notes, created_at, published_at").order("version_number", { ascending: false });
  if (error) throw error;
  const campaignCounts = new Map(
    await Promise.all(
      (versions ?? []).map(async (v) => {
        const { count } = await admin.from("campaigns").select("id", { count: "exact", head: true }).eq("scoring_rule_version_id", v.id);
        return [v.id, count ?? 0] as const;
      }),
    ),
  );
  const latestPublished = (versions ?? []).find((v) => v.status === "published");
  const hasDraft = (versions ?? []).some((v) => v.status === "draft");

  return (
    <div>
      <PageHeader
        eyebrow="Methodology"
        title="Scoring rules"
        description="Scoring rules (weights, normalization, validity thresholds, privacy group size, gap thresholds and descriptive bands) are versioned configuration."
        actions={
          <ActionForm action={createScoringDraft} confirm={`Create a new draft by cloning v${latestPublished?.version_number ?? "?"}?`}>
            <SubmitButton disabled={!latestPublished || hasDraft}>
              <CopyPlus className="h-4 w-4" aria-hidden /> Create new draft
            </SubmitButton>
          </ActionForm>
        }
        className="mb-6"
      />
      <Alert tone="info" className="mb-6" title="Pinned versions">
        New campaigns use the latest published scoring version{latestPublished ? ` (currently v${latestPublished.version_number})` : ""}. Existing campaigns keep
        the version they were launched with, and published rules can never be edited, so historical results stay reproducible.
      </Alert>
      <DataTable>
        <THead>
          <Th>Version</Th>
          <Th>Name</Th>
          <Th>Status</Th>
          <Th className="text-right">Campaigns</Th>
          <Th>Published</Th>
          <Th>Created</Th>
        </THead>
        <TBody>
          {(versions ?? []).length === 0 ? <EmptyRow colSpan={6}>No scoring rule versions.</EmptyRow> : null}
          {(versions ?? []).map((v) => (
            <tr key={v.id} className="hover:bg-navy-50/40">
              <Td>
                <Link href={`/admin/scoring/${v.id}`} className="inline-flex items-center gap-1.5 font-semibold text-navy-900 hover:text-emerald-700 hover:underline">
                  {v.status !== "draft" ? <Lock className="h-3.5 w-3.5 text-muted" aria-label="Immutable" /> : null}v{v.version_number}
                </Link>
              </Td>
              <Td>
                {v.name}
                {v.notes ? <p className="mt-0.5 line-clamp-1 max-w-lg text-xs text-muted">{v.notes}</p> : null}
              </Td>
              <Td>
                <StatusBadge status={v.status} />
                {v.id === latestPublished?.id ? <p className="mt-1 text-xs text-emerald-700">Used for new campaigns</p> : null}
              </Td>
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
