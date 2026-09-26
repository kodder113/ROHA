import type { PublicPlan } from "@/lib/content/public";
import { formatCurrency } from "@/lib/utils";

export function planPrice(plan: PublicPlan): { amount: string; suffix: string | null } {
  switch (plan.billingInterval) {
    case "free":
      return { amount: "Free", suffix: null };
    case "one_time":
      return { amount: formatCurrency(plan.priceCents, plan.currency), suffix: "per assessment" };
    case "month":
      return { amount: formatCurrency(plan.priceCents, plan.currency), suffix: "per month" };
    default:
      return { amount: "Custom", suffix: "consulting engagement" };
  }
}

export function planCta(plan: PublicPlan): { href: string; label: string } {
  if (plan.billingInterval === "custom" || plan.features.consulting) {
    return { href: "/contact?topic=strategic", label: "Contact Rodrik Consulting" };
  }
  if (plan.billingInterval === "free") {
    return { href: "/get-started", label: "Start free" };
  }
  return { href: `/get-started?plan=${encodeURIComponent(plan.key)}`, label: "Get started" };
}

export function formatLimit(value: number | null, plan: PublicPlan, unit?: string): string {
  if (value === null) return plan.billingInterval === "custom" ? "Tailored" : "Unlimited";
  const n = value.toLocaleString("en-US");
  return unit ? `${n} ${unit}` : n;
}
