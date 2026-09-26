/**
 * Server-side entitlement resolution. Pure — callers load the records.
 *
 * Model:
 *  - Every organization receives a free ROHA Discover subscription at
 *    registration (no payment configuration required).
 *  - Each paid purchase or complimentary grant is its own subscription row.
 *  - Campaigns record the subscription they consumed capacity from.
 *  - Features come from the highest-ranked active subscription; campaign
 *    capacity can be drawn from any active subscription with room left.
 */
import { z } from "zod";

export const planFeaturesSchema = z.object({
  segment_comparisons: z.boolean().default(false),
  ai_report: z.enum(["basic", "full"]).default("basic"),
  pdf_export: z.boolean().default(false),
  historical_comparisons: z.boolean().default(false),
  recurring_assessments: z.boolean().default(false),
  advanced_dashboards: z.boolean().default(false),
  access_codes: z.boolean().default(false),
  consulting: z.boolean().default(false),
});
export type PlanFeatures = z.infer<typeof planFeaturesSchema>;

export const limitOverridesSchema = z
  .object({
    max_campaigns: z.number().int().min(0).nullable().optional(),
    max_responses_per_campaign: z.number().int().min(1).nullable().optional(),
    max_admins: z.number().int().min(1).nullable().optional(),
    features: planFeaturesSchema.partial().optional(),
  })
  .default({});
export type LimitOverrides = z.infer<typeof limitOverridesSchema>;

export interface PlanRecord {
  id: string;
  key: string;
  name: string;
  billing_interval: "free" | "one_time" | "month" | "custom";
  sort_order: number;
  max_campaigns: number | null;
  max_responses_per_campaign: number | null;
  max_admins: number | null;
  features: unknown;
}

export interface SubscriptionRecord {
  id: string;
  status: string;
  source: "free" | "stripe" | "complimentary" | "manual";
  campaign_credits: number | null;
  limit_overrides: unknown;
  started_at: string;
  current_period_end: string | null;
  plan: PlanRecord;
}

export interface EffectiveLimits {
  maxCampaigns: number | null;
  maxResponsesPerCampaign: number | null;
  maxAdmins: number | null;
  features: PlanFeatures;
}

export interface SubscriptionCapacity {
  subscriptionId: string;
  planKey: string;
  limits: EffectiveLimits;
  campaignsUsed: number;
  campaignsRemaining: number | null; // null = unlimited
}

export interface Entitlements {
  hasActiveSubscription: boolean;
  planKey: string | null;
  planName: string | null;
  source: SubscriptionRecord["source"] | null;
  primarySubscriptionId: string | null;
  expiresAt: string | null;
  features: PlanFeatures;
  maxResponsesPerCampaign: number | null;
  maxAdmins: number | null;
  campaignsRemaining: number | null;
  /** Subscription to charge the next new campaign against, if any. */
  nextCampaignSubscriptionId: string | null;
  capacities: SubscriptionCapacity[];
}

const NO_FEATURES: PlanFeatures = planFeaturesSchema.parse({});

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function isSubscriptionActive(sub: Pick<SubscriptionRecord, "status" | "current_period_end">, now: Date): boolean {
  if (!ACTIVE_STATUSES.has(sub.status)) return false;
  if (sub.current_period_end && new Date(sub.current_period_end).getTime() <= now.getTime()) return false;
  return true;
}

export function effectiveLimits(sub: SubscriptionRecord): EffectiveLimits {
  const planFeatures = planFeaturesSchema.parse(sub.plan.features ?? {});
  const overrides = limitOverridesSchema.parse(sub.limit_overrides ?? {});
  const baseCampaigns =
    sub.plan.billing_interval === "one_time" && sub.plan.max_campaigns !== null && sub.campaign_credits !== null
      ? sub.plan.max_campaigns * sub.campaign_credits
      : sub.plan.max_campaigns;
  return {
    maxCampaigns: overrides.max_campaigns !== undefined ? overrides.max_campaigns : baseCampaigns,
    maxResponsesPerCampaign:
      overrides.max_responses_per_campaign !== undefined
        ? overrides.max_responses_per_campaign
        : sub.plan.max_responses_per_campaign,
    maxAdmins: overrides.max_admins !== undefined ? overrides.max_admins : sub.plan.max_admins,
    features: { ...planFeatures, ...(overrides.features ?? {}) },
  };
}

export function resolveEntitlements(
  subscriptions: SubscriptionRecord[],
  campaignCountsBySubscription: Record<string, number>,
  now: Date = new Date(),
): Entitlements {
  const active = subscriptions
    .filter((s) => isSubscriptionActive(s, now))
    .sort((a, b) => b.plan.sort_order - a.plan.sort_order || a.started_at.localeCompare(b.started_at));

  if (active.length === 0) {
    return {
      hasActiveSubscription: false,
      planKey: null,
      planName: null,
      source: null,
      primarySubscriptionId: null,
      expiresAt: null,
      features: NO_FEATURES,
      maxResponsesPerCampaign: null,
      maxAdmins: 1,
      campaignsRemaining: 0,
      nextCampaignSubscriptionId: null,
      capacities: [],
    };
  }

  const capacities: SubscriptionCapacity[] = active.map((s) => {
    const limits = effectiveLimits(s);
    const used = campaignCountsBySubscription[s.id] ?? 0;
    return {
      subscriptionId: s.id,
      planKey: s.plan.key,
      limits,
      campaignsUsed: used,
      campaignsRemaining: limits.maxCampaigns === null ? null : Math.max(0, limits.maxCampaigns - used),
    };
  });

  const primary = active[0];
  const primaryLimits = capacities[0].limits;

  // Draw capacity from the highest-ranked subscription that still has room.
  const withRoom = capacities.find((c) => c.campaignsRemaining === null || c.campaignsRemaining > 0) ?? null;
  const unlimited = capacities.some((c) => c.campaignsRemaining === null);
  const totalRemaining = unlimited ? null : capacities.reduce((sum, c) => sum + (c.campaignsRemaining ?? 0), 0);

  // Admin seats: the most generous active subscription applies.
  const adminLimits = capacities.map((c) => c.limits.maxAdmins);
  const maxAdmins = adminLimits.some((a) => a === null) ? null : Math.max(...(adminLimits as number[]));

  return {
    hasActiveSubscription: true,
    planKey: primary.plan.key,
    planName: primary.plan.name,
    source: primary.source,
    primarySubscriptionId: primary.id,
    expiresAt: primary.current_period_end,
    features: primaryLimits.features,
    maxResponsesPerCampaign: withRoom ? withRoom.limits.maxResponsesPerCampaign : primaryLimits.maxResponsesPerCampaign,
    maxAdmins,
    campaignsRemaining: totalRemaining,
    nextCampaignSubscriptionId: withRoom?.subscriptionId ?? null,
    capacities,
  };
}

export class EntitlementError extends Error {
  constructor(
    message: string,
    public readonly code: "campaign_limit" | "feature_unavailable" | "admin_limit" | "no_subscription",
  ) {
    super(message);
    this.name = "EntitlementError";
  }
}

export function assertCanCreateCampaign(ent: Entitlements): string {
  if (!ent.hasActiveSubscription) {
    throw new EntitlementError("Your organization does not have an active ROHA plan.", "no_subscription");
  }
  if (!ent.nextCampaignSubscriptionId) {
    throw new EntitlementError(
      "Your current plan has no remaining assessment campaigns. Upgrade to create another assessment.",
      "campaign_limit",
    );
  }
  return ent.nextCampaignSubscriptionId;
}

export function assertFeature(ent: Entitlements, feature: keyof PlanFeatures): void {
  const value = ent.features[feature];
  const enabled = feature === "ai_report" ? value === "full" : Boolean(value);
  if (!enabled) {
    throw new EntitlementError("This feature is not included in your current ROHA plan.", "feature_unavailable");
  }
}

export function assertCanAddAdmin(ent: Entitlements, currentAdmins: number): void {
  if (ent.maxAdmins !== null && currentAdmins >= ent.maxAdmins) {
    throw new EntitlementError(
      `Your plan allows ${ent.maxAdmins} administrator${ent.maxAdmins === 1 ? "" : "s"}. Upgrade to ROHA Enterprise for multiple administrators.`,
      "admin_limit",
    );
  }
}
