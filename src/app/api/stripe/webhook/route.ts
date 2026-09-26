import { NextResponse, type NextRequest } from "next/server";
import { getStripe, processStripeEvent } from "@/lib/billing/stripe";
import { serverEnv } from "@/lib/env";
import { logAppError } from "@/lib/audit";

export const runtime = "nodejs";

/** Stripe webhook endpoint. Signature-verified; configure STRIPE_WEBHOOK_SECRET. */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = serverEnv.stripeWebhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    await processStripeEvent(stripe, event);
  } catch (err) {
    await logAppError("stripe.webhook", err, { eventId: event.id, type: event.type });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
