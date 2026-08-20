/**
 * Router.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Allowlist explicita de funciones invocables (encargo seccion 7/43). No
 * hay dispatch dinamico (`eval`, `this[name]()`): solo se puede ejecutar
 * una funcion cuyo nombre exista literalmente como clave de
 * NLX_ALLOWED_FUNCTIONS.
 *
 * PURO respecto a Apps Script: recibe los servicios ya construidos (con
 * sus dependencias ya inyectadas) y no toca directamente ningun servicio
 * de Apps Script.
 */

/**
 * Construye el mapa de rutas permitidas a partir de instancias ya creadas
 * de los servicios de dominio.
 */
function buildRoutes(clientsService, contentService) {
  return {
    'clients.list': clientsService.list,
    'clients.get': clientsService.get,
    'clients.create': clientsService.create,
    'clients.update': clientsService.update,
    'clients.getProfile': clientsService.getProfile,
    'clients.updateProfile': clientsService.updateProfile,

    'content.listRecipes': contentService.listRecipes,
    'content.getRecipe': contentService.getRecipe,
    'content.listExercises': contentService.listExercises,
    'content.getExercise': contentService.getExercise,
    'content.listMind': contentService.listMind,
    'content.getMindContent': contentService.getMindContent,
    'content.assign': contentService.assign,
    'content.unassign': contentService.unassign,
    'content.listAssignments': contentService.listAssignments
  };
}

/**
 * Ejecuta `functionName` con `payload`/`ctx` si (y solo si) esta en el
 * allowlist de `routes`. Nunca usa eval ni indexado dinamico sobre `this`
 * o `globalThis` -- `routes` es un objeto de datos explicito construido
 * por buildRoutes().
 */
function routeRequest(routes, functionName, payload, ctx) {
  if (typeof functionName !== 'string' || !Object.prototype.hasOwnProperty.call(routes, functionName)) {
    throw NlxNotFoundError('Unknown function: ' + String(functionName), { function: functionName });
  }
  var handler = routes[functionName];
  if (typeof handler !== 'function') {
    throw NlxInternalError('Route is not callable.', { function: functionName });
  }
  return handler(payload, ctx);
}
