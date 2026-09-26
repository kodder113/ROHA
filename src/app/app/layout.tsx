import type { Metadata } from "next";
import { requireOrgContext } from "@/lib/auth/session";
import { loadEntitlements } from "@/lib/org/entitlements";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · ROHA" }, robots: { index: false } };

export default async function OrgAppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext();
  const entitlements = await loadEntitlements(ctx.org.id);
  return (
    <AppShell
      user={{ email: ctx.user.email ?? "", name: (ctx.user.user_metadata?.full_name as string | undefined) ?? null }}
      org={{ id: ctx.org.id, name: ctx.org.name, isDemo: ctx.org.is_demo, isPilot: ctx.org.is_pilot }}
      role={ctx.role}
      memberships={ctx.memberships.map((m) => ({ id: m.org.id, name: m.org.name, role: m.role }))}
      planName={entitlements.planName}
      isPlatformAdmin={ctx.isPlatformAdmin}
    >
      {children}
    </AppShell>
  );
}
