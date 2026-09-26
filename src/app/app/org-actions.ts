"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMemberships, ORG_COOKIE } from "@/lib/auth/session";

export async function switchOrganization(formData: FormData): Promise<void> {
  const orgId = String(formData.get("orgId") ?? "");
  const memberships = await getMemberships();
  if (!memberships.some((m) => m.org.id === orgId)) redirect("/app");
  (await cookies()).set(ORG_COOKIE, orgId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  redirect("/app");
}
