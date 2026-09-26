import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { Alert } from "@/components/ui/alert";
import { param, type SearchParamsRecord } from "@/components/admin/table";
import { formatDateTime } from "@/lib/utils";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "Edit plan" };

export default async function EditPlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParamsRecord> }) {
  await requirePlatformAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: plan } = await createAdminClient().from("plans").select("*").eq("id", id).maybeSingle();
  if (!plan) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/plans" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All plans
      </Link>
      <PageHeader eyebrow="Edit plan" title={plan.name} description={`Last updated ${formatDateTime(plan.updated_at)}`} className="mb-6" />
      {param(sp, "created") ? (
        <Alert tone="success" className="mb-6">
          Plan created.
        </Alert>
      ) : null}
      <PlanForm plan={plan} />
    </div>
  );
}
