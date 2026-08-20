#!/usr/bin/env node
// scripts/nutrilongx/import_standalone_canon.mjs
//
// NUTRILONGX — Standalone Backend v1 — import/sync canónico (Fase 1).
//
// Lee directamente los artefactos FROZEN de nutrilongx/**/canonical (Git
// sigue siendo la fuente de verdad, ver
// nutrilongx/governance/architecture/NUTRILONGX_SOURCE_OF_TRUTH_MATRIX_v1.md)
// y los proyecta de forma idempotente (upsert por clave canónica/negocio,
// nunca por posición) sobre las tablas standalone creadas por
// supabase/migrations/0002_standalone_backend_v1.sql:
//
//   content_registry, recipes, exercises, exercise_variants,
//   canonical_actions, content_action_bindings, exercise_safety_rules
//
// NO importa Mente legacy (eso lo hace la propia migración 0002 en SQL,
// porque origen y destino viven en la misma base de datos).
// NO crea evidence, action_logs ni progreso derivado.
// NO inventa reglas de acreditación.
//
// Por seguridad, por defecto es un DRY RUN: solo imprime qué escribiría.
// Añade --apply para escribir de verdad.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/nutrilongx/import_standalone_canon.mjs [--apply]

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

const args = process.argv.slice(2);
const apply = args.includes("--apply");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (apply && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno (necesarios para --apply).");
  process.exit(1);
}

const supa = apply ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

function readJSON(relPath) {
  return JSON.parse(readFileSync(join(REPO_ROOT, relPath), "utf-8"));
}

function summarize(label, rows) {
  console.log(`\n${label}: ${rows.length} filas`);
  if (!apply) {
    console.log(JSON.stringify(rows.slice(0, 2), null, 2), rows.length > 2 ? "\n  ... (truncado, dry-run)" : "");
  }
}

async function upsertAndReturn(table, rows, onConflict) {
  summarize(table, rows);
  if (rows.length === 0) return [];
  if (!apply) return rows.map((r, i) => ({ ...r, id: `dry-run-${table}-${i}` }));
  const { data, error } = await supa.from(table).upsert(rows, { onConflict }).select();
  if (error) {
    console.error(`✗ Error en ${table}:`, error.message);
    process.exitCode = 1;
    return [];
  }
  console.log(`✓ ${table}: ${data.length} filas escritas/actualizadas`);
  return data;
}

async function main() {
  console.log(apply ? "MODO: --apply (escribe en Supabase)" : "MODO: dry-run (no escribe nada; añade --apply para escribir)");

  // ============================================================ NUTRITION
  const master = readJSON("nutrilongx/nutrition/canonical/NUTRILONGX_ALIMENTACION_MASTER_v1.json");
  const recipes = master.recipes || [];
  console.log(`\nNUTRILONGX_ALIMENTACION_MASTER_v1: ${recipes.length} recetas (version ${master.version}, status ${master.status})`);

  // content_registry rows para recetas
  const recipeRegistryRows = recipes.map((r) => ({
    content_type: "recipe",
    canonical_id: r.recipe_id,
    pillar: "nutrition",
    is_active: true,
  }));
  const recipeRegistry = await upsertAndReturn("content_registry", recipeRegistryRows, "content_type,canonical_id");
  const recipeRegistryMap = new Map(recipeRegistry.map((row) => [row.canonical_id, row.id]));

  const recipeRows = recipes.map((r) => ({
    registry_id: apply ? recipeRegistryMap.get(r.recipe_id) : "dry-run",
    canonical_id: r.recipe_id,
    title: r.title,
    maturity: r.recipe_maturity?.status ?? null,
    data: r,
    source_version: master.version || "NUTRILONGX_ALIMENTACION_MASTER_v1",
    schema_version: master.schema || null,
    is_published: false, // import no implica publicacion (Decision explicita, ver STANDALONE_DATA_MODEL_v1 seccion 7)
  }));
  await upsertAndReturn("recipes", recipeRows, "canonical_id");

  // content_action_bindings (solo nutrition, semantica FROZEN)
  const bindingStatusMap = { confirmed: "active", candidate: "review_required" };
  const bindingRows = [];
  for (const r of recipes) {
    for (const b of r.gamification_bindings || []) {
      bindingRows.push({
        content_id: apply ? recipeRegistryMap.get(r.recipe_id) : "dry-run",
        canonical_action_id: b.canonical_action_id,
        binding_type: b.binding_type,
        status: bindingStatusMap[b.status] ?? "review_required",
        metadata: { evidence_tag: b.evidence_tag ?? null, notes: b.notes ?? null },
        provenance: { canonical_catalog_version: b.canonical_catalog_version ?? null, source_recipe_id: r.recipe_id },
        source_version: master.version || "NUTRILONGX_ALIMENTACION_MASTER_v1",
      });
    }
  }
  await upsertAndReturn("content_action_bindings", bindingRows, "content_id,canonical_action_id,binding_type");

  // ============================================================ EXERCISE
  const exlib = readJSON("nutrilongx/exercise/library/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json");
  const exercises = exlib.exercise_library || [];
  const variants = exlib.exercise_variants || [];
  console.log(`\nNUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1: ${exercises.length} exercises, ${variants.length} variants (schema_version_reference ${exlib.schema_version_reference})`);

  const exerciseRegistryRows = exercises.map((e) => ({
    content_type: "exercise",
    canonical_id: e.exercise_id,
    pillar: "exercise",
    is_active: true,
  }));
  const exerciseRegistry = await upsertAndReturn("content_registry", exerciseRegistryRows, "content_type,canonical_id");
  const exerciseRegistryMap = new Map(exerciseRegistry.map((row) => [row.canonical_id, row.id]));

  const exerciseRows = exercises.map((e) => ({
    registry_id: apply ? exerciseRegistryMap.get(e.exercise_id) : "dry-run",
    canonical_id: e.exercise_id,
    title: e.title,
    domain: e.primary_domain ?? null,
    data: e,
    content_maturity: e.content_maturity ?? null,
    review_status: e.review?.review_status ?? null,
    source_version: exlib.schema_version_reference || "NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1",
    schema_version: exlib.schema_version_reference || null,
    is_published: false,
  }));
  const insertedExercises = await upsertAndReturn("exercises", exerciseRows, "canonical_id");

  const variantRegistryRows = variants.map((v) => ({
    content_type: "exercise_variant",
    canonical_id: v.variant_id,
    pillar: "exercise",
    is_active: true,
  }));
  const variantRegistry = await upsertAndReturn("content_registry", variantRegistryRows, "content_type,canonical_id");
  const variantRegistryMap = new Map(variantRegistry.map((row) => [row.canonical_id, row.id]));

  // exercise_id (FK interna) se resuelve por canonical_id de exercises, no por id dry-run
  let exerciseIdByCanonical = new Map();
  if (apply) {
    const { data: exRows, error } = await supa.from("exercises").select("id, canonical_id");
    if (error) { console.error("✗ Error leyendo exercises para resolver FK de variants:", error.message); process.exitCode = 1; }
    else exerciseIdByCanonical = new Map(exRows.map((r) => [r.canonical_id, r.id]));
  }

  const variantRows = variants.map((v) => ({
    registry_id: apply ? variantRegistryMap.get(v.variant_id) : "dry-run",
    canonical_id: v.variant_id,
    exercise_id: apply ? exerciseIdByCanonical.get(v.base_exercise_id) : "dry-run",
    relationship_type: v.relationship_type ?? null,
    data: v,
    review_status: v.review?.review_status ?? null,
    source_version: exlib.schema_version_reference || "NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1",
    schema_version: exlib.schema_version_reference || null,
    is_published: false,
  }));
  if (apply) {
    const missing = variantRows.filter((v) => !v.exercise_id);
    if (missing.length) {
      console.error(`✗ ${missing.length} variantes referencian un base_exercise_id no encontrado en exercises. No se insertan.`);
      process.exitCode = 1;
    }
  }
  await upsertAndReturn("exercise_variants", apply ? variantRows.filter((v) => v.exercise_id) : variantRows, "canonical_id");

  // ============================================================ GAMIFICATION
  const catalog = readJSON("nutrilongx/gamification/canonical/NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json");
  const actions = catalog.actions || [];
  console.log(`\nNUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1: ${actions.length} action families (version ${catalog.version}); esperado 119 -- si difiere, repórtalo, no lo fuerces.`);

  const actionRows = actions.map((a) => ({
    canonical_action_id: a.canonical_action_id,
    domain: a.canonical_domain,
    subdomain: a.canonical_subdomain ?? null,
    data: a, // incluye level_variants[] completo (base_dvg_hours, etc.) -- no reinterpretado
    source_version: catalog.version || "NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1",
    schema_version: catalog.schema || null,
    is_active: true,
  }));
  await upsertAndReturn("canonical_actions", actionRows, "canonical_action_id");

  // ============================================================ SAFETY
  const safety = readJSON("nutrilongx/exercise/safety/NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json");
  const rules = safety.safety_rules || [];
  console.log(`\nNUTRILONGX_EJERCICIO_SAFETY_RULES_v1: ${rules.length} reglas (esperado 12; applies_to_library_pilot_version=${safety.applies_to_library_pilot_version})`);

  const safetyRows = rules.map((s) => ({
    safety_rule_id: s.safety_rule_id,
    scope_type: s.target_entity_type,
    scope_selector: s.applies_to ?? null,
    clinical_profile: s.clinical_profile_id ?? null,
    safety_status: s.safety_status,
    rule_data: s, // registro completo -- rationale/evidence/stop_criteria preservados
    review_status: s.review_status,
    operational_mode: "ADVISORY_ONLY", // forzado; ver 0002 CHECK constraint
    source_version: safety.applies_to_library_pilot_version || "NUTRILONGX_EJERCICIO_SAFETY_RULES_v1",
    is_active: true,
  }));
  await upsertAndReturn("exercise_safety_rules", safetyRows, "safety_rule_id");

  // ============================================================ ACCREDITATION
  // No se pobla ninguna regla en esta fase: el canon actual no declara
  // ninguna ACTION_ACCREDITATION_RULE aprobada (ver
  // NUTRILONGX_ACTION_ACCREDITATION_CONTRACT_v1.md). 0 filas es el
  // resultado correcto -- no se genera nada aqui a partir de titles.
  console.log("\naction_accreditation_rules: 0 filas importadas (correcto -- ninguna regla canónica aprobada existe todavía).");

  console.log(apply ? "\nListo." : "\nDry-run completo. Revisa arriba y vuelve a ejecutar con --apply para escribir de verdad.");
}

main().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
