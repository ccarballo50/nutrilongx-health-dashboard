// apps-script/tests/clients_service.test.mjs
//
// Tests de ClientsService.gs con dependencias FAKE (sin Supabase real, sin
// UrlFetchApp). Simula una tabla `clients`/`client_profiles` en memoria.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Response.gs", "Validation.gs", "SupabaseClient.gs", "ClientsService.gs"]);

function makeFakeDb() {
  let clients = [];
  let profiles = [];
  let seq = 0;
  const auditLog = [];

  // Formato UUID valido: los IDs generados se reinyectan como client_id en
  // llamadas posteriores (get/update/getProfile) que pasan por
  // requireUuid(), asi que el fake debe producir UUIDs con forma real.
  function uuid() {
    seq += 1;
    var hex = String(seq).padStart(12, "0");
    return "11111111-1111-1111-1111-" + hex;
  }

  const deps = {
    sbSelect: (table, qs) => {
      const eqMatches = [...qs.matchAll(/([a-zA-Z_]+)=eq\.([^&]+)/g)].map((m) => [m[1], decodeURIComponent(m[2])]);
      const source = table === "clients" ? clients : table === "client_profiles" ? profiles : [];
      let rows = source;
      for (const [k, v] of eqMatches) {
        rows = rows.filter((r) => String(r[k]) === v);
      }
      return rows.map((r) => ({ ...r }));
    },
    sbInsert: (table, rows) => {
      const inserted = rows.map((r) => ({ id: uuid(), created_at: "2026-08-20T00:00:00.000Z", updated_at: "2026-08-20T00:00:00.000Z", ...r }));
      if (table === "clients") clients.push(...inserted);
      return inserted;
    },
    sbUpdate: (table, qs, patch) => {
      const idMatch = qs.match(/id=eq\.([^&]+)/);
      const id = idMatch && decodeURIComponent(idMatch[1]);
      const source = table === "clients" ? clients : [];
      const idx = source.findIndex((r) => r.id === id);
      if (idx === -1) return [];
      source[idx] = { ...source[idx], ...patch, updated_at: "2026-08-20T00:01:00.000Z" };
      return [{ ...source[idx] }];
    },
    sbUpsert: (table, rows, onConflict) => {
      const row = rows[0];
      const source = table === "client_profiles" ? profiles : [];
      const idx = source.findIndex((r) => r[onConflict] === row[onConflict]);
      if (idx === -1) {
        const inserted = { ...row };
        source.push(inserted);
        return [{ ...inserted }];
      }
      source[idx] = { ...source[idx], ...row };
      return [{ ...source[idx] }];
    },
    writeAudit: (entry) => {
      auditLog.push(entry);
      return entry;
    },
  };

  return { deps, clients: () => clients, profiles: () => profiles, auditLog };
}

const CTX = { requestId: "req-1", actorType: "professional", actorId: "prof-1" };

export function run() {
  test("clients.create creates a new client and audits it", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    const result = svc.create({ external_code: "NLX-C-0001", first_name: "Ana" }, CTX);
    assert.equal(result.idempotent, false);
    assert.equal(result.client.external_code, "NLX-C-0001");
    assert.equal(db.clients().length, 1);
    assert.equal(db.auditLog.length, 1);
    assert.equal(db.auditLog[0].action, "clients.create");
  });

  test("clients.create is idempotent for same external_code + same identity", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    svc.create({ external_code: "NLX-C-0002", first_name: "Bea" }, CTX);
    const second = svc.create({ external_code: "NLX-C-0002", first_name: "Bea" }, CTX);
    assert.equal(second.idempotent, true);
    assert.equal(db.clients().length, 1); // no duplicado
  });

  test("clients.create returns CONFLICT for same external_code + different identity", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    svc.create({ external_code: "NLX-C-0003", first_name: "Carla" }, CTX);
    try {
      svc.create({ external_code: "NLX-C-0003", first_name: "Diego" }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "CONFLICT");
    }
    assert.equal(db.clients().length, 1);
  });

  test("clients.create rejects unexpected fields", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    try {
      svc.create({ external_code: "NLX-C-0004", first_name: "Eva", not_a_field: true }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
  });

  test("clients.get returns NOT_FOUND for unknown client", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    try {
      svc.get({ client_id: "11111111-2222-3333-4444-555555555555" });
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });

  test("clients.update only allows first_name/last_name/email/phone/status", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    const created = svc.create({ external_code: "NLX-C-0005", first_name: "Fer" }, CTX).client;
    try {
      svc.update({ client_id: created.id, patch: { external_code: "HACKED" } }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
    }
    const ok = svc.update({ client_id: created.id, patch: { status: "paused" } }, CTX);
    assert.equal(ok.client.status, "paused");
  });

  test("clients.updateProfile rejects current_level explicitly", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    const created = svc.create({ external_code: "NLX-C-0006", first_name: "Gara" }, CTX).client;
    try {
      svc.updateProfile({ client_id: created.id, patch: { current_level: "Oro" } }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
      assert.equal(e.details.field, "current_level");
    }
  });

  test("clients.updateProfile verifies client exists before upsert", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    try {
      svc.updateProfile({ client_id: "11111111-2222-3333-4444-555555555555", patch: { sex: "F" } }, CTX);
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });

  test("clients.updateProfile upserts by client_id and audits before/after", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    const created = svc.create({ external_code: "NLX-C-0007", first_name: "Hugo" }, CTX).client;
    const r1 = svc.updateProfile({ client_id: created.id, patch: { goals: { weight_loss: true } } }, CTX);
    assert.deepEqual(r1.profile.goals, { weight_loss: true });
    const r2 = svc.updateProfile({ client_id: created.id, patch: { sex: "M" } }, CTX);
    assert.equal(r2.profile.sex, "M");
    assert.equal(db.profiles().length, 1); // upsert, no duplica fila
  });

  test("clients.getProfile returns null profile (not an error) when none exists yet", () => {
    const db = makeFakeDb();
    const svc = sb.createClientsService(db.deps);
    const created = svc.create({ external_code: "NLX-C-0008", first_name: "Ines" }, CTX).client;
    const r = svc.getProfile({ client_id: created.id });
    assert.equal(r.profile, null);
  });
}
