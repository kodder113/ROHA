/**
 * Survey submission, duplicate prevention, expiration, versioning and
 * database-vs-engine score verification.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, databaseAvailable, errorOf, type TestDb } from "./db";
import { completeItems, createCampaign, createUser, provisionOrg, questionsFor, submit, tokenHash, type QuestionInfo } from "./fixtures";
import { scoreAssessment } from "@/lib/scoring/engine";
import { parseScoringConfig } from "@/lib/scoring/config";
import { toDimensionDefs, toProfiledResponses, toQuestionDefs } from "@/lib/results/mapping";

const available = await databaseAvailable();

describe.skipIf(!available)("survey submission and scoring integrity", () => {
  let db: TestDb;
  let orgId: string;
  let questions: QuestionInfo[];

  beforeAll(async () => {
    db = await createTestDatabase({ seed: true });
    const owner = await createUser(db.client, "owner@example.com");
    orgId = await provisionOrg(db.client, owner, "owner@example.com", "Gamma Health");
    questions = await questionsFor(db.client);
  });
  afterAll(async () => {
    await db?.drop();
  });

  it("the published framework has 24 questions across 6 dimensions", async () => {
    const { rows } = await db.client.query(`
      select d.key, count(q.*)::int as n from dimensions d join questions q on q.dimension_id = d.id
      join assessment_versions v on v.id = d.version_id where v.status = 'published' group by d.key, d.sort_order order by d.sort_order`);
    expect(rows.map((r) => r.key)).toEqual(["leadership", "culture", "engagement", "operations", "innovation", "strategy"]);
    expect(rows.every((r) => r.n === 4)).toBe(true);
    expect(questions).toHaveLength(24);
  });

  it("stores a complete submission with all 48 ratings and no identifying metadata", async () => {
    const c = await createCampaign(db.client, orgId);
    const items = completeItems(questions, (_, i) => ({ current: (i % 5) + 1, desired: ((i + 1) % 5) + 1 }));
    await submit(db.client, c.survey_token, tokenHash(), items, { department_option_id: c.departments.Finance, tenure_range: "3_5" }, [
      { qualitative_question_id: null, body: "ignored — unknown question" },
    ]);
    const { rows } = await db.client.query(
      `select count(*)::int as items, count(current_value)::int as cur, count(desired_value)::int as des
       from response_items ri join responses r on r.id = ri.response_id where r.campaign_id = $1`,
      [c.id],
    );
    expect(rows[0]).toEqual({ items: 24, cur: 24, des: 24 });
    const cols = await db.client.query(
      "select column_name from information_schema.columns where table_name = 'responses' and table_schema = 'public'",
    );
    const names = cols.rows.map((r) => r.column_name);
    for (const forbidden of ["created_at", "submitted_at", "ip", "ip_address", "token_hash", "user_agent", "email"]) {
      expect(names).not.toContain(forbidden);
    }
    const comments = await db.client.query("select count(*)::int as n from response_comments where campaign_id = $1", [c.id]);
    expect(comments.rows[0].n).toBe(0);
  });

  it("prevents duplicate submissions with the same participation token", async () => {
    const c = await createCampaign(db.client, orgId);
    const hash = tokenHash();
    await submit(db.client, c.survey_token, hash, completeItems(questions));
    const err = await errorOf(() => submit(db.client, c.survey_token, hash, completeItems(questions)));
    expect(err).toMatch(/ROHA_DUPLICATE/);
    const status = await db.client.query("select public.participation_token_status($1, $2) as s", [c.survey_token, hash]);
    expect(status.rows[0].s).toBe("submitted");
    // A different token (another employee) is accepted.
    await submit(db.client, c.survey_token, tokenHash(), completeItems(questions));
    const n = await db.client.query("select count(*)::int as n from responses where campaign_id = $1", [c.id]);
    expect(n.rows[0].n).toBe(2);
  });

  it("rejects incomplete responses", async () => {
    const c = await createCampaign(db.client, orgId);
    const missingOne = completeItems(questions).slice(1);
    expect(await errorOf(() => submit(db.client, c.survey_token, tokenHash(), missingOne))).toMatch(/ROHA_INCOMPLETE/);
    const missingDesired = completeItems(questions, () => ({ current: 3, desired: null }));
    expect(await errorOf(() => submit(db.client, c.survey_token, tokenHash(), missingDesired))).toMatch(/ROHA_INCOMPLETE/);
    const outOfRange = completeItems(questions, () => ({ current: 6, desired: 4 }));
    expect(await errorOf(() => submit(db.client, c.survey_token, tokenHash(), outOfRange))).toMatch(/ROHA_INCOMPLETE/);
    const duplicated = [...completeItems(questions).slice(1), completeItems(questions)[1]];
    expect(await errorOf(() => submit(db.client, c.survey_token, tokenHash(), duplicated))).toMatch(/ROHA_INCOMPLETE/);
    const both = completeItems(questions, () => ({ current: 3, desired: 4, current_na: true }));
    expect(await errorOf(() => submit(db.client, c.survey_token, tokenHash(), both))).toMatch(/ROHA_INCOMPLETE/);
  });

  it("accepts Not Applicable only on items that permit it", async () => {
    const c = await createCampaign(db.client, orgId);
    const naAllowed = completeItems(questions, (q) =>
      q.allow_na ? { current: null, desired: null, current_na: true, desired_na: true } : { current: 4, desired: 5 },
    );
    await submit(db.client, c.survey_token, tokenHash(), naAllowed);
    const naForbidden = completeItems(questions, (q) =>
      !q.allow_na ? { current: null, desired: 4, current_na: true } : { current: 4, desired: 5 },
    );
    expect(await errorOf(() => submit(db.client, c.survey_token, tokenHash(), naForbidden))).toMatch(/ROHA_INCOMPLETE/);
  });

  it("enforces the survey window (not yet open, expired, closed, draft)", async () => {
    const future = await createCampaign(db.client, orgId, {
      opensAt: new Date(Date.now() + 86400000).toISOString(),
      closesAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    });
    expect(await errorOf(() => submit(db.client, future.survey_token, tokenHash(), completeItems(questions)))).toMatch(/ROHA_NOT_OPEN/);
    const expired = await createCampaign(db.client, orgId, {
      opensAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      closesAt: new Date(Date.now() - 60000).toISOString(),
    });
    expect(await errorOf(() => submit(db.client, expired.survey_token, tokenHash(), completeItems(questions)))).toMatch(/ROHA_CLOSED/);
    const closed = await createCampaign(db.client, orgId, { status: "closed" });
    expect(await errorOf(() => submit(db.client, closed.survey_token, tokenHash(), completeItems(questions)))).toMatch(/ROHA_CLOSED/);
    const draft = await createCampaign(db.client, orgId, { status: "draft" });
    expect(await errorOf(() => submit(db.client, draft.survey_token, tokenHash(), completeItems(questions)))).toMatch(/ROHA_NOT_OPEN/);
    expect(await errorOf(() => submit(db.client, "does-not-exist", tokenHash(), completeItems(questions)))).toMatch(/ROHA_NOT_FOUND/);
  });

  it("enforces the plan response limit captured at launch", async () => {
    const c = await createCampaign(db.client, orgId, { responseLimit: 2 });
    await submit(db.client, c.survey_token, tokenHash(), completeItems(questions));
    await submit(db.client, c.survey_token, tokenHash(), completeItems(questions));
    expect(await errorOf(() => submit(db.client, c.survey_token, tokenHash(), completeItems(questions)))).toMatch(/ROHA_LIMIT/);
  });

  it("requires a valid single-use access code when configured", async () => {
    const c = await createCampaign(db.client, orgId, { requireAccessCode: true });
    const code = tokenHash();
    await db.client.query("insert into participation_tokens (campaign_id, token_hash, kind) values ($1, $2, 'access_code')", [c.id, code]);
    expect(await errorOf(() => submit(db.client, c.survey_token, tokenHash(), completeItems(questions)))).toMatch(/ROHA_TOKEN_INVALID/);
    await submit(db.client, c.survey_token, code, completeItems(questions));
    expect(await errorOf(() => submit(db.client, c.survey_token, code, completeItems(questions)))).toMatch(/ROHA_DUPLICATE/);
  });

  it("validates profile options belong to the campaign, and anonymous campaigns discard demographics", async () => {
    const a = await createCampaign(db.client, orgId);
    const b = await createCampaign(db.client, orgId);
    expect(
      await errorOf(() => submit(db.client, a.survey_token, tokenHash(), completeItems(questions), { department_option_id: b.departments.Finance })),
    ).toMatch(/ROHA_INVALID_PROFILE/);
    expect(
      await errorOf(() => submit(db.client, a.survey_token, tokenHash(), completeItems(questions), { tenure_range: "forever" })),
    ).toMatch(/ROHA_INVALID_PROFILE/);

    const anon = await createCampaign(db.client, orgId, { privacyMode: "anonymous" });
    await submit(db.client, anon.survey_token, tokenHash(), completeItems(questions), {
      department_option_id: anon.departments.Finance,
      tenure_range: "1_2",
    });
    const { rows } = await db.client.query("select department_option_id, tenure_range from responses where campaign_id = $1", [anon.id]);
    expect(rows).toEqual([{ department_option_id: null, tenure_range: null }]);
  });

  it("stores comments without any link to the response row", async () => {
    const c = await createCampaign(db.client, orgId);
    const qq = await db.client.query("select id from qualitative_questions order by sort_order limit 1");
    await submit(db.client, c.survey_token, tokenHash(), completeItems(questions), {}, [
      { qualitative_question_id: qq.rows[0].id, body: "  Teams help each other.  ", consent_to_quote: true },
      { qualitative_question_id: qq.rows[0].id, body: "   " },
    ]);
    const { rows } = await db.client.query("select body, consent_to_quote from response_comments where campaign_id = $1", [c.id]);
    expect(rows).toEqual([{ body: "Teams help each other.", consent_to_quote: true }]);
    const cols = await db.client.query(
      "select column_name from information_schema.columns where table_name = 'response_comments' and table_schema = 'public'",
    );
    expect(cols.rows.map((r) => r.column_name)).not.toContain("response_id");
  });

  describe("versioning", () => {
    it("published questions, versions and scoring rules are immutable", async () => {
      expect(await errorOf(() => db.client.query("update questions set prompt = 'A changed prompt text' where key = 'LE1'"))).toMatch(/ROHA_IMMUTABLE/);
      expect(await errorOf(() => db.client.query("delete from questions where key = 'LE1'"))).toMatch(/ROHA_IMMUTABLE/);
      expect(await errorOf(() => db.client.query("update assessment_versions set title = 'x' where status = 'published'"))).toMatch(/ROHA_IMMUTABLE/);
      expect(
        await errorOf(() => db.client.query(`update scoring_rule_versions set config = config || '{"minGroupSize": 3}' where status = 'published'`)),
      ).toMatch(/ROHA_IMMUTABLE/);
    });

    it("launched campaigns cannot change version and closed campaigns cannot reopen", async () => {
      const c = await createCampaign(db.client, orgId);
      expect(
        await errorOf(() => db.client.query("update campaigns set privacy_mode = 'anonymous' where id = $1", [c.id])),
      ).toMatch(/ROHA_IMMUTABLE/);
      await db.client.query("update campaigns set status = 'closed' where id = $1", [c.id]);
      expect(await errorOf(() => db.client.query("update campaigns set status = 'open' where id = $1", [c.id]))).toMatch(/ROHA_IMMUTABLE/);
      expect(
        await errorOf(() => db.client.query("delete from campaign_segment_options where campaign_id = $1", [c.id])),
      ).toMatch(/ROHA_IMMUTABLE/);
    });

    it("historical results are unchanged after a new assessment version is published", async () => {
      const demo = await db.client.query("select id, assessment_version_id, scoring_rule_version_id from campaigns where org_id = (select id from organizations where is_demo) order by closes_at limit 1");
      const campaign = demo.rows[0];
      const scoreCampaign = async () => {
        const dims = await db.client.query("select * from dimensions where version_id = $1", [campaign.assessment_version_id]);
        const qs = await db.client.query("select * from questions where version_id = $1", [campaign.assessment_version_id]);
        const rs = await db.client.query("select * from responses where campaign_id = $1", [campaign.id]);
        const its = await db.client.query("select ri.* from response_items ri join responses r on r.id = ri.response_id where r.campaign_id = $1", [campaign.id]);
        const rules = await db.client.query("select config from scoring_rule_versions where id = $1", [campaign.scoring_rule_version_id]);
        return scoreAssessment({
          dimensions: toDimensionDefs(dims.rows),
          questions: toQuestionDefs(qs.rows),
          responses: toProfiledResponses(rs.rows, its.rows),
          config: parseScoringConfig(rules.rows[0].config),
        });
      };
      const before = await scoreCampaign();

      // Create version 2 by cloning v1, reword a question, publish it, retire v1,
      // and publish scoring rules v2 with different weights.
      const v1 = campaign.assessment_version_id;
      const v2 = (
        await db.client.query(
          `insert into assessment_versions (template_id, version_number, status, title)
           select template_id, version_number + 1, 'draft', 'Version 2' from assessment_versions where id = $1 returning id`,
          [v1],
        )
      ).rows[0].id;
      await db.client.query(
        `with d as (
           insert into dimensions (version_id, key, code, name, description, sort_order)
           select $2, key, code, name, description, sort_order from dimensions where version_id = $1 returning id, key
         )
         insert into questions (version_id, dimension_id, key, focus, prompt, allow_na, sort_order)
         select $2, d.id, q.key, q.focus, case when q.key = 'LE1' then 'Senior leaders are honest with employees about challenges.' else q.prompt end, q.allow_na, q.sort_order
         from questions q join dimensions od on od.id = q.dimension_id join d on d.key = od.key where q.version_id = $1`,
        [v1, v2],
      );
      await db.client.query("update assessment_versions set status = 'published' where id = $1", [v2]);
      await db.client.query("update assessment_versions set status = 'retired' where id = $1", [v1]);
      await db.client.query(
        `insert into scoring_rule_versions (version_number, name, status, config)
         select 2, 'v2', 'draft', config || '{"dimensionWeights": {"leadership": 3}}' from scoring_rule_versions where version_number = 1`,
      );
      await db.client.query("update scoring_rule_versions set status = 'published' where version_number = 2");

      const after = await scoreCampaign();
      expect(after).toEqual(before);
      const le1 = await db.client.query("select prompt from questions where version_id = $1 and key = 'LE1'", [v1]);
      expect(le1.rows[0].prompt).toBe("I trust senior leaders to be honest with employees.");
    });
  });

  it("engine scores match an independent SQL computation on the demo data", async () => {
    const demo = await db.client.query("select c.id, c.assessment_version_id, c.scoring_rule_version_id from campaigns c join organizations o on o.id = c.org_id where o.is_demo order by c.closes_at desc limit 1");
    const c = demo.rows[0];
    const sql = await db.client.query(
      `with q as (
         select d.key as dim, qu.id,
                (avg(ri.current_value) - 1) / 4 * 100 as cur,
                (avg(ri.desired_value) - 1) / 4 * 100 as des
         from response_items ri join responses r on r.id = ri.response_id
         join questions qu on qu.id = ri.question_id join dimensions d on d.id = qu.dimension_id
         where r.campaign_id = $1 group by d.key, qu.id
       ), dim as (select dim, avg(cur) as cur, avg(des) as des from q group by dim)
       select dim, cur::float8, des::float8 from dim`,
      [c.id],
    );
    const dims = await db.client.query("select * from dimensions where version_id = $1", [c.assessment_version_id]);
    const qs = await db.client.query("select * from questions where version_id = $1", [c.assessment_version_id]);
    const rs = await db.client.query("select * from responses where campaign_id = $1", [c.id]);
    const its = await db.client.query("select ri.* from response_items ri join responses r on r.id = ri.response_id where r.campaign_id = $1", [c.id]);
    const rules = await db.client.query("select config from scoring_rule_versions where id = $1", [c.scoring_rule_version_id]);
    const result = scoreAssessment({
      dimensions: toDimensionDefs(dims.rows),
      questions: toQuestionDefs(qs.rows),
      responses: toProfiledResponses(rs.rows, its.rows),
      config: parseScoringConfig(rules.rows[0].config),
    });
    expect(result.validResponses).toBe(rs.rows.length);
    for (const row of sql.rows) {
      const d = result.dimensions.find((x) => x.key === row.dim)!;
      expect(d.current.score).toBeCloseTo(row.cur, 8);
      expect(d.desired.score).toBeCloseTo(row.des, 8);
    }
  });

  it("rate limiting allows up to the maximum per window", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const r = await db.client.query("select public.rate_limit_hit('test-key', 60, 3) as ok");
      results.push(r.rows[0].ok);
    }
    expect(results).toEqual([true, true, true, false]);
  });
});
