"use client";

import { useActionState, useState } from "react";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { Lock, ShieldCheck, UserX } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { createCampaign, updateDraftCampaign, type CampaignFormState } from "@/app/app/campaigns/actions";

export interface CampaignFormDefaults {
  campaignId?: string;
  name?: string;
  description?: string | null;
  opensAt?: string;
  closesAt?: string;
  expectedParticipants?: number | null;
  departments?: string[];
  locations?: string[];
  levels?: string[];
  privacyMode?: "confidential" | "anonymous";
  requireAccessCode?: boolean;
  collectLevels?: boolean;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CampaignForm({
  orgId,
  defaults = {},
  accessCodesAvailable,
  mode,
  suggestedOpensAt,
  suggestedClosesAt,
}: {
  orgId: string;
  defaults?: CampaignFormDefaults;
  accessCodesAvailable: boolean;
  mode: "create" | "edit";
  /** Server-computed suggestions (ISO) used when creating a new campaign. */
  suggestedOpensAt?: string;
  suggestedClosesAt?: string;
}) {
  const [state, action] = useActionState<CampaignFormState, FormData>(mode === "create" ? createCampaign : updateDraftCampaign, {});
  const mounted = useIsClient();
  const [privacy, setPrivacy] = useState<"confidential" | "anonymous">(defaults.privacyMode ?? "confidential");

  const v = state.values;
  const e = state.fieldErrors;
  const opensIso = defaults.opensAt ?? suggestedOpensAt;
  const closesIso = defaults.closesAt ?? suggestedClosesAt;
  // Offset of the browser's time zone at the proposed launch date (handles DST).
  const tzOffset = mounted && opensIso ? new Date(opensIso).getTimezoneOffset() : 0;
  const defaultOpens = mounted && opensIso ? toLocalInput(opensIso) : "";
  const defaultCloses = mounted && closesIso ? (defaults.closesAt ? toLocalInput(closesIso) : toLocalInput(closesIso).slice(0, 11) + "17:00") : "";

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="orgId" value={orgId} />
      {defaults.campaignId ? <input type="hidden" name="campaignId" value={defaults.campaignId} /> : null}
      <input type="hidden" name="timezone_offset" value={tzOffset} />

      <Card>
        <CardHeader title="Assessment details" description="Employees will see the name and description on the survey welcome page." />
        <CardBody className="space-y-5">
          <Field label="Assessment name" htmlFor="name" required error={e?.name}>
            <Input id="name" name="name" defaultValue={v?.name ?? defaults.name} placeholder="e.g. 2026 Organizational Health Assessment" required />
          </Field>
          <Field label="Description" htmlFor="description" error={e?.description} hint="Explain why the organization is running this assessment and how results will be used.">
            <Textarea id="description" name="description" rows={3} defaultValue={v?.description ?? defaults.description ?? ""} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            {mounted ? (
              <>
                <Field label="Launch date" htmlFor="opens_at" required error={e?.opens_at}>
                  <Input id="opens_at" name="opens_at" type="datetime-local" defaultValue={v?.opens_at ?? defaultOpens} required />
                </Field>
                <Field label="Closing date" htmlFor="closes_at" required error={e?.closes_at}>
                  <Input id="closes_at" name="closes_at" type="datetime-local" defaultValue={v?.closes_at ?? defaultCloses} required />
                </Field>
              </>
            ) : (
              <div className="col-span-2 h-16 animate-pulse rounded-lg bg-navy-50" />
            )}
            <Field label="Expected participants" htmlFor="expected_participants" error={e?.expected_participants} hint="Used to calculate participation rates.">
              <Input
                id="expected_participants"
                name="expected_participants"
                type="number"
                min={1}
                inputMode="numeric"
                defaultValue={v?.expected_participants ?? defaults.expectedParticipants ?? ""}
              />
            </Field>
          </div>
          <p className="text-xs text-muted">Dates use your browser&apos;s time zone. Results are released when the assessment closes.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Confidentiality" description="Choose how much optional demographic information employees may provide." />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "confidential",
                icon: ShieldCheck,
                title: "Confidential (recommended)",
                text: "Employees may optionally select department, location, level and tenure, enabling group comparisons. Groups under 5 respondents are always hidden.",
              },
              {
                value: "anonymous",
                icon: UserX,
                title: "Anonymous",
                text: "No demographic questions are asked or stored. Only organization-wide results are available.",
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                privacy === opt.value ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500" : "border-line hover:border-navy-300",
              )}
            >
              <input
                type="radio"
                name="privacy_mode"
                value={opt.value}
                checked={privacy === opt.value}
                onChange={() => setPrivacy(opt.value)}
                className="mt-1 accent-emerald-600"
              />
              <span>
                <span className="flex items-center gap-2 font-medium text-navy-900">
                  <opt.icon className="h-4 w-4 text-emerald-700" aria-hidden /> {opt.title}
                </span>
                <span className="mt-1 block text-sm text-muted">{opt.text}</span>
              </span>
            </label>
          ))}
        </CardBody>
      </Card>

      <Card className={cn(privacy === "anonymous" && "opacity-60")}>
        <CardHeader
          title="Organizational structure"
          description={
            privacy === "anonymous"
              ? "Not used for anonymous assessments."
              : "Enter one option per line. Employees can always choose not to answer."
          }
        />
        <CardBody className="grid gap-5 lg:grid-cols-3">
          <Field label="Departments" htmlFor="departments" error={e?.departments}>
            <Textarea
              id="departments"
              name="departments"
              rows={7}
              disabled={privacy === "anonymous"}
              defaultValue={v?.departments ?? defaults.departments?.join("\n") ?? ""}
              placeholder={"Operations\nFinance\nHuman Resources"}
            />
          </Field>
          <Field label="Office locations" htmlFor="locations" error={e?.locations}>
            <Textarea
              id="locations"
              name="locations"
              rows={7}
              disabled={privacy === "anonymous"}
              defaultValue={v?.locations ?? defaults.locations?.join("\n") ?? ""}
              placeholder={"Headquarters\nRegional office\nRemote"}
            />
          </Field>
          <div className="space-y-3">
            <Field label="Organizational levels" htmlFor="levels" error={e?.levels}>
              <Textarea
                id="levels"
                name="levels"
                rows={5}
                disabled={privacy === "anonymous"}
                defaultValue={v?.levels ?? defaults.levels?.join("\n") ?? ""}
                placeholder={"Individual contributor\nSupervisor / team lead\nManager\nSenior leader"}
              />
            </Field>
            <label className="flex items-start gap-2 text-sm text-navy-800">
              <Checkbox name="collect_levels" defaultChecked={defaults.collectLevels ?? true} disabled={privacy === "anonymous"} className="mt-0.5" />
              Ask employees for their organizational level
            </label>
          </div>
          <p className="text-xs text-muted lg:col-span-3">
            Employment tenure ranges (less than 1 year, 1–2, 3–5, 6–10, more than 10 years) are offered automatically. Avoid very
            small groups — options with fewer than 5 respondents are hidden in results.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Access" />
        <CardBody>
          <label className={cn("flex items-start gap-3 text-sm", !accessCodesAvailable && "opacity-60")}>
            <Checkbox name="require_access_code" defaultChecked={defaults.requireAccessCode ?? false} disabled={!accessCodesAvailable} className="mt-0.5" />
            <span>
              <span className="font-medium text-navy-900">Require single-use access codes</span>
              <span className="mt-0.5 block text-muted">
                Strongest duplicate prevention: generate one code per employee and distribute them yourself. Codes are stored
                only as one-way hashes and are never linked to responses.
                {!accessCodesAvailable ? (
                  <span className="mt-1 flex items-center gap-1 text-navy-700">
                    <Lock className="h-3.5 w-3.5" aria-hidden /> Available on ROHA Professional and above.
                  </span>
                ) : null}
              </span>
            </span>
          </label>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton size="lg" pendingText={mode === "create" ? "Creating…" : "Saving…"}>
          {mode === "create" ? "Create assessment draft" : "Save changes"}
        </SubmitButton>
        <p className="text-sm text-muted">You can review everything before launching.</p>
      </div>
    </form>
  );
}
