import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { loadEntitlements } from "@/lib/org/entitlements";
import { toStoredReport } from "@/lib/reports/service";
import { renderExecutiveReportPdf } from "@/lib/reports/pdf/render";
import { logAppError, logAudit } from "@/lib/audit";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Read through RLS: only members of the report's organization can see it.
  const supabase = await createClient();
  const { data: row } = await supabase.from("ai_reports").select("*").eq("id", id).maybeSingle();
  if (!row || row.status !== "completed") return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await rateLimit("report-pdf", user.id, 30, 3600);
  } catch (err) {
    if (err instanceof RateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
  }

  const ent = await loadEntitlements(row.org_id);
  if (!ent.features.pdf_export) {
    return NextResponse.json({ error: "The executive PDF is available on ROHA Professional and above." }, { status: 403 });
  }
  const stored = toStoredReport(row);
  if (!stored.report || !stored.snapshot) return NextResponse.json({ error: "Report content is unavailable." }, { status: 422 });

  try {
    const pdf = await renderExecutiveReportPdf({
      report: stored.report,
      snapshot: stored.snapshot,
      generator: stored.generator,
      model: stored.model,
      generatedAt: stored.completedAt ?? stored.createdAt,
      reportId: stored.id,
    });
    const admin = createAdminClient();
    await admin.from("generated_reports").insert({
      org_id: row.org_id,
      campaign_id: row.campaign_id,
      ai_report_id: row.id,
      format: "pdf",
      byte_size: pdf.byteLength,
      sha256: createHash("sha256").update(pdf).digest("hex"),
      generated_by: user.id,
    });
    await logAudit({ orgId: row.org_id, actorUserId: user.id, actorEmail: user.email, action: "report.pdf_downloaded", targetType: "ai_report", targetId: row.id });
    const safeName = stored.snapshot.organization.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "organization";
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ROHA-Executive-Report-${safeName}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    await logAppError("reports.pdf", err, { reportId: id }, row.org_id);
    return NextResponse.json({ error: "The PDF could not be generated." }, { status: 500 });
  }
}
