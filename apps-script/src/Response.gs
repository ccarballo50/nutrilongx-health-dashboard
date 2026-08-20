/**
 * Response.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Envelopes globales de exito/error del contrato funcional
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md secciones 2-3).
 *
 * PURO: no depende de ningun servicio de Apps Script (el UUID y el
 * timestamp se inyectan desde fuera via ctx, nunca se generan aqui).
 */

var NLX_SCHEMA_VERSION = 'NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1';

function buildMeta(requestId, timestampIso) {
  return {
    request_id: requestId,
    timestamp: timestampIso,
    schema_version: NLX_SCHEMA_VERSION
  };
}

function buildSuccessEnvelope(data, requestId, timestampIso) {
  return {
    ok: true,
    data: data || {},
    meta: buildMeta(requestId, timestampIso)
  };
}

function buildErrorEnvelope(code, message, details, requestId, timestampIso) {
  return {
    ok: false,
    error: {
      code: code,
      message: message,
      details: details || {}
    },
    meta: buildMeta(requestId, timestampIso)
  };
}
