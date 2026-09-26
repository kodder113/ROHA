import "server-only";
import type { AdminSupabase } from "@/lib/supabase/admin";
import { planRelease } from "./readiness";

/** Loads everything the publication checklist and release plan need. */
export async function loadReleaseContext(admin: AdminSupabase, v: { id: string; template_id: string; version_number: number }, retirePrevious: boolean) {
  const [{ data: dimensions }, { data: questions }, { data: qualitative }, { data: rules }, { data: ai }, { data: published }] = await Promise.all([
    admin.from("dimensions").select("id, name, description, code").eq("version_id", v.id).order("sort_order"),
    admin.from("questions").select("dimension_id, prompt, focus").eq("version_id", v.id),
    admin.from("qualitative_questions").select("prompt").eq("version_id", v.id),
    admin.from("scoring_rule_versions").select("id, version_number, status, config").in("status", ["draft", "published"]),
    admin.from("ai_report_instructions").select("id, version_number, status, supported_assessment_versions").in("status", ["draft", "active"]),
    admin.from("assessment_versions").select("version_number").eq("template_id", v.template_id).eq("status", "published").neq("id", v.id),
  ]);
  const plan = planRelease(v.version_number, rules ?? [], ai ?? [], (published ?? []).map((p) => p.version_number), retirePrevious);
  return { dimensions: dimensions ?? [], questions: questions ?? [], qualitative: qualitative ?? [], plan };
}
