import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hmac } from "./tokens";

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Please wait a moment and try again.");
    this.name = "RateLimitError";
  }
}

/** Best-effort client identifier. Never stored raw — only as a daily-rotating HMAC. */
export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown";
  return ip;
}

/**
 * Fixed-window rate limit backed by PostgreSQL so it works across serverless
 * instances. Keys are HMAC(scope, identifier, day), so raw network addresses
 * are never persisted and keys cannot be linked across days.
 */
export async function rateLimit(scope: string, identifier: string, max: number, windowSeconds: number): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const key = hmac("ratelimit", `${scope}:${identifier}:${day}`);
  try {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error) throw error;
    if (data === false) throw new RateLimitError();
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    // Fail open on infrastructure errors so the survey stays available,
    // but record the problem.
    console.error("[rate-limit] check failed", err);
  }
}

export async function rateLimitByClient(scope: string, max: number, windowSeconds: number): Promise<void> {
  await rateLimit(scope, await clientFingerprint(), max, windowSeconds);
}
