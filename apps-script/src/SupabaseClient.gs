/**
 * SupabaseClient.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Cliente REST minimo contra Supabase PostgREST via UrlFetchApp (Apps
 * Script no tiene @supabase/supabase-js). Server-side only: la
 * service-role key nunca se devuelve ni se registra en logs.
 *
 * DEPENDE de UrlFetchApp (servicio real de Apps Script) -- no es
 * testeable en Node de forma directa. Los servicios de dominio
 * (ClientsService, ContentService) NO llaman a estas funciones
 * directamente: reciben referencias a ellas via inyeccion de
 * dependencias (ver Main.gs), lo que permite sustituirlas por fakes en
 * los tests de apps-script/tests/.
 *
 * IMPORTANTE — no exponer un proxy generico de Supabase al Dashboard
 * (encargo seccion 14/15): estas funciones son de uso interno del script,
 * nunca se enrutan directamente desde Router.gs.
 */

function nlxBuildHeaders(cfg, extra) {
  var headers = {
    apikey: cfg.serviceRoleKey,
    Authorization: 'Bearer ' + cfg.serviceRoleKey,
    'Content-Type': 'application/json'
  };
  if (extra) {
    Object.keys(extra).forEach(function (k) { headers[k] = extra[k]; });
  }
  return headers;
}

/**
 * Traduce un error HTTP/PostgREST a un NlxError del contrato, sin filtrar
 * el cuerpo crudo de Supabase al cliente. El texto crudo se registra solo
 * en el log interno.
 */
function mapSupabaseError(httpCode, parsedBody, rawText) {
  console.error('Supabase error httpCode=' + httpCode + ' body=' + rawText);
  var pgCode = parsedBody && parsedBody.code;
  if (httpCode === 409 || pgCode === '23505') {
    return NlxConflictError('Conflict writing to the database.', {});
  }
  if (httpCode === 400 || httpCode === 422) {
    return NlxValidationError('The database rejected the request payload.', {});
  }
  if (httpCode === 404) {
    return NlxNotFoundError('Resource not found.', {});
  }
  return NlxInternalError('Unexpected database error.', {});
}

/**
 * GET generico. `queryString` ya debe venir codificado (ver qsEncode en
 * este mismo fichero) -- nunca se acepta SQL/filtros arbitrarios desde el
 * Dashboard, solo desde codigo del propio script (encargo seccion 15).
 */
function sbSelect(table, queryString) {
  var cfg = getRequiredConfig();
  var url = cfg.supabaseUrl + '/rest/v1/' + table + (queryString ? '?' + queryString : '');
  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: nlxBuildHeaders(cfg),
    muteHttpExceptions: true
  });
  return nlxParseSupabaseResponse(resp);
}

function sbInsert(table, rows, opts) {
  opts = opts || {};
  var cfg = getRequiredConfig();
  var url = cfg.supabaseUrl + '/rest/v1/' + table;
  var extraHeaders = { Prefer: 'return=representation' };
  var resp = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: nlxBuildHeaders(cfg, extraHeaders),
    payload: JSON.stringify(rows),
    muteHttpExceptions: true
  });
  return nlxParseSupabaseResponse(resp);
}

/** Upsert por clave de negocio (on_conflict). */
function sbUpsert(table, rows, onConflictColumns) {
  var cfg = getRequiredConfig();
  var qs = 'on_conflict=' + encodeURIComponent(onConflictColumns);
  var url = cfg.supabaseUrl + '/rest/v1/' + table + '?' + qs;
  var extraHeaders = { Prefer: 'resolution=merge-duplicates,return=representation' };
  var resp = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: nlxBuildHeaders(cfg, extraHeaders),
    payload: JSON.stringify(rows),
    muteHttpExceptions: true
  });
  return nlxParseSupabaseResponse(resp);
}

/** PATCH filtrado. `filterQueryString` ya codificado, p.ej. "id=eq.<uuid>". */
function sbUpdate(table, filterQueryString, patch) {
  var cfg = getRequiredConfig();
  var url = cfg.supabaseUrl + '/rest/v1/' + table + '?' + filterQueryString;
  var extraHeaders = { Prefer: 'return=representation' };
  var resp = UrlFetchApp.fetch(url, {
    method: 'patch',
    headers: nlxBuildHeaders(cfg, extraHeaders),
    payload: JSON.stringify(patch),
    muteHttpExceptions: true
  });
  return nlxParseSupabaseResponse(resp);
}

function nlxParseSupabaseResponse(resp) {
  var code = resp.getResponseCode();
  var text = resp.getContentText();
  var data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = null;
  }
  if (code < 200 || code >= 300) {
    throw mapSupabaseError(code, data, text);
  }
  return data;
}

/** Codifica un valor para un filtro PostgREST `columna=eq.<valor>`. */
function qsEq(column, value) {
  return encodeURIComponent(column) + '=eq.' + encodeURIComponent(String(value));
}

/**
 * Codifica una lista de valores para un filtro PostgREST
 * `columna=in.(v1,v2,...)`. `values` debe ser no vacío -- llamar con
 * lista vacía no tiene un filtro PostgREST equivalente útil (el caller
 * debe evitar la llamada en ese caso).
 */
function qsIn(column, values) {
  var encoded = values.map(function (v) { return encodeURIComponent(String(v)); });
  return encodeURIComponent(column) + '=in.(' + encoded.join(',') + ')';
}
