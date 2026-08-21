// apps-script/tests/evidence_service.test.mjs
//
// Tests de EvidenceService.gs (Fase 2B) con dependencias FAKE (sin
// Supabase real). Simula clients/content_registry/execution_evidence en
// memoria. Mismo patron que content_service.test.mjs.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Response.gs", "Validation.gs", "SupabaseClient.gs", "EvidenceService.gs"]);

const CLIENT_ID = "22222222-2222-2222-2222-222222222222";
const UNKNOWN_CLIENT_ID = "99999999-9999-9999-9999-999999999999";
const CTX = { requestId: "req-1", actorType: "professional", actorId: "prof-1" };

function makeFakeDb() {
  const tables = { clients: [], content_registry: [], execution_evidence: [], canonical_actions: [] };
  const auditLog = [];
  let seq = 0;
  function uuid() {
    seq += 1;
    return "55555555-5555-5555-5555-" + String(seq).padStart(12, "0");
  }

  function applyFilters(rows, qs) {
    let out = rows;
    for (const [k, v] of [...qs.matchAll(/([a-zA-Z_]+)=eq\.([^&]+)/g)].map((m) => [m[1], decodeURIComponent(m[2])])) {
      out = out.filter((r) => String(r[k]) === v);
    }
    const gte = qs.match(/occurred_at=gte\.([^&]+)/);
    if (gte) out = out.filter((r) => r.occurred_at >= decodeURIComponent(gte[1]));
    const lte = qs.match(/occurred_at=lte\.([^&]+)/);
    if (lte) out = out.filter((r) => r.occurred_at <= decodeURIComponent(lte[1]));
    return out.map((r) => ({ ...r }));
  }

  const deps = {
    sbSelect: (table, qs) => applyFilters(tables[table] || [], qs),
    sbInsert: (table, rows) => {
      const inserted = rows.map((r) => ({ id: uuid(), created_at: "2026-08-20T00:00:00.000Z", ...r }));
      tables[table].push(...inserted);
      return inserted;
    },
    writeAudit: (entry) => {
      auditLog.push(entry);
      return entry;
    },
  };

  return { deps, tables, auditLog };
}

function seedClient(db, id) {
  db.tables.clients.push({ id: id || CLIENT_ID, status: "active" });
}

function seedRecipeRegistry(db) {
  db.tables.content_registry.push({
    id: "reg-nlx-001", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true,
  });
}

const CANONICAL_ACTION_ID = "movement.cardio.caminata_vigorosa_min";

function seedCanonicalAction(db, overrides) {
  db.tables.canonical_actions.push({ canonical_action_id: CANONICAL_ACTION_ID, is_active: true, ...overrides });
}

const VALID_PAYLOAD = () => ({
  client_id: CLIENT_ID,
  source_type: "dashboard",
  source_content: { content_type: "recipe", canonical_id: "NLX-001" },
  occurred_at: "2026-08-20T12:00:00+02:00",
  quantity: 1,
  unit: "serving",
});

export function run() {
  test("evidence.register: valid request creates evidence, derives pillar from content, audits", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedRecipeRegistry(db);
    const svc = sb.createEvidenceService(db.deps);
    const r = svc.register(VALID_PAYLOAD(), CTX);
    assert.equal(r.idempotent, false);
    assert.equal(r.evidence.pillar, "nutrition"); // derivado del content_registry, no del payload
    assert.equal(r.evidence.source_content_id, "reg-nlx-001");
    assert.equal(r.evidence.client_id, CLIENT_ID);
    assert.equal(db.tables.execution_evidence.length, 1);
    assert.equal(db.auditLog.length, 1);
    assert.equal(db.auditLog[0].action, "evidence.register");
    assert.equal(db.auditLog[0].entityType, "execution_evidence");
    assert.equal(db.auditLog[0].requestId, "req-1");
  });

  test("evidence.register: missing client returns NOT_FOUND, never creates evidence implicitly", () => {
    const db = makeFakeDb();
    seedRecipeRegistry(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({ ...VALID_PAYLOAD(), client_id: UNKNOWN_CLIENT_ID }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
    assert.equal(db.tables.execution_evidence.length, 0);
  });

  test("evidence.register: invalid client_id UUID returns VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({ ...VALID_PAYLOAD(), client_id: "not-a-uuid" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("evidence.register: invalid source_type returns VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({ ...VALID_PAYLOAD(), source_type: "carrier_pigeon" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("evidence.register: invalid occurred_at (not ISO-8601 with offset) returns VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({ ...VALID_PAYLOAD(), occurred_at: "2026-08-20" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("evidence.register: invalid pillar (bad enum) returns VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    const payload = { client_id: CLIENT_ID, source_type: "manual", occurred_at: "2026-08-20T12:00:00Z", pillar: "not-a-pillar" };
    try {
      svc.register(payload, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("evidence.register: legacy pillar alias ('mind') rejected same as content.listMind", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    const payload = { client_id: CLIENT_ID, source_type: "manual", occurred_at: "2026-08-20T12:00:00Z", pillar: "mind" };
    try {
      svc.register(payload, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("evidence.register: pillar declared in payload incompatible with content's pillar -> VALIDATION_ERROR, never silently corrected", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedRecipeRegistry(db); // pillar real = nutrition
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({ ...VALID_PAYLOAD(), pillar: "exercise" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
      assert.equal(e.details.derived_from_content, "nutrition");
    }
    assert.equal(db.tables.execution_evidence.length, 0);
  });

  test("evidence.register: unknown/inactive content returns CANONICAL_REFERENCE_NOT_FOUND", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register(VALID_PAYLOAD(), CTX); // sin seedRecipeRegistry: NLX-001 no existe
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "CANONICAL_REFERENCE_NOT_FOUND");
    }
  });

  test("evidence.register: evidence without content requires explicit pillar and never invents an association", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    const r = svc.register({
      client_id: CLIENT_ID, source_type: "manual", occurred_at: "2026-08-20T12:00:00Z", pillar: "sleep",
    }, CTX);
    assert.equal(r.evidence.pillar, "sleep");
    assert.equal(r.evidence.source_content_id, null);
  });

  test("evidence.register: evidence without content AND without pillar returns VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({ client_id: CLIENT_ID, source_type: "manual", occurred_at: "2026-08-20T12:00:00Z" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  // ── MVP Accreditation Pack v1 — source_entity_type/source_entity_id ──

  test("evidence.register: source_entity_type=canonical_action + valid source_entity_id creates evidence with no source_content_id", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedCanonicalAction(db);
    const svc = sb.createEvidenceService(db.deps);
    const r = svc.register({
      client_id: CLIENT_ID, source_type: "dashboard", occurred_at: "2026-08-20T12:00:00+02:00",
      source_entity_type: "canonical_action", source_entity_id: CANONICAL_ACTION_ID,
      pillar: "exercise", duration_minutes: 20,
    }, CTX);
    assert.equal(r.evidence.source_content_id, null);
    assert.equal(r.evidence.source_entity_type, "canonical_action");
    assert.equal(r.evidence.source_entity_id, CANONICAL_ACTION_ID);
    assert.equal(r.evidence.pillar, "exercise"); // no hay content_registry que lo derive -- explicito como evidencia independiente
  });

  test("evidence.register: source_entity_id referencing an unknown/inactive canonical action returns CANONICAL_REFERENCE_NOT_FOUND", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({
        client_id: CLIENT_ID, source_type: "dashboard", occurred_at: "2026-08-20T12:00:00+02:00",
        source_entity_type: "canonical_action", source_entity_id: "does.not.exist", pillar: "exercise",
      }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "CANONICAL_REFERENCE_NOT_FOUND");
    }
  });

  test("evidence.register: source_entity_type without source_entity_id (or vice versa) returns VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedCanonicalAction(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({
        client_id: CLIENT_ID, source_type: "dashboard", occurred_at: "2026-08-20T12:00:00+02:00",
        source_entity_type: "canonical_action", pillar: "exercise",
      }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("evidence.register: source_entity_type combined with source_content returns VALIDATION_ERROR (mutually exclusive)", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedRecipeRegistry(db);
    seedCanonicalAction(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({
        ...VALID_PAYLOAD(), source_entity_type: "canonical_action", source_entity_id: CANONICAL_ACTION_ID,
      }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("evidence.register: two different source_entity_id at the same minute/quantity do NOT collide in deduplication", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedCanonicalAction(db, { canonical_action_id: "movement.cardio.caminata_vigorosa_min" });
    seedCanonicalAction(db, { canonical_action_id: "mind.stress.musica_relajante_min" });
    const svc = sb.createEvidenceService(db.deps);
    svc.register({
      client_id: CLIENT_ID, source_type: "dashboard", occurred_at: "2026-08-20T12:00:00Z",
      source_entity_type: "canonical_action", source_entity_id: "movement.cardio.caminata_vigorosa_min",
      pillar: "exercise", duration_minutes: 20,
    }, CTX);
    svc.register({
      client_id: CLIENT_ID, source_type: "dashboard", occurred_at: "2026-08-20T12:00:00Z",
      source_entity_type: "canonical_action", source_entity_id: "mind.stress.musica_relajante_min",
      pillar: "stress", duration_minutes: 20,
    }, CTX);
    assert.equal(db.tables.execution_evidence.length, 2); // distintas acciones, misma forma -- no deben deduplicarse entre si
  });

  test("evidence.register: idempotent retry via idempotency_key returns same evidence, no duplicate row/audit", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedRecipeRegistry(db);
    const svc = sb.createEvidenceService(db.deps);
    const payload = { ...VALID_PAYLOAD(), idempotency_key: "K-1" };
    const first = svc.register(payload, CTX);
    const second = svc.register(payload, CTX);
    assert.equal(first.idempotent, false);
    assert.equal(second.idempotent, true);
    assert.equal(second.evidence.id, first.evidence.id);
    assert.equal(db.tables.execution_evidence.length, 1);
    assert.equal(db.auditLog.length, 1); // el retry idempotente no genera un segundo evento de audit
  });

  test("evidence.register: logical duplicate (same identity, different/absent idempotency_key) does not create a second row", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedRecipeRegistry(db);
    const svc = sb.createEvidenceService(db.deps);
    const first = svc.register(VALID_PAYLOAD(), CTX); // sin idempotency_key
    const second = svc.register({ ...VALID_PAYLOAD(), idempotency_key: "different-transport-key" }, CTX);
    assert.equal(second.idempotent, true);
    assert.equal(second.evidence.id, first.evidence.id);
    assert.equal(db.tables.execution_evidence.length, 1);
    assert.equal(db.auditLog.length, 1);
  });

  test("evidence.register: different occurred_at (distinct minute) is NOT deduplicated -- genuinely new evidence", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedRecipeRegistry(db);
    const svc = sb.createEvidenceService(db.deps);
    svc.register(VALID_PAYLOAD(), CTX);
    svc.register({ ...VALID_PAYLOAD(), occurred_at: "2026-08-21T12:00:00+02:00" }, CTX);
    assert.equal(db.tables.execution_evidence.length, 2);
  });

  test("evidence.register: rejects unexpected top-level fields", () => {
    const db = makeFakeDb();
    seedClient(db);
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.register({ ...VALID_PAYLOAD(), deduplication_key: "attacker-supplied" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("evidence.list: filters by client_id, pillar, source_type and occurred_at range", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedRecipeRegistry(db);
    const svc = sb.createEvidenceService(db.deps);
    svc.register(VALID_PAYLOAD(), CTX); // 2026-08-20, nutrition, dashboard
    svc.register({ client_id: CLIENT_ID, source_type: "manual", occurred_at: "2026-09-01T08:00:00Z", pillar: "sleep" }, CTX);

    assert.equal(svc.list({ client_id: CLIENT_ID }).count, 2);
    assert.equal(svc.list({ client_id: CLIENT_ID, pillar: "sleep" }).count, 1);
    assert.equal(svc.list({ client_id: CLIENT_ID, source_type: "dashboard" }).count, 1);
    assert.equal(svc.list({ client_id: CLIENT_ID, from: "2026-08-25T00:00:00Z" }).count, 1);
    assert.equal(svc.list({ client_id: UNKNOWN_CLIENT_ID }).count, 0);
  });

  test("evidence.get: returns the record when found", () => {
    const db = makeFakeDb();
    seedClient(db);
    seedRecipeRegistry(db);
    const svc = sb.createEvidenceService(db.deps);
    const created = svc.register(VALID_PAYLOAD(), CTX).evidence;
    const r = svc.get({ evidence_id: created.id });
    assert.equal(r.evidence.id, created.id);
    assert.equal(r.evidence.pillar, "nutrition");
  });

  test("evidence.get: returns NOT_FOUND for unknown evidence_id, never raw PostgREST", () => {
    const db = makeFakeDb();
    const svc = sb.createEvidenceService(db.deps);
    try {
      svc.get({ evidence_id: "88888888-8888-8888-8888-888888888888" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });
}
