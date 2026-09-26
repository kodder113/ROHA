import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "../../forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-semibold text-navy-900">Reset your password</h1>
      <p className="mt-2 text-muted">Enter your work email and we&apos;ll send you a secure link to choose a new password.</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-8 text-sm text-muted">
        <Link href="/sign-in" className="font-medium text-emerald-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
