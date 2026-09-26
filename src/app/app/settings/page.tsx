import type { Metadata } from "next";
import { requireOrgContext } from "@/lib/auth/session";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { OrganizationForm } from "@/components/app/settings-forms";

export const metadata: Metadata = { title: "Organization settings" };

export default async function OrganizationSettingsPage() {
  const ctx = await requireOrgContext();
  const o = ctx.org;
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Organization profile" description={ctx.role === "viewer" ? "Only owners and administrators can edit these details." : undefined} />
      <CardBody>
        <OrganizationForm
          readOnly={ctx.role === "viewer"}
          org={{
            id: o.id,
            name: o.name,
            industry: o.industry,
            employee_count_range: o.employee_count_range,
            website: o.website,
            country: o.country,
            region: o.region,
            contact_name: o.contact_name,
            contact_email: o.contact_email,
            contact_title: o.contact_title,
            contact_phone: o.contact_phone,
          }}
        />
      </CardBody>
    </Card>
  );
}
