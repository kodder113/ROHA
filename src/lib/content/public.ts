import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { integrations } from "@/lib/env";
import { planFeaturesSchema, type PlanFeatures } from "@/lib/billing/entitlements";

export interface PublicDimension {
  key: string;
  code: string;
  name: string;
  description: string;
  questions: { key: string; focus: string; prompt: string; allowNa: boolean }[];
}

export interface PublicFramework {
  versionNumber: number;
  title: string;
  dimensions: PublicDimension[];
  qualitative: { key: string; prompt: string }[];
}

/**
 * The currently published ROHA framework, read from the database (questions
 * are never hardcoded in the UI). Returns null when the database is not
 * configured/reachable so public pages can degrade gracefully.
 */
export const getPublishedFramework = cache(async (): Promise<PublicFramework | null> => {
  if (!integrations.supabase() || !integrations.supabaseAdmin()) return null;
  try {
    const admin = createAdminClient();
    const { data: version } = await admin
      .from("assessment_versions")
      .select("id, version_number, title")
      .eq("status", "published")
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!version) return null;
    const [{ data: dims }, { data: qs }, { data: qual }] = await Promise.all([
      admin.from("dimensions").select("*").eq("version_id", version.id).order("sort_order"),
      admin.from("questions").select("*").eq("version_id", version.id).order("sort_order"),
      admin.from("qualitative_questions").select("key, prompt, sort_order").eq("version_id", version.id).order("sort_order"),
    ]);
    return {
      versionNumber: version.version_number,
      title: version.title,
      dimensions: (dims ?? []).map((d) => ({
        key: d.key,
        code: d.code,
        name: d.name,
        description: d.description,
        questions: (qs ?? [])
          .filter((q) => q.dimension_id === d.id)
          .map((q) => ({ key: q.key, focus: q.focus, prompt: q.prompt, allowNa: q.allow_na })),
      })),
      qualitative: (qual ?? []).map((q) => ({ key: q.key, prompt: q.prompt })),
    };
  } catch (err) {
    console.error("[content] failed to load framework", err);
    return null;
  }
});

export interface PublicPlan {
  key: string;
  name: string;
  tagline: string | null;
  description: string | null;
  priceCents: number | null;
  currency: string;
  billingInterval: "free" | "one_time" | "month" | "custom";
  maxResponsesPerCampaign: number | null;
  maxCampaigns: number | null;
  maxAdmins: number | null;
  features: PlanFeatures;
  bullets: string[];
}

/** Public plan catalogue (from the database; falls back to static defaults). */
export const getPublicPlans = cache(async (): Promise<PublicPlan[]> => {
  if (integrations.supabase() && integrations.supabaseAdmin()) {
    try {
      const { data } = await createAdminClient()
        .from("plans")
        .select("*")
        .eq("active", true)
        .eq("is_public", true)
        .order("sort_order");
      if (data && data.length > 0) {
        return data.map((p) => ({
          key: p.key,
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          priceCents: p.price_cents,
          currency: p.currency,
          billingInterval: p.billing_interval as PublicPlan["billingInterval"],
          maxResponsesPerCampaign: p.max_responses_per_campaign,
          maxCampaigns: p.max_campaigns,
          maxAdmins: p.max_admins,
          features: planFeaturesSchema.parse(p.features ?? {}),
          bullets: p.marketing_bullets,
        }));
      }
    } catch (err) {
      console.error("[content] failed to load plans", err);
    }
  }
  return FALLBACK_PLANS;
});

const FALLBACK_PLANS: PublicPlan[] = [
  {
    key: "discover", name: "ROHA Discover", tagline: "Free", description: "A first look at your organization's health with one assessment campaign.",
    priceCents: 0, currency: "usd", billingInterval: "free", maxResponsesPerCampaign: 25, maxCampaigns: 1, maxAdmins: 1,
    features: planFeaturesSchema.parse({}),
    bullets: ["One assessment campaign", "Up to 25 employee responses", "Basic organizational dashboard", "Basic executive summary"],
  },
  {
    key: "professional", name: "ROHA Professional", tagline: "$499 per assessment", description: "A comprehensive assessment with advanced reporting and AI-generated organizational analysis.",
    priceCents: 49900, currency: "usd", billingInterval: "one_time", maxResponsesPerCampaign: 100, maxCampaigns: 1, maxAdmins: 2,
    features: planFeaturesSchema.parse({ segment_comparisons: true, ai_report: "full", pdf_export: true, access_codes: true }),
    bullets: ["Comprehensive assessment", "Up to 100 employee responses", "Advanced reporting", "Departmental comparisons", "Executive PDF report", "AI-generated organizational analysis"],
  },
  {
    key: "enterprise", name: "ROHA Enterprise", tagline: "$199 per month", description: "Ongoing organizational intelligence with recurring assessments and historical comparisons.",
    priceCents: 19900, currency: "usd", billingInterval: "month", maxResponsesPerCampaign: 1000, maxCampaigns: null, maxAdmins: 10,
    features: planFeaturesSchema.parse({ segment_comparisons: true, ai_report: "full", pdf_export: true, historical_comparisons: true, recurring_assessments: true, advanced_dashboards: true, access_codes: true }),
    bullets: ["Recurring assessments", "Historical comparisons", "Advanced organizational dashboards", "Multiple administrators", "Ongoing executive intelligence"],
  },
  {
    key: "strategic", name: "ROHA Strategic", tagline: "Custom consulting engagement", description: "A Rodrik Consulting engagement combining ROHA with professional organizational diagnosis.",
    priceCents: null, currency: "usd", billingInterval: "custom", maxResponsesPerCampaign: null, maxCampaigns: null, maxAdmins: null,
    features: planFeaturesSchema.parse({ segment_comparisons: true, ai_report: "full", pdf_export: true, historical_comparisons: true, recurring_assessments: true, advanced_dashboards: true, access_codes: true, consulting: true }),
    bullets: ["Professional organizational diagnosis", "Executive interviews", "Strategic recommendations", "Transformation roadmap", "Rodrik Consulting engagement"],
  },
];
