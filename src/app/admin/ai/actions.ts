"use server";

import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { AdminActionError, runAdminAction, zId, zText } from "../_lib/action";

export async function createAiInstructionsDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({}), async ({ admin, user, audit }) => {
    const { data: draft } = await admin.from("ai_report_instructions").select("version_number").eq("status", "draft").limit(1).maybeSingle();
    if (draft) throw new AdminActionError(`Draft v${draft.version_number} already exists. Activate or delete it first.`);
    const { data: active } = await admin.from("ai_report_instructions").select("*").eq("status", "active").maybeSingle();
    const { data: latest } = await admin.from("ai_report_instructions").select("*").order("version_number", { ascending: false }).limit(1).maybeSingle();
    const source = active ?? latest;
    const versionNumber = (latest?.version_number ?? 0) + 1;
    const { data, error } = await admin
      .from("ai_report_instructions")
      .insert({
        version_number: versionNumber,
        name: source ? source.name.replace(/v\d+$/, `v${versionNumber}`) : `Executive Intelligence Report v${versionNumber}`,
        system_prompt: source?.system_prompt ?? "You are the ROHA Organizational Intelligence analyst.",
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    await audit({ action: "ai_instructions.draft_created", targetType: "ai_report_instructions", targetId: data.id, metadata: { version_number: versionNumber, cloned_from_version: source?.version_number ?? null } });
    return { message: `Draft v${versionNumber} created.`, redirectTo: `/admin/ai/${data.id}` };
  });
}

export async function updateAiInstructionsDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ id: zId, name: zText(3, 160), system_prompt: zText(50, 50_000) }), async ({ admin, input, audit }) => {
    const { data: v } = await admin.from("ai_report_instructions").select("id, status, version_number").eq("id", input.id).maybeSingle();
    if (!v) throw new AdminActionError("Instructions version not found.");
    if (v.status !== "draft") throw new AdminActionError("Only draft instructions can be edited. Create a new version to make changes.");
    const { error } = await admin.from("ai_report_instructions").update({ name: input.name, system_prompt: input.system_prompt }).eq("id", v.id).eq("status", "draft");
    if (error) throw error;
    await audit({ action: "ai_instructions.draft_updated", targetType: "ai_report_instructions", targetId: v.id, metadata: { version_number: v.version_number, length: input.system_prompt.length } });
    return "Draft instructions saved.";
  });
}

export async function activateAiInstructions(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ id: zId }), async ({ admin, input, audit }) => {
    const { data: target } = await admin
      .from("ai_report_instructions")
      .select("id, status, version_number, supported_assessment_versions")
      .eq("id", input.id)
      .maybeSingle();
    if (!target) throw new AdminActionError("Instructions version not found.");
    if (target.status === "active") return `v${target.version_number} is already active.`;
    // Instructions must describe every assessment version available for new campaigns.
    const { data: inUse } = await admin.from("assessment_versions").select("version_number").eq("status", "published");
    const unsupported = (inUse ?? []).map((v) => v.version_number).filter((n) => !target.supported_assessment_versions.includes(n));
    if (unsupported.length) {
      throw new AdminActionError(
        `v${target.version_number} does not support published assessment version ${unsupported.join(", ")}. Activate compatible instructions, or publish a release.`,
      );
    }

    // Only one active row is allowed (partial unique index): retire the current one first.
    const { data: previous, error: retireError } = await admin
      .from("ai_report_instructions")
      .update({ status: "retired" })
      .eq("status", "active")
      .select("id, version_number");
    if (retireError) throw retireError;

    const { error } = await admin.from("ai_report_instructions").update({ status: "active" }).eq("id", target.id);
    if (error) {
      // Restore the previous active version so reports keep working.
      for (const p of previous ?? []) await admin.from("ai_report_instructions").update({ status: "active" }).eq("id", p.id);
      throw error;
    }
    await audit({
      action: "ai_instructions.activated",
      targetType: "ai_report_instructions",
      targetId: target.id,
      metadata: { version_number: target.version_number, retired_versions: (previous ?? []).map((p) => p.version_number) },
    });
    return `v${target.version_number} is now active for new AI reports.`;
  });
}

export async function deleteAiInstructionsDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ id: zId }), async ({ admin, input, audit }) => {
    const { data: v } = await admin.from("ai_report_instructions").select("id, status, version_number").eq("id", input.id).maybeSingle();
    if (!v) throw new AdminActionError("Instructions version not found.");
    if (v.status !== "draft") throw new AdminActionError("Only drafts can be deleted; reports reference earlier versions.");
    const { error } = await admin.from("ai_report_instructions").delete().eq("id", v.id).eq("status", "draft");
    if (error) throw error;
    await audit({ action: "ai_instructions.draft_deleted", targetType: "ai_report_instructions", targetId: v.id, metadata: { version_number: v.version_number } });
    return { message: "Draft deleted.", redirectTo: "/admin/ai" };
  });
}
