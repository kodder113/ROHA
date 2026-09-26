import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "../forms";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  verified: "Your email address has been verified. Please sign in to continue.",
  expired: "That link has expired or was already used. Please sign in or request a new link.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; notice?: string }> }) {
  const { next, notice } = await searchParams;
  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-semibold text-navy-900">Sign in to ROHA</h1>
      <p className="mt-2 text-muted">Access your organization&apos;s assessments, dashboards and executive reports.</p>
      <div className="mt-8">
        <SignInForm next={next} notice={notice ? NOTICES[notice] : undefined} />
      </div>
      <p className="mt-8 text-sm text-muted">
        New to ROHA?{" "}
        <Link href="/get-started" className="font-medium text-emerald-700 hover:text-emerald-800">
          Start your free assessment
        </Link>
      </p>
      <p className="mt-2 text-xs text-muted">
        Employees taking a survey do not need an account — use the survey link shared by your organization.
      </p>
    </div>
  );
}
