import { ShieldCheck } from "lucide-react";
import { RohaLogo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-navy-900 px-12 py-10 text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <RohaLogo inverted showTagline />
        <div className="mt-auto max-w-md">
          <p className="font-serif text-3xl leading-tight text-white">{BRAND.tagline}</p>
          <p className="mt-4 text-navy-200">{BRAND.secondaryTagline}</p>
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-navy-100">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
            <p>
              Employee responses are confidential by design. Administrators see only aggregated results for groups of at
              least five respondents — never individual answers.
            </p>
          </div>
        </div>
        <p className="mt-10 text-xs text-navy-300">
          A product of {BRAND.company} · Founded by {BRAND.founder}
        </p>
      </aside>
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <RohaLogo />
        </div>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
