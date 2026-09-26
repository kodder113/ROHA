"use server";

import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import type { AdminSupabase } from "@/lib/supabase/admin";
import { AdminActionError, runAdminAction, zCheckbox, zId, zOptText, zText } from "../_lib/action";
import { revalidatePath } from "next/cache";
import { checkReadiness } from "./readiness";
import { loadReleaseContext } from "./release";

async function requireDraft(admin: AdminSupabase, versionId: string) {
  const { data, error } = await admin.from("assessment_versions").select("*").eq("id", versionId).maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminActionError("Assessment version not found.");
  if (data.status !== "draft") {
    throw new AdminActionError(`Version ${data.version_number} is ${data.status}. Published content is immutable so historical results stay reproducible — create a new draft instead.`);
  }
  return data;
}

export async function createAssessmentDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({}), async ({ admin, user, audit }) => {
    const { data: source, error: sourceError } = await admin
      .from("assessment_versions")
      .select("*")
      .eq("status", "published")
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sourceError) throw sourceError;
    if (!source) throw new AdminActionError("There is no published version to clone.");

    const { data: existingDraft } = await admin
      .from("assessment_versions")
      .select("id, version_number")
      .eq("template_id", source.template_id)
      .eq("status", "draft")
      .limit(1)
      .maybeSingle();
    if (existingDraft) {
      throw new AdminActionError(`Draft version ${existingDraft.version_number} already exists. Publish or delete it before creating another.`);
    }

    const { data: maxRow } = await admin
      .from("assessment_versions")
      .select("version_number")
      .eq("template_id", source.template_id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const versionNumber = (maxRow?.version_number ?? 0) + 1;

    const { data: draft, error: insertError } = await admin
      .from("assessment_versions")
      .insert({
        template_id: source.template_id,
        version_number: versionNumber,
        status: "draft",
        title: source.title,
        current_label: source.current_label,
        desired_label: source.desired_label,
        change_notes: null,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    try {
      const [{ data: dims, error: dErr }, { data: questions, error: qErr }, { data: qual, error: qqErr }] = await Promise.all([
        admin.from("dimensions").select("*").eq("version_id", source.id),
        admin.from("questions").select("*").eq("version_id", source.id),
        admin.from("qualitative_questions").select("*").eq("version_id", source.id),
      ]);
      if (dErr || qErr || qqErr) throw dErr ?? qErr ?? qqErr;

      const { data: newDims, error: ndErr } = await admin
        .from("dimensions")
        .insert((dims ?? []).map((d) => ({ version_id: draft.id, key: d.key, code: d.code, name: d.name, description: d.description, sort_order: d.sort_order })))
        .select("id, key");
      if (ndErr) throw ndErr;
      const newDimByKey = new Map((newDims ?? []).map((d) => [d.key, d.id]));
      const oldDimKey = new Map((dims ?? []).map((d) => [d.id, d.key]));

      if ((questions ?? []).length) {
        const { error } = await admin.from("questions").insert(
          (questions ?? []).map((q) => {
            const dimensionId = newDimByKey.get(oldDimKey.get(q.dimension_id) ?? "");
            if (!dimensionId) throw new AdminActionError("Could not map a question to its dimension while cloning.");
            return { version_id: draft.id, dimension_id: dimensionId, key: q.key, focus: q.focus, prompt: q.prompt, allow_na: q.allow_na, sort_order: q.sort_order };
          }),
        );
        if (error) throw error;
      }
      if ((qual ?? []).length) {
        const { error } = await admin
          .from("qualitative_questions")
          .insert((qual ?? []).map((q) => ({ version_id: draft.id, key: q.key, prompt: q.prompt, sort_order: q.sort_order })));
        if (error) throw error;
      }
    } catch (err) {
      await admin.from("assessment_versions").delete().eq("id", draft.id);
      throw err;
    }

    await audit({
      action: "assessment_version.draft_created",
      targetType: "assessment_version",
      targetId: draft.id,
      metadata: { version_number: versionNumber, cloned_from: source.id, cloned_from_version: source.version_number },
    });
    return { message: `Draft version ${versionNumber} created.`, redirectTo: `/admin/assessments/${draft.id}` };
  });
}

export async function updateVersionMeta(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.object({
    versionId: zId,
    title: zText(3, 200),
    current_label: zText(3, 300),
    desired_label: zText(3, 300),
    change_notes: zOptText(4000),
  });
  return runAdminAction(formData, schema, async ({ admin, input, audit }) => {
    const v = await requireDraft(admin, input.versionId);
    const { error } = await admin
      .from("assessment_versions")
      .update({ title: input.title, current_label: input.current_label, desired_label: input.desired_label, change_notes: input.change_notes })
      .eq("id", v.id);
    if (error) throw error;
    await audit({ action: "assessment_version.updated", targetType: "assessment_version", targetId: v.id, metadata: { version_number: v.version_number } });
    return "Version details saved.";
  });
}

const QUESTION_FIELD = /^q_([0-9a-fA-F-]{36})_(prompt|focus)$/;

export async function updateDimension(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.looseObject({ versionId: zId, dimensionId: zId, name: zText(2, 120), description: zText(10, 1000) });
  return runAdminAction(formData, schema, async ({ admin, input, audit }) => {
    const v = await requireDraft(admin, input.versionId);
    const { data: dim } = await admin.from("dimensions").select("id, key").eq("id", input.dimensionId).eq("version_id", v.id).maybeSingle();
    if (!dim) throw new AdminActionError("Dimension not found in this version.");

    const questions = new Map<string, { prompt?: string; focus?: string }>();
    for (const [key, value] of Object.entries(input)) {
      const m = key.match(QUESTION_FIELD);
      if (!m || typeof value !== "string") continue;
      const entry = questions.get(m[1]) ?? {};
      entry[m[2] as "prompt" | "focus"] = value.trim();
      questions.set(m[1], entry);
    }
    const problems: string[] = [];
    const questionSchema = z.object({ prompt: z.string().min(10).max(400), focus: z.string().min(2).max(200) });
    const updates: { id: string; prompt: string; focus: string; allow_na: boolean }[] = [];
    for (const [id, q] of questions) {
      const parsed = questionSchema.safeParse(q);
      if (!parsed.success) {
        problems.push(...parsed.error.issues.map((i) => `Question ${id.slice(0, 8)} ${i.path.join(".")}: ${i.message}`));
        continue;
      }
      const allowNa = input[`q_${id}_allow_na`] === "on";
      updates.push({ id, prompt: parsed.data.prompt, focus: parsed.data.focus, allow_na: allowNa });
    }
    if (problems.length) throw new AdminActionError("Some questions are invalid.", problems);

    const { error } = await admin.from("dimensions").update({ name: input.name, description: input.description }).eq("id", dim.id);
    if (error) throw error;
    for (const u of updates) {
      const { error: qErr } = await admin
        .from("questions")
        .update({ prompt: u.prompt, focus: u.focus, allow_na: u.allow_na })
        .eq("id", u.id)
        .eq("dimension_id", dim.id);
      if (qErr) throw qErr;
    }
    await audit({
      action: "assessment_version.dimension_updated",
      targetType: "dimension",
      targetId: dim.id,
      metadata: { version_id: v.id, dimension: dim.key, questions_updated: updates.length },
    });
    return `Dimension saved (${updates.length} questions updated).`;
  });
}

export async function updateQualitativeQuestions(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.looseObject({ versionId: zId }), async ({ admin, input, audit }) => {
    const v = await requireDraft(admin, input.versionId);
    const updates: { id: string; prompt: string }[] = [];
    const problems: string[] = [];
    for (const [key, value] of Object.entries(input)) {
      const m = key.match(/^qq_([0-9a-fA-F-]{36})$/);
      if (!m || typeof value !== "string") continue;
      const prompt = value.trim();
      if (prompt.length < 10 || prompt.length > 500) problems.push(`Open-ended question ${m[1].slice(0, 8)}: prompt must be 10–500 characters`);
      else updates.push({ id: m[1], prompt });
    }
    if (problems.length) throw new AdminActionError("Some open-ended questions are invalid.", problems);
    for (const u of updates) {
      const { error } = await admin.from("qualitative_questions").update({ prompt: u.prompt }).eq("id", u.id).eq("version_id", v.id);
      if (error) throw error;
    }
    await audit({ action: "assessment_version.qualitative_updated", targetType: "assessment_version", targetId: v.id, metadata: { updated: updates.length } });
    return "Open-ended questions saved.";
  });
}

/**
 * Publishes an assessment release atomically: the assessment version, its
 * scoring rules and compatible AI reporting instructions change together in
 * one database transaction (publish_assessment_release), or not at all. On
 * success every cached page is invalidated so the website and application
 * show the new framework immediately.
 */
export async function publishAssessmentVersion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ versionId: zId, retirePrevious: zCheckbox }), async ({ admin, input, user }) => {
    const v = await requireDraft(admin, input.versionId);
    const ctx = await loadReleaseContext(admin, v, input.retirePrevious);
    const checks = checkReadiness({ title: v.title, versionNumber: v.version_number, ...ctx });
    const failing = checks.filter((c) => !c.ok);
    if (failing.length || !ctx.plan.rules || !ctx.plan.ai) {
      throw new AdminActionError("This version is not ready to publish.", failing.map((c) => `${c.label}${c.detail ? ` — ${c.detail}` : ""}`));
    }

    const { data, error } = await admin.rpc("publish_assessment_release", {
      p_assessment_version_id: v.id,
      p_scoring_rules_id: ctx.plan.rules.id,
      p_ai_instructions_id: ctx.plan.ai.id,
      p_retire_previous: input.retirePrevious,
      p_actor_user_id: user.id,
      p_actor_email: user.email ?? "",
    });
    if (error) {
      throw new AdminActionError("The release was not published. Nothing was changed.", [error.message.replace(/^ROHA_RELEASE:\s*/, "")]);
    }
    const summary = data as { scoring_rules_version: number; ai_instructions_version: number; retired_assessment_versions: number[] };

    // Every page that shows framework content or counts (website, app, admin).
    revalidatePath("/", "layout");

    const retired = summary.retired_assessment_versions ?? [];
    return `Version ${v.version_number} published with scoring rules v${summary.scoring_rules_version} and AI instructions v${summary.ai_instructions_version}${
      retired.length ? `; retired version ${retired.join(", ")}` : ""
    }. Website and application caches were refreshed. Existing campaigns keep their pinned versions.`;
  });
}

export async function deleteAssessmentDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ versionId: zId }), async ({ admin, input, audit }) => {
    const v = await requireDraft(admin, input.versionId);
    const { error } = await admin.from("assessment_versions").delete().eq("id", v.id).eq("status", "draft");
    if (error) throw error;
    await audit({ action: "assessment_version.draft_deleted", targetType: "assessment_version", targetId: v.id, metadata: { version_number: v.version_number } });
    return { message: "Draft deleted.", redirectTo: "/admin/assessments" };
  });
}
