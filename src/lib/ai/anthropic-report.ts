import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { serverEnv } from "@/lib/env";
import { executiveReportSchema, type ExecutiveReport, type ReportInputSnapshot } from "./report-schema";

export class AIReportError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "AIReportError";
  }
}

export interface AIReportResult {
  report: ExecutiveReport;
  model: string;
  usage: Record<string, unknown>;
}

/** Models that support server-side refusal fallbacks with `fallbacks: "default"`. */
function supportsDefaultFallbacks(model: string): boolean {
  return /^claude-(opus-5|fable-5)/.test(model);
}

const TASK = `Write the ROHA Executive Organizational Intelligence Report for the organization described in the JSON below.

Sections to produce:
A. executive_summary — 2–4 short paragraphs summarizing the measured current state, the desired state, the largest gaps, participation and key caveats.
B. strengths — dimensions with relatively favorable current scores (usually 2–3).
C. development_opportunities — dimensions where current and desired scores differ most (usually 2–4).
D–I. leadership_analysis, cultural_analysis, employee_engagement, operational_effectiveness, innovation_readiness, strategic_alignment — for each: a summary, findings supported by the data (with evidence citing dimension or item keys and figures from the input), and hypotheses that would require further investigation (with how to investigate).
J. qualitative_themes — recurring topics in the employee comments (paraphrased, no quotes, no identifying details). If there are no comments, return an empty list.
K. organizational_priorities — practical issues leadership could investigate, each marked as based on a finding or a hypothesis.
L. action_plan — a 30/60/90-day roadmap of 6–9 actions, each with dimension, rationale, owner role, timeframe and a success metric.
Also include limitations — specific methodological limitations for this data set (sample size, participation, self-report, no benchmarks, suppression, cross-sectional design).

Assessment data (aggregates only; figures are official and already rounded):
`;

export async function generateAIReport(
  snapshot: ReportInputSnapshot,
  systemPrompt: string,
  options: { client?: Anthropic; model?: string } = {},
): Promise<AIReportResult> {
  const apiKey = serverEnv.anthropicApiKey();
  if (!apiKey && !options.client) throw new AIReportError("The Anthropic API key is not configured (ANTHROPIC_API_KEY).", false);
  const model = options.model ?? serverEnv.anthropicModel();
  const client = options.client ?? new Anthropic({ apiKey, timeout: 15 * 60 * 1000, maxRetries: 2 });

  const useFallbacks = supportsDefaultFallbacks(model);
  // Pass only the JSON schema (no auto-parse) so stop reasons can be inspected
  // before the output is validated.
  const { schema } = betaZodOutputFormat(executiveReportSchema);
  try {
    const stream = client.beta.messages.stream({
      model,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: "json_schema", schema } },
      ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      system: systemPrompt,
      messages: [{ role: "user", content: TASK + JSON.stringify(snapshot, null, 2) }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new AIReportError("The AI model declined to generate this report. Please try again or contact support.", false);
    }
    if (message.stop_reason === "max_tokens") {
      throw new AIReportError("The AI report was too long and was cut off. Please try again.", true);
    }
    const text = message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AIReportError("The AI response was not valid JSON.", true);
    }
    const validated = executiveReportSchema.safeParse(parsed);
    if (!validated.success) {
      throw new AIReportError("The AI response did not match the required report structure.", true);
    }
    return {
      report: validated.data,
      model: message.model,
      usage: JSON.parse(JSON.stringify(message.usage)) as Record<string, unknown>,
    };
  } catch (err) {
    if (err instanceof AIReportError) throw err;
    if (err instanceof Anthropic.AuthenticationError) throw new AIReportError("The Anthropic API key was rejected.", false);
    if (err instanceof Anthropic.PermissionDeniedError) throw new AIReportError("The Anthropic API key does not have access to this model.", false);
    if (err instanceof Anthropic.NotFoundError) throw new AIReportError(`The configured AI model "${model}" was not found.`, false);
    if (err instanceof Anthropic.RateLimitError) throw new AIReportError("The AI service is rate limited. Please try again in a few minutes.", true);
    if (err instanceof Anthropic.BadRequestError) throw new AIReportError(`The AI service rejected the request: ${err.message}`, false);
    if (err instanceof Anthropic.APIError) throw new AIReportError(`The AI service returned an error (${err.status ?? "unknown"}). Please try again.`, true);
    if (err instanceof Anthropic.APIConnectionError) throw new AIReportError("Could not reach the AI service. Please try again.", true);
    throw err;
  }
}
