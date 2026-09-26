import type { Metadata } from "next";
import { CalendarClock, Lock, SearchX } from "lucide-react";
import { loadSurvey } from "@/lib/survey/load";
import { SurveyApp } from "@/components/survey/survey-app";
import { RohaLogo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Organizational Health Assessment",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

function StatusPage({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-16 text-center">
      <RohaLogo href={null} showTagline />
      <div className="mt-10 max-w-md rounded-2xl border border-line bg-white p-8 shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-700">{icon}</div>
        <h1 className="mt-4 text-2xl font-semibold text-navy-900">{title}</h1>
        <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
      </div>
      <p className="mt-8 text-xs text-muted">{BRAND.productFull} · {BRAND.company}</p>
    </div>
  );
}

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await loadSurvey(token);
  if (result.state === "not_found") {
    return (
      <StatusPage icon={<SearchX className="h-6 w-6" />} title="Survey not found">
        This survey link is not valid. Please check the link you received from your organization.
      </StatusPage>
    );
  }
  if (result.state === "not_open") {
    return (
      <StatusPage icon={<CalendarClock className="h-6 w-6" />} title="This assessment has not opened yet">
        The {result.campaignName} for {result.organizationName} opens on {formatDateTime(result.opensAt)}. Please come back then.
      </StatusPage>
    );
  }
  if (result.state === "closed") {
    return (
      <StatusPage icon={<Lock className="h-6 w-6" />} title="This assessment is closed">
        The {result.campaignName} for {result.organizationName} is no longer accepting responses. Thank you for your interest.
      </StatusPage>
    );
  }
  return <SurveyApp survey={result.survey} />;
}
