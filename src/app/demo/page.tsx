import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { integrations } from "@/lib/env";
import { getHistoricalTrend, getResultsView } from "@/lib/results/service";
import { planFeaturesSchema } from "@/lib/billing/entitlements";
import { ResultsDashboard } from "@/components/dashboard";
import { RohaLogo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Demonstration dashboard (synthetic data)",
  description: "Explore the ROHA executive dashboard using clearly labeled, computer-generated demonstration data.",
};

export const dynamic = "force-dynamic";

async function loadDemo() {
  if (!integrations.supabase() || !integrations.supabaseAdmin()) return null;
  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id, name").eq("is_demo", true).limit(1).maybeSingle();
  if (!org) return null;
  const { data: campaign } = await admin
    .from("campaigns")
    .select("*")
    .eq("org_id", org.id)
    .eq("status", "closed")
    .order("closes_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!campaign) return null;
  const view = await getResultsView(campaign);
  if (view.status !== "ready") return null;
  return { org, campaign, view, trend: await getHistoricalTrend(org.id) };
}

export default async function DemoPage() {
  const demo = await loadDemo();
  const allFeatures = planFeaturesSchema.parse({
    segment_comparisons: true,
    ai_report: "full",
    pdf_export: true,
    historical_comparisons: true,
    recurring_assessments: true,
    advanced_dashboards: true,
    access_codes: true,
  });
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <RohaLogo />
          <div className="flex gap-2">
            <ButtonLink href="/sign-in" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </ButtonLink>
            <ButtonLink href="/get-started" size="sm">
              Start your free assessment
            </ButtonLink>
          </div>
        </div>
      </header>
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm text-amber-900 sm:px-6">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <strong>Demonstration only.</strong> This dashboard uses synthetic, computer-generated responses for a fictional
            organization. It does not describe any real organization, employee or client.
          </p>
        </div>
      </div>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-12">
        {demo ? (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{demo.org.name}</p>
              <h1 className="mt-1 text-3xl font-semibold text-navy-900">{demo.campaign.name}</h1>
              <p className="mt-2 max-w-3xl text-muted">
                Explore every visualization and filter available on the full ROHA dashboard. Groups with fewer than five respondents
                are hidden exactly as they would be for a real organization.
              </p>
            </div>
            <ResultsDashboard view={demo.view} features={allFeatures} trend={demo.trend} campaignName={demo.campaign.name} isDemo />
          </>
        ) : (
          <EmptyState
            title="The demonstration workspace is not available"
            description="The demonstration data has not been loaded in this environment. Run supabase/seed.sql to create it."
            action={<Link href="/" className="text-sm font-medium text-emerald-700">Return home</Link>}
          />
        )}
      </main>
    </div>
  );
}
