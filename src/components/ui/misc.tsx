import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold text-navy-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed border-navy-200 bg-canvas px-6 py-12 text-center", className)}>
      {icon ? <div className="mb-3 text-navy-400">{icon}</div> : null}
      <p className="font-semibold text-navy-900">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "navy" | "emerald";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        tone === "navy" && "border-navy-800 bg-navy-900 text-white",
        tone === "emerald" && "border-emerald-200 bg-emerald-50",
        tone === "default" && "border-line bg-white shadow-card",
        className,
      )}
    >
      <p className={cn("text-xs font-semibold uppercase tracking-[0.12em]", tone === "navy" ? "text-navy-200" : "text-muted")}>{label}</p>
      <p className={cn("mt-2 font-serif text-3xl font-semibold tabular-nums", tone === "navy" ? "text-white" : "text-navy-900")}>{value}</p>
      {hint ? <p className={cn("mt-1 text-xs", tone === "navy" ? "text-navy-200" : "text-muted")}>{hint}</p> : null}
    </div>
  );
}
