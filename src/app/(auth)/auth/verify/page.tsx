import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { ResendVerificationForm } from "../../forms";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const user = await getCurrentUser();
  const address = email ?? user?.email ?? undefined;
  return (
    <div className="animate-fade-up">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <MailCheck className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="mt-5 text-3xl font-semibold text-navy-900">Verify your email address</h1>
      <p className="mt-3 leading-relaxed text-muted">
        We sent a verification link to {address ? <span className="font-medium text-navy-900">{address}</span> : "your email address"}.
        Open the link to confirm your address — your organization&apos;s workspace is created as soon as your email is verified.
      </p>
      <div className="mt-8 rounded-xl border border-line bg-canvas p-5">
        <p className="text-sm font-medium text-navy-900">Didn&apos;t receive it?</p>
        <p className="mt-1 text-sm text-muted">Check your spam folder, or request a new link.</p>
        <div className="mt-4">
          <ResendVerificationForm email={address} />
        </div>
      </div>
      <p className="mt-8 text-sm text-muted">
        Already verified?{" "}
        <Link href="/sign-in" className="font-medium text-emerald-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
