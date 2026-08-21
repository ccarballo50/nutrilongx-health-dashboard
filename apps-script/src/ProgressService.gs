/**
 * ProgressService.gs — NUTRILONGX Apps Script Phase 2D
 * (NUTRILONGX PLAYABLE MVP — MVP Gamification Minimal v1)
 *
 * Implementa progress.get/getDaily/getPillar — lecturas puras sobre las
 * proyecciones (`client_progress`/`daily_progress`) que
 * GamificationService.gs mantiene. Nunca escribe, nunca recalcula: si las
 * proyecciones no existen todavia para un cliente, devuelve un estado cero
 * explicito, nunca NOT_FOUND (un cliente sin ninguna accion validada
 * todavia tiene progreso legitimamente cero, no es un error).
 *
 * Fabrica con inyeccion de dependencias: `createProgressService({ sbSelect })`.
 */

var PROGRESS_GET_ALLOWED_FIELDS = Object.freeze(['client_id']);
var PROGRESS_GET_DAILY_ALLOWED_FIELDS = Object.freeze(['client_id', 'from', 'to', 'limit', 'cursor']);
var PROGRESS_GET_PILLAR_ALLOWED_FIELDS = Object.freeze(['client_id', 'pillar', 'from', 'to', 'limit', 'cursor']);

var PROGRESS_DAILY_FIELDS = 'id,client_id,date,pillar,action_count,base_dvg_hours,final_dvg_hours,engine_version,calculation_version,calculated_at';

function createProgressService(deps) {
  var sbSelectFn = deps.sbSelect;

  function zeroPillarProgress() {
    var out = {};
    NLX_PILLARS.forEach(function (p) { out[p] = 0; });
    return out;
  }

  /** progress.get(payload: { client_id }) */
  function get(payload) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, PROGRESS_GET_ALLOWED_FIELDS, 'progress.get payload');
    var clientId = requireUuid(payload.client_id, 'client_id');
    var rows = sbSelectFn('client_progress', qsEq('client_id', clientId) + '&select=*&limit=1');
    if (!rows || rows.length === 0) {
      return {
        client_id: clientId, total_dvg_hours: 0, total_dvg_days: 0, current_level: null,
        by_pillar: zeroPillarProgress(), updated_at: null
      };
    }
    var row = rows[0];
    var byPillar = zeroPillarProgress();
    Object.keys(row.pillar_progress || {}).forEach(function (p) {
      if (Object.prototype.hasOwnProperty.call(byPillar, p)) byPillar[p] = Number(row.pillar_progress[p]) || 0;
    });
    return {
      client_id: clientId,
      total_dvg_hours: Number(row.total_dvg_hours) || 0,
      total_dvg_days: Number(row.total_dvg_days) || 0,
      current_level: row.current_level || null,
      by_pillar: byPillar,
      updated_at: row.calculated_at
    };
  }

  /** progress.getDaily(payload: { client_id, from?, to?, limit?, cursor? }) */
  function getDaily(payload) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, PROGRESS_GET_DAILY_ALLOWED_FIELDS, 'progress.getDaily payload');
    var clientId = requireUuid(payload.client_id, 'client_id');
    var page = normalizePagination(payload);

    var qsParts = [qsEq('client_id', clientId)];
    if (payload.from !== undefined && payload.from !== null) {
      qsParts.push('date=gte.' + encodeURIComponent(requireIsoDate(payload.from, 'from')));
    }
    if (payload.to !== undefined && payload.to !== null) {
      qsParts.push('date=lte.' + encodeURIComponent(requireIsoDate(payload.to, 'to')));
    }
    var qs = qsParts.concat(['select=' + PROGRESS_DAILY_FIELDS, 'order=date.desc,pillar.asc', 'limit=' + page.limit]).join('&');

    var rows = sbSelectFn('daily_progress', qs) || [];
    return { daily_progress: rows, count: rows.length };
  }

  /** progress.getPillar(payload: { client_id, pillar, from?, to?, limit?, cursor? }) */
  function getPillar(payload) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, PROGRESS_GET_PILLAR_ALLOWED_FIELDS, 'progress.getPillar payload');
    var clientId = requireUuid(payload.client_id, 'client_id');
    var pillar = requirePillar(payload.pillar, 'pillar'); // rechaza 'mind' (alias legacy) igual que evidence.register/content.listMind.
    var page = normalizePagination(payload);

    var qsParts = [qsEq('client_id', clientId), qsEq('pillar', pillar)];
    if (payload.from !== undefined && payload.from !== null) {
      qsParts.push('date=gte.' + encodeURIComponent(requireIsoDate(payload.from, 'from')));
    }
    if (payload.to !== undefined && payload.to !== null) {
      qsParts.push('date=lte.' + encodeURIComponent(requireIsoDate(payload.to, 'to')));
    }
    var qs = qsParts.concat(['select=' + PROGRESS_DAILY_FIELDS, 'order=date.desc', 'limit=' + page.limit]).join('&');

    var rows = sbSelectFn('daily_progress', qs) || [];
    return { daily_progress: rows, count: rows.length };
  }

  return { get: get, getDaily: getDaily, getPillar: getPillar };
}
