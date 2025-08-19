// /api/actions/log.ts
// Vercel function (Runtime: Node.js)
import { createClient } from "@supabase/supabase-js";

function resJSON(code: number, payload: any) {
  return new Response(JSON.stringify(payload), {
    status: code,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return resJSON(405, { error: "Method not allowed" });
  }

  // --- ENV obligatorias (Service Role SIEMPRE en backend) ---
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return resJSON(500, { error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // --- Body ---
  let body: any;
  try {
    body = await req.json();
  } catch {
    return resJSON(400, { error: "Invalid JSON body" });
  }

  let { externalId, actionId, qty } = body || {};
  if (!externalId || !actionId) {
    return resJSON(400, { error: "externalId and actionId are required" });
  }
  // normaliza
  externalId = String(externalId).trim();
  actionId = String(actionId).trim().toUpperCase();
  qty = Number.isFinite(Number(qty)) ? Math.max(1, parseInt(String(qty), 10)) : 1;

  // 1) Comprueba que el actionId exista en el catálogo
  const { data: cat, error: catErr } = await supabase
    .from("actions_catalog")
    .select("id,pillar,level_code,life_hours,life_days,point_value")
    .eq("id", actionId)
    .maybeSingle();

  if (catErr) {
    return resJSON(500, { error: "Select actions_catalog failed", details: catErr });
  }
  if (!cat) {
    return resJSON(404, { error: "actionId not found in actions_catalog", actionId });
  }

  const life_hours = Number(cat.life_hours || 0) * qty;
  const life_days = Number(cat.life_days || 0) * qty;
  const points = Number(cat.point_value || 0) * qty;

  // 2) Inserta en action_logs
  const insertRow = {
    user_external_id: externalId,
    action_id: actionId,
    qty,
    points,
    life_hours,
    life_days,
    pillar: cat.pillar,
    level_code: cat.level_code,
  };

  const { data: ins, error: insErr } = await supabase
    .from("action_logs")
    .insert(insertRow)
    .select("id,created_at")
    .maybeSingle();

  if (insErr) {
    // devolvemos el error de supabase para depurar
    return resJSON(400, { error: "Insert in action_logs failed", details: insErr, row: insertRow });
  }

  return resJSON(200, { ok: true, id: ins?.id, created_at: ins?.created_at });
}





