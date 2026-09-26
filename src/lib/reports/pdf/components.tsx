/**
 * Layout building blocks shared by the ROHA Executive PDF sections.
 */
import type { ReactNode } from "react";
import { Text, View, type Styles } from "@react-pdf/renderer";
import { BRAND } from "../../brand";
import { COLORS, FONTS, styles } from "./styles";

type Style = Styles[string];

export const REPORT_TITLE = "Organizational Health & Executive Intelligence Report";
export const EMPTY_TEXT = "No items identified.";

/** Records the page on which each section starts (used by the contents page). */
export type PageRegistry = Map<string, number>;

// ---------------------------------------------------------------------------
// Running header & footer
// ---------------------------------------------------------------------------

export function RunningChrome({ orgName }: { orgName: string }) {
  return (
    <>
      <View style={styles.header} fixed>
        <Text style={styles.headerLeft}>{`ROHA · ${REPORT_TITLE}`}</Text>
        <Text style={styles.headerRight}>{orgName}</Text>
      </View>
      <View style={styles.footer} fixed>
        <Text style={styles.footerCell}>{`Confidential — prepared for ${orgName}`}</Text>
        <Text style={styles.footerCenter}>{BRAND.company}</Text>
        <Text style={styles.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// Headings
// ---------------------------------------------------------------------------

export function SectionHeading({
  id,
  number,
  title,
  intro,
  registry,
}: {
  id: string;
  number: number;
  title: string;
  intro?: string;
  registry?: PageRegistry;
}) {
  return (
    <View style={styles.sectionHead} wrap={false} minPresenceAhead={120}>
      {registry ? (
        <Text
          style={{ fontSize: 1, color: COLORS.white, height: 1 }}
          render={({ pageNumber }) => {
            // react-pdf evaluates render props on several layout passes; the
            // last call carries the final page number, so last write wins.
            registry.set(id, pageNumber);
            return " ";
          }}
        />
      ) : null}
      <Text style={styles.sectionKicker}>{`Section ${number}`}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRule} />
      {intro ? <Text style={styles.sectionIntro}>{intro}</Text> : null}
    </View>
  );
}

export function SubHeading({ children, style }: { children: ReactNode; style?: Style }) {
  return (
    <Text style={style ? [styles.h3, style] : styles.h3} minPresenceAhead={60}>
      {children}
    </Text>
  );
}

export function MinorHeading({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.h4} minPresenceAhead={40}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/** Renders text with blank-line separated paragraphs. */
export function Paragraphs({ text, lead = false }: { text: string | null | undefined; lead?: boolean }) {
  const parts = (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (parts.length === 0) return <Empty />;
  return (
    <>
      {parts.map((p, i) => (
        <Text key={i} style={lead && i === 0 ? styles.lead : styles.paragraph}>
          {p}
        </Text>
      ))}
    </>
  );
}

export function Empty({ text = EMPTY_TEXT }: { text?: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export function Bullets({ items }: { items: string[] }) {
  const clean = items.map((s) => s.trim()).filter(Boolean);
  if (clean.length === 0) return <Empty />;
  return (
    <View>
      {clean.map((item, i) => (
        <View key={i} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <View style={styles.bulletBody}>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tags & cards
// ---------------------------------------------------------------------------

export function Tag({ label, color, background }: { label: string; color: string; background: string }) {
  return (
    <View style={{ flexDirection: "row" }}>
      <Text
        style={{
          fontSize: 6.5,
          fontFamily: FONTS.sansBold,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color,
          backgroundColor: background,
          paddingHorizontal: 5,
          paddingTop: 2,
          paddingBottom: 1.5,
          borderRadius: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export const FINDING_TAG = { label: "Finding · supported by data", color: COLORS.emeraldDark, background: COLORS.emeraldTint };
export const HYPOTHESIS_TAG = { label: "Hypothesis · to investigate", color: COLORS.amber, background: COLORS.amberTint };

export function AccentCard({ accent, children, background = COLORS.white }: { accent: string; children: ReactNode; background?: string }) {
  return (
    <View
      style={{
        borderLeftWidth: 2.5,
        borderLeftColor: accent,
        backgroundColor: background,
        paddingLeft: 10,
        paddingRight: 8,
        paddingVertical: 7,
        marginBottom: 7,
      }}
      wrap={false}
    >
      {children}
    </View>
  );
}

export function KeyFigure({ label, value, sub, accent = COLORS.navy }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 4, borderLeftWidth: 0.6, borderLeftColor: COLORS.rule }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={{ fontSize: 20, fontFamily: FONTS.serifBold, color: accent, marginTop: 3, lineHeight: 1.1 }}>{value}</Text>
      {sub ? <Text style={{ fontSize: 7, color: COLORS.muted, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

export function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", paddingVertical: 3.5, borderBottomWidth: 0.5, borderBottomColor: COLORS.ruleLight }} wrap={false}>
      <Text style={{ width: "40%", fontSize: 8.5, color: COLORS.muted }}>{label}</Text>
      <Text style={{ width: "60%", fontSize: 8.5, color: COLORS.ink, fontFamily: FONTS.sansBold }}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export interface Column<T> {
  header: string;
  width: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  bold?: boolean;
}

export function DataTable<T>({ columns, rows, keyOf }: { columns: Column<T>[]; rows: T[]; keyOf: (row: T, i: number) => string }) {
  if (rows.length === 0) return <Empty />;
  return (
    <View style={styles.table}>
      <View style={styles.thRow} fixed>
        {columns.map((c) => (
          <Text key={c.header} style={[styles.th, { width: c.width, textAlign: c.align ?? "left" }]}>
            {c.header}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={keyOf(row, i)} style={styles.tr} wrap={false}>
          {columns.map((c) => {
            const content = c.render(row);
            const base = c.bold ? styles.tdBold : c.align === "right" ? styles.tdNum : styles.td;
            return typeof content === "string" || typeof content === "number" ? (
              <Text key={c.header} style={[base, { width: c.width, textAlign: c.align ?? "left" }]}>
                {content}
              </Text>
            ) : (
              <View key={c.header} style={{ width: c.width, paddingHorizontal: 3 }}>
                {content}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
