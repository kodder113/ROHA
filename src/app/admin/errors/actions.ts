"use server";

import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { runAdminAction, zCheckbox } from "../_lib/action";

export async function setErrorResolved(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.object({ id: z.preprocess((v) => Number(v), z.number().int().positive()), resolved: zCheckbox });
  return runAdminAction(formData, schema, async ({ admin, input, audit }) => {
    const { data, error } = await admin.from("app_errors").update({ resolved: input.resolved }).eq("id", input.id).select("id, org_id, source").single();
    if (error) throw error;
    await audit({
      action: input.resolved ? "app_error.resolved" : "app_error.reopened",
      targetType: "app_error",
      targetId: String(data.id),
      orgId: data.org_id,
      metadata: { source: data.source },
    });
    return input.resolved ? "Marked resolved." : "Marked unresolved.";
  });
}
