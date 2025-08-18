// /api/actions/log.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(url, key);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { externalId, actionId, qty } = (req.body ?? {}) as {
      externalId?: string; actionId?: string; qty?: number;
    };

    if (!externalId || !actionId) {
      return res.status(400).json({ error: 'externalId y actionId son obligatorios' });
    }

    const n = Number.isFinite(qty) ? Math.max(1, Math.floor(qty!)) : 1;

    const { error } = await supabase
      .from('action_logs')
      .insert([{ external_id: externalId, action_id: actionId, qty: n }]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'unexpected error' });
  }
}

