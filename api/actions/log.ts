// api/actions/log.ts
// Inserta en action_logs leyendo level/pillar/life_days del catálogo
// y calculando base_hours = life_days * 24 (redondeado a 2 decimales).

export const config = { runtime: "nodejs" };

const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BASE = `${SB_URL}/rest/v1`;

const H = {
  apikey: SB_SERVICE,
  Authorization: `Bearer ${SB_SERVICE}`,
  "content-type": "application/json",
  Prefer: "return=representation",
};

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, data, raw: text };
}

export default async function handler(req: any, res: any) {
  try {
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" });
    }
    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Admitimos GET (dry-run) y POST (real)
    const input =
      req.method === "GET"
        ? req.query
        : typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const externalId = String(input.externalId || "").trim();
    const actionId = String(input.actionId || "").trim().toUpperCase();
    const qty = Number(input.qty || 0);
    const dry = String(input.dry || "").trim() === "1" || String(input.check || "").trim() === "catalog";

    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "externalId, actionId y qty (>0) son obligatorios" });
    }

    // 1) Leer del catálogo lo que la BD necesita
    const sel = encodeURIComponent("id,level,pillar,life_days");
    const catURL = `${BASE}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=${sel}&limit=1`;
    const cat = await fetchJSON(catURL, { headers: H });
    if (!cat.ok) return res.status(cat.status).send(cat.raw);
    const row = (cat.data || [])[0];
    if (!row) return res.status(404).json({ error: "actionId no existe en catálogo" });

    const lifeDays = Number(row.life_days ?? 0);
    const base_hours = r2(lifeDays * 24);

    if (dry) {
      return res.status(200).json({
        ok: true,
        stage: "dry",
        catalog_row: { id: row.id, level: row.level, pillar: row.pillar, life_days: lifeDays },
        payload_base: {
          user_external_id: externalId,
          action_id: actionId,
          qty,
          level: row.level,
          pillar: row.pillar,
          base_hours,
        },
      });
    }

    // 2) Insertar en action_logs (solo las columnas que tu tabla exige)
    const insertRow = {
      user_external_id: externalId,
      action_id: actionId,
      qty,
      level: row.level,
      pillar: row.pillar,
      base_hours, // numeric
    };

    const ins = await fetchJSON(`${BASE}/action_logs`, {
      method: "POST",
      headers: H,
      body: JSON.stringify([insertRow]),
    });
    if (!ins.ok) return res.status(ins.status).send(ins.raw);

    const inserted = Array.isArray(ins.data) ? ins.data[0] : ins.data;
    return res.status(200).json({
      ok: true,
      id: inserted?.id ?? null,
      created_at: inserted?.created_at ?? null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: "Unhandled exception", details: String(e?.message || e) });
  }
}





