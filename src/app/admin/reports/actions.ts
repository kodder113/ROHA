"use server";

import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { AdminActionError, runAdminAction, zId } from "../_lib/action";

export async function deleteFailedReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ id: zId }), async ({ admin, input, audit }) => {
    const { data: report } = await admin.from("ai_reports").select("id, status, org_id, campaign_id, error").eq("id", input.id).maybeSingle();
    if (!report) throw new AdminActionError("Report not found.");
    if (report.status !== "failed") throw new AdminActionError("Only failed reports can be deleted.");
    const { error } = await admin.from("ai_reports").delete().eq("id", report.id).eq("status", "failed");
    if (error) throw error;
    await audit({
      action: "ai_report.failed_deleted",
      targetType: "ai_report",
      targetId: report.id,
      orgId: report.org_id,
      metadata: { campaign_id: report.campaign_id, error: report.error?.slice(0, 300) ?? null },
    });
    return "Failed report deleted.";
  });
}
