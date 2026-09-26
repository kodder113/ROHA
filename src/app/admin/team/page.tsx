import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/form";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { DataTable, EmptyRow, ShortId, TBody, Td, Th, THead } from "@/components/admin/table";
import { loadUserEmails } from "../_lib/queries";
import { formatDateTime } from "@/lib/utils";
import { addPlatformAdmin, removePlatformAdmin } from "./actions";

export const metadata: Metadata = { title: "Platform admins" };

export default async function TeamPage() {
  const me = await requirePlatformAdmin();
  const admin = createAdminClient();
  const { data: admins, error } = await admin.from("platform_admins").select("*").order("created_at");
  if (error) throw error;
  const emails = await loadUserEmails([...(admins ?? []).map((a) => a.user_id), ...(admins ?? []).map((a) => a.created_by)]);

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Platform administrators"
        description="Rodrik Consulting staff with full super-admin access to every organization, plan and methodology setting."
        className="mb-6"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <DataTable>
          <THead>
            <Th>Administrator</Th>
            <Th>Added</Th>
            <Th>Added by</Th>
            <Th>Actions</Th>
          </THead>
          <TBody>
            {(admins ?? []).length === 0 ? <EmptyRow colSpan={4}>No platform administrators.</EmptyRow> : null}
            {(admins ?? []).map((a) => {
              const isMe = a.user_id === me.id;
              return (
                <tr key={a.user_id}>
                  <Td>
                    <p className="font-medium text-navy-900">
                      {emails.get(a.user_id) ?? <span className="text-muted">Email unavailable</span>}
                      {isMe ? (
                        <Badge tone="emerald" className="ml-2">
                          You
                        </Badge>
                      ) : null}
                    </p>
                    <ShortId id={a.user_id} />
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{formatDateTime(a.created_at)}</Td>
                  <Td className="text-xs text-muted">{a.created_by ? (emails.get(a.created_by) ?? "Unknown") : "Automatic (configured email)"}</Td>
                  <Td>
                    {isMe ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      <ActionForm action={removePlatformAdmin} compact confirm={`Remove ${emails.get(a.user_id) ?? "this user"} as a platform administrator?`}>
                        <input type="hidden" name="userId" value={a.user_id} />
                        <SubmitButton size="sm" variant="ghost" className="text-red-700 hover:bg-red-50">
                          Remove
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </Td>
                </tr>
              );
            })}
          </TBody>
        </DataTable>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Add an administrator" description="The person must already have a verified ROHA account." />
            <CardBody>
              <ActionForm action={addPlatformAdmin} resetOnSuccess className="space-y-3">
                <Field label="Email address" htmlFor="email" required>
                  <Input id="email" name="email" type="email" required autoComplete="off" placeholder="name@rodrikconsulting.com" />
                </Field>
                <SubmitButton>
                  <UserPlus className="h-4 w-4" aria-hidden /> Grant platform access
                </SubmitButton>
              </ActionForm>
            </CardBody>
          </Card>
          <Alert tone="warning" title="Configured administrators">
            Emails listed in the <code className="font-mono text-xs">ROHA_PLATFORM_ADMIN_EMAILS</code> environment variable are granted access automatically
            when they sign in. To permanently revoke such a user, also remove them from that variable.
          </Alert>
        </div>
      </div>
    </div>
  );
}
