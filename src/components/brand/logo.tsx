import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ROHA mark: six segments arranged as a hexagon (the six dimensions),
 * with an emerald core representing organizational health.
 */
export function RohaMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const seg = inverted ? "#ffffff" : "#0a1a36";
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden>
      <g fill="none" strokeWidth="3.2" strokeLinecap="round">
        <path d="M20 3.5 L34.3 11.75" stroke={seg} />
        <path d="M34.3 14.5 L34.3 25.5" stroke={seg} opacity="0.85" />
        <path d="M34.3 28.25 L20 36.5" stroke={seg} opacity="0.7" />
        <path d="M20 36.5 L5.7 28.25" stroke="#10b981" />
        <path d="M5.7 25.5 L5.7 14.5" stroke={seg} opacity="0.85" />
        <path d="M5.7 11.75 L20 3.5" stroke={seg} opacity="0.7" />
      </g>
      <circle cx="20" cy="20" r="6" fill="#10b981" />
      <circle cx="20" cy="20" r="2.4" fill={inverted ? "#0a1a36" : "#ffffff"} />
    </svg>
  );
}

export function RohaLogo({
  href = "/",
  inverted = false,
  showTagline = false,
  className,
}: {
  href?: string | null;
  inverted?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <RohaMark inverted={inverted} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-serif text-xl font-bold tracking-[0.12em]", inverted ? "text-white" : "text-navy-900")}>ROHA</span>
        {showTagline ? (
          <span className={cn("mt-1 text-[10px] font-medium uppercase tracking-[0.14em]", inverted ? "text-navy-200" : "text-muted")}>
            Rodrik Organizational Health Assessment
          </span>
        ) : null}
      </span>
    </span>
  );
  if (!href) return content;
  return (
    <Link href={href} aria-label="ROHA home" className="rounded-md">
      {content}
    </Link>
  );
}
