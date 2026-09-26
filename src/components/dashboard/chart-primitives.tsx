"use client";

import { useId, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { Lock, Table2 } from "lucide-react";
import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { DimensionResult, GapInfo } from "@/lib/scoring/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn, formatGap } from "@/lib/utils";
import { UPGRADE_HREF } from "./chart-theme";

/* -------------------------------------------------------------------------- */
/* Responsive helper                                                           */
/* -------------------------------------------------------------------------- */

const NARROW_QUERY = "(max-width: 639px)";

function subscribeNarrow(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(NARROW_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/** True on phone-width viewports. Server snapshot is `false` (no hydration mismatch). */
export function useIsNarrow(): boolean {
  return useSyncExternalStore(
    subscribeNarrow,
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(NARROW_QUERY).matches : false),
    () => false,
  );
}

/* -------------------------------------------------------------------------- */
/* Card + data table twin                                                      */
/* -------------------------------------------------------------------------- */

export interface DataTableSpec {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

export function DataTable({ spec }: { spec: DataTableSpec }) {
  return (
    <details className="group mt-4 rounded-lg border border-line bg-canvas/60 text-sm no-print">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-navy-700 hover:text-navy-900">
        <Table2 className="h-3.5 w-3.5" aria-hidden />
        <span className="group-open:hidden">View data table</span>
        <span className="hidden group-open:inline">Hide data table</span>
      </summary>
      <div className="overflow-x-auto px-3 pb-3">
        <table className="w-full min-w-max border-collapse text-left text-xs tabular-nums">
          <caption className="sr-only">{spec.caption}</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              {spec.columns.map((c) => (
                <th key={c} scope="col" className="px-2 py-1.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, i) => (
              <tr key={i} className="border-b border-line/70 last:border-0">
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-2 py-1.5 font-medium text-navy-900">
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className="px-2 py-1.5 text-ink">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function ChartCard({
  title,
  description,
  action,
  summary,
  table,
  children,
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  /** Plain-language text alternative announced for the figure. */
  summary?: string;
  table?: DataTableSpec | null;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <Card className={cn("flex min-w-0 flex-col animate-fade-up", className)}>
      <CardHeader title={title} description={description} action={action} />
      <CardBody className="flex-1">
        <figure aria-labelledby={summary ? `${id}-summary` : undefined} className="m-0">
          {summary ? (
            <figcaption id={`${id}-summary`} className="sr-only">
              {summary}
            </figcaption>
          ) : null}
          {children}
        </figure>
        {table && table.rows.length > 0 ? <DataTable spec={table} /> : null}
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Tooltip                                                                     */
/* -------------------------------------------------------------------------- */

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

export interface TooltipSpec {
  title: string;
  subtitle?: string;
  rows: TooltipRow[];
  note?: string;
}

export function ChartTooltipBox({ title, subtitle, rows, note }: TooltipSpec) {
  return (
    <div className="min-w-44 max-w-72 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-elevated">
      <p className="font-semibold text-navy-900">{title}</p>
      {subtitle ? <p className="text-muted">{subtitle}</p> : null}
      {rows.length > 0 ? (
        <dl className="mt-1.5 space-y-1">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-muted">
                {r.color ? <span aria-hidden className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: r.color }} /> : null}
                {r.label}
              </dt>
              <dd className="font-semibold tabular-nums text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {note ? <p className="mt-1.5 border-t border-line pt-1.5 text-muted">{note}</p> : null}
    </div>
  );
}

type AnyTooltipProps = TooltipContentProps<ValueType, NameType>;

/**
 * Builds a Recharts `content` render function that reads the hovered datum and
 * renders the shared tooltip box. Called as a function (not a component).
 */
export function tooltipFor<T>(build: (datum: T, props: AnyTooltipProps) => TooltipSpec | null) {
  function render(props: AnyTooltipProps): ReactNode {
    if (!props.active || !props.payload || props.payload.length === 0) return null;
    const datum = props.payload[0]?.payload as T | undefined;
    if (!datum) return null;
    const spec = build(datum, props);
    return spec ? <ChartTooltipBox {...spec} /> : null;
  }
  return render;
}

/* -------------------------------------------------------------------------- */
/* Legend, toggles, badges, locked state                                       */
/* -------------------------------------------------------------------------- */

export function ChartLegend({
  items,
  className,
}: {
  items: { label: string; color: string; shape?: "box" | "line" | "hatch" }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted", className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.shape === "line" ? (
            <span aria-hidden className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: i.color }} />
          ) : i.shape === "hatch" ? (
            <span aria-hidden className="inline-block h-3 w-3 rounded-sm ring-1 ring-inset ring-line" style={HATCH_STYLE} />
          ) : (
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: i.color }} />
          )}
          <span>{i.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SegmentedToggle<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-canvas p-0.5">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
              selected ? "bg-white text-navy-900 shadow-sm ring-1 ring-line" : "text-muted hover:text-navy-900",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const GAP_CATEGORY_LABEL: Record<NonNullable<GapInfo["category"]>, string> = {
  aligned: "Aligned",
  notable: "Notable",
  substantial: "Substantial",
};

export function GapBadge({ gap, className }: { gap: GapInfo; className?: string }) {
  if (gap.value === null || gap.category === null) {
    return (
      <Badge tone="outline" className={className}>
        —
      </Badge>
    );
  }
  const tone =
    gap.category === "aligned" ? "neutral" : gap.direction === "decrease" ? "violet" : gap.direction === "increase" ? "amber" : "neutral";
  const dirText = gap.direction === "increase" ? "prefer more" : gap.direction === "decrease" ? "prefer less" : "no change";
  return (
    <Badge
      tone={tone}
      className={cn("tabular-nums", gap.category === "substantial" && "font-semibold", className)}
      title={`${GAP_CATEGORY_LABEL[gap.category]} gap — employees ${dirText}`}
    >
      {formatGap(gap.value)}
      <span className="font-normal opacity-80">· {GAP_CATEGORY_LABEL[gap.category]}</span>
    </Badge>
  );
}

export function LockedState({
  title,
  description,
  planName,
  className,
}: {
  title: string;
  description: string;
  planName: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed border-navy-200 bg-canvas px-6 py-10 text-center", className)}>
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-500 ring-1 ring-line">
        <Lock className="h-4 w-4" aria-hidden />
      </span>
      <p className="font-semibold text-navy-900">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      <Link
        href={UPGRADE_HREF}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
      >
        Available on {planName} — view plans
      </Link>
    </div>
  );
}

/** Inline hatch pattern for "hidden for privacy" cells and swatches. */
export const HATCH_STYLE = {
  backgroundImage: "repeating-linear-gradient(135deg, #eef1f5 0 6px, #dfe4ec 6px 8px)",
} as const;

/** Code → name key shown under charts that abbreviate dimension names on phones. */
export function DimensionKey({ dimensions }: { dimensions: Pick<DimensionResult, "code" | "name">[] }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted">
      {dimensions.map((d) => (
        <div key={d.code} className="flex gap-1.5">
          <dt className="font-semibold text-navy-800">{d.code}</dt>
          <dd className="truncate">{d.name}</dd>
        </div>
      ))}
    </dl>
  );
}
