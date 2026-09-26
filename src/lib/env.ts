/**
 * Centralized environment access. Secrets are only ever read on the server;
 * values prefixed NEXT_PUBLIC_ are safe to expose to the browser.
 */

export class ConfigurationError extends Error {
  constructor(public readonly variable: string, purpose: string) {
    super(`${variable} is not configured. ${purpose}`);
    this.name = "ConfigurationError";
  }
}

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function required(name: string, purpose: string): string {
  const value = read(name);
  if (!value) throw new ConfigurationError(name, purpose);
  return value;
}

export const publicEnv = {
  supabaseUrl: () =>
    required("NEXT_PUBLIC_SUPABASE_URL", "Set it to your Supabase project URL (Project Settings → API)."),
  supabaseAnonKey: () =>
    read("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Set it to your Supabase anon/publishable key."),
  appUrl: () => (read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000").replace(/\/$/, ""),
};

export const serverEnv = {
  supabaseServiceRoleKey: () =>
    required("SUPABASE_SERVICE_ROLE_KEY", "The server needs the Supabase service-role key to process surveys and aggregates."),
  tokenSecret: () =>
    required("ROHA_TOKEN_SECRET", "Generate a random 32+ character secret (e.g. `openssl rand -hex 32`)."),
  anthropicApiKey: () => read("ANTHROPIC_API_KEY"),
  anthropicModel: () => read("ROHA_AI_MODEL") ?? "claude-opus-5",
  stripeSecretKey: () => read("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => read("STRIPE_WEBHOOK_SECRET"),
  cronSecret: () => read("CRON_SECRET"),
  /** Comma-separated emails that are promoted to Rodrik Consulting super-admins on sign-in. */
  platformAdminEmails: () =>
    (read("ROHA_PLATFORM_ADMIN_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
};

export const integrations = {
  supabase: () => Boolean(read("NEXT_PUBLIC_SUPABASE_URL") && (read("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"))),
  supabaseAdmin: () => Boolean(read("SUPABASE_SERVICE_ROLE_KEY")),
  anthropic: () => Boolean(read("ANTHROPIC_API_KEY")),
  stripe: () => Boolean(read("STRIPE_SECRET_KEY")),
  stripeWebhooks: () => Boolean(read("STRIPE_SECRET_KEY") && read("STRIPE_WEBHOOK_SECRET")),
};
