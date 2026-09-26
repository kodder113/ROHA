/** Shared between the contact server action and the client form. */
export const CONTACT_TOPICS = [
  { value: "general", label: "General inquiry" },
  { value: "pricing", label: "Pricing and plans" },
  { value: "strategic", label: "ROHA Strategic consulting" },
  { value: "privacy", label: "Privacy and data protection" },
  { value: "support", label: "Product support" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === "string" && CONTACT_TOPICS.some((t) => t.value === value);
}

export type ContactField = "name" | "email" | "organization" | "topic" | "message";

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
  /** Echoed back on error so the form keeps what the visitor typed. */
  values?: Partial<Record<ContactField, string>>;
}

export const INITIAL_CONTACT_STATE: ContactFormState = { status: "idle" };
