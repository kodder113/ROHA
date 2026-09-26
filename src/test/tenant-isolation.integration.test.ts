/**
 * Tenant isolation and role permission tests against real PostgreSQL RLS.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asRole, createTestDatabase, databaseAvailable, errorOf, type TestDb } from "./db";
import { createCampaign, createUser, provisionOrg } from "./fixtures";

const available = await databaseAvailable();

describe.skipIf(!available)("tenant isolation (RLS)", () => {
  let db: TestDb;
  let ownerA: string, adminA: string, viewerA: string, ownerB: string, platformAdmin: string, outsider: string;
  let orgA: string, orgB: string;
  let campaignA: { id: string; survey_token: string };
  let campaignB: { id: string; survey_token: string };

  beforeAll(async () => {
    db = await createTestDatabase({ seed: true });
    const c = db.client;
    ownerA = await createUser(c, "owner-a@example.com");
    adminA = await createUser(c, "admin-a@example.com");
    viewerA = await createUser(c, "viewer-a@example.com");
    ownerB = await createUser(c, "owner-b@example.com");
    platformAdmin = await createUser(c, "rodrik@example.com");
    outsider = await createUser(c, "outsider@example.com");
    orgA = await provisionOrg(c, ownerA, "owner-a@example.com", "Alpha Industries");
    orgB = await provisionOrg(c, ownerB, "owner-b@example.com", "Beta Services");
    await c.query("insert into organization_members (org_id, user_id, role_key) values ($1, $2, 'admin'), ($1, $3, 'viewer')", [orgA, adminA, viewerA]);
    await c.query("insert into platform_admins (user_id) values ($1)", [platformAdmin]);
    campaignA = await createCampaign(c, orgA);
    campaignB = await createCampaign(c, orgB);
    await c.query(
      "insert into audit_logs (org_id, action) values ($1, 'test.a'), ($2, 'test.b')",
      [orgA, orgB],
    );
  });

  afterAll(async () => {
    await db?.drop();
  });

  it("provisioning creates the organization, owner membership and a free Discover subscription", async () => {
    const { rows } = await db.client.query(
      `select m.role_key, p.key as plan, s.source from organization_members m
       join subscriptions s on s.org_id = m.org_id join plans p on p.id = s.plan_id
       where m.org_id = $1 and m.user_id = $2`,
      [orgA, ownerA],
    );
    expect(rows).toEqual([{ role_key: "owner", plan: "discover", source: "free" }]);
  });

  it("members only see their own organization", async () => {
    const rows = await asRole(db.client, "authenticated", ownerA, async (q) => (await q("select id from organizations")).rows);
    expect(rows.map((r) => r.id)).toEqual([orgA]);
    const rowsB = await asRole(db.client, "authenticated", ownerB, async (q) => (await q("select id from organizations")).rows);
    expect(rowsB.map((r) => r.id)).toEqual([orgB]);
  });

  it("members cannot read another tenant's campaigns, subscriptions, members, reports or audit logs", async () => {
    await asRole(db.client, "authenticated", ownerA, async (q) => {
      for (const [table, col] of [
        ["campaigns", "org_id"],
        ["subscriptions", "org_id"],
        ["organization_members", "org_id"],
        ["ai_reports", "org_id"],
        ["generated_reports", "org_id"],
        ["audit_logs", "org_id"],
      ]) {
        const { rows } = await q(`select 1 from ${table} where ${col} = $1`, [orgB]);
        expect(rows, table).toHaveLength(0);
      }
      const opts = await q("select 1 from campaign_segment_options where campaign_id = $1", [campaignB.id]);
      expect(opts.rows).toHaveLength(0);
    });
  });

  it("users without membership see nothing", async () => {
    await asRole(db.client, "authenticated", outsider, async (q) => {
      expect((await q("select 1 from organizations")).rows).toHaveLength(0);
      expect((await q("select 1 from campaigns")).rows).toHaveLength(0);
    });
  });

  it("members cannot update another tenant's organization (silently filtered by RLS)", async () => {
    const count = await asRole(db.client, "authenticated", ownerA, async (q) => {
      const r = await q("update organizations set name = 'Hijacked' where id = $1", [orgB]);
      return r.rowCount;
    });
    expect(count).toBe(0);
  });

  it("raw survey data is never readable by browser roles, even by the organization owner", async () => {
    for (const table of ["responses", "response_items", "response_comments", "participation_tokens", "aggregated_results"]) {
      const err = await errorOf(() => asRole(db.client, "authenticated", ownerA, (q) => q(`select * from ${table}`)));
      expect(err, table).toMatch(/permission denied/);
      const errAnon = await errorOf(() => asRole(db.client, "anon", null, (q) => q(`select * from ${table}`)));
      expect(errAnon, table).toMatch(/permission denied/);
    }
  });

  it("the survey submission function is only callable by the server (service role)", async () => {
    const err = await errorOf(() =>
      asRole(db.client, "anon", null, (q) => q("select public.submit_survey_response('x', 'y', '{}', '[]', '[]')")),
    );
    expect(err).toMatch(/permission denied/);
    const err2 = await errorOf(() =>
      asRole(db.client, "authenticated", ownerA, (q) => q("select public.provision_organization($1, 'x', '{}')", [ownerA])),
    );
    expect(err2).toMatch(/permission denied/);
  });

  it("response counts are available to members but not to other tenants", async () => {
    const n = await asRole(db.client, "authenticated", viewerA, async (q) =>
      (await q("select public.campaign_response_count($1) as n", [campaignA.id])).rows[0].n,
    );
    expect(n).toBe(0);
    const err = await errorOf(() =>
      asRole(db.client, "authenticated", ownerA, (q) => q("select public.campaign_response_count($1)", [campaignB.id])),
    );
    expect(err).toMatch(/ROHA_FORBIDDEN/);
  });

  it("organization users cannot grant themselves pilot status, change plans, or create campaigns directly", async () => {
    expect(
      await errorOf(() => asRole(db.client, "authenticated", ownerA, (q) => q("update organizations set is_pilot = true where id = $1", [orgA]))),
    ).toMatch(/permission denied/);
    expect(
      await errorOf(() =>
        asRole(db.client, "authenticated", ownerA, (q) => q("update subscriptions set limit_overrides = '{\"max_campaigns\": 99}' where org_id = $1", [orgA])),
      ),
    ).toMatch(/permission denied/);
    expect(
      await errorOf(() =>
        asRole(db.client, "authenticated", ownerA, (q) =>
          q("insert into campaigns (org_id, assessment_version_id, scoring_rule_version_id, name, opens_at, closes_at) select $1, assessment_version_id, scoring_rule_version_id, 'x', now(), now() + interval '1 day' from campaigns limit 1", [orgA]),
        ),
      ),
    ).toMatch(/permission denied/);
    expect(
      await errorOf(() => asRole(db.client, "authenticated", ownerA, (q) => q("update campaigns set response_limit = 100000 where id = $1", [campaignA.id]))),
    ).toMatch(/permission denied/);
  });

  describe("role permissions", () => {
    it("owners and admins can edit organization profile fields; viewers cannot", async () => {
      const owner = await asRole(db.client, "authenticated", ownerA, async (q) =>
        (await q("update organizations set industry = 'Manufacturing' where id = $1", [orgA])).rowCount,
      );
      const admin = await asRole(db.client, "authenticated", adminA, async (q) =>
        (await q("update organizations set industry = 'Manufacturing' where id = $1", [orgA])).rowCount,
      );
      const viewer = await asRole(db.client, "authenticated", viewerA, async (q) =>
        (await q("update organizations set industry = 'Manufacturing' where id = $1", [orgA])).rowCount,
      );
      expect([owner, admin, viewer]).toEqual([1, 1, 0]);
    });

    it("admins can rename campaigns; viewers cannot", async () => {
      const admin = await asRole(db.client, "authenticated", adminA, async (q) =>
        (await q("update campaigns set name = 'Renamed' where id = $1", [campaignA.id])).rowCount,
      );
      const viewer = await asRole(db.client, "authenticated", viewerA, async (q) =>
        (await q("update campaigns set name = 'Renamed' where id = $1", [campaignA.id])).rowCount,
      );
      expect([admin, viewer]).toEqual([1, 0]);
    });

    it("only owners manage team members, and owners cannot demote themselves", async () => {
      const byAdmin = await asRole(db.client, "authenticated", adminA, async (q) =>
        (await q("update organization_members set role_key = 'admin' where org_id = $1 and user_id = $2", [orgA, viewerA])).rowCount,
      );
      expect(byAdmin).toBe(0);
      const byOwner = await asRole(db.client, "authenticated", ownerA, async (q) =>
        (await q("update organization_members set role_key = 'admin' where org_id = $1 and user_id = $2", [orgA, viewerA])).rowCount,
      );
      expect(byOwner).toBe(1);
      const self = await asRole(db.client, "authenticated", ownerA, async (q) =>
        (await q("update organization_members set role_key = 'viewer' where org_id = $1 and user_id = $2", [orgA, ownerA])).rowCount,
      );
      expect(self).toBe(0);
      const promoteToOwner = await errorOf(() =>
        asRole(db.client, "authenticated", ownerA, (q) =>
          q("update organization_members set role_key = 'owner' where org_id = $1 and user_id = $2", [orgA, viewerA]),
        ),
      );
      expect(promoteToOwner).toMatch(/row-level security/);
    });

    it("audit logs are visible to owners/admins of that organization only", async () => {
      const owner = await asRole(db.client, "authenticated", ownerA, async (q) => (await q("select action from audit_logs")).rows);
      expect(owner.map((r) => r.action)).toContain("test.a");
      expect(owner.map((r) => r.action)).not.toContain("test.b");
      const viewer = await asRole(db.client, "authenticated", viewerA, async (q) => (await q("select action from audit_logs")).rows);
      expect(viewer).toHaveLength(0);
    });

    it("suspended organizations lose access for their members", async () => {
      await db.client.query("update organizations set status = 'suspended' where id = $1", [orgB]);
      const rows = await asRole(db.client, "authenticated", ownerB, async (q) => (await q("select id from organizations")).rows);
      expect(rows).toHaveLength(0);
      await db.client.query("update organizations set status = 'active' where id = $1", [orgB]);
    });

    it("platform administrators can see all organizations; organization users cannot see platform tables", async () => {
      const rows = await asRole(db.client, "authenticated", platformAdmin, async (q) => (await q("select id from organizations")).rows);
      expect(rows.map((r) => r.id)).toEqual(expect.arrayContaining([orgA, orgB]));
      const errs = await asRole(db.client, "authenticated", ownerA, async (q) => (await q("select * from app_errors")).rows);
      expect(errs).toHaveLength(0);
      const instr = await asRole(db.client, "authenticated", ownerA, async (q) => (await q("select * from ai_report_instructions")).rows);
      expect(instr).toHaveLength(0);
    });

    it("anonymous visitors can read published assessment questions but not drafts", async () => {
      await db.client.query(`
        insert into assessment_versions (template_id, version_number, status, title)
        select template_id, 99, 'draft', 'Draft' from assessment_versions limit 1`);
      const rows = await asRole(db.client, "anon", null, async (q) => (await q("select status from assessment_versions")).rows);
      expect(rows.every((r) => r.status !== "draft")).toBe(true);
      const qs = await asRole(db.client, "anon", null, async (q) => (await q("select count(*)::int as n from questions")).rows[0].n);
      expect(qs).toBe(24);
      await db.client.query("delete from assessment_versions where version_number = 99");
    });

    it("only platform administrators can modify assessment content", async () => {
      const count = await asRole(db.client, "authenticated", ownerA, async (q) =>
        (await q("update questions set prompt = 'Changed prompt text here'")).rowCount,
      );
      expect(count).toBe(0);
    });
  });
});
