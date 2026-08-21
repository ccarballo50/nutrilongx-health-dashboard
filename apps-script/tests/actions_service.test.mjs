// apps-script/tests/actions_service.test.mjs
//
// Tests de ActionsService.gs (Fase 2C) con dependencias FAKE (sin Supabase
// real). Simula canonical_actions/content_registry/content_action_bindings/
// action_accreditation_rules/execution_evidence/action_logs en memoria.
// Mismo patron que content_service.test.mjs/evidence_service.test.mjs.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Response.gs", "Validation.gs", "SupabaseClient.gs", "ActionsService.gs"]);

const EVIDENCE_ID = "66666666-6666-6666-6666-666666666666";
const UNKNOWN_EVIDENCE_ID = "77777777-7777-7777-7777-777777777777";
const CTX = { requestId: "req-1", actorType: "professional", actorId: "prof-1" };
const ACTION_ID = "nutrition.mediterranean_pattern.legumbres_veces_sem";
const ACTION_ID_2 = "adherence.nutrition.batch_cooking_saludable_h_sem";

function makeFakeDb() {
  const tables = {
    canonical_actions: [],
    content_action_bindings: [],
    action_accreditation_rules: [],
    execution_evidence: [],
    action_logs: [],
  };
  const auditLog = [];

  function applyFilters(rows, qs) {
    let out = rows;
    for (const [k, v] of [...qs.matchAll(/([a-zA-Z_]+)=eq\.([^&]+)/g)].map((m) => [m[1], decodeURIComponent(m[2])])) {
      out = out.filter((r) => String(r[k]) === v);
    }
    return out.map((r) => ({ ...r }));
  }

  const deps = {
    sbSelect: (table, qs) => applyFilters(tables[table] || [], qs),
    sbInsert: (table, rows) => {
      const inserted = rows.map((r) => ({ id: "gen-" + Math.random().toString(36).slice(2), created_at: "2026-08-21T00:00:00.000Z", ...r }));
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

function seedEvidence(db, overrides) {
  db.tables.execution_evidence.push({ id: EVIDENCE_ID, client_id: "88888888-1111-1111-1111-111111111111", pillar: "nutrition", source_type: "dashboard", source_content_id: null, ...overrides });
}

export function run() {
  test("actions.list returns canonical actions", () => {
    const db = makeFakeDb();
    db.tables.canonical_actions.push({ id: "a1", canonical_action_id: ACTION_ID, domain: "nutrition", subdomain: "mediterranean_pattern", is_active: true, data: {} });
    const svc = sb.createActionsService(db.deps);
    const r = svc.list({});
    assert.equal(r.count, 1);
    assert.equal(r.actions[0].canonical_action_id, ACTION_ID);
  });

  test("actions.list filters by domain and is_active", () => {
    const db = makeFakeDb();
    db.tables.canonical_actions.push({ id: "a1", canonical_action_id: ACTION_ID, domain: "nutrition", is_active: true, data: {} });
    db.tables.canonical_actions.push({ id: "a2", canonical_action_id: "movement.x", domain: "movement", is_active: true, data: {} });
    const svc = sb.createActionsService(db.deps);
    assert.equal(svc.list({ domain: "movement" }).count, 1);
  });

  test("actions.get returns the full record", () => {
    const db = makeFakeDb();
    db.tables.canonical_actions.push({ id: "a1", canonical_action_id: ACTION_ID, domain: "nutrition", data: { level_variants: [{ id: "v1" }] } });
    const svc = sb.createActionsService(db.deps);
    const r = svc.get({ canonical_action_id: ACTION_ID });
    assert.equal(r.action.canonical_action_id, ACTION_ID);
    assert.deepEqual(r.action.data.level_variants, [{ id: "v1" }]);
  });

  test("actions.get: unknown canonical_action_id returns CANONICAL_REFERENCE_NOT_FOUND", () => {
    const db = makeFakeDb();
    const svc = sb.createActionsService(db.deps);
    try {
      svc.get({ canonical_action_id: "does.not.exist" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "CANONICAL_REFERENCE_NOT_FOUND");
    }
  });

  test("actions.accredit: missing evidence returns NOT_FOUND", () => {
    const db = makeFakeDb();
    const svc = sb.createActionsService(db.deps);
    try {
      svc.accredit({ evidence_id: UNKNOWN_EVIDENCE_ID }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });

  test("actions.accredit: evidence without content -> review_required, no action_log, never invents an association", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: null });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "pending");
    assert.equal(r.reason, "ACCREDITATION_REVIEW_REQUIRED");
    assert.equal(r.action_log_created, false);
    assert.deepEqual(r.candidate_actions, []);
    assert.equal(db.tables.action_logs.length, 0);
    assert.equal(db.auditLog.length, 1);
    assert.equal(db.auditLog[0].action, "actions.accredit");
  });

  test("actions.accredit: 'supports' binding, no accreditation rule -> review_required, no action_log", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "pending");
    assert.equal(r.candidate_actions.length, 1);
    assert.equal(r.candidate_actions[0].canonical_action_id, ACTION_ID);
    assert.equal(r.candidate_actions[0].has_accreditation_rule, false);
    assert.equal(db.tables.action_logs.length, 0);
  });

  test("actions.accredit: 'candidate' binding behaves the same as 'supports' for review-required purposes", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "candidate", status: "active" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "pending");
    assert.equal(r.candidate_actions.length, 1);
  });

  test("actions.accredit: 'contextual_opposite' binding is NEVER a positive candidate", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: "nutrition.red_meat", binding_type: "contextual_opposite", status: "active" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "pending");
    assert.deepEqual(r.candidate_actions, []); // excluido, no aparece como candidato
    assert.equal(db.tables.action_logs.length, 0);
  });

  test("actions.accredit: 'unmapped' binding is not a real candidate either", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "unmapped", status: "active" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.deepEqual(r.candidate_actions, []);
  });

  test("actions.accredit: inactive bindings are ignored entirely", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "inactive" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.deepEqual(r.candidate_actions, []);
  });

  test("actions.accredit: multiple candidate bindings -> review_required, never picks one arbitrarily", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    db.tables.content_action_bindings.push({ id: "b2", content_id: "content-1", canonical_action_id: ACTION_ID_2, binding_type: "supports", status: "active" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "pending");
    assert.equal(r.candidate_actions.length, 2);
    assert.equal(db.tables.action_logs.length, 0); // nunca crea multiples action_logs por conveniencia
  });

  test("actions.accredit: no canonical rule exists in canon (0 rows) -> review_required, matches expected current state", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    // action_accreditation_rules queda vacia -- estado real del canon hoy.
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "pending");
    assert.equal(r.candidate_actions[0].has_accreditation_rule, false);
  });

  // ── MVP Accreditation Pack v1 — rule found + evaluated (via content_binding) ──

  function seedRuleActionAndData(db, opts) {
    opts = opts || {};
    db.tables.canonical_actions.push({
      id: "ca-1", canonical_action_id: ACTION_ID, domain: "nutrition", subdomain: "mediterranean_pattern", is_active: true,
      data: { level_variants: [{ level: "Inicial", base_dvg_hours: 1.4 }, { level: "Bronce", base_dvg_hours: 2.1 }] },
    });
    db.tables.action_accreditation_rules.push({
      id: "r1", accreditation_rule_id: "RULE-1", canonical_action_id: ACTION_ID, status: "active",
      accepted_evidence_types: opts.acceptedTypes || ["dashboard"],
      required_fields: opts.requiredFields || ["duration_minutes"],
      conditions: opts.conditions !== undefined ? opts.conditions : { level_variant: "Inicial", duration_minutes: { gte: 18 } },
    });
  }

  test("actions.accredit: active rule + evidence meets conditions -> validated, action_log created with resolved base_dvg_hours", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1", duration_minutes: 20, occurred_at: "2026-08-21T10:00:00Z" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    seedRuleActionAndData(db);
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "validated");
    assert.equal(r.action_log_created, true);
    assert.equal(db.tables.action_logs.length, 1);
    const log = db.tables.action_logs[0];
    assert.equal(log.status, "validated");
    assert.equal(log.level_variant, "Inicial");
    assert.equal(log.base_dvg_hours, 1.4); // resuelto desde canonical_actions.data, nunca desde la regla
    assert.equal(log.canonical_action_id, ACTION_ID);
    assert.equal(log.accreditation_rule_id, "RULE-1");
    assert.ok(log.engine_version && log.calculation_version);
  });

  test("actions.accredit: active rule + evidence fails conditions (duration too short) -> rejected, action_log still created", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1", duration_minutes: 5, occurred_at: "2026-08-21T10:00:00Z" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    seedRuleActionAndData(db);
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "rejected");
    assert.equal(r.reason, "ACCREDITATION_REJECTED");
    assert.equal(r.action_log_created, true);
    assert.equal(db.tables.action_logs.length, 1);
    assert.equal(db.tables.action_logs[0].status, "rejected");
  });

  test("actions.accredit: active rule + evidence missing a required_field -> rejected", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1", duration_minutes: null, occurred_at: "2026-08-21T10:00:00Z" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    seedRuleActionAndData(db);
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "rejected");
  });

  test("actions.accredit: active rule + evidence source_type not in accepted_evidence_types -> rejected", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1", duration_minutes: 20, source_type: "wearable", occurred_at: "2026-08-21T10:00:00Z" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    seedRuleActionAndData(db, { acceptedTypes: ["dashboard"] });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "rejected");
  });

  test("actions.accredit: active rule without conditions.level_variant -> DATA_INTEGRITY_ERROR, never invents a level", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1", duration_minutes: 20, occurred_at: "2026-08-21T10:00:00Z" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    seedRuleActionAndData(db, { conditions: { duration_minutes: { gte: 18 } } }); // sin level_variant
    const svc = sb.createActionsService(db.deps);
    try {
      svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "DATA_INTEGRITY_ERROR");
    }
  });

  test("actions.accredit: rule references a level_variant absent from the canonical catalog -> DATA_INTEGRITY_ERROR, no fallback", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1", duration_minutes: 20, occurred_at: "2026-08-21T10:00:00Z" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    seedRuleActionAndData(db, { conditions: { level_variant: "Platino", duration_minutes: { gte: 18 } } }); // catalogo solo tiene Inicial/Bronce
    const svc = sb.createActionsService(db.deps);
    try {
      svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "DATA_INTEGRITY_ERROR");
    }
  });

  test("actions.accredit: repeat call with the SAME evidence_id is idempotent (no second action_log)", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1", duration_minutes: 20, occurred_at: "2026-08-21T10:00:00Z" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    seedRuleActionAndData(db);
    const svc = sb.createActionsService(db.deps);
    const r1 = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    const r2 = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r1.status, "validated");
    assert.equal(r2.status, "validated");
    assert.equal(r2.action_log_created, false);
    assert.equal(r2.idempotent, true);
    assert.equal(r1.action_log_id, r2.action_log_id);
    assert.equal(db.tables.action_logs.length, 1);
  });

  test("actions.accredit: max_occurrences=1/day -- a DIFFERENT evidence for the same client+action+day does not create a second validated row", () => {
    const db = makeFakeDb();
    const evidence2Id = "66666666-6666-6666-6666-666666666667";
    seedEvidence(db, { source_content_id: "content-1", duration_minutes: 20, occurred_at: "2026-08-21T10:00:00Z" });
    db.tables.execution_evidence.push({ id: evidence2Id, client_id: "88888888-1111-1111-1111-111111111111", pillar: "nutrition", source_type: "dashboard", source_content_id: "content-1", duration_minutes: 25, occurred_at: "2026-08-21T18:00:00Z" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    seedRuleActionAndData(db);
    const svc = sb.createActionsService(db.deps);
    const r1 = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    const r2 = svc.accredit({ evidence_id: evidence2Id }, CTX);
    assert.equal(r1.status, "validated");
    assert.equal(r2.status, "validated"); // refleja el cap, no un rechazo
    assert.equal(r2.action_log_created, false);
    assert.equal(r2.idempotent, true);
    assert.equal(db.tables.action_logs.length, 1); // nunca una segunda fila validated el mismo dia
  });

  test("actions.accredit: multiple active rules for the same canonical action -> review_required, ambiguous, never picked arbitrarily", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    db.tables.action_accreditation_rules.push({ id: "r1", accreditation_rule_id: "RULE-1", canonical_action_id: ACTION_ID, status: "active" });
    db.tables.action_accreditation_rules.push({ id: "r2", accreditation_rule_id: "RULE-2", canonical_action_id: ACTION_ID, status: "active" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "pending");
    assert.equal(db.tables.action_logs.length, 0);
  });

  // ── source_entity_id resolution path (evidencia sin content_action_binding) ──

  test("actions.accredit: source_entity_type=canonical_action resolves to exactly 1 candidate and validates", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: null, source_entity_type: "canonical_action", source_entity_id: ACTION_ID, duration_minutes: 20, occurred_at: "2026-08-21T10:00:00Z", pillar: "nutrition" });
    seedRuleActionAndData(db);
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "validated");
    assert.equal(r.action_log_created, true);
    assert.equal(db.tables.action_logs[0].canonical_action_id, ACTION_ID);
  });

  test("actions.accredit: source_entity_id for a canonical action with no active rule -> review_required, no action_log", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: null, source_entity_type: "canonical_action", source_entity_id: "movement.some_action_without_rule", duration_minutes: 20 });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.status, "pending");
    assert.equal(r.candidate_actions[0].canonical_action_id, "movement.some_action_without_rule");
    assert.equal(db.tables.action_logs.length, 0);
  });

  test("actions.accredit: inactive accreditation rules are not counted as available", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    db.tables.action_accreditation_rules.push({ id: "r1", accreditation_rule_id: "RULE-1", canonical_action_id: ACTION_ID, status: "review_required" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(r.candidate_actions[0].has_accreditation_rule, false);
  });

  test("actions.accredit: invalid evidence_id UUID returns VALIDATION_ERROR", () => {
    const db = makeFakeDb();
    const svc = sb.createActionsService(db.deps);
    try {
      svc.accredit({ evidence_id: "not-a-uuid" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("actions.accredit: rejects unexpected top-level fields", () => {
    const db = makeFakeDb();
    const svc = sb.createActionsService(db.deps);
    try {
      svc.accredit({ evidence_id: EVIDENCE_ID, canonical_action_id: "attacker-supplied" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("actions.accredit: repeated call is naturally idempotent (read-only, never inserts, no dedup key needed)", () => {
    const db = makeFakeDb();
    seedEvidence(db, { source_content_id: "content-1" });
    db.tables.content_action_bindings.push({ id: "b1", content_id: "content-1", canonical_action_id: ACTION_ID, binding_type: "supports", status: "active" });
    const svc = sb.createActionsService(db.deps);
    svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    svc.accredit({ evidence_id: EVIDENCE_ID }, CTX);
    assert.equal(db.tables.action_logs.length, 0);
    assert.equal(db.auditLog.length, 2); // cada intento se audita (no hay retry idempotente que suprimir)
  });

  test("actions.listLogs: filters by client_id/status/canonical_action_id (empty in current canon)", () => {
    const db = makeFakeDb();
    const svc = sb.createActionsService(db.deps);
    const r = svc.listLogs({ client_id: "88888888-1111-1111-1111-111111111111", status: "validated" });
    assert.equal(r.count, 0);
    assert.deepEqual(r.action_logs, []);
  });

  test("actions.listLogs: returns rows when present (defensive/future-ready path)", () => {
    const db = makeFakeDb();
    db.tables.action_logs.push({ id: "99999999-2222-2222-2222-222222222222", client_id: "88888888-1111-1111-1111-111111111111", canonical_action_id: ACTION_ID, status: "validated", occurred_at: "2026-08-21T00:00:00Z" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.listLogs({ client_id: "88888888-1111-1111-1111-111111111111" });
    assert.equal(r.count, 1);
  });

  test("actions.getLog: returns the record when found", () => {
    const db = makeFakeDb();
    db.tables.action_logs.push({ id: "99999999-2222-2222-2222-222222222222", client_id: "88888888-1111-1111-1111-111111111111", canonical_action_id: ACTION_ID, status: "validated" });
    const svc = sb.createActionsService(db.deps);
    const r = svc.getLog({ action_log_id: "99999999-2222-2222-2222-222222222222" });
    assert.equal(r.action_log.id, "99999999-2222-2222-2222-222222222222");
  });

  test("actions.getLog: returns NOT_FOUND for unknown id", () => {
    const db = makeFakeDb();
    const svc = sb.createActionsService(db.deps);
    try {
      svc.getLog({ action_log_id: "88888888-8888-8888-8888-888888888888" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });
}
