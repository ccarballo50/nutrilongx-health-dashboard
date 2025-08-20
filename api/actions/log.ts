// api/actions/log.ts — versión REST que se adapta a tu esquema real
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
const base = `${(SB_URL || '').replace(/\/$/, '')}/rest/v1`;

// helper num
const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

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
      return res.status(500).json({ error: 'Faltan SUPABASE_URL/SERVICE_ROLE', stage: 'env' });
    }

    // ---- Pings de diagnóstico ----
    if (req.method === 'GET' && req.query?.ping === '1') {
      return res.status(200).json({ ok: true, stage: 'alive' });
    }
    if (req.method === 'GET' && req.query?.check === 'catalog') {
      const actionId = String(req.query.actionId || '').trim().toUpperCase();
      if (!actionId) return res.status(400).json({ error: 'actionId requerido', stage: 'validate' });

      // Pedimos todas las variantes posibles; PostgREST ignorará las que no existan
      const select = encodeURIComponent([
        'id','title',
        'life_days','life_hours','life_value',
        'points_value','points'
      ].join(','));

      const url = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=${select}&limit=1`;
      const r = await withTimeout(fetch(url, { headers: headersJSON() }), 8000, 'catalog-lookup');
      const txt = await r.text();
      return r.ok ? res.status(200).send(txt) : res.status(r.status).send(txt);
    }
    if (req.method === 'GET' && req.query?.dry === '1') {
      const externalId = String(req.query.externalId || '').trim();
      const actionId   = String(req.query.actionId   || '').trim().toUpperCase();
      const qty        = Number(req.query.qty || 0);
      if (!externalId || !actionId || !qty) return res.status(400).json({ error: 'params inválidos', stage: 'validate' });

      const catSel = encodeURIComponent('id,title,life_days,life_hours,life_value,points_value,points');
      const catURL = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=${catSel}&limit=1`;
      const rc = await withTimeout(fetch(catURL, { headers: headersJSON() }), 8000, 'catalog-lookup');
      const cat = ((await rc.json()) as any[])[0];
      if (!cat) return res.status(404).json({ error: 'actionId no existe', stage: 'catalog' });

      const lifeDays =
        num(cat.life_value) ??
        num(cat.life_days) ??
        (num(cat.life_hours) ? num(cat.life_hours)! / 24 : 0) ?? 0;

      const points =
        num(cat.points_value) ??
        num(cat.points) ??
        Math.round((lifeDays || 0) * 10); // TODO: aplica tu fórmula real

      const row = { external_id: externalId, action_id: actionId, qty, points, life: lifeDays, title: cat.title ?? null };
      return res.status(200).json({ ok: true, stage: 'dry', would_insert: row, cat });
    }

    // ---- POST normal ----
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const raw = req.body ?? {};
    const body = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
    const externalId = String(body.externalId || '').trim();
    const actionId   = String(body.actionId   || '').trim().toUpperCase();
    const qty        = Number(body.qty || 0);
    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'externalId, actionId y qty (>0) son obligatorios', stage: 'validate' });
    }

    const catSel = encodeURIComponent('id,title,life_days,life_hours,life_value,points_value,points');
    const catURL = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=${catSel}&limit=1`;
    const rc = await withTimeout(fetch(catURL, { headers: headersJSON() }), 8000, 'catalog-lookup');
    if (!rc.ok) {
      const txt = await rc.text();
      return res.status(rc.status).send(txt);
    }
    const cat = ((await rc.json()) as any[])[0];
    if (!cat) return res.status(404).json({ error: 'actionId no existe en catálogo', stage: 'catalog' });

    const lifeDays =
      num(cat.life_value) ??
      num(cat.life_days) ??
      (num(cat.life_hours) ? num(cat.life_hours)! / 24 : 0) ?? 0;

    const points =
      num(cat.points_value) ??
      num(cat.points) ??
      Math.round((lifeDays || 0) * 10); // TODO: define tu conversión

    const row = { external_id: externalId, action_id: actionId, qty, points, life: lifeDays, title: cat.title ?? null };

    const insURL = `${base}/action_logs?return=representation`;
    const ri = await withTimeout(fetch(insURL, { method: 'POST', headers: headersJSON(), body: JSON.stringify(row) }), 8000, 'insert');
    const txt = await ri.text();
    if (!ri.ok) return res.status(ri.status).send(txt);

    const rep = txt ? JSON.parse(txt) : [];
    const inserted = rep[0] ?? null;
    return res.status(200).json({ ok: true, id: inserted?.id, created_at: inserted?.created_at, stage: 'done' });
  } catch (e: any) {
    return res.status(500).json({ error: 'Unhandled exception', details: String(e?.message || e), stage: 'catch' });
  }
}






