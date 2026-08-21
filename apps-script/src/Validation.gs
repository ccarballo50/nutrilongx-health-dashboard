/**
 * Validation.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Helpers de validacion reutilizables. Nunca confiar en el payload del
 * Dashboard (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md seccion 16).
 *
 * PURO: no depende de ningun servicio de Apps Script.
 */

var NLX_PILLARS = Object.freeze(['nutrition', 'exercise', 'sleep', 'stress', 'conscious_wellbeing']);
var NLX_MIND_PILLARS = Object.freeze(['sleep', 'stress', 'conscious_wellbeing']);
var NLX_CONTENT_TYPES = Object.freeze(['recipe', 'exercise', 'exercise_variant', 'mind_content']);
var NLX_MIND_CONTENT_TYPES = Object.freeze(['pillar_card', 'subpillar_card', 'challenge', 'video', 'infographic', 'other']);
var NLX_CLIENT_STATUSES = Object.freeze(['active', 'paused', 'discharged', 'archived']);
var NLX_ASSIGNMENT_STATUSES = Object.freeze(['assigned', 'active', 'completed', 'cancelled']);

// Fase 2B — evidence.* (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md seccion 7).
var NLX_EVIDENCE_SOURCE_TYPES = Object.freeze(['manual', 'dashboard', 'app', 'professional', 'apps_script', 'wearable', 'import']);

// Fase 2C — actions.* (NUTRILONGX_ACTION_ACCREDITATION_CONTRACT_v1.md).
var NLX_BINDING_TYPES = Object.freeze(['supports', 'candidate', 'contextual_opposite', 'unmapped', 'direct']);
var NLX_BINDING_STATUSES = Object.freeze(['active', 'inactive', 'review_required']);
var NLX_ACCREDITATION_RULE_STATUSES = Object.freeze(['active', 'inactive', 'review_required']);
var NLX_ACTION_LOG_STATUSES = Object.freeze(['validated', 'pending', 'rejected', 'reversed']);

// Pilares/valores legacy explicitamente rechazados como pillar/content_type
// persistido o de API (NUTRILONGX_STANDALONE_DATA_MODEL_v1.md seccion 2;
// encargo secciones 29/34).
var NLX_REJECTED_PILLAR_ALIASES = Object.freeze(['mind', 'MENTE', 'MEN', 'Sueño', 'Estrés', 'Bienestar emocional']);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function requireObject(v, fieldName) {
  if (!isPlainObject(v)) {
    throw NlxValidationError('Expected an object for "' + fieldName + '"', { field: fieldName });
  }
  return v;
}

function requireString(v, fieldName, opts) {
  opts = opts || {};
  if (typeof v !== 'string' || (v.trim().length === 0 && !opts.allowEmpty)) {
    throw NlxValidationError('"' + fieldName + '" is required and must be a non-empty string', { field: fieldName });
  }
  if (opts.maxLength && v.length > opts.maxLength) {
    throw NlxValidationError('"' + fieldName + '" exceeds max length ' + opts.maxLength, { field: fieldName });
  }
  return v;
}

function optionalString(v, fieldName, opts) {
  if (v === undefined || v === null) return null;
  return requireString(v, fieldName, opts);
}

// UUID v4-ish: se acepta cualquier UUID valido (no restringido a v4
// estricto) porque gen_random_uuid() de Postgres produce UUID v4, pero
// preferimos no ser mas estrictos de lo necesario aqui.
var NLX_UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function requireUuid(v, fieldName) {
  requireString(v, fieldName);
  if (!NLX_UUID_RE.test(v)) {
    throw NlxValidationError('"' + fieldName + '" must be a valid UUID', { field: fieldName, value: v });
  }
  return v;
}

var NLX_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalEmail(v, fieldName) {
  if (v === undefined || v === null) return null;
  requireString(v, fieldName);
  if (!NLX_EMAIL_RE.test(v)) {
    throw NlxValidationError('"' + fieldName + '" must be a valid email', { field: fieldName });
  }
  return v;
}

function requireEnum(v, fieldName, allowed) {
  requireString(v, fieldName);
  if (allowed.indexOf(v) === -1) {
    throw NlxValidationError(
      '"' + fieldName + '" must be one of: ' + allowed.join(', '),
      { field: fieldName, value: v, allowed: allowed }
    );
  }
  return v;
}

function optionalEnum(v, fieldName, allowed) {
  if (v === undefined || v === null) return null;
  return requireEnum(v, fieldName, allowed);
}

/** Rechaza explicitamente pilares/alias legacy como valor persistido/API. */
function rejectLegacyPillarAlias(v, fieldName) {
  if (typeof v === 'string' && NLX_REJECTED_PILLAR_ALIASES.indexOf(v) !== -1) {
    throw NlxValidationError(
      '"' + fieldName + '" received a legacy/UI-grouping value that is not a persisted pillar: "' + v + '"',
      { field: fieldName, value: v, rejected_aliases: NLX_REJECTED_PILLAR_ALIASES }
    );
  }
}

function requirePillar(v, fieldName) {
  rejectLegacyPillarAlias(v, fieldName);
  return requireEnum(v, fieldName, NLX_PILLARS);
}

function requireMindPillar(v, fieldName) {
  rejectLegacyPillarAlias(v, fieldName);
  return requireEnum(v, fieldName, NLX_MIND_PILLARS);
}

function requireContentType(v, fieldName) {
  return requireEnum(v, fieldName, NLX_CONTENT_TYPES);
}

function optionalMindContentType(v, fieldName) {
  return optionalEnum(v, fieldName, NLX_MIND_CONTENT_TYPES);
}

function optionalClientStatus(v, fieldName) {
  return optionalEnum(v, fieldName, NLX_CLIENT_STATUSES);
}

/**
 * Rechaza cualquier clave del payload que no este en el allowlist. No se
 * ignoran silenciosamente campos inesperados (encargo seccion 18/21):
 * fallar explicito con VALIDATION_ERROR listando las claves sobrantes.
 */
function rejectUnknownKeys(payload, allowedKeys, contextLabel) {
  requireObject(payload, contextLabel || 'payload');
  var unknown = Object.keys(payload).filter(function (k) { return allowedKeys.indexOf(k) === -1; });
  if (unknown.length > 0) {
    throw NlxValidationError(
      'Unexpected field(s) in ' + (contextLabel || 'payload') + ': ' + unknown.join(', '),
      { unexpected_fields: unknown, allowed_fields: allowedKeys }
    );
  }
}

// ISO-8601 con offset explicito o "Z" -- exigido para occurred_at (Fase 2B
// encargo seccion 7). No se acepta una fecha "sueltamente parseable" por
// `new Date()` (p.ej. "2026" o "2026-08-20") porque una evidencia clinica
// necesita hora y zona explicitas.
var NLX_ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function requireIsoDateTime(v, fieldName) {
  requireString(v, fieldName);
  if (!NLX_ISO_DATETIME_RE.test(v)) {
    throw NlxValidationError('"' + fieldName + '" must be an ISO-8601 datetime with explicit offset/Z', { field: fieldName, value: v });
  }
  var d = new Date(v);
  if (isNaN(d.getTime())) {
    throw NlxValidationError('"' + fieldName + '" is not a valid datetime', { field: fieldName, value: v });
  }
  return v;
}

function optionalNumeric(v, fieldName) {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw NlxValidationError('"' + fieldName + '" must be a finite number', { field: fieldName, value: v });
  }
  return v;
}

/** limit/cursor estandar (encargo seccion 45/38). */
function normalizePagination(filters) {
  filters = filters || {};
  var limit = 50;
  if (filters.limit !== undefined && filters.limit !== null) {
    limit = Number(filters.limit);
    if (!Number.isFinite(limit) || limit <= 0) {
      throw NlxValidationError('"limit" must be a positive number', { field: 'limit', value: filters.limit });
    }
    if (limit > 100) limit = 100;
  }
  var cursor = null;
  if (filters.cursor !== undefined && filters.cursor !== null) {
    cursor = requireString(filters.cursor, 'cursor');
  }
  return { limit: Math.floor(limit), cursor: cursor };
}
