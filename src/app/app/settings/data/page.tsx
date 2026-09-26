import type { Metadata } from "next";
import { Download, ShieldCheck } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { DeleteOrganizationForm, RetentionForm } from "@/components/app/settings-forms";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Data & privacy" };

export default async function DataPrivacyPage() {
  const ctx = await requireOrgContext();
  const isOwner = ctx.role === "owner";
  const canSeeAudit = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createClient();
  // RLS limits audit entries to this organization's owners and administrators.
  const { data: activity } = canSeeAudit
    ? await supabase
        .from("audit_logs")
        .select("id, created_at, actor_email, action, target_type")
        .eq("org_id", ctx.org.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: null };
  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader title="How ROHA protects employee data" />
        <CardBody>
          <ul className="space-y-2 text-sm text-navy-800">
            {[
              "Individual survey responses are never visible to anyone in your organization — only aggregated results.",
              "Results are released only after an assessment closes, and any group with fewer than five valid responses is hidden, including groups that could be derived by subtraction.",
              "Responses carry no names, emails, employee IDs, network addresses or submission times. Duplicate-prevention tokens are stored only as one-way hashes and deleted when an assessment closes.",
              "Written comments are separated from ratings and demographics, screened for identifiers, and shown verbatim only with the respondent's permission.",
              "Only aggregated scores and identifier-scrubbed comments are sent to the AI provider — never personal employee information.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Data retention"
          description="Individual response records are permanently deleted this long after each assessment closes. Aggregated, privacy-screened results and reports are kept so historical comparisons remain available."
        />
        <CardBody>
          <RetentionForm orgId={ctx.org.id} months={ctx.org.data_retention_months} readOnly={!isOwner} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Export organization data"
          description="Download your organization's settings, team, plans, assessments, privacy-screened results, reports and audit trail as JSON. Individual responses are excluded to protect respondent confidentiality."
        />
        <CardBody>
          {isOwner ? (
            <ButtonLink href="/api/org/export" prefetch={false} variant="outline">
              <Download className="h-4 w-4" /> Download organization export
            </ButtonLink>
          ) : (
            <p className="text-sm text-muted">Only the organization owner can export organization data.</p>
          )}
        </CardBody>
      </Card>

      {canSeeAudit ? (
        <Card className="overflow-hidden">
          <CardHeader title="Activity log" description="Recent administrative actions in this organization (latest 50). Survey respondents are never recorded." />
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {(activity ?? []).map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap px-5 py-2 text-xs text-muted">{formatDateTime(a.created_at)}</td>
                    <td className="px-5 py-2 font-mono text-xs text-navy-900">{a.action}</td>
                    <td className="px-5 py-2 text-xs text-muted">{a.actor_email ?? "System"}</td>
                  </tr>
                ))}
                {!activity?.length ? (
                  <tr>
                    <td className="px-5 py-4 text-sm text-muted">No activity recorded yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {isOwner ? (
        <Card className="border-red-200">
          <CardHeader title="Delete organization" description="Permanently remove this workspace and all associated data." />
          <CardBody>
            <DeleteOrganizationForm orgId={ctx.org.id} name={ctx.org.name} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
