import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, GraduationCap, X } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { Eyebrow, PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description: `About ROHA and ${BRAND.company}, founded by ${BRAND.founder}. Our mission, our independence, and what ROHA is—and is not.`,
};

const is = [
  "A structured way to gather employee perceptions across six dimensions of organizational health.",
  "A confidential channel that helps leaders hear candid perspectives they may not otherwise receive.",
  "A consistent, versioned measure that allows organizations to compare perceptions over time.",
  "A starting point for informed leadership conversations and deliberate action.",
];

const isNot = [
  "A clinical, diagnostic or psychometric instrument.",
  "A scientifically validated measure, or a benchmark against other organizations.",
  "A predictor of productivity, retention, financial performance or any other business outcome.",
  "A tool for evaluating, identifying or monitoring individual employees.",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Organizational intelligence, grounded in strategic leadership."
        description={`ROHA—the ${BRAND.productFull}—is developed, owned and operated by ${BRAND.company}. It exists to help leaders understand their organizations through the perspectives of the people who work in them.`}
      />

      <Section aria-labelledby="mission-heading">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <SectionHeading id="mission-heading" eyebrow="Our mission" title="Help leaders see their organizations clearly—and lead them well." />
          <div className="space-y-5 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              Every organization holds knowledge that never reaches its leadership: how decisions are really experienced, where processes
              quietly fail, what people believe the organization could become. That knowledge is one of the most valuable—and most
              underused—strategic assets a leader has.
            </p>
            <p>
              ROHA was built to surface it responsibly. We combine a transparent assessment framework, deterministic scoring and carefully
              constrained AI analysis with privacy protections strong enough that employees can answer candidly.
            </p>
            <p className="font-serif text-xl leading-snug text-navy-900 sm:text-2xl">{BRAND.tagline}</p>
          </div>
        </div>
      </Section>

      <Section tone="canvas" aria-labelledby="founder-heading">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
          <div className="rounded-2xl bg-navy-900 p-8 text-white">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-navy-800 text-emerald-400">
              <GraduationCap className="h-7 w-7" aria-hidden />
            </span>
            <p className="mt-6 font-serif text-2xl font-semibold leading-tight">{BRAND.founder}</p>
            <p className="mt-2 text-sm text-navy-200">Founder, {BRAND.company}</p>
            <dl className="mt-8 space-y-4 border-t border-navy-700 pt-6 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-300">Credential</dt>
                <dd className="mt-1 text-white">{BRAND.founderCredential}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-300">Focus</dt>
                <dd className="mt-1 text-white">Strategic leadership and organizational development</dd>
              </div>
            </dl>
          </div>
          <div>
            <Eyebrow>Our founder</Eyebrow>
            <h2 id="founder-heading" className="mt-3 text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
              {BRAND.founderName}
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-muted">
              <p>
                {BRAND.founder} is the founder of {BRAND.company}. Dr. Rodriguez holds a {BRAND.founderCredential} and focuses on strategic
                leadership and organizational development.
              </p>
              <p>
                ROHA reflects that focus. It is designed around the questions leaders actually need answered—where the organization is strong,
                where experience falls short of aspiration, and where attention will matter most—and it treats employees&rsquo; perspectives
                as evidence worthy of serious, careful analysis.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="company-heading">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <SectionHeading
            id="company-heading"
            eyebrow={BRAND.company}
            title="The consulting practice behind the platform."
          />
          <div className="space-y-5 text-base leading-relaxed text-muted">
            <p>
              {BRAND.company} owns and operates ROHA, including its hosting, security and support. For organizations that want more than
              software, Rodrik Consulting offers ROHA Strategic: an engagement that pairs the assessment with professional organizational
              diagnosis, executive interviews, strategic recommendations and a transformation roadmap.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2 text-sm">
              <a href={BRAND.companyUrl} className="inline-flex items-center gap-1.5 font-semibold text-navy-900 hover:text-emerald-700">
                Learn more at rodrikconsulting.com
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
              <Link href="/contact?topic=strategic" className="inline-flex items-center gap-1.5 font-semibold text-navy-900 hover:text-emerald-700">
                Discuss a ROHA Strategic engagement →
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="canvas" aria-labelledby="scope-heading">
        <SectionHeading
          id="scope-heading"
          eyebrow="Clarity about scope"
          title="What ROHA is—and what it is not."
          description="Responsible use begins with an accurate understanding of the instrument. ROHA scores describe the perceptions of the employees who responded; they are valuable precisely because they are honest about what they represent."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
            <h3 className="text-xl font-semibold text-navy-900">ROHA is</h3>
            <ul className="mt-5 space-y-4">
              {is.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
            <h3 className="text-xl font-semibold text-navy-900">ROHA is not</h3>
            <ul className="mt-5 space-y-4">
              {isNot.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="independence-heading">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Independence</Eyebrow>
          <h2 id="independence-heading" className="mt-3 text-3xl font-semibold text-navy-900">
            Independently developed.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">{BRAND.independenceStatement}</p>
        </div>
      </Section>

      <CtaBand secondary={{ href: "/contact", label: "Contact us" }} />
    </>
  );
}
