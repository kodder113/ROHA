"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { CONTACT_TOPICS, INITIAL_CONTACT_STATE, type ContactFormState, type ContactTopic } from "./contact-shared";

export function ContactForm({
  action,
  defaultTopic,
}: {
  action: (prev: ContactFormState, formData: FormData) => Promise<ContactFormState>;
  defaultTopic: ContactTopic;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_CONTACT_STATE);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-semibold text-navy-900">Message received</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy-800">{state.message}</p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};
  // Remount fields with the echoed values after each failed submission.
  const formKey = state.status === "error" ? JSON.stringify(v) : "initial";

  return (
    <form key={formKey} action={formAction} noValidate className="space-y-5" aria-describedby={state.message ? "contact-status" : undefined}>
      {state.status === "error" && state.message ? (
        <div id="contact-status">
          <Alert tone="error">{state.message}</Alert>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="contact-name" required error={errors.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={v.name}
            aria-invalid={errors.name ? true : undefined}
          />
        </Field>
        <Field label="Work email" htmlFor="contact-email" required error={errors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            defaultValue={v.email}
            aria-invalid={errors.email ? true : undefined}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Organization" htmlFor="contact-organization" error={errors.organization}>
          <Input
            id="contact-organization"
            name="organization"
            autoComplete="organization"
            maxLength={160}
            defaultValue={v.organization}
            aria-invalid={errors.organization ? true : undefined}
          />
        </Field>
        <Field label="Topic" htmlFor="contact-topic" required error={errors.topic}>
          <Select
            id="contact-topic"
            name="topic"
            required
            defaultValue={v.topic || defaultTopic}
            aria-invalid={errors.topic ? true : undefined}
          >
            {CONTACT_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="How can we help?"
        htmlFor="contact-message"
        required
        error={errors.message}
        hint="Please do not include survey responses or other employees' personal information."
      >
        <Textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          maxLength={5000}
          defaultValue={v.message}
          aria-invalid={errors.message ? true : undefined}
        />
      </Field>

      {/* Honeypot for automated submissions */}
      <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted">
          We use your details only to respond to this inquiry. See our{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-navy-900">
            Privacy Policy
          </Link>
          .
        </p>
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
