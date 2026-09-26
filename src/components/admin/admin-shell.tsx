"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  AlertOctagon,
  ArrowLeft,
  Bot,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  Layers,
  Menu,
  Megaphone,
  ScrollText,
  ShieldCheck,
  Tags,
  X,
} from "lucide-react";
import { RohaMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV: { group: string; items: { href: string; label: string; icon: typeof Gauge }[] }[] = [
  {
    group: "Platform",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/organizations", label: "Organizations", icon: Building2 },
      { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/admin/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    group: "Commercial",
    items: [
      { href: "/admin/plans", label: "Plans & pricing", icon: Tags },
      { href: "/admin/billing", label: "Billing", icon: CreditCard },
      { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
    ],
  },
  {
    group: "Methodology",
    items: [
      { href: "/admin/assessments", label: "Assessment versions", icon: ClipboardList },
      { href: "/admin/scoring", label: "Scoring rules", icon: Layers },
      { href: "/admin/ai", label: "AI reporting", icon: Bot },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/admin/errors", label: "Error log", icon: AlertOctagon },
      { href: "/admin/audit", label: "Audit trail", icon: ScrollText },
      { href: "/admin/team", label: "Platform admins", icon: ShieldCheck },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ email, children }: { email: string | null; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Platform administration" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV.map((group) => (
        <div key={group.group}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">{group.group}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active ? "bg-white/10 font-medium text-white" : "text-navy-200 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-emerald-400" : "text-navy-300")} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5">
      <RohaMark inverted className="h-7 w-7" />
      <div className="leading-tight">
        <p className="font-serif text-base font-bold tracking-[0.1em] text-white">ROHA</p>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-navy-300">Rodrik Consulting · Platform Administration</p>
      </div>
    </div>
  );

  const footer = (
    <div className="border-t border-white/10 px-4 py-4 text-xs">
      <Link href="/app" className="inline-flex items-center gap-1.5 font-medium text-emerald-300 hover:text-emerald-200">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to the ROHA app
      </Link>
      {email ? <p className="mt-2 truncate text-navy-300" title={email}>Signed in as {email}</p> : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-navy-950 lg:flex">
        <div className="border-b border-white/10 px-5 py-5">{brand}</div>
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy-950 px-4 py-3 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          className="rounded-lg p-2 text-white hover:bg-white/10"
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          <span className="sr-only">{open ? "Close navigation" : "Open navigation"}</span>
        </button>
      </header>
      {open ? (
        <div id="admin-mobile-nav" className="fixed inset-x-0 bottom-0 top-[60px] z-20 flex flex-col bg-navy-950 lg:hidden">
          {nav}
          {footer}
        </div>
      ) : null}

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
