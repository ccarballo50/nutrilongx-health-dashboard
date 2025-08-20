// api/actions/log.ts — versión REST, con rutas de prueba y timeouts claros
export const config = { runtime: 'nodejs' };

const SB_URL = process.env.SUPABASE_URL as string;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

function headersJSON() {
  return {
    'content-type': 'application/json',
    apikey: SB_SERVICE,
    Authorization: `Bearer ${SB_SERVICE}`,
  };
}

// timeout helper
function withTimeout<T>(p: Promise<T>, ms: number, stage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout at ${stage} (${ms}ms)`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

export default async function handler(req: any, res: any) {
  try {
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: 'Credenciales de Supabase faltan', stage: 'env' });
    }
    const base = `${SB_URL}/rest/v1`;

    // --- Modo ping (comprobar despliegue)
    if (req.method === 'GET' && req.query?.ping === '1') {
      return res.status(200).json({ ok: true, stage: 'alive' });
    }

    // --- Modo test de catálogo (GET /api/actions/log?check=catalog&actionId=ALI-BRO-043)
    if (req.method === 'GET' && req.query?.check === 'catalog') {
      const actionId = String(req.query.actionId || '').trim().toUpperCase();
      if (!actionId) return res.status(400).json({ error: 'actionId requerido', stage: 'validate' });

      const url = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=id,title,points_value,life_value&limit=1`;
      const r = await withTimeout(fetch(url, { headers: headersJSON() }), 8000, 'catalog-lookup');
      const txt = await r.text();
      const data = txt ? JSON.parse(txt) : [];
      return r.ok
        ? res.status(200).json({ ok: true, count: data.length, item: data[0] || null, stage: 'catalog' })
        : res.status(r.status).send(txt);
    }

    // --- Modo dry-run (GET /api/actions/log?dry=1&externalId=demo-1&actionId=ALI-BRO-043&qty=1)
    if (req.method === 'GET' && req.query?.dry === '1') {
      const externalId = String(req.query.externalId || '').trim();
      const actionId   = String(req.query.actionId   || '').trim().toUpperCase();
      const qty        = Number(req.query.qty || 0);
      if (!externalId || !actionId || !qty) return res.status(400).json({ error: 'params inválidos', stage: 'validate' });

      const catURL = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=id,title,points_value,life_value&limit=1`;
      const rc = await withTimeout(fetch(catURL, { headers: headersJSON() }), 8000, 'catalog-lookup');
      const catTxt = await rc.text();
      if (!rc.ok) return res.status(rc.status).send(catTxt);
      const cat = (catTxt ? JSON.parse(catTxt) : [])[0];
      if (!cat) return res.status(404).json({ error: 'actionId no existe', stage: 'catalog' });

      const points = Number(cat.points_value || 0) * qty;
      const life   = Number(cat.life_value   || 0) * qty;

      return res.status(200).json({
        ok: true, stage: 'dry',
        would_insert: { external_id: externalId, action_id: actionId, qty, points, life, title: cat.title ?? null }
      });
    }

    // --- POST normal (inserta)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const raw = req.body ?? {};
    const body = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;

    const externalId = String(body.externalId || '').trim();
    const actionId   = String(body.actionId   || '').trim().toUpperCase();
    const qty        = Number(body.qty || 0);

    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'externalId, actionId y qty (>0) son obligatorios', stage: 'validate' });
    }

    // 1) catálogo
    const catURL = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=id,title,points_value,life_value&limit=1`;
    const rc = await withTimeout(fetch(catURL, { headers: headersJSON() }), 8000, 'catalog-lookup');
    const catTxt = await rc.text();
    if (!rc.ok) return res.status(rc.status).send(catTxt);
    const cat = (catTxt ? JSON.parse(catTxt) : [])[0];
    if (!cat) return res.status(404).json({ error: 'actionId no existe en catálogo', stage: 'catalog' });

    const points = Number(cat.points_value || 0) * qty;
    const life   = Number(cat.life_value   || 0) * qty;

    // 2) insert
    const row = { external_id: externalId, action_id: actionId, qty, points, life, title: cat.title ?? null };
    const insURL = `${base}/action_logs?return=representation`;
    const ri = await withTimeout(
      fetch(insURL, { method: 'POST', headers: headersJSON(), body: JSON.stringify(row) }),
      8000,
      'insert'
    );
    const insTxt = await ri.text();
    if (!ri.ok) return res.status(ri.status).send(insTxt);
    const rep = insTxt ? JSON.parse(insTxt) : [];
    const inserted = rep[0] ?? null;

    return res.status(200).json({ ok: true, id: inserted?.id, created_at: inserted?.created_at, stage: 'done' });
  } catch (e: any) {
    return res.status(500).json({ error: 'Unhandled exception', details: String(e?.message || e), stage: 'catch' });
  }
}






