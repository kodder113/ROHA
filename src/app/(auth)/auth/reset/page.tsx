import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "../../forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  await requireUser("/auth/forgot");
  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-semibold text-navy-900">Choose a new password</h1>
      <p className="mt-2 text-muted">Your new password will apply the next time you sign in.</p>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
