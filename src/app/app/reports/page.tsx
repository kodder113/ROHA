import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireOrgContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Executive reports" };

export default async function ReportsPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("ai_reports")
    .select("id, campaign_id, status, report_level, generator, model, created_at, completed_at, campaigns(name)")
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: downloads } = await supabase
    .from("generated_reports")
    .select("id, created_at, format, campaigns(name)")
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Executive intelligence" title="Executive reports" description="AI-generated analyses and executive summaries for completed assessments." />
      {!reports || reports.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No reports yet" description="Reports can be generated from any completed assessment's report page." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Assessment</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3">
                      <Link href={`/app/campaigns/${r.campaign_id}/report?report=${r.id}`} className="font-medium text-navy-900 hover:text-emerald-700">
                        {(r.campaigns as { name: string } | null)?.name ?? "Assessment"}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={r.generator === "anthropic" ? "emerald" : "neutral"}>{r.generator === "anthropic" ? "AI analysis" : "Rules-based summary"}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={r.status === "completed" ? "navy" : r.status === "failed" ? "red" : "amber"}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDateTime(r.completed_at ?? r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {downloads && downloads.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-muted">Recent PDF downloads</h2>
          <ul className="space-y-1 text-sm text-navy-800">
            {downloads.map((d) => (
              <li key={d.id}>
                {(d.campaigns as { name: string } | null)?.name ?? "Assessment"} · {formatDateTime(d.created_at)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
