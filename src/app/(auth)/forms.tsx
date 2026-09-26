"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createOrganizationForCurrentUser,
  registerOrganization,
  requestPasswordReset,
  resendVerification,
  signIn,
  updatePassword,
  type FormState,
} from "./actions";

const initial: FormState = {};

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-5" noValidate>
      {notice ? <Alert tone="info">{notice}</Alert> : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="next" value={next ?? "/app"} />
      <Field label="Work email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      </Field>
      <Field label="Password" htmlFor="password" required error={state.fieldErrors?.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex items-center justify-between text-sm">
        <Link href="/auth/forgot" className="font-medium text-emerald-700 hover:text-emerald-800">
          Forgot your password?
        </Link>
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

export const INDUSTRIES = [
  "Professional services",
  "Healthcare",
  "Education",
  "Government & public sector",
  "Nonprofit",
  "Financial services",
  "Insurance",
  "Technology",
  "Manufacturing",
  "Retail & consumer",
  "Hospitality",
  "Construction & real estate",
  "Energy & utilities",
  "Transportation & logistics",
  "Media & communications",
  "Other",
];

export const EMPLOYEE_RANGES = ["1-24", "25-49", "50-99", "100-249", "250-499", "500-999", "1,000-4,999", "5,000+"];

function OrganizationFields({ errors, values }: { errors?: Record<string, string>; values?: Record<string, string> }) {
  return (
    <>
      <Field label="Organization name" htmlFor="name" required error={errors?.name}>
        <Input id="name" name="name" defaultValue={values?.name} autoComplete="organization" required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Industry" htmlFor="industry" required error={errors?.industry}>
          <Select id="industry" name="industry" required defaultValue={values?.industry ?? ""} key={`i-${values?.industry ?? ""}`}>
            <option value="" disabled>
              Select…
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </Select>
        </Field>
        <Field label="Approximate employees" htmlFor="employee_count_range" required error={errors?.employee_count_range}>
          <Select id="employee_count_range" name="employee_count_range" required defaultValue={values?.employee_count_range ?? ""} key={`e-${values?.employee_count_range ?? ""}`}>
            <option value="" disabled>
              Select…
            </option>
            {EMPLOYEE_RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Organization website" htmlFor="website" error={errors?.website}>
        <Input id="website" name="website" defaultValue={values?.website} placeholder="www.example.com" autoComplete="url" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" htmlFor="country" required error={errors?.country}>
          <Input id="country" name="country" defaultValue={values?.country} autoComplete="country-name" required />
        </Field>
        <Field label="State or region" htmlFor="region" required error={errors?.region}>
          <Input id="region" name="region" defaultValue={values?.region} autoComplete="address-level1" required />
        </Field>
      </div>
    </>
  );
}

function ContactFields({ errors, values }: { errors?: Record<string, string>; values?: Record<string, string> }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your full name" htmlFor="contact_name" required error={errors?.contact_name}>
          <Input id="contact_name" name="contact_name" defaultValue={values?.contact_name} autoComplete="name" required />
        </Field>
        <Field label="Job title" htmlFor="contact_title" required error={errors?.contact_title}>
          <Input id="contact_title" name="contact_title" defaultValue={values?.contact_title} autoComplete="organization-title" required />
        </Field>
      </div>
      <Field label="Telephone" htmlFor="contact_phone" error={errors?.contact_phone}>
        <Input id="contact_phone" name="contact_phone" defaultValue={values?.contact_phone} type="tel" autoComplete="tel" />
      </Field>
    </>
  );
}

export function RegistrationForm({ plan }: { plan?: string }) {
  const [state, action] = useActionState(registerOrganization, initial);
  const e = state.fieldErrors;
  return (
    <form action={action} className="space-y-8" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="plan" value={plan ?? ""} />
      <fieldset className="space-y-5">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Organization</legend>
        <OrganizationFields errors={e} values={state.values} />
      </fieldset>
      <fieldset className="space-y-5">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Primary contact &amp; administrator
        </legend>
        <ContactFields errors={e} values={state.values} />
        <Field label="Work email" htmlFor="contact_email" required error={e?.contact_email} hint="We'll send a verification link to this address.">
          <Input id="contact_email" name="contact_email" defaultValue={state.values?.contact_email} type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password" required error={e?.password} hint="At least 10 characters, including a letter and a number.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
      </fieldset>
      <div>
        <label className="flex items-start gap-3 text-sm text-navy-800">
          <Checkbox name="terms" className="mt-0.5" required />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-emerald-700 underline" target="_blank">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-emerald-700 underline" target="_blank">
              Privacy Policy
            </Link>
            , and I am authorized to register this organization.
          </span>
        </label>
        {e?.terms ? <p className="mt-1 text-sm text-red-600">{e.terms}</p> : null}
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Creating your workspace…">
        Create organization workspace
      </SubmitButton>
    </form>
  );
}

export function OrganizationOnlyForm() {
  const [state, action] = useActionState(createOrganizationForCurrentUser, initial);
  const e = state.fieldErrors;
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <OrganizationFields errors={e} values={state.values} />
      <ContactFields errors={e} values={state.values} />
      <SubmitButton className="w-full" size="lg" pendingText="Creating your workspace…">
        Create organization workspace
      </SubmitButton>
    </form>
  );
}

export function ResendVerificationForm({ email }: { email?: string }) {
  const [state, action] = useActionState(resendVerification, initial);
  return (
    <form action={action} className="space-y-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="email" type="email" defaultValue={email} placeholder="you@organization.com" aria-label="Email address" />
        <SubmitButton variant="outline" pendingText="Sending…">
          Resend link
        </SubmitButton>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <Field label="Work email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initial);
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="New password" htmlFor="password" required error={state.fieldErrors?.password} hint="At least 10 characters, including a letter and a number.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm" required error={state.fieldErrors?.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
