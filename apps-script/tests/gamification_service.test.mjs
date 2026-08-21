// apps-script/tests/gamification_service.test.mjs
//
// Tests de GamificationService.gs (Fase 2D / MVP Gamification Minimal v1)
// con dependencias FAKE (sin Supabase real). A diferencia de la fake-DB
// compartida de otros tests, esta soporta filtros gte/lte/gt/lt (no solo
// eq) y upsert real por clave de conflicto -- imprescindibles para
// recalculateDay/rebuildProgress.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Response.gs", "Validation.gs", "SupabaseClient.gs", "GamificationService.gs"]);

const CTX = { requestId: "req-1", actorType: "professional", actorId: "prof-1" };
const CLIENT_ID = "88888888-1111-1111-1111-111111111111";

function makeFakeDb() {
  const tables = { canonical_actions: [], action_logs: [], execution_evidence: [], daily_progress: [], client_progress: [] };
  const auditLog = [];

  function applyFilters(rows, qs) {
    let out = rows;
    const params = new URLSearchParams(qs);
    for (const [k, v] of params.entries()) {
      if (k === "select" || k === "order" || k === "limit") continue;
      const m = v.match(/^(eq|gte|lte|gt|lt)\.(.*)$/);
      if (!m) continue;
      const [, op, val] = m;
      out = out.filter((r) => {
        const rv = String(r[k]);
        if (op === "eq") return rv === val;
        if (op === "gte") return rv >= val;
        if (op === "lte") return rv <= val;
        if (op === "gt") return rv > val;
        return rv < val; // lt
      });
    }
    return out.map((r) => ({ ...r }));
  }

  const deps = {
    sbSelect: (table, qs) => applyFilters(tables[table] || [], qs),
    sbUpdate: (table, filterQs, patch) => {
      const params = new URLSearchParams(filterQs);
      let matched = tables[table] || [];
      for (const [k, v] of params.entries()) {
        if (v.startsWith("eq.")) matched = matched.filter((r) => String(r[k]) === v.slice(3));
      }
      matched.forEach((r) => Object.assign(r, patch));
      return matched.map((r) => ({ ...r }));
    },
    sbUpsert: (table, rows, onConflict) => {
      const keys = onConflict.split(",");
      tables[table] = tables[table] || [];
      return rows.map((row) => {
        const existing = tables[table].find((r) => keys.every((k) => String(r[k]) === String(row[k])));
        if (existing) {
          Object.assign(existing, row);
          return { ...existing };
        }
        const newRow = { id: "gen-" + Math.random().toString(36).slice(2), ...row };
        tables[table].push(newRow);
        return { ...newRow };
      });
    },
    writeAudit: (entry) => {
      auditLog.push(entry);
      return entry;
    },
  };

  return { deps, tables, auditLog };
}

const CARDIO_ACTION_ID = "movement.cardio.caminata_vigorosa_min";
const STRESS_ACTION_ID = "mind.stress.musica_relajante_min";

function seedCanonicalAction(db, { id = CARDIO_ACTION_ID, domain = "movement", levels = [{ level: "Inicial", base_dvg_hours: 1.4 }] } = {}) {
  db.tables.canonical_actions.push({ canonical_action_id: id, domain, is_active: true, data: { level_variants: levels } });
}

function seedEvidence(db, { id = "ev-1", pillar = "exercise", client_id = CLIENT_ID } = {}) {
  db.tables.execution_evidence.push({ id, pillar, client_id });
}

function seedActionLog(db, overrides) {
  const row = {
    id: "11111111-1111-1111-1111-111111111111", client_id: CLIENT_ID, canonical_action_id: CARDIO_ACTION_ID, evidence_id: "ev-1",
    accreditation_rule_id: "RULE-1", level_variant: "Inicial", occurred_at: "2026-08-21T10:00:00.000Z",
    base_dvg_hours: 1.4, engine_version: "ACCREDITATION_v1", calculation_version: "ACCREDITATION_v1",
    deduplication_key: "dedup-1", status: "validated", provenance: {}, ...overrides,
  };
  db.tables.action_logs.push(row);
  return row;
}

export function run() {
  // ── gamification.calculateAction ──

  test("calculateAction: validated log -> event_dvg_hours computed, streak=0 (no history), provenance persisted", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedEvidence(db);
    seedActionLog(db);
    const svc = sb.createGamificationService(db.deps);
    const r = svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
    assert.equal(r.event_dvg_hours, 1.4); // streak=0 -> multiplicador 1.0 -> sin cambio
    assert.equal(r.streak.streak_days, 0);
    assert.equal(r.streak.multiplier, 1);
    assert.equal(r.idempotent, false);
    assert.ok(r.engine_version.indexOf("NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL") === 0);
    assert.equal(db.tables.action_logs[0].provenance.gamification.event_dvg_hours, 1.4);
    assert.equal(db.auditLog.length, 1);
    assert.equal(db.auditLog[0].action, "gamification.calculateAction");
  });

  test("calculateAction: pending action_log -> DATA_INTEGRITY_ERROR, no DVG", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedActionLog(db, { status: "pending" });
    const svc = sb.createGamificationService(db.deps);
    try {
      svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "DATA_INTEGRITY_ERROR");
    }
    assert.equal(db.tables.action_logs[0].provenance.gamification, undefined);
  });

  test("calculateAction: rejected action_log -> DATA_INTEGRITY_ERROR, no DVG", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedActionLog(db, { status: "rejected" });
    const svc = sb.createGamificationService(db.deps);
    try {
      svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "DATA_INTEGRITY_ERROR");
    }
  });

  test("calculateAction: missing action_log -> NOT_FOUND", () => {
    const db = makeFakeDb();
    const svc = sb.createGamificationService(db.deps);
    try {
      svc.calculateAction({ action_log_id: "99999999-9999-9999-9999-999999999999" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });

  test("calculateAction: snapshot no longer matches canonical catalog -> DATA_INTEGRITY_ERROR, base_dvg_hours never recalculated", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db, { levels: [{ level: "Inicial", base_dvg_hours: 999 }] }); // catalogo ahora dice 999, snapshot dice 1.4
    seedActionLog(db);
    const svc = sb.createGamificationService(db.deps);
    try {
      svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "DATA_INTEGRITY_ERROR");
    }
  });

  test("calculateAction: level_variant absent from canonical catalog -> DATA_INTEGRITY_ERROR", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db, { levels: [{ level: "Bronce", base_dvg_hours: 2.1 }] }); // no Inicial
    seedActionLog(db);
    const svc = sb.createGamificationService(db.deps);
    try {
      svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "DATA_INTEGRITY_ERROR");
    }
  });

  test("calculateAction: legacy level_multiplier (Inicial=0.9) is NEVER applied -- excluido por decision de gobernanza", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedEvidence(db);
    seedActionLog(db);
    const svc = sb.createGamificationService(db.deps);
    const r = svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
    assert.equal(r.event_dvg_hours, 1.4); // NO 1.4*0.9=1.26 -- el multiplicador legacy esta excluido
  });

  test("calculateAction: repeat call is idempotent -- same result, no duplicate write, cached", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedEvidence(db);
    seedActionLog(db);
    const svc = sb.createGamificationService(db.deps);
    const r1 = svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
    const r2 = svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
    assert.equal(r1.idempotent, false);
    assert.equal(r2.idempotent, true);
    assert.equal(r1.event_dvg_hours, r2.event_dvg_hours);
    assert.equal(db.auditLog.length, 1); // el retry idempotente no vuelve a auditar
  });

  test("calculateAction: daily streak of 2 prior consecutive days in the same domain -> multiplier=1.04", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedEvidence(db);
    db.tables.action_logs.push(
      { id: "d1111111-1111-1111-1111-111111111111", client_id: CLIENT_ID, canonical_action_id: CARDIO_ACTION_ID, status: "validated", occurred_at: "2026-08-19T10:00:00.000Z", base_dvg_hours: 1.4, provenance: {} },
      { id: "d2222222-2222-2222-2222-222222222222", client_id: CLIENT_ID, canonical_action_id: CARDIO_ACTION_ID, status: "validated", occurred_at: "2026-08-20T10:00:00.000Z", base_dvg_hours: 1.4, provenance: {} }
    );
    seedActionLog(db, { occurred_at: "2026-08-21T10:00:00.000Z" }); // 3er dia consecutivo
    const svc = sb.createGamificationService(db.deps);
    const r = svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
    assert.equal(r.streak.streak_days, 2);
    assert.equal(Math.round(r.streak.multiplier * 100) / 100, 1.04); // min(1+0.02*2, 1.2) = 1.04
    assert.equal(r.event_dvg_hours, Math.round(1.4 * 1.04 * 10000) / 10000);
  });

  test("calculateAction: streak from a DIFFERENT domain does not count", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db, { id: CARDIO_ACTION_ID, domain: "movement" });
    seedCanonicalAction(db, { id: STRESS_ACTION_ID, domain: "mind", levels: [{ level: "Inicial", base_dvg_hours: 1.0 }] });
    seedEvidence(db);
    db.tables.action_logs.push({ id: "0d0d0d0d-0d0d-0d0d-0d0d-0d0d0d0d0d0d", client_id: CLIENT_ID, canonical_action_id: STRESS_ACTION_ID, status: "validated", occurred_at: "2026-08-20T10:00:00.000Z", base_dvg_hours: 1.0, provenance: {} });
    seedActionLog(db, { occurred_at: "2026-08-21T10:00:00.000Z" });
    const svc = sb.createGamificationService(db.deps);
    const r = svc.calculateAction({ action_log_id: "11111111-1111-1111-1111-111111111111" }, CTX);
    assert.equal(r.streak.streak_days, 0);
  });

  // ── gamification.recalculateDay ──

  test("recalculateDay: no validated logs that day -> empty result, no upsert", () => {
    const db = makeFakeDb();
    const svc = sb.createGamificationService(db.deps);
    const r = svc.recalculateDay({ client_id: CLIENT_ID, date: "2026-08-21" }, CTX);
    assert.deepEqual(r.pillars, []);
    assert.equal(r.total_dvg_hours, 0);
    assert.equal(db.tables.daily_progress.length, 0);
  });

  test("recalculateDay: single validated log -> daily_progress + client_progress derived correctly", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedEvidence(db, { pillar: "exercise" });
    seedActionLog(db);
    const svc = sb.createGamificationService(db.deps);
    const r = svc.recalculateDay({ client_id: CLIENT_ID, date: "2026-08-21" }, CTX);
    assert.deepEqual(r.pillars, ["exercise"]);
    assert.equal(r.total_dvg_hours, 1.4);
    assert.equal(r.action_logs_processed, 1);

    const dp = db.tables.daily_progress[0];
    assert.equal(dp.pillar, "exercise");
    assert.equal(dp.action_count, 1);
    assert.equal(dp.base_dvg_hours, 1.4);
    assert.equal(dp.final_dvg_hours, 1.4);

    const cp = db.tables.client_progress[0];
    assert.equal(cp.total_dvg_hours, 1.4);
    assert.equal(cp.pillar_progress.exercise, 1.4);
    assert.equal(cp.pillar_progress.nutrition, 0);
    assert.equal(cp.current_level, null); // canon no resuelve nivel -- nunca inventado
  });

  test("recalculateDay: two actions same domain exceeding the daily cap -> proportional reduction applied", () => {
    const db = makeFakeDb();
    // domain 'mind' cap = 4.0/dia. 3 acciones de 1.5 = 4.5 > 4.0 -> escala 4/4.5.
    seedCanonicalAction(db, { id: "mind.stress.a", domain: "mind", levels: [{ level: "Inicial", base_dvg_hours: 1.5 }] });
    seedCanonicalAction(db, { id: "mind.stress.b", domain: "mind", levels: [{ level: "Inicial", base_dvg_hours: 1.5 }] });
    seedCanonicalAction(db, { id: "mind.stress.c", domain: "mind", levels: [{ level: "Inicial", base_dvg_hours: 1.5 }] });
    seedEvidence(db, { id: "ev-a", pillar: "stress" });
    seedEvidence(db, { id: "ev-b", pillar: "stress" });
    seedEvidence(db, { id: "ev-c", pillar: "stress" });
    db.tables.action_logs.push(
      { id: "aaaaaaaa-1111-1111-1111-111111111111", client_id: CLIENT_ID, canonical_action_id: "mind.stress.a", evidence_id: "ev-a", level_variant: "Inicial", occurred_at: "2026-08-21T08:00:00.000Z", base_dvg_hours: 1.5, status: "validated", provenance: {} },
      { id: "bbbbbbbb-2222-2222-2222-222222222222", client_id: CLIENT_ID, canonical_action_id: "mind.stress.b", evidence_id: "ev-b", level_variant: "Inicial", occurred_at: "2026-08-21T09:00:00.000Z", base_dvg_hours: 1.5, status: "validated", provenance: {} },
      { id: "cccccccc-3333-3333-3333-333333333333", client_id: CLIENT_ID, canonical_action_id: "mind.stress.c", evidence_id: "ev-c", level_variant: "Inicial", occurred_at: "2026-08-21T10:00:00.000Z", base_dvg_hours: 1.5, status: "validated", provenance: {} }
    );
    const svc = sb.createGamificationService(db.deps);
    const r = svc.recalculateDay({ client_id: CLIENT_ID, date: "2026-08-21" }, CTX);
    assert.equal(r.total_dvg_hours, 4); // capado a 4.0 (Mente), no 4.5
    const dp = db.tables.daily_progress.find((d) => d.pillar === "stress");
    assert.equal(dp.base_dvg_hours, 4.5); // el base_dvg_hours crudo NO se capa, solo final_dvg_hours
    assert.equal(dp.final_dvg_hours, 4);
    assert.equal(dp.calculation_trace.domain_caps.mind.scale_factor < 1, true);
  });

  test("recalculateDay: deterministic upsert -- calling twice for the same day does not duplicate rows", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedEvidence(db);
    seedActionLog(db);
    const svc = sb.createGamificationService(db.deps);
    svc.recalculateDay({ client_id: CLIENT_ID, date: "2026-08-21" }, CTX);
    svc.recalculateDay({ client_id: CLIENT_ID, date: "2026-08-21" }, CTX);
    assert.equal(db.tables.daily_progress.length, 1);
    assert.equal(db.tables.client_progress.length, 1);
  });

  test("recalculateDay: invalid date format -> VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    const svc = sb.createGamificationService(db.deps);
    try {
      svc.recalculateDay({ client_id: CLIENT_ID, date: "21-08-2026" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  // ── gamification.rebuildProgress ──

  test("rebuildProgress: reconstructs daily_progress/client_progress across multiple days from action_logs alone", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedEvidence(db, { id: "ev-1", pillar: "exercise" });
    seedEvidence(db, { id: "ev-2", pillar: "exercise" });
    db.tables.action_logs.push(
      { id: "11111111-1111-1111-1111-111111111111", client_id: CLIENT_ID, canonical_action_id: CARDIO_ACTION_ID, evidence_id: "ev-1", level_variant: "Inicial", occurred_at: "2026-08-20T10:00:00.000Z", base_dvg_hours: 1.4, status: "validated", provenance: {} },
      { id: "22222222-2222-2222-2222-222222222222", client_id: CLIENT_ID, canonical_action_id: CARDIO_ACTION_ID, evidence_id: "ev-2", level_variant: "Inicial", occurred_at: "2026-08-21T10:00:00.000Z", base_dvg_hours: 1.4, status: "validated", provenance: {} }
    );
    const svc = sb.createGamificationService(db.deps);
    const r = svc.rebuildProgress({ client_id: CLIENT_ID }, CTX);
    assert.deepEqual(r.dates_processed, ["2026-08-20", "2026-08-21"]);
    assert.equal(db.tables.daily_progress.length, 2);
    assert.equal(db.tables.client_progress.length, 1);
    assert.ok(db.tables.client_progress[0].total_dvg_hours > 0);
  });

  test("rebuildProgress: ignores stale projections -- rebuild from action_logs alone yields the same equivalent result", () => {
    const db = makeFakeDb();
    seedCanonicalAction(db);
    seedEvidence(db);
    seedActionLog(db);
    const svc = sb.createGamificationService(db.deps);
    const first = svc.recalculateDay({ client_id: CLIENT_ID, date: "2026-08-21" }, CTX);
    // Corromper la proyeccion manualmente -- rebuildProgress NUNCA debe confiar en ella.
    db.tables.client_progress[0].total_dvg_hours = 999;
    db.tables.daily_progress[0].final_dvg_hours = 999;
    const rebuilt = svc.rebuildProgress({ client_id: CLIENT_ID }, CTX);
    assert.equal(rebuilt.total_dvg_hours, first.total_dvg_hours); // reconstruido = resultado real, no el corrupto
    assert.equal(db.tables.daily_progress[0].final_dvg_hours, first.total_dvg_hours);
  });

  test("rebuildProgress: missing client_id -> VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    const svc = sb.createGamificationService(db.deps);
    try {
      svc.rebuildProgress({}, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });
}
