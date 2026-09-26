/**
 * Visual system for the ROHA Executive PDF report.
 *
 * Built-in PDF fonts only (Helvetica / Times) so rendering never touches the
 * network. All measurements are PDF points (1/72 in).
 */
import { StyleSheet } from "@react-pdf/renderer";

export const COLORS = {
  navy: "#0a1a36",
  navySoft: "#1c2f55",
  navyTint: "#e8ecf4",
  emerald: "#059669",
  emeraldDark: "#047857",
  emeraldTint: "#e7f5ef",
  amber: "#b45309",
  amberTint: "#fdf4e7",
  ink: "#1f2937",
  body: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  rule: "#d9dde3",
  ruleLight: "#eceef1",
  panel: "#f6f7f9",
  white: "#ffffff",
} as const;

export const FONTS = {
  sans: "Helvetica",
  sansBold: "Helvetica-Bold",
  sansOblique: "Helvetica-Oblique",
  serif: "Times-Roman",
  serifBold: "Times-Bold",
  serifItalic: "Times-Italic",
} as const;

/** Page geometry (LETTER = 612 × 792 pt). */
export const PAGE = {
  width: 612,
  height: 792,
  marginX: 60,
  marginTop: 78,
  marginBottom: 70,
} as const;

export const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2;

export const styles = StyleSheet.create({
  page: {
    fontFamily: FONTS.sans,
    fontSize: 9.5,
    color: COLORS.body,
    // NOTE: never set lineHeight on Page/View styles. react-pdf re-applies an
    // inherited lineHeight multiplier each time a page with dynamic content
    // (page numbers) is re-laid out, which grows it exponentially.
    paddingTop: PAGE.marginTop,
    paddingBottom: PAGE.marginBottom,
    paddingHorizontal: PAGE.marginX,
    backgroundColor: COLORS.white,
  },

  // Running header / footer ------------------------------------------------
  header: {
    position: "absolute",
    top: 30,
    left: PAGE.marginX,
    right: PAGE.marginX,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 6,
    borderBottomWidth: 0.6,
    borderBottomColor: COLORS.rule,
  },
  headerLeft: { fontSize: 7.5, color: COLORS.navy, fontFamily: FONTS.sansBold, letterSpacing: 0.3 },
  headerRight: { fontSize: 7.5, color: COLORS.muted, maxWidth: 200, textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: PAGE.marginX,
    right: PAGE.marginX,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 0.6,
    borderTopColor: COLORS.rule,
    fontSize: 7,
    color: COLORS.muted,
  },
  footerCell: { width: "36%" },
  footerCenter: { width: "28%", textAlign: "center", color: COLORS.navy, fontFamily: FONTS.sansBold },
  footerRight: { width: "36%", textAlign: "right" },

  // Section headings -------------------------------------------------------
  sectionHead: { marginBottom: 14 },
  sectionKicker: {
    fontSize: 8,
    fontFamily: FONTS.sansBold,
    color: COLORS.emerald,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 20, fontFamily: FONTS.serifBold, color: COLORS.navy, lineHeight: 1.2 },
  sectionRule: { marginTop: 8, height: 2, width: 44, backgroundColor: COLORS.emerald },
  sectionIntro: { marginTop: 10, fontSize: 9.5, color: COLORS.muted, fontFamily: FONTS.sansOblique },

  h3: { fontSize: 12, fontFamily: FONTS.sansBold, color: COLORS.navy, marginTop: 14, marginBottom: 6 },
  h4: { fontSize: 9.5, fontFamily: FONTS.sansBold, color: COLORS.navy, marginTop: 8, marginBottom: 4 },
  label: {
    fontSize: 7,
    fontFamily: FONTS.sansBold,
    color: COLORS.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  paragraph: { fontSize: 9.5, lineHeight: 1.45, marginBottom: 7, color: COLORS.body, textAlign: "justify" },
  lead: { fontSize: 11, fontFamily: FONTS.serif, color: COLORS.ink, lineHeight: 1.5, marginBottom: 8 },
  small: { fontSize: 8, lineHeight: 1.4, color: COLORS.muted },
  empty: { fontSize: 9, color: COLORS.muted, fontFamily: FONTS.sansOblique, marginVertical: 4 },

  bulletRow: { flexDirection: "row", marginBottom: 6 },
  bulletDot: { width: 12, color: COLORS.emerald, fontFamily: FONTS.sansBold },
  // A unitless lineHeight is resolved against the node's own fontSize (not
  // the inherited one), so every style with lineHeight also sets fontSize.
  bulletBody: { flex: 1 },
  bulletText: { fontSize: 9.5, lineHeight: 1.45 },

  // Panels / cards ---------------------------------------------------------
  panel: { backgroundColor: COLORS.panel, padding: 12, borderRadius: 3, marginVertical: 8 },
  note: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.navy,
    backgroundColor: COLORS.navyTint,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginVertical: 8,
    fontSize: 8.5,
    color: COLORS.navy,
  },
  noteText: { fontSize: 8.5, color: COLORS.navy, lineHeight: 1.4 },

  // Tables -----------------------------------------------------------------
  table: { marginTop: 6, marginBottom: 10, borderTopWidth: 1, borderTopColor: COLORS.navy },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.ruleLight,
    paddingVertical: 4.5,
  },
  thRow: {
    flexDirection: "row",
    borderBottomWidth: 0.8,
    borderBottomColor: COLORS.navy,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
  },
  th: { fontSize: 7, fontFamily: FONTS.sansBold, color: COLORS.navy, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 3 },
  td: { fontSize: 8.5, lineHeight: 1.35, paddingHorizontal: 3, color: COLORS.body },
  tdNum: { fontSize: 8.5, paddingHorizontal: 3, textAlign: "right", color: COLORS.ink },
  tdBold: { fontSize: 8.5, paddingHorizontal: 3, fontFamily: FONTS.sansBold, color: COLORS.navy },
  groupRow: {
    flexDirection: "row",
    backgroundColor: COLORS.panel,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.rule,
  },
});
