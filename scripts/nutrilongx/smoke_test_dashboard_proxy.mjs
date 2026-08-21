#!/usr/bin/env node
// scripts/nutrilongx/smoke_test_dashboard_proxy.mjs
//
// PLAYABLE MVP UI INTEGRATION — smoke test de integración real.
//
// El repo no tiene un framework de tests de componentes (ni vitest ni
// jest configurados -- ver package.json). Este script no lo sustituye:
// en su lugar, ejercita DIRECTAMENTE el handler real de
// `api/apps-script.ts` (la misma función que Vercel invoca en
// producción, importada tal cual, sin reimplementarla) contra el Web
// App de Apps Script REAL, cubriendo los escenarios de integración de
// PLAYABLE MVP UI INTEGRATION (load clients, mark done validated, mark
// done pending, duplicate click, progress refresh, zero progress, API
// error, expired/invalid auth) y de PLAYABLE MVP FINAL RECONCILIATION
// (assign content + idempotencia via backend, sección 9).
//
// Requiere Node 18+ (Request/Response/fetch globales) y las mismas
// variables de entorno que Vercel inyecta en producción:
//   APPS_SCRIPT_WEB_APP_URL, DASHBOARD_API_KEY
//
// Uso (requiere `tsx` -- via npx, no es dependencia del proyecto -- porque
// este script importa api/apps-script.ts, un .ts real, y Node no lo
// ejecuta sin un loader):
//   APPS_SCRIPT_WEB_APP_URL="..." DASHBOARD_API_KEY="$(cat 'ruta/a/la/clave.txt')" \
//     npx tsx scripts/nutrilongx/smoke_test_dashboard_proxy.mjs
//
// NUNCA imprime la clave. Usa el cliente de prueba NLX-TEST-2A-001
// existente -- no crea ni usa ningún paciente real.

import handler from "../../api/apps-script.ts";

const FIXTURE_CLIENT_ID = "2fe63c8f-e042-458c-8101-f652aa9b7b99"; // NLX-TEST-2A-001, archivado

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
  }
}

async function callProxy(body) {
  const req = new Request("http://localhost/api/apps-script", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await handler(req);
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  if (!process.env.APPS_SCRIPT_WEB_APP_URL || !process.env.DASHBOARD_API_KEY) {
    console.error("Faltan APPS_SCRIPT_WEB_APP_URL/DASHBOARD_API_KEY en el entorno. Abortando.");
    process.exit(1);
  }

  console.log("=== 1. load clients (clients.list) ===");
  {
    const { json } = await callProxy({ function: "clients.list", payload: {} });
    assert(json.ok === true, "clients.list responde ok:true");
    assert(Array.isArray(json.data?.clients), "clients.list devuelve un array de clientes");
  }

  console.log("=== 2. select client (clients.get) ===");
  {
    const { json } = await callProxy({ function: "clients.get", payload: { client_id: FIXTURE_CLIENT_ID } });
    assert(json.ok === true, "clients.get responde ok:true");
    assert(json.data?.client?.id === FIXTURE_CLIENT_ID, "clients.get devuelve el cliente fixture correcto");
  }

  console.log("=== 3. zero progress path (progress.get sobre un cliente sin acciones nunca vistas) ===");
  {
    // UUID valido pero inexistente -- progress.get debe devolver estado cero, no NOT_FOUND.
    const unseenClientId = "00000000-0000-4000-8000-000000000000";
    const { json } = await callProxy({ function: "progress.get", payload: { client_id: unseenClientId } });
    assert(json.ok === true, "progress.get sobre cliente sin progreso responde ok:true (no NOT_FOUND)");
    assert(json.data?.total_dvg_hours === 0, "total_dvg_hours=0 para cliente sin progreso");
    assert(json.data?.current_level === null, "current_level=null -- nunca se inventa un nivel");
  }

  console.log("=== 4. progress refresh (progress.get sobre el fixture real, ya con progreso de fases anteriores) ===");
  {
    const { json } = await callProxy({ function: "progress.get", payload: { client_id: FIXTURE_CLIENT_ID } });
    assert(json.ok === true, "progress.get responde ok:true");
    assert(typeof json.data?.total_dvg_hours === "number", "total_dvg_hours es numérico");
    assert(
      json.data?.by_pillar &&
        ["nutrition", "exercise", "sleep", "stress", "conscious_wellbeing"].every((p) => typeof json.data.by_pillar[p] === "number"),
      "by_pillar trae los 5 pilares reales"
    );
  }

  console.log("=== 5. mark done validated (evidence.register + actions.accreditAndCalculate) ===");
  let validatedEvidenceId = null;
  {
    const idemKey = "smoke-test-validated-" + Date.now();
    const reg = await callProxy({
      function: "evidence.register",
      payload: {
        client_id: FIXTURE_CLIENT_ID,
        source_type: "dashboard",
        source_entity_type: "canonical_action",
        source_entity_id: "mind.stress.respiracion_durante_min",
        pillar: "stress",
        occurred_at: new Date().toISOString(),
        duration_minutes: 5,
        idempotency_key: idemKey,
      },
    });
    assert(reg.json.ok === true, "evidence.register responde ok:true");
    validatedEvidenceId = reg.json.data?.evidence?.id;
    assert(typeof validatedEvidenceId === "string", "evidence.register devuelve un evidence_id");

    const acc = await callProxy({ function: "actions.accreditAndCalculate", payload: { evidence_id: validatedEvidenceId } });
    assert(acc.json.ok === true, "actions.accreditAndCalculate responde ok:true");
    assert(acc.json.data?.accredit?.status === "validated", "status=validated para duracion suficiente");
    assert(typeof acc.json.data?.gamification?.event_dvg_hours === "number", "gamification.event_dvg_hours presente y numérico");
    assert(acc.json.data?.daily_progress?.total_dvg_hours > 0, "daily_progress.total_dvg_hours > 0");
  }

  console.log("=== 6. duplicate click (mismo evidence_id, dos accreditAndCalculate seguidos) ===");
  {
    const first = await callProxy({ function: "actions.accreditAndCalculate", payload: { evidence_id: validatedEvidenceId } });
    const second = await callProxy({ function: "actions.accreditAndCalculate", payload: { evidence_id: validatedEvidenceId } });
    assert(first.json.ok === true && second.json.ok === true, "ambas llamadas responden ok:true");
    assert(second.json.data?.accredit?.idempotent === true, "la segunda llamada es idempotente");
    assert(
      first.json.data?.accredit?.action_log_id === second.json.data?.accredit?.action_log_id,
      "mismo action_log_id -- sin duplicar"
    );
  }

  console.log("=== 7. mark done pending (accion real del catalogo de 119, fuera de las 11 reglas MVP) ===");
  {
    const reg = await callProxy({
      function: "evidence.register",
      payload: {
        client_id: FIXTURE_CLIENT_ID,
        source_type: "dashboard",
        source_entity_type: "canonical_action",
        source_entity_id: "adherence.movement.usa_siempre_las_escaleras_en_trayectos_p", // real, sin regla MVP
        pillar: "exercise",
        occurred_at: new Date().toISOString(),
        duration_minutes: 5,
        idempotency_key: "smoke-test-pending-" + Date.now(),
      },
    });
    assert(reg.json.ok === true, "evidence.register responde ok:true para accion real sin regla");
    const acc = await callProxy({ function: "actions.accreditAndCalculate", payload: { evidence_id: reg.json.data.evidence.id } });
    assert(acc.json.ok === true, "actions.accreditAndCalculate responde ok:true para accion sin regla");
    assert(acc.json.data?.accredit?.status === "pending", "status=pending (ACCREDITATION_REVIEW_REQUIRED)");
    assert(acc.json.data?.gamification === null, "gamification=null en el camino pending");
    assert(acc.json.data?.daily_progress === null, "daily_progress=null en el camino pending");
  }

  console.log("=== 8. API error -- function fuera de la allowlist del proxy ===");
  {
    const { status, json } = await callProxy({ function: "gamification.calculateAction", payload: {} });
    assert(status === 404, "HTTP 404 para función fuera de la allowlist del proxy");
    assert(json.ok === false && json.error?.code === "NOT_FOUND", "NOT_FOUND -- ni siquiera llega a Apps Script");
  }

  console.log("=== 9. expired/invalid auth (el proxy inyecta la key -- se prueba con una key erronea vía env) ===");
  {
    const realKey = process.env.DASHBOARD_API_KEY;
    process.env.DASHBOARD_API_KEY = "clave-invalida-para-esta-prueba";
    const { json } = await callProxy({ function: "clients.list", payload: {} });
    process.env.DASHBOARD_API_KEY = realKey;
    assert(json.ok === false && json.error?.code === "UNAUTHORIZED", "UNAUTHORIZED con dashboard_key inválida");
  }

  console.log("=== 10. assign content (client.assign + listAssignments -- PLAYABLE MVP FINAL RECONCILIATION §9) ===");
  {
    const assign = await callProxy({
      function: "content.assign",
      payload: {
        client_id: FIXTURE_CLIENT_ID,
        content_type: "recipe",
        canonical_id: "NLX-007",
        options: { idempotency_key: "smoke-test-assign-" + Date.now() },
      },
    });
    assert(assign.json.ok === true, "content.assign responde ok:true");
    const assignmentId = assign.json.data?.assignment?.id;
    assert(typeof assignmentId === "string", "content.assign devuelve un assignment_id");

    const list = await callProxy({ function: "content.listAssignments", payload: { client_id: FIXTURE_CLIENT_ID } });
    assert(list.json.ok === true, "content.listAssignments responde ok:true");
    assert(
      Array.isArray(list.json.data?.assignments) && list.json.data.assignments.some((a) => a.id === assignmentId),
      "la asignación recién creada aparece en listAssignments"
    );

    // Repetir la misma asignación -- el backend decide la idempotencia, no el frontend.
    const repeat = await callProxy({
      function: "content.assign",
      payload: { client_id: FIXTURE_CLIENT_ID, content_type: "recipe", canonical_id: "NLX-007" },
    });
    assert(repeat.json.ok === true, "reasignar el mismo contenido responde ok:true");
    assert(repeat.json.data?.assignment?.id === assignmentId, "misma asignación devuelta, sin duplicar (idempotencia via backend)");
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`TOTAL: ${passed}/${passed + failed} PASS`);
  console.log("=".repeat(50));
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Smoke test crashed:", e);
  process.exit(1);
});
