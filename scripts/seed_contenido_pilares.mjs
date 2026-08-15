#!/usr/bin/env node
// scripts/seed_contenido_pilares.mjs
//
// Siembra las tablas nuevas (supabase/migrations/0001_contenido_pilares.sql)
// a partir del JSON aprobado por César (NUTRILONGX_contenido_pilares_v2_FINAL.json).
//
// Requiere las tablas ya creadas (aplicar la migración 0001 antes de correr esto).
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/seed_contenido_pilares.mjs ./NUTRILONGX_contenido_pilares_v2_FINAL.json
//
// Por seguridad, por defecto es un DRY RUN: solo imprime qué escribiría.
// Añade --apply para escribir de verdad.
//
// No incluye los 150 retos de actions_catalog (eso sigue siendo
// responsabilidad de excel_to_json_upsert2.py / /api/admin/actions/import
// con el Excel de créditos v3) — este script es solo para el contenido
// divulgativo, retos insignia, vídeos e infografías del JSON v2.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const jsonPath = args.find((a) => !a.startsWith("--"));

if (!jsonPath) {
  console.error("Uso: node scripts/seed_contenido_pilares.mjs <ruta-al-json> [--apply]");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (apply && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno (necesarios para --apply).");
  process.exit(1);
}

const data = JSON.parse(readFileSync(jsonPath, "utf-8"));

const supa = apply ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

function summarize(label, rows) {
  console.log(`\n${label}: ${rows.length} filas`);
  if (!apply) console.log(JSON.stringify(rows.slice(0, 2), null, 2), rows.length > 2 ? "\n  ... (truncado, dry-run)" : "");
}

async function upsert(table, rows, onConflict) {
  summarize(table, rows);
  if (!apply || rows.length === 0) return;
  const { error } = await supa.from(table).upsert(rows, { onConflict });
  if (error) {
    console.error(`✗ Error en ${table}:`, error.message);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${table}: ${rows.length} filas escritas`);
  }
}

async function main() {
  console.log(apply ? "MODO: --apply (escribe en Supabase)" : "MODO: dry-run (no escribe nada; añade --apply para escribir)");

  // 1) subpilar_mapeo
  const mapeo = (data.mapeo_subpilares || []).map((m) => ({
    subpilar: m.subpilar,
    pilar_backend: m.pilar_backend || "MEN",
    pilar_visible: m.pilar_visible,
    nota: m.nota || null,
  }));
  await upsert("subpilar_mapeo", mapeo, "subpilar");

  // 2) content_pieces (fichas de pilar + subpilar)
  const piezas = (data.contenido_divulgativo || []).map((c) => ({
    pilar_visible: c.pilar_visible,
    tipo: c.tipo === "ficha_subpilar_ejemplo" ? "ficha_subpilar" : c.tipo, // normaliza el tipo del v1
    tema: c.tema,
    subpilar: c.subpilar || null,
    actividad_ancla: c.actividad_ancla || null,
    texto_cliente: c.texto_cliente,
    texto_equipo: c.texto_equipo,
    fuentes: c.fuentes || [],
    estado: "aprobado",
  }));
  await upsert("content_pieces", piezas, "pilar_visible,tipo,tema");

  // 3) retos_insignia
  const retos = (data.retos_insignia || []).map((r) => ({
    pilar_visible: r.pilar_visible,
    nombre: r.nombre,
    descripcion: r.descripcion,
    duracion: r.duracion,
    nota_motor: r.nota_motor || null,
    estado: "aprobado",
  }));
  await upsert("retos_insignia", retos, "pilar_visible,nombre");

  // 4) videos + video_bloques (dos pasos: upsert video, luego reemplazar sus bloques)
  const videos = (data.videos || []).map((v) => ({
    titulo: v.titulo,
    subpilar: v.subpilar_vinculado,
    duracion_objetivo: v.duracion_objetivo,
    tono: v.tono,
    estado: "aprobado",
  }));
  summarize("videos", videos);
  if (apply) {
    for (const v of data.videos || []) {
      const { data: row, error } = await supa
        .from("videos")
        .upsert(
          { titulo: v.titulo, subpilar: v.subpilar_vinculado, duracion_objetivo: v.duracion_objetivo, tono: v.tono, estado: "aprobado" },
          { onConflict: "titulo" }
        )
        .select("id")
        .single();
      if (error) { console.error(`✗ Error en videos (${v.titulo}):`, error.message); process.exitCode = 1; continue; }

      const videoId = row.id;
      await supa.from("video_bloques").delete().eq("video_id", videoId);
      const bloques = (v.guion_por_bloque || []).map((b, i) => ({
        video_id: videoId, orden: i, tiempo: b.tiempo, guion: b.guion,
      }));
      if (bloques.length) {
        const { error: bErr } = await supa.from("video_bloques").insert(bloques);
        if (bErr) { console.error(`✗ Error en video_bloques (${v.titulo}):`, bErr.message); process.exitCode = 1; }
      }
      console.log(`✓ videos: "${v.titulo}" (${bloques.length} bloques)`);
    }
  }

  // 5) infografias
  const infografias = (data.infografias || []).map((i) => ({
    pilar_visible: i.pilar_visible,
    titulo: i.titulo,
    color: i.color,
    dato_destacado: i.dato_destacado,
    dato_contexto: i.dato_contexto,
    puntos_clave: i.puntos_clave || [],
    microhabito: i.microhabito,
    fuentes: i.fuentes || [],
    imagen_url: null, // pendiente: subir el PNG final a Supabase Storage y rellenar aquí
    estado: "aprobado",
  }));
  await upsert("infografias", infografias, "pilar_visible");

  console.log(apply ? "\nListo." : "\nDry-run completo. Revisa arriba y vuelve a ejecutar con --apply para escribir de verdad.");
}

main().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
