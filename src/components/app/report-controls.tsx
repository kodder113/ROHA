"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { generateReportAction } from "@/app/app/campaigns/[id]/report/actions";

function PendingNote() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <p className="text-sm text-muted" role="status">
      Analyzing aggregated results… AI reports typically take one to three minutes. Please keep this page open.
    </p>
  );
}

export function GenerateReportForm({
  orgId,
  campaignId,
  level,
  label,
  variant = "primary",
}: {
  orgId: string;
  campaignId: string;
  level: "basic" | "full";
  label: string;
  variant?: "primary" | "secondary" | "outline";
}) {
  const [state, action] = useActionState(generateReportAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="level" value={level} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <SubmitButton variant={variant} pendingText={level === "full" ? "Generating AI analysis…" : "Generating…"}>
        {level === "full" ? <Sparkles className="h-4 w-4" /> : null}
        {label}
      </SubmitButton>
      <PendingNote />
    </form>
  );
}
