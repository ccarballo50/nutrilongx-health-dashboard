#!/usr/bin/env node
// scripts/nutrilongx/onboard_pilot_client.mjs
//
// PLAYABLE MVP — PILOT OPERATIONS v1.
//
// Da de alta un participante piloto REAL a través de la función normal
// del producto (`clients.create`, vía el mismo proxy real que usa el
// Dashboard) -- NUNCA SQL manual, nunca Supabase directo.
//
// Por qué existe este script (gap operativo documentado, no oculto): el
// Dashboard hoy NO tiene una pantalla "Crear cliente" (clientsApi.create
// existe en la capa de servicio desde PR-01, pero ninguna pantalla la
// invoca todavía). Durante FEATURE FREEZE no se construye esa pantalla
// (encargo PLAYABLE MVP PILOT OPERATIONS v1, sección 9: "no nuevas
// pantallas"). Este script es el procedimiento operativo interino
// sancionado: llama exactamente a la misma función de negocio
// (`clients.create`) que una pantalla futura llamaría, a través del
// mismo `api/apps-script.ts` real -- mismas validaciones, misma
// idempotencia, mismo audit_log. No es una función backend nueva, no es
// una pantalla nueva: es tooling operativo para ejecutar una función ya
// existente sin SQL.
//
// Uso (requiere tsx -- via npx, mismo patrón que el smoke test):
//   APPS_SCRIPT_WEB_APP_URL="..." DASHBOARD_API_KEY="$(cat 'ruta/a/la/clave.txt')" \
//     npx tsx scripts/nutrilongx/onboard_pilot_client.mjs \
//       --external_code "PILOT-01" \
//       --first_name "Nombre" \
//       [--last_name "Apellido"] [--email "..."] [--phone "..."]
//
// Idempotente: reintentar con el mismo --external_code no crea un
// segundo cliente (clients.create ya deduplica server-side por
// external_code -- ver ClientsService.gs).
//
// NUNCA imprime DASHBOARD_API_KEY. Los datos personales introducidos
// (nombre/email/teléfono) SÍ se muestran en la consola de quien ejecuta
// el script -- ejecutar solo con el consentimiento del participante y
// solo los campos estrictamente necesarios (encargo sección 5: "no
// recoger más datos personales de los necesarios").

import handler from "../../api/apps-script.ts";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      out[key] = val;
      i++;
    }
  }
  return out;
}

async function callProxy(body) {
  const req = new Request("http://localhost/api/apps-script", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await handler(req);
  return res.json();
}

async function main() {
  if (!process.env.APPS_SCRIPT_WEB_APP_URL || !process.env.DASHBOARD_API_KEY) {
    console.error("Faltan APPS_SCRIPT_WEB_APP_URL/DASHBOARD_API_KEY en el entorno. Abortando.");
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  if (!args.external_code || !args.first_name) {
    console.error("Uso: --external_code <codigo> --first_name <nombre> [--last_name ..] [--email ..] [--phone ..]");
    process.exit(1);
  }

  const payload = {
    external_code: args.external_code,
    first_name: args.first_name,
    ...(args.last_name ? { last_name: args.last_name } : {}),
    ...(args.email ? { email: args.email } : {}),
    ...(args.phone ? { phone: args.phone } : {}),
  };

  console.log(`Dando de alta cliente piloto external_code="${args.external_code}"...`);
  const result = await callProxy({ function: "clients.create", payload });

  if (result.ok !== true) {
    console.error(`Fallo: ${result.error?.code} — ${result.error?.message}`);
    process.exit(1);
  }

  console.log(`OK -- client_id: ${result.data.client.id}`);
  console.log(`idempotent: ${result.data.idempotent} (true = ya existía, no se duplicó)`);
  console.log(`\nFicha: /admin/clients/${result.data.client.id}`);
  console.log(`Hoy:   /admin/clients/${result.data.client.id}/today`);
}

main().catch((e) => {
  console.error("onboard_pilot_client crashed:", e);
  process.exit(1);
});
