/**
 * appsScriptActionsApi.ts — wrapper fino sobre `callContract` para
 * `actions.accreditAndCalculate` (PLAYABLE MVP UI INTEGRATION). Es la
 * ÚNICA función de `actions.*`/`gamification.*` que el Dashboard invoca
 * directamente: orquesta accredit → validated? → calculateAction →
 * recalculateDay en una sola llamada server-side — ver
 * PLAYABLE_MVP_BACKEND_HANDOFF_v1.md sección 2.2.
 *
 * El Dashboard NUNCA calcula DVG ni reproduce reglas de acreditación:
 * solo interpreta `data.accredit.status` para decidir qué feedback
 * mostrar.
 */

import { callContract } from './appsScriptContract';
import type { AccreditAndCalculateResult } from './appsScriptDtos';

export const actionsApi = {
  accreditAndCalculate: (evidenceId: string) =>
    callContract<AccreditAndCalculateResult>('actions.accreditAndCalculate', { evidence_id: evidenceId }),
};
