"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAccessCode, participationHash } from "@/lib/security/tokens";
import { rateLimitByClient, RateLimitError } from "@/lib/security/rate-limit";
import { logAppError } from "@/lib/audit";

const surveyToken = z.string().regex(/^[a-f0-9]{16,64}$/i);
const participantToken = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/);

export type ParticipationStatus = "issued" | "submitted" | "unknown";

/** Lets a returning browser know whether its token was already used. */
export async function checkParticipation(token: string, participant: string): Promise<ParticipationStatus> {
  const t = surveyToken.safeParse(token);
  const p = participantToken.safeParse(participant);
  if (!t.success || !p.success) return "unknown";
  try {
    await rateLimitByClient("survey-check", 120, 3600);
    const { data } = await createAdminClient().rpc("participation_token_status", {
      p_survey_token: t.data,
      p_token_hash: participationHash(t.data, p.data),
    });
    return (data as ParticipationStatus) ?? "unknown";
  } catch {
    return "unknown";
  }
}

export type AccessCodeResult = { ok: true; code: string } | { ok: false; error: string };

export async function verifyAccessCode(token: string, rawCode: string): Promise<AccessCodeResult> {
  const t = surveyToken.safeParse(token);
  const code = normalizeAccessCode(rawCode ?? "");
  if (!t.success || !/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return { ok: false, error: "Enter the 12-character access code you received (for example K7QM-3XRD-9PLA)." };
  }
  try {
    await rateLimitByClient("survey-code", 20, 3600);
    const { data } = await createAdminClient().rpc("participation_token_status", {
      p_survey_token: t.data,
      p_token_hash: participationHash(t.data, code),
    });
    if (data === "issued") return { ok: true, code };
    if (data === "submitted") return { ok: false, error: "This access code has already been used to submit a response." };
    return { ok: false, error: "This access code is not valid for this assessment." };
  } catch (err) {
    if (err instanceof RateLimitError) return { ok: false, error: err.message };
    return { ok: false, error: "We could not verify the code. Please try again." };
  }
}

const rating = z.number().int().min(1).max(5).nullable();

const submissionSchema = z.object({
  surveyToken,
  participant: z.string().min(1).max(128),
  mode: z.enum(["session", "access_code"]),
  profile: z.object({
    department_option_id: z.uuid().nullable().optional(),
    location_option_id: z.uuid().nullable().optional(),
    level_option_id: z.uuid().nullable().optional(),
    tenure_range: z.enum(["lt_1", "1_2", "3_5", "6_10", "gt_10"]).nullable().optional(),
  }),
  items: z
    .array(
      z.object({
        question_id: z.uuid(),
        current: rating,
        current_na: z.boolean(),
        desired: rating,
        desired_na: z.boolean(),
      }),
    )
    .min(1)
    .max(100),
  comments: z
    .array(z.object({ qualitative_question_id: z.uuid(), body: z.string().max(2000), consent_to_quote: z.boolean() }))
    .max(10),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type SubmissionResult = { ok: true } | { ok: false; code: string; error: string };

const ERRORS: Record<string, string> = {
  ROHA_DUPLICATE: "A response has already been submitted from this browser or with this access code. Thank you for participating.",
  ROHA_CLOSED: "This assessment is closed and is no longer accepting responses.",
  ROHA_NOT_OPEN: "This assessment is not open yet.",
  ROHA_NOT_FOUND: "This survey link is not valid.",
  ROHA_LIMIT: "This assessment has reached the maximum number of responses allowed for your organization's plan. Please let your organization's ROHA administrator know.",
  ROHA_INCOMPLETE: "Please answer every statement for both the current and desired state before submitting.",
  ROHA_TOKEN_INVALID: "Your access code is not valid for this assessment.",
  ROHA_INVALID_PROFILE: "One of your profile selections is no longer available. Please review the profile section.",
};

export async function submitSurvey(input: SubmissionInput): Promise<SubmissionResult> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "ROHA_INCOMPLETE", error: ERRORS.ROHA_INCOMPLETE };
  const data = parsed.data;
  const participant =
    data.mode === "access_code" ? normalizeAccessCode(data.participant) : participantToken.safeParse(data.participant).success ? data.participant : null;
  if (!participant) return { ok: false, code: "ROHA_TOKEN_INVALID", error: "Your session is invalid. Please reload the page." };

  try {
    await rateLimitByClient("survey-submit", 20, 3600);
  } catch (err) {
    if (err instanceof RateLimitError) return { ok: false, code: "RATE_LIMIT", error: err.message };
  }

  const { error } = await createAdminClient().rpc("submit_survey_response", {
    p_survey_token: data.surveyToken,
    p_token_hash: participationHash(data.surveyToken, participant),
    p_profile: data.profile,
    p_items: data.items,
    p_comments: data.comments.filter((c) => c.body.trim().length > 0),
  });
  if (error) {
    const code = Object.keys(ERRORS).find((k) => error.message.includes(k));
    if (code) return { ok: false, code, error: ERRORS[code] };
    await logAppError("survey.submit", error, { code: error.code });
    return { ok: false, code: "UNKNOWN", error: "We could not submit your response. Please try again in a moment — your answers are still saved on this device." };
  }
  return { ok: true };
}
