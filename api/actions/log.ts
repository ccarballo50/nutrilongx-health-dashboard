// /api/actions/log.ts
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const externalId = body.externalId ?? body.user_external_id;
    const actionId   = body.actionId   ?? body.action_id;
    const qty        = Number(body.qty ?? 1);

    if (!externalId || !actionId) {
      return res.status(400).json({ error: 'externalId and actionId are required' });
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    const url = `${SUPABASE_URL}/rest/v1/action_logs`;

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([{
        user_external_id: externalId,
        action_id: actionId,
        qty
      }])
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.status(201).json({ ok: true, inserted: data });
  } catch (e:any) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}

