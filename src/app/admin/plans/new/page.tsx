import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/misc";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "New plan" };

export default async function NewPlanPage() {
  await requirePlatformAdmin();
  return (
    <div className="max-w-4xl">
      <Link href="/admin/plans" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All plans
      </Link>
      <PageHeader eyebrow="Commercial" title="Create a plan" description="The plan key is permanent once created." className="mb-6" />
      <PlanForm plan={null} />
    </div>
  );
}
