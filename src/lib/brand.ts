/** Product and company identity used across the site, app and reports. */
export const BRAND = {
  product: "ROHA",
  productFull: "Rodrik Organizational Health Assessment",
  tagline: "Organizational Intelligence. Human-Centered Leadership.",
  secondaryTagline: "Powered by AI. Grounded in Strategic Leadership.",
  company: "Rodrik Consulting LLC",
  companyUrl: "https://rodrikconsulting.com",
  /**
   * Pilot mode: prices are hidden everywhere and a "free during the pilot"
   * banner is shown. Set `active` to false (and redeploy) when ready to charge.
   */
  pilot: {
    active: true,
    banner: "ROHA is free during our pilot.",
    detail: "Sign up, then contact Dr. Rodriguez to unlock full access.",
    contactEmail: "oscar@rodrikconsulting.com",
  },
  /** Production address of the ROHA application. */
  appUrl: "https://roha.droscarrodriguez.com",
  founder: "Dr. Oscar A. Rodriguez, DSL",
  founderName: "Dr. Oscar A. Rodriguez",
  founderCredential: "Doctor of Strategic Leadership (DSL)",
  surveyWelcome: "Your perspective matters. Help your organization understand what is working and what can be improved.",
  independenceStatement:
    "ROHA is an organizational health assessment developed independently by Rodrik Consulting LLC. It is not affiliated with, endorsed by, or derived from any other assessment instrument. ROHA is in its initial release: its dimensions draw on concepts that are well established in organizational research, but ROHA's own questions and scoring have not yet been empirically tested for reliability or validity.",
} as const;
