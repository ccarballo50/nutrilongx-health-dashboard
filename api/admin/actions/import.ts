// /api/admin/actions/import.ts

import { supabaseAdmin } from '@lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { actions = [], sources = [] } = req.body ?? {};

const supabase = supabaseAdmin();

  if (sources.length) {
    const r1 = await supabase.from('sources').upsert(sources, { onConflict: 'id' });
    if (r1.error) return res.status(400).json(r1.error);
  }
  if (actions.length) {
    const r2 = await supabase.from('actions_catalog').upsert(actions, { onConflict: 'id' });
    if (r2.error) return res.status(400).json(r2.error);
  }
  return res.status(200).json({ ok: true, actions: actions.length, sources: sources.length });
}

