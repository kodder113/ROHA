import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formats a 0–100 index with one decimal, or an em dash when unavailable. */
export function formatScore(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

/** Formats a gap with an explicit sign. */
export function formatGap(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return (0).toFixed(digits);
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(digits)}`;
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatCurrency(cents: number | null | undefined, currency = "usd"): string {
  if (cents === null || cents === undefined) return "Custom";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? singular : plural}`;
}
