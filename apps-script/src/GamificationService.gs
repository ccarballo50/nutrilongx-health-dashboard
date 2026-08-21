/**
 * GamificationService.gs — NUTRILONGX Apps Script Phase 2D
 * (NUTRILONGX PLAYABLE MVP — MVP Gamification Minimal v1)
 *
 * Implementa gamification.calculateAction/recalculateDay/rebuildProgress
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md) siguiendo
 * NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json — subconjunto necesario
 * para procesar correctamente los ACTION_LOG que el MVP Accreditation
 * Pack v1 puede producir hoy, sin construir el motor completo.
 *
 * Fabrica con inyeccion de dependencias, mismo patron que los demas
 * servicios: `createGamificationService({ sbSelect, sbInsert, sbUpdate,
 * sbUpsert, writeAudit })`.
 *
 * ============================================================================
 * CLASIFICACION DE MECANISMOS DEL MOTOR CANONICO (encargo seccion 9)
 *
 * A — necesarios e IMPLEMENTADOS para calcular correctamente un evento MVP:
 *   1. base_dvg (calculation_order step 1): snapshot de action_logs.
 *      base_dvg_hours, re-verificado contra canonical_actions.data.
 *      level_variants -- nunca recalculado desde una heuristica.
 *   2. streaks.daily (step 2): formula canonica exacta
 *      `min(1 + k*s, 1+cap)` (k=0.02, cap=0.2), con `s` derivado en real de
 *      dias consecutivos previos con >=1 action_log validated del mismo
 *      `canonical_actions.domain` para ese cliente (ventana acotada de
 *      14 dias -- (1+cap)/k=10, con margen; mas alla no cambia el
 *      multiplicador). Para todo fixture MVP actual (eventos aislados,
 *      primera vez) resuelve `s=0` -> multiplicador=1.0, verificado y
 *      testeado, no es un atajo, es el resultado real de la formula sobre
 *      datos reales.
 *   3. daily_caps (parte de step 5): techo diario por dominio legacy
 *      (Retos (Ejercicio)/Rutinas/Alimentacion/Mente) + techo global, con
 *      reduccion PROPORCIONAL si se supera (interpretacion unica y
 *      determinista de aplicar un techo a una suma ya calculada -- no una
 *      regla inventada). Mapa dominio->clave de cap tomado literalmente
 *      del propio catalogo canonico (`legacy_pillar` de cada accion en
 *      NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json).
 *
 * B — mecanismo bien definido pero NO disparado por ningun fixture MVP
 *   actual ni previsible a corto plazo; NO implementado en codigo,
 *   documentado como NOT_TRIGGERED_IN_CURRENT_MVP_FIXTURE:
 *   - boosters."Weekend Warrior": exige >=90 min de actividad de
 *     movimiento el mismo dia (sabado/domingo); ninguna de las 11 reglas
 *     MVP puede producir por si sola mas de ~20 min por evento, y no hay
 *     mecanismo de composicion de varios eventos implementado.
 *
 * C — requiere datos/condiciones que HOY no existen en el esquema, o cuya
 *   semantica es ambigua sobre el modelo de acreditacion actual (accion
 *   discreta con base_dvg_hours fijo por evento, no una funcion continua
 *   de minutos):
 *   - boosters."Coach Check" (`coach_verified`), "Social Buddy"
 *     (`community_challenge_participation`), "Recovery Perfect"
 *     (delayed=true, condicion cruzada sueño+alcohol+rutina el mismo dia
 *     aplicada a Retos): ningun campo de execution_evidence/action_logs
 *     captura estos conceptos.
 *   - combos."Move + Sleep"/"Food + Mind" (conceptos `sleep_goal_achieved`/
 *     `diet_day_level` no definidos por ningun artefacto canonico leido),
 *     "All 4 pilares" (imposible con las 11 reglas MVP: no cubren los 4
 *     dominios legacy el mismo evento sin composicion multi-accion),
 *     "Cardio + Fuerza" (el pack MVP no tiene ninguna regla
 *     `movement.strength`, estructuralmente no puede dispararse).
 *   - weekly_multipliers (los 4) y weekly_cap: el propio esquema real
 *     (supabase/migrations/0002_standalone_backend_v1.sql, comentario de
 *     `daily_progress`) declara explicitamente "weekly_progress NO se
 *     crea en v1 -- multiplicadores/caps semanales se representan via
 *     calculation_trace/rebuild sin tabla dedicada" -- confirmacion
 *     canonica directa de que esto queda fuera de v1.
 *   - diminishing_returns: los umbrales del motor (`minutes_per_day`,
 *     `actions_per_day`) operan sobre una acumulacion continua de
 *     minutos/acciones: el modelo de acreditacion MVP otorga un
 *     base_dvg_hours FIJO por evento discreto ya acreditado, no una
 *     funcion continua de minutos -- aplicar el mecanismo exigiria decidir
 *     que fraccion de que evento se recorta, decision no resuelta por
 *     ningun artefacto canonico leido. No se inventa. Ademas,
 *     estructuralmente lejos de los umbrales (180 min/dia movement,
 *     6-8 acciones/dia adherence/nutrition/mind) con las 11 reglas MVP
 *     (max_occurrences=1/dia cada una).
 *
 * legacy_deprecated.level_multiplier: EXCLUIDO por decision de gobernanza
 * (DECISION_1) -- NUNCA se aplica, verificado con test dedicado.
 *
 * `simplified_parallel_engine: NO` -- lo que se implementa (A) sigue la
 * formula canonica exacta sobre datos reales; lo que no se implementa
 * (B/C) queda documentado, no sustituido por una aproximacion propia.
 * ============================================================================
 */

var GAMIFICATION_ENGINE_VERSION = 'NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.0.0';
var GAMIFICATION_CALCULATION_VERSION = 'MVP_GAMIFICATION_MINIMAL_v1';

// Mapa domain (canonical_actions.domain) -> clave de cap legacy. Tomado
// literalmente de NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json
// (actions[*].legacy_pillar es identico para todas las acciones de un
// mismo domain: adherence->"Rutinas", mind->"Mente",
// movement->"Retos (Ejercicio)", nutrition->"Alimentación").
var GAMIFICATION_DOMAIN_CAP_KEY = Object.freeze({
  adherence: 'Rutinas',
  mind: 'Mente',
  movement: 'Retos (Ejercicio)',
  nutrition: 'Alimentación'
});

// active.caps.daily de NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json, citado literal.
var GAMIFICATION_DAILY_CAPS = Object.freeze({
  'Retos (Ejercicio)': 6.0,
  'Rutinas': 4.0,
  'Alimentación': 6.0,
  'Mente': 4.0,
  'GLOBAL': 10.0
});

// active.streaks.daily de NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json, citado literal.
var GAMIFICATION_STREAK_DAILY_K = 0.02;
var GAMIFICATION_STREAK_DAILY_CAP = 0.2;
var GAMIFICATION_STREAK_LOOKBACK_DAYS = 14; // (1+cap)/k = 10 dias -- margen suficiente, acota la consulta.

var GAMIFICATION_MECHANISMS_NOT_TRIGGERED = Object.freeze([
  'streaks.weekly', 'boosters.weekend_warrior', 'boosters.coach_check', 'boosters.social_buddy',
  'boosters.recovery_perfect', 'combos.move_sleep', 'combos.food_mind', 'combos.all_4_pilares',
  'combos.cardio_fuerza', 'weekly_multipliers.who_cumplido', 'weekly_multipliers.mediterranea_5_dias',
  'weekly_multipliers.sueno_saludable', 'weekly_multipliers.all_pillars_week', 'weekly_cap',
  'diminishing_returns'
]);

var GAMIFICATION_CALCULATE_ACTION_ALLOWED_FIELDS = Object.freeze(['action_log_id']);
var GAMIFICATION_RECALCULATE_DAY_ALLOWED_FIELDS = Object.freeze(['client_id', 'date']);
var GAMIFICATION_REBUILD_PROGRESS_ALLOWED_FIELDS = Object.freeze(['client_id']);

function createGamificationService(deps) {
  var sbSelectFn = deps.sbSelect;
  var sbUpdateFn = deps.sbUpdate;
  var sbUpsertFn = deps.sbUpsert;
  var auditFn = deps.writeAudit;

  function dayOf(isoDateTime) {
    return new Date(isoDateTime).toISOString().slice(0, 10);
  }

  function fetchActionLogById(actionLogId) {
    var rows = sbSelectFn('action_logs', qsEq('id', actionLogId) + '&select=*&limit=1');
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  function fetchCanonicalAction(canonicalActionId) {
    var rows = sbSelectFn('canonical_actions', qsEq('canonical_action_id', canonicalActionId) + '&select=canonical_action_id,domain,data,is_active&limit=1');
    return (rows && rows.length > 0) ? rows[0] : null;
  }

  function fetchEvidencePillar(evidenceId) {
    var rows = sbSelectFn('execution_evidence', qsEq('id', evidenceId) + '&select=pillar&limit=1');
    return (rows && rows.length > 0) ? rows[0].pillar : null;
  }

  function findLevelVariant(canonicalActionData, levelVariant) {
    var levelVariants = (canonicalActionData && Array.isArray(canonicalActionData.level_variants)) ? canonicalActionData.level_variants : [];
    for (var i = 0; i < levelVariants.length; i++) {
      if (levelVariants[i].level === levelVariant) return levelVariants[i];
    }
    return null;
  }

  /** s = dias consecutivos previos (antes de dayStr) con >=1 validated action_log del mismo domain para ese cliente. */
  function computeDailyStreakDays(clientId, domain, dayStr) {
    var domainRows = sbSelectFn('canonical_actions', qsEq('domain', domain) + '&select=canonical_action_id') || [];
    var domainIds = {};
    domainRows.forEach(function (r) { domainIds[r.canonical_action_id] = true; });

    var lookbackStart = new Date(dayStr + 'T00:00:00.000Z');
    lookbackStart.setUTCDate(lookbackStart.getUTCDate() - GAMIFICATION_STREAK_LOOKBACK_DAYS);
    var qs = qsEq('client_id', clientId) + '&' + qsEq('status', 'validated')
      + '&occurred_at=gte.' + encodeURIComponent(lookbackStart.toISOString())
      + '&occurred_at=lt.' + encodeURIComponent(dayStr + 'T00:00:00.000Z')
      + '&select=canonical_action_id,occurred_at';
    var priorLogs = sbSelectFn('action_logs', qs) || [];

    var presentDays = {};
    priorLogs.forEach(function (r) {
      if (domainIds[r.canonical_action_id]) presentDays[dayOf(r.occurred_at)] = true;
    });

    var streak = 0;
    var cursor = new Date(dayStr + 'T00:00:00.000Z');
    for (var i = 0; i < GAMIFICATION_STREAK_LOOKBACK_DAYS; i++) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      var cursorDay = cursor.toISOString().slice(0, 10);
      if (presentDays[cursorDay]) { streak++; } else { break; }
    }
    return streak;
  }

  function round4(n) { return Math.round(n * 10000) / 10000; }
  function round2(n) { return Math.round(n * 100) / 100; }

  /**
   * Nucleo de gamification.calculateAction, reutilizado por
   * recalculateDay/rebuildProgress (nunca duplicado).
   */
  function runCalculateAction(actionLog, ctx) {
    if (actionLog.status !== 'validated') {
      throw NlxDataIntegrityError(
        'gamification.calculateAction requires a validated action_log.',
        { action_log_id: actionLog.id, status: actionLog.status }
      );
    }

    var canonicalAction = fetchCanonicalAction(actionLog.canonical_action_id);
    if (!canonicalAction) {
      throw NlxDataIntegrityError('Canonical action referenced by this action_log no longer exists.', { canonical_action_id: actionLog.canonical_action_id });
    }
    var levelVariant = findLevelVariant(canonicalAction.data, actionLog.level_variant);
    if (!levelVariant || typeof levelVariant.base_dvg_hours !== 'number') {
      throw NlxDataIntegrityError(
        'action_log.level_variant no longer resolves to a level_variant in the canonical catalog.',
        { canonical_action_id: actionLog.canonical_action_id, level_variant: actionLog.level_variant }
      );
    }
    // El snapshot nunca se recalcula retroactivamente (encargo seccion 7) --
    // solo se VERIFICA consistencia. Cualquier deriva es DATA_INTEGRITY_ERROR.
    if (round4(levelVariant.base_dvg_hours) !== round4(Number(actionLog.base_dvg_hours))) {
      throw NlxDataIntegrityError(
        'action_log.base_dvg_hours snapshot no longer matches the canonical catalog for its level_variant.',
        { canonical_action_id: actionLog.canonical_action_id, level_variant: actionLog.level_variant, snapshot: actionLog.base_dvg_hours, catalog: levelVariant.base_dvg_hours }
      );
    }

    var existingGam = actionLog.provenance && actionLog.provenance.gamification;
    if (existingGam && existingGam.calculation_version === GAMIFICATION_CALCULATION_VERSION) {
      return {
        action_log_id: actionLog.id,
        event_dvg_hours: existingGam.event_dvg_hours,
        base_dvg_hours: Number(actionLog.base_dvg_hours),
        streak: existingGam.streak,
        engine_version: existingGam.engine_version,
        calculation_version: existingGam.calculation_version,
        mechanisms_applied: existingGam.mechanisms_applied,
        mechanisms_not_triggered: existingGam.mechanisms_not_triggered,
        idempotent: true
      };
    }

    var dayStr = dayOf(actionLog.occurred_at);
    var streakDays = computeDailyStreakDays(actionLog.client_id, canonicalAction.domain, dayStr);
    var streakMultiplier = Math.min(1 + GAMIFICATION_STREAK_DAILY_K * streakDays, 1 + GAMIFICATION_STREAK_DAILY_CAP);
    var eventDvgHours = round4(Number(actionLog.base_dvg_hours) * streakMultiplier);

    var mechanismsApplied = ['base_dvg', 'streaks.daily'];
    var gamProvenance = {
      engine_version: GAMIFICATION_ENGINE_VERSION,
      calculation_version: GAMIFICATION_CALCULATION_VERSION,
      base_dvg_hours: Number(actionLog.base_dvg_hours),
      domain: canonicalAction.domain,
      streak: { domain: canonicalAction.domain, streak_days: streakDays, multiplier: streakMultiplier },
      event_dvg_hours: eventDvgHours,
      mechanisms_applied: mechanismsApplied,
      mechanisms_not_triggered: GAMIFICATION_MECHANISMS_NOT_TRIGGERED,
      calculated_at: new Date().toISOString()
    };
    var mergedProvenance = actionLog.provenance ? JSON.parse(JSON.stringify(actionLog.provenance)) : {};
    mergedProvenance.gamification = gamProvenance;
    sbUpdateFn('action_logs', qsEq('id', actionLog.id), { provenance: mergedProvenance });

    if (ctx) {
      auditFn({
        requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
        action: 'gamification.calculateAction', entityType: 'action_logs', entityId: actionLog.id,
        beforeData: null, afterData: { provenance: mergedProvenance },
        metadata: { event_dvg_hours: eventDvgHours, streak_days: streakDays, streak_multiplier: streakMultiplier, engine_version: GAMIFICATION_ENGINE_VERSION, calculation_version: GAMIFICATION_CALCULATION_VERSION }
      });
    }

    return {
      action_log_id: actionLog.id,
      event_dvg_hours: eventDvgHours,
      base_dvg_hours: Number(actionLog.base_dvg_hours),
      streak: gamProvenance.streak,
      engine_version: GAMIFICATION_ENGINE_VERSION,
      calculation_version: GAMIFICATION_CALCULATION_VERSION,
      mechanisms_applied: mechanismsApplied,
      mechanisms_not_triggered: GAMIFICATION_MECHANISMS_NOT_TRIGGERED,
      idempotent: false
    };
  }

  /** gamification.calculateAction(payload: { action_log_id }) */
  function calculateAction(payload, ctx) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, GAMIFICATION_CALCULATE_ACTION_ALLOWED_FIELDS, 'gamification.calculateAction payload');
    var actionLogId = requireUuid(payload.action_log_id, 'action_log_id');
    var actionLog = fetchActionLogById(actionLogId);
    if (!actionLog) throw NlxNotFoundError('Action log not found.', { action_log_id: actionLogId });
    return runCalculateAction(actionLog, ctx);
  }

  /** Nucleo de recalculateDay, reutilizado por rebuildProgress. */
  function runRecalculateDay(clientId, dateStr, ctx) {
    var dayStartIso = dateStr + 'T00:00:00.000Z';
    var dayEndDate = new Date(dayStartIso);
    dayEndDate.setUTCDate(dayEndDate.getUTCDate() + 1);
    var qs = qsEq('client_id', clientId) + '&' + qsEq('status', 'validated')
      + '&occurred_at=gte.' + encodeURIComponent(dayStartIso)
      + '&occurred_at=lt.' + encodeURIComponent(dayEndDate.toISOString())
      + '&select=*';
    var dayLogs = sbSelectFn('action_logs', qs) || [];

    if (dayLogs.length === 0) {
      return { client_id: clientId, date: dateStr, pillars: [], total_dvg_hours: 0, action_logs_processed: 0 };
    }

    var canonicalActionCache = {};
    function getCanonicalAction(id) {
      if (!canonicalActionCache[id]) canonicalActionCache[id] = fetchCanonicalAction(id);
      return canonicalActionCache[id];
    }

    // 1. calcular (o leer cacheado) event_dvg_hours de cada log + su domain/pillar.
    var perLog = dayLogs.map(function (log) {
      var calc = runCalculateAction(log, null); // nunca re-audita aqui -- calculateAction ya audito si era la primera vez.
      var ca = getCanonicalAction(log.canonical_action_id);
      var pillar = fetchEvidencePillar(log.evidence_id);
      return { log: log, event_dvg_hours: calc.event_dvg_hours, domain: ca.domain, pillar: pillar };
    });

    // 2. agrupar por domain, aplicar cap diario por dominio (reduccion proporcional si se supera).
    var byDomain = {};
    perLog.forEach(function (r) {
      byDomain[r.domain] = byDomain[r.domain] || [];
      byDomain[r.domain].push(r);
    });
    var domainScale = {};
    var domainTrace = {};
    Object.keys(byDomain).forEach(function (domain) {
      var total = byDomain[domain].reduce(function (s, r) { return s + r.event_dvg_hours; }, 0);
      var capKey = GAMIFICATION_DOMAIN_CAP_KEY[domain];
      var cap = capKey ? GAMIFICATION_DAILY_CAPS[capKey] : null;
      var scale = (cap !== null && total > cap) ? (cap / total) : 1;
      domainScale[domain] = scale;
      domainTrace[domain] = { cap_key: capKey, total_before_cap: round4(total), cap: cap, total_after_cap: round4(total * scale), scale_factor: scale };
    });

    // 3. aplicar escala de dominio; agrupar por PILLAR (execution_evidence.pillar -- fuente ya validada, no inventada).
    var byPillar = {};
    perLog.forEach(function (r) {
      // Sin redondear aqui -- redondear por evento antes de sumar introduce
      // deriva de precision (§ acumulacion). Solo se redondea el total final.
      var scaled = r.event_dvg_hours * domainScale[r.domain];
      byPillar[r.pillar] = byPillar[r.pillar] || { base_dvg_hours: 0, final_dvg_hours: 0, action_count: 0 };
      byPillar[r.pillar].base_dvg_hours += Number(r.log.base_dvg_hours);
      byPillar[r.pillar].final_dvg_hours += scaled;
      byPillar[r.pillar].action_count += 1;
    });

    // 4. cap GLOBAL diario sobre la suma ya capada por dominio (reduccion proporcional adicional si se supera).
    var grandTotal = Object.keys(byPillar).reduce(function (s, p) { return s + byPillar[p].final_dvg_hours; }, 0);
    var globalScale = (grandTotal > GAMIFICATION_DAILY_CAPS.GLOBAL) ? (GAMIFICATION_DAILY_CAPS.GLOBAL / grandTotal) : 1;

    var nowIso = new Date().toISOString();
    var pillarsWritten = [];
    var totalDvgHoursDay = 0;
    Object.keys(byPillar).forEach(function (pillar) {
      var finalHours = round4(byPillar[pillar].final_dvg_hours * globalScale);
      totalDvgHoursDay += finalHours;
      var row = {
        client_id: clientId, date: dateStr, pillar: pillar,
        action_count: byPillar[pillar].action_count,
        base_dvg_hours: round4(byPillar[pillar].base_dvg_hours),
        final_dvg_hours: finalHours,
        calculation_trace: {
          domain_caps: domainTrace, global_cap: { cap: GAMIFICATION_DAILY_CAPS.GLOBAL, scale_factor: globalScale, total_before: round4(grandTotal) },
          mechanisms_applied: ['base_dvg', 'streaks.daily', 'daily_caps'], mechanisms_not_triggered: GAMIFICATION_MECHANISMS_NOT_TRIGGERED
        },
        engine_version: GAMIFICATION_ENGINE_VERSION, calculation_version: GAMIFICATION_CALCULATION_VERSION,
        calculated_at: nowIso
      };
      sbUpsertFn('daily_progress', [row], 'client_id,date,pillar');
      pillarsWritten.push(pillar);
    });
    totalDvgHoursDay = round4(totalDvgHoursDay);

    // 5. reconstruir client_progress desde TODO daily_progress del cliente (nunca desde el propio client_progress previo).
    var allDaily = sbSelectFn('daily_progress', qsEq('client_id', clientId) + '&select=pillar,final_dvg_hours') || [];
    var pillarProgress = {};
    NLX_PILLARS.forEach(function (p) { pillarProgress[p] = 0; });
    var totalDvgHours = 0;
    allDaily.forEach(function (r) {
      var v = Number(r.final_dvg_hours) || 0;
      pillarProgress[r.pillar] = round4((pillarProgress[r.pillar] || 0) + v);
      totalDvgHours += v;
    });
    totalDvgHours = round4(totalDvgHours);
    var clientProgressRow = {
      client_id: clientId,
      total_dvg_hours: totalDvgHours,
      total_dvg_days: round2(totalDvgHours / 24),
      current_level: null, // canon no resuelve un nivel inequivoco desde progreso acumulado (encargo seccion 18) -- no se inventa.
      streaks: {},
      pillar_progress: pillarProgress,
      calculation_trace: { rebuilt_from: 'daily_progress', last_recalculated_date: dateStr },
      calculated_at: nowIso,
      engine_version: GAMIFICATION_ENGINE_VERSION,
      calculation_version: GAMIFICATION_CALCULATION_VERSION
    };
    sbUpsertFn('client_progress', [clientProgressRow], 'client_id');

    if (ctx) {
      auditFn({
        requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
        action: 'gamification.recalculateDay', entityType: 'client_progress', entityId: clientId,
        beforeData: null, afterData: { date: dateStr, pillars: pillarsWritten },
        metadata: { date: dateStr, pillars: pillarsWritten, total_dvg_hours_day: totalDvgHoursDay, action_logs_processed: dayLogs.length }
      });
    }

    return { client_id: clientId, date: dateStr, pillars: pillarsWritten, total_dvg_hours: totalDvgHoursDay, action_logs_processed: dayLogs.length };
  }

  /** gamification.recalculateDay(payload: { client_id, date }) */
  function recalculateDay(payload, ctx) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, GAMIFICATION_RECALCULATE_DAY_ALLOWED_FIELDS, 'gamification.recalculateDay payload');
    var clientId = requireUuid(payload.client_id, 'client_id');
    var dateStr = requireIsoDate(payload.date, 'date');
    return runRecalculateDay(clientId, dateStr, ctx);
  }

  /** gamification.rebuildProgress(payload: { client_id }) */
  function rebuildProgress(payload, ctx) {
    requireObject(payload, 'payload');
    rejectUnknownKeys(payload, GAMIFICATION_REBUILD_PROGRESS_ALLOWED_FIELDS, 'gamification.rebuildProgress payload');
    var clientId = requireUuid(payload.client_id, 'client_id');

    var rows = sbSelectFn('action_logs', qsEq('client_id', clientId) + '&' + qsEq('status', 'validated') + '&select=occurred_at') || [];
    var distinctDays = {};
    rows.forEach(function (r) { distinctDays[dayOf(r.occurred_at)] = true; });
    var days = Object.keys(distinctDays).sort();

    var perDay = days.map(function (d) { return runRecalculateDay(clientId, d, null); });

    var finalProgress = sbSelectFn('client_progress', qsEq('client_id', clientId) + '&select=*&limit=1');
    var total = (finalProgress && finalProgress.length > 0) ? Number(finalProgress[0].total_dvg_hours) : 0;

    auditFn({
      requestId: ctx.requestId, actorType: ctx.actorType, actorId: ctx.actorId,
      action: 'gamification.rebuildProgress', entityType: 'clients', entityId: clientId,
      beforeData: null, afterData: { dates_processed: days },
      metadata: { dates_processed: days, total_dvg_hours: total }
    });

    return { client_id: clientId, dates_processed: days, total_dvg_hours: total, per_day: perDay };
  }

  return { calculateAction: calculateAction, recalculateDay: recalculateDay, rebuildProgress: rebuildProgress };
}
