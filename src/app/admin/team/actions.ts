"use server";

import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import type { ActionState } from "@/components/admin/action-state";
import type { AdminSupabase } from "@/lib/supabase/admin";
import { AdminActionError, runAdminAction, zId } from "../_lib/action";

const PER_PAGE = 1000;
const MAX_PAGES = 50;

async function findUserByEmail(admin: AdminSupabase, email: string): Promise<User | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw new AdminActionError(`Could not search users: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < PER_PAGE) break;
  }
  return null;
}

export async function addPlatformAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.object({ email: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.email("Enter a valid email address").max(320)) });
  return runAdminAction(formData, schema, async ({ admin, input, user, audit }) => {
    const target = await findUserByEmail(admin, input.email);
    if (!target) throw new AdminActionError("User must sign up first. No ROHA account exists for that email address.");
    if (!target.email_confirmed_at) throw new AdminActionError("That user has not verified their email address yet.");
    const { data: existing } = await admin.from("platform_admins").select("user_id").eq("user_id", target.id).maybeSingle();
    if (existing) throw new AdminActionError(`${target.email} is already a platform administrator.`);
    const { error } = await admin.from("platform_admins").insert({ user_id: target.id, created_by: user.id });
    if (error) throw error;
    await audit({ action: "platform_admin.granted", targetType: "user", targetId: target.id, metadata: { email: target.email } });
    return `${target.email} is now a platform administrator.`;
  });
}

export async function removePlatformAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ userId: zId }), async ({ admin, input, user, audit }) => {
    if (input.userId === user.id) throw new AdminActionError("You cannot remove yourself. Ask another platform administrator.");
    const { count } = await admin.from("platform_admins").select("user_id", { count: "exact", head: true });
    if ((count ?? 0) <= 1) throw new AdminActionError("At least one platform administrator must remain.");
    const { data, error } = await admin.from("platform_admins").delete().eq("user_id", input.userId).select("user_id");
    if (error) throw error;
    if (!data?.length) throw new AdminActionError("That user is not a platform administrator.");
    await audit({ action: "platform_admin.revoked", targetType: "user", targetId: input.userId });
    return "Platform administrator removed.";
  });
}
