"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { RohaLogo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { switchOrganization } from "@/app/app/org-actions";

type Role = "owner" | "admin" | "viewer";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; roles?: Role[]; exact?: boolean }[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/campaigns/new", label: "Create assessment", icon: PlusCircle, roles: ["owner", "admin"], exact: true },
  { href: "/app/campaigns", label: "Assessments", icon: ClipboardList },
  { href: "/app/results", label: "Health results", icon: BarChart3 },
  { href: "/app/history", label: "Historical trends", icon: History },
  { href: "/app/reports", label: "Executive reports", icon: FileText },
  { href: "/app/settings", label: "Organization settings", icon: Settings },
];

export function AppShell({
  children,
  user,
  org,
  role,
  memberships,
  planName,
  isPlatformAdmin,
}: {
  children: React.ReactNode;
  user: { email: string; name: string | null };
  org: { id: string; name: string; isDemo: boolean; isPilot: boolean };
  role: Role;
  memberships: { id: string; name: string; role: Role }[];
  planName: string | null;
  isPlatformAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(`${href}/`) && !(href === "/app/campaigns" && pathname === "/app/campaigns/new"));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <RohaLogo href="/app" inverted />
        <button className="text-navy-200 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-4 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Building2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <span className="truncate" title={org.name}>
            {org.name}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {planName ? <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-300">{planName}</span> : null}
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] capitalize text-navy-100">{role}</span>
          {org.isPilot ? <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[11px] text-amber-200">Pilot</span> : null}
        </div>
        {memberships.length > 1 ? (
          <form action={switchOrganization} className="mt-3">
            <label className="sr-only" htmlFor="org-switch">
              Switch organization
            </label>
            <select
              id="org-switch"
              name="orgId"
              defaultValue={org.id}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="w-full rounded-md border border-white/15 bg-navy-800 px-2 py-1.5 text-xs text-white"
            >
              {memberships.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </form>
        ) : null}
      </div>
      <nav className="mt-5 flex-1 space-y-0.5 px-3" aria-label="Main">
        {NAV.filter((n) => !n.roles || n.roles.includes(role)).map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-white/10 font-medium text-white" : "text-navy-200 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className={cn("h-4 w-4", active ? "text-emerald-400" : "text-navy-300")} aria-hidden />
              {item.label}
            </Link>
          );
        })}
        {isPlatformAdmin ? (
          <Link
            href="/admin"
            className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-500/30 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Platform administration
          </Link>
        ) : null}
      </nav>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="truncate text-sm font-medium text-white">{user.name ?? user.email}</p>
        {user.name ? <p className="truncate text-xs text-navy-300">{user.email}</p> : null}
        <form action={signOut} className="mt-3">
          <button type="submit" className="flex items-center gap-2 text-xs text-navy-200 hover:text-white">
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-900 lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 bg-navy-900 shadow-elevated">{sidebar}</aside>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open navigation" className="rounded-md p-1.5 text-navy-800 hover:bg-navy-50">
            <Menu className="h-5 w-5" />
          </button>
          <RohaLogo href="/app" />
        </header>
        {org.isDemo ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
            Demonstration workspace — all results are synthetic, computer-generated data.
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={role === "owner" ? "navy" : role === "admin" ? "emerald" : "neutral"}>{role}</Badge>;
}
