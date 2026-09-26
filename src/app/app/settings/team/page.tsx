import type { Metadata } from "next";
import { requireOrgContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadEntitlements } from "@/lib/org/entitlements";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteForm, MemberControls } from "@/components/app/settings-forms";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Team & roles" };

const ROLE_LABEL = { owner: "Owner", admin: "Administrator", viewer: "Executive viewer" } as const;

export default async function TeamPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();
  const [{ data: members }, { data: roles }, ent] = await Promise.all([
    supabase.from("organization_members").select("user_id, role_key, status, invited_email, created_at").eq("org_id", ctx.org.id).order("created_at"),
    supabase.from("roles").select("*").order("rank", { ascending: false }),
    loadEntitlements(ctx.org.id),
  ]);
  // Resolve member emails (members may see who else belongs to their organization).
  const admin = createAdminClient();
  const emails = new Map<string, string>();
  await Promise.all(
    (members ?? []).map(async (m) => {
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      if (data.user?.email) emails.set(m.user_id, data.user.email);
    }),
  );
  const adminSeats = (members ?? []).filter((m) => m.role_key === "owner" || m.role_key === "admin").length;
  const isOwner = ctx.role === "owner";
  return (
    <div className="space-y-6">
      {isOwner ? (
        <Card>
          <CardHeader
            title="Invite a team member"
            description={`Administrator seats used: ${adminSeats}${ent.maxAdmins ? ` of ${ent.maxAdmins}` : ""}. Executive viewers have read-only access to results and reports.`}
          />
          <CardBody>
            <InviteForm orgId={ctx.org.id} />
          </CardBody>
        </Card>
      ) : null}
      <Card className="overflow-hidden">
        <CardHeader title="Members" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(members ?? []).map((m) => (
                <tr key={m.user_id}>
                  <td className="px-5 py-3 font-medium text-navy-900">
                    {emails.get(m.user_id) ?? m.invited_email ?? "Member"}
                    {m.user_id === ctx.user.id ? <span className="ml-2 text-xs font-normal text-muted">(you)</span> : null}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={m.role_key === "owner" ? "navy" : m.role_key === "admin" ? "emerald" : "neutral"}>
                      {ROLE_LABEL[m.role_key as keyof typeof ROLE_LABEL] ?? m.role_key}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDate(m.created_at)}</td>
                  <td className="px-5 py-3">
                    {isOwner && m.role_key !== "owner" ? (
                      <MemberControls orgId={ctx.org.id} userId={m.user_id} role={m.role_key as "admin" | "viewer"} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardHeader title="Role permissions" />
        <CardBody>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            {(roles ?? []).map((r) => (
              <div key={r.key}>
                <dt className="font-medium text-navy-900">{r.name}</dt>
                <dd className="mt-1 text-muted">{r.description}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
