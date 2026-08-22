/**
 * ContentService.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Implementa content.* del contrato funcional
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md seccion 6).
 *
 * Fabrica con inyeccion de dependencias, igual patron que
 * ClientsService.gs: `createContentService(deps)` con
 * `deps = { sbSelect, sbInsert, sbUpdate, writeAudit }`.
 *
 * Resolucion de contenido SIEMPRE via content_registry (encargo seccion
 * 33): el Dashboard nunca pasa un uuid de recipes/exercises directamente,
 * solo content_type + canonical_id.
 */

var CONTENT_LIST_RECIPE_FIELDS = 'id,canonical_id,title,maturity,is_published,source_version,created_at,updated_at';
var CONTENT_LIST_EXERCISE_FIELDS = 'id,canonical_id,title,domain,content_maturity,review_status,is_published,source_version,created_at,updated_at';
var CONTENT_LIST_MIND_FIELDS = 'id,canonical_id,pillar,content_type,title,is_published,source_version,created_at,updated_at';

var ASSIGN_ALLOWED_FIELDS = Object.freeze(['client_id', 'content_type', 'canonical_id', 'options']);
var ASSIGN_OPTIONS_ALLOWED_FIELDS = Object.freeze(['idempotency_key', 'notes']);
var ASSIGNMENT_ACTIVE_STATUSES = Object.freeze(['assigned', 'active']);

/**
 * Tabla operacional (con columna `title`) para cada `content_type` de
 * content_registry -- usada solo para enriquecer content.listAssignments
 * (Dashboard PR-05-fix, encargo "FIX ASIGNACIONES SIN NOMBRE LEGIBLE").
 * `exercise_variant` queda fuera deliberadamente: exercise_variants no
 * tiene columna `title` propia (su detalle vive en `data` jsonb) y el
 * contrato tampoco expone ningun `content.listExerciseVariants` desde
 * el que el Dashboard pudiera asignar uno -- no hay fuente real de
 * titulo que leer sin inventar un campo.
 */
var CONTENT_TITLE_TABLE_BY_TYPE = Object.freeze({
  recipe: 'recipes',
  exercise: 'exercises',
  mind_content: 'mind_content'
});

function createContentService(deps) {
  var sbSelectFn = deps.sbSelect;
  var sbInsertFn = deps.sbInsert;
  var sbUpdateFn = deps.sbUpdate;
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

  function listGeneric(table, fields, filters, extraFilterQs) {
    filters = filters || {};
    var page = normalizePagination(filters);
    var qs = 'select=' + fields + '&order=created_at.desc&limit=' + page.limit;
    if (filters.is_published !== undefined && filters.is_published !== null) {
      qs += '&is_published=eq.' + (filters.is_published ? 'true' : 'false');
    }
    if (extraFilterQs) qs += '&' + extraFilterQs;
    var rows = sbSelectFn(table, qs) || [];
    return rows;
  }

  function getByCanonicalId(table, canonicalId, notFoundLabel) {
    var rows = sbSelectFn(table, qsEq('canonical_id', canonicalId) + '&select=*&limit=1');
    if (!rows || rows.length === 0) {
      throw NlxCanonicalReferenceNotFoundError(notFoundLabel + ' not found for canonical_id.', { canonical_id: canonicalId });
    }
    return rows[0];
  }

  /**
   * Enriquece filas de client_content_assignments con datos legibles
   * derivados de content_registry (Dashboard PR-05-fix). ADITIVO puro:
   * nunca quita ni sobreescribe un campo real de la fila -- solo añade
   * content_title/content_canonical_id/content_type/content_pillar/
   * content_is_published, `null` cuando no se puede resolver (nunca se
   * inventa un valor). 2 llamadas batch (content_registry + tabla de
   * titulo por content_type) en vez de N+1 por asignacion.
   *
   * assignment.content_id es FK a content_registry.id (NUNCA al `id`
   * propio de recipes/exercises/mind_content -- esa fue la causa raiz
   * del bug "Contenido no resuelto": esas tablas exponen su `id` propio
   * en content.listRecipes/listExercises/listMind, no su `registry_id`,
   * y son dos UUID distintos por diseño, ver
   * supabase/migrations/0002_standalone_backend_v1.sql).
   */
  function enrichAssignmentsWithContent(rows) {
    if (!rows || rows.length === 0) return rows;

    var contentIds = [];
    var seen = {};
    rows.forEach(function (r) {
      if (r.content_id && !seen[r.content_id]) {
        seen[r.content_id] = true;
        contentIds.push(r.content_id);
      }
    });
    if (contentIds.length === 0) return rows;

    var registryRows = sbSelectFn('content_registry', qsIn('id', contentIds) + '&select=id,content_type,canonical_id,pillar') || [];
    var registryById = {};
    registryRows.forEach(function (rr) { registryById[rr.id] = rr; });

    var idsByTable = {};
    registryRows.forEach(function (rr) {
      var table = CONTENT_TITLE_TABLE_BY_TYPE[rr.content_type];
      if (!table) return; // p.ej. exercise_variant: sin tabla de titulo resoluble
      idsByTable[table] = idsByTable[table] || [];
      idsByTable[table].push(rr.id);
    });

    var titleByRegistryId = {};
    Object.keys(idsByTable).forEach(function (table) {
      var titleRows = sbSelectFn(table, qsIn('registry_id', idsByTable[table]) + '&select=registry_id,title,is_published') || [];
      titleRows.forEach(function (tr) { titleByRegistryId[tr.registry_id] = tr; });
    });

    return rows.map(function (r) {
      var registry = r.content_id ? registryById[r.content_id] : null;
      var titleRow = r.content_id ? titleByRegistryId[r.content_id] : null;
      return Object.assign({}, r, {
        content_title: titleRow ? titleRow.title : null,
        content_canonical_id: registry ? registry.canonical_id : null,
        content_type: registry ? registry.content_type : null,
        content_pillar: registry ? registry.pillar : null,
        content_is_published: titleRow ? titleRow.is_published : null
      });
    });
  }

  return {
    /** content.listRecipes(filters?) */
    listRecipes: function (payload) {
      payload = payload || {};
      var maturity = optionalString(payload.maturity, 'maturity');
      var extra = maturity ? qsEq('maturity', maturity) : null;
      var rows = listGeneric('recipes', CONTENT_LIST_RECIPE_FIELDS, payload, extra);
      return { recipes: rows, count: rows.length };
    },

    /** content.getRecipe(canonicalId) */
    getRecipe: function (payload) {
      requireObject(payload, 'payload');
      var canonicalId = requireString(payload.canonical_id, 'canonical_id');
      return { recipe: getByCanonicalId('recipes', canonicalId, 'Recipe') };
    },

    /** content.listExercises(filters?) */
    listExercises: function (payload) {
      payload = payload || {};
      var domain = optionalString(payload.domain, 'domain');
      var extra = domain ? qsEq('domain', domain) : null;
      var rows = listGeneric('exercises', CONTENT_LIST_EXERCISE_FIELDS, payload, extra);
      return { exercises: rows, count: rows.length };
    },

    /** content.getExercise(canonicalId) */
    getExercise: function (payload) {
      requireObject(payload, 'payload');
      var canonicalId = requireString(payload.canonical_id, 'canonical_id');
      return { exercise: getByCanonicalId('exercises', canonicalId, 'Exercise') };
    },

    /** content.listMind(pillar, filters?) */
    listMind: function (payload) {
      requireObject(payload, 'payload');
      var pillar = requireMindPillar(payload.pillar, 'pillar');
      var contentType = optionalMindContentType(payload.content_type, 'content_type');
      var qsParts = [qsEq('pillar', pillar)];
      if (contentType) qsParts.push(qsEq('content_type', contentType));
      var rows = listGeneric('mind_content', CONTENT_LIST_MIND_FIELDS, payload, qsParts.join('&'));
      return { mind_content: rows, count: rows.length };
    },

    /** content.getMindContent(canonicalId) */
    getMindContent: function (payload) {
      requireObject(payload, 'payload');
      var canonicalId = requireString(payload.canonical_id, 'canonical_id');
      return { mind_content: getByCanonicalId('mind_content', canonicalId, 'Mind content') };
    },

    /** content.assign(payload) */
    assign: function (payload, ctx) {
      rejectUnknownKeys(payload, ASSIGN_ALLOWED_FIELDS, 'content.assign payload');
      var clientId = requireUuid(payload.client_id, 'client_id');
      var contentType = requireContentType(payload.content_type, 'content_type');
      var canonicalId = requireString(payload.canonical_id, 'canonical_id');
      var options = payload.options || {};
      requireObject(options, 'options');
      rejectUnknownKeys(options, ASSIGN_OPTIONS_ALLOWED_FIELDS, 'content.assign options');
      var idempotencyKey = optionalString(options.idempotency_key, 'idempotency_key');
      var notes = optionalString(options.notes, 'notes', { maxLength: 2000 });

      // 1. verify client
      var client = fetchClientById(clientId);
      if (!client) throw NlxNotFoundError('Client not found.', { client_id: clientId });

      // 2. resolve content_registry (activo)
      var registryEntry = resolveActiveRegistryEntry(contentType, canonicalId);

      // 3. pillar resuelto server-side, nunca aceptado del Dashboard (seccion 35)
      var pillar = registryEntry.pillar;

      // 4. idempotencia -- devolver resultado logico existente, no duplicar
      //    (encargo seccion 36, preferencia "return existing logical result")
      if (idempotencyKey) {
        var byKey = sbSelectFn(
          'client_content_assignments',
          qsEq('client_id', clientId) + '&' + qsEq('content_id', registryEntry.id) + '&' + qsEq('idempotency_key', idempotencyKey) + '&select=*&limit=1'
        );
        if (byKey && byKey.length > 0) {
          return { assignment: byKey[0], idempotent: true };
        }
      } else {
        var activeExisting = sbSelectFn(
          'client_content_assignments',
          qsEq('client_id', clientId) + '&' + qsEq('content_id', registryEntry.id) +
            '&status=in.(' + ASSIGNMENT_ACTIVE_STATUSES.join(',') + ')&select=*&order=assigned_at.desc&limit=1'
        );
        if (activeExisting && activeExisting.length > 0) {
          return { assignment: activeExisting[0], idempotent: true };
        }
      }

      // 5. crear
      var row = {
        client_id: clientId,
        content_id: registryEntry.id,
        pillar: pillar,
        assigned_by_type: (ctx && ctx.actorType) || 'professional',
        assigned_by: (ctx && ctx.actorId) || null,
        status: 'assigned',
        notes: notes,
        metadata: {},
        idempotency_key: idempotencyKey
      };
      var inserted = sbInsertFn('client_content_assignments', [row]);
      var assignment = inserted[0];

      auditFn({
        requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
        action: 'content.assign', entityType: 'client_content_assignments', entityId: assignment.id,
        beforeData: null, afterData: assignment,
        metadata: { content_type: contentType, canonical_id: canonicalId }
      });
      return { assignment: assignment, idempotent: false };
    },

    /** content.unassign(assignmentId, reason?) */
    unassign: function (payload, ctx) {
      requireObject(payload, 'payload');
      var assignmentId = requireUuid(payload.assignment_id, 'assignment_id');
      var reason = optionalString(payload.reason, 'reason', { maxLength: 2000 });

      var rows = sbSelectFn('client_content_assignments', qsEq('id', assignmentId) + '&select=*&limit=1');
      var before = (rows && rows.length > 0) ? rows[0] : null;
      if (!before) throw NlxNotFoundError('Assignment not found.', { assignment_id: assignmentId });

      if (before.status === 'cancelled') {
        // Idempotente: ya cancelada, no es un error volver a pedirlo.
        return { assignment: before, changed: false };
      }

      var patch = { status: 'cancelled' };
      if (reason) {
        patch.metadata = Object.assign({}, before.metadata || {}, { cancel_reason: reason });
      }
      var updated = sbUpdateFn('client_content_assignments', qsEq('id', assignmentId), patch);
      var after = (updated && updated.length > 0) ? updated[0] : Object.assign({}, before, patch);

      auditFn({
        requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
        action: 'content.unassign', entityType: 'client_content_assignments', entityId: assignmentId,
        beforeData: before, afterData: after
      });
      return { assignment: after, changed: true };
    },

    /** content.listAssignments(clientId, filters?) */
    listAssignments: function (payload) {
      requireObject(payload, 'payload');
      var clientId = requireUuid(payload.client_id, 'client_id');
      var client = fetchClientById(clientId);
      if (!client) throw NlxNotFoundError('Client not found.', { client_id: clientId });

      var status = optionalEnum(payload.status, 'status', ASSIGNMENT_ACTIVE_STATUSES.concat(['completed', 'cancelled']));
      var pillar = payload.pillar !== undefined && payload.pillar !== null ? requirePillar(payload.pillar, 'pillar') : null;
      var page = normalizePagination(payload);

      var qs = qsEq('client_id', clientId) + '&select=*&order=assigned_at.desc&limit=' + page.limit;
      if (status) qs += '&status=eq.' + encodeURIComponent(status);
      if (pillar) qs += '&pillar=eq.' + encodeURIComponent(pillar);

      var rows = sbSelectFn('client_content_assignments', qs) || [];
      var enriched = enrichAssignmentsWithContent(rows);
      return { assignments: enriched, count: enriched.length };
    }
  };
}
