/**
 * ActionsService.gs — NUTRILONGX Apps Script Phase 2C + MVP Accreditation Pack v1
 *
 * Implementa actions.* del contrato funcional
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md seccion 8/9) y
 * NUTRILONGX_ACTION_ACCREDITATION_CONTRACT_v1.md.
 *
 * Fabrica con inyeccion de dependencias, mismo patron que
 * ClientsService.gs/ContentService.gs/EvidenceService.gs:
 * `createActionsService({ sbSelect, sbInsert, writeAudit })`.
 *
 * ============================================================================
 * HISTORIAL DE DISEÑO
 *
 * Fase 2C (base): `actions.accredit()` nunca insertaba en `action_logs`
 * porque `action_accreditation_rules` estaba vacia (0 filas) y, ademas, esa
 * tabla no tiene ningun campo que indique que `level_variant` aplica.
 *
 * NUTRILONGX PLAYABLE MVP — MVP Accreditation Pack v1 (esta fase): se
 * puebla `action_accreditation_rules` con 11 reglas deterministas (ver
 * nutrilongx/accreditation/canonical/NUTRILONGX_MVP_ACCREDITATION_RULES_v1.json
 * y supabase/migrations/0004_mvp_accreditation_rules_v1.sql). Cada regla
 * fija su `level_variant` dentro de `conditions.level_variant` — unico
 * lugar del esquema real apto para ese dato sin inventar una columna
 * nueva. `base_dvg_hours` NUNCA se escribe en la regla: se resuelve en
 * runtime desde `canonical_actions.data.level_variants[level=X]
 * .base_dvg_hours`. Si el level_variant declarado por la regla no existe
 * en el catalogo real -> `DATA_INTEGRITY_ERROR`, sin fallback (encargo
 * PLAYABLE MVP seccion 7).
 *
 * Resolucion de la accion candidata para una evidencia — DOS vias, nunca
 * mezcladas en la misma evidencia (EvidenceService.gs seccion 2b):
 *   A. `evidence.source_content_id` -> `content_action_bindings` activos
 *      (via ya existente en Fase 2C). Hoy solo recipes/nutrition tienen
 *      bindings reales.
 *   B. `evidence.source_entity_type='canonical_action'` +
 *      `source_entity_id` -> la evidencia declara explicitamente de que
 *      accion es evidencia (activado en esta fase porque
 *      content_action_bindings no cubre exercise/mind_content). Siempre
 *      resuelve a exactamente 1 candidato por construccion.
 *
 * Con 0/1 candidato via A pero SIN regla activa, o con >1 candidato via A
 * (ambiguo), el resultado sigue siendo `review_required`, sin insertar
 * fila — comportamiento de Fase 2C sin cambios. `contextual_opposite`/
 * `unmapped` siguen excluidos de candidatos por diseño.
 *
 * Con exactamente 1 candidato Y exactamente 1 regla activa para el, la
 * evidencia se evalua contra `accepted_evidence_types`/`required_fields`/
 * `conditions` de la regla:
 *   - CUMPLE  -> status=validated, se inserta action_logs (o se devuelve
 *     idempotentemente la fila ya creada -- ver deduplicacion).
 *   - NO CUMPLE -> status=rejected, se inserta action_logs igualmente
 *     (el contrato funcional exige "create/update ACTION_LOG state" para
 *     TODOS los desenlaces, no solo validated -- el propio esquema real
 *     declara 'rejected' como status valido).
 * Si hay >1 regla activa para la misma accion (config ambigua, no deberia
 * ocurrir con el pack MVP actual), se trata como sin regla resoluble ->
 * review_required, nunca se elige una arbitrariamente.
 *
 * Deduplicacion (dos capas, distintas de la de EXECUTION_EVIDENCE):
 *   - Idempotencia de intento: mismo (evidence_id, canonical_action_id) ya
 *     tiene un action_log (cualquier status) -> se devuelve esa misma fila,
 *     no se reevalua ni se inserta de nuevo.
 *   - Tope diario de acreditacion VALIDADA: si el cliente ya tiene un
 *     action_log status=validated para esa accion en el mismo dia natural
 *     (con OTRA evidencia), una nueva evidencia que tambien cumpliria no
 *     genera una segunda fila -- se devuelve la ya validada (cumple
 *     max_occurrences=1/dia de las 11 reglas MVP). Los intentos rechazados
 *     no cuentan para este tope (deduplication_key de 'rejected' incluye
 *     el evidence_id, nunca colisiona con el unique(client_id,
 *     deduplication_key) real de action_logs).
 *
 * `engine_version`/`calculation_version` son sellos de version de ESTE
 * pack de reglas MVP, no una ejecucion del motor de gamificacion --
 * `gamification.calculateAction`/`recalculateDay`/`progress.*` NO se
 * invocan en esta fase (encargo PLAYABLE MVP seccion 18).
 * ============================================================================
 */

var ACTIONS_LIST_ALLOWED_FIELDS = Object.freeze(['domain', 'subdomain', 'is_active', 'limit', 'cursor']);
var ACTIONS_GET_ALLOWED_FIELDS = Object.freeze(['canonical_action_id']);
var ACTIONS_ACCREDIT_ALLOWED_FIELDS = Object.freeze(['evidence_id']);
var ACTIONS_LIST_LOGS_ALLOWED_FIELDS = Object.freeze(['client_id', 'status', 'canonical_action_id', 'from', 'to', 'limit', 'cursor']);
var ACTIONS_GET_LOG_ALLOWED_FIELDS = Object.freeze(['action_log_id']);

var ACTIONS_LIST_FIELDS = 'id,canonical_action_id,domain,subdomain,is_active,source_version,created_at,updated_at';
var ACTION_LOGS_LIST_FIELDS = 'id,client_id,canonical_action_id,evidence_id,accreditation_rule_id,level_variant,occurred_at,base_dvg_hours,status,created_at';

// Bindings que pueden llegar a acreditar positivamente (encargo Fase 2C
// seccion 11). 'contextual_opposite' y 'unmapped' quedan excluidos
// explicitamente: un contextual_opposite NUNCA es candidato de
// acreditacion positiva por diseno, y un unmapped no es una asociacion
// real todavia.
var ACTIONS_CANDIDATE_BINDING_TYPES = Object.freeze(['supports', 'candidate', 'direct']);

// Sello de version de ESTE pack de reglas MVP -- no una ejecucion del
// motor canonico de gamificacion (encargo PLAYABLE MVP seccion 8).
var ACTIONS_MVP_ENGINE_VERSION = 'NUTRILONGX_MVP_ACCREDITATION_ENGINE_v1';
var ACTIONS_MVP_CALCULATION_VERSION = 'MVP_ACCREDITATION_PACK_v1';

function createActionsService(deps) {
  var sbSelectFn = deps.sbSelect;
  var sbInsertFn = deps.sbInsert;
  var auditFn = deps.writeAudit;
  var gamificationService = deps.gamificationService; // MVP Gamification Minimal v1 -- solo usado por accreditAndCalculate.

  /** actions.list(payload: { domain?, subdomain?, is_active?, limit?, cursor? }) */
  function list(payload) {
    payload = payload || {};
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, ACTIONS_LIST_ALLOWED_FIELDS, 'actions.list payload');
    var page = normalizePagination(payload);

    var qsParts = [];
    if (payload.domain !== undefined && payload.domain !== null) {
      qsParts.push(qsEq('domain', requireString(payload.domain, 'domain')));
    }
    if (payload.subdomain !== undefined && payload.subdomain !== null) {
      qsParts.push(qsEq('subdomain', requireString(payload.subdomain, 'subdomain')));
    }
    if (payload.is_active !== undefined && payload.is_active !== null) {
      if (typeof payload.is_active !== 'boolean') {
        throw NlxValidationError('"is_active" must be a boolean', { field: 'is_active' });
      }
      qsParts.push('is_active=eq.' + (payload.is_active ? 'true' : 'false'));
    }
    var qs = qsParts.concat(['select=' + ACTIONS_LIST_FIELDS, 'order=canonical_action_id.asc', 'limit=' + page.limit]).join('&');

    var rows = sbSelectFn('canonical_actions', qs) || [];
    return { actions: rows, count: rows.length };
  }

  /** actions.get(payload: { canonical_action_id }) */
  function get(payload) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, ACTIONS_GET_ALLOWED_FIELDS, 'actions.get payload');
    var canonicalActionId = requireString(payload.canonical_action_id, 'canonical_action_id');
    var rows = sbSelectFn('canonical_actions', qsEq('canonical_action_id', canonicalActionId) + '&select=*&limit=1');
    if (!rows || rows.length === 0) {
      throw NlxCanonicalReferenceNotFoundError('Canonical action not found.', { canonical_action_id: canonicalActionId });
    }
    return { action: rows[0] };
  }

  function fetchEvidenceById(evidenceId) {
    var rows = sbSelectFn('execution_evidence', qsEq('id', evidenceId) + '&select=*&limit=1');
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  function fetchActiveBindingsForContent(contentId) {
    var rows = sbSelectFn(
      'content_action_bindings',
      qsEq('content_id', contentId) + '&' + qsEq('status', 'active') + '&select=*'
    );
    return rows || [];
  }

  function fetchActiveRulesForAction(canonicalActionId) {
    var rows = sbSelectFn(
      'action_accreditation_rules',
      qsEq('canonical_action_id', canonicalActionId) + '&' + qsEq('status', 'active') + '&select=*'
    );
    return rows || [];
  }

  function fetchCanonicalActionData(canonicalActionId) {
    var rows = sbSelectFn('canonical_actions', qsEq('canonical_action_id', canonicalActionId) + '&select=data&limit=1');
    return (rows && rows.length > 0) ? rows[0].data : null;
  }

  function fetchExistingLogForEvidence(evidenceId, canonicalActionId) {
    var rows = sbSelectFn(
      'action_logs',
      qsEq('evidence_id', evidenceId) + '&' + qsEq('canonical_action_id', canonicalActionId) + '&select=*&limit=1'
    );
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  function fetchExistingValidatedLogForDay(clientId, canonicalActionId, dedupKeyValidated) {
    var rows = sbSelectFn(
      'action_logs',
      qsEq('client_id', clientId) + '&' + qsEq('deduplication_key', dedupKeyValidated) + '&' + qsEq('status', 'validated') + '&select=*&limit=1'
    );
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  function reviewRequired(evidenceId, candidateActions, detail) {
    return {
      status: 'pending',
      reason: 'ACCREDITATION_REVIEW_REQUIRED',
      evidence_id: evidenceId,
      candidate_actions: candidateActions,
      action_log_created: false,
      detail: detail
    };
  }

  /** "YYYY-MM-DD" del dia natural de occurred_at -- ventana de agregacion de las reglas MVP (day/1). */
  function dayOf(isoDateTime) {
    return new Date(isoDateTime).toISOString().slice(0, 10);
  }

  function buildValidatedDedupKey(canonicalActionId, occurredAt) {
    return canonicalActionId + '|' + dayOf(occurredAt);
  }

  function buildRejectedDedupKey(canonicalActionId, occurredAt, evidenceId) {
    return canonicalActionId + '|' + dayOf(occurredAt) + '|rejected|' + evidenceId;
  }

  /** Resuelve base_dvg_hours desde el catalogo real -- nunca desde la regla. Sin fallback (encargo seccion 7). */
  function resolveBaseDvgHours(canonicalActionId, levelVariant) {
    var data = fetchCanonicalActionData(canonicalActionId);
    var levelVariants = (data && Array.isArray(data.level_variants)) ? data.level_variants : [];
    var match = null;
    for (var i = 0; i < levelVariants.length; i++) {
      if (levelVariants[i].level === levelVariant) { match = levelVariants[i]; break; }
    }
    if (!match || typeof match.base_dvg_hours !== 'number') {
      throw NlxDataIntegrityError(
        'Accreditation rule references a level_variant that does not exist in the canonical catalog for this action.',
        { canonical_action_id: canonicalActionId, level_variant: levelVariant }
      );
    }
    return match.base_dvg_hours;
  }

  /** required_fields: array de nombres de campo que deben existir y no ser null en la evidencia. */
  function evidenceHasRequiredFields(evidence, requiredFields) {
    if (!Array.isArray(requiredFields)) return true;
    for (var i = 0; i < requiredFields.length; i++) {
      var f = requiredFields[i];
      if (evidence[f] === undefined || evidence[f] === null) return false;
    }
    return true;
  }

  /**
   * conditions: objeto plano {campo: {gte?, lte?, eq?}}. La clave
   * reservada 'level_variant' no es una condicion sobre la evidencia --
   * se ignora aqui (ver resolveBaseDvgHours). Ningun operador fuera de
   * gte/lte/eq -- no se inventa un DSL mas alla de lo que las 11 reglas
   * MVP necesitan.
   */
  function evidenceSatisfiesConditions(evidence, conditions) {
    if (!conditions || typeof conditions !== 'object') return true;
    var keys = Object.keys(conditions);
    for (var i = 0; i < keys.length; i++) {
      var field = keys[i];
      if (field === 'level_variant') continue;
      var rule = conditions[field];
      var value = evidence[field];
      if (typeof value !== 'number') return false;
      if (rule.gte !== undefined && !(value >= rule.gte)) return false;
      if (rule.lte !== undefined && !(value <= rule.lte)) return false;
      if (rule.eq !== undefined && !(value === rule.eq)) return false;
    }
    return true;
  }

  /**
   * Evalua evidencia contra UNA regla activa y crea/recupera el
   * action_logs correspondiente. No se llama nunca con mas de una regla
   * candidata (ver accredit()).
   */
  function evaluateRuleAndPersist(evidence, canonicalActionId, rule, ctx) {
    // Idempotencia de intento -- mismo (evidence_id, canonical_action_id) ya evaluado.
    var existing = fetchExistingLogForEvidence(evidence.id, canonicalActionId);
    if (existing) {
      return {
        status: existing.status,
        reason: existing.status === 'validated' ? undefined : (existing.status === 'rejected' ? 'ACCREDITATION_REJECTED' : undefined),
        evidence_id: evidence.id,
        action_log_created: false,
        action_log_id: existing.id,
        idempotent: true,
        candidate_actions: [{ canonical_action_id: canonicalActionId, accreditation_rule_id: rule.accreditation_rule_id }]
      };
    }

    var levelVariant = rule.conditions && rule.conditions.level_variant;
    if (!levelVariant) {
      throw NlxDataIntegrityError('Accreditation rule does not declare conditions.level_variant.', { accreditation_rule_id: rule.accreditation_rule_id });
    }
    var baseDvgHours = resolveBaseDvgHours(canonicalActionId, levelVariant); // DATA_INTEGRITY_ERROR sin fallback si no existe.

    var acceptedTypes = rule.accepted_evidence_types || [];
    var meetsEvidenceType = acceptedTypes.indexOf(evidence.source_type) !== -1;
    var meetsRequiredFields = evidenceHasRequiredFields(evidence, rule.required_fields);
    var meetsConditions = evidenceSatisfiesConditions(evidence, rule.conditions);
    var meets = meetsEvidenceType && meetsRequiredFields && meetsConditions;

    if (meets) {
      // Tope diario de acreditacion VALIDADA (max_occurrences=1/dia, encargo seccion 12).
      var validatedKey = buildValidatedDedupKey(canonicalActionId, evidence.occurred_at);
      var priorValidated = fetchExistingValidatedLogForDay(evidence.client_id, canonicalActionId, validatedKey);
      if (priorValidated) {
        return {
          status: 'validated',
          evidence_id: evidence.id,
          action_log_created: false,
          action_log_id: priorValidated.id,
          idempotent: true,
          detail: 'A validated action_log for this client+action+day already exists (max_occurrences=1/day); this evidence did not create a second row.',
          candidate_actions: [{ canonical_action_id: canonicalActionId, accreditation_rule_id: rule.accreditation_rule_id }]
        };
      }
      var insertedValidated = sbInsertFn('action_logs', [{
        client_id: evidence.client_id,
        canonical_action_id: canonicalActionId,
        evidence_id: evidence.id,
        accreditation_rule_id: rule.accreditation_rule_id,
        level_variant: levelVariant,
        occurred_at: evidence.occurred_at,
        base_dvg_hours: baseDvgHours,
        engine_version: ACTIONS_MVP_ENGINE_VERSION,
        calculation_version: ACTIONS_MVP_CALCULATION_VERSION,
        deduplication_key: validatedKey,
        status: 'validated',
        provenance: { source: 'actions.accredit', accreditation_rule_id: rule.accreditation_rule_id, scope: 'PLAYABLE_MVP' }
      }]);
      var validatedRow = insertedValidated[0];
      return {
        status: 'validated',
        evidence_id: evidence.id,
        action_log_created: true,
        action_log_id: validatedRow.id,
        idempotent: false,
        candidate_actions: [{ canonical_action_id: canonicalActionId, accreditation_rule_id: rule.accreditation_rule_id }]
      };
    }

    // No cumple -- se registra igualmente como 'rejected' (esquema real lo declara valido;
    // contrato funcional exige "create/update ACTION_LOG state" para todo desenlace).
    var rejectedKey = buildRejectedDedupKey(canonicalActionId, evidence.occurred_at, evidence.id);
    var insertedRejected = sbInsertFn('action_logs', [{
      client_id: evidence.client_id,
      canonical_action_id: canonicalActionId,
      evidence_id: evidence.id,
      accreditation_rule_id: rule.accreditation_rule_id,
      level_variant: levelVariant,
      occurred_at: evidence.occurred_at,
      base_dvg_hours: baseDvgHours,
      engine_version: ACTIONS_MVP_ENGINE_VERSION,
      calculation_version: ACTIONS_MVP_CALCULATION_VERSION,
      deduplication_key: rejectedKey,
      status: 'rejected',
      provenance: {
        source: 'actions.accredit', accreditation_rule_id: rule.accreditation_rule_id, scope: 'PLAYABLE_MVP',
        failed_checks: { evidence_type: !meetsEvidenceType, required_fields: !meetsRequiredFields, conditions: !meetsConditions }
      }
    }]);
    var rejectedRow = insertedRejected[0];
    return {
      status: 'rejected',
      reason: 'ACCREDITATION_REJECTED',
      evidence_id: evidence.id,
      action_log_created: true,
      action_log_id: rejectedRow.id,
      idempotent: false,
      candidate_actions: [{ canonical_action_id: canonicalActionId, accreditation_rule_id: rule.accreditation_rule_id }]
    };
  }

  /** actions.accredit(payload: { evidence_id }) */
  function accredit(payload, ctx) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, ACTIONS_ACCREDIT_ALLOWED_FIELDS, 'actions.accredit payload');
    var evidenceId = requireUuid(payload.evidence_id, 'evidence_id');

    // 1. La evidencia debe existir (encargo Fase 2C seccion 9).
    var evidence = fetchEvidenceById(evidenceId);
    if (!evidence) throw NlxNotFoundError('Evidence not found.', { evidence_id: evidenceId });

    var result;
    var resolvedSingleActionId = null; // solo se rellena cuando hay exactamente 1 candidato.

    if (evidence.source_entity_type === 'canonical_action' && evidence.source_entity_id) {
      // Via B: la evidencia declara explicitamente de que accion es evidencia
      // (MVP Accreditation Pack v1) -- resuelve a exactamente 1 candidato por construccion.
      resolvedSingleActionId = evidence.source_entity_id;
    } else if (!evidence.source_content_id) {
      // Sin contenido ni entidad declarada -- nunca se inventa asociacion (encargo Fase 2C seccion 12).
      result = reviewRequired(evidenceId, [], 'Evidence has no source_content_id and no source_entity_id; no canonical action can be derived.');
    } else {
      // Via A: resolver bindings activos para ese contenido (Fase 2C seccion 10).
      var allBindings = fetchActiveBindingsForContent(evidence.source_content_id);
      var candidateBindings = allBindings.filter(function (b) {
        return ACTIONS_CANDIDATE_BINDING_TYPES.indexOf(b.binding_type) !== -1;
      });
      var excludedCount = allBindings.length - candidateBindings.length; // contextual_opposite/unmapped

      if (candidateBindings.length === 0) {
        result = reviewRequired(evidenceId, [], excludedCount > 0
          ? 'Only contextual_opposite/unmapped bindings found for this content; never a positive candidate.'
          : 'No active content_action_bindings found for this content.');
      } else if (candidateBindings.length > 1) {
        // Multiples candidatos -- nunca se elige uno arbitrariamente (encargo Fase 2C seccion 13).
        var candidateActionsMulti = candidateBindings.map(function (b) {
          var rules = fetchActiveRulesForAction(b.canonical_action_id);
          return {
            canonical_action_id: b.canonical_action_id,
            binding_type: b.binding_type,
            has_accreditation_rule: rules.length > 0,
            accreditation_rule_ids: rules.map(function (r) { return r.accreditation_rule_id; })
          };
        });
        result = reviewRequired(evidenceId, candidateActionsMulti,
          'Multiple candidate canonical actions resolved; this phase does not disambiguate automatically.');
      } else {
        resolvedSingleActionId = candidateBindings[0].canonical_action_id;
      }
    }

    // Exactamente 1 candidato resuelto (via A o via B) -- intentar resolver una regla activa.
    if (resolvedSingleActionId) {
      var activeRules = fetchActiveRulesForAction(resolvedSingleActionId);
      if (activeRules.length === 1) {
        result = evaluateRuleAndPersist(evidence, resolvedSingleActionId, activeRules[0], ctx);
      } else {
        // 0 reglas -> sin base determinista todavia. >1 regla activa para la
        // misma accion es una configuracion ambigua no soportada por este
        // pack -- tampoco se elige una arbitrariamente.
        var singleCandidate = [{
          canonical_action_id: resolvedSingleActionId,
          has_accreditation_rule: activeRules.length > 0,
          accreditation_rule_ids: activeRules.map(function (r) { return r.accreditation_rule_id; })
        }];
        result = reviewRequired(evidenceId, singleCandidate, activeRules.length > 1
          ? 'Multiple active accreditation rules found for this canonical action; ambiguous configuration, not auto-resolved.'
          : 'No active accreditation rule exists yet for this canonical action.');
      }
    }

    // Auditar el intento -- nunca se registra un secreto (encargo Fase 2C seccion 23).
    auditFn({
      requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
      action: 'actions.accredit', entityType: 'execution_evidence', entityId: evidenceId,
      beforeData: null, afterData: null,
      metadata: {
        result_status: result.status,
        reason: result.reason,
        action_log_created: result.action_log_created,
        action_log_id: result.action_log_id,
        candidate_count: result.candidate_actions.length,
        canonical_action_ids: result.candidate_actions.map(function (c) { return c.canonical_action_id; })
      }
    });

    return result;
  }

  /**
   * actions.accreditAndCalculate(payload: { evidence_id }) — orquestacion
   * (encargo PLAYABLE MVP seccion 20). Secuencia EXACTA:
   *   actions.accredit -> validated? -> gamification.calculateAction ->
   *   gamification.recalculateDay. Si accredit resuelve pending/rejected,
   *   gamification NUNCA se llama -- ninguna rama alternativa.
   */
  function accreditAndCalculate(payload, ctx) {
    var accreditResult = accredit(payload, ctx);
    if (accreditResult.status !== 'validated') {
      return { accredit: accreditResult, gamification: null, daily_progress: null };
    }
    if (!gamificationService) {
      throw NlxInternalError('gamification service not wired.', {});
    }
    var actionLogRows = sbSelectFn('action_logs', qsEq('id', accreditResult.action_log_id) + '&select=client_id,occurred_at&limit=1');
    var actionLog = actionLogRows && actionLogRows[0];
    if (!actionLog) {
      throw NlxDataIntegrityError('Validated action_log disappeared before gamification could run.', { action_log_id: accreditResult.action_log_id });
    }
    var calcResult = gamificationService.calculateAction({ action_log_id: accreditResult.action_log_id }, ctx);
    var dayStr = new Date(actionLog.occurred_at).toISOString().slice(0, 10);
    var dayResult = gamificationService.recalculateDay({ client_id: actionLog.client_id, date: dayStr }, ctx);
    return { accredit: accreditResult, gamification: calcResult, daily_progress: dayResult };
  }

  /** actions.listLogs(payload: { client_id?, status?, canonical_action_id?, from?, to?, limit?, cursor? }) */
  function listLogs(payload) {
    payload = payload || {};
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, ACTIONS_LIST_LOGS_ALLOWED_FIELDS, 'actions.listLogs payload');
    var page = normalizePagination(payload);

    var qsParts = [];
    if (payload.client_id !== undefined && payload.client_id !== null) {
      qsParts.push(qsEq('client_id', requireUuid(payload.client_id, 'client_id')));
    }
    if (payload.status !== undefined && payload.status !== null) {
      qsParts.push(qsEq('status', requireEnum(payload.status, 'status', NLX_ACTION_LOG_STATUSES)));
    }
    if (payload.canonical_action_id !== undefined && payload.canonical_action_id !== null) {
      qsParts.push(qsEq('canonical_action_id', requireString(payload.canonical_action_id, 'canonical_action_id')));
    }
    if (payload.from !== undefined && payload.from !== null) {
      qsParts.push('occurred_at=gte.' + encodeURIComponent(requireIsoDateTime(payload.from, 'from')));
    }
    if (payload.to !== undefined && payload.to !== null) {
      qsParts.push('occurred_at=lte.' + encodeURIComponent(requireIsoDateTime(payload.to, 'to')));
    }
    var qs = qsParts.concat(['select=' + ACTION_LOGS_LIST_FIELDS, 'order=occurred_at.desc', 'limit=' + page.limit]).join('&');

    var rows = sbSelectFn('action_logs', qs) || [];
    return { action_logs: rows, count: rows.length };
  }

  /** actions.getLog(payload: { action_log_id }) */
  function getLog(payload) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, ACTIONS_GET_LOG_ALLOWED_FIELDS, 'actions.getLog payload');
    var actionLogId = requireUuid(payload.action_log_id, 'action_log_id');
    var rows = sbSelectFn('action_logs', qsEq('id', actionLogId) + '&select=*&limit=1');
    if (!rows || rows.length === 0) {
      throw NlxNotFoundError('Action log not found.', { action_log_id: actionLogId });
    }
    return { action_log: rows[0] };
  }

  return { list: list, get: get, accredit: accredit, accreditAndCalculate: accreditAndCalculate, listLogs: listLogs, getLog: getLog };
}
