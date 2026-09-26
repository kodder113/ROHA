import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, CopyPlus, XCircle } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { integrations, serverEnv } from "@/lib/env";
import { PageHeader, StatTile } from "@/components/ui/misc";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { DataTable, EmptyRow, StatusBadge, TBody, Td, Th, THead } from "@/components/admin/table";
import { formatDateTime } from "@/lib/utils";
import { activateAiInstructions, createAiInstructionsDraft } from "./actions";

export const metadata: Metadata = { title: "AI reporting" };

export default async function AiPage() {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  const { data: versions, error } = await admin
    .from("ai_report_instructions")
    .select("id, version_number, name, status, created_at, system_prompt")
    .order("version_number", { ascending: false });
  if (error) throw error;
  const usage = new Map(
    await Promise.all(
      (versions ?? []).map(async (v) => {
        const { count } = await admin.from("ai_reports").select("id", { count: "exact", head: true }).eq("instructions_version_id", v.id);
        return [v.id, count ?? 0] as const;
      }),
    ),
  );
  const keyConfigured = integrations.anthropic();
  const hasDraft = (versions ?? []).some((v) => v.status === "draft");
  const active = (versions ?? []).find((v) => v.status === "active");

  return (
    <div>
      <PageHeader
        eyebrow="Methodology"
        title="AI reporting"
        description="Versioned system instructions for the executive intelligence report. Exactly one version is active at a time; every report records the version it used."
        actions={
          <ActionForm action={createAiInstructionsDraft}>
            <SubmitButton disabled={hasDraft}>
              <CopyPlus className="h-4 w-4" aria-hidden /> New version (clone active)
            </SubmitButton>
          </ActionForm>
        }
        className="mb-6"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatTile tone="navy" label="Model" value={<span className="font-mono text-xl">{serverEnv.anthropicModel()}</span>} hint="Set with ROHA_AI_MODEL" />
        <StatTile
          label="Anthropic API key"
          value={
            <span className="inline-flex items-center gap-2 text-xl">
              {keyConfigured ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden /> : <XCircle className="h-5 w-5 text-red-600" aria-hidden />}
              {keyConfigured ? "Configured" : "Not configured"}
            </span>
          }
          hint={keyConfigured ? "ANTHROPIC_API_KEY is set (value never displayed)" : "Reports fall back to the deterministic rules generator"}
        />
        <StatTile label="Active instructions" value={active ? `v${active.version_number}` : "None"} hint={active?.name ?? "Activate a version"} />
      </div>

      <DataTable>
        <THead>
          <Th>Version</Th>
          <Th>Name</Th>
          <Th>Status</Th>
          <Th className="text-right">Prompt length</Th>
          <Th className="text-right">Reports</Th>
          <Th>Created</Th>
          <Th>Actions</Th>
        </THead>
        <TBody>
          {(versions ?? []).length === 0 ? <EmptyRow colSpan={7}>No instruction versions.</EmptyRow> : null}
          {(versions ?? []).map((v) => (
            <tr key={v.id} className="hover:bg-navy-50/40">
              <Td>
                <Link href={`/admin/ai/${v.id}`} className="font-semibold text-navy-900 hover:text-emerald-700 hover:underline">
                  v{v.version_number}
                </Link>
              </Td>
              <Td>{v.name}</Td>
              <Td>
                <StatusBadge status={v.status} />
              </Td>
              <Td className="text-right text-xs tabular-nums text-muted">{v.system_prompt.length.toLocaleString("en-US")} chars</Td>
              <Td className="text-right tabular-nums">{usage.get(v.id) ?? 0}</Td>
              <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(v.created_at)}</Td>
              <Td>
                {v.status !== "active" ? (
                  <ActionForm action={activateAiInstructions} compact confirm={`Activate v${v.version_number}? The current active version will be retired.`}>
                    <input type="hidden" name="id" value={v.id} />
                    <SubmitButton size="sm" variant="outline">Activate</SubmitButton>
                  </ActionForm>
                ) : (
                  <span className="text-xs text-emerald-700">In use</span>
                )}
              </Td>
            </tr>
          ))}
        </TBody>
      </DataTable>
    </div>
  );
}
