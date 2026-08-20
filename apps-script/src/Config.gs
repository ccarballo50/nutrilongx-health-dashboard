/**
 * Config.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Lectura de secretos via PropertiesService (Script Properties), nunca
 * hardcodeados, nunca en control de versiones, nunca en logs/respuestas
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md; encargo seccion 12).
 *
 * DEPENDE de PropertiesService (servicio real de Apps Script) -- no es
 * testeable en Node de forma directa. Mantener esta funcion minima y sin
 * logica de negocio para que el resto del codigo si sea testeable via
 * inyeccion de dependencias.
 */

var NLX_REQUIRED_SCRIPT_PROPERTIES = Object.freeze([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DASHBOARD_API_KEY'
]);

/**
 * Lee y valida la configuracion requerida. Falla de forma segura
 * (NlxInternalError, sin exponer que falta exactamente al cliente externo
 * -- el detalle solo va a logging interno) si falta cualquier Script
 * Property obligatoria.
 */
function getRequiredConfig() {
  var props = PropertiesService.getScriptProperties();
  var values = {};
  var missing = [];
  NLX_REQUIRED_SCRIPT_PROPERTIES.forEach(function (key) {
    var v = props.getProperty(key);
    if (!v) missing.push(key);
    values[key] = v;
  });
  if (missing.length > 0) {
    // El detalle (que claves faltan) se registra solo en el log interno de
    // Apps Script, nunca en la respuesta HTTP.
    console.error('Missing required Script Properties: ' + missing.join(', '));
    throw NlxInternalError('Service is not configured correctly.', {});
  }
  return {
    supabaseUrl: values.SUPABASE_URL.replace(/\/+$/, ''),
    serviceRoleKey: values.SUPABASE_SERVICE_ROLE_KEY,
    dashboardApiKey: values.DASHBOARD_API_KEY
  };
}
