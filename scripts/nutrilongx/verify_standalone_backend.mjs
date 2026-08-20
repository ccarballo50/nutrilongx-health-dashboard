#!/usr/bin/env node
// scripts/nutrilongx/verify_standalone_backend.mjs
//
// NUTRILONGX — Standalone Backend v1 — verificación READ-ONLY post-import.
//
// No escribe nada. Pensado para ejecutarse después de aplicar
// supabase/migrations/0002_standalone_backend_v1.sql y de correr
// import_standalone_canon.mjs --apply (una o dos veces, para comprobar
// idempotencia).
//
// Comprueba:
//   1. counts por tabla vs. lo esperado del canon en Git;
//   2. integridad referencial (content_registry <-> recipes/exercises/
//      exercise_variants/mind_content, por tipo);
//   3. que el bootstrap canónico no generó evidence/action_logs/progreso
//      (invariante: CONTENT != DVG, import != evidencia real de usuario);
//   4. distribución de content_action_bindings por binding_type.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/nutrilongx/verify_standalone_backend.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno. Este script necesita acceso live de solo lectura (service role).");
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function readJSON(relPath) {
  return JSON.parse(readFileSync(join(REPO_ROOT, relPath), "utf-8"));
}

let failures = 0;
function check(label, condition, detail = "") {
  const mark = condition ? "✓" : "✗";
  console.log(`${mark} ${label}${detail ? " — " + detail : ""}`);
  if (!condition) failures++;
}

async function count(table) {
  const { count, error } = await supa.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function main() {
  console.log("=== 1. Counts vs. canon en Git ===");
  const master = readJSON("nutrilongx/nutrition/canonical/NUTRILONGX_ALIMENTACION_MASTER_v1.json");
  const exlib = readJSON("nutrilongx/exercise/library/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json");
  const catalog = readJSON("nutrilongx/gamification/canonical/NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json");
  const safety = readJSON("nutrilongx/exercise/safety/NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json");

  const expectedRecipes = master.recipes.length;
  const expectedExercises = exlib.exercise_library.length;
  const expectedVariants = exlib.exercise_variants.length;
  const expectedActions = catalog.actions.length;
  const expectedSafety = safety.safety_rules.length;
  const expectedBindings = master.recipes.reduce((n, r) => n + (r.gamification_bindings || []).length, 0);

  check("recipes count", (await count("recipes")) === expectedRecipes, `esperado ${expectedRecipes}`);
  check("exercises count", (await count("exercises")) === expectedExercises, `esperado ${expectedExercises}`);
  check("exercise_variants count", (await count("exercise_variants")) === expectedVariants, `esperado ${expectedVariants}`);
  check("canonical_actions count", (await count("canonical_actions")) === expectedActions, `esperado ${expectedActions}`);
  check("exercise_safety_rules count", (await count("exercise_safety_rules")) === expectedSafety, `esperado ${expectedSafety}`);
  check("content_action_bindings count", (await count("content_action_bindings")) === expectedBindings, `esperado ${expectedBindings}`);

  console.log("\n=== 2. Integridad referencial (content_registry por tipo) ===");
  for (const [type, table] of [
    ["recipe", "recipes"],
    ["exercise", "exercises"],
    ["exercise_variant", "exercise_variants"],
    ["mind_content", "mind_content"],
  ]) {
    const { count: regCount, error: e1 } = await supa
      .from("content_registry").select("*", { count: "exact", head: true }).eq("content_type", type);
    if (e1) throw e1;
    const tableCount = await count(table);
    check(`content_registry(${type}) == ${table}`, regCount === tableCount, `registry=${regCount} ${table}=${tableCount}`);
  }

  console.log("  (bindings -> canonical_actions y bindings -> content_registry: garantizado estructuralmente por FK en 0002, no requiere verificación adicional aquí)");

  console.log("\n=== 3. Invariante: el bootstrap canónico no genera actividad de usuario ===");
  check("execution_evidence == 0 tras import canónico", (await count("execution_evidence")) === 0);
  check("action_logs == 0 tras import canónico", (await count("action_logs")) === 0);
  check("client_progress == 0 tras import canónico", (await count("client_progress")) === 0);
  check("action_accreditation_rules == 0 (ninguna regla inventada)", (await count("action_accreditation_rules")) === 0);

  console.log("\n=== 4. Distribución de binding_type ===");
  for (const bt of ["supports", "candidate", "contextual_opposite", "unmapped", "direct"]) {
    const { count: n, error } = await supa
      .from("content_action_bindings").select("*", { count: "exact", head: true }).eq("binding_type", bt);
    if (error) throw error;
    console.log(`  ${bt}: ${n}`);
  }

  console.log(`\n${failures === 0 ? "TODO PASS" : `${failures} CHECK(S) FALLIDOS`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
