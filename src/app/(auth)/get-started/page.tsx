import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCurrentUser, getMemberships } from "@/lib/auth/session";
import { OrganizationOnlyForm, RegistrationForm } from "../forms";

export const metadata: Metadata = {
  title: "Get started",
  description: "Register your organization and launch a free ROHA organizational health assessment.",
};

const PLAN_NAMES: Record<string, string> = { professional: "ROHA Professional", enterprise: "ROHA Enterprise" };

export default async function GetStartedPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    if (!user.email_confirmed_at) redirect("/auth/verify");
    const memberships = await getMemberships();
    if (memberships.length > 0) redirect(plan ? `/app/settings/billing?plan=${plan}` : "/app");
    return (
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold text-navy-900">Set up your organization</h1>
        <p className="mt-2 text-muted">
          You&apos;re signed in as <span className="font-medium text-navy-900">{user.email}</span>. Tell us about your
          organization to create its private workspace.
        </p>
        <div className="mt-8">
          <OrganizationOnlyForm />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Start your free assessment</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy-900">Register your organization</h1>
      <p className="mt-2 text-muted">
        Create a private, secure workspace for your organization. Every account starts on ROHA Discover at no cost
        {plan && PLAN_NAMES[plan] ? <> — you can complete your {PLAN_NAMES[plan]} purchase right after verifying your email</> : null}.
      </p>
      <ul className="mt-5 grid gap-2 text-sm text-navy-800 sm:grid-cols-3">
        {["No credit card required", "Employees never create accounts", "Results protected by privacy thresholds"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <RegistrationForm plan={plan} />
      </div>
      <p className="mt-8 text-sm text-muted">
        Already registered?{" "}
        <Link href="/sign-in" className="font-medium text-emerald-700 hover:text-emerald-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}
