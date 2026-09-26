import Link from "next/link";
import { Check } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import type { PublicPlan } from "@/lib/content/public";
import { cn } from "@/lib/utils";
import { formatLimit, planCta, planPrice } from "./plan-utils";

export function PlanCard({ plan, featured = false, compact = false }: { plan: PublicPlan; featured?: boolean; compact?: boolean }) {
  const price = planPrice(plan);
  const cta = planCta(plan);
  const bullets = compact ? plan.bullets.slice(0, 3) : plan.bullets;
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border p-6 sm:p-7",
        featured ? "border-navy-900 bg-navy-900 text-white shadow-elevated" : "border-line bg-white shadow-card",
      )}
      aria-labelledby={`plan-${plan.key}`}
    >
      {featured ? (
        <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-950">
          Full executive reporting
        </span>
      ) : null}
      <h3 id={`plan-${plan.key}`} className={cn("text-xl font-semibold", featured ? "text-white" : "text-navy-900")}>
        {plan.name}
      </h3>
      {plan.description ? (
        <p className={cn("mt-2 text-sm leading-relaxed", featured ? "text-navy-200" : "text-muted")}>{plan.description}</p>
      ) : null}
      <p className="mt-6 flex items-baseline gap-2">
        <span className={cn("font-serif text-4xl font-semibold tabular-nums", featured ? "text-white" : "text-navy-900")}>{price.amount}</span>
        {price.suffix ? <span className={cn("text-sm", featured ? "text-navy-200" : "text-muted")}>{price.suffix}</span> : null}
      </p>
      {!compact ? (
        <p className={cn("mt-2 text-xs font-medium uppercase tracking-[0.12em]", featured ? "text-emerald-300" : "text-emerald-700")}>
          {plan.maxResponsesPerCampaign === null
            ? plan.billingInterval === "custom"
              ? "Response volume scoped to your engagement"
              : "Unlimited responses per campaign"
            : `Up to ${formatLimit(plan.maxResponsesPerCampaign, plan)} responses per campaign`}
        </p>
      ) : null}
      <ul className="mt-6 flex-1 space-y-3">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2.5 text-sm">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", featured ? "text-emerald-400" : "text-emerald-600")} aria-hidden />
            <span className={featured ? "text-navy-100" : "text-ink"}>{b}</span>
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        className={cn(
          "mt-8",
          featured ? buttonClasses("primary", "md", "w-full") : buttonClasses(plan.billingInterval === "custom" ? "outline" : "secondary", "md", "w-full"),
        )}
      >
        {cta.label}
        <span className="sr-only"> — {plan.name}</span>
      </Link>
    </article>
  );
}
