"use server";

import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { AdminActionError, type AdminActionContext, parseLimitOverrides, runAdminAction, zCheckbox, zId, zInt, zOptDate, zOptInt, zOptText } from "../_lib/action";

export async function setOrganizationStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ orgId: zId, status: z.enum(["active", "suspended"]), reason: zOptText(500) }), async ({ admin, input, audit }) => {
    const { data: org, error } = await admin
      .from("organizations")
      .update({ status: input.status })
      .eq("id", input.orgId)
      .select("id, name")
      .single();
    if (error) throw error;
    await audit({
      action: input.status === "suspended" ? "organization.suspended" : "organization.reactivated",
      targetType: "organization",
      targetId: org.id,
      orgId: org.id,
      metadata: { reason: input.reason },
    });
    return input.status === "suspended" ? `${org.name} has been suspended. Members can no longer access the organization.` : `${org.name} has been reactivated.`;
  });
}

export async function setDataRetention(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ orgId: zId, months: zInt(6, 120) }), async ({ admin, input, audit }) => {
    const { data: before } = await admin.from("organizations").select("data_retention_months").eq("id", input.orgId).single();
    const { error } = await admin.from("organizations").update({ data_retention_months: input.months }).eq("id", input.orgId);
    if (error) throw error;
    await audit({
      action: "organization.retention_updated",
      targetType: "organization",
      targetId: input.orgId,
      orgId: input.orgId,
      metadata: { from: before?.data_retention_months ?? null, to: input.months },
    });
    return `Data retention set to ${input.months} months.`;
  });
}

const grantSchema = z.object({
  orgId: zId,
  planId: zId,
  status: z.enum(["active", "trialing"]).default("active"),
  currentPeriodEnd: zOptDate,
  campaignCredits: zOptInt(0, 10_000),
  limitOverrides: zOptText(10_000),
  notes: zOptText(2000),
});

async function insertSubscription(
  ctx: AdminActionContext<z.infer<typeof grantSchema>>,
  source: "complimentary" | "manual",
) {
  const { admin, input, user } = ctx;
  const overrides = parseLimitOverrides(input.limitOverrides);
  const { data: plan, error: planError } = await admin.from("plans").select("id, key, name").eq("id", input.planId).single();
  if (planError || !plan) throw new AdminActionError("Select a valid plan.");
  const { data: sub, error } = await admin
    .from("subscriptions")
    .insert({
      org_id: input.orgId,
      plan_id: plan.id,
      status: input.status,
      source,
      current_period_end: input.currentPeriodEnd,
      campaign_credits: input.campaignCredits,
      limit_overrides: overrides,
      notes: input.notes,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { plan, sub, overrides };
}

export async function grantComplimentaryPilot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = grantSchema.extend({ pilotNotes: zOptText(2000) });
  return runAdminAction(formData, schema, async (ctx) => {
    const { admin, input, audit } = ctx;
    const { plan, sub, overrides } = await insertSubscription(ctx, "complimentary");
    const { error } = await admin.from("organizations").update({ is_pilot: true, pilot_notes: input.pilotNotes }).eq("id", input.orgId);
    if (error) throw error;
    await audit({
      action: "organization.pilot_granted",
      targetType: "subscription",
      targetId: sub.id,
      orgId: input.orgId,
      metadata: { plan: plan.key, current_period_end: input.currentPeriodEnd, limit_overrides: overrides },
    });
    return `Complimentary ${plan.name} pilot granted.`;
  });
}

export async function clearPilotFlag(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ orgId: zId }), async ({ admin, input, audit }) => {
    const { error } = await admin.from("organizations").update({ is_pilot: false }).eq("id", input.orgId);
    if (error) throw error;
    await audit({ action: "organization.pilot_cleared", targetType: "organization", targetId: input.orgId, orgId: input.orgId });
    return "Pilot flag removed. Existing complimentary subscriptions remain until canceled or expired.";
  });
}

export async function updatePilotNotes(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ orgId: zId, pilotNotes: zOptText(2000), isPilot: zCheckbox }), async ({ admin, input, audit }) => {
    const { error } = await admin.from("organizations").update({ pilot_notes: input.pilotNotes, is_pilot: input.isPilot }).eq("id", input.orgId);
    if (error) throw error;
    await audit({ action: "organization.pilot_updated", targetType: "organization", targetId: input.orgId, orgId: input.orgId, metadata: { is_pilot: input.isPilot } });
    return "Pilot details saved.";
  });
}

export async function grantManualSubscription(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, grantSchema, async (ctx) => {
    const { input, audit } = ctx;
    const { plan, sub, overrides } = await insertSubscription(ctx, "manual");
    await audit({
      action: "subscription.granted_manual",
      targetType: "subscription",
      targetId: sub.id,
      orgId: input.orgId,
      metadata: { plan: plan.key, status: input.status, current_period_end: input.currentPeriodEnd, campaign_credits: input.campaignCredits, limit_overrides: overrides },
    });
    return `Manual ${plan.name} subscription granted.`;
  });
}

export async function setSubscriptionStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdminAction(formData, z.object({ subscriptionId: zId, status: z.enum(["canceled", "expired"]) }), async ({ admin, input, audit }) => {
    const { data: before, error: loadError } = await admin.from("subscriptions").select("id, org_id, status, source").eq("id", input.subscriptionId).single();
    if (loadError || !before) throw new AdminActionError("Subscription not found.");
    const patch: { status: string; current_period_end?: string } = { status: input.status };
    if (input.status === "expired") patch.current_period_end = new Date().toISOString();
    const { error } = await admin.from("subscriptions").update(patch).eq("id", input.subscriptionId);
    if (error) throw error;
    await audit({
      action: `subscription.${input.status}`,
      targetType: "subscription",
      targetId: before.id,
      orgId: before.org_id,
      metadata: { from: before.status, to: input.status, source: before.source },
    });
    return before.source === "stripe"
      ? `Subscription marked ${input.status}. Note: this does not cancel billing in Stripe — cancel it in the Stripe dashboard as well.`
      : `Subscription marked ${input.status}.`;
  });
}

export async function updateSubscriptionLimits(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const schema = z.object({ subscriptionId: zId, limitOverrides: zOptText(10_000), currentPeriodEnd: zOptDate, notes: zOptText(2000) });
  return runAdminAction(formData, schema, async ({ admin, input, audit }) => {
    const overrides = parseLimitOverrides(input.limitOverrides);
    const { data: sub, error } = await admin
      .from("subscriptions")
      .update({ limit_overrides: overrides, current_period_end: input.currentPeriodEnd, notes: input.notes })
      .eq("id", input.subscriptionId)
      .select("id, org_id")
      .single();
    if (error) throw error;
    await audit({
      action: "subscription.limits_updated",
      targetType: "subscription",
      targetId: sub.id,
      orgId: sub.org_id,
      metadata: { limit_overrides: overrides, current_period_end: input.currentPeriodEnd },
    });
    return "Subscription limits saved.";
  });
}
