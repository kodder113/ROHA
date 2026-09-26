"use server";

import { z } from "zod";
import { logAppError } from "@/lib/audit";
import { BRAND } from "@/lib/brand";
import { integrations } from "@/lib/env";
import { RateLimitError, rateLimitByClient } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTACT_TOPICS, type ContactField, type ContactFormState } from "@/components/marketing/contact-shared";

const topicValues = CONTACT_TOPICS.map((t) => t.value) as [string, ...string[]];

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120, "Please use 120 characters or fewer."),
  email: z.string().trim().toLowerCase().max(254, "Please use a shorter email address.").pipe(z.email("Please enter a valid email address.")),
  organization: z
    .string()
    .trim()
    .max(160, "Please use 160 characters or fewer.")
    .transform((v) => (v.length > 0 ? v : null)),
  topic: z.enum(topicValues, { error: "Please choose a topic." }),
  message: z
    .string()
    .trim()
    .min(10, "Please include a little more detail (at least 10 characters).")
    .max(5000, "Please keep your message under 5,000 characters."),
});

const UNAVAILABLE = `Our contact form is temporarily unavailable. Please reach us through ${BRAND.companyUrl.replace("https://", "")} and we will respond as soon as possible.`;

function read(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function submitContactInquiry(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const values = {
    name: read(formData, "name"),
    email: read(formData, "email"),
    organization: read(formData, "organization"),
    topic: read(formData, "topic"),
    message: read(formData, "message"),
  };

  // Honeypot: real visitors never see or fill this field.
  if (read(formData, "website").length > 0) {
    return { status: "success", message: "Thank you. Your message has been received." };
  }

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ContactField | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please review the highlighted fields.", fieldErrors, values };
  }

  if (!integrations.supabase() || !integrations.supabaseAdmin()) {
    return { status: "error", message: UNAVAILABLE, values };
  }

  try {
    await rateLimitByClient("contact", 5, 3600);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        status: "error",
        message: "You have sent several messages recently. Please wait a while before trying again.",
        values,
      };
    }
    throw err;
  }

  try {
    const { error } = await createAdminClient().from("contact_inquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization,
      topic: parsed.data.topic,
      message: parsed.data.message,
    });
    if (error) throw error;
  } catch (err) {
    await logAppError("contact.submit", err, { topic: parsed.data.topic });
    return { status: "error", message: UNAVAILABLE, values };
  }

  return {
    status: "success",
    message: `Thank you, ${parsed.data.name.split(/\s+/)[0]}. Your message has been received, and a member of the ${BRAND.company} team will reply by email.`,
  };
}
