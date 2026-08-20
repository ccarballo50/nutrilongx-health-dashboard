// apps-script/tests/content_service.test.mjs
//
// Tests de ContentService.gs con dependencias FAKE (sin Supabase real).
// Simula content_registry/recipes/mind_content/client_content_assignments
// en memoria.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Response.gs", "Validation.gs", "SupabaseClient.gs", "ContentService.gs"]);

// client_id/assignment_id pasan por requireUuid() -- los fixtures deben
// usar forma UUID real.
const CLIENT_ID = "22222222-2222-2222-2222-222222222222";
const UNKNOWN_CLIENT_ID = "99999999-9999-9999-9999-999999999999";

function makeFakeDb() {
  const tables = {
    clients: [],
    content_registry: [],
    recipes: [],
    exercises: [],
    mind_content: [],
    client_content_assignments: [],
  };
  const auditLog = [];
  let seq = 0;
  function uuid() {
    seq += 1;
    var hex = String(seq).padStart(12, "0");
    return "33333333-3333-3333-3333-" + hex;
  }

  function applyFilters(rows, qs) {
    const eqMatches = [...qs.matchAll(/([a-zA-Z_]+)=eq\.([^&]+)/g)].map((m) => [m[1], decodeURIComponent(m[2])]);
    let out = rows;
    for (const [k, v] of eqMatches) out = out.filter((r) => String(r[k]) === v);
    const inMatch = qs.match(/status=in\.\(([^)]+)\)/);
    if (inMatch) {
      const allowed = inMatch[1].split(",");
      out = out.filter((r) => allowed.indexOf(r.status) !== -1);
    }
    return out.map((r) => ({ ...r }));
  }

  const deps = {
    sbSelect: (table, qs) => applyFilters(tables[table] || [], qs),
    sbInsert: (table, rows) => {
      const inserted = rows.map((r) => ({ id: uuid(), created_at: "2026-08-20T00:00:00.000Z", updated_at: "2026-08-20T00:00:00.000Z", assigned_at: "2026-08-20T00:00:00.000Z", ...r }));
      tables[table].push(...inserted);
      return inserted;
    },
    sbUpdate: (table, qs, patch) => {
      const idMatch = qs.match(/id=eq\.([^&]+)/);
      const id = idMatch && decodeURIComponent(idMatch[1]);
      const idx = tables[table].findIndex((r) => r.id === id);
      if (idx === -1) return [];
      tables[table][idx] = { ...tables[table][idx], ...patch };
      return [{ ...tables[table][idx] }];
    },
    writeAudit: (entry) => {
      auditLog.push(entry);
      return entry;
    },
  };

  return { deps, tables, auditLog, uuid };
}

const CTX = { requestId: "req-1", actorType: "professional", actorId: "prof-1" };

export function run() {
  test("content.getRecipe returns CANONICAL_REFERENCE_NOT_FOUND for unknown id", () => {
    const db = makeFakeDb();
    const svc = sb.createContentService(db.deps);
    try {
      svc.getRecipe({ canonical_id: "NLX-999" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "CANONICAL_REFERENCE_NOT_FOUND");
    }
  });

  test("content.getRecipe returns the full record when found", () => {
    const db = makeFakeDb();
    db.tables.recipes.push({ id: "r1", canonical_id: "NLX-001", title: "Bowl", data: { foo: "bar" } });
    const svc = sb.createContentService(db.deps);
    const r = svc.getRecipe({ canonical_id: "NLX-001" });
    assert.equal(r.recipe.title, "Bowl");
  });

  test("content.listMind rejects a legacy pillar alias", () => {
    const db = makeFakeDb();
    const svc = sb.createContentService(db.deps);
    try {
      svc.listMind({ pillar: "Sueño" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
    try {
      svc.listMind({ pillar: "mind" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("content.listMind accepts sleep/stress/conscious_wellbeing", () => {
    const db = makeFakeDb();
    db.tables.mind_content.push({ id: "m1", pillar: "sleep", content_type: "challenge", canonical_id: "mind.sleep.challenge.x", title: "X" });
    const svc = sb.createContentService(db.deps);
    const r = svc.listMind({ pillar: "sleep" });
    assert.equal(r.count, 1);
  });

  test("content.assign resolves content_registry, derives pillar server-side, creates exactly one assignment", () => {
    const db = makeFakeDb();
    db.tables.clients.push({ id: CLIENT_ID, status: "active" });
    db.tables.content_registry.push({ id: "reg1", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true });
    const svc = sb.createContentService(db.deps);
    const r = svc.assign({ client_id: CLIENT_ID, content_type: "recipe", canonical_id: "NLX-001" }, CTX);
    assert.equal(r.idempotent, false);
    assert.equal(r.assignment.pillar, "nutrition"); // derivado del registry, no del payload
    assert.equal(r.assignment.status, "assigned");
    assert.equal(db.tables.client_content_assignments.length, 1);
    assert.equal(db.auditLog.length, 1);
  });

  test("content.assign is idempotent: repeated call without idempotency_key returns the existing active assignment", () => {
    const db = makeFakeDb();
    db.tables.clients.push({ id: CLIENT_ID, status: "active" });
    db.tables.content_registry.push({ id: "reg1", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true });
    const svc = sb.createContentService(db.deps);
    const first = svc.assign({ client_id: CLIENT_ID, content_type: "recipe", canonical_id: "NLX-001" }, CTX);
    const second = svc.assign({ client_id: CLIENT_ID, content_type: "recipe", canonical_id: "NLX-001" }, CTX);
    assert.equal(second.idempotent, true);
    assert.equal(second.assignment.id, first.assignment.id);
    assert.equal(db.tables.client_content_assignments.length, 1); // no duplicado
  });

  test("content.assign is idempotent via explicit idempotency_key", () => {
    const db = makeFakeDb();
    db.tables.clients.push({ id: CLIENT_ID, status: "active" });
    db.tables.content_registry.push({ id: "reg1", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true });
    const svc = sb.createContentService(db.deps);
    const first = svc.assign({ client_id: CLIENT_ID, content_type: "recipe", canonical_id: "NLX-001", options: { idempotency_key: "K1" } }, CTX);
    const second = svc.assign({ client_id: CLIENT_ID, content_type: "recipe", canonical_id: "NLX-001", options: { idempotency_key: "K1" } }, CTX);
    assert.equal(second.idempotent, true);
    assert.equal(second.assignment.id, first.assignment.id);
    assert.equal(db.tables.client_content_assignments.length, 1);
  });

  test("content.assign fails with CANONICAL_REFERENCE_NOT_FOUND for inactive/unknown content", () => {
    const db = makeFakeDb();
    db.tables.clients.push({ id: CLIENT_ID, status: "active" });
    const svc = sb.createContentService(db.deps);
    try {
      svc.assign({ client_id: CLIENT_ID, content_type: "recipe", canonical_id: "NLX-DOES-NOT-EXIST" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "CANONICAL_REFERENCE_NOT_FOUND");
    }
  });

  test("content.assign fails with NOT_FOUND for unknown client", () => {
    const db = makeFakeDb();
    db.tables.content_registry.push({ id: "reg1", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true });
    const svc = sb.createContentService(db.deps);
    try {
      svc.assign({ client_id: UNKNOWN_CLIENT_ID, content_type: "recipe", canonical_id: "NLX-001" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });

  test("content.unassign cancels (does not delete) and is idempotent", () => {
    const db = makeFakeDb();
    db.tables.clients.push({ id: CLIENT_ID, status: "active" });
    db.tables.content_registry.push({ id: "reg1", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true });
    const svc = sb.createContentService(db.deps);
    const assigned = svc.assign({ client_id: CLIENT_ID, content_type: "recipe", canonical_id: "NLX-001" }, CTX).assignment;

    const r1 = svc.unassign({ assignment_id: assigned.id, reason: "test" }, CTX);
    assert.equal(r1.assignment.status, "cancelled");
    assert.equal(db.tables.client_content_assignments.length, 1); // sigue existiendo, no se borra

    const r2 = svc.unassign({ assignment_id: assigned.id }, CTX);
    assert.equal(r2.changed, false); // ya estaba cancelada, idempotente
  });

  test("content.listAssignments filters by client_id and status", () => {
    const db = makeFakeDb();
    db.tables.clients.push({ id: CLIENT_ID, status: "active" });
    db.tables.content_registry.push({ id: "reg1", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true });
    const svc = sb.createContentService(db.deps);
    svc.assign({ client_id: CLIENT_ID, content_type: "recipe", canonical_id: "NLX-001" }, CTX);
    const r = svc.listAssignments({ client_id: CLIENT_ID, status: "assigned" });
    assert.equal(r.count, 1);
  });
}
