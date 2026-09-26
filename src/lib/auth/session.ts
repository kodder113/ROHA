import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { logAudit, logAppError } from "@/lib/audit";

export type OrgRole = "owner" | "admin" | "viewer";
export const MANAGE_ROLES: OrgRole[] = ["owner", "admin"];
export const ORG_COOKIE = "roha_org";

export interface Membership {
  org: Tables<"organizations">;
  role: OrgRole;
}

export interface OrgContext {
  user: User;
  org: Tables<"organizations">;
  role: OrgRole;
  memberships: Membership[];
  isPlatformAdmin: boolean;
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** The verified signed-in user (validated with the Supabase Auth server). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
});

export async function requireUser(next = "/app"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

export const isPlatformAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  if (data === true) return true;
  // Bootstrap: verified users listed in ROHA_PLATFORM_ADMIN_EMAILS become super-admins.
  const email = user.email?.toLowerCase();
  if (user.email_confirmed_at && email && serverEnv.platformAdminEmails().includes(email)) {
    await completeAccountSetup(user);
    return true;
  }
  return false;
});

/**
 * Completes deferred setup for a verified user:
 *  - provisions the organization captured at registration, once the email is verified;
 *  - promotes configured Rodrik Consulting emails to platform administrators.
 */
async function completeAccountSetup(user: User): Promise<void> {
  if (!user.email_confirmed_at) return;
  const admin = createAdminClient();
  try {
    const email = user.email?.toLowerCase();
    if (email && serverEnv.platformAdminEmails().includes(email)) {
      const { data: existing } = await admin.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!existing) {
        await admin.from("platform_admins").insert({ user_id: user.id });
        await logAudit({ scope: "platform", actorUserId: user.id, actorEmail: email, action: "platform_admin.granted", targetType: "user", targetId: user.id, metadata: { via: "ROHA_PLATFORM_ADMIN_EMAILS" } });
      }
    }
    const { data: pending } = await admin.from("pending_registrations").select("payload").eq("user_id", user.id).maybeSingle();
    if (pending) {
      await admin.rpc("provision_organization", { p_user: user.id, p_email: user.email ?? "", p_payload: pending.payload });
    }
  } catch (err) {
    await logAppError("auth.completeAccountSetup", err, { userId: user.id });
  }
}

export const getMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const load = async () =>
    supabase
      .from("organization_members")
      .select("role_key, status, organizations(*)")
      .eq("user_id", user.id)
      .eq("status", "active");
  let { data } = await load();
  if (!data || data.length === 0) {
    await completeAccountSetup(user);
    ({ data } = await load());
  }
  return (data ?? [])
    .filter((m) => m.organizations)
    .map((m) => ({ org: m.organizations as Tables<"organizations">, role: m.role_key as OrgRole }))
    .sort((a, b) => a.org.name.localeCompare(b.org.name));
});

export const getOrgContext = cache(async (): Promise<OrgContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;
  const selected = (await cookies()).get(ORG_COOKIE)?.value;
  const current = memberships.find((m) => m.org.id === selected) ?? memberships[0];
  return { user, org: current.org, role: current.role, memberships, isPlatformAdmin: await isPlatformAdmin() };
});

/** For pages: redirects when unauthenticated / without an organization / lacking a role. */
export async function requireOrgContext(roles?: OrgRole[]): Promise<OrgContext> {
  const user = await requireUser();
  const ctx = await getOrgContext();
  if (!ctx) {
    if (!user.email_confirmed_at) redirect("/auth/verify");
    redirect("/get-started?step=organization");
  }
  if (roles && !roles.includes(ctx.role)) redirect("/app?denied=1");
  return ctx;
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertOrgRole(orgId: string, roles: OrgRole[]): Promise<OrgContext> {
  const ctx = await getOrgContext();
  if (!ctx) throw new ForbiddenError("Please sign in.");
  const membership = ctx.memberships.find((m) => m.org.id === orgId);
  if (!membership || !roles.includes(membership.role)) throw new ForbiddenError();
  if (membership.org.status !== "active") throw new ForbiddenError("This organization's access is suspended.");
  return { ...ctx, org: membership.org, role: membership.role };
}

export async function requirePlatformAdmin(): Promise<User> {
  const user = await requireUser("/admin");
  if (!(await isPlatformAdmin())) redirect("/app?denied=1");
  return user;
}

export async function assertPlatformAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || !(await isPlatformAdmin())) throw new ForbiddenError();
  return user;
}
