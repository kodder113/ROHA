import { RohaLogo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <RohaLogo />
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy-900">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">The page you are looking for does not exist, or you do not have access to it.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Return home</ButtonLink>
        <ButtonLink href="/app" variant="outline">
          Go to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
