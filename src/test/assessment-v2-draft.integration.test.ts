/**
 * Verifies the proposed five-dimension Assessment Version 2 draft script
 * (supabase/drafts/assessment_v2_draft.sql) against a throwaway database:
 * it creates unpublished drafts only, and leaves Version 1, scoring rules v1,
 * AI instructions v1, campaigns and historical results untouched.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asRole, createTestDatabase, databaseAvailable, errorOf, type TestDb } from "./db";
import { scoreAssessment } from "@/lib/scoring/engine";
import { parseScoringConfig } from "@/lib/scoring/config";
import { toDimensionDefs, toProfiledResponses, toQuestionDefs } from "@/lib/results/mapping";

const available = await databaseAvailable();
const DRAFT = readFileSync(path.resolve(import.meta.dirname, "../../supabase/drafts/assessment_v2_draft.sql"), "utf8");

/** SHA-256 of version-1 items (key:prompt sorted by key) recorded in docs/prelaunch-review/07. */
const V1_FINGERPRINT = "84cf0a93608aeeee74cb1db6d6d9972bd9d28e2b470bfefc4ccb63455e12ce9e";

/** The proposed Version 2 items, exactly as documented in docs/assessment-v2/. */
const V2_ITEMS: Record<string, string> = {
  LE1: "I trust senior leaders to be honest with employees.",
  LE2: "Leadership has set a clear direction for the organization's future.",
  LE3: "Managers are held to the same standards of accountability as the people they lead.",
  LE4: "I have confidence in the decisions made by leadership.",
  LE5: "Leaders explain what the organization's priorities mean for my team.",
  OC1: "People here work well together to reach shared goals.",
  OC2: "Employees from every background receive equal respect here.",
  OC3: "I can speak up about problems or concerns without fear of negative consequences.",
  OC4: "The way people actually behave here reflects the organization's stated values.",
  OC5: "When mistakes happen here, the focus is on learning from them.",
  EE1: "My work gives me a sense of purpose.",
  EE2: "The contributions I make are acknowledged here.",
  EE3: "This organization invests in developing my skills.",
  EE4: "I feel committed to helping this organization succeed.",
  EE5: "I have appropriate freedom to decide how to accomplish my work.",
  OE1: "Our work processes let us get things done without unnecessary steps.",
  OE2: "The tools and technology available to me are well suited to my work.",
  OE3: "Departments work well together when a task involves more than one of them.",
  OE4: "It is clear who is responsible for what in the work I do.",
  OE5: "The procedures I am expected to follow in my work are clear.",
  SI1: "I understand the organization's most important goals.",
  SI2: "My daily work helps the organization reach its goals.",
  SI3: "This organization adapts effectively when circumstances change.",
  SI4: "New ideas are welcomed here, even when they challenge established ways of working.",
  SI5: "Employees receive the support they need to try out their ideas for improvement.",
};

describe.skipIf(!available)("Assessment Version 2 draft (five dimensions × five items)", () => {
  let db: TestDb;
  let v1Prompt: string;
  let v1Rules: unknown;

  async function fingerprint(versionNumber: number) {
    const { rows } = await db.client.query(
      `select q.key, q.prompt from questions q join assessment_versions v on v.id = q.version_id
       where v.version_number = $1 order by q.key`,
      [versionNumber],
    );
    return createHash("sha256").update(rows.map((r) => `${r.key}:${r.prompt}`).join("\n") + "\n").digest("hex");
  }

  async function scoreDemoBaseline() {
    const c = (await db.client.query("select * from campaigns order by closes_at limit 1")).rows[0];
    const dims = await db.client.query("select * from dimensions where version_id = $1", [c.assessment_version_id]);
    const qs = await db.client.query("select * from questions where version_id = $1", [c.assessment_version_id]);
    const rs = await db.client.query("select * from responses where campaign_id = $1", [c.id]);
    const its = await db.client.query("select ri.* from response_items ri join responses r on r.id = ri.response_id where r.campaign_id = $1", [c.id]);
    const rules = await db.client.query("select config from scoring_rule_versions where id = $1", [c.scoring_rule_version_id]);
    return scoreAssessment({
      dimensions: toDimensionDefs(dims.rows),
      questions: toQuestionDefs(qs.rows),
      responses: toProfiledResponses(rs.rows, its.rows),
      config: parseScoringConfig(rules.rows[0].config),
    });
  }

  let before: ReturnType<typeof scoreAssessment>;

  beforeAll(async () => {
    db = await createTestDatabase({ seed: true });
    before = await scoreDemoBaseline();
    v1Prompt = (await db.client.query("select system_prompt from ai_report_instructions where version_number = 1")).rows[0].system_prompt;
    v1Rules = (await db.client.query("select config from scoring_rule_versions where version_number = 1")).rows[0].config;
    await db.client.query(DRAFT);
  });
  afterAll(async () => {
    await db?.drop();
  });

  it("leaves Version 1, scoring rules v1 and AI instructions v1 exactly as they were", async () => {
    expect(await fingerprint(1)).toBe(V1_FINGERPRINT);
    const v1 = await db.client.query("select status from assessment_versions where version_number = 1");
    expect(v1.rows[0].status).toBe("published");
    const rules = await db.client.query("select status, config from scoring_rule_versions where version_number = 1");
    expect(rules.rows[0]).toEqual({ status: "published", config: v1Rules });
    const ai = await db.client.query("select status, system_prompt from ai_report_instructions where version_number = 1");
    expect(ai.rows[0]).toEqual({ status: "active", system_prompt: v1Prompt });
  });

  it("creates Version 2 as an unpublished draft with five dimensions of five items", async () => {
    const v2 = await db.client.query("select id, status, published_at from assessment_versions where version_number = 2");
    expect(v2.rows[0].status).toBe("draft");
    expect(v2.rows[0].published_at).toBeNull();
    const { rows } = await db.client.query(
      `select d.key, d.code, count(*)::int as n from questions q join dimensions d on d.id = q.dimension_id
       where q.version_id = $1 group by d.key, d.code, d.sort_order order by d.sort_order`,
      [v2.rows[0].id],
    );
    expect(rows.map((r) => r.key)).toEqual(["leadership", "culture", "engagement", "operations", "strategy_innovation"]);
    expect(rows.map((r) => r.code)).toEqual(["LE", "OC", "EE", "OE", "SI"]);
    expect(rows.every((r) => r.n === 5)).toBe(true);
    const qual = await db.client.query("select count(*)::int as n from qualitative_questions where version_id = $1", [v2.rows[0].id]);
    expect(qual.rows[0].n).toBe(3);
  });

  it("contains exactly the 25 documented items, each key prefixed by its dimension code", async () => {
    const { rows } = await db.client.query(
      `select q.key, q.prompt, d.code from questions q join dimensions d on d.id = q.dimension_id
       join assessment_versions v on v.id = q.version_id where v.version_number = 2 order by q.key`,
    );
    expect(Object.fromEntries(rows.map((r) => [r.key, r.prompt]))).toEqual(V2_ITEMS);
    expect(rows.every((r) => r.key.startsWith(r.code))).toBe(true);
    expect(new Set(rows.map((r) => r.prompt)).size).toBe(25);
  });

  it("drafts scoring rules v2 (at least 4 valid per dimension) and AI instructions v2 without activating them", async () => {
    const rules = await db.client.query("select status, config from scoring_rule_versions where version_number = 2");
    expect(rules.rows[0].status).toBe("draft");
    const cfg = parseScoringConfig(rules.rows[0].config);
    expect(cfg.minValidCurrentRatings).toBe(20);
    expect(cfg.minValidCurrentPerDimension).toBe(4);
    expect(cfg.assessmentVersion).toBe(2);
    const { minValidCurrentPerDimension: _p, assessmentVersion: _a, ...rest } = cfg;
    void _p;
    void _a;
    expect({ ...rest, minValidCurrentRatings: 12 }).toEqual(parseScoringConfig(v1Rules));
    const ai = await db.client.query("select status, system_prompt from ai_report_instructions where version_number = 2");
    expect(ai.rows[0].status).toBe("draft");
    expect(ai.rows[0].system_prompt).toContain("version 2 has five dimensions of five items");
    expect(ai.rows[0].system_prompt).not.toContain("independently developed diagnostic");
    expect(ai.rows[0].system_prompt).toContain("Strategic Alignment & Innovation");
  });

  it("keeps the drafts invisible to organizations and anonymous survey visitors", async () => {
    const n = await asRole(db.client, "anon", null, async (q) =>
      (await q("select count(*)::int as n from assessment_versions where version_number = 2")).rows[0].n,
    );
    expect(n).toBe(0);
  });

  it("refuses to run twice", async () => {
    expect(await errorOf(() => db.client.query(DRAFT))).toMatch(/already exists/);
  });

  it("does not change historical results or campaigns", async () => {
    expect(await scoreDemoBaseline()).toEqual(before);
    const campaigns = await db.client.query(
      "select count(*)::int as n from campaigns c join assessment_versions v on v.id = c.assessment_version_id where v.version_number <> 1",
    );
    expect(campaigns.rows[0].n).toBe(0);
  });

  it("scores a five-by-five response set with the unchanged engine", async () => {
    const v2 = (await db.client.query("select id from assessment_versions where version_number = 2")).rows[0].id;
    const dims = await db.client.query("select * from dimensions where version_id = $1", [v2]);
    const qs = await db.client.query("select * from questions where version_id = $1", [v2]);
    const rules = await db.client.query("select config from scoring_rule_versions where version_number = 2");
    const questions = toQuestionDefs(qs.rows);
    const responses = Array.from({ length: 6 }, (_, r) => ({
      items: Object.fromEntries(questions.map((q, i) => [q.id, { current: ((r + i) % 5) + 1, desired: 5 }])),
    }));
    const result = scoreAssessment({ dimensions: toDimensionDefs(dims.rows), questions, responses, config: parseScoringConfig(rules.rows[0].config) });
    expect(result.dimensions).toHaveLength(5);
    expect(result.questions).toHaveLength(25);
    expect(result.validResponses).toBe(6);
    const mean = result.dimensions.reduce((s, d) => s + d.current.score!, 0) / 5;
    expect(result.overall.currentIndex).toBeCloseTo(mean, 10);
  });
});
