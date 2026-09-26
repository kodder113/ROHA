import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Container, Eyebrow } from "./section";

export const LEGAL_LAST_UPDATED = "September 26, 2026";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Shared layout for the Privacy Policy and Terms of Service. */
export function LegalDocument({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <section className="border-b border-line bg-canvas">
        <Container className="py-16 sm:py-20">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold text-navy-900 sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm text-muted">
            Last updated: <time dateTime="2026-09-26">{LEGAL_LAST_UPDATED}</time>
          </p>
          <Alert tone="warning" className="mt-8 max-w-3xl" title="Template notice">
            This document is a template prepared for Rodrik Consulting LLC and should be reviewed by qualified legal counsel before publication.
          </Alert>
        </Container>
      </section>

      <Container className="py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-16">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">On this page</p>
            <ol className="mt-4 space-y-2 border-l border-line text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-4 text-muted hover:border-emerald-500 hover:text-navy-900">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 max-w-3xl text-[15px] leading-relaxed text-ink [&_a]:font-medium [&_a]:text-navy-900 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-emerald-700 [&_h3]:mt-6 [&_h3]:font-sans [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-navy-900 [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-navy-900 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:marker:text-emerald-600">
            <div className="text-base text-muted">{intro}</div>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24 border-t border-line pt-10 mt-10 first-of-type:mt-12">
                <h2 id={`${s.id}-title`} className="text-2xl font-semibold text-navy-900">
                  {i + 1}. {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </Container>
    </>
  );
}
