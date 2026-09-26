/** Shared navigation configuration for the public marketing site. */
export interface NavItem {
  href: string;
  label: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/how-it-works", label: "How ROHA Works" },
  { href: "/framework", label: "Framework" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/**
 * Dimension names used only when the published framework cannot be loaded
 * from the database. Descriptions and statements are never hardcoded.
 */
export const FALLBACK_DIMENSION_NAMES = [
  "Leadership Effectiveness",
  "Organizational Culture",
  "Employee Engagement",
  "Operational Effectiveness",
  "Innovation and Adaptability",
  "Strategic Alignment",
] as const;

/** Descriptive interpretation bands (mirrors scoring rule version 1). */
export const INTERPRETATION_BANDS = [
  { range: "0–39", label: "Needs focused attention", tone: "bg-amber-500" },
  { range: "40–59", label: "Mixed perceptions", tone: "bg-navy-300" },
  { range: "60–79", label: "Generally favorable", tone: "bg-emerald-400" },
  { range: "80–100", label: "Strongly favorable", tone: "bg-emerald-600" },
] as const;
