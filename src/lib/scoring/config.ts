import { z } from "zod";
import type { ScoringConfig } from "./types";

export const scoringConfigSchema = z
  .object({
    scaleMin: z.number().int(),
    scaleMax: z.number().int(),
    normalization: z.literal("linear_0_100"),
    questionWeights: z.record(z.string(), z.number().positive()).default({}),
    dimensionWeights: z.record(z.string(), z.number().positive()).default({}),
    minValidCurrentRatings: z.number().int().min(1),
    minValidCurrentPerDimension: z.number().int().min(1).optional(),
    assessmentVersion: z.number().int().min(1).optional(),
    minGroupSize: z.number().int().min(3).max(50),
    gapThresholds: z.object({ notable: z.number().positive(), substantial: z.number().positive() }),
    bands: z.array(z.object({ min: z.number().min(0).max(100), label: z.string().min(1) })).min(1),
  })
  .refine((c) => c.scaleMax > c.scaleMin, { message: "scaleMax must exceed scaleMin" })
  .refine((c) => c.gapThresholds.substantial > c.gapThresholds.notable, {
    message: "substantial gap threshold must exceed notable threshold",
  });

/** Default configuration — mirrors scoring rule version 1 in the database. */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  scaleMin: 1,
  scaleMax: 5,
  normalization: "linear_0_100",
  questionWeights: {},
  dimensionWeights: {},
  minValidCurrentRatings: 12,
  minGroupSize: 5,
  gapThresholds: { notable: 10, substantial: 20 },
  bands: [
    { min: 0, label: "Needs focused attention" },
    { min: 40, label: "Mixed perceptions" },
    { min: 60, label: "Generally favorable" },
    { min: 80, label: "Strongly favorable" },
  ],
};

export function parseScoringConfig(raw: unknown): ScoringConfig {
  return scoringConfigSchema.parse(raw) as ScoringConfig;
}
