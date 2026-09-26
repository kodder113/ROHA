import "server-only";
import type { Json } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEntry {
  orgId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  scope?: "organization" | "platform";
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Appends an entry to the audit trail. Never include survey response content
 * or anything that could identify a respondent in metadata.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from("audit_logs")
      .insert({
        org_id: entry.orgId ?? null,
        actor_user_id: entry.actorUserId ?? null,
        actor_email: entry.actorEmail ?? null,
        scope: entry.scope ?? "organization",
        action: entry.action,
        target_type: entry.targetType ?? null,
        target_id: entry.targetId ?? null,
        metadata: (entry.metadata ?? {}) as Json,
      });
    if (error) throw error;
  } catch (err) {
    console.error("[audit] failed to write audit entry", entry.action, err);
  }
}

/** Records an application error for the super-admin error console. */
export async function logAppError(
  source: string,
  error: unknown,
  context: Record<string, unknown> = {},
  orgId?: string | null,
): Promise<void> {
  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error));
  console.error(`[${source}]`, err);
  try {
    await createAdminClient()
      .from("app_errors")
      .insert({
        source,
        level: "error",
        message: err.message.slice(0, 2000),
        stack: err.stack?.slice(0, 8000) ?? null,
        context: context as Json,
        org_id: orgId ?? null,
      });
  } catch (logErr) {
    console.error("[app_errors] failed to record error", logErr);
  }
}
