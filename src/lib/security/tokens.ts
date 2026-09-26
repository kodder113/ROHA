import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/** Keyed hash used for participation tokens and rate-limit keys. */
export function hmac(purpose: string, value: string): string {
  return createHmac("sha256", serverEnv.tokenSecret()).update(`${purpose}:${value}`).digest("hex");
}

/** Cryptographically random URL-safe token. */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Human-friendly single-use access code, e.g. "K7QM-3XRD-9PLA".
 * Excludes ambiguous characters (0/O, 1/I/L).
 */
export function accessCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

export function normalizeAccessCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3");
}

/** Hash of a participation token scoped to a campaign (the only form stored). */
export function participationHash(campaignToken: string, token: string): string {
  return hmac(`participation:${campaignToken}`, token);
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
