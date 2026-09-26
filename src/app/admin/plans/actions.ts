"use server";

import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { planFeaturesSchema } from "@/lib/billing/entitlements";
import type { Json } from "@/lib/database.types";
import { AdminActionError, runAdminAction, zCheckbox, zId, zInt, zOptInt, zOptText, zText } from "../_lib/action";

const FEATURE_KEYS = Object.keys(planFeaturesSchema.shape) as (keyof typeof planFeaturesSchema.shape)[];

const featureFields = Object.fromEntries(
  FEATURE_KEYS.map((k) => [`feature_${k}`, k === "ai_report" ? z.enum(["basic", "full"]).default("basic") : zCheckbox]),
) as Record<string, z.ZodType>;

const planFields = {
  name: zText(2, 120),
  tagline: zOptText(200),
  description: zOptText(2000),
  price_cents: zOptInt(0, 100_000_000),
  stripe_price_id: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().regex(/^price_[A-Za-z0-9]+$/, "Stripe price IDs look like price_…").nullable(),
  ),
  is_public: zCheckbox,
  active: zCheckbox,
  sort_order: zInt(0, 1000),
  max_campaigns: zOptInt(0),
  max_responses_per_campaign: zOptInt(1),
  max_admins: zOptInt(1),
  access_months: zOptInt(1, 1200),
  marketing_bullets: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().max(5000)),
  ...featureFields,
};

type PlanInput = { [K in keyof typeof planFields]: unknown } & Record<string, unknown>;

function buildPlanRow(input: PlanInput, existingFeatures: Json | null) {
  const base = existingFeatures && typeof existingFeatures === "object" && !Array.isArray(existingFeatures) ? existingFeatures : {};
  const features: Record<string, Json | undefined> = { ...base };
  for (const k of FEATURE_KEYS) features[k] = input[`feature_${k}`] as Json;
  const check = planFeaturesSchema.safeParse(features);
  if (!check.success) throw new AdminActionError("Invalid plan features.");
  const bullets = String(input.marketing_bullets)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20);
  return {
    name: input.name as string,
    tagline: input.tagline as string | null,
    description: input.description as string | null,
    price_cents: input.price_cents as number | null,
    stripe_price_id: input.stripe_price_id as string | null,
    is_public: input.is_public as boolean,
    active: input.active as boolean,
    sort_order: input.sort_order as number,
    max_campaigns: input.max_campaigns as number | null,
    max_responses_per_campaign: input.max_responses_per_campaign as number | null,
    max_admins: input.max_admins as number | null,
    access_months: input.access_months as number | null,
    features: features as Json,
    marketing_bullets: bullets,
  };
}

export async function updatePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ planId: zId, ...planFields }), async ({ admin, input, audit }) => {
    const { data: existing, error: loadError } = await admin.from("plans").select("*").eq("id", input.planId).single();
    if (loadError || !existing) throw new AdminActionError("Plan not found.");
    const row = buildPlanRow(input as PlanInput, existing.features);
    const { error } = await admin.from("plans").update(row).eq("id", existing.id);
    if (error) throw error;
    const changed = (Object.keys(row) as (keyof typeof row)[]).filter((k) => JSON.stringify(row[k]) !== JSON.stringify(existing[k]));
    await audit({ action: "plan.updated", targetType: "plan", targetId: existing.id, metadata: { key: existing.key, changed } });
    return `${row.name} saved.`;
  });
}

export async function createPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.object({
    key: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().regex(/^[a-z][a-z0-9_]*$/, "Lowercase letters, digits and underscores; must start with a letter").max(60)),
    billing_interval: z.enum(["free", "one_time", "month", "custom"]),
    currency: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim().toLowerCase() : "usd"), z.string().regex(/^[a-z]{3}$/, "Three-letter ISO currency code")),
    ...planFields,
  });
  return runAdminAction(formData, schema, async ({ admin, input, audit, user }) => {
    const row = buildPlanRow(input as PlanInput, null);
    const { data, error } = await admin
      .from("plans")
      .insert({ ...row, key: input.key, billing_interval: input.billing_interval, currency: input.currency })
      .select("id")
      .single();
    if (error) throw error;
    await audit({ action: "plan.created", targetType: "plan", targetId: data.id, metadata: { key: input.key, created_by: user.id } });
    return { message: "Plan created.", redirectTo: `/admin/plans/${data.id}?created=1` };
  });
}
