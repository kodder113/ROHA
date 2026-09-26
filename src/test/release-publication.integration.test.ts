/**
 * Atomic assessment release (publish_assessment_release): the assessment
 * version, its scoring rules and compatible AI instructions change together
 * in one transaction, or nothing changes. Runs on a throwaway local database.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { asRole, createTestDatabase, databaseAvailable, errorOf, type TestDb } from "./db";

const available = await databaseAvailable();
const DRAFT = readFileSync(path.resolve(import.meta.dirname, "../../supabase/drafts/assessment_v2_draft.sql"), "utf8");

describe.skipIf(!available)("atomic assessment release publication", () => {
  let db: TestDb;
  const ids = { v1: "", v2: "", rules1: "", rules2: "", ai1: "", ai2: "" };

  const state = async () =>
    (
      await db.client.query(`select
        (select string_agg(version_number || ':' || status, ',' order by version_number) from assessment_versions) as versions,
        (select string_agg(version_number || ':' || status, ',' order by version_number) from scoring_rule_versions) as rules,
        (select string_agg(version_number || ':' || status, ',' order by version_number) from ai_report_instructions) as ai,
        (select count(*)::int from audit_logs where action = 'assessment_release.published') as audits`)
    ).rows[0];

  const publish = (args: { version?: string; rules?: string; ai?: string; retire?: boolean }) =>
    asRole(
      db.client,
      "service_role",
      null,
      (q) =>
        q("select public.publish_assessment_release($1, $2, $3, $4, null, 'admin@roha.test') as r", [
          args.version ?? ids.v2,
          args.rules ?? ids.rules2,
          args.ai ?? ids.ai2,
          args.retire ?? true,
        ]),
      { commit: true },
    );

  beforeEach(async () => {
    db = await createTestDatabase({ seed: true });
    await db.client.query(DRAFT);
    const one = async (sql: string) => (await db.client.query(sql)).rows[0].id as string;
    ids.v1 = await one("select id from assessment_versions where version_number = 1");
    ids.v2 = await one("select id from assessment_versions where version_number = 2");
    ids.rules1 = await one("select id from scoring_rule_versions where version_number = 1");
    ids.rules2 = await one("select id from scoring_rule_versions where version_number = 2");
    ids.ai1 = await one("select id from ai_report_instructions where version_number = 1");
    ids.ai2 = await one("select id from ai_report_instructions where version_number = 2");
  });
  afterEach(async () => {
    await db?.drop();
  });

  it("starts with Version 2 entirely in draft and records instruction compatibility", async () => {
    expect(await state()).toEqual({ versions: "1:published,2:draft", rules: "1:published,2:draft", ai: "1:active,2:draft", audits: 0 });
    const ai = await db.client.query("select version_number, supported_assessment_versions from ai_report_instructions order by version_number");
    expect(ai.rows).toEqual([
      { version_number: 1, supported_assessment_versions: [1] },
      { version_number: 2, supported_assessment_versions: [1, 2] },
    ]);
  });

  it("publishes the assessment version, scoring rules and AI instructions together, with one audit record", async () => {
    const result = await publish({});
    expect(result.rows[0].r).toMatchObject({ assessment_version: 2, scoring_rules_version: 2, ai_instructions_version: 2, retired_assessment_versions: [1], retired_ai_instructions: [1] });
    expect(await state()).toEqual({ versions: "1:retired,2:published", rules: "1:published,2:published", ai: "1:retired,2:active", audits: 1 });
  });

  it("changes nothing when the scoring rules belong to another assessment version", async () => {
    const err = await errorOf(() => publish({ rules: ids.rules1 }));
    expect(err).toMatch(/scoring rules v1 are for assessment version 1, not 2/);
    expect(await state()).toEqual({ versions: "1:published,2:draft", rules: "1:published,2:draft", ai: "1:active,2:draft", audits: 0 });
  });

  it("changes nothing when the AI instructions do not support the new version", async () => {
    const err = await errorOf(() => publish({ ai: ids.ai1 }));
    expect(err).toMatch(/AI instructions v1 support assessment versions \{1\}/);
    expect(await state()).toEqual({ versions: "1:published,2:draft", rules: "1:published,2:draft", ai: "1:active,2:draft", audits: 0 });
  });

  it("rolls back earlier steps when a later step fails inside the transaction", async () => {
    // Make the final step (activating AI instructions) fail after the rules and version were updated.
    await db.client.query(`create function test_block_activation() returns trigger language plpgsql as $$
      begin if new.status = 'active' and new.version_number = 2 then raise exception 'simulated failure'; end if; return new; end $$`);
    await db.client.query("create trigger test_block before update on ai_report_instructions for each row execute function test_block_activation()");
    const err = await errorOf(() => publish({}));
    expect(err).toMatch(/simulated failure/);
    expect(await state()).toEqual({ versions: "1:published,2:draft", rules: "1:published,2:draft", ai: "1:active,2:draft", audits: 0 });
  });

  it("refuses to publish a version that is already published", async () => {
    await publish({});
    const err = await errorOf(() => publish({}));
    expect(err).toMatch(/assessment version 2 is published, not draft/);
  });

  it("can be executed only by the service role", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      const err = await errorOf(() =>
        asRole(db.client, role, role === "authenticated" ? "00000000-0000-4000-8000-00000000abcd" : null, (q) =>
          q("select public.publish_assessment_release($1, $2, $3, true, null, 'x')", [ids.v2, ids.rules2, ids.ai2]),
        ),
      );
      expect(err).toMatch(/permission denied/);
    }
    expect(await state()).toMatchObject({ versions: "1:published,2:draft" });
  });
});
