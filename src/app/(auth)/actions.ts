"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv, ConfigurationError } from "@/lib/env";
import { rateLimitByClient, RateLimitError } from "@/lib/security/rate-limit";
import { getCurrentUser, getMemberships } from "@/lib/auth/session";
import { logAppError, logAudit } from "@/lib/audit";
import type { Json } from "@/lib/database.types";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  /** Echo of submitted (non-secret) values so forms can be re-populated after an error. */
  values?: Record<string, string>;
}

function echo(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !["password", "confirm"].includes(k) && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

function describe(err: unknown): string {
  if (err instanceof RateLimitError) return err.message;
  if (err instanceof ConfigurationError) return "The application is not fully configured yet. Please contact the administrator.";
  return "Something went wrong. Please try again.";
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

const signInSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: echo(formData) };
  try {
    await rateLimitByClient("sign-in", 10, 600);
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      if (error.code === "email_not_confirmed") {
        return { error: "Please verify your email address first. Check your inbox for the verification link.", values: echo(formData) };
      }
      return { error: "The email or password is incorrect.", values: echo(formData) };
    }
  } catch (err) {
    return { error: describe(err) };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

// ---------------------------------------------------------------------------
// Organization registration
// ---------------------------------------------------------------------------

const organizationSchema = z.object({
  name: z.string().trim().min(2, "Enter your organization's name.").max(200),
  industry: z.string().trim().min(2, "Select an industry.").max(120),
  employee_count_range: z.string().trim().min(1, "Select an approximate employee count."),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : ""))
    .refine((v) => !v || z.url().safeParse(v).success, "Enter a valid website address."),
  country: z.string().trim().min(2, "Enter a country.").max(120),
  region: z.string().trim().min(1, "Enter a state or region.").max(120),
  contact_name: z.string().trim().min(2, "Enter the primary contact's name.").max(160),
  contact_title: z.string().trim().min(2, "Enter the primary contact's job title.").max(160),
  contact_phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .refine((v) => !v || /^[+()\d\s.-]{7,}$/.test(v), "Enter a valid telephone number."),
});

const registrationSchema = organizationSchema.extend({
  contact_email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
  terms: z.literal("on", { error: "You must accept the Terms of Service and Privacy Policy." }),
  plan: z.string().optional(),
});

function organizationPayload(data: z.infer<typeof organizationSchema> & { contact_email: string }) {
  return {
    name: data.name,
    industry: data.industry,
    employee_count_range: data.employee_count_range,
    website: data.website || null,
    country: data.country,
    region: data.region,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    contact_title: data.contact_title,
    contact_phone: data.contact_phone || null,
  };
}

export async function registerOrganization(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please correct the highlighted fields.", values: echo(formData) };
  const data = parsed.data;
  let email: string;
  try {
    await rateLimitByClient("register", 5, 3600);
    const supabase = await createClient();
    const plan = data.plan && ["professional", "enterprise"].includes(data.plan) ? data.plan : null;
    const { data: signUp, error } = await supabase.auth.signUp({
      email: data.contact_email,
      password: data.password,
      options: {
        emailRedirectTo: `${publicEnv.appUrl()}/auth/callback?next=${encodeURIComponent(plan ? `/app/settings/billing?plan=${plan}` : "/app")}`,
        data: { full_name: data.contact_name, job_title: data.contact_title },
      },
    });
    if (error) {
      if (error.code === "weak_password") return { fieldErrors: { password: error.message } };
      if (error.code === "user_already_exists") {
        return { error: "An account with this email already exists. Please sign in instead." };
      }
      await logAppError("auth.register", error, { code: error.code });
      return { error: "We could not create your account. Please try again." };
    }
    const user = signUp.user;
    // Supabase returns a user with no identities when the email is already registered
    // (to avoid account enumeration). Treat it as success without storing anything.
    if (user && (user.identities?.length ?? 0) > 0) {
      const admin = createAdminClient();
      await admin.from("pending_registrations").upsert({
        user_id: user.id,
        payload: organizationPayload(data) as unknown as Json,
      });
      if (user.email_confirmed_at) {
        // Email confirmation disabled in this project: provision immediately.
        await admin.rpc("provision_organization", {
          p_user: user.id,
          p_email: data.contact_email,
          p_payload: organizationPayload(data) as unknown as Json,
        });
        redirect("/app?welcome=1");
      }
    }
    email = data.contact_email;
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err; // redirect()
    if (!(err instanceof RateLimitError)) await logAppError("auth.register", err);
    return { error: describe(err) };
  }
  redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
}

/** For a signed-in, verified user who does not yet belong to an organization. */
export async function createOrganizationForCurrentUser(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/get-started");
  if (!user.email_confirmed_at) redirect("/auth/verify");
  const parsed = organizationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please correct the highlighted fields.", values: echo(formData) };
  const memberships = await getMemberships();
  if (memberships.some((m) => m.role === "owner")) redirect("/app");
  try {
    await rateLimitByClient("create-org", 5, 3600);
    const payload = organizationPayload({ ...parsed.data, contact_email: user.email ?? "" });
    const { error } = await createAdminClient().rpc("provision_organization", {
      p_user: user.id,
      p_email: user.email ?? "",
      p_payload: payload as unknown as Json,
    });
    if (error) throw error;
  } catch (err) {
    await logAppError("auth.createOrganization", err, { userId: user.id });
    return { error: describe(err) };
  }
  redirect("/app?welcome=1");
}

// ---------------------------------------------------------------------------
// Email verification & password recovery
// ---------------------------------------------------------------------------

export async function resendVerification(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Enter a valid email address." };
  try {
    await rateLimitByClient("resend-verification", 3, 3600);
    const supabase = await createClient();
    await supabase.auth.resend({
      type: "signup",
      email: email.data,
      options: { emailRedirectTo: `${publicEnv.appUrl()}/auth/callback?next=/app` },
    });
  } catch (err) {
    return { error: describe(err) };
  }
  return { message: "If an account is awaiting verification for this address, a new link is on its way." };
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { fieldErrors: { email: "Enter a valid email address." } };
  try {
    await rateLimitByClient("password-reset", 5, 3600);
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${publicEnv.appUrl()}/auth/callback?next=/auth/reset`,
    });
  } catch (err) {
    return { error: describe(err) };
  }
  return { message: "If an account exists for this address, you will receive a password reset link shortly." };
}

const resetSchema = z
  .object({
    password: registrationSchema.shape.password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const user = await getCurrentUser();
  if (!user) return { error: "Your reset link has expired. Please request a new one." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.code === "same_password" ? "Choose a password you have not used before." : "Could not update your password." };
  await logAudit({ actorUserId: user.id, actorEmail: user.email, scope: "platform", action: "user.password_changed", targetType: "user", targetId: user.id });
  redirect("/app?password=updated");
}
