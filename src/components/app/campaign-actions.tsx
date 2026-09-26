"use client";

import { useActionState, useState } from "react";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { Check, Copy, Download, Mail, MessageSquare } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  closeCampaign,
  deleteCampaign,
  duplicateCampaign,
  extendCampaign,
  generateAccessCodes,
  launchCampaign,
  type CampaignFormState,
} from "@/app/app/campaigns/actions";

type Ids = { orgId: string; campaignId: string };

function Hidden({ orgId, campaignId }: Ids) {
  return (
    <>
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="campaignId" value={campaignId} />
    </>
  );
}

function Feedback({ state }: { state: CampaignFormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.message) return <Alert tone="success">{state.message}</Alert>;
  return null;
}

export function CopySurveyLink({ url, campaignName }: { url: string; campaignName: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };
  const message = `We are asking for your perspective on how our organization operates today and how it should operate in the future. The ${campaignName} takes about 10–15 minutes. Responses are confidential and results are reported only for groups of at least five people.\n\n${url}`;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={url} aria-label="Survey link" className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        <Button onClick={() => copy(url, "link")} variant="secondary">
          {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied === "link" ? "Copied" : "Copy link"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => copy(message, "msg")}>
          <MessageSquare className="h-4 w-4" /> {copied === "msg" ? "Message copied" : "Copy invitation for Slack / Teams"}
        </Button>
        <a
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-navy-900 hover:bg-navy-50"
          href={`mailto:?subject=${encodeURIComponent(`Please share your perspective: ${campaignName}`)}&body=${encodeURIComponent(message)}`}
        >
          <Mail className="h-4 w-4" /> Compose email
        </a>
      </div>
    </div>
  );
}

export function LaunchForm(ids: Ids) {
  const [state, action] = useActionState(launchCampaign, {});
  return (
    <form action={action} className="space-y-3">
      <Hidden {...ids} />
      <Feedback state={state} />
      <SubmitButton pendingText="Launching…">Launch assessment</SubmitButton>
    </form>
  );
}

export function CloseForm(ids: Ids) {
  const [state, action] = useActionState(closeCampaign, {});
  const [confirming, setConfirming] = useState(false);
  return (
    <form action={action} className="space-y-3">
      <Hidden {...ids} />
      <Feedback state={state} />
      {confirming ? (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>Closing is permanent: no further responses will be accepted and the assessment cannot be reopened.</p>
          <div className="flex gap-2">
            <SubmitButton size="sm" variant="secondary" pendingText="Closing…">
              Close and release results
            </SubmitButton>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setConfirming(true)}>
          Close assessment now
        </Button>
      )}
    </form>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExtendForm({ closesAt, ...ids }: Ids & { closesAt: string }) {
  const [state, action] = useActionState(extendCampaign, {});
  const isClient = useIsClient();
  const min = isClient ? toLocalInput(closesAt) : "";
  const offset = isClient ? new Date(closesAt).getTimezoneOffset() : 0;
  return (
    <form action={action} className="space-y-3">
      <Hidden {...ids} />
      <input type="hidden" name="timezone_offset" value={offset} />
      <Feedback state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        {isClient ? <Input type="datetime-local" name="closes_at" min={min} defaultValue={min} key={min} aria-label="New closing date" /> : null}
        <SubmitButton variant="outline" pendingText="Saving…">
          Extend
        </SubmitButton>
      </div>
    </form>
  );
}

export function DeleteForm({ name, launched, ...ids }: Ids & { name: string; launched: boolean }) {
  const [state, action] = useActionState(deleteCampaign, {});
  const [open, setOpen] = useState(false);
  return (
    <form action={action} className="space-y-3">
      <Hidden {...ids} />
      <Feedback state={state} />
      {open ? (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p>
            {launched
              ? "This permanently deletes the assessment, all employee responses, results and reports. This cannot be undone."
              : "Delete this draft assessment?"}
          </p>
          {launched ? (
            <Input name="confirm" placeholder={`Type "${name}" to confirm`} aria-label="Confirm assessment name" autoComplete="off" />
          ) : null}
          <div className="flex gap-2">
            <SubmitButton size="sm" variant="danger" pendingText="Deleting…">
              {launched ? "Permanently delete" : "Delete draft"}
            </SubmitButton>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
          {launched ? "Delete assessment and data" : "Delete draft"}
        </Button>
      )}
    </form>
  );
}

export function DuplicateForm(ids: Ids) {
  const [state, action] = useActionState(duplicateCampaign, {});
  return (
    <form action={action} className="space-y-3">
      <Hidden {...ids} />
      <Feedback state={state} />
      <SubmitButton variant="outline" pendingText="Creating…">
        Create follow-up assessment
      </SubmitButton>
    </form>
  );
}

export function AccessCodesForm({ campaignName, ...ids }: Ids & { campaignName: string }) {
  const [state, action] = useActionState(generateAccessCodes, {});
  const download = () => {
    if (!state.codes) return;
    const csv = ["access_code", ...state.codes].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaignName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-access-codes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <form action={action} className="space-y-3">
      <Hidden {...ids} />
      <Feedback state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="number" name="count" min={1} max={2000} defaultValue={25} aria-label="Number of codes" className="sm:w-32" />
        <SubmitButton variant="outline" pendingText="Generating…">
          Generate codes
        </SubmitButton>
      </div>
      {state.codes ? (
        <div className="space-y-2">
          <Button variant="secondary" size="sm" onClick={download}>
            <Download className="h-4 w-4" /> Download {state.codes.length} codes (CSV)
          </Button>
          <div className="max-h-40 overflow-auto rounded-lg border border-line bg-canvas p-2 font-mono text-xs leading-relaxed">
            {state.codes.join("  ·  ")}
          </div>
        </div>
      ) : null}
    </form>
  );
}
