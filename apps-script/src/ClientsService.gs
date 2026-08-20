/**
 * ClientsService.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Implementa clients.* del contrato funcional
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md seccion 5).
 *
 * Fabrica con inyeccion de dependencias: `createClientsService(deps)`
 * donde `deps = { sbSelect, sbInsert, sbUpdate, sbUpsert, writeAudit }`. En
 * produccion (Main.gs) se inyectan las funciones reales de
 * SupabaseClient.gs/Audit.gs; en tests (apps-script/tests/) se inyectan
 * fakes en memoria. Esto es lo unico que hace testeable esta logica de
 * negocio fuera del runtime de Apps Script (encargo seccion 48).
 *
 * PURO respecto a Apps Script: no llama directamente a UrlFetchApp ni
 * PropertiesService, solo a las dependencias inyectadas.
 */

var CLIENTS_UPDATABLE_FIELDS = Object.freeze(['first_name', 'last_name', 'email', 'phone', 'status']);
var CLIENTS_CREATE_FIELDS = Object.freeze(['external_code', 'first_name', 'last_name', 'email', 'phone', 'status']);
var CLIENT_PROFILE_FIELDS = Object.freeze(['birth_date', 'sex', 'clinical_tags', 'goals', 'preferences', 'restrictions', 'metadata']);

function createClientsService(deps) {
  var sbSelectFn = deps.sbSelect;
  var sbInsertFn = deps.sbInsert;
  var sbUpdateFn = deps.sbUpdate;
  var auditFn = deps.writeAudit;

  function fetchClientById(clientId) {
    var rows = sbSelectFn('clients', qsEq('id', clientId) + '&select=*&limit=1');
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  function requireExistingClient(clientId) {
    var client = fetchClientById(clientId);
    if (!client) {
      throw NlxNotFoundError('Client not found.', { client_id: clientId });
    }
    return client;
  }

  return {
    /** clients.list(filters?) */
    list: function (payload, ctx) {
      payload = payload || {};
      var page = normalizePagination(payload);
      var status = optionalClientStatus(payload.status, 'status');
      var qs = 'select=id,external_code,first_name,last_name,email,phone,status,created_at,updated_at';
      qs += '&order=created_at.desc&limit=' + page.limit;
      if (status) qs += '&status=eq.' + encodeURIComponent(status);
      var rows = sbSelectFn('clients', qs) || [];
      return { clients: rows, count: rows.length };
    },

    /** clients.get(clientId) */
    get: function (payload) {
      requireObject(payload, 'payload');
      var clientId = requireUuid(payload.client_id, 'client_id');
      var client = requireExistingClient(clientId);
      return { client: client };
    },

    /** clients.create(payload) */
    create: function (payload, ctx) {
      rejectUnknownKeys(payload, CLIENTS_CREATE_FIELDS, 'clients.create payload');
      var externalCode = requireString(payload.external_code, 'external_code', { maxLength: 120 });
      var firstName = requireString(payload.first_name, 'first_name', { maxLength: 200 });
      var lastName = optionalString(payload.last_name, 'last_name', { maxLength: 200 });
      var email = optionalEmail(payload.email, 'email');
      var phone = optionalString(payload.phone, 'phone', { maxLength: 40 });
      var status = optionalClientStatus(payload.status, 'status') || 'active';

      var existingRows = sbSelectFn('clients', qsEq('external_code', externalCode) + '&select=*&limit=1');
      var existing = (existingRows && existingRows.length > 0) ? existingRows[0] : null;

      if (existing) {
        // Idempotencia (encargo seccion 19): mismo external_code + misma
        // identidad logica -> devolver existente sin duplicar. Identidad
        // logica minima = first_name (unico otro campo obligatorio).
        if (existing.first_name === firstName) {
          return { client: existing, idempotent: true };
        }
        throw NlxConflictError(
          'A client with this external_code already exists with different data.',
          { external_code: externalCode }
        );
      }

      var inserted = sbInsertFn('clients', [{
        external_code: externalCode,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        status: status
      }]);
      var row = inserted[0];
      auditFn({
        requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
        action: 'clients.create', entityType: 'clients', entityId: row.id,
        beforeData: null, afterData: row
      });
      return { client: row, idempotent: false };
    },

    /** clients.update(clientId, payload) */
    update: function (payload, ctx) {
      requireObject(payload, 'payload');
      var clientId = requireUuid(payload.client_id, 'client_id');
      var patchInput = requireObject(payload.patch, 'patch');
      rejectUnknownKeys(patchInput, CLIENTS_UPDATABLE_FIELDS, 'clients.update patch');

      var before = requireExistingClient(clientId);

      var patch = {};
      if (patchInput.first_name !== undefined) patch.first_name = requireString(patchInput.first_name, 'first_name', { maxLength: 200 });
      if (patchInput.last_name !== undefined) patch.last_name = optionalString(patchInput.last_name, 'last_name', { maxLength: 200 });
      if (patchInput.email !== undefined) patch.email = optionalEmail(patchInput.email, 'email');
      if (patchInput.phone !== undefined) patch.phone = optionalString(patchInput.phone, 'phone', { maxLength: 40 });
      if (patchInput.status !== undefined) patch.status = requireEnum(patchInput.status, 'status', NLX_CLIENT_STATUSES);

      if (Object.keys(patch).length === 0) {
        return { client: before, changed: false };
      }

      var updated = sbUpdateFn('clients', qsEq('id', clientId), patch);
      var row = (updated && updated.length > 0) ? updated[0] : before;
      auditFn({
        requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
        action: 'clients.update', entityType: 'clients', entityId: clientId,
        beforeData: before, afterData: row
      });
      return { client: row, changed: true };
    },

    /** clients.getProfile(clientId) */
    getProfile: function (payload) {
      requireObject(payload, 'payload');
      var clientId = requireUuid(payload.client_id, 'client_id');
      requireExistingClient(clientId);
      var rows = sbSelectFn('client_profiles', qsEq('client_id', clientId) + '&select=*&limit=1');
      var profile = (rows && rows.length > 0) ? rows[0] : null;
      return { profile: profile };
    },

    /** clients.updateProfile(clientId, payload) */
    updateProfile: function (payload, ctx) {
      requireObject(payload, 'payload');
      var clientId = requireUuid(payload.client_id, 'client_id');
      var patchInput = requireObject(payload.patch, 'patch');

      if (Object.prototype.hasOwnProperty.call(patchInput, 'current_level')) {
        // current_level es estado derivado (client_progress), nunca se
        // acepta aqui (encargo seccion 22) -- fallar explicito, no
        // ignorar en silencio.
        throw NlxValidationError(
          '"current_level" is derived state and cannot be set via clients.updateProfile.',
          { field: 'current_level' }
        );
      }
      rejectUnknownKeys(patchInput, CLIENT_PROFILE_FIELDS, 'clients.updateProfile patch');

      // Verificar que el cliente existe antes del upsert (encargo seccion 23).
      requireExistingClient(clientId);

      var beforeRows = sbSelectFn('client_profiles', qsEq('client_id', clientId) + '&select=*&limit=1');
      var before = (beforeRows && beforeRows.length > 0) ? beforeRows[0] : null;

      var patch = { client_id: clientId };
      CLIENT_PROFILE_FIELDS.forEach(function (f) {
        if (patchInput[f] !== undefined) patch[f] = patchInput[f];
      });

      var result = deps.sbUpsert
        ? deps.sbUpsert('client_profiles', [patch], 'client_id')
        : (function () { throw NlxInternalError('sbUpsert dependency not provided.', {}); })();
      var row = (result && result.length > 0) ? result[0] : patch;

      auditFn({
        requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
        action: 'clients.updateProfile', entityType: 'client_profiles', entityId: clientId,
        beforeData: before, afterData: row
      });
      return { profile: row };
    }
  };
}
