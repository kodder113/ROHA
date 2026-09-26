const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** Spells out small counts for prose ("five dimensions"); larger numbers stay numeric. */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
