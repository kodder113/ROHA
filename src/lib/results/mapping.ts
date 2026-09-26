/**
 * Maps database rows to scoring-engine inputs. Pure — shared by the server
 * loaders and the database integration tests.
 */
import type { DimensionDef, QuestionDef, Rating } from "@/lib/scoring/types";
import type { ProfiledResponse } from "./segments";

export interface DimensionRow {
  id: string;
  key: string;
  code: string;
  name: string;
  description?: string | null;
  sort_order: number;
}

export interface QuestionRow {
  id: string;
  key: string;
  dimension_id: string;
  focus: string;
  prompt: string;
  sort_order: number;
  allow_na: boolean;
}

export interface ResponseRow {
  id: string;
  department_option_id: string | null;
  location_option_id: string | null;
  level_option_id: string | null;
  tenure_range: string | null;
}

export interface ResponseItemRow {
  response_id: string;
  question_id: string;
  current_value: number | null;
  current_na: boolean;
  desired_value: number | null;
  desired_na: boolean;
}

export function toDimensionDefs(rows: DimensionRow[]): DimensionDef[] {
  return rows.map((d) => ({
    id: d.id,
    key: d.key,
    code: d.code,
    name: d.name,
    description: d.description ?? undefined,
    sortOrder: d.sort_order,
  }));
}

export function toQuestionDefs(rows: QuestionRow[]): QuestionDef[] {
  return rows.map((q) => ({
    id: q.id,
    key: q.key,
    dimensionId: q.dimension_id,
    focus: q.focus,
    prompt: q.prompt,
    sortOrder: q.sort_order,
    allowNa: q.allow_na,
  }));
}

const rating = (value: number | null, na: boolean): Rating => (na ? "NA" : value);

export function toProfiledResponses(responses: ResponseRow[], items: ResponseItemRow[]): ProfiledResponse[] {
  const byResponse = new Map<string, ProfiledResponse>();
  for (const r of responses) {
    byResponse.set(r.id, {
      items: {},
      profile: {
        department: r.department_option_id,
        location: r.location_option_id,
        level: r.level_option_id,
        tenure: r.tenure_range,
      },
    });
  }
  for (const it of items) {
    const target = byResponse.get(it.response_id);
    if (!target) continue;
    target.items[it.question_id] = {
      current: rating(it.current_value, it.current_na),
      desired: rating(it.desired_value, it.desired_na),
    };
  }
  return [...byResponse.values()];
}
