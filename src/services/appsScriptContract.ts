/**
 * appsScriptContract.ts — Dashboard consumer del contrato Apps Script.
 *
 * Único punto de entrada del frontend hacia las funciones del contrato
 * NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1 que ya están disponibles
 * (`nutrilongx/governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md`).
 *
 * Este módulo NUNCA llama directamente al Web App de Apps Script: siempre
 * pasa por el proxy server-side `api/apps-script.ts`, que es el único
 * lugar donde vive `DASHBOARD_API_KEY` (variable de entorno server-side,
 * jamás con prefijo `VITE_`, jamás en el bundle del navegador).
 *
 * Este módulo:
 * - no conoce Supabase ni nombres de tabla;
 * - no calcula DVG ni ejecuta reglas de acreditación/clínicas/safety;
 * - solo conoce el nombre de función + payload de negocio y el envelope
 *   de respuesta {ok,data,meta} / {ok,error:{code,message,details},meta}.
 *
 * Nota de alcance (Dashboard consumer, no backend): la allowlist de abajo
 * es deliberadamente la misma allowlist que enforcea `api/apps-script.ts`
 * en el servidor — este array es solo para tipar/autocompletar en el
 * cliente, la autoridad real está en el proxy (nunca confiar en un check
 * hecho solo en el navegador).
 *
 * evidence.* / actions.* / gamification.* / progress.* / safety.* quedan
 * explícitamente fuera de esta allowlist por instrucción directa del
 * encargo PR-01, aunque `evidence.*` ya esté disponible en el backend
 * (ver docs/DASHBOARD_APPS_SCRIPT_CLIENT_v0.md).
 */

export const APPS_SCRIPT_ALLOWED_FUNCTIONS = [
  'clients.list',
  'clients.get',
  'clients.create',
  'clients.update',
  'clients.getProfile',
  'clients.updateProfile',

  'content.listRecipes',
  'content.getRecipe',
  'content.listExercises',
  'content.getExercise',
  'content.listMind',
  'content.getMindContent',
  'content.assign',
  'content.unassign',
  'content.listAssignments',
] as const;

export type ContractFunctionName = (typeof APPS_SCRIPT_ALLOWED_FUNCTIONS)[number];

export interface ContractMeta {
  request_id: string | null;
  timestamp: string;
  schema_version: string;
}

export interface ContractErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ContractSuccessEnvelope<T = unknown> {
  ok: true;
  data: T;
  meta: ContractMeta;
}

export interface ContractErrorEnvelope {
  ok: false;
  error: ContractErrorBody;
  meta: ContractMeta;
}

export type ContractEnvelope<T = unknown> = ContractSuccessEnvelope<T> | ContractErrorEnvelope;

/**
 * Error tipado lanzado por `callContract` cuando el envelope trae
 * `ok:false`. El Dashboard debe ramificar sobre `.code` (los 9 códigos
 * estables del contrato), nunca sobre `.message` en texto libre.
 */
export class ContractError extends Error {
  code: string;
  details?: Record<string, unknown>;
  requestId: string | null;

  constructor(body: ContractErrorBody, meta?: ContractMeta) {
    super(body.message);
    this.name = 'ContractError';
    this.code = body.code;
    this.details = body.details;
    this.requestId = meta?.request_id ?? null;
  }
}

const PROXY_ENDPOINT = '/api/apps-script';

/**
 * callContract — invoca una función permitida del contrato a través del
 * proxy server-side. Resuelve con `data` en éxito; lanza `ContractError`
 * en fallo (tanto errores de negocio `ok:false` como fallos de
 * transporte/proxy, normalizados al mismo tipo para que el consumidor
 * solo tenga que manejar un único `catch`).
 */
export async function callContract<T = unknown>(
  functionName: ContractFunctionName,
  payload?: object
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ function: functionName, payload: payload ?? {} }),
    });
  } catch (networkErr: any) {
    throw new ContractError({
      code: 'INTERNAL_ERROR',
      message: 'No se pudo contactar con el proxy del Dashboard.',
      details: { cause: String(networkErr?.message || networkErr) },
    });
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ContractError({
      code: 'INTERNAL_ERROR',
      message: `Respuesta no válida del proxy (HTTP ${res.status}).`,
    });
  }

  if (!raw || typeof raw !== 'object' || typeof (raw as { ok?: unknown }).ok !== 'boolean') {
    throw new ContractError({
      code: 'INTERNAL_ERROR',
      message: 'Envelope de contrato malformado.',
    });
  }

  const envelope = raw as ContractEnvelope<T>;
  // Nota: el tsconfig del repo no activa `strictNullChecks`, con lo que el
  // estrechamiento automático de uniones discriminadas no es fiable aquí.
  // Se castea explícitamente en cada rama en vez de depender de la
  // inferencia de control-flow de TS sobre `envelope.ok`.
  if (envelope.ok === true) {
    return (envelope as ContractSuccessEnvelope<T>).data;
  }
  const failure = envelope as ContractErrorEnvelope;
  throw new ContractError(failure.error, failure.meta);
}
