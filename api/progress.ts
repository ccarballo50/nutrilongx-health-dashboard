// api/progress.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const externalId = String(req.query.externalId || '');
  if (!externalId) {
    res.status(400).json({ error: 'externalId requerido' });
    return;
  }
  try {
    // Totales
    const totalsUrl = `${SUPABASE_URL}/rest/v1/action_logs?external_id=eq.${encodeURIComponent(externalId)}&select=points,life_days`;
    const totResp = await fetch(totalsUrl, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }});
    const rows = await totResp.json();
    const points = rows.reduce((a: number, r: any) => a + Number(r.points || 0), 0);
    const lifeDays = rows.reduce((a: number, r: any) => a + Number(r.life_days || 0), 0);

    // Últimas 10 acciones con título
    const lastUrl = `${SUPABASE_URL}/rest/v1/action_logs?external_id=eq.${encodeURIComponent(externalId)}&select=created_at,qty,action_id,actions_catalog(title, pillar, level)&order=created_at.desc&limit=10`;
    const lastResp = await fetch(lastUrl, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }});
    const last = await lastResp.json();

    res.status(200).json({ externalId, points, lifeDays, last });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}
