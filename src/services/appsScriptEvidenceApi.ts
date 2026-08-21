/**
 * appsScriptEvidenceApi.ts — wrapper fino sobre `callContract` para
 * `evidence.register` (PLAYABLE MVP UI INTEGRATION). Único punto donde
 * el Dashboard construye el payload de evidencia — ver
 * PLAYABLE_MVP_BACKEND_HANDOFF_v1.md sección 2.1.
 *
 * Dos vías de resolución, mutuamente excluyentes (las exige así el
 * propio backend): contenido asignado (`source_content`) o acción
 * canónica directa (`source_entity_type`/`source_entity_id`). Este
 * wrapper no decide cuál usar — eso vive en `mvpAccreditedActions.ts`,
 * que es la única fuente de esa decisión por acción.
 */

import { callContract } from './appsScriptContract';
import type { EvidenceItem } from './appsScriptDtos';

export interface EvidenceSourceContent {
  content_type: 'recipe' | 'exercise' | 'exercise_variant' | 'mind_content';
  canonical_id: string;
}

export interface RegisterEvidencePayload {
  client_id: string;
  source_type: 'manual' | 'dashboard' | 'app' | 'professional' | 'apps_script' | 'wearable' | 'import';
  occurred_at: string;
  pillar?: string;
  source_content?: EvidenceSourceContent;
  source_entity_type?: 'canonical_action';
  source_entity_id?: string;
  quantity?: number;
  unit?: string;
  duration_minutes?: number;
  idempotency_key?: string;
}

export const evidenceApi = {
  register: (payload: RegisterEvidencePayload) =>
    callContract<{ evidence: EvidenceItem; idempotent: boolean }>('evidence.register', payload),
};
