/**
 * EvidenceService.gs — NUTRILONGX Apps Script Phase 2B
 *
 * Implementa evidence.* del contrato funcional
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md seccion 7).
 *
 * Fabrica con inyeccion de dependencias, mismo patron que
 * ClientsService.gs/ContentService.gs: `createEvidenceService(deps)` con
 * `deps = { sbSelect, sbInsert, writeAudit }`.
 *
 * INVARIANTE ABSOLUTA (encargo Fase 2B seccion 2): este archivo crea
 * EXCLUSIVAMENTE filas en `execution_evidence`. Nunca:
 *   - crea `action_logs`;
 *   - calcula DVG (`base_dvg_hours`, streaks, boosters, combos, multiplicadores);
 *   - llama al motor de gamificacion;
 *   - fabrica una accion canonica ni acredita nada.
 * `actions.*`/`gamification.*`/`progress.*`/`safety.*` quedan fuera de
 * alcance de este archivo por diseño, no por descuido.
 *
 * DOS CAPAS DE PROTECCION DISTINTAS (encargo seccion 15), documentadas
 * tambien en el informe de implementacion:
 *   - `idempotency_key`: protege duplicacion de TRANSPORTE/reintento — la
 *     genera el llamador (Dashboard/App), es opaca para el servidor.
 *   - `deduplication_key`: protege duplicacion LOGICA de evidencia — la
 *     construye este servicio, de forma deterministica, a partir de la
 *     identidad de la evidencia (nunca se acepta la del cliente como
 *     autoridad). Ambas coexisten: dos peticiones con `idempotency_key`
 *     distintas pero identidad logica identica siguen deduplicandose por
 *     `deduplication_key` (constraint real en BD:
 *     `unique(client_id, deduplication_key)`, supabase/migrations/
 *     0002_standalone_backend_v1.sql).
 *
 * LIMITACION DOCUMENTADA: `resolveActiveRegistryEntry`/`fetchClientById`
 * duplican deliberadamente la logica ya existente en ContentService.gs/
 * ClientsService.gs en vez de importarla — Fase 2A queda protegida sin
 * tocar (ver informe de implementacion, seccion "Limitaciones").
 */

var EVIDENCE_REGISTER_ALLOWED_FIELDS = Object.freeze([
  'client_id', 'source_type', 'source_content', 'pillar', 'occurred_at',
  'quantity', 'unit', 'duration_minutes', 'intensity', 'metadata', 'idempotency_key'
]);
var EVIDENCE_SOURCE_CONTENT_ALLOWED_FIELDS = Object.freeze(['content_type', 'canonical_id']);
var EVIDENCE_LIST_ALLOWED_FIELDS = Object.freeze(['client_id', 'pillar', 'source_type', 'from', 'to', 'limit', 'cursor']);
var EVIDENCE_GET_ALLOWED_FIELDS = Object.freeze(['evidence_id']);

var EVIDENCE_LIST_FIELDS = 'id,client_id,pillar,source_type,source_content_id,occurred_at,quantity,unit,duration_minutes,intensity,metadata,created_at';

function createEvidenceService(deps) {
  var sbSelectFn = deps.sbSelect;
  var sbInsertFn = deps.sbInsert;
  var auditFn = deps.writeAudit;

  function fetchClientById(clientId) {
    var rows = sbSelectFn('clients', qsEq('id', clientId) + '&select=id,status&limit=1');
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  function resolveActiveRegistryEntry(contentType, canonicalId) {
    var qs = qsEq('content_type', contentType) + '&' + qsEq('canonical_id', canonicalId) + '&select=*&limit=1';
    var rows = sbSelectFn('content_registry', qs);
    var entry = (rows && rows.length > 0) ? rows[0] : null;
    if (!entry || entry.is_active !== true) {
      throw NlxCanonicalReferenceNotFoundError(
        'No active content found for the given content_type/canonical_id.',
        { content_type: contentType, canonical_id: canonicalId }
      );
    }
    return entry;
  }

  /**
   * Normaliza occurred_at a minuto (sin segundos/ms/offset) para la clave
   * de deduplicacion — MVP deliberado, no un algoritmo de reconciliacion
   * de wearables (encargo seccion 13).
   */
  function normalizeOccurredAtForDedup(iso) {
    return new Date(iso).toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  }

  /**
   * Clave de deduplicacion LOGICA, determinista, construida server-side.
   * Nunca se acepta una `deduplication_key` enviada por el cliente como
   * autoridad (encargo seccion 13) — de hecho, el contrato de payload ni
   * siquiera acepta ese campo (ver EVIDENCE_REGISTER_ALLOWED_FIELDS).
   */
  function buildDeduplicationKey(parts) {
    return [
      parts.sourceType,
      parts.sourceContentId || 'none',
      normalizeOccurredAtForDedup(parts.occurredAt),
      (parts.quantity === null || parts.quantity === undefined) ? 'null' : String(parts.quantity),
      parts.unit || 'null',
      (parts.durationMinutes === null || parts.durationMinutes === undefined) ? 'null' : String(parts.durationMinutes)
    ].join('|');
  }

  /** evidence.register(payload) */
  function register(payload, ctx) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, EVIDENCE_REGISTER_ALLOWED_FIELDS, 'evidence.register payload');

    var clientId = requireUuid(payload.client_id, 'client_id');
    var sourceType = requireEnum(payload.source_type, 'source_type', NLX_EVIDENCE_SOURCE_TYPES);
    var occurredAt = requireIsoDateTime(payload.occurred_at, 'occurred_at');
    var quantity = optionalNumeric(payload.quantity, 'quantity');
    var durationMinutes = optionalNumeric(payload.duration_minutes, 'duration_minutes');
    var unit = optionalString(payload.unit, 'unit', { maxLength: 40 });
    var intensity = optionalString(payload.intensity, 'intensity', { maxLength: 40 });
    var metadata = (payload.metadata !== undefined && payload.metadata !== null)
      ? requireObject(payload.metadata, 'metadata') : {};
    var idempotencyKey = optionalString(payload.idempotency_key, 'idempotency_key', { maxLength: 200 });

    // 1. Cliente debe existir — nunca se crea implicitamente (seccion 8).
    var client = fetchClientById(clientId);
    if (!client) throw NlxNotFoundError('Client not found.', { client_id: clientId });

    // 2. Resolver source_content via content_registry si viene (seccion 9/10)
    //    — nunca se acepta un UUID operacional como sustituto del canonical ID.
    var sourceContentId = null;
    var pillarFromContent = null;
    if (payload.source_content !== undefined && payload.source_content !== null) {
      var sc = requireObject(payload.source_content, 'source_content');
      rejectUnknownKeys(sc, EVIDENCE_SOURCE_CONTENT_ALLOWED_FIELDS, 'evidence.register source_content');
      var contentType = requireContentType(sc.content_type, 'source_content.content_type');
      var canonicalId = requireString(sc.canonical_id, 'source_content.canonical_id');
      var registryEntry = resolveActiveRegistryEntry(contentType, canonicalId);
      sourceContentId = registryEntry.id;
      pillarFromContent = registryEntry.pillar;
    }

    // 3. Integridad de pillar (seccion 11/12): si hay contenido, el pillar
    //    SIEMPRE se deriva del content_registry server-side, nunca del
    //    payload. Si el payload declara uno distinto, es VALIDATION_ERROR
    //    explicito — nunca se corrige en silencio. Sin contenido, el pillar
    //    debe venir explicito en el payload (evidencia independiente).
    var pillar;
    if (pillarFromContent) {
      if (payload.pillar !== undefined && payload.pillar !== null) {
        var declaredPillar = requirePillar(payload.pillar, 'pillar');
        if (declaredPillar !== pillarFromContent) {
          throw NlxValidationError(
            '"pillar" does not match the pillar derived server-side from source_content.',
            { field: 'pillar', declared: declaredPillar, derived_from_content: pillarFromContent }
          );
        }
      }
      pillar = pillarFromContent;
    } else {
      pillar = requirePillar(payload.pillar, 'pillar');
    }

    // 4. Clave de deduplicacion logica, servidor, determinista.
    var deduplicationKey = buildDeduplicationKey({
      sourceType: sourceType,
      sourceContentId: sourceContentId,
      occurredAt: occurredAt,
      quantity: quantity,
      unit: unit,
      durationMinutes: durationMinutes
    });

    // 5a. Idempotencia de TRANSPORTE — mismo idempotency_key devuelve la
    //     misma evidencia logica, no crea fila nueva ni evento de audit
    //     nuevo (seccion 14/15/22).
    if (idempotencyKey) {
      var byIdemKey = sbSelectFn(
        'execution_evidence',
        qsEq('client_id', clientId) + '&' + qsEq('idempotency_key', idempotencyKey) + '&select=*&limit=1'
      );
      if (byIdemKey && byIdemKey.length > 0) {
        return { evidence: byIdemKey[0], idempotent: true };
      }
    }

    // 5b. Deduplicacion LOGICA — misma identidad de evidencia (con o sin
    //     idempotency_key reutilizada), tampoco crea fila nueva (seccion 15/31).
    var byDedupKey = sbSelectFn(
      'execution_evidence',
      qsEq('client_id', clientId) + '&' + qsEq('deduplication_key', deduplicationKey) + '&select=*&limit=1'
    );
    if (byDedupKey && byDedupKey.length > 0) {
      return { evidence: byDedupKey[0], idempotent: true };
    }

    // 6. Insertar — SOLO execution_evidence (invariante seccion 2/17: nunca
    //    action_log, nunca DVG, nunca motor de gamificacion).
    var row = {
      client_id: clientId,
      source_type: sourceType,
      source_content_id: sourceContentId,
      pillar: pillar,
      occurred_at: occurredAt,
      quantity: quantity,
      unit: unit,
      duration_minutes: durationMinutes,
      intensity: intensity,
      metadata: metadata,
      provenance: {},
      deduplication_key: deduplicationKey,
      idempotency_key: idempotencyKey
    };
    var inserted = sbInsertFn('execution_evidence', [row]);
    var evidence = inserted[0];

    auditFn({
      requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
      action: 'evidence.register', entityType: 'execution_evidence', entityId: evidence.id,
      beforeData: null, afterData: evidence,
      metadata: { source_type: sourceType, pillar: pillar }
    });

    return { evidence: evidence, idempotent: false };
  }

  /** evidence.list(payload: { client_id, pillar?, source_type?, from?, to?, limit?, cursor? }) */
  function list(payload) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, EVIDENCE_LIST_ALLOWED_FIELDS, 'evidence.list payload');
    var clientId = requireUuid(payload.client_id, 'client_id');
    var page = normalizePagination(payload);

    var qsParts = [qsEq('client_id', clientId)];
    if (payload.pillar !== undefined && payload.pillar !== null) {
      qsParts.push(qsEq('pillar', requirePillar(payload.pillar, 'pillar')));
    }
    if (payload.source_type !== undefined && payload.source_type !== null) {
      qsParts.push(qsEq('source_type', requireEnum(payload.source_type, 'source_type', NLX_EVIDENCE_SOURCE_TYPES)));
    }
    if (payload.from !== undefined && payload.from !== null) {
      qsParts.push('occurred_at=gte.' + encodeURIComponent(requireIsoDateTime(payload.from, 'from')));
    }
    if (payload.to !== undefined && payload.to !== null) {
      qsParts.push('occurred_at=lte.' + encodeURIComponent(requireIsoDateTime(payload.to, 'to')));
    }
    var qs = qsParts.join('&') + '&select=' + EVIDENCE_LIST_FIELDS + '&order=occurred_at.desc&limit=' + page.limit;

    var rows = sbSelectFn('execution_evidence', qs) || [];
    return { evidence_items: rows, count: rows.length };
  }

  /** evidence.get(payload: { evidence_id }) */
  function get(payload) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, EVIDENCE_GET_ALLOWED_FIELDS, 'evidence.get payload');
    var evidenceId = requireUuid(payload.evidence_id, 'evidence_id');
    var rows = sbSelectFn('execution_evidence', qsEq('id', evidenceId) + '&select=*&limit=1');
    if (!rows || rows.length === 0) {
      throw NlxNotFoundError('Evidence not found.', { evidence_id: evidenceId });
    }
    return { evidence: rows[0] };
  }

  return { register: register, list: list, get: get };
}
