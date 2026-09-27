import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BRAND } from "@/lib/brand";

/** Site-wide "free during the pilot" banner, shown while BRAND.pilot.active is on. */
export function PilotBanner() {
  if (!BRAND.pilot.active) return null;
  return (
    <div className="bg-emerald-600 text-white">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-sm">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-semibold">{BRAND.pilot.banner}</span>
        <span className="text-emerald-50">{BRAND.pilot.detail}</span>
        <Link href="/get-started" className="font-semibold underline underline-offset-4 hover:text-emerald-50">
          Join the pilot
        </Link>
      </p>
    </div>
  );
}
