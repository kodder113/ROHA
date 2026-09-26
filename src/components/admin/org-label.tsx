import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/** Organization name linking to its admin detail page, with demo / pilot markers. */
export function OrgLabel({
  id,
  org,
}: {
  id: string | null | undefined;
  org?: { name: string; is_demo?: boolean; is_pilot?: boolean } | null;
}) {
  if (!id) return <span className="text-muted">—</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Link href={`/admin/organizations/${id}`} className="font-medium text-navy-900 hover:text-emerald-700 hover:underline">
        {org?.name ?? "Unknown organization"}
      </Link>
      {org?.is_demo ? <Badge tone="violet">Demonstration (synthetic data)</Badge> : null}
      {org?.is_pilot ? <Badge tone="amber">Pilot</Badge> : null}
    </span>
  );
}
