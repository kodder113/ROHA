"use client";

import Link from "next/link";
import { Filter, Lock } from "lucide-react";
import type { SegmentAttribute } from "@/lib/results/segments";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { UPGRADE_HREF } from "./chart-theme";
import { attributeLabel, availableAttributes, suppressionText, type Segments } from "./segment-utils";

export type ViewBy = "organization" | SegmentAttribute;

export interface SegmentSelection {
  viewBy: ViewBy;
  groupKey: string | null;
}

/** Selection to apply when the "View by" attribute changes: first visible group. */
export function selectionFor(segments: Segments, viewBy: ViewBy): SegmentSelection {
  if (viewBy === "organization") return { viewBy, groupKey: null };
  const first = segments[viewBy]?.segments.find((s) => s.visible && s.result);
  return { viewBy, groupKey: first?.key ?? null };
}

export function SegmentFilter({
  segments,
  minGroupSize,
  enabled,
  value,
  onChange,
  className,
}: {
  segments: Segments;
  minGroupSize: number;
  /** features.segment_comparisons */
  enabled: boolean;
  value: SegmentSelection;
  onChange: (next: SegmentSelection) => void;
  className?: string;
}) {
  const attributes = availableAttributes(segments);
  const analysis = value.viewBy === "organization" ? undefined : segments[value.viewBy];
  const disabled = !enabled || attributes.length === 0;

  return (
    <section
      aria-label="Filter results"
      className={cn("rounded-xl border border-line bg-white/95 px-4 py-3 shadow-card backdrop-blur no-print", className)}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy-900 md:pb-2">
          <Filter className="h-4 w-4 text-muted" aria-hidden />
          Filter
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 md:max-w-2xl">
          <div>
            <label htmlFor="view-by" className="mb-1 block text-xs font-medium text-muted">
              View by
            </label>
            <Select
              id="view-by"
              value={value.viewBy}
              disabled={disabled}
              onChange={(e) => onChange(selectionFor(segments, e.target.value as ViewBy))}
            >
              <option value="organization">Organization</option>
              {attributes.map((a) => (
                <option key={a} value={a}>
                  {attributeLabel(a)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="view-group" className="mb-1 block text-xs font-medium text-muted">
              Group
            </label>
            <Select
              id="view-group"
              value={value.groupKey ?? ""}
              disabled={disabled || !analysis}
              onChange={(e) => onChange({ viewBy: value.viewBy, groupKey: e.target.value || null })}
            >
              {!analysis ? <option value="">All employees</option> : null}
              {analysis && !analysis.segments.some((s) => s.visible && s.result) ? (
                <option value="">No groups can be shown</option>
              ) : null}
              {analysis?.segments.map((s) =>
                s.visible && s.result ? (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ) : (
                  <option key={s.key} value={`__hidden__${s.key}`} disabled>
                    {s.label} — {suppressionText(s)}
                  </option>
                ),
              )}
            </Select>
          </div>
        </div>
      </div>
      {!enabled ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-navy-800">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          <span>
            Departmental comparisons are available on ROHA Professional and above.{" "}
            <Link href={UPGRADE_HREF} className="font-medium text-emerald-700 underline-offset-4 hover:underline">
              View plans
            </Link>
          </span>
        </p>
      ) : attributes.length === 0 ? (
        <p className="mt-3 text-xs text-muted">This assessment did not include demographic questions, so results are shown for the whole organization.</p>
      ) : null}
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Only one attribute can be filtered at a time, and groups with fewer than {minGroupSize} valid responses are hidden to protect
        confidentiality.
      </p>
    </section>
  );
}
