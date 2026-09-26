"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertOrgRole, ForbiddenError, MANAGE_ROLES } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadEntitlements } from "@/lib/org/entitlements";
import { assertCanAddAdmin, EntitlementError } from "@/lib/billing/entitlements";
import { getStripe } from "@/lib/billing/stripe";
import { publicEnv } from "@/lib/env";
import { logAppError, logAudit } from "@/lib/audit";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";

export interface SettingsState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function friendly(err: unknown): string {
  if (err instanceof ForbiddenError || err instanceof EntitlementError || err instanceof RateLimitError) return err.message;
  return "Something went wrong. Please try again.";
}

const orgSchema = z.object({
  orgId: z.uuid(),
  name: z.string().trim().min(2).max(200),
  industry: z.string().trim().max(120).optional(),
  employee_count_range: z.string().trim().max(40).optional(),
  website: z.string().trim().max(300).optional(),
  country: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  contact_name: z.string().trim().max(160).optional(),
  contact_email: z.union([z.literal(""), z.email()]).optional(),
  contact_title: z.string().trim().max(160).optional(),
  contact_phone: z.string().trim().max(40).optional(),
});

export async function updateOrganization(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = orgSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { error: "Please correct the highlighted fields.", fieldErrors };
  }
  const { orgId, ...values } = parsed.data;
  try {
    const ctx = await assertOrgRole(orgId, MANAGE_ROLES);
    // User-scoped client: RLS and column-level grants restrict what can change.
    const supabase = await createClient();
    const { error } = await supabase
      .from("organizations")
      .update(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === "" ? null : v])) as typeof values)
      .eq("id", orgId);
    if (error) throw error;
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "organization.updated", targetType: "organization", targetId: orgId });
    revalidatePath("/app", "layout");
    return { message: "Organization details saved." };
  } catch (err) {
    return { error: friendly(err) };
  }
}

const inviteSchema = z.object({ orgId: z.uuid(), email: z.email().trim().toLowerCase(), role: z.enum(["admin", "viewer"]) });

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

export async function inviteMember(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email address and role." };
  const { orgId, email, role } = parsed.data;
  try {
    const ctx = await assertOrgRole(orgId, ["owner"]);
    await rateLimit("invite", orgId, 30, 3600);
    const admin = createAdminClient();
    if (role === "admin") {
      const { count } = await admin.from("organization_members").select("user_id", { count: "exact", head: true }).eq("org_id", orgId).in("role_key", ["owner", "admin"]);
      assertCanAddAdmin(await loadEntitlements(orgId), count ?? 0);
    }
    let userId: string | null = null;
    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${publicEnv.appUrl()}/auth/callback?next=/auth/reset`,
      data: { invited_to_org: orgId },
    });
    if (invited?.user) userId = invited.user.id;
    else if (error) userId = await findUserIdByEmail(email);
    if (!userId) return { error: "We could not send an invitation to that address." };

    const { data: existing } = await admin.from("organization_members").select("user_id").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
    if (existing) return { error: "That person is already a member of this organization." };
    const { error: insertError } = await admin
      .from("organization_members")
      .insert({ org_id: orgId, user_id: userId, role_key: role, status: "active", invited_email: email, invited_by: ctx.user.id });
    if (insertError) throw insertError;
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "team.member_invited", targetType: "user", targetId: userId, metadata: { email, role } });
    revalidatePath("/app/settings/team");
    return { message: invited?.user ? `Invitation sent to ${email}.` : `${email} already has a ROHA account and now has access.` };
  } catch (err) {
    if (!(err instanceof ForbiddenError || err instanceof EntitlementError || err instanceof RateLimitError)) await logAppError("team.invite", err, {}, orgId);
    return { error: friendly(err) };
  }
}

const memberSchema = z.object({ orgId: z.uuid(), userId: z.uuid(), role: z.enum(["admin", "viewer"]).optional() });

export async function changeMemberRole(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.role) return { error: "Invalid request." };
  const { orgId, userId, role } = parsed.data;
  try {
    const ctx = await assertOrgRole(orgId, ["owner"]);
    if (role === "admin") {
      const admin = createAdminClient();
      const { count } = await admin.from("organization_members").select("user_id", { count: "exact", head: true }).eq("org_id", orgId).in("role_key", ["owner", "admin"]);
      assertCanAddAdmin(await loadEntitlements(orgId), count ?? 0);
    }
    const supabase = await createClient();
    const { error, count } = await supabase.from("organization_members").update({ role_key: role }, { count: "exact" }).eq("org_id", orgId).eq("user_id", userId);
    if (error) throw error;
    if (!count) return { error: "That member's role cannot be changed." };
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "team.role_changed", targetType: "user", targetId: userId, metadata: { role } });
    revalidatePath("/app/settings/team");
    return { message: "Role updated." };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export async function removeMember(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request." };
  const { orgId, userId } = parsed.data;
  try {
    const ctx = await assertOrgRole(orgId, ["owner"]);
    const supabase = await createClient();
    const { error, count } = await supabase.from("organization_members").delete({ count: "exact" }).eq("org_id", orgId).eq("user_id", userId);
    if (error) throw error;
    if (!count) return { error: "That member cannot be removed." };
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "team.member_removed", targetType: "user", targetId: userId });
    revalidatePath("/app/settings/team");
    return { message: "Member removed." };
  } catch (err) {
    return { error: friendly(err) };
  }
}

const retentionSchema = z.object({ orgId: z.uuid(), months: z.coerce.number().int().min(6).max(120) });

export async function updateRetention(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = retentionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose a retention period between 6 and 120 months." };
  const { orgId, months } = parsed.data;
  try {
    const ctx = await assertOrgRole(orgId, ["owner"]);
    const supabase = await createClient();
    const { error } = await supabase.from("organizations").update({ data_retention_months: months }).eq("id", orgId);
    if (error) throw error;
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "organization.retention_changed", targetType: "organization", targetId: orgId, metadata: { months } });
    revalidatePath("/app/settings/data");
    return { message: `Individual response records will be deleted ${months} months after each assessment closes.` };
  } catch (err) {
    return { error: friendly(err) };
  }
}

export async function deleteOrganization(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const orgId = String(formData.get("orgId") ?? "");
  const confirm = String(formData.get("confirm") ?? "").trim();
  try {
    const ctx = await assertOrgRole(orgId, ["owner"]);
    if (ctx.org.is_demo) return { error: "The demonstration organization cannot be deleted here." };
    if (confirm !== ctx.org.name) return { error: "Type the organization name exactly to confirm." };
    const admin = createAdminClient();
    // Cancel recurring Stripe subscriptions so the customer is not billed again.
    const stripe = getStripe();
    if (stripe) {
      const { data: subs } = await admin.from("subscriptions").select("stripe_subscription_id").eq("org_id", orgId).not("stripe_subscription_id", "is", null);
      for (const s of subs ?? []) {
        try {
          await stripe.subscriptions.cancel(s.stripe_subscription_id!);
        } catch (err) {
          await logAppError("organization.delete.stripe", err, { subscription: s.stripe_subscription_id }, orgId);
        }
      }
    }
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "organization.deleted", targetType: "organization", targetId: orgId, metadata: { name: ctx.org.name } });
    const { error } = await admin.from("organizations").delete().eq("id", orgId);
    if (error) throw error;
  } catch (err) {
    await logAppError("organization.delete", err, {}, orgId);
    return { error: friendly(err) };
  }
  redirect("/get-started?deleted=1");
}

const checkoutSchema = z.object({ orgId: z.uuid(), planKey: z.enum(["professional", "enterprise"]) });

export async function startCheckout(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid plan." };
  const { orgId, planKey } = parsed.data;
  let url: string | null = null;
  try {
    const ctx = await assertOrgRole(orgId, ["owner"]);
    const stripe = getStripe();
    if (!stripe) {
      return { error: "Online payment is not configured yet. Please contact Rodrik Consulting to upgrade your plan." };
    }
    const admin = createAdminClient();
    const { data: plan } = await admin.from("plans").select("*").eq("key", planKey).eq("active", true).single();
    if (!plan?.stripe_price_id) return { error: "This plan is not yet available for online purchase. Please contact Rodrik Consulting." };
    let customerId = ctx.org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: ctx.org.name,
        email: ctx.org.contact_email ?? ctx.user.email ?? undefined,
        metadata: { org_id: orgId },
      });
      customerId = customer.id;
      await admin.from("organizations").update({ stripe_customer_id: customerId }).eq("id", orgId);
    }
    const base = publicEnv.appUrl();
    const session = await stripe.checkout.sessions.create({
      mode: plan.billing_interval === "month" ? "subscription" : "payment",
      customer: customerId,
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      metadata: { org_id: orgId, plan_key: planKey },
      ...(plan.billing_interval === "month" ? { subscription_data: { metadata: { org_id: orgId, plan_key: planKey } } } : {}),
      success_url: `${base}/app/settings/billing?checkout=success`,
      cancel_url: `${base}/app/settings/billing?checkout=canceled`,
      allow_promotion_codes: true,
    });
    await logAudit({ orgId, actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "billing.checkout_started", targetType: "plan", targetId: planKey });
    url = session.url;
  } catch (err) {
    await logAppError("billing.checkout", err, { planKey }, orgId);
    return { error: friendly(err) };
  }
  if (!url) return { error: "Could not start checkout." };
  redirect(url);
}

export async function openBillingPortal(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const orgId = String(formData.get("orgId") ?? "");
  let url: string | null = null;
  try {
    const ctx = await assertOrgRole(orgId, ["owner"]);
    const stripe = getStripe();
    if (!stripe || !ctx.org.stripe_customer_id) return { error: "No billing account is associated with this organization yet." };
    const session = await stripe.billingPortal.sessions.create({
      customer: ctx.org.stripe_customer_id,
      return_url: `${publicEnv.appUrl()}/app/settings/billing`,
    });
    url = session.url;
  } catch (err) {
    await logAppError("billing.portal", err, {}, orgId);
    return { error: friendly(err) };
  }
  redirect(url);
}
