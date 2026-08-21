/**
 * Main.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Unicos puntos de entrada reales de Apps Script (doGet/doPost). Actuan
 * como adaptadores HTTP finos (encargo seccion 6): parsean/validan el
 * transporte, delegan en Router.gs/los servicios de dominio, y serializan
 * la respuesta. Ninguna logica de negocio vive aqui.
 *
 * DISEÑO — todas las funciones del contrato se invocan por POST, incluidas
 * las de lectura (clients.list, content.listRecipes, ...). No se acepta
 * ninguna funcion de negocio por GET. Motivo, documentado explicitamente
 * (encargo seccion 40/42, ver tambien apps-script/README.md):
 *
 *   1. Apps Script Web Apps NO exponen las cabeceras HTTP de la peticion
 *      en doGet(e)/doPost(e) (no existe `e.headers`) -- no se puede leer
 *      un header tipo `X-Admin-Key`. La autenticacion de Dashboard se
 *      transporta por tanto dentro del cuerpo JSON (`auth.dashboard_key`),
 *      nunca en query string (encargo seccion 40, explicitamente prohibido)
 *      ni en un header que la plataforma no expone.
 *   2. Con eso ya resuelto, mantener TODO por POST (incluidas lecturas)
 *      evita tener dos mecanismos de transporte distintos y evita
 *      cualquier tentacion de mandar la clave en un query string de GET.
 *
 * Envelope de respuesta: Apps Script `ContentService.createTextOutput`
 * SIEMPRE responde HTTP 200 a nivel de transporte para una ejecucion de
 * script correcta -- no hay forma de fijar un codigo HTTP de negocio
 * distinto (otra limitacion real de la plataforma, no una decision de
 * diseño). Por eso el contrato ya es "siempre 200 + envelope ok:true/false"
 * -- el cliente (Dashboard) debe mirar SIEMPRE `body.ok` y `body.error.code`,
 * nunca el status HTTP de transporte.
 */

function nlxNowIso() {
  return new Date().toISOString();
}

function nlxBuildRealServices() {
  var clientsService = createClientsService({
    sbSelect: sbSelect,
    sbInsert: sbInsert,
    sbUpdate: sbUpdate,
    sbUpsert: sbUpsert,
    writeAudit: writeAudit
  });
  var contentService = createContentService({
    sbSelect: sbSelect,
    sbInsert: sbInsert,
    sbUpdate: sbUpdate,
    writeAudit: writeAudit
  });
  var evidenceService = createEvidenceService({
    sbSelect: sbSelect,
    sbInsert: sbInsert,
    writeAudit: writeAudit
  });
  return buildRoutes(clientsService, contentService, evidenceService);
}

/**
 * Parsea el cuerpo de la peticion. Se espera JSON (enviado como
 * `text/plain` desde el Dashboard para evitar el preflight CORS que Apps
 * Script Web Apps no puede responder -- no implementan doOptions()).
 */
function nlxParseRequestBody(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string') {
    throw NlxValidationError('Missing request body.', {});
  }
  var parsed;
  try {
    parsed = JSON.parse(e.postData.contents);
  } catch (err) {
    throw NlxValidationError('Request body is not valid JSON.', {});
  }
  requireObject(parsed, 'request body');
  return parsed;
}

function nlxCheckDashboardAuth(body, cfg) {
  var provided = body && body.auth && body.auth.dashboard_key;
  if (!provided || typeof provided !== 'string' || provided !== cfg.dashboardApiKey) {
    // No se revela si la key existia o cual era el valor esperado
    // (encargo seccion 41).
    throw NlxUnauthorizedError('Missing or invalid professional credential.', {});
  }
}

function nlxHandleRequest(e) {
  var requestId = Utilities.getUuid();
  var timestampIso = nlxNowIso();
  var startedAt = Date.now();
  var functionName = null;

  try {
    var cfg = getRequiredConfig();
    var body = nlxParseRequestBody(e);
    functionName = body.function;
    nlxCheckDashboardAuth(body, cfg);

    var ctx = { requestId: requestId, actorType: 'professional', actorId: null };
    var routes = nlxBuildRealServices();
    var data = routeRequest(routes, functionName, body.payload || {}, ctx);

    console.log('nlx_request ok function=' + functionName + ' request_id=' + requestId + ' duration_ms=' + (Date.now() - startedAt));
    return buildSuccessEnvelope(data, requestId, timestampIso);
  } catch (err) {
    var normalized = normalizeError(err);
    console.error('nlx_request error function=' + functionName + ' request_id=' + requestId + ' code=' + normalized.code + ' duration_ms=' + (Date.now() - startedAt));
    return buildErrorEnvelope(normalized.code, normalized.message, normalized.details, requestId, timestampIso);
  }
}

function doPost(e) {
  var envelope = nlxHandleRequest(e);
  return ContentService.createTextOutput(JSON.stringify(envelope)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * doGet: unicamente un health-check estatico, sin autenticacion, sin
 * datos de negocio. Ninguna funcion del contrato se invoca por GET (ver
 * cabecera de este fichero).
 */
function doGet(e) {
  var envelope = buildSuccessEnvelope(
    { service: 'nutrilongx-apps-script', status: 'healthy', note: 'Use POST with {function, auth, payload} for all NUTRILONGX functions.' },
    Utilities.getUuid(),
    nlxNowIso()
  );
  return ContentService.createTextOutput(JSON.stringify(envelope)).setMimeType(ContentService.MimeType.JSON);
}
