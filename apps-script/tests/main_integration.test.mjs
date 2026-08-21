// apps-script/tests/main_integration.test.mjs
//
// Test de integracion end-to-end de TODO el stack (Main -> Router ->
// Clients/ContentService -> SupabaseClient -> Audit), incluidos los
// ficheros que dependen de servicios reales de Apps Script
// (PropertiesService, UrlFetchApp, Utilities, ContentService nativo de
// Apps Script). Se stubean esos 4 servicios con implementaciones falsas
// minimas -- esto tambien sirve como chequeo de sintaxis de Config.gs,
// SupabaseClient.gs, Audit.gs y Main.gs, que ningun otro test carga.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

function makeFakePostgrest() {
  const tables = { clients: [], client_profiles: [], audit_log: [] };
  let seq = 0;
  function uuid() {
    seq += 1;
    return "44444444-4444-4444-4444-" + String(seq).padStart(12, "0");
  }

  function fetch(url, params) {
    const u = new URL(url);
    const table = u.pathname.replace(/^\/rest\/v1\//, "");
    const method = (params.method || "get").toLowerCase();
    let rows = tables[table] || (tables[table] = []);
    let status = 200;
    let body;

    if (method === "get") {
      let out = rows;
      for (const [k, v] of u.searchParams.entries()) {
        if (k === "select" || k === "order" || k === "limit") continue;
        if (v.startsWith("eq.")) {
          const val = decodeURIComponent(v.slice(3));
          out = out.filter((r) => String(r[k]) === val);
        }
      }
      body = JSON.stringify(out);
    } else if (method === "post") {
      const payload = JSON.parse(params.payload);
      const inserted = payload.map((r) => ({
        id: uuid(),
        created_at: "2026-08-20T00:00:00.000Z",
        updated_at: "2026-08-20T00:00:00.000Z",
        ...r,
      }));
      rows.push(...inserted);
      body = JSON.stringify(inserted);
    } else if (method === "patch") {
      let matchedIds = rows;
      for (const [k, v] of u.searchParams.entries()) {
        if (v.startsWith("eq.")) {
          const val = decodeURIComponent(v.slice(3));
          matchedIds = matchedIds.filter((r) => String(r[k]) === val);
        }
      }
      const patch = JSON.parse(params.payload);
      matchedIds.forEach((r) => Object.assign(r, patch));
      body = JSON.stringify(matchedIds);
    } else {
      status = 400;
      body = JSON.stringify({ message: "unsupported method in fake" });
    }

    return {
      getResponseCode: () => status,
      getContentText: () => body,
    };
  }

  return { fetch, tables };
}

function buildSandbox() {
  const fakePg = makeFakePostgrest();
  const scriptProps = {
    SUPABASE_URL: "https://fake.supabase.example",
    SUPABASE_SERVICE_ROLE_KEY: "fake-service-role-key",
    DASHBOARD_API_KEY: "fake-dashboard-key",
  };

  let uuidSeq = 0;
  const extraGlobals = {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => scriptProps[key] || null,
      }),
    },
    UrlFetchApp: { fetch: fakePg.fetch },
    Utilities: {
      getUuid: () => {
        uuidSeq += 1;
        return "req-" + uuidSeq;
      },
    },
    ContentService: {
      MimeType: { JSON: "JSON" },
      createTextOutput: (text) => ({
        _text: text,
        setMimeType: function () { return this; },
      }),
    },
  };

  const sb = loadGsFiles(
    [
      "Errors.gs", "Response.gs", "Validation.gs",
      "Config.gs", "SupabaseClient.gs", "Audit.gs",
      "ClientsService.gs", "ContentService.gs", "EvidenceService.gs", "ActionsService.gs", "Router.gs", "Main.gs",
    ],
    extraGlobals
  );
  return { sb, fakePg };
}

function fakePostEvent(bodyObj) {
  return { postData: { contents: JSON.stringify(bodyObj), type: "text/plain" } };
}

export function run() {
  test("doGet returns a healthy envelope without requiring auth", () => {
    const { sb } = buildSandbox();
    const output = sb.doGet({});
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.data.status, "healthy");
  });

  test("doPost rejects a missing/invalid dashboard_key with UNAUTHORIZED", () => {
    const { sb } = buildSandbox();
    const output = sb.doPost(fakePostEvent({ function: "clients.list", auth: { dashboard_key: "WRONG" }, payload: {} }));
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error.code, "UNAUTHORIZED");
  });

  test("doPost rejects an unknown function with NOT_FOUND, after auth passes", () => {
    const { sb } = buildSandbox();
    const output = sb.doPost(fakePostEvent({ function: "clients.deleteEverything", auth: { dashboard_key: "fake-dashboard-key" }, payload: {} }));
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error.code, "NOT_FOUND");
  });

  test("doPost clients.create works end-to-end through Main -> Router -> ClientsService -> SupabaseClient -> Audit", () => {
    const { sb, fakePg } = buildSandbox();
    const output = sb.doPost(fakePostEvent({
      function: "clients.create",
      auth: { dashboard_key: "fake-dashboard-key" },
      payload: { external_code: "NLX-TEST-2A-001", first_name: "Test" },
    }));
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.data.client.external_code, "NLX-TEST-2A-001");
    assert.equal(fakePg.tables.clients.length, 1);
    assert.equal(fakePg.tables.audit_log.length, 1);
    assert.equal(fakePg.tables.audit_log[0].action, "clients.create");
    assert.equal(envelope.meta.schema_version, "NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1");
  });

  test("doPost clients.create is idempotent end-to-end (repeated call, no duplicate)", () => {
    const { sb, fakePg } = buildSandbox();
    const req = fakePostEvent({
      function: "clients.create",
      auth: { dashboard_key: "fake-dashboard-key" },
      payload: { external_code: "NLX-TEST-2A-002", first_name: "Repeat" },
    });
    sb.doPost(req);
    sb.doPost(req);
    assert.equal(fakePg.tables.clients.length, 1);
  });

  test("doPost validation error surfaces as VALIDATION_ERROR, not INTERNAL_ERROR", () => {
    const { sb } = buildSandbox();
    const output = sb.doPost(fakePostEvent({
      function: "clients.create",
      auth: { dashboard_key: "fake-dashboard-key" },
      payload: { first_name: "NoExternalCode" },
    }));
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error.code, "VALIDATION_ERROR");
  });

  test("doPost never leaks the service role key or dashboard key in the response body", () => {
    const { sb } = buildSandbox();
    const output = sb.doPost(fakePostEvent({ function: "clients.list", auth: { dashboard_key: "fake-dashboard-key" }, payload: {} }));
    assert.equal(output._text.indexOf("fake-service-role-key"), -1);
    assert.equal(output._text.indexOf("fake-dashboard-key"), -1);
  });

  test("doPost evidence.register requires auth same as any other function (Phase 2B reuses Phase 2A auth)", () => {
    const { sb } = buildSandbox();
    const output = sb.doPost(fakePostEvent({ function: "evidence.register", auth: { dashboard_key: "WRONG" }, payload: {} }));
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error.code, "UNAUTHORIZED");
  });

  test("doPost evidence.register works end-to-end and audit_log.request_id correlates with meta.request_id", () => {
    const { sb, fakePg } = buildSandbox();
    fakePg.tables.clients.push({ id: "44444444-4444-4444-4444-000000000001", status: "active" });
    fakePg.tables.content_registry = [{ id: "reg-1", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true }];
    const output = sb.doPost(fakePostEvent({
      function: "evidence.register",
      auth: { dashboard_key: "fake-dashboard-key" },
      payload: {
        client_id: "44444444-4444-4444-4444-000000000001",
        source_type: "dashboard",
        source_content: { content_type: "recipe", canonical_id: "NLX-001" },
        occurred_at: "2026-08-20T12:00:00Z",
        quantity: 1,
        unit: "serving",
      },
    }));
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.data.evidence.pillar, "nutrition");
    assert.equal(fakePg.tables.execution_evidence.length, 1);
    const auditRow = fakePg.tables.audit_log[fakePg.tables.audit_log.length - 1];
    assert.equal(auditRow.action, "evidence.register");
    assert.equal(auditRow.request_id, envelope.meta.request_id);
  });

  test("doPost actions.accredit requires auth same as any other function (Phase 2C reuses Phase 2A auth)", () => {
    const { sb } = buildSandbox();
    const output = sb.doPost(fakePostEvent({ function: "actions.accredit", auth: { dashboard_key: "WRONG" }, payload: {} }));
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error.code, "UNAUTHORIZED");
  });

  test("doPost actions.accredit end-to-end: no rule in canon -> review_required, no action_log row, audit correlates", () => {
    const { sb, fakePg } = buildSandbox();
    fakePg.tables.clients.push({ id: "44444444-4444-4444-4444-000000000003", status: "active" });
    fakePg.tables.content_registry = [{ id: "reg-2", content_type: "recipe", canonical_id: "NLX-001", pillar: "nutrition", is_active: true }];
    fakePg.tables.content_action_bindings = [{ id: "bind-1", content_id: "reg-2", canonical_action_id: "nutrition.mediterranean_pattern.legumbres_veces_sem", binding_type: "supports", status: "active" }];
    // action_accreditation_rules queda vacia -- canon real actual.

    const evOutput = sb.doPost(fakePostEvent({
      function: "evidence.register",
      auth: { dashboard_key: "fake-dashboard-key" },
      payload: {
        client_id: "44444444-4444-4444-4444-000000000003",
        source_type: "dashboard",
        source_content: { content_type: "recipe", canonical_id: "NLX-001" },
        occurred_at: "2026-08-21T12:00:00Z",
        quantity: 1,
        unit: "serving",
      },
    }));
    const evidenceId = JSON.parse(evOutput._text).data.evidence.id;

    const output = sb.doPost(fakePostEvent({
      function: "actions.accredit",
      auth: { dashboard_key: "fake-dashboard-key" },
      payload: { evidence_id: evidenceId },
    }));
    const envelope = JSON.parse(output._text);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.data.status, "pending");
    assert.equal(envelope.data.reason, "ACCREDITATION_REVIEW_REQUIRED");
    assert.equal(envelope.data.action_log_created, false);
    assert.equal((fakePg.tables.action_logs || []).length, 0);

    const auditRow = fakePg.tables.audit_log[fakePg.tables.audit_log.length - 1];
    assert.equal(auditRow.action, "actions.accredit");
    assert.equal(auditRow.request_id, envelope.meta.request_id);
  });

  test("evidence.register never creates action_logs/client_progress/daily_progress (Phase 2B invariant)", () => {
    const { sb, fakePg } = buildSandbox();
    fakePg.tables.clients.push({ id: "44444444-4444-4444-4444-000000000002", status: "active" });
    sb.doPost(fakePostEvent({
      function: "evidence.register",
      auth: { dashboard_key: "fake-dashboard-key" },
      payload: {
        client_id: "44444444-4444-4444-4444-000000000002",
        source_type: "manual",
        occurred_at: "2026-08-20T12:00:00Z",
        pillar: "sleep",
      },
    }));
    assert.equal((fakePg.tables.action_logs || []).length, 0);
    assert.equal((fakePg.tables.client_progress || []).length, 0);
    assert.equal((fakePg.tables.daily_progress || []).length, 0);
  });
}
