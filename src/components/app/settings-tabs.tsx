"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app/settings", label: "Organization" },
  { href: "/app/settings/team", label: "Team & roles" },
  { href: "/app/settings/billing", label: "Plan & billing" },
  { href: "/app/settings/data", label: "Data & privacy" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" aria-label="Settings">
      <ul className="flex min-w-max gap-6">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-block border-b-2 py-3 text-sm font-medium transition-colors",
                  active ? "border-emerald-600 text-navy-900" : "border-transparent text-muted hover:text-navy-900",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
