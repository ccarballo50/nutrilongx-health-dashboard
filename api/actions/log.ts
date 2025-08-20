// api/actions/log.ts  — versión instrumentada con timeouts y “stages”
export const config = { runtime: 'nodejs' };

import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL as string;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Helper de timeout
function withTimeout<T>(p: Promise<T>, ms: number, stage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout at ${stage} (${ms}ms)`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

export default async function handler(req: any, res: any) {
  // Ping rápido para comprobar despliegue (GET /api/actions/log?ping=1)
  if (req.method === 'GET' && req.query?.ping === '1') {
    return res.status(200).json({ ok: true, stage: 'alive' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // STAGE 1: variables
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: 'Credenciales de Supabase faltan', stage: 'env' });
    }

    // STAGE 2: parse body (cubrir string/objeto)
    const raw = req.body ?? {};
    const body = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
    const externalId = String(body.externalId || '').trim();
    const actionId   = String(body.actionId || '').trim().toUpperCase();
    const qty        = Number(body.qty || 0);

    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'externalId, actionId y qty (>0) son obligatorios', stage: 'validate' });
    }

    // STAGE 3: cliente supabase
    const sb = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });

    // STAGE 4: lookup catálogo con timeout
    const { data: act, error: actErr } = await withTimeout(
      sb.from('actions_catalog')
        .select('id,title,points_value,life_value')
        .eq('id', actionId)
        .maybeSingle(),
      8000,
      'catalog-lookup'
    );

    if (actErr)  return res.status(400).json({ error: 'Catalog lookup failed', details: actErr, stage: 'catalog' });
    if (!act)    return res.status(404).json({ error: 'actionId no existe en catálogo', stage: 'catalog' });

    const points = Number(act.points_value || 0) * qty;
    const life   = Number(act.life_value || 0)   * qty;

    // STAGE 5: insert con timeout
    const insertRow = { external_id: externalId, action_id: actionId, qty, points, life, title: act.title ?? null };

    const { data: ins, error: insErr } = await withTimeout(
      sb.from('action_logs').insert(insertRow).select('id, created_at').maybeSingle(),
      8000,
      'insert'
    );

    if (insErr) return res.status(400).json({ error: 'Insert in action_logs failed', details: insErr, row: insertRow, stage: 'insert' });

    // STAGE 6: ok
    return res.status(200).json({ ok: true, id: ins?.id, created_at: ins?.created_at, stage: 'done' });
  } catch (e: any) {
    // captura cualquier excepción (incluido timeout)
    return res.status(500).json({ error: 'Unhandled exception', details: String(e?.message || e), stage: 'catch' });
  }
}






