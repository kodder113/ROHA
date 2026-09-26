import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENURE_OPTIONS } from "@/lib/results/segments";

export interface SurveyQuestion {
  id: string;
  key: string;
  prompt: string;
  focus: string;
  allowNa: boolean;
}

export interface SurveySection {
  key: string;
  code: string;
  name: string;
  description: string;
  questions: SurveyQuestion[];
}

export interface SurveyDefinition {
  surveyToken: string;
  campaignName: string;
  description: string | null;
  organizationName: string;
  privacyMode: "confidential" | "anonymous";
  requireAccessCode: boolean;
  closesAt: string;
  opensAt: string;
  currentLabel: string;
  desiredLabel: string;
  sections: SurveySection[];
  qualitative: { id: string; key: string; prompt: string }[];
  profileOptions: {
    departments: { id: string; label: string }[];
    locations: { id: string; label: string }[];
    levels: { id: string; label: string }[];
    tenure: { key: string; label: string }[];
  };
}

export type SurveyLoadResult =
  | { state: "not_found" }
  | { state: "not_open"; organizationName: string; campaignName: string; opensAt: string }
  | { state: "closed"; organizationName: string; campaignName: string }
  | { state: "open"; survey: SurveyDefinition };

/** Loads only the public, non-sensitive information needed to render a survey. */
export async function loadSurvey(surveyToken: string, opts: { preview?: boolean } = {}): Promise<SurveyLoadResult> {
  if (!/^[a-f0-9]{16,64}$/i.test(surveyToken)) return { state: "not_found" };
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("*, organizations(name, status)")
    .eq("survey_token", surveyToken)
    .maybeSingle();
  if (!campaign || !campaign.organizations) return { state: "not_found" };
  const org = campaign.organizations as { name: string; status: string };
  const now = Date.now();
  if (!opts.preview) {
    if (org.status !== "active") return { state: "closed", organizationName: org.name, campaignName: campaign.name };
    if (campaign.status === "closed" || new Date(campaign.closes_at).getTime() <= now) {
      return { state: "closed", organizationName: org.name, campaignName: campaign.name };
    }
    if (campaign.status === "draft" || new Date(campaign.opens_at).getTime() > now) {
      return { state: "not_open", organizationName: org.name, campaignName: campaign.name, opensAt: campaign.opens_at };
    }
  }

  const [{ data: version }, { data: dims }, { data: qs }, { data: qual }, { data: options }] = await Promise.all([
    admin.from("assessment_versions").select("current_label, desired_label").eq("id", campaign.assessment_version_id).single(),
    admin.from("dimensions").select("*").eq("version_id", campaign.assessment_version_id).order("sort_order"),
    admin.from("questions").select("*").eq("version_id", campaign.assessment_version_id).order("sort_order"),
    admin.from("qualitative_questions").select("id, key, prompt").eq("version_id", campaign.assessment_version_id).order("sort_order"),
    admin.from("campaign_segment_options").select("id, kind, label").eq("campaign_id", campaign.id).order("sort_order"),
  ]);
  const confidential = campaign.privacy_mode === "confidential";
  const opt = (kind: string) => (confidential ? (options ?? []).filter((o) => o.kind === kind).map((o) => ({ id: o.id, label: o.label })) : []);

  return {
    state: "open",
    survey: {
      surveyToken,
      campaignName: campaign.name,
      description: campaign.description,
      organizationName: org.name,
      privacyMode: campaign.privacy_mode as "confidential" | "anonymous",
      requireAccessCode: campaign.require_access_code,
      closesAt: campaign.closes_at,
      opensAt: campaign.opens_at,
      currentLabel: version?.current_label ?? "Current state",
      desiredLabel: version?.desired_label ?? "Desired state",
      sections: (dims ?? []).map((d) => ({
        key: d.key,
        code: d.code,
        name: d.name,
        description: d.description,
        questions: (qs ?? [])
          .filter((q) => q.dimension_id === d.id)
          .map((q) => ({ id: q.id, key: q.key, prompt: q.prompt, focus: q.focus, allowNa: q.allow_na })),
      })),
      qualitative: qual ?? [],
      profileOptions: {
        departments: opt("department"),
        locations: opt("location"),
        levels: campaign.collect_levels ? opt("level") : [],
        tenure: confidential ? TENURE_OPTIONS : [],
      },
    },
  };
}
