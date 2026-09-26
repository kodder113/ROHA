"use server";

import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import type { AdminSupabase } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";
import { scoringConfigSchema } from "@/lib/scoring/config";
import { AdminActionError, formatZodIssues, runAdminAction, zId, zOptText, zText } from "../_lib/action";

async function requireDraft(admin: AdminSupabase, id: string) {
  const { data, error } = await admin.from("scoring_rule_versions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminActionError("Scoring rule version not found.");
  if (data.status !== "draft") throw new AdminActionError(`Scoring rules v${data.version_number} are ${data.status} and immutable. Create a new draft instead.`);
  return data;
}

function validateConfig(raw: unknown): Json {
  const parsed = scoringConfigSchema.safeParse(raw);
  if (!parsed.success) throw new AdminActionError("The scoring configuration is invalid.", formatZodIssues(parsed.error));
  return parsed.data as unknown as Json;
}

export async function createScoringDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({}), async ({ admin, user, audit }) => {
    const { data: existingDraft } = await admin.from("scoring_rule_versions").select("version_number").eq("status", "draft").limit(1).maybeSingle();
    if (existingDraft) throw new AdminActionError(`Draft v${existingDraft.version_number} already exists. Publish or delete it first.`);
    const { data: source } = await admin
      .from("scoring_rule_versions")
      .select("*")
      .eq("status", "published")
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: maxRow } = await admin.from("scoring_rule_versions").select("version_number").order("version_number", { ascending: false }).limit(1).maybeSingle();
    if (!source) throw new AdminActionError("There is no published scoring version to clone.");
    const versionNumber = (maxRow?.version_number ?? 0) + 1;
    const { data, error } = await admin
      .from("scoring_rule_versions")
      .insert({
        version_number: versionNumber,
        name: `ROHA Scoring Rules v${versionNumber}`,
        status: "draft",
        config: source.config,
        notes: source.notes,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    await audit({ action: "scoring_rules.draft_created", targetType: "scoring_rule_version", targetId: data.id, metadata: { version_number: versionNumber, cloned_from_version: source.version_number } });
    return { message: `Draft v${versionNumber} created.`, redirectTo: `/admin/scoring/${data.id}` };
  });
}

export async function updateScoringDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.object({ id: zId, name: zText(3, 160), notes: zOptText(5000), config: zText(2, 50_000) });
  return runAdminAction(formData, schema, async ({ admin, input, audit }) => {
    const v = await requireDraft(admin, input.id);
    let raw: unknown;
    try {
      raw = JSON.parse(input.config);
    } catch (err) {
      throw new AdminActionError("The configuration is not valid JSON.", [(err as Error).message]);
    }
    const config = validateConfig(raw);
    const { error } = await admin.from("scoring_rule_versions").update({ name: input.name, notes: input.notes, config }).eq("id", v.id);
    if (error) throw error;
    await audit({ action: "scoring_rules.draft_updated", targetType: "scoring_rule_version", targetId: v.id, metadata: { version_number: v.version_number } });
    return "Draft saved. The configuration is valid.";
  });
}

export async function publishScoringDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ id: zId }), async ({ admin, input, audit }) => {
    const v = await requireDraft(admin, input.id);
    validateConfig(v.config);
    const { error } = await admin.from("scoring_rule_versions").update({ status: "published" }).eq("id", v.id).eq("status", "draft");
    if (error) throw error;
    await audit({ action: "scoring_rules.published", targetType: "scoring_rule_version", targetId: v.id, metadata: { version_number: v.version_number } });
    return `Scoring rules v${v.version_number} published. New campaigns will use them; existing campaigns keep their pinned version.`;
  });
}

export async function deleteScoringDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ id: zId }), async ({ admin, input, audit }) => {
    const v = await requireDraft(admin, input.id);
    const { error } = await admin.from("scoring_rule_versions").delete().eq("id", v.id).eq("status", "draft");
    if (error) throw error;
    await audit({ action: "scoring_rules.draft_deleted", targetType: "scoring_rule_version", targetId: v.id, metadata: { version_number: v.version_number } });
    return { message: "Draft deleted.", redirectTo: "/admin/scoring" };
  });
}
