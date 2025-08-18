// /api/progress.ts
import type { VercelRequest, VercelResponse } from "vercel";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const base = `${url}/rest/v1`;

type LogRow = { action_id: string; qty: number; created_at: string };
type CatRow = { id: string; pillar: string; life_days: number | string; life_hours: number | string; title?: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const externalId = String(req.query.externalId || req.query.externalid || "");
  if (!externalId) {
    res.status(400).json({ error: "externalId requerido" });
    return;
  }

  try {
    // 1) Logs del usuario
    const r1 = await fetch(
      `${base}/action_logs?user_external_id=eq.${encodeURIComponent(externalId)}&select=action_id,qty,created_at&order=created_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const logsTxt = await r1.text();
    if (!r1.ok) return res.status(r1.status).send(logsTxt);
    const logs: LogRow[] = logsTxt ? JSON.parse(logsTxt) : [];

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(200).json({
        externalId,
        total_days: 0,
        total_hours: 0,
        by_pillar: {},
        recent: []
      });
    }

    // 2) Catálogo para los IDs usados
    const ids = [...new Set(logs.map(l => l.action_id))];
    const inList = ids.map(x => `"${x}"`).join(",");
    const r2 = await fetch(
      `${base}/actions_catalog?id=in.(${inList})&select=id,pillar,life_days,life_hours,title`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const catTxt = await r2.text();
    if (!r2.ok) return res.status(r2.status).send(catTxt);
    const cats: CatRow[] = catTxt ? JSON.parse(catTxt) : [];

    const catById = new Map<string, CatRow>();
    for (const c of cats) catById.set(c.id, c);

    // 3) Sumas
    let totalDays = 0;
    let totalHours = 0;
    const byPillar: Record<string, number> = {};

    for (const l of logs) {
      const c = catById.get(l.action_id);
      if (!c) continue;
      const q = Number(l.qty) || 0;
      const d = Number(c.life_days) || 0;
      const h = Number(c.life_hours) || 0;
      totalDays += q * d;
      totalHours += q * h;
      const p = c.pillar || "Otros";
      byPillar[p] = (byPillar[p] || 0) + q * d;
    }

    // 4) Recientes (enriquecidos)
    const recent = logs.slice(0, 10).map(l => ({
      ...l,
      title: catById.get(l.action_id)?.title || l.action_id,
      pillar: catById.get(l.action_id)?.pillar || null
    }));

    res.status(200).json({
      externalId,
      total_days: Number(totalDays.toFixed(2)),
      total_hours: Number(totalHours.toFixed(2)),
      by_pillar: byPillar,
      recent
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Unexpected error" });
  }
}

