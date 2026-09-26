import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "navy" | "emerald" | "amber" | "red" | "violet" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-navy-50 text-navy-700 ring-navy-100",
  navy: "bg-navy-900 text-white ring-navy-900",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  outline: "bg-white text-navy-700 ring-line",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}
      {...props}
    />
  );
}
