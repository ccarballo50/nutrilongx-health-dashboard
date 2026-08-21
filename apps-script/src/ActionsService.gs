/**
 * ActionsService.gs — NUTRILONGX Apps Script Phase 2C
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
 * DECISION DE DISEÑO CENTRAL — documentada tambien en el informe de
 * implementacion (seccion "Hallazgo de schema"):
 *
 * `actions.accredit()` en esta fase NUNCA inserta una fila en
 * `action_logs`, ni siquiera con status='pending'. Motivo real, no una
 * simplificacion arbitraria:
 *
 *   1. `action_accreditation_rules` (esquema real,
 *      supabase/migrations/0002_standalone_backend_v1.sql) no tiene NINGUN
 *      campo que indique que `level_variant` de la accion canonica aplica
 *      — solo accepted_evidence_types/required_fields/conditions/
 *      aggregation_window/max_occurrences.
 *   2. `action_logs.level_variant` es `text NOT NULL`, igual que
 *      `base_dvg_hours`/`engine_version`/`calculation_version`.
 *   3. Sin un campo de origen para el level_variant, resolverlo exigiria
 *      inventar una heuristica de seleccion — exactamente lo que el
 *      contrato prohibe ("no inventar thresholds").
 *
 * Por tanto, con el canon actual (`action_accreditation_rules` vacia,
 * verificado) el resultado esperado y correcto es
 * `validated_action_logs_created = 0`. Pero incluso si existiera una
 * regla activa, esta implementacion seguiria sin crear la fila — el
 * hallazgo del punto 3 es independiente de que haya 0 o N reglas. Queda
 * documentado como limitacion explicita para una fase posterior, no como
 * un blocker de esta (NUTRILONGX_ACTION_ACCREDITATION_CONTRACT_v1.md
 * seccion 5 confirma que este es exactamente el resultado esperado: "una
 * accion sin regla de acreditacion simplemente no puede acreditar
 * action_log todavia, no rompe nada").
 *
 * `ACCREDITATION_REJECTED` tampoco se usa en esta fase (encargo seccion
 * 17): requeriria evaluar `conditions`/thresholds de una regla real contra
 * la evidencia, y no existe ninguna regla ni motor de evaluacion definido
 * que hacerlo sin inventar semantica.
 * ============================================================================
 */

var ACTIONS_LIST_ALLOWED_FIELDS = Object.freeze(['domain', 'subdomain', 'is_active', 'limit', 'cursor']);
var ACTIONS_GET_ALLOWED_FIELDS = Object.freeze(['canonical_action_id']);
var ACTIONS_ACCREDIT_ALLOWED_FIELDS = Object.freeze(['evidence_id']);
var ACTIONS_LIST_LOGS_ALLOWED_FIELDS = Object.freeze(['client_id', 'status', 'canonical_action_id', 'from', 'to', 'limit', 'cursor']);
var ACTIONS_GET_LOG_ALLOWED_FIELDS = Object.freeze(['action_log_id']);

var ACTIONS_LIST_FIELDS = 'id,canonical_action_id,domain,subdomain,is_active,source_version,created_at,updated_at';
var ACTION_LOGS_LIST_FIELDS = 'id,client_id,canonical_action_id,evidence_id,accreditation_rule_id,level_variant,occurred_at,base_dvg_hours,status,created_at';

// Bindings que pueden llegar a acreditar positivamente (encargo seccion 11).
// 'contextual_opposite' y 'unmapped' quedan excluidos explicitamente: un
// contextual_opposite NUNCA es candidato de acreditacion positiva por
// diseno, y un unmapped no es una asociacion real todavia.
var ACTIONS_CANDIDATE_BINDING_TYPES = Object.freeze(['supports', 'candidate', 'direct']);

function createActionsService(deps) {
  var sbSelectFn = deps.sbSelect;
  var auditFn = deps.writeAudit;

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

  /** actions.accredit(payload: { evidence_id }) */
  function accredit(payload, ctx) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, ACTIONS_ACCREDIT_ALLOWED_FIELDS, 'actions.accredit payload');
    var evidenceId = requireUuid(payload.evidence_id, 'evidence_id');

    // 1. La evidencia debe existir (encargo seccion 9).
    var evidence = fetchEvidenceById(evidenceId);
    if (!evidence) throw NlxNotFoundError('Evidence not found.', { evidence_id: evidenceId });

    var result;

    // 2. Evidencia sin contenido asociado -- nunca se inventa asociacion
    //    (encargo seccion 12).
    if (!evidence.source_content_id) {
      result = reviewRequired(evidenceId, [], 'Evidence has no source_content_id; no canonical action can be derived.');
    } else {
      // 3. Resolver bindings activos para ese contenido (seccion 10).
      var allBindings = fetchActiveBindingsForContent(evidence.source_content_id);
      var candidateBindings = allBindings.filter(function (b) {
        return ACTIONS_CANDIDATE_BINDING_TYPES.indexOf(b.binding_type) !== -1;
      });
      var excludedCount = allBindings.length - candidateBindings.length; // contextual_opposite/unmapped

      if (candidateBindings.length === 0) {
        result = reviewRequired(evidenceId, [], excludedCount > 0
          ? 'Only contextual_opposite/unmapped bindings found for this content; never a positive candidate.'
          : 'No active content_action_bindings found for this content.');
      } else {
        // 4. Para cada candidato, consultar si existe regla de acreditacion
        //    activa (seccion 14) -- informativo, no cambia el resultado
        //    (ver cabecera del archivo: nunca se crea action_log en esta fase).
        var candidateActions = candidateBindings.map(function (b) {
          var rules = fetchActiveRulesForAction(b.canonical_action_id);
          return {
            canonical_action_id: b.canonical_action_id,
            binding_type: b.binding_type,
            has_accreditation_rule: rules.length > 0,
            accreditation_rule_ids: rules.map(function (r) { return r.accreditation_rule_id; })
          };
        });

        // 5. Multiples candidatos -- nunca se elige uno arbitrariamente
        //    (encargo seccion 13).
        if (candidateActions.length > 1) {
          result = reviewRequired(evidenceId, candidateActions,
            'Multiple candidate canonical actions resolved; Phase 2C does not disambiguate automatically.');
        } else {
          // Exactamente un candidato. Aunque exista una regla activa, esta
          // fase no puede resolver level_variant sin inventar una
          // heuristica (ver cabecera del archivo) -- siempre review_required.
          var only = candidateActions[0];
          result = reviewRequired(evidenceId, candidateActions, only.has_accreditation_rule
            ? 'An active accreditation rule exists, but Phase 2C cannot resolve level_variant deterministically from it yet -- no action_log is created without inventing a selection rule.'
            : 'No active accreditation rule exists yet for this canonical action.');
        }
      }
    }

    // Auditar el intento -- nunca se registra un secreto, nunca se registra
    // un action_log inexistente como si existiera (encargo seccion 23).
    auditFn({
      requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
      action: 'actions.accredit', entityType: 'execution_evidence', entityId: evidenceId,
      beforeData: null, afterData: null,
      metadata: {
        result_status: result.status,
        reason: result.reason,
        candidate_count: result.candidate_actions.length,
        canonical_action_ids: result.candidate_actions.map(function (c) { return c.canonical_action_id; })
      }
    });

    return result;
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

  return { list: list, get: get, accredit: accredit, listLogs: listLogs, getLog: getLog };
}
