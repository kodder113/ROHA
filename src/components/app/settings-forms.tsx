"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  changeMemberRole,
  deleteOrganization,
  inviteMember,
  openBillingPortal,
  removeMember,
  startCheckout,
  updateOrganization,
  updateRetention,
  type SettingsState,
} from "@/app/app/settings/actions";

function Feedback({ state }: { state: SettingsState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.message) return <Alert tone="success">{state.message}</Alert>;
  return null;
}

export interface OrgProfile {
  id: string;
  name: string;
  industry: string | null;
  employee_count_range: string | null;
  website: string | null;
  country: string | null;
  region: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_title: string | null;
  contact_phone: string | null;
}

export function OrganizationForm({ org, readOnly }: { org: OrgProfile; readOnly: boolean }) {
  const [state, action] = useActionState(updateOrganization, {});
  const e = state.fieldErrors;
  const field = (name: keyof OrgProfile, label: string, required = false, type = "text") => (
    <Field label={label} htmlFor={name} required={required} error={e?.[name]}>
      <Input id={name} name={name} type={type} defaultValue={(org[name] as string | null) ?? ""} disabled={readOnly} required={required} />
    </Field>
  );
  return (
    <form action={action} className="space-y-5">
      <Feedback state={state} />
      <input type="hidden" name="orgId" value={org.id} />
      {field("name", "Organization name", true)}
      <div className="grid gap-5 sm:grid-cols-2">
        {field("industry", "Industry")}
        {field("employee_count_range", "Approximate employees")}
        {field("website", "Website")}
        {field("country", "Country")}
        {field("region", "State or region")}
      </div>
      <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        {field("contact_name", "Primary contact name")}
        {field("contact_title", "Primary contact job title")}
        {field("contact_email", "Primary contact email", false, "email")}
        {field("contact_phone", "Telephone", false, "tel")}
      </div>
      {!readOnly ? <SubmitButton pendingText="Saving…">Save changes</SubmitButton> : null}
    </form>
  );
}

export function InviteForm({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(inviteMember, {});
  return (
    <form action={action} className="space-y-3">
      <Feedback state={state} />
      <input type="hidden" name="orgId" value={orgId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <Input name="email" type="email" placeholder="colleague@organization.com" aria-label="Email address" required />
        <Select name="role" defaultValue="viewer" aria-label="Role">
          <option value="admin">Administrator</option>
          <option value="viewer">Executive viewer</option>
        </Select>
        <SubmitButton pendingText="Inviting…">Send invitation</SubmitButton>
      </div>
    </form>
  );
}

export function MemberControls({ orgId, userId, role }: { orgId: string; userId: string; role: "admin" | "viewer" }) {
  const [roleState, roleAction] = useActionState(changeMemberRole, {});
  const [removeState, removeAction] = useActionState(removeMember, {});
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={roleAction}>
        <input type="hidden" name="orgId" value={orgId} />
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="role" value={role === "admin" ? "viewer" : "admin"} />
        <SubmitButton size="sm" variant="ghost">
          Make {role === "admin" ? "viewer" : "administrator"}
        </SubmitButton>
      </form>
      <form action={removeAction}>
        <input type="hidden" name="orgId" value={orgId} />
        <input type="hidden" name="userId" value={userId} />
        {confirming ? (
          <SubmitButton size="sm" variant="danger">
            Confirm removal
          </SubmitButton>
        ) : (
          <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setConfirming(true)}>
            Remove
          </Button>
        )}
      </form>
      {roleState.error || removeState.error ? <p className="w-full text-right text-xs text-red-600">{roleState.error ?? removeState.error}</p> : null}
    </div>
  );
}

export function RetentionForm({ orgId, months, readOnly }: { orgId: string; months: number; readOnly: boolean }) {
  const [state, action] = useActionState(updateRetention, {});
  return (
    <form action={action} className="space-y-3">
      <Feedback state={state} />
      <input type="hidden" name="orgId" value={orgId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select name="months" defaultValue={String(months)} disabled={readOnly} className="sm:w-64" aria-label="Retention period">
          {[6, 12, 18, 24, 36, 48, 60, 84, 120].map((m) => (
            <option key={m} value={m}>
              {m} months after an assessment closes
            </option>
          ))}
        </Select>
        {!readOnly ? (
          <SubmitButton variant="outline" pendingText="Saving…">
            Save retention period
          </SubmitButton>
        ) : null}
      </div>
    </form>
  );
}

export function DeleteOrganizationForm({ orgId, name }: { orgId: string; name: string }) {
  const [state, action] = useActionState(deleteOrganization, {});
  const [open, setOpen] = useState(false);
  return (
    <form action={action} className="space-y-3">
      <Feedback state={state} />
      <input type="hidden" name="orgId" value={orgId} />
      {open ? (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p>
            This permanently deletes the organization workspace, every assessment, all employee responses, results, reports and team
            access. Recurring subscriptions are cancelled. This cannot be undone.
          </p>
          <Input name="confirm" placeholder={`Type "${name}" to confirm`} aria-label="Confirm organization name" autoComplete="off" />
          <div className="flex gap-2">
            <SubmitButton variant="danger" pendingText="Deleting…">
              Permanently delete organization
            </SubmitButton>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
          Delete organization and all data
        </Button>
      )}
    </form>
  );
}

export function CheckoutButton({ orgId, planKey, label, disabled }: { orgId: string; planKey: "professional" | "enterprise"; label: string; disabled?: boolean }) {
  const [state, action] = useActionState(startCheckout, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="planKey" value={planKey} />
      <SubmitButton className="w-full" disabled={disabled} pendingText="Redirecting to Stripe…">
        {label}
      </SubmitButton>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}

export function BillingPortalButton({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(openBillingPortal, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orgId" value={orgId} />
      <SubmitButton variant="outline" pendingText="Opening…">
        Manage billing in Stripe
      </SubmitButton>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}
