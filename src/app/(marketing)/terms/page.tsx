import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal-document";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms governing use of ROHA, the ${BRAND.productFull}, provided by ${BRAND.company}.`,
};

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to these terms",
    body: (
      <>
        <p>
          These Terms of Service (the &ldquo;Terms&rdquo;) form an agreement between {BRAND.company} (&ldquo;Rodrik Consulting,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo; or &ldquo;our&rdquo;) and the organization that registers for or uses ROHA (the
          &ldquo;Customer&rdquo; or &ldquo;you&rdquo;). They govern access to and use of the ROHA website and application (the
          &ldquo;Service&rdquo;).
        </p>
        <p>
          The individual who accepts these Terms represents that they have authority to bind the Customer. If you do not agree to these Terms,
          do not use the Service. Survey participants who respond to a ROHA survey at the invitation of a Customer are not parties to these
          Terms; their information is handled as described in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "The Service",
    body: (
      <p>
        ROHA enables organizations to gather confidential employee perceptions across six dimensions of organizational health, calculate
        descriptive scores, and review aggregated results through dashboards, AI-assisted reports and exportable documents. Features and
        limits depend on the plan selected. We may modify, improve or discontinue features from time to time, and will provide reasonable
        notice of changes that materially reduce the functionality of a paid plan during its term.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and administrators",
    body: (
      <>
        <p>
          You are responsible for the accuracy of your account information, for maintaining the confidentiality of credentials, and for all
          activity under your organization&rsquo;s account. You are responsible for deciding who is granted owner or administrator access and
          for removing access when it is no longer appropriate.
        </p>
        <p>Please notify us promptly of any unauthorized use of your account or suspected security incident.</p>
      </>
    ),
  },
  {
    id: "plans",
    title: "Plans, billing and payment",
    body: (
      <>
        <h3>Plans</h3>
        <p>
          ROHA is offered under the plans described on our <Link href="/pricing">pricing page</Link>, including ROHA Discover (free), ROHA
          Professional (a one-time purchase per assessment), ROHA Enterprise (a monthly subscription) and ROHA Strategic (a consulting
          engagement governed by a separate written agreement). Each plan includes the limits and features described at the time of purchase,
          such as the number of assessment campaigns, responses per campaign and administrators.
        </p>
        <h3>Payment</h3>
        <p>
          Payments are processed by Stripe. By providing payment details you authorize us, through Stripe, to charge the applicable fees and
          taxes. We do not store full payment card information. Prices are stated in U.S. dollars unless otherwise indicated and exclude
          applicable taxes.
        </p>
        <h3>Subscriptions</h3>
        <p>
          Monthly subscriptions renew automatically at the end of each billing period until canceled. You may cancel at any time; cancellation
          takes effect at the end of the current billing period, and you retain access to paid features until then.
        </p>
        <h3>Refunds</h3>
        <p>
          Except where required by law or expressly stated otherwise, fees are non-refundable, including for one-time assessment purchases
          once a campaign has been launched. [Refund policy to be confirmed by Rodrik Consulting LLC.]
        </p>
        <h3>Limits</h3>
        <p>
          When a campaign reaches its plan&rsquo;s response limit, the survey stops accepting additional responses. We may change prices for
          future billing periods or purchases with reasonable advance notice.
        </p>
      </>
    ),
  },
  {
    id: "customer-responsibilities",
    title: "Customer responsibilities",
    body: (
      <>
        <p>ROHA is most valuable—and most ethical—when employees understand and trust the process. You agree to:</p>
        <ul>
          <li>
            <strong>Communicate honestly with participants.</strong> Describe the survey accurately, including whether the campaign is
            confidential or anonymous, and do not overstate the protections the Service provides.
          </li>
          <li>
            <strong>Keep participation voluntary</strong> and refrain from pressuring, rewarding or penalizing employees based on whether or
            how they respond.
          </li>
          <li>
            <strong>Not attempt to identify participants</strong>, including by combining results with other data, configuring groups intended
            to isolate individuals, or requesting individual responses.
          </li>
          <li>
            <strong>Not retaliate</strong> against any employee in connection with an assessment or its results.
          </li>
          <li>
            <strong>Comply with applicable law</strong>, including employment, labor, privacy and data protection laws, and any obligations to
            consult or inform employee representatives where required.
          </li>
          <li>
            <strong>Use results responsibly</strong>, as one input to leadership judgment and not as the sole basis for decisions about
            individual employees.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You will not, and will not permit anyone to:</p>
        <ul>
          <li>Use the Service for any unlawful, deceptive, discriminatory or harmful purpose;</li>
          <li>Upload or submit content that is infringing, defamatory, or that contains malicious code;</li>
          <li>Attempt to gain unauthorized access to the Service, other customers&rsquo; data, or underlying systems;</li>
          <li>Probe, scan or test the vulnerability of the Service, or circumvent security, rate limits or privacy thresholds;</li>
          <li>Interfere with or disrupt the integrity or performance of the Service;</li>
          <li>Submit fabricated or automated survey responses, or otherwise manipulate results;</li>
          <li>Reverse engineer, copy, resell or create derivative works from the Service, the ROHA framework or its content, except as permitted by law; or</li>
          <li>Use the Service to build a competing product or benchmark it for competitive purposes without our written consent.</li>
        </ul>
      </>
    ),
  },
  {
    id: "data",
    title: "Customer data",
    body: (
      <>
        <p>
          As between the parties, the Customer retains its rights in the organization information and aggregated results generated for it
          (&ldquo;Customer Data&rdquo;). You grant us a limited license to host, process, analyze and display Customer Data and survey data
          solely to provide, secure and improve the Service and as described in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          Survey data is retained according to the organization&rsquo;s retention setting (36 months by default, configurable between 6 and
          120 months). Organization owners may export Customer Data and request deletion of their organization as described in the Privacy
          Policy. We may use aggregated, de-identified information that does not identify any Customer or individual to operate and improve the
          Service.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI-generated content",
    body: (
      <p>
        Certain plans include reports generated with the assistance of artificial intelligence. AI-generated content interprets scores
        calculated by ROHA&rsquo;s scoring engine; it may nonetheless contain inaccuracies, omissions or statements that do not apply to your
        circumstances. AI-generated content is provided for informational purposes, distinguishes findings from hypotheses, and should be
        reviewed with professional judgment before it is relied upon.
      </p>
    ),
  },
  {
    id: "nature",
    title: "Nature of the assessment",
    body: (
      <>
        <p>
          ROHA is an independently developed organizational health assessment in its initial release. <strong>It has not been scientifically or psychometrically
          validated</strong>, and it is not a clinical, diagnostic or psychometric instrument. Scores describe the perceptions of the
          participants who responded; they are not measurements of organizational effectiveness and do not establish productivity,
          retention, financial performance or any other outcome. Descriptive interpretation bands are interpretive aids, not validated
          cut-offs.
        </p>
        <p>{BRAND.independenceStatement}</p>
      </>
    ),
  },
  {
    id: "no-guarantee",
    title: "No guarantee of outcomes",
    body: (
      <p>
        Rodrik Consulting does not guarantee any particular result from using the Service, including any improvement in engagement, culture,
        performance, retention or financial results. Decisions made on the basis of the Service, its reports or its recommendations are the
        sole responsibility of the Customer. Nothing in the Service constitutes legal, employment, financial, medical or psychological advice.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <p>
        The Service, including the ROHA framework, assessment statements, scoring methodology, software, design, report templates and the
        ROHA name and marks, is owned by {BRAND.company} and protected by intellectual property laws. Subject to these Terms and payment of
        applicable fees, we grant you a limited, non-exclusive, non-transferable right to use the Service for your internal business purposes
        during your subscription or purchase term. You may share reports generated for your organization internally and with your advisors.
        If you provide feedback, we may use it without obligation to you.
      </p>
    ),
  },
  {
    id: "confidentiality",
    title: "Confidentiality and security",
    body: (
      <p>
        Each party will protect the other&rsquo;s non-public information with reasonable care and use it only for purposes of this
        agreement. We maintain administrative, technical and organizational safeguards designed to protect Customer Data, as described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimer of warranties",
    body: (
      <p className="uppercase tracking-[0.01em]">
        To the maximum extent permitted by law, the Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties
        of any kind, whether express, implied or statutory, including warranties of merchantability, fitness for a particular purpose, title,
        non-infringement, accuracy, or that the Service will be uninterrupted or error-free.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p className="uppercase tracking-[0.01em]">
          To the maximum extent permitted by law, neither party will be liable for any indirect, incidental, special, consequential,
          exemplary or punitive damages, or for any loss of profits, revenue, goodwill or data, arising out of or relating to these Terms or
          the Service, even if advised of the possibility of such damages.
        </p>
        <p className="uppercase tracking-[0.01em]">
          To the maximum extent permitted by law, Rodrik Consulting&rsquo;s total liability arising out of or relating to these Terms or the
          Service will not exceed the amounts paid by the Customer to Rodrik Consulting for the Service in the twelve (12) months preceding
          the event giving rise to the claim, or one hundred U.S. dollars (US$100) if no fees were paid.
        </p>
        <p>Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.</p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnification",
    body: (
      <p>
        The Customer will defend and indemnify Rodrik Consulting against third-party claims arising from the Customer&rsquo;s use of the
        Service in breach of these Terms or applicable law, including claims by the Customer&rsquo;s employees relating to how the Customer
        conducted an assessment or used its results.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <p>
        You may stop using the Service at any time. We may suspend or terminate access if you materially breach these Terms, fail to pay fees
        when due, or use the Service in a way that creates risk for participants, other customers or the Service, with notice where
        reasonably practicable. Upon termination, your right to use the Service ends, and Customer Data will be handled in accordance with
        your retention settings and our Privacy Policy. Sections that by their nature should survive termination will survive.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <p>
        These Terms are governed by the laws of the State of [State], without regard to its conflict-of-laws principles. Any dispute arising
        out of or relating to these Terms or the Service will be resolved exclusively in the state or federal courts located in [State], and
        each party consents to the personal jurisdiction of those courts.
      </p>
    ),
  },
  {
    id: "general",
    title: "General",
    body: (
      <p>
        These Terms, together with any order form or separate written agreement (such as a ROHA Strategic engagement agreement, which
        controls in the event of conflict), are the entire agreement between the parties regarding the Service. We may update these Terms
        from time to time; if we make material changes, we will update the &ldquo;Last updated&rdquo; date and notify organization owners
        where appropriate. Continued use after changes take effect constitutes acceptance. If any provision is held unenforceable, the
        remainder will remain in effect. Neither party may assign these Terms without the other&rsquo;s consent, except in connection with a
        merger, acquisition or sale of substantially all relevant assets.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these Terms may be sent through our <Link href="/contact">contact form</Link> or to {BRAND.company} via{" "}
        <a href={BRAND.companyUrl}>rodrikconsulting.com</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Service"
      intro={
        <p>
          Please read these Terms carefully. They describe the rules for using ROHA, the responsibilities that come with conducting an employee
          assessment, and the limits of what the Service provides.
        </p>
      }
      sections={sections}
    />
  );
}
