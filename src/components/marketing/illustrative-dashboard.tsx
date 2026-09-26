import { Sparkles } from "lucide-react";

/**
 * Purely illustrative product visual. Shapes are decorative and do not
 * represent any real organization's results; no values are displayed.
 */

const DEFAULT_CODES = ["LE", "OC", "EE", "OE", "IA", "SA"];
// Relative radii (0–1) chosen only to produce a readable shape.
const CURRENT_POOL = [0.62, 0.7, 0.55, 0.48, 0.58, 0.66, 0.6, 0.52];
const DESIRED_POOL = [0.86, 0.84, 0.82, 0.8, 0.88, 0.85, 0.83, 0.87];

const CX = 120;
const CY = 120;
const R = 92;

function point(i: number, n: number, r: number) {
  const angle = ((2 * Math.PI) / n) * i - Math.PI / 2;
  return [CX + Math.cos(angle) * R * r, CY + Math.sin(angle) * R * r] as const;
}

function polygon(values: number[]) {
  return values.map((v, i) => point(i, values.length, v).map((n) => n.toFixed(1)).join(",")).join(" ");
}

/** `codes` are the dimension codes of the published framework; the shape adapts to their number. */
export function IllustrativeDashboard({ codes = DEFAULT_CODES }: { codes?: string[] }) {
  const AXES = codes.length >= 3 ? codes : DEFAULT_CODES;
  const n = AXES.length;
  const CURRENT = AXES.map((_, i) => CURRENT_POOL[i % CURRENT_POOL.length]);
  const DESIRED = AXES.map((_, i) => DESIRED_POOL[i % DESIRED_POOL.length]);
  const rings = [0.25, 0.5, 0.75, 1];
  return (
    <figure className="relative" aria-labelledby="illustrative-caption">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white shadow-elevated">
        {/* Window chrome */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-navy-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-navy-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-navy-200" />
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800 ring-1 ring-amber-200 ring-inset">
            Illustrative example
          </span>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[1.1fr_1fr] sm:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Current vs. desired</p>
            <p className="mt-1 font-serif text-lg font-semibold text-navy-900">Organizational health profile</p>
            <svg viewBox="0 0 240 240" className="mx-auto mt-3 w-full max-w-[260px]" role="img" aria-label="Illustrative dimension radar chart with no real data">
              <g fill="none" stroke="#e2e7ef" strokeWidth="1">
                {rings.map((r) => (
                  <polygon key={r} points={polygon(Array(n).fill(r))} />
                ))}
                {AXES.map((_, i) => {
                  const [x, y] = point(i, n, 1);
                  return <line key={i} x1={CX} y1={CY} x2={x} y2={y} />;
                })}
              </g>
              <polygon points={polygon(DESIRED)} fill="#059669" fillOpacity="0.08" stroke="#059669" strokeWidth="2" strokeDasharray="5 4" />
              <polygon points={polygon(CURRENT)} fill="#18335f" fillOpacity="0.16" stroke="#18335f" strokeWidth="2" />
              {CURRENT.map((v, i) => {
                const [x, y] = point(i, n, v);
                return <circle key={i} cx={x} cy={y} r="3" fill="#18335f" />;
              })}
              {AXES.map((label, i) => {
                const [x, y] = point(i, n, 1.17);
                return (
                  <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="600" fill="#5a6778">
                    {label}
                  </text>
                );
              })}
            </svg>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-chart-current" aria-hidden /> Current
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0 w-4 border-t-2 border-dashed border-chart-desired" aria-hidden /> Desired
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Dimension gaps</p>
              <ul className="mt-3 space-y-2.5" aria-hidden>
                {AXES.map((label, i) => (
                  <li key={label} className="grid grid-cols-[2rem_1fr] items-center gap-2">
                    <span className="text-[11px] font-semibold text-navy-700">{label}</span>
                    <span className="relative block h-2.5 rounded-full bg-navy-50">
                      <span className="absolute inset-y-0 left-0 rounded-full bg-chart-current" style={{ width: `${CURRENT[i] * 100}%` }} />
                      <span className="absolute -top-0.5 h-3.5 w-0.5 rounded bg-chart-desired" style={{ left: `${DESIRED[i] * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Executive intelligence
              </p>
              <div className="mt-3 space-y-2" aria-hidden>
                <span className="block h-2 w-full rounded bg-emerald-200/70" />
                <span className="block h-2 w-11/12 rounded bg-emerald-200/70" />
                <span className="block h-2 w-3/4 rounded bg-emerald-200/70" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center" aria-hidden>
                {["30", "60", "90"].map((d) => (
                  <span key={d} className="rounded-md bg-white px-2 py-1.5 text-[10px] font-semibold text-navy-700 ring-1 ring-emerald-200">
                    {d}-day
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption id="illustrative-caption" className="mt-3 text-center text-xs text-navy-200">
        Illustrative example only. Shapes are decorative and do not depict any organization&rsquo;s results.
      </figcaption>
    </figure>
  );
}
