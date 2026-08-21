/**
 * appsScriptContentApi.ts — wrappers finos sobre `callContract` para
 * `content.*` (catálogo canónico + asignaciones). No añaden lógica de
 * negocio, solo tipan el payload/la respuesta. Ninguna pantalla usa esto
 * todavía (PR-01 es solo la capa base) — ver
 * docs/DASHBOARD_APPS_SCRIPT_CLIENT_v0.md.
 */

import { callContract } from './appsScriptContract';
import type { AssignmentItem, ContentItem } from './appsScriptDtos';

export interface ContentListFilters {
  is_published?: boolean;
  limit?: number;
  cursor?: string | null;
}

/** Los 5 pilares persistibles del contrato. 'mind' NUNCA es un valor válido de pilar. */
export type Pillar = 'nutrition' | 'exercise' | 'sleep' | 'stress' | 'conscious_wellbeing';

/** Los 3 pilares "Mente" válidos para content.listMind (ver requireMindPillar en Validation.gs). */
export type MindPillar = 'sleep' | 'stress' | 'conscious_wellbeing';

export interface AssignPayload {
  client_id: string;
  content_type: 'recipe' | 'exercise' | 'exercise_variant' | 'mind_content';
  canonical_id: string;
  options?: {
    idempotency_key?: string;
    notes?: string;
  };
}

export interface UnassignPayload {
  assignment_id: string;
  reason?: string;
}

export interface ListAssignmentsFilters {
  status?: 'assigned' | 'active' | 'completed' | 'cancelled';
  pillar?: Pillar;
  limit?: number;
  cursor?: string | null;
}

export const contentApi = {
  listRecipes: (filters?: ContentListFilters & { maturity?: string }) =>
    callContract<{ recipes: ContentItem[]; count: number }>('content.listRecipes', filters),

  getRecipe: (canonicalId: string) =>
    callContract<{ recipe: ContentItem }>('content.getRecipe', { canonical_id: canonicalId }),

  listExercises: (filters?: ContentListFilters & { domain?: string }) =>
    callContract<{ exercises: ContentItem[]; count: number }>('content.listExercises', filters),

  getExercise: (canonicalId: string) =>
    callContract<{ exercise: ContentItem }>('content.getExercise', { canonical_id: canonicalId }),

  listMind: (pillar: MindPillar, filters?: ContentListFilters & { content_type?: string }) =>
    callContract<{ mind_content: ContentItem[]; count: number }>('content.listMind', {
      pillar,
      ...filters,
    }),

  getMindContent: (canonicalId: string) =>
    callContract<{ mind_content: ContentItem }>('content.getMindContent', { canonical_id: canonicalId }),

  assign: (payload: AssignPayload) =>
    callContract<{ assignment: AssignmentItem; idempotent: boolean }>('content.assign', payload),

  unassign: (payload: UnassignPayload) =>
    callContract<{ assignment: AssignmentItem; changed: boolean }>('content.unassign', payload),

  listAssignments: (clientId: string, filters?: ListAssignmentsFilters) =>
    callContract<{ assignments: AssignmentItem[]; count: number }>('content.listAssignments', {
      client_id: clientId,
      ...filters,
    }),
};
