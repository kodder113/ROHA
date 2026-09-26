import Link from "next/link";
import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatTile } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, EmptyRow, StatusBadge, TBody, Td, Th, THead } from "@/components/admin/table";
import { OrgLabel } from "@/components/admin/org-label";
import { loadOrgMap, loadSubscriptionMatrix, SUBSCRIPTION_SOURCES } from "./_lib/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const orgs = () => admin.from("organizations").select("id", { count: "exact", head: true });

  const [
    orgTotal,
    orgActive,
    orgSuspended,
    orgPilot,
    orgDemo,
    campaignsOpen,
    campaignsTotal,
    responsesTotal,
    aiReportsCompleted,
    pdfReports,
    newInquiries,
    unresolvedErrors,
    { data: plans },
    { data: audit },
    { data: errors },
  ] = await Promise.all([
    count(orgs()),
    count(orgs().eq("status", "active")),
    count(orgs().eq("status", "suspended")),
    count(orgs().eq("is_pilot", true)),
    count(orgs().eq("is_demo", true)),
    count(admin.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "open")),
    count(admin.from("campaigns").select("id", { count: "exact", head: true })),
    count(admin.from("responses").select("id", { count: "exact", head: true })),
    count(admin.from("ai_reports").select("id", { count: "exact", head: true }).eq("status", "completed")),
    count(admin.from("generated_reports").select("id", { count: "exact", head: true })),
    count(admin.from("contact_inquiries").select("id", { count: "exact", head: true }).eq("status", "new")),
    count(admin.from("app_errors").select("id", { count: "exact", head: true }).eq("resolved", false)),
    admin.from("plans").select("id, name, key, sort_order").order("sort_order"),
    admin.from("audit_logs").select("id, created_at, actor_email, action, target_type, org_id, scope").order("created_at", { ascending: false }).limit(10),
    admin.from("app_errors").select("id, created_at, level, source, message, org_id, resolved").order("created_at", { ascending: false }).limit(6),
  ]);

  const matrix = await loadSubscriptionMatrix((plans ?? []).map((p) => p.id));
  const orgMap = await loadOrgMap([...(audit ?? []).map((a) => a.org_id), ...(errors ?? []).map((e) => e.org_id)]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Rodrik Consulting · Platform Administration"
        title="Platform overview"
        description="Aggregate usage across all ROHA tenants. Survey responses are shown as counts only — individual answers are never accessible."
      />

      <section aria-label="Organizations" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile tone="navy" label="Organizations" value={orgTotal.toLocaleString("en-US")} hint={`${orgActive} active · ${orgSuspended} suspended`} />
        <StatTile label="Pilot organizations" value={orgPilot.toLocaleString("en-US")} hint="Complimentary pilots" />
        <StatTile label="Demonstration" value={orgDemo.toLocaleString("en-US")} hint="Synthetic-data tenants" />
        <StatTile tone="emerald" label="Active campaigns" value={campaignsOpen.toLocaleString("en-US")} hint={`${campaignsTotal.toLocaleString("en-US")} campaigns all-time`} />
        <StatTile label="Total responses" value={responsesTotal.toLocaleString("en-US")} hint="Count only" />
        <StatTile label="AI reports generated" value={aiReportsCompleted.toLocaleString("en-US")} hint="Completed executive reports" />
        <StatTile label="PDF exports" value={pdfReports.toLocaleString("en-US")} hint="Generated report downloads" />
        <Link href="/admin/inquiries?status=new" className="block rounded-xl focus-visible:outline-2">
          <StatTile label="New inquiries" value={newInquiries.toLocaleString("en-US")} hint={`${unresolvedErrors} unresolved errors`} className="h-full hover:border-emerald-300" />
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader title="Active subscriptions by plan" description={`Active and trialing · by source: ${SUBSCRIPTION_SOURCES.map((src) => `${src} ${matrix.bySource[src] ?? 0}`).join(" · ")}`} action={<Link href="/admin/billing" className="text-sm font-medium text-emerald-700 hover:underline">Billing</Link>} />
          <CardBody className="p-0">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-line">
                {(plans ?? []).map((p) => {
                  const row = matrix.byPlan.get(p.id) ?? {};
                  return (
                    <tr key={p.id}>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-navy-900">{p.name}</p>
                        <p className="font-mono text-xs text-muted">{p.key}</p>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-muted">
                        {row.trialing ? `${row.trialing} trialing` : ""}
                      </td>
                      <td className="px-5 py-2.5 text-right font-serif text-lg font-semibold tabular-nums text-navy-900">{matrix.activeByPlan.get(p.id) ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent errors" action={<Link href="/admin/errors" className="text-sm font-medium text-emerald-700 hover:underline">Error log</Link>} />
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {(errors ?? []).length === 0 ? <li className="px-5 py-6 text-sm text-muted">No errors recorded.</li> : null}
              {(errors ?? []).map((e) => (
                <li key={e.id} className="px-5 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={e.level} />
                    <span className="font-mono text-xs text-muted">{e.source}</span>
                    {e.resolved ? <Badge tone="outline">Resolved</Badge> : null}
                    <span className="ml-auto text-xs text-muted">{formatDateTime(e.created_at)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-navy-900">{e.message}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-900">Recent audit activity</h2>
          <Link href="/admin/audit" className="text-sm font-medium text-emerald-700 hover:underline">Full audit trail</Link>
        </div>
        <DataTable>
          <THead>
            <Th>When</Th>
            <Th>Actor</Th>
            <Th>Action</Th>
            <Th>Target</Th>
            <Th>Organization</Th>
          </THead>
          <TBody>
            {(audit ?? []).length === 0 ? <EmptyRow colSpan={5}>No audit entries yet.</EmptyRow> : null}
            {(audit ?? []).map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(a.created_at)}</Td>
                <Td className="text-xs">{a.actor_email ?? "system"}</Td>
                <Td>
                  <span className="font-mono text-xs">{a.action}</span>
                  {a.scope === "platform" ? <Badge tone="navy" className="ml-2">platform</Badge> : null}
                </Td>
                <Td className="text-xs text-muted">{a.target_type ?? "—"}</Td>
                <Td className="text-xs">{a.org_id ? <OrgLabel id={a.org_id} org={orgMap.get(a.org_id)} /> : "—"}</Td>
              </tr>
            ))}
          </TBody>
        </DataTable>
      </section>
    </div>
  );
}
