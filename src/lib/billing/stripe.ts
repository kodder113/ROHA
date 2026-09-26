import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import type { Json } from "@/lib/database.types";

let cached: Stripe | null = null;

/** Returns a Stripe client, or null when payments are not configured. Free plans never need this. */
export function getStripe(): Stripe | null {
  const key = serverEnv.stripeSecretKey();
  if (!key) return null;
  if (!cached) cached = new Stripe(key, { appInfo: { name: "ROHA", url: "https://rodrikconsulting.com" } });
  return cached;
}

/** Latest period end across a subscription's items (Stripe moved this field to items). */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): string | null {
  const ends = sub.items.data.map((i) => i.current_period_end).filter((v): v is number => typeof v === "number");
  return ends.length ? new Date(Math.max(...ends) * 1000).toISOString() : null;
}

export function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "trialing" | "past_due" | "canceled" | "expired" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    default:
      return "incomplete";
  }
}

/**
 * Applies a verified Stripe event to ROHA subscriptions. Idempotent: events are
 * recorded in billing_events and processed at most once. No card data is ever
 * stored — only Stripe object identifiers.
 */
export async function processStripeEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
  const admin = createAdminClient();
  const { data: seen } = await admin.from("billing_events").select("id, error").eq("id", event.id).maybeSingle();
  if (seen && !seen.error) return; // already processed successfully; failed events are retried

  let orgId: string | null = null;
  let errorText: string | null = null;
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        orgId = session.metadata?.org_id ?? null;
        const planKey = session.metadata?.plan_key;
        if (!orgId || !planKey) throw new Error("Checkout session is missing ROHA metadata");
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") break;
        const { data: plan } = await admin.from("plans").select("*").eq("key", planKey).single();
        if (!plan) throw new Error(`Unknown plan ${planKey}`);

        if (session.mode === "payment") {
          const end = plan.access_months ? new Date(Date.now() + plan.access_months * 30.44 * 86400_000).toISOString() : null;
          await admin.from("subscriptions").upsert(
            {
              org_id: orgId,
              plan_id: plan.id,
              status: "active",
              source: "stripe",
              campaign_credits: 1,
              current_period_end: end,
              stripe_checkout_session_id: session.id,
            },
            { onConflict: "stripe_checkout_session_id" },
          );
        } else if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
          await admin.from("subscriptions").upsert(
            {
              org_id: orgId,
              plan_id: plan.id,
              status: mapStripeStatus(sub.status),
              source: "stripe",
              current_period_end: subscriptionPeriodEnd(sub),
              stripe_subscription_id: sub.id,
              stripe_checkout_session_id: session.id,
            },
            { onConflict: "stripe_subscription_id" },
          );
        }
        if (typeof session.customer === "string") {
          await admin.from("organizations").update({ stripe_customer_id: session.customer }).eq("id", orgId).is("stripe_customer_id", null);
        }
        await logAudit({ orgId, action: "billing.checkout_completed", targetType: "plan", targetId: planKey, metadata: { mode: session.mode } });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { data: existing } = await admin.from("subscriptions").select("id, org_id").eq("stripe_subscription_id", sub.id).maybeSingle();
        if (!existing) break; // created via checkout handler
        orgId = existing.org_id;
        const status = event.type === "customer.subscription.deleted" ? "canceled" : mapStripeStatus(sub.status);
        await admin
          .from("subscriptions")
          .update({ status, current_period_end: subscriptionPeriodEnd(sub) })
          .eq("id", existing.id);
        await logAudit({ orgId, action: "billing.subscription_updated", targetType: "subscription", targetId: existing.id, metadata: { status } });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    errorText = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    await admin.from("billing_events").upsert({
      id: event.id,
      type: event.type,
      org_id: orgId,
      payload: { id: event.id, type: event.type, created: event.created, livemode: event.livemode } as Json,
      error: errorText,
    });
  }
}
