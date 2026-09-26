/**
 * Shared result shape for super-admin server actions. Kept free of any
 * directive so it can be imported by both server actions and client forms.
 */
export type ActionState = {
  ok: boolean;
  message: string;
  /** Optional list of validation problems (e.g. JSON schema issues). */
  details?: string[];
  /** Timestamp so repeated identical results still re-render feedback. */
  at: number;
} | null;

export type AdminFormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;
