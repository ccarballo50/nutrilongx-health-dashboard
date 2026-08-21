export const config = { runtime: 'edge' };

/**
 * api/apps-script.ts — proxy server-side hacia el Web App de Apps Script
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1). Único punto donde vive
 * `DASHBOARD_API_KEY` en el lado Dashboard: nunca se envía al navegador,
 * nunca se loguea, nunca aparece en una respuesta.
 *
 * Responsabilidad (y solo esto):
 * - aceptar POST { function, payload? } del frontend;
 * - rechazar cualquier `function` que no esté en la allowlist explícita
 *   (misma allowlist que tipa `src/services/appsScriptContract.ts`, pero
 *   la autoridad real de seguridad es ESTE array server-side, no el
 *   frontend);
 * - añadir `auth.dashboard_key` y llamar al Web App real (URL desde
 *   variable de entorno server-side, `APPS_SCRIPT_WEB_APP_URL`);
 * - seguir manualmente el patrón POST -> 302 -> GET "echo" de Apps
 *   Script Web Apps (verificado en vivo en Phase 2A/2B: la Location del
 *   302 apunta a un endpoint GET-only en script.googleusercontent.com);
 * - devolver al frontend el envelope ya parseado tal cual, sin reenviar
 *   cabeceras/cookies del upstream.
 *
 * PLAYABLE MVP UI INTEGRATION (2026-08-21): se amplía la allowlist con
 * exactamente las funciones que el flujo "marcar hecho" necesita
 * (evidence.register, actions.accreditAndCalculate, progress.get/
 * getDaily/getPillar) — ver
 * nutrilongx/governance/implementation/PLAYABLE_MVP_BACKEND_HANDOFF_v1.md.
 * `actions.accredit` suelto, `gamification.*` administrativo y
 * `safety.*` siguen fuera: no forman parte del flujo "marcar hecho" del
 * Dashboard (accreditAndCalculate ya orquesta accredit+calculateAction+
 * recalculateDay en una sola llamada server-side).
 */

const ALLOWED_FUNCTIONS = new Set([
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

  'evidence.register',

  'actions.accreditAndCalculate',

  'progress.get',
  'progress.getDaily',
  'progress.getPillar',
]);

function nowIso() {
  return new Date().toISOString();
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function errorEnvelope(code: string, message: string) {
  return {
    ok: false,
    error: { code, message },
    meta: { request_id: null, timestamp: nowIso(), schema_version: 'dashboard_proxy_v0' },
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse(errorEnvelope('VALIDATION_ERROR', 'Method not allowed. Use POST.'), 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(errorEnvelope('VALIDATION_ERROR', 'Invalid JSON body.'), 400);
  }

  const functionName = body?.function;
  if (typeof functionName !== 'string' || !ALLOWED_FUNCTIONS.has(functionName)) {
    // Mismo patrón que el router real de Apps Script (allowlist explícita,
    // NOT_FOUND para cualquier nombre desconocido o fuera de alcance) —
    // aquí además cubre evidence.*/actions.*/gamification.*/progress.*/safety.*
    // aunque el backend real ya los tenga o los tenga en el futuro.
    return jsonResponse(
      errorEnvelope('NOT_FOUND', 'Function not allowed by the Dashboard proxy allowlist.'),
      404
    );
  }

  const webAppUrl = process.env.APPS_SCRIPT_WEB_APP_URL;
  const dashboardKey = process.env.DASHBOARD_API_KEY;
  if (!webAppUrl || !dashboardKey) {
    // No se distingue cuál de las dos falta ni se imprime ningún valor:
    // solo "no configurado".
    return jsonResponse(errorEnvelope('INTERNAL_ERROR', 'Apps Script proxy is not configured.'), 500);
  }

  const outboundBody = JSON.stringify({
    function: functionName,
    auth: { dashboard_key: dashboardKey },
    payload: body?.payload && typeof body.payload === 'object' ? body.payload : {},
  });

  try {
    const first = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: outboundBody,
      redirect: 'manual',
    });

    let upstream = first;
    if (first.status >= 300 && first.status < 400) {
      const location = first.headers.get('location');
      if (!location) {
        return jsonResponse(
          errorEnvelope('INTERNAL_ERROR', 'Apps Script redirect without Location header.'),
          502
        );
      }
      upstream = await fetch(location, { method: 'GET' });
    }

    const text = await upstream.text();
    let envelope: unknown;
    try {
      envelope = JSON.parse(text);
    } catch {
      return jsonResponse(
        errorEnvelope('INTERNAL_ERROR', 'Apps Script returned a non-JSON response.'),
        502
      );
    }

    return jsonResponse(envelope, 200);
  } catch {
    // No se loguea el body/headers de la petición saliente (contiene
    // dashboard_key) -- solo el nombre de función, nunca el payload ni la key.
    console.error('nlx_dashboard_proxy_error function=' + functionName);
    return jsonResponse(errorEnvelope('INTERNAL_ERROR', 'Apps Script proxy request failed.'), 502);
  }
}
