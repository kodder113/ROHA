import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

type SectionTone = "white" | "canvas" | "navy";

export function Section({
  tone = "white",
  className,
  containerClassName,
  children,
  ...props
}: ComponentProps<"section"> & { tone?: SectionTone; containerClassName?: string }) {
  return (
    <section
      className={cn(
        "py-20 sm:py-24",
        tone === "canvas" && "bg-canvas",
        tone === "navy" && "bg-navy-900 text-white",
        className,
      )}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, inverted = false, className }: { children: ReactNode; inverted?: boolean; className?: string }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.18em]",
        inverted ? "text-emerald-300" : "text-emerald-700",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverted = false,
  id,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  inverted?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow inverted={inverted}>{eyebrow}</Eyebrow> : null}
      <h2
        id={id}
        className={cn(
          "mt-3 text-3xl font-semibold leading-tight sm:text-4xl",
          inverted ? "text-white" : "text-navy-900",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", inverted ? "text-navy-200" : "text-muted")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Navy hero used at the top of interior marketing pages. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      <HeroBackdrop />
      <Container className="relative py-20 sm:py-24">
        <div className="max-w-3xl animate-fade-up">
          <Eyebrow inverted>{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] sm:text-5xl">{title}</h1>
          {description ? <p className="mt-6 text-lg leading-relaxed text-navy-200">{description}</p> : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}

/** Subtle dot-grid pattern and emerald glow for navy sections. */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-48 -left-24 h-[24rem] w-[24rem] rounded-full bg-navy-500/20 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="roha-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="1.1" fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#roha-grid)" />
      </svg>
    </div>
  );
}

/** Numbered or iconed feature card used across marketing pages. */
export function FeatureCard({
  icon,
  title,
  children,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-line bg-white p-6 shadow-card", className)}>
      {icon ? (
        <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-emerald-400">{icon}</div>
      ) : null}
      <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}
