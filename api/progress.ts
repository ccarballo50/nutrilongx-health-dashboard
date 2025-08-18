// api/progress.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SB_URL = process.env.SUPABASE_URL!;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const externalId = String(req.query.externalId || req.query.externalid || '').trim();
    if (!externalId) return res.status(400).json({ error: 'externalId requerido' });
    if (!SB_URL || !SB_SERVICE) return res.status(500).json({ error: 'Credenciales de Supabase faltan' });

    // 1) Logs del usuario
    const logsResp = await fetch(
      `${SB_URL}/rest/v1/action_logs?user_external_id=eq.${encodeURIComponent(externalId)}&select=action_id,qty,created_at`,
      {
        headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, Prefer: 'count=exact' }
      }
    );
    if (!logsResp.ok) {
      const tx = await logsResp.text();
      return res.status(502).json({ error: 'Error leyendo action_logs', details: tx });
    }
    const logs: Array<{ action_id: string; qty: number; created_at: string }> = await logsResp.json();
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(200).json({ externalId, total_days: 0, total_hours: 0, by_pillar: {}, recent: [] });
    }

    // 2) Catálogo para esos IDs
    const ids = Array.from(new Set(logs.map(l => l.action_id))).filter(Boolean);
    const inClause = `in.(${ids.map(x => `"${x}"`).join(',')})`;
    const catResp = await fetch(
      `${SB_URL}/rest/v1/actions_catalog?id=${inClause}&select=id,title,pillar,life_hours,life_days`,
      { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } }
    );
    if (!catResp.ok) {
      const tx = await catResp.text();
      return res.status(502).json({ error: 'Error leyendo actions_catalog', details: tx });
    }
    const catalog: Array<{ id: string; title: string; pillar: string; life_hours: number; life_days: number }> =
      await catResp.json();
    const catMap = new Map(catalog.map(c => [c.id, c]));

    // 3) Agregados
    let total_hours = 0;
    const by_pillar: Record<string, number> = {};
    for (const l of logs) {
      const c = catMap.get(l.action_id);
      if (!c) continue;
      const hours = (c.life_hours ?? 0) * (l.qty ?? 0);
      total_hours += hours;
      const days = hours / 24;
      by_pillar[c.pillar] = (by_pillar[c.pillar] ?? 0) + days;
    }

    // 4) Últimas 20 acciones con título y pilar
    const recent = logs
      .map(l => ({ ...l, cat: catMap.get(l.action_id) }))
      .filter(x => !!x.cat)
      .sort((a, b) => a.created_at < b.created_at ? 1 : -1)
      .slice(0, 20)
      .map(x => ({
        action_id: x.action_id,
        title: x.cat!.title,
        pillar: x.cat!.pillar,
        qty: x.qty,
        created_at: x.created_at
      }));

    return res.status(200).json({
      externalId,
      total_days: total_hours / 24,
      total_hours,
      by_pillar,
      recent
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

