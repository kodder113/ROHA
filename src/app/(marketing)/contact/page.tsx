import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Briefcase, LifeBuoy, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { isContactTopic } from "@/components/marketing/contact-shared";
import { PageHero, Section } from "@/components/marketing/section";
import { BRAND } from "@/lib/brand";
import { submitContactInquiry } from "./actions";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${BRAND.company} about ROHA—pricing, ROHA Strategic consulting engagements, privacy questions or product support.`,
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const rawTopic = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  const defaultTopic = isContactTopic(rawTopic) ? rawTopic : "general";

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Start a conversation."
        description={`Whether you are evaluating ROHA, planning a consulting engagement, or have a question about privacy, the ${BRAND.company} team will be glad to hear from you.`}
      />

      <Section aria-label="Contact form">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
            <h2 className="text-2xl font-semibold text-navy-900">Send us a message</h2>
            <p className="mt-2 text-sm text-muted">We typically reply by email. Fields marked with an asterisk are required.</p>
            <div className="mt-8">
              <ContactForm action={submitContactInquiry} defaultTopic={defaultTopic} />
            </div>
          </div>

          <aside className="space-y-5" aria-label="Other ways to reach us">
            <div className="rounded-2xl bg-navy-900 p-6 text-white sm:p-8">
              <Briefcase className="h-5 w-5 text-emerald-400" aria-hidden />
              <h2 className="mt-4 font-sans text-lg font-semibold">ROHA Strategic engagements</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-200">
                For a consulting engagement that combines ROHA with organizational diagnosis, executive interviews and a transformation roadmap,
                choose &ldquo;ROHA Strategic consulting&rdquo; as your topic.
              </p>
              <a href={BRAND.companyUrl} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 hover:text-emerald-200">
                Visit rodrikconsulting.com
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
              <h2 className="mt-4 font-sans text-base font-semibold text-navy-900">Privacy requests</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Select &ldquo;Privacy and data protection&rdquo; to ask about our data practices or to make a privacy request. Our{" "}
                <Link href="/privacy" className="font-medium text-navy-900 underline underline-offset-4">
                  Privacy Policy
                </Link>{" "}
                explains what we collect and why.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <LifeBuoy className="h-5 w-5 text-emerald-600" aria-hidden />
              <h2 className="mt-4 font-sans text-base font-semibold text-navy-900">Participating in a survey?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                If your employer invited you to a ROHA assessment, please direct questions about the campaign to your organization. We cannot
                look up, change or remove individual responses, because ROHA does not link responses to identities.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
