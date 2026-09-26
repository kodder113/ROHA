import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { publicEnv, serverEnv } from "@/lib/env";

let cached: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role client. Bypasses Row Level Security, so it must only be used on
 * the server AFTER the caller's permissions have been verified, or for public
 * flows that are validated inside SECURITY DEFINER functions (survey submission).
 * Never import this module from client components.
 */
export function createAdminClient() {
  if (!cached) {
    cached = createClient<Database>(publicEnv.supabaseUrl(), serverEnv.supabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export type AdminSupabase = ReturnType<typeof createAdminClient>;
