import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal-document";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND.company} collects, uses and protects information in ROHA, including organization account data and confidential employee survey responses.`,
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          ROHA (the &ldquo;{BRAND.productFull}&rdquo;) is developed, owned and operated by {BRAND.company} (&ldquo;Rodrik Consulting,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo; or &ldquo;our&rdquo;). This Privacy Policy explains how we handle information in connection with
          the ROHA website, the ROHA application used by organizations, and the ROHA surveys completed by employees of those organizations
          (together, the &ldquo;Service&rdquo;).
        </p>
        <p>
          ROHA serves two distinct groups, and we treat their information differently: <strong>organization users</strong> (the owners and
          administrators who register an organization and manage assessments) and <strong>survey participants</strong> (employees and other
          members of an organization who respond to a ROHA survey).
        </p>
      </>
    ),
  },
  {
    id: "roles",
    title: "Our role and our customers' role",
    body: (
      <>
        <p>
          For organization account information, Rodrik Consulting determines how that information is used and acts as the party responsible
          for it. For survey data, the organization that commissions an assessment (our &ldquo;customer&rdquo;) decides to conduct the
          assessment and how to use its aggregated results, and Rodrik Consulting processes survey data on the customer&rsquo;s behalf to
          provide the Service. Where applicable law uses terms such as &ldquo;controller&rdquo; and &ldquo;processor,&rdquo; or
          &ldquo;business&rdquo; and &ldquo;service provider,&rdquo; these roles should be read accordingly.
        </p>
      </>
    ),
  },
  {
    id: "organization-data",
    title: "Information we collect from organization users",
    body: (
      <>
        <p>When an organization registers for ROHA or uses the application, we collect:</p>
        <ul>
          <li>
            <strong>Account information</strong>, such as name, work email address, job title, and authentication credentials (passwords are
            stored only in hashed form by our authentication provider).
          </li>
          <li>
            <strong>Organization information</strong>, such as organization name, industry, size, primary contact details, and the
            departments, locations and other structure configured for assessments.
          </li>
          <li>
            <strong>Campaign configuration</strong>, such as campaign names, dates, privacy mode (confidential or anonymous), and settings.
          </li>
          <li>
            <strong>Billing information</strong>. Payments are processed by Stripe. We receive limited information from Stripe, such as the
            plan purchased, payment status and billing contact details. Card details are entered directly with Stripe; ROHA never receives or
            stores full card numbers or security codes.
          </li>
          <li>
            <strong>Usage and security information</strong>, such as sign-in events and significant administrative actions recorded in an
            audit log, and technical logs needed to operate and secure the Service.
          </li>
          <li>
            <strong>Communications</strong>, such as messages sent through our contact form (name, email, organization, topic and message).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "survey-data",
    title: "Information we collect from survey participants",
    body: (
      <>
        <p>
          ROHA is designed to collect as little information about survey participants as possible while still producing useful aggregated
          results.
        </p>
        <h3>What participants provide</h3>
        <ul>
          <li>Ratings for each assessment statement, from two perspectives (current state and desired state), including &ldquo;Not Applicable&rdquo; selections.</li>
          <li>Optional written answers to open-ended questions.</li>
          <li>
            Optional permission for a written comment to be quoted verbatim in reports. Without this permission, comments may inform
            aggregated themes but are not quoted.
          </li>
          <li>
            In <strong>confidential</strong> campaigns only, optional demographic selections defined by the organization, such as department,
            location, level and tenure. <strong>Anonymous</strong> campaigns collect no demographic information.
          </li>
        </ul>
        <h3>What we do not collect</h3>
        <ul>
          <li>Participants do not create accounts and are not asked for their name, email address or employee ID.</li>
          <li>We do not store IP addresses or submission times with survey responses.</li>
          <li>We do not use tracking or advertising cookies on survey pages.</li>
        </ul>
        <p>
          To protect the integrity of a campaign and the Service, we may apply rate limiting to survey and form submissions. Rate limiting
          uses a short-lived, one-way cryptographic value derived from network information that rotates daily; raw network addresses are not
          stored for this purpose and the value is not linked to responses.
        </p>
        <h3>Written comments</h3>
        <p>
          Written comments are automatically screened for names, email addresses, telephone numbers and other potential identifiers before
          they are analyzed or displayed. Screening reduces—but cannot entirely eliminate—the chance that a comment contains identifying
          details, so we encourage participants not to include information that could identify themselves or others.
        </p>
      </>
    ),
  },
  {
    id: "confidentiality",
    title: "How survey confidentiality is protected",
    body: (
      <>
        <ul>
          <li>
            <strong>Aggregated reporting only.</strong> Organization users see aggregated results. Individual responses are never displayed in
            the dashboard, reports or exports available to organizations.
          </li>
          <li>
            <strong>Minimum group size.</strong> Results for any group—including the organization as a whole and any filter by department,
            location, level or tenure—are shown only when at least five people in that group responded. Additional suppression is applied so
            that small groups cannot be inferred by subtracting one result from another.
          </li>
          <li>
            <strong>Release at close.</strong> Results are released when a campaign closes, reducing the risk of inferring individual
            responses from changes during the campaign.
          </li>
        </ul>
        <h3>Platform administrator access</h3>
        <p>
          Rodrik Consulting operates the ROHA platform. Our authorized personnel with database administration responsibilities could
          technically access raw response records. Such access is limited to operating, securing, supporting and maintaining the Service; is
          subject to strict internal controls; and is never used to attempt to identify participants or to disclose individual responses to
          an organization. Because ROHA does not collect names, email addresses or employee IDs, raw response records are not linked to named
          individuals.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use information",
    body: (
      <>
        <p>We use information to:</p>
        <ul>
          <li>Provide, operate and maintain the Service, including calculating scores and producing dashboards and reports;</li>
          <li>Authenticate users, manage organization accounts, and enforce plan limits;</li>
          <li>Process payments and manage subscriptions;</li>
          <li>Respond to inquiries and provide support;</li>
          <li>Secure the Service, prevent abuse, and maintain audit records;</li>
          <li>Improve the reliability and quality of the Service, using aggregated or de-identified information where possible; and</li>
          <li>Comply with legal obligations and enforce our agreements.</li>
        </ul>
        <p>We do not sell personal information, and we do not use survey data for advertising.</p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI-assisted analysis",
    body: (
      <>
        <p>
          Certain plans include an AI-generated organizational intelligence report. To produce it, we send the following to our AI provider,
          Anthropic, through its commercial API:
        </p>
        <ul>
          <li>Aggregated scores, gaps and distributions calculated by ROHA&rsquo;s scoring engine, for groups that meet the privacy threshold; and</li>
          <li>Written comments after they have been screened for identifiers.</li>
        </ul>
        <p>
          We do not send participant names, email addresses, employee IDs, individual response records or demographic profiles of individual
          participants. The AI does not calculate or alter scores; it interprets results that have already been calculated. AI-generated
          content can contain errors, and reports distinguish observed findings from hypotheses that should be tested by leadership.
        </p>
        <p>
          Information sent to Anthropic is processed under Anthropic&rsquo;s commercial terms. Under those terms, API inputs and outputs are
          not used to train Anthropic&rsquo;s models by default.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Service providers and disclosures",
    body: (
      <>
        <p>We share information only as needed to provide the Service, with providers bound by contractual confidentiality and security obligations:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — database hosting, authentication and storage.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing and subscription billing.
          </li>
          <li>
            <strong>Anthropic</strong> — AI analysis of aggregated results and screened comments, as described above.
          </li>
          <li>
            <strong>Hosting and email delivery providers</strong> — to serve the application and send account-related messages.
          </li>
        </ul>
        <p>
          We may also disclose information if required by law or legal process, to protect the rights, safety or property of Rodrik
          Consulting, our customers or others, or in connection with a merger, acquisition or sale of assets, subject to this Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        ROHA uses cookies only for authentication and session management—for example, to keep organization users signed in securely. We do
        not use advertising cookies or third-party tracking cookies. Survey participants do not need to sign in, and survey responses are
        not associated with authentication cookies.
      </p>
    ),
  },
  {
    id: "retention",
    title: "Data retention",
    body: (
      <>
        <p>
          Each organization controls how long its survey data is retained. The default retention period is <strong>36 months</strong>, and
          it can be configured for each organization between <strong>6 and 120 months</strong>. When the retention period for a campaign expires,
          its survey data is deleted or de-identified.
        </p>
        <p>
          Organization account information is retained while the account is active and for a reasonable period afterward to meet legal,
          accounting and security obligations. Billing records may be retained longer where required by law. Audit logs are retained to
          support security and accountability.
        </p>
      </>
    ),
  },
  {
    id: "export-deletion",
    title: "Export and deletion",
    body: (
      <p>
        Organization owners can export their organization&rsquo;s data and request deletion of their organization and its associated data
        from within the application. Exports are designed to preserve participant confidentiality and do not identify individual participants. Following a deletion request, data is removed from active systems within a reasonable period, and from backups according
        to their normal rotation.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <>
        <p>We use administrative, technical and organizational safeguards designed to protect information, including:</p>
        <ul>
          <li>Tenant isolation, so each organization&rsquo;s data is logically separated;</li>
          <li>Database row-level security policies that restrict access to authorized users;</li>
          <li>Role-based access control within organizations;</li>
          <li>Encryption of data in transit and at rest provided by our hosting infrastructure;</li>
          <li>Audit logging of significant administrative actions; and</li>
          <li>Restricted, controlled access by Rodrik Consulting personnel.</li>
        </ul>
        <p>No method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>
          Depending on where you live, you may have rights to access, correct, delete or obtain a copy of your personal information, to object
          to or restrict certain processing, and to withdraw consent. Organization users can update most account information within the
          application.
        </p>
        <p>
          <strong>Survey participants:</strong> because ROHA does not link responses to names, email addresses or employee IDs, we generally
          cannot locate, correct or delete an individual&rsquo;s survey response. Questions about a particular assessment should be directed to
          the organization that invited you.
        </p>
        <p>We will not discriminate against anyone for exercising privacy rights.</p>
      </>
    ),
  },
  {
    id: "international",
    title: "International data transfers",
    body: (
      <p>
        Rodrik Consulting is based in the United States, and our service providers may process information in the United States and other
        countries. Where required, we rely on appropriate safeguards for international transfers.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The Service is intended for organizations and their adult workforce. It is not directed to children under 16, and we do not knowingly
        collect personal information from children.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. When we make material changes, we will update the &ldquo;Last updated&rdquo; date
        and, where appropriate, notify organization owners by email or within the application.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        To ask a question or make a privacy request, please use our <Link href="/contact?topic=privacy">contact form</Link> and select
        &ldquo;Privacy and data protection,&rdquo; or reach {BRAND.company} through <a href={BRAND.companyUrl}>rodrikconsulting.com</a>. We
        may need to verify your identity before responding to certain requests.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      intro={
        <p>
          Confidentiality is foundational to ROHA. This policy describes what we collect, what we deliberately do not collect, and how we
          protect the perspectives employees entrust to the assessment.
        </p>
      }
      sections={sections}
    />
  );
}
