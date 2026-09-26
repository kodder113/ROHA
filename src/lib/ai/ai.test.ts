import { describe, expect, it } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_SCORING_CONFIG } from "@/lib/scoring/config";
import { fixtureDimensions, fixtureQuestions, responseFrom } from "@/lib/scoring/fixtures";
import { scorePopulation } from "@/lib/results/segments";
import { buildReportSnapshot } from "./snapshot";
import { generateRulesReport } from "./rules-report";
import { findUnsupportedNumbers } from "./validate";
import { executiveReportSchema, type ExecutiveReport } from "./report-schema";
import { generateAIReport, AIReportError } from "./anthropic-report";
import type { ResultsPayload } from "@/lib/results/types";

function makeSnapshot() {
  let s = 7;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const responses = Array.from({ length: 30 }, () =>
    responseFrom((q) => ({ current: 1 + Math.floor(rand() * 5), desired: q.allowNa && rand() < 0.1 ? "NA" : 3 + Math.floor(rand() * 3) })),
  );
  const overall = scorePopulation(responses, { dimensions: fixtureDimensions, questions: fixtureQuestions, config: DEFAULT_SCORING_CONFIG });
  const payload: ResultsPayload = {
    engineVersion: overall.engineVersion,
    scoringRuleVersion: 1,
    assessmentVersion: 1,
    minGroupSize: 5,
    computedAt: "2026-09-01T00:00:00Z",
    overall,
    segments: {},
    qualitative: [
      { key: "does_well", prompt: "What is one thing this organization does particularly well?", commentCount: 2, quotes: [] },
      { key: "makes_harder", prompt: "What makes work harder?", commentCount: 1, quotes: [] },
      { key: "recommend", prompt: "Recommend one improvement", commentCount: 0, quotes: [] },
    ],
    privacyMode: "confidential",
  };
  return buildReportSnapshot({
    organization: { name: "Test Org", industry: "Healthcare", employee_count_range: "100-249" },
    campaign: { id: "c1", name: "Baseline", closed_at: "2026-09-01T00:00:00Z", closes_at: "2026-09-01T00:00:00Z", privacy_mode: "confidential" },
    payload,
    participation: { responses: 30, validResponses: 30, expected: 40, rate: 75, daily: [] },
    comments: { does_well: ["Teams collaborate [email removed]", "Good onboarding"], makes_harder: ["Slow approvals"], recommend: [] },
  });
}

describe("report input snapshot (data sent to the AI provider)", () => {
  it("contains only aggregates — no demographics, subgroup results or individual responses", () => {
    const snap = makeSnapshot();
    const json = JSON.stringify(snap);
    expect(snap.segmentsIncluded).toBe(false);
    for (const forbidden of ["department", "location", "tenure", "level_option", "response_id", "profile", "email"]) {
      expect(json.toLowerCase()).not.toContain(`"${forbidden}`);
    }
    expect(snap.items).toHaveLength(24);
    expect(snap.dimensions).toHaveLength(6);
    // Numbers are rounded to one decimal place.
    for (const d of snap.dimensions) if (d.current !== null) expect(Math.round(d.current * 10) / 10).toBe(d.current);
  });
});

describe("rules-based executive summary", () => {
  it("produces a schema-valid report whose numbers all match the official aggregates", () => {
    const snap = makeSnapshot();
    const report = generateRulesReport(snap);
    expect(executiveReportSchema.safeParse(report).success).toBe(true);
    expect(findUnsupportedNumbers(report, snap)).toEqual([]);
    expect(report.executive_summary).toContain(snap.overall.currentIndex!.toFixed(1));
    expect(report.action_plan.every((a) => ["30", "60", "90"].includes(a.phase))).toBe(true);
  });
});

describe("numeric consistency validator", () => {
  it("flags statistics that do not appear in the input", () => {
    const snap = makeSnapshot();
    const report = generateRulesReport(snap);
    const tampered: ExecutiveReport = { ...report, executive_summary: `${report.executive_summary} Productivity rose 137.9% and 412 employees agreed.` };
    const warnings = findUnsupportedNumbers(tampered, snap);
    expect(warnings.map((w) => w.value)).toEqual(expect.arrayContaining(["137.9", "412"]));
  });

  it("ignores item keys, years and plan phases", () => {
    const snap = makeSnapshot();
    const report = generateRulesReport(snap);
    const ok: ExecutiveReport = { ...report, executive_summary: "Items LE1 and SA4 were reviewed in 2026 within the first 30 days." };
    expect(findUnsupportedNumbers(ok, snap)).toEqual([]);
  });
});

/** Builds a Server-Sent Events body that mimics the Messages streaming API. */
function sse(events: Record<string, unknown>[]): string {
  return events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
}

function fakeClient(reportJson: string, stopReason = "end_turn") {
  const captured: { body?: Record<string, unknown>; headers?: Headers } = {};
  const client = new Anthropic({
    apiKey: "test-key",
    maxRetries: 0,
    fetch: async (_url, init) => {
      captured.body = JSON.parse(String(init?.body));
      captured.headers = new Headers(init?.headers);
      const half = Math.floor(reportJson.length / 2);
      const body = sse([
        { type: "message_start", message: { id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 100, output_tokens: 0 } } },
        { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
        { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: reportJson.slice(0, half) } },
        { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: reportJson.slice(half) } },
        { type: "content_block_stop", index: 0 },
        { type: "message_delta", delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 500 } },
        { type: "message_stop" },
      ]);
      return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
    },
  });
  return { client, captured };
}

describe("Anthropic report generation (mocked API)", () => {
  it("sends aggregates with structured output, adaptive thinking and refusal fallbacks, and parses the result", async () => {
    const snap = makeSnapshot();
    const expected = generateRulesReport(snap);
    const { client, captured } = fakeClient(JSON.stringify(expected));
    const result = await generateAIReport(snap, "SYSTEM PROMPT", { client, model: "claude-opus-5" });
    expect(result.report).toEqual(expected);
    const body = captured.body!;
    expect(body.model).toBe("claude-opus-5");
    expect(body.stream).toBe(true);
    expect(body.thinking).toEqual({ type: "adaptive" });
    expect(body.fallbacks).toBe("default");
    expect(captured.headers?.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    expect((body.output_config as { format: { type: string } }).format.type).toBe("json_schema");
    expect(body.system).toBe("SYSTEM PROMPT");
    const userText = JSON.stringify(body.messages);
    expect(userText).toContain("Test Org");
    expect(userText).not.toContain("department_option_id");
  });

  it("omits the fallback beta for models that do not support it", async () => {
    const snap = makeSnapshot();
    const { client, captured } = fakeClient(JSON.stringify(generateRulesReport(snap)));
    await generateAIReport(snap, "S", { client, model: "claude-sonnet-5" });
    expect(captured.body!.fallbacks).toBeUndefined();
  });

  it("rejects malformed or truncated AI output", async () => {
    const snap = makeSnapshot();
    const bad = fakeClient(JSON.stringify({ executive_summary: "only this" }));
    await expect(generateAIReport(snap, "S", { client: bad.client, model: "claude-opus-5" })).rejects.toBeInstanceOf(AIReportError);
    const truncated = fakeClient(JSON.stringify(generateRulesReport(snap)), "max_tokens");
    await expect(generateAIReport(snap, "S", { client: truncated.client, model: "claude-opus-5" })).rejects.toThrow(/cut off/);
    const refused = fakeClient("", "refusal");
    await expect(generateAIReport(snap, "S", { client: refused.client, model: "claude-opus-5" })).rejects.toThrow(/declined/);
  });
});
