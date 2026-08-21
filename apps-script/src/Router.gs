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
function buildRoutes(clientsService, contentService, evidenceService, actionsService, gamificationService, progressService) {
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
    'content.listAssignments': contentService.listAssignments,

    // Fase 2B — evidence.* (EvidenceService.gs).
    'evidence.register': evidenceService.register,
    'evidence.list': evidenceService.list,
    'evidence.get': evidenceService.get,

    // Fase 2C — actions.* (ActionsService.gs).
    'actions.list': actionsService.list,
    'actions.get': actionsService.get,
    'actions.accredit': actionsService.accredit,
    'actions.listLogs': actionsService.listLogs,
    'actions.getLog': actionsService.getLog,

    // Fase 2D — MVP Gamification Minimal v1 (GamificationService.gs/
    // ProgressService.gs). safety.* y las 108 reglas de acreditacion
    // restantes siguen fuera de alcance.
    'gamification.calculateAction': gamificationService.calculateAction,
    'gamification.recalculateDay': gamificationService.recalculateDay,
    'gamification.rebuildProgress': gamificationService.rebuildProgress,
    'progress.get': progressService.get,
    'progress.getDaily': progressService.getDaily,
    'progress.getPillar': progressService.getPillar,
    'actions.accreditAndCalculate': actionsService.accreditAndCalculate
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
