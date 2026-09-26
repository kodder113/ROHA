import { randomUUID, randomBytes } from "node:crypto";
import type { Client } from "pg";

export const uid = () => randomUUID();
export const tokenHash = () => randomBytes(32).toString("hex");

export async function createUser(client: Client, email: string): Promise<string> {
  const id = uid();
  await client.query("insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())", [id, email]);
  return id;
}

export async function provisionOrg(client: Client, userId: string, email: string, name: string): Promise<string> {
  const { rows } = await client.query("select public.provision_organization($1, $2, $3::jsonb) as id", [
    userId,
    email,
    JSON.stringify({ name, industry: "Testing", country: "United States", contact_name: "Test", contact_title: "CEO" }),
  ]);
  return rows[0].id;
}

export async function publishedVersion(client: Client): Promise<{ versionId: string; rulesId: string }> {
  const v = await client.query("select id from assessment_versions where status = 'published' order by version_number desc limit 1");
  const r = await client.query("select id from scoring_rule_versions where status = 'published' order by version_number desc limit 1");
  return { versionId: v.rows[0].id, rulesId: r.rows[0].id };
}

export interface CampaignOptions {
  status?: "draft" | "open" | "closed";
  opensAt?: string;
  closesAt?: string;
  responseLimit?: number | null;
  requireAccessCode?: boolean;
  privacyMode?: "confidential" | "anonymous";
  departments?: string[];
  versionId?: string;
}

export async function createCampaign(client: Client, orgId: string, opts: CampaignOptions = {}) {
  const { versionId, rulesId } = await publishedVersion(client);
  const { rows } = await client.query(
    `insert into campaigns (org_id, assessment_version_id, scoring_rule_version_id, name, opens_at, closes_at,
                            response_limit, require_access_code, privacy_mode)
     values ($1, $2, $3, 'Test campaign', $4, $5, $6, $7, $8) returning id, survey_token`,
    [
      orgId,
      opts.versionId ?? versionId,
      rulesId,
      opts.opensAt ?? new Date(Date.now() - 86400000).toISOString(),
      opts.closesAt ?? new Date(Date.now() + 7 * 86400000).toISOString(),
      opts.responseLimit ?? null,
      opts.requireAccessCode ?? false,
      opts.privacyMode ?? "confidential",
    ],
  );
  const campaign = rows[0] as { id: string; survey_token: string };
  const departments: Record<string, string> = {};
  for (const [i, label] of (opts.departments ?? ["Operations", "Finance"]).entries()) {
    const r = await client.query(
      "insert into campaign_segment_options (campaign_id, kind, label, sort_order) values ($1, 'department', $2, $3) returning id",
      [campaign.id, label, i],
    );
    departments[label] = r.rows[0].id;
  }
  const status = opts.status ?? "open";
  if (status !== "draft") await client.query("update campaigns set status = 'open' where id = $1", [campaign.id]);
  if (status === "closed") await client.query("update campaigns set status = 'closed' where id = $1", [campaign.id]);
  return { ...campaign, departments };
}

export interface QuestionInfo {
  id: string;
  key: string;
  allow_na: boolean;
}

export async function questionsFor(client: Client, versionId?: string): Promise<QuestionInfo[]> {
  const v = versionId ?? (await publishedVersion(client)).versionId;
  const { rows } = await client.query(
    `select q.id, q.key, q.allow_na from questions q join dimensions d on d.id = q.dimension_id
     where q.version_id = $1 order by d.sort_order, q.sort_order`,
    [v],
  );
  return rows;
}

export function completeItems(
  questions: QuestionInfo[],
  rate: (q: QuestionInfo, i: number) => { current: number | null; desired: number | null; current_na?: boolean; desired_na?: boolean } = () => ({ current: 3, desired: 4 }),
) {
  return questions.map((q, i) => {
    const r = rate(q, i);
    return {
      question_id: q.id,
      current: r.current,
      current_na: r.current_na ?? false,
      desired: r.desired,
      desired_na: r.desired_na ?? false,
    };
  });
}

export async function submit(
  client: Client,
  surveyToken: string,
  hash: string,
  items: unknown[],
  profile: Record<string, unknown> = {},
  comments: unknown[] = [],
) {
  return client.query("select public.submit_survey_response($1, $2, $3::jsonb, $4::jsonb, $5::jsonb) as r", [
    surveyToken,
    hash,
    JSON.stringify(profile),
    JSON.stringify(items),
    JSON.stringify(comments),
  ]);
}
