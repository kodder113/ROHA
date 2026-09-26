/**
 * Verifies the proposed Assessment Version 2 draft script
 * (supabase/drafts/assessment_v2_draft.sql) against a throwaway database:
 * it creates an unpublished draft with the documented wording and leaves
 * Version 1, campaigns and historical results untouched.
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

const REVISED: Record<string, string> = {
  LE2: "Leadership has set a clear direction for the organization's future.",
  OC1: "People here work well together to reach shared goals.",
  OC2: "Employees from every background receive equal respect here.",
  EE2: "The contributions I make are acknowledged here.",
  EE3: "This organization invests in developing my skills.",
  OE1: "Our work processes let us get things done without unnecessary steps.",
  OE2: "The tools and technology available to me are well suited to my work.",
  OE3: "Departments work well together when a task involves more than one of them.",
  OE4: "It is clear who is responsible for what in the work I do.",
  IA2: "This organization adjusts quickly when conditions change.",
  SA2: "My daily work helps the organization reach its goals.",
  SA3: "Leaders explain what the organization's priorities mean for my team.",
  SA4: "I understand how my own work affects the organization's success.",
};

describe.skipIf(!available)("Assessment Version 2 draft", () => {
  let db: TestDb;

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
    await db.client.query(DRAFT);
  });
  afterAll(async () => {
    await db?.drop();
  });

  it("leaves Version 1 exactly as published", async () => {
    expect(await fingerprint(1)).toBe(V1_FINGERPRINT);
    const v1 = await db.client.query("select status from assessment_versions where version_number = 1");
    expect(v1.rows[0].status).toBe("published");
  });

  it("creates Version 2 as an unpublished draft with six dimensions of four items", async () => {
    const v2 = await db.client.query("select id, status, published_at from assessment_versions where version_number = 2");
    expect(v2.rows[0].status).toBe("draft");
    expect(v2.rows[0].published_at).toBeNull();
    const { rows } = await db.client.query(
      `select d.key, count(*)::int as n from questions q join dimensions d on d.id = q.dimension_id
       where q.version_id = $1 group by d.key, d.sort_order order by d.sort_order`,
      [v2.rows[0].id],
    );
    expect(rows.map((r) => r.key)).toEqual(["leadership", "culture", "engagement", "operations", "innovation", "strategy"]);
    expect(rows.every((r) => r.n === 4)).toBe(true);
    const qual = await db.client.query("select count(*)::int as n from qualitative_questions where version_id = $1", [v2.rows[0].id]);
    expect(qual.rows[0].n).toBe(3);
  });

  it("applies exactly the documented revisions and keeps all other items verbatim", async () => {
    const { rows } = await db.client.query(
      `select q2.key, q1.prompt as v1, q2.prompt as v2, q2.focus
       from questions q2 join assessment_versions v2 on v2.id = q2.version_id and v2.version_number = 2
       join questions q1 on q1.key = q2.key join assessment_versions v1 on v1.id = q1.version_id and v1.version_number = 1`,
    );
    expect(rows).toHaveLength(24);
    for (const r of rows) {
      if (REVISED[r.key]) expect(r.v2, r.key).toBe(REVISED[r.key]);
      else expect(r.v2, r.key).toBe(r.v1);
    }
    expect(rows.find((r) => r.key === "OE4")!.focus).toBe("Clarity of responsibilities");
  });

  it("keeps the draft invisible to organizations and anonymous survey visitors", async () => {
    const n = await asRole(db.client, "anon", null, async (q) =>
      (await q("select count(*)::int as n from assessment_versions where version_number = 2")).rows[0].n,
    );
    expect(n).toBe(0);
  });

  it("refuses to run twice", async () => {
    expect(await errorOf(() => db.client.query(DRAFT))).toMatch(/already exists/);
  });

  it("does not change historical results", async () => {
    expect(await scoreDemoBaseline()).toEqual(before);
    const campaigns = await db.client.query(
      "select count(*)::int as n from campaigns c join assessment_versions v on v.id = c.assessment_version_id where v.version_number <> 1",
    );
    expect(campaigns.rows[0].n).toBe(0);
  });
});
