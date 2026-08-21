/**
 * appsScriptProgressApi.ts — wrappers finos sobre `callContract` para
 * `progress.*` (PLAYABLE MVP UI INTEGRATION). Lecturas puras — ver
 * PLAYABLE_MVP_BACKEND_HANDOFF_v1.md sección 3.
 */

import { callContract } from './appsScriptContract';
import type { DailyProgressItem, ProgressSummary } from './appsScriptDtos';

/** Los 5 pilares persistibles del contrato. 'mind' NUNCA es un valor válido. */
export type Pillar = 'nutrition' | 'exercise' | 'sleep' | 'stress' | 'conscious_wellbeing';

export interface DailyRangeFilters {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  limit?: number;
  cursor?: string | null;
}

export const progressApi = {
  get: (clientId: string) => callContract<ProgressSummary>('progress.get', { client_id: clientId }),

  getDaily: (clientId: string, filters?: DailyRangeFilters) =>
    callContract<{ daily_progress: DailyProgressItem[]; count: number }>('progress.getDaily', {
      client_id: clientId,
      ...filters,
    }),

  getPillar: (clientId: string, pillar: Pillar, filters?: DailyRangeFilters) =>
    callContract<{ daily_progress: DailyProgressItem[]; count: number }>('progress.getPillar', {
      client_id: clientId,
      pillar,
      ...filters,
    }),
};
