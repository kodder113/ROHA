import { parseScoringConfig } from "./config";
import type { ScoringConfig } from "./types";

/**
 * Scoring rules declare the assessment version they were designed for via
 * `config.assessmentVersion`. Rules without it (scoring rules v1) belong to
 * assessment version 1, so historical campaigns keep their original pairing.
 */
export function rulesAssessmentVersion(config: Pick<ScoringConfig, "assessmentVersion"> | null | undefined): number {
  return config?.assessmentVersion ?? 1;
}

export interface RulesRow {
  id: string;
  version_number: number;
  config: unknown;
}

/** The newest rules row designed for the given assessment version, or null. */
export function pickRulesForAssessment<T extends RulesRow>(assessmentVersion: number, rules: T[]): T | null {
  const matching = rules
    .filter((r) => {
      try {
        return rulesAssessmentVersion(parseScoringConfig(r.config)) === assessmentVersion;
      } catch {
        return false;
      }
    })
    .sort((a, b) => b.version_number - a.version_number);
  return matching[0] ?? null;
}
