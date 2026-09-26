"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionState, AdminFormAction } from "./action-state";

const FormStatusContext = createContext<{ pending: boolean; state: ActionState }>({ pending: false, state: null });

/**
 * Form bound to a super-admin server action. Submits via a transition (so
 * inputs keep what the administrator typed if validation fails), optionally
 * asks for confirmation, and renders success / error feedback.
 */
export function ActionForm({
  action,
  children,
  className,
  confirm,
  resetOnSuccess = false,
  compact = false,
}: {
  action: AdminFormAction;
  children: ReactNode;
  className?: string;
  /** When set, the browser asks the administrator to confirm before submitting. */
  confirm?: string;
  resetOnSuccess?: boolean;
  /** Compact feedback (inline, for row-level buttons). */
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (confirm && !window.confirm(confirm)) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(event.currentTarget, submitter ?? undefined);
    startTransition(() => formAction(data));
  }

  return (
    <FormStatusContext.Provider value={{ pending, state }}>
      <form ref={formRef} action={formAction} onSubmit={onSubmit} className={className}>
        {children}
        {compact ? <InlineMessage state={state} /> : <FormMessage state={state} />}
      </form>
    </FormStatusContext.Provider>
  );
}

function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <Alert key={state.at} tone={state.ok ? "success" : "error"} className="mt-3">
      <p>{state.message}</p>
      {state.details && state.details.length > 0 ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-4 font-mono text-xs">
          {state.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}

function InlineMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p key={state.at} role={state.ok ? "status" : "alert"} className={cn("mt-1 text-xs", state.ok ? "text-emerald-700" : "text-red-600")}>
      {state.message}
      {state.details?.length ? ` (${state.details.join("; ")})` : null}
    </p>
  );
}

type Variant = Parameters<typeof buttonClasses>[0];
type Size = Parameters<typeof buttonClasses>[1];

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  name,
  value,
  disabled,
  title,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  title?: string;
}) {
  const { pending } = useContext(FormStatusContext);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      title={title}
      disabled={pending || disabled}
      aria-busy={pending}
      className={buttonClasses(variant, size, className)}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
