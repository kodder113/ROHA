import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getResultsView } from "@/lib/results/service";
import { resultsToCsv } from "@/lib/results/export";
import { logAudit } from "@/lib/audit";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    await rateLimit("results-export", user.id, 30, 3600);
  } catch (err) {
    if (err instanceof RateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
  }
  const view = await getResultsView(campaign);
  if (view.status !== "ready") return NextResponse.json({ error: "Results have not been released for this assessment." }, { status: 409 });
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  await logAudit({ orgId: campaign.org_id, actorUserId: user.id, actorEmail: user.email, action: "results.exported", targetType: "campaign", targetId: id, metadata: { format } });
  const base = `roha-results-${campaign.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  if (format === "json") {
    return new NextResponse(JSON.stringify({ campaign: { id: campaign.id, name: campaign.name, closedAt: campaign.closed_at }, participation: view.participation, results: view.payload }, null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${base}.json"`, "Cache-Control": "private, no-store" },
    });
  }
  return new NextResponse(resultsToCsv(view.payload), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${base}.csv"`, "Cache-Control": "private, no-store" },
  });
}
