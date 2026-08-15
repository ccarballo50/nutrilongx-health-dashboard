// /api/admin/actions/import.ts

// Nota: se usa ruta relativa (no el alias '@lib') porque el bundler de
// funciones serverless de Vercel no garantiza resolver los path aliases de
// tsconfig/vite para el directorio /api — el resto de endpoints ya usaban
// rutas relativas por este motivo.
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isAdminAuthorized, sendUnauthorizedNode } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (!isAdminAuthorized(req.headers['x-admin-key'])) return sendUnauthorizedNode(res);
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

