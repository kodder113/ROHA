"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import { RohaLogo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "./nav";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // Close the mobile menu with Escape and lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-navy-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <RohaLogo />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active ? "text-navy-900" : "text-muted hover:text-navy-900",
                    )}
                  >
                    <span className={cn("border-b-2 pb-1", active ? "border-emerald-500" : "border-transparent")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/sign-in" className={buttonClasses("ghost", "md")}>
            Sign In
          </Link>
          <Link href="/get-started" className={buttonClasses("primary", "md")}>
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-50 lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <div
        id={menuId}
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-line bg-white lg:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <ul className="divide-y divide-line">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between py-4 font-serif text-lg",
                      active ? "text-emerald-700" : "text-navy-900",
                    )}
                  >
                    {item.label}
                    <span aria-hidden className="text-navy-300">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 grid gap-3">
            <Link href="/get-started" onClick={() => setOpen(false)} className={buttonClasses("primary", "lg", "w-full")}>
              Get Started
            </Link>
            <Link href="/sign-in" onClick={() => setOpen(false)} className={buttonClasses("outline", "lg", "w-full")}>
              Sign In
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
