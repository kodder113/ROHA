import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Horizontally scrollable, dense data table container. */
export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-line bg-white shadow-card", className)}>
      <table className="min-w-full divide-y divide-line text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-navy-50/70">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn("whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted", className)}
      {...props}
    />
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-2.5 align-top text-ink", className)} {...props} />;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Reads a single string search param. */
export function param(sp: SearchParamsRecord, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export function pageFrom(sp: SearchParamsRecord): number {
  const n = Number.parseInt(param(sp, "page"), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 1;
}

export function hrefWith(path: string, sp: SearchParamsRecord, overrides: Record<string, string | number | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const value = Array.isArray(v) ? v[0] : v;
    if (value) q.set(k, value);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null || v === "") q.delete(k);
    else q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export function Pagination({
  path,
  searchParams,
  page,
  pageSize,
  total,
}: {
  path: string;
  searchParams: SearchParamsRecord;
  page: number;
  pageSize: number;
  total: number | null;
}) {
  const totalPages = total === null ? null : Math.max(1, Math.ceil(total / pageSize));
  const hasNext = totalPages === null ? false : page < totalPages;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === null ? page * pageSize : Math.min(total, page * pageSize);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p>
        {total === null ? null : (
          <>
            Showing <span className="font-medium text-navy-900">{from.toLocaleString("en-US")}</span>–
            <span className="font-medium text-navy-900">{to.toLocaleString("en-US")}</span> of{" "}
            <span className="font-medium text-navy-900">{total.toLocaleString("en-US")}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefWith(path, searchParams, { page: page - 1 === 1 ? null : page - 1 })} className={buttonClasses("outline", "sm")}>
            <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
          </Link>
        ) : null}
        {totalPages ? (
          <span className="text-xs">
            Page {page} of {totalPages}
          </span>
        ) : null}
        {hasNext ? (
          <Link href={hrefWith(path, searchParams, { page: page + 1 })} className={buttonClasses("outline", "sm")}>
            Next <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** GET form for filters; submits to the current page. */
export function FilterBar({ children, resetHref }: { children: ReactNode; resetHref: string }) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4 shadow-card">
      {children}
      <div className="flex gap-2">
        <button type="submit" className={buttonClasses("secondary", "md")}>
          Apply
        </button>
        <Link href={resetHref} className={buttonClasses("ghost", "md")}>
          Reset
        </Link>
      </div>
    </form>
  );
}

export function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex min-w-[10rem] flex-col gap-1 text-xs font-medium text-muted", className)}>
      {label}
      {children}
    </label>
  );
}

type Tone = ComponentProps<typeof Badge>["tone"];

const STATUS_TONES: Record<string, Tone> = {
  active: "emerald",
  published: "emerald",
  open: "emerald",
  completed: "emerald",
  responded: "emerald",
  trialing: "violet",
  draft: "amber",
  pending: "amber",
  running: "amber",
  new: "amber",
  invited: "amber",
  past_due: "amber",
  incomplete: "amber",
  warn: "amber",
  suspended: "red",
  failed: "red",
  error: "red",
  fatal: "red",
  canceled: "neutral",
  expired: "neutral",
  retired: "neutral",
  closed: "neutral",
  archived: "neutral",
  disabled: "neutral",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "outline"} className={cn("capitalize", className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-navy-900">{children}</h2>
      {action}
    </div>
  );
}

/** Monospace short id with full value as a tooltip. */
export function ShortId({ id }: { id: string }) {
  return (
    <span className="font-mono text-xs text-muted" title={id}>
      {id.length > 12 ? `${id.slice(0, 8)}…` : id}
    </span>
  );
}
