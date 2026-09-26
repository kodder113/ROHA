/**
 * Verifies Stripe webhook → entitlement processing against a running app.
 * Requires the server to run with STRIPE_SECRET_KEY (any sk_test_ value) and
 * STRIPE_WEBHOOK_SECRET matching E2E_STRIPE_WEBHOOK_SECRET. No Stripe API
 * calls are made for one-time (payment mode) checkouts.
 *
 *   E2E_STRIPE_WEBHOOK_SECRET=whsec_... node e2e/stripe-webhook.mjs
 */
import Stripe from "stripe";
import { execSync } from "node:child_process";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const DB_URL = process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SECRET = process.env.E2E_STRIPE_WEBHOOK_SECRET;
if (!SECRET) throw new Error("Set E2E_STRIPE_WEBHOOK_SECRET");
const sql = (q) => execSync(`psql "${DB_URL}" -tAc ${JSON.stringify(q)}`, { encoding: "utf8" }).trim();
const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`   ✓ ${msg}`);
};
const stripe = new Stripe("sk_test_signing_only");

const orgId = sql("select id from organizations where not is_demo order by created_at limit 1");
if (!orgId) throw new Error("Run e2e/full-journey.mjs first to create an organization");
const before = Number(sql(`select count(*) from subscriptions s join plans p on p.id=s.plan_id where s.org_id='${orgId}' and p.key='professional' and s.source='stripe'`));

async function send(event, { sign = true } = {}) {
  const payload = JSON.stringify(event);
  const header = sign ? stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET }) : "t=1,v1=bad";
  return fetch(`${BASE}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": header, "content-type": "application/json" }, body: payload });
}

const eventId = `evt_test_${Date.now()}`;
const event = {
  id: eventId,
  object: "event",
  type: "checkout.session.completed",
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  api_version: "2026-08-26.dahlia",
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      object: "checkout.session",
      mode: "payment",
      payment_status: "paid",
      customer: "cus_test_123",
      metadata: { org_id: orgId, plan_key: "professional" },
    },
  },
};

console.log("[stripe] webhook signature verification");
assert((await send(event, { sign: false })).status === 400, "unsigned/invalid webhook rejected");

console.log("[stripe] one-time Professional purchase grants entitlement");
const res = await send(event);
assert(res.status === 200, "signed checkout.session.completed accepted");
const after = Number(sql(`select count(*) from subscriptions s join plans p on p.id=s.plan_id where s.org_id='${orgId}' and p.key='professional' and s.source='stripe'`));
assert(after === before + 1, "Professional subscription created (1 campaign credit)");
assert(sql(`select campaign_credits from subscriptions where stripe_checkout_session_id='${event.data.object.id}'`) === "1", "one campaign credit per purchase");
assert(sql(`select stripe_customer_id from organizations where id='${orgId}'`) === "cus_test_123", "Stripe customer linked (no card data stored)");

console.log("[stripe] idempotency");
assert((await send(event)).status === 200, "duplicate delivery acknowledged");
const again = Number(sql(`select count(*) from subscriptions s join plans p on p.id=s.plan_id where s.org_id='${orgId}' and p.key='professional' and s.source='stripe'`));
assert(again === after, "duplicate event does not grant a second credit");
assert(sql(`select count(*) from billing_events where id='${eventId}' and error is null`) === "1", "event recorded once in billing log");

console.log("\nSTRIPE WEBHOOK CHECKS PASSED");
