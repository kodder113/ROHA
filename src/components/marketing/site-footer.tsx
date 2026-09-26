import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RohaLogo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";

const productLinks = [
  { href: "/how-it-works", label: "How ROHA Works" },
  { href: "/framework", label: "The ROHA Framework" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Demonstration dashboard" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-navy-300">{children}</h2>;
}

const linkClass = "text-sm text-navy-100 transition-colors hover:text-white";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-navy-950 text-navy-100">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <RohaLogo inverted showTagline />
            <p className="mt-6 max-w-sm font-serif text-xl leading-snug text-white">{BRAND.tagline}</p>
            <p className="mt-2 text-sm text-navy-300">{BRAND.secondaryTagline}</p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-navy-200">
              A product of{" "}
              <a href={BRAND.companyUrl} className="font-medium text-white underline decoration-emerald-500/60 underline-offset-4 hover:decoration-emerald-400">
                {BRAND.company}
              </a>
              , founded by {BRAND.founder}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <nav aria-labelledby="footer-product">
              <FooterHeading>
                <span id="footer-product">Product</span>
              </FooterHeading>
              <ul className="mt-4 space-y-3">
                {productLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-labelledby="footer-company">
              <FooterHeading>
                <span id="footer-company">Company</span>
              </FooterHeading>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/about" className={linkClass}>
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={linkClass}>
                    Contact
                  </Link>
                </li>
                <li>
                  <a href={BRAND.companyUrl} className={`${linkClass} inline-flex items-center gap-1`}>
                    rodrikconsulting.com
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </li>
              </ul>
            </nav>
            <nav aria-labelledby="footer-legal">
              <FooterHeading>
                <span id="footer-legal">Legal</span>
              </FooterHeading>
              <ul className="mt-4 space-y-3">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-14 border-t border-navy-800 pt-8">
          <p className="text-sm text-navy-200">
            © {year} {BRAND.company}. All rights reserved.
          </p>
          <p className="mt-3 max-w-4xl text-xs leading-relaxed text-navy-300">{BRAND.independenceStatement}</p>
        </div>
      </div>
    </footer>
  );
}
