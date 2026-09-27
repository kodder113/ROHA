import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SETTINGS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ROHA_TOKEN_SECRET",
  "CRON_SECRET",
  "ROHA_PLATFORM_ADMIN_EMAILS",
  "ANTHROPIC_API_KEY",
] as const;

/**
 * Deployment check: reports which settings are present (true/false) and the
 * deployment environment. Never returns any value.
 */
export function GET() {
  const configured = Object.fromEntries(SETTINGS.map((name) => [name, Boolean(process.env[name]?.trim())]));
  const supabaseKeyAlias = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim());
  if (supabaseKeyAlias) configured.NEXT_PUBLIC_SUPABASE_ANON_KEY = true;
  return NextResponse.json(
    {
      status: Object.values(configured).every(Boolean) ? "ok" : "incomplete",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      configured,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
