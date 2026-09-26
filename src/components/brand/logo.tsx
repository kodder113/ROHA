import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ROHA mark: an open ring (the organization as a whole, assessed continuously)
 * around an emerald core (organizational health), with an emerald point in the
 * opening. Deliberately abstract: it does not depict a number of dimensions, so
 * it stays valid across assessment versions.
 */
export function RohaMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const ring = inverted ? "#ffffff" : "#0a1a36";
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden>
      <path d="M34.1 25.13 A15 15 0 1 1 31.49 10.36" fill="none" stroke={ring} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="34.77" cy="17.4" r="2.2" fill="#10b981" />
      <circle cx="20" cy="20" r="6.5" fill="#10b981" />
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
