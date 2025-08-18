// api/actions/log.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PTS_PER_DAY  = Number(process.env.ENGINE_POINTS_PER_DAY ?? 50); // 50 pts por día-vida

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { externalId, actionId, qty = 1 } = req.body || {};
    if (!externalId || !actionId) {
      res.status(400).json({ error: 'externalId y actionId son obligatorios' });
      return;
    }

    // 1) Obtener la acción del catálogo
    const catUrl = `${SUPABASE_URL}/rest/v1/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=id,life_days`;
    const catResp = await fetch(catUrl, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    const cat = await catResp.json();
    if (!Array.isArray(cat) || cat.length === 0) {
      res.status(404).json({ error: 'Acción no encontrada en catálogo' });
      return;
    }
    const baseDays = Number(cat[0].life_days || 0);
    const lifeDays = baseDays * Number(qty);
    const points   = Math.round(lifeDays * PTS_PER_DAY);

    // 2) Insertar log
    const insertUrl = `${SUPABASE_URL}/rest/v1/action_logs`;
    const payload = [{
      external_id: externalId,
      action_id: actionId,
      qty: qty,
      life_days: lifeDays,
      points: points,
      source: 'manual'
    }];
    const ins = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });
    if (!ins.ok) {
      const t = await ins.text();
      res.status(ins.status).send(t);
      return;
    }
    const inserted = await ins.json();

    res.status(200).json({ ok: true, awarded: { lifeDays, points }, row: inserted[0] });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}
