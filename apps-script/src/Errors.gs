/**
 * Errors.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Jerarquia de errores del contrato funcional
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md seccion 4).
 *
 * PURO: no usa PropertiesService, UrlFetchApp, ni ningun servicio de
 * Apps Script. Cargable y testeable directamente en Node (ver
 * apps-script/tests/lib/load_gs.mjs).
 */

/** Codigos estables del contrato. No anadir codigos fuera de esta lista sin
 * actualizar tambien NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md. */
var NLX_ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CANONICAL_REFERENCE_NOT_FOUND: 'CANONICAL_REFERENCE_NOT_FOUND',
  DATA_INTEGRITY_ERROR: 'DATA_INTEGRITY_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
});

/**
 * Error de dominio NUTRILONGX. Nunca se expone stack trace ni error crudo
 * de Supabase al cliente -- solo code/message/details estables.
 */
function NlxError(code, message, details) {
  this.name = 'NlxError';
  this.code = code;
  this.message = message || code;
  this.details = details || {};
}
NlxError.prototype = Object.create(Error.prototype);
NlxError.prototype.constructor = NlxError;

function NlxValidationError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.VALIDATION_ERROR, message, details);
  e.name = 'NlxValidationError';
  return e;
}

function NlxNotFoundError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.NOT_FOUND, message, details);
  e.name = 'NlxNotFoundError';
  return e;
}

function NlxConflictError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.CONFLICT, message, details);
  e.name = 'NlxConflictError';
  return e;
}

function NlxDuplicateRequestError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.DUPLICATE_REQUEST, message, details);
  e.name = 'NlxDuplicateRequestError';
  return e;
}

function NlxUnauthorizedError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.UNAUTHORIZED, message, details);
  e.name = 'NlxUnauthorizedError';
  return e;
}

function NlxForbiddenError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.FORBIDDEN, message, details);
  e.name = 'NlxForbiddenError';
  return e;
}

function NlxCanonicalReferenceNotFoundError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.CANONICAL_REFERENCE_NOT_FOUND, message, details);
  e.name = 'NlxCanonicalReferenceNotFoundError';
  return e;
}

function NlxDataIntegrityError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.DATA_INTEGRITY_ERROR, message, details);
  e.name = 'NlxDataIntegrityError';
  return e;
}

function NlxInternalError(message, details) {
  var e = new NlxError(NLX_ERROR_CODES.INTERNAL_ERROR, message, details);
  e.name = 'NlxInternalError';
  return e;
}

/**
 * Normaliza cualquier error capturado (NlxError o excepcion inesperada) a
 * {code, message, details} SIN filtrar stack traces ni detalles internos
 * para errores no controlados (esos se colapsan a INTERNAL_ERROR con un
 * mensaje generico; el detalle real solo va a logging interno, nunca a la
 * respuesta).
 */
function normalizeError(err) {
  if (err && typeof err.code === 'string' && NLX_ERROR_CODES[err.code]) {
    return { code: err.code, message: err.message || err.code, details: err.details || {} };
  }
  return {
    code: NLX_ERROR_CODES.INTERNAL_ERROR,
    message: 'Unexpected internal error',
    details: {}
  };
}
