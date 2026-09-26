import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Platform Administration", template: "%s · ROHA Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformAdmin();
  return <AdminShell email={user.email ?? null}>{children}</AdminShell>;
}
