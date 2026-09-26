import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { darkOutlineButton } from "./buttons";
import { Container, Eyebrow, HeroBackdrop } from "./section";

export function CtaBand({
  eyebrow = "Begin with clarity",
  title = "Hear what your organization has been trying to tell you.",
  description = "Set up a confidential ROHA assessment in minutes. ROHA Discover is free and requires no payment card—so your first look at organizational health carries no financial commitment.",
  primary = { href: "/get-started", label: "Start Your Free Assessment" },
  secondary = { href: "/contact", label: "Talk with Rodrik Consulting" },
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string } | null;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      <HeroBackdrop />
      <Container className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow inverted>{eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
          <p className="mt-5 text-lg leading-relaxed text-navy-200">{description}</p>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <ButtonLink href={primary.href} size="lg">
              {primary.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            {secondary ? (
              <Link href={secondary.href} className={darkOutlineButton("lg")}>
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
