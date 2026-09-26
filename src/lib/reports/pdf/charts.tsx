/**
 * Vector charts for the ROHA Executive PDF, drawn with react-pdf Svg
 * primitives. Every value plotted comes from the deterministic snapshot.
 */
import { Circle, G, Line, Path, Polygon, Rect, Svg, Text } from "@react-pdf/renderer";
import type { ReportInputSnapshot } from "../../ai/report-schema";
import { clamp100, fmtGap, fmtScore, isNum } from "./format";
import { COLORS, FONTS } from "./styles";

type Dimension = ReportInputSnapshot["dimensions"][number];

const AXIS_TICKS = [0, 20, 40, 60, 80, 100];

/** Splits a label into at most two balanced lines. */
function splitLabel(label: string, maxChars = 16): string[] {
  if (label.length <= maxChars) return [label];
  const words = label.split(" ");
  let best: [string, string] = [label, ""];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.max(a.length, b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best[1] ? best : [best[0]];
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// ---------------------------------------------------------------------------
// Brand mark
// ---------------------------------------------------------------------------

/**
 * ROHA brand mark for PDFs (same geometry as the web mark in
 * src/components/brand/logo.tsx, drawn on a 40-unit grid and scaled).
 */
export function BrandMark({ size = 48, onDark = true }: { size?: number; onDark?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M34.1 25.13 A15 15 0 1 1 31.49 10.36" fill="none" stroke={onDark ? COLORS.white : COLORS.navy} strokeWidth={3.2} strokeLinecap="round" />
      <Circle cx={34.77} cy={17.4} r={2.2} fill={COLORS.emerald} />
      <Circle cx={20} cy={20} r={6.5} fill={COLORS.emerald} />
      <Circle cx={20} cy={20} r={2.4} fill={onDark ? COLORS.navy : COLORS.white} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Index gauge
// ---------------------------------------------------------------------------

/**
 * Horizontal 0–100 gauge with markers for the current and desired index and
 * a bracket showing the gap between them.
 */
export function IndexGauge({ current, desired, width }: { current: number | null; desired: number | null; width: number }) {
  const padX = 12;
  const trackW = width - padX * 2;
  const trackY = 44;
  const trackH = 14;
  const height = 96;
  const x = (v: number) => padX + (clamp100(v) / 100) * trackW;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* track */}
      <Rect x={padX} y={trackY} width={trackW} height={trackH} rx={3} ry={3} fill={COLORS.ruleLight} />
      {isNum(current) && <Rect x={padX} y={trackY} width={Math.max(2, x(current) - padX)} height={trackH} rx={3} ry={3} fill={COLORS.navy} />}
      {/* gap bracket */}
      {isNum(current) && isNum(desired) && desired > current && (
        <Rect x={x(current)} y={trackY + 4} width={x(desired) - x(current)} height={trackH - 8} fill={COLORS.emeraldTint} />
      )}
      {/* ticks */}
      {AXIS_TICKS.map((t) => (
        <G key={t}>
          <Line x1={x(t)} y1={trackY + trackH + 3} x2={x(t)} y2={trackY + trackH + 7} stroke={COLORS.faint} strokeWidth={0.6} />
          <Text x={x(t)} y={trackY + trackH + 16} style={{ fontSize: 7, fontFamily: FONTS.sans }} fill={COLORS.muted} textAnchor="middle">
            {String(t)}
          </Text>
        </G>
      ))}
      {/* current marker (above) */}
      {isNum(current) && (
        <G>
          <Line x1={x(current)} y1={trackY - 12} x2={x(current)} y2={trackY + trackH} stroke={COLORS.navy} strokeWidth={1.4} />
          <Text x={x(current)} y={trackY - 16} style={{ fontSize: 8, fontFamily: FONTS.sansBold }} fill={COLORS.navy} textAnchor="middle">
            {`Current ${fmtScore(current)}`}
          </Text>
        </G>
      )}
      {/* desired marker */}
      {isNum(desired) && (
        <G>
          <Line x1={x(desired)} y1={trackY - 4} x2={x(desired)} y2={trackY + trackH + 1} stroke={COLORS.emerald} strokeWidth={2} />
          <Circle cx={x(desired)} cy={trackY - 5} r={3.5} fill={COLORS.emerald} />
          <Text x={x(desired)} y={trackY - 26} style={{ fontSize: 8, fontFamily: FONTS.sansBold }} fill={COLORS.emeraldDark} textAnchor="middle">
            {`Desired ${fmtScore(desired)}`}
          </Text>
        </G>
      )}
      <Text x={padX} y={height - 4} style={{ fontSize: 6.5, fontFamily: FONTS.sans }} fill={COLORS.faint}>
        Organizational Health Index, 0–100 scale
      </Text>
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Radar chart
// ---------------------------------------------------------------------------

export function RadarChart({ dimensions, width = 300, height = 270 }: { dimensions: Dimension[]; width?: number; height?: number }) {
  const n = dimensions.length;
  const cx = width / 2;
  const cy = height / 2 + 2;
  const r = Math.min(width, height) / 2 - 52;
  if (n < 3) return null;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, v: number) => {
    const rr = (clamp100(v) / 100) * r;
    return [cx + rr * Math.cos(angle(i)), cy + rr * Math.sin(angle(i))] as const;
  };
  const ring = (v: number) =>
    dimensions
      .map((_, i) => point(i, v))
      .map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`)
      .join(" ");
  const series = (pick: (d: Dimension) => number | null) => {
    const pts = dimensions.map((d, i) => point(i, isNum(pick(d)) ? (pick(d) as number) : 0));
    return pts.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`).join(" ");
  };
  const hasDesired = dimensions.some((d) => isNum(d.desired));
  const hasCurrent = dimensions.some((d) => isNum(d.current));

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {[20, 40, 60, 80, 100].map((v) => (
        <Polygon key={v} points={ring(v)} fill={v === 100 ? COLORS.panel : "none"} stroke={COLORS.rule} strokeWidth={v === 100 ? 0.8 : 0.5} />
      ))}
      {dimensions.map((_, i) => {
        const [px, py] = point(i, 100);
        return <Line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke={COLORS.rule} strokeWidth={0.5} />;
      })}
      {[20, 40, 60, 80, 100].map((v) => (
        <Text key={`t${v}`} x={cx + 3} y={cy - (v / 100) * r - 2} style={{ fontSize: 5.5, fontFamily: FONTS.sans }} fill={COLORS.faint}>
          {String(v)}
        </Text>
      ))}
      {hasDesired && <Polygon points={series((d) => d.desired)} fill={COLORS.emerald} fillOpacity={0.08} stroke={COLORS.emerald} strokeWidth={1.6} />}
      {hasCurrent && <Polygon points={series((d) => d.current)} fill={COLORS.navy} fillOpacity={0.16} stroke={COLORS.navy} strokeWidth={1.8} />}
      {dimensions.map((d, i) => (
        <G key={`m${d.key}`}>
          {isNum(d.desired) && <Circle cx={point(i, d.desired)[0]} cy={point(i, d.desired)[1]} r={2.4} fill={COLORS.emerald} stroke={COLORS.white} strokeWidth={0.8} />}
          {isNum(d.current) && <Circle cx={point(i, d.current)[0]} cy={point(i, d.current)[1]} r={2.4} fill={COLORS.navy} stroke={COLORS.white} strokeWidth={0.8} />}
        </G>
      ))}
      {dimensions.map((d, i) => {
        const a = angle(i);
        const lx = cx + (r + 12) * Math.cos(a);
        const ly = cy + (r + 12) * Math.sin(a);
        const cos = Math.cos(a);
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        const lines = splitLabel(d.name);
        const sin = Math.sin(a);
        // Push labels at the top upwards and at the bottom downwards.
        const blockH = lines.length * 8.5 + 8;
        const y0 = sin < -0.5 ? ly - blockH + 6 : sin > 0.5 ? ly + 6 : ly - blockH / 2 + 7;
        return (
          <G key={`l${d.key}`}>
            {lines.map((line, li) => (
              <Text key={li} x={lx} y={y0 + li * 8.5} style={{ fontSize: 7.5, fontFamily: FONTS.sansBold }} fill={COLORS.navy} textAnchor={anchor}>
                {line}
              </Text>
            ))}
            <Text x={lx} y={y0 + lines.length * 8.5} style={{ fontSize: 6.8, fontFamily: FONTS.sans }} fill={COLORS.muted} textAnchor={anchor}>
              {`${fmtScore(d.current)} / ${fmtScore(d.desired)}`}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Grouped horizontal bars: current vs desired per dimension
// ---------------------------------------------------------------------------

export function GroupedBarChart({ dimensions, width }: { dimensions: Dimension[]; width: number }) {
  const labelW = 150;
  const valueW = 30;
  const plotX = labelW;
  const plotW = width - labelW - valueW;
  const top = 16;
  const barH = 8;
  const rowH = 34;
  const height = top + dimensions.length * rowH + 4;
  const x = (v: number) => plotX + (clamp100(v) / 100) * plotW;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {AXIS_TICKS.map((t) => (
        <G key={t}>
          <Line x1={x(t)} y1={top - 4} x2={x(t)} y2={height - 4} stroke={t === 0 ? COLORS.faint : COLORS.ruleLight} strokeWidth={t === 0 ? 0.8 : 0.5} />
          <Text x={x(t)} y={top - 7} style={{ fontSize: 6.5, fontFamily: FONTS.sans }} fill={COLORS.faint} textAnchor="middle">
            {String(t)}
          </Text>
        </G>
      ))}
      {dimensions.map((d, i) => {
        const y = top + i * rowH + 7;
        return (
          <G key={d.key}>
            <Text x={0} y={y + barH + 3} style={{ fontSize: 8, fontFamily: FONTS.sansBold }} fill={COLORS.navy}>
              {truncate(d.name, 30)}
            </Text>
            {isNum(d.current) ? (
              <G>
                <Rect x={plotX} y={y} width={Math.max(1, x(d.current) - plotX)} height={barH} fill={COLORS.navy} />
                <Text x={x(d.current) + 4} y={y + 6.5} style={{ fontSize: 6.8, fontFamily: FONTS.sans }} fill={COLORS.ink}>
                  {fmtScore(d.current)}
                </Text>
              </G>
            ) : (
              <Text x={plotX + 4} y={y + 6.5} style={{ fontSize: 6.8, fontFamily: FONTS.sans }} fill={COLORS.muted}>
                — (suppressed or no data)
              </Text>
            )}
            {isNum(d.desired) ? (
              <G>
                <Rect x={plotX} y={y + barH + 2} width={Math.max(1, x(d.desired) - plotX)} height={barH} fill={COLORS.emerald} />
                <Text x={x(d.desired) + 4} y={y + barH + 8.5} style={{ fontSize: 6.8, fontFamily: FONTS.sans }} fill={COLORS.ink}>
                  {fmtScore(d.desired)}
                </Text>
              </G>
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Gap chart (desired − current)
// ---------------------------------------------------------------------------

const GAP_COLORS: Record<string, string> = {
  aligned: "#9aa3b2",
  notable: "#c2710c",
  substantial: "#9f1d2b",
};

export function GapChart({ dimensions, width }: { dimensions: Dimension[]; width: number }) {
  const labelW = 150;
  const valueW = 110;
  const plotX = labelW;
  const plotW = width - labelW - valueW;
  const top = 16;
  const rowH = 20;
  const barH = 9;
  const height = top + dimensions.length * rowH + 4;
  const gaps = dimensions.map((d) => d.gap).filter(isNum);
  const maxV = Math.max(10, ...gaps.map((g) => Math.ceil(g / 10) * 10));
  const minV = Math.min(0, ...gaps.map((g) => Math.floor(g / 10) * 10));
  const span = maxV - minV || 1;
  const x = (v: number) => plotX + ((v - minV) / span) * plotW;
  const ticks: number[] = [];
  const step = span > 40 ? 20 : span > 20 ? 10 : 5;
  for (let t = minV; t <= maxV + 0.001; t += step) ticks.push(t);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {ticks.map((t) => (
        <G key={t}>
          <Line x1={x(t)} y1={top - 4} x2={x(t)} y2={height - 4} stroke={t === 0 ? COLORS.faint : COLORS.ruleLight} strokeWidth={t === 0 ? 0.8 : 0.5} />
          <Text x={x(t)} y={top - 7} style={{ fontSize: 6.5, fontFamily: FONTS.sans }} fill={COLORS.faint} textAnchor="middle">
            {t > 0 ? `+${t}` : String(t)}
          </Text>
        </G>
      ))}
      {dimensions.map((d, i) => {
        const y = top + i * rowH + 5;
        const color = GAP_COLORS[d.gapCategory ?? ""] ?? COLORS.navySoft;
        const g = d.gap;
        return (
          <G key={d.key}>
            <Text x={0} y={y + 7} style={{ fontSize: 8, fontFamily: FONTS.sansBold }} fill={COLORS.navy}>
              {truncate(d.name, 30)}
            </Text>
            {isNum(g) ? (
              <G>
                <Rect x={Math.min(x(0), x(g))} y={y} width={Math.max(1, Math.abs(x(g) - x(0)))} height={barH} fill={color} />
                <Text x={plotX + plotW + 8} y={y + 7} style={{ fontSize: 7.5, fontFamily: FONTS.sansBold }} fill={COLORS.ink}>
                  {fmtGap(g)}
                </Text>
                <Text x={plotX + plotW + 36} y={y + 7} style={{ fontSize: 7, fontFamily: FONTS.sans }} fill={COLORS.muted}>
                  {d.gapCategory ? d.gapCategory.charAt(0).toUpperCase() + d.gapCategory.slice(1) : ""}
                </Text>
              </G>
            ) : (
              <Text x={plotX + plotW + 8} y={y + 7} style={{ fontSize: 7.5, fontFamily: FONTS.sans }} fill={COLORS.muted}>
                —
              </Text>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

export { GAP_COLORS };
