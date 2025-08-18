// /api/actions/by-level.ts
import type { VercelRequest, VercelResponse } from "vercel";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const base = `${url}/rest/v1`;

const LEVEL_NAME_BY_NUMBER: Record<string, string> = {
  "0": "Inicial",
  "1": "Inicial",
  "2": "Bronce",
  "3": "Plata",
  "4": "Oro",
  "5": "Platino"
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const externalId = String(req.query.externalId || "");
    const pillar = req.query.pillar ? String(req.query.pillar) : undefined;

    if (!externalId) {
      res.status(400).json({ error: "externalId requerido" });
      return;
    }

    // 1) Obtener nivel numérico del usuario (notify_targets.level)
    const u = await fetch(
      `${base}/notify_targets?external_id=eq.${encodeURIComponent(externalId)}&select=level&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const uTxt = await u.text();
    if (!u.ok) return res.status(u.status).send(uTxt);
    const rows = uTxt ? JSON.parse(uTxt) : [];
    const levelNum: string = rows?.[0]?.level != null ? String(rows[0].level) : "1";
    const levelName = LEVEL_NAME_BY_NUMBER[levelNum] || "Inicial";

    // 2) Traer catálogo por nivel (y pilar si se envía)
    const filters = [
      `level=eq.${encodeURIComponent(levelName)}`
    ];
    if (pillar) filters.push(`pillar=eq.${encodeURIComponent(pillar)}`);

    const q = `${base}/actions_catalog?${filters.join("&")}&select=id,pillar,level,title,subpillar,unit,life_days,life_hours,rationale,source_ids&order=id.asc`;

    const r = await fetch(q, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const txt = await r.text();
    if (!r.ok) return res.status(r.status).send(txt);
    const data = txt ? JSON.parse(txt) : [];

    res.status(200).json({
      externalId,
      levelNum,
      levelName,
      count: data.length,
      items: data
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Unexpected error" });
  }
}
