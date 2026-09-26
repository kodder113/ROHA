import { describe, expect, it } from "vitest";
import {
  assertCanAddAdmin,
  assertCanCreateCampaign,
  assertFeature,
  EntitlementError,
  resolveEntitlements,
  type PlanRecord,
  type SubscriptionRecord,
} from "./entitlements";

const plans: Record<string, PlanRecord> = {
  discover: {
    id: "p1", key: "discover", name: "ROHA Discover", billing_interval: "free", sort_order: 1,
    max_campaigns: 1, max_responses_per_campaign: 25, max_admins: 1,
    features: { segment_comparisons: false, ai_report: "basic", pdf_export: false },
  },
  professional: {
    id: "p2", key: "professional", name: "ROHA Professional", billing_interval: "one_time", sort_order: 2,
    max_campaigns: 1, max_responses_per_campaign: 100, max_admins: 2,
    features: { segment_comparisons: true, ai_report: "full", pdf_export: true },
  },
  enterprise: {
    id: "p3", key: "enterprise", name: "ROHA Enterprise", billing_interval: "month", sort_order: 3,
    max_campaigns: null, max_responses_per_campaign: 1000, max_admins: 10,
    features: { segment_comparisons: true, ai_report: "full", pdf_export: true, historical_comparisons: true },
  },
};

let idSeq = 0;
function sub(plan: keyof typeof plans, extra: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  idSeq += 1;
  return {
    id: `s${idSeq}`,
    status: "active",
    source: plan === "discover" ? "free" : "stripe",
    campaign_credits: plan === "professional" ? 1 : null,
    limit_overrides: {},
    started_at: `2026-01-0${idSeq % 9 || 1}T00:00:00Z`,
    current_period_end: null,
    plan: plans[plan],
    ...extra,
  };
}

const NOW = new Date("2026-09-26T00:00:00Z");

describe("resolveEntitlements", () => {
  it("free Discover works without any payment configuration: one campaign, 25 responses, basic features", () => {
    const s = sub("discover");
    const ent = resolveEntitlements([s], {}, NOW);
    expect(ent.planKey).toBe("discover");
    expect(ent.campaignsRemaining).toBe(1);
    expect(ent.maxResponsesPerCampaign).toBe(25);
    expect(assertCanCreateCampaign(ent)).toBe(s.id);
    expect(() => assertFeature(ent, "pdf_export")).toThrow(EntitlementError);
    expect(() => assertFeature(ent, "ai_report")).toThrow(EntitlementError);
  });

  it("blocks a second Discover campaign", () => {
    const s = sub("discover");
    const ent = resolveEntitlements([s], { [s.id]: 1 }, NOW);
    expect(ent.campaignsRemaining).toBe(0);
    expect(() => assertCanCreateCampaign(ent)).toThrow(/no remaining assessment campaigns/);
  });

  it("a Professional purchase grants one more campaign with 100 responses and full features", () => {
    const d = sub("discover");
    const p = sub("professional");
    const ent = resolveEntitlements([d, p], { [d.id]: 1 }, NOW);
    expect(ent.planKey).toBe("professional");
    expect(assertCanCreateCampaign(ent)).toBe(p.id);
    expect(ent.maxResponsesPerCampaign).toBe(100);
    expect(() => assertFeature(ent, "pdf_export")).not.toThrow();
    expect(() => assertFeature(ent, "ai_report")).not.toThrow();
    expect(() => assertFeature(ent, "historical_comparisons")).toThrow();
  });

  it("uses remaining Discover capacity before consuming a paid credit only when ranked lower", () => {
    const d = sub("discover");
    const p = sub("professional");
    const ent = resolveEntitlements([d, p], {}, NOW);
    // Highest-ranked subscription with room is charged first.
    expect(ent.nextCampaignSubscriptionId).toBe(p.id);
    expect(ent.campaignsRemaining).toBe(2);
  });

  it("Enterprise is unlimited while active and stops when canceled or expired", () => {
    const e = sub("enterprise", { current_period_end: "2026-10-26T00:00:00Z" });
    expect(resolveEntitlements([e], { [e.id]: 40 }, NOW).campaignsRemaining).toBeNull();
    const expired = sub("enterprise", { current_period_end: "2026-09-01T00:00:00Z" });
    expect(resolveEntitlements([expired], {}, NOW).hasActiveSubscription).toBe(false);
    const canceled = sub("enterprise", { status: "canceled" });
    expect(() => assertCanCreateCampaign(resolveEntitlements([canceled], {}, NOW))).toThrow(/active ROHA plan/);
  });

  it("falls back to lower plans when a paid plan lapses", () => {
    const d = sub("discover");
    const e = sub("enterprise", { status: "past_due" });
    const ent = resolveEntitlements([d, e], {}, NOW);
    expect(ent.planKey).toBe("discover");
  });

  it("applies complimentary pilot overrides", () => {
    const pilot = sub("professional", {
      source: "complimentary",
      campaign_credits: 1,
      limit_overrides: { max_campaigns: 3, max_responses_per_campaign: 250, features: { historical_comparisons: true } },
    });
    const ent = resolveEntitlements([pilot], { [pilot.id]: 1 }, NOW);
    expect(ent.source).toBe("complimentary");
    expect(ent.campaignsRemaining).toBe(2);
    expect(ent.maxResponsesPerCampaign).toBe(250);
    expect(() => assertFeature(ent, "historical_comparisons")).not.toThrow();
  });

  it("enforces administrator seats", () => {
    const ent = resolveEntitlements([sub("discover")], {}, NOW);
    expect(() => assertCanAddAdmin(ent, 1)).toThrow(/Enterprise/);
    const ent2 = resolveEntitlements([sub("enterprise")], {}, NOW);
    expect(() => assertCanAddAdmin(ent2, 3)).not.toThrow();
  });
});
