/**
 * The built-in PDF fonts (Helvetica / Times) only cover the WinAnsi
 * (Windows-1252) character set. Characters outside it render as blanks, so
 * all text is normalized before rendering.
 */

const CP1252_EXTRAS = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

const REPLACEMENTS: Record<string, string> = {
  "\u2212": "\u2013", // minus sign → en dash
  "\u2010": "-",
  "\u2011": "-",
  "\u2012": "\u2013",
  "\u2015": "\u2014",
  "\u2192": "->",
  "\u2190": "<-",
  "\u2194": "<->",
  "\u21d2": "=>",
  "\u2264": "<=",
  "\u2265": ">=",
  "\u2260": "!=",
  "\u2248": "~",
  "\u2032": "'",
  "\u2033": '"',
  "\u2022": "\u2022",
  "\u25cf": "\u2022",
  "\u25aa": "\u2022",
  "\u2713": "\u2022",
  "\u2714": "\u2022",
  "\u00a0": " ",
  "\u2009": " ",
  "\u200a": " ",
  "\u202f": " ",
  "\u2007": " ",
  "\u200b": "",
  "\u200c": "",
  "\u200d": "",
  "\ufeff": "",
};

function isWinAnsi(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  if (c === 0x09 || c === 0x0a || c === 0x0d) return true;
  if (c >= 0x20 && c <= 0x7e) return true;
  if (c >= 0xa0 && c <= 0xff) return true;
  return CP1252_EXTRAS.includes(ch);
}

/** Maps a string onto characters the built-in PDF fonts can draw. */
export function toPdfText(input: string): string {
  let out = "";
  for (const ch of input) {
    if (isWinAnsi(ch)) {
      out += ch;
      continue;
    }
    const mapped = REPLACEMENTS[ch];
    if (mapped !== undefined) {
      out += mapped;
      continue;
    }
    // Strip accents from characters outside Latin-1 (e.g. "ő" → "o").
    const base = ch.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    out += [...base].every(isWinAnsi) ? base : "?";
  }
  return out;
}

/** Deeply applies toPdfText to every string in a JSON-like value. */
export function sanitizeForPdf<T>(value: T): T {
  if (typeof value === "string") return toPdfText(value) as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeForPdf(v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeForPdf(v)])) as T;
  }
  return value;
}
