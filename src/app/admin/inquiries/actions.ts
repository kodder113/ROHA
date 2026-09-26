"use server";

import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { runAdminAction, zId } from "../_lib/action";

export async function setInquiryStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ id: zId, status: z.enum(["new", "responded", "archived"]) }), async ({ admin, input, audit }) => {
    const { data, error } = await admin.from("contact_inquiries").update({ status: input.status }).eq("id", input.id).select("id, topic").single();
    if (error) throw error;
    await audit({ action: "contact_inquiry.status_updated", targetType: "contact_inquiry", targetId: data.id, metadata: { status: input.status } });
    return `Marked ${input.status}.`;
  });
}
