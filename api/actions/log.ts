// api/actions/log.ts
export const config = { runtime: 'nodejs' };

import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL as string;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: 'Credenciales de Supabase faltan' });
    }

    // req.body puede venir string u objeto
    const raw = req.body ?? {};
    const body = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;

    const externalId = String(body.externalId || '').trim();
    const actionId   = String(body.actionId || '').trim().toUpperCase();
    const qty        = Number(body.qty || 0);

    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'externalId, actionId y qty (>0) son obligatorios' });
    }

    const sb = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });

    // 1) Verifica acción
    const { data: act, error: actErr } = await sb
      .from('actions_catalog')
      .select('id,title,points_value,life_value')
      .eq('id', actionId)
      .maybeSingle();
    if (actErr)  return res.status(400).json({ error: 'Catalog lookup failed', details: actErr });
    if (!act)    return res.status(404).json({ error: 'actionId no existe en catálogo' });

    const points = Number(act.points_value || 0) * qty;
    const life   = Number(act.life_value || 0)   * qty;

    // 2) Inserta log
    const insertRow = {
      external_id: externalId,
      action_id: actionId,
      qty,
      points,
      life,
      title: act.title ?? null,
    };

    const { data: ins, error: insErr } = await sb
      .from('action_logs')
      .insert(insertRow)
      .select('id, created_at')
      .maybeSingle();
    if (insErr) {
      return res.status(400).json({ error: 'Insert in action_logs failed', details: insErr, row: insertRow });
    }

    return res.status(200).json({ ok: true, id: ins?.id, created_at: ins?.created_at });
  } catch (e: any) {
    console.error('[actions/log] exception', e);
    return res.status(500).json({ error: 'Unhandled exception', details: String(e?.message || e) });
  }
}






