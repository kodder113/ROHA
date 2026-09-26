import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { assertPlatformAdmin, ForbiddenError } from "@/lib/auth/session";
import { createAdminClient, type AdminSupabase } from "@/lib/supabase/admin";
import { logAppError, logAudit, type AuditEntry } from "@/lib/audit";
import { limitOverridesSchema } from "@/lib/billing/entitlements";
import type { Json } from "@/lib/database.types";
import type { ActionState } from "@/components/admin/action-state";

/** Error whose message is safe and meant to be shown to the administrator. */
export class AdminActionError extends Error {
  constructor(message: string, public readonly details?: string[]) {
    super(message);
    this.name = "AdminActionError";
  }
}

type HandlerResult = string | { message: string; redirectTo?: string; details?: string[] };

export interface AdminActionContext<T> {
  user: User;
  admin: AdminSupabase;
  input: T;
  /** Writes a platform-scope audit entry attributed to the acting admin. */
  audit: (entry: Omit<AuditEntry, "scope" | "actorUserId" | "actorEmail">) => Promise<void>;
}

function formToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (typeof value !== "string") continue;
    out[key] = value;
  }
  return out;
}

export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
}

/** Converts Supabase / Postgres / trigger errors into readable messages. */
export function friendlyError(err: unknown): { message: string; expected: boolean } {
  if (err instanceof AdminActionError) return { message: err.message, expected: true };
  if (err instanceof ForbiddenError) return { message: "You are not authorized to perform platform administration.", expected: true };
  const e = (err ?? {}) as { message?: string; code?: string; details?: string };
  const msg = typeof e.message === "string" ? e.message : String(err);
  const marker = msg.match(/ROHA_(IMMUTABLE|INVALID|FORBIDDEN):?\s*([\s\S]*)$/);
  if (marker) {
    const detail = marker[2]?.trim();
    if (marker[1] === "IMMUTABLE") {
      return {
        message: `This record is locked to protect historical results${detail ? ` — ${detail}` : ""}. Create a new draft version instead.`,
        expected: true,
      };
    }
    if (marker[1] === "INVALID") return { message: `The change was rejected: ${detail || "invalid state"}.`, expected: true };
    return { message: "The database refused this operation (forbidden).", expected: true };
  }
  switch (e.code) {
    case "23505":
      return { message: "A record with the same unique value already exists.", expected: true };
    case "23503":
      return { message: "This record is referenced by other records (for example campaigns) and cannot be removed or re-linked.", expected: true };
    case "23514":
      return { message: `A value is outside the range the database allows. ${msg}`, expected: true };
    case "22P02":
      return { message: "A value has an invalid format.", expected: true };
  }
  return { message: `Unexpected error: ${msg}`, expected: false };
}

/**
 * Runs a super-admin mutation: verifies platform-admin rights, validates the
 * submitted form with zod, executes the handler, maps errors to readable
 * feedback and revalidates the admin console.
 */
export async function runAdminAction<S extends z.ZodType>(
  formData: FormData,
  schema: S,
  handler: (ctx: AdminActionContext<z.infer<S>>) => Promise<HandlerResult>,
): Promise<ActionState> {
  let user: User;
  try {
    user = await assertPlatformAdmin();
  } catch {
    return { ok: false, message: "You are not authorized to perform platform administration.", at: Date.now() };
  }

  const parsed = schema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the submitted values.", details: formatZodIssues(parsed.error), at: Date.now() };
  }

  const admin = createAdminClient();
  const audit: AdminActionContext<z.infer<S>>["audit"] = (entry) =>
    logAudit({ ...entry, scope: "platform", actorUserId: user.id, actorEmail: user.email ?? null });

  let result: HandlerResult;
  try {
    result = await handler({ user, admin, input: parsed.data, audit });
  } catch (err) {
    const { message, expected } = friendlyError(err);
    if (!expected) await logAppError("admin.action", err, { userId: user.id });
    return {
      ok: false,
      message,
      details: err instanceof AdminActionError ? err.details : undefined,
      at: Date.now(),
    };
  }

  revalidatePath("/admin", "layout");
  const out = typeof result === "string" ? { message: result } : result;
  if (out.redirectTo) redirect(out.redirectTo);
  return { ok: true, message: out.message, details: out.details, at: Date.now() };
}

// ---------------------------------------------------------------------------
// Form field helpers (FormData values are strings; absent fields are undefined)
// ---------------------------------------------------------------------------

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const zId = z.guid({ message: "Invalid identifier" });

export const zText = (min = 1, max = 500) => z.preprocess((v) => (v ?? ""), z.string().trim().min(min).max(max));

export const zOptText = (max = 2000) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().max(max).nullable(),
  );

export const zCheckbox = z.preprocess((v) => v === "on" || v === "true" || v === "1" || v === true, z.boolean());

/** Optional integer; blank means null ("unlimited" / not set). */
export const zOptInt = (min: number, max = 1_000_000_000) =>
  z.preprocess((v) => {
    const b = blankToUndefined(v);
    return b === undefined || b === null ? null : Number(b);
  }, z.number().int().min(min).max(max).nullable());

export const zInt = (min: number, max: number) => z.preprocess((v) => Number(blankToUndefined(v)), z.number().int().min(min).max(max));

/** Optional yyyy-mm-dd date; returned as an ISO timestamp at 23:59:59 UTC. */
export const zOptDate = z.preprocess(
  (v) => blankToUndefined(v) ?? null,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format")
    .nullable()
    .transform((d) => (d ? new Date(`${d}T23:59:59.000Z`).toISOString() : null)),
);

const LIMIT_KEYS = ["max_campaigns", "max_responses_per_campaign", "max_admins", "features"] as const;

/**
 * Parses and validates a limit_overrides JSON document. Only keys the
 * administrator actually wrote are stored (schema defaults are not expanded,
 * otherwise every feature would be overridden).
 */
export function parseLimitOverrides(raw: string | null | undefined): Json {
  const text = (raw ?? "").trim();
  if (!text) return {};
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (err) {
    throw new AdminActionError("Limit overrides must be valid JSON.", [(err as Error).message]);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AdminActionError("Limit overrides must be a JSON object.");
  }
  const obj = value as Record<string, unknown>;
  const unknownKeys = Object.keys(obj).filter((k) => !(LIMIT_KEYS as readonly string[]).includes(k));
  if (unknownKeys.length) {
    throw new AdminActionError("Limit overrides contain unknown keys.", [`Allowed keys: ${LIMIT_KEYS.join(", ")}`, `Unknown: ${unknownKeys.join(", ")}`]);
  }
  const check = limitOverridesSchema.safeParse(obj);
  if (!check.success) throw new AdminActionError("Limit overrides are invalid.", formatZodIssues(check.error));
  const out: Record<string, Json> = {};
  for (const k of LIMIT_KEYS) {
    if (!(k in obj)) continue;
    if (k === "features") {
      const features = obj.features as Record<string, unknown>;
      const parsedFeatures = (check.data.features ?? {}) as Record<string, unknown>;
      const picked: Record<string, Json> = {};
      for (const fk of Object.keys(features ?? {})) {
        if (fk in parsedFeatures) picked[fk] = parsedFeatures[fk] as Json;
      }
      out.features = picked;
    } else {
      out[k] = obj[k] as Json;
    }
  }
  return out;
}
