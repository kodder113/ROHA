"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOrgRole, ForbiddenError, MANAGE_ROLES } from "@/lib/auth/session";
import { getCampaign } from "@/lib/campaigns/queries";
import { loadEntitlements } from "@/lib/org/entitlements";
import { generateReport } from "@/lib/reports/service";
import { AIReportError } from "@/lib/ai/anthropic-report";
import { logAudit } from "@/lib/audit";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";

export interface ReportActionState {
  error?: string;
  message?: string;
}

const schema = z.object({ orgId: z.uuid(), campaignId: z.uuid(), level: z.enum(["basic", "full"]) });

export async function generateReportAction(_: ReportActionState, formData: FormData): Promise<ReportActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request." };
  const { orgId, campaignId, level } = parsed.data;
  try {
    const ctx = await assertOrgRole(orgId, MANAGE_ROLES);
    await rateLimit("report-generate", orgId, 10, 3600);
    const found = await getCampaign(orgId, campaignId);
    if (!found) throw new ForbiddenError("Assessment not found.");
    const ent = await loadEntitlements(orgId);
    if (level === "full" && ent.features.ai_report !== "full") {
      return { error: "AI-generated organizational analysis is available on ROHA Professional and above." };
    }
    const report = await generateReport({ org: ctx.org, campaign: found.campaign, level, userId: ctx.user.id });
    await logAudit({
      orgId,
      actorUserId: ctx.user.id,
      actorEmail: ctx.user.email,
      action: "report.generated",
      targetType: "ai_report",
      targetId: report.id,
      metadata: { campaign_id: campaignId, level, generator: report.generator },
    });
    revalidatePath(`/app/campaigns/${campaignId}/report`);
    return {
      message:
        report.generator === "anthropic"
          ? "Your executive intelligence report is ready."
          : level === "full"
            ? "The AI service is not configured, so a rules-based summary was generated instead."
            : "Your executive summary is ready.",
    };
  } catch (err) {
    if (err instanceof AIReportError || err instanceof ForbiddenError || err instanceof RateLimitError) return { error: err.message };
    return { error: "Report generation failed. Please try again." };
  }
}
