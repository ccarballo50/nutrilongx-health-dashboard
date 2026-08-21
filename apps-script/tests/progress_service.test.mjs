// apps-script/tests/progress_service.test.mjs
//
// Tests de ProgressService.gs (Fase 2D / MVP Gamification Minimal v1) con
// dependencias FAKE (sin Supabase real). Lecturas puras -- nunca escribe.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Response.gs", "Validation.gs", "SupabaseClient.gs", "ProgressService.gs"]);

const CLIENT_ID = "88888888-1111-1111-1111-111111111111";
const UNKNOWN_CLIENT_ID = "99999999-9999-9999-9999-999999999999";

function makeFakeDb() {
  const tables = { client_progress: [], daily_progress: [] };

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
        return rv < val;
      });
    }
    return out.map((r) => ({ ...r }));
  }

  const deps = { sbSelect: (table, qs) => applyFilters(tables[table] || [], qs) };
  return { deps, tables };
}

export function run() {
  // ── progress.get ──

  test("progress.get: client with no progress yet returns a zero state, not an error", () => {
    const db = makeFakeDb();
    const svc = sb.createProgressService(db.deps);
    const r = svc.get({ client_id: UNKNOWN_CLIENT_ID });
    assert.equal(r.total_dvg_hours, 0);
    assert.equal(r.total_dvg_days, 0);
    assert.equal(r.current_level, null);
    assert.equal(r.updated_at, null);
    assert.deepEqual(r.by_pillar, { nutrition: 0, exercise: 0, sleep: 0, stress: 0, conscious_wellbeing: 0 });
  });

  test("progress.get: returns the real projection, zero-filling pillars absent from pillar_progress", () => {
    const db = makeFakeDb();
    db.tables.client_progress.push({
      client_id: CLIENT_ID, total_dvg_hours: 3.4, total_dvg_days: 0.14, current_level: null,
      pillar_progress: { nutrition: 1.4, exercise: 2.0 }, calculated_at: "2026-08-21T12:00:00.000Z",
    });
    const svc = sb.createProgressService(db.deps);
    const r = svc.get({ client_id: CLIENT_ID });
    assert.equal(r.total_dvg_hours, 3.4);
    assert.deepEqual(r.by_pillar, { nutrition: 1.4, exercise: 2.0, sleep: 0, stress: 0, conscious_wellbeing: 0 });
    assert.equal(r.updated_at, "2026-08-21T12:00:00.000Z");
  });

  test("progress.get: rejects unexpected fields", () => {
    const db = makeFakeDb();
    const svc = sb.createProgressService(db.deps);
    try {
      svc.get({ client_id: CLIENT_ID, level: "attacker-supplied" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("progress.get: invalid client_id UUID -> VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    const svc = sb.createProgressService(db.deps);
    try {
      svc.get({ client_id: "not-a-uuid" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  // ── progress.getDaily ──

  test("progress.getDaily: returns rows for the client, filtered by from/to", () => {
    const db = makeFakeDb();
    db.tables.daily_progress.push(
      { id: "d1", client_id: CLIENT_ID, date: "2026-08-19", pillar: "exercise", action_count: 1, base_dvg_hours: 1.4, final_dvg_hours: 1.4 },
      { id: "d2", client_id: CLIENT_ID, date: "2026-08-21", pillar: "exercise", action_count: 1, base_dvg_hours: 1.4, final_dvg_hours: 1.4 }
    );
    const svc = sb.createProgressService(db.deps);
    const r = svc.getDaily({ client_id: CLIENT_ID, from: "2026-08-20", to: "2026-08-22" });
    assert.equal(r.count, 1);
    assert.equal(r.daily_progress[0].date, "2026-08-21");
  });

  test("progress.getDaily: no SQL arbitrario -- rejects unexpected fields", () => {
    const db = makeFakeDb();
    const svc = sb.createProgressService(db.deps);
    try {
      svc.getDaily({ client_id: CLIENT_ID, where: "1=1" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("progress.getDaily: invalid from date format -> VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    const svc = sb.createProgressService(db.deps);
    try {
      svc.getDaily({ client_id: CLIENT_ID, from: "not-a-date" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  // ── progress.getPillar ──

  test("progress.getPillar: returns rows for the client+pillar", () => {
    const db = makeFakeDb();
    db.tables.daily_progress.push(
      { id: "d1", client_id: CLIENT_ID, date: "2026-08-21", pillar: "exercise", action_count: 1, base_dvg_hours: 1.4, final_dvg_hours: 1.4 },
      { id: "d2", client_id: CLIENT_ID, date: "2026-08-21", pillar: "sleep", action_count: 1, base_dvg_hours: 1.3, final_dvg_hours: 1.3 }
    );
    const svc = sb.createProgressService(db.deps);
    const r = svc.getPillar({ client_id: CLIENT_ID, pillar: "exercise" });
    assert.equal(r.count, 1);
    assert.equal(r.daily_progress[0].pillar, "exercise");
  });

  test("progress.getPillar: rejects the legacy 'mind' alias explicitly", () => {
    const db = makeFakeDb();
    const svc = sb.createProgressService(db.deps);
    try {
      svc.getPillar({ client_id: CLIENT_ID, pillar: "mind" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("progress.getPillar: rejects an invalid pillar enum value", () => {
    const db = makeFakeDb();
    const svc = sb.createProgressService(db.deps);
    try {
      svc.getPillar({ client_id: CLIENT_ID, pillar: "not_a_pillar" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("progress.getPillar: accepts all 5 real dashboard pillars", () => {
    const db = makeFakeDb();
    const svc = sb.createProgressService(db.deps);
    ["nutrition", "exercise", "sleep", "stress", "conscious_wellbeing"].forEach((p) => {
      const r = svc.getPillar({ client_id: CLIENT_ID, pillar: p });
      assert.equal(r.count, 0);
    });
  });
}
