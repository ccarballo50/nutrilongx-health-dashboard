// api/actions/log.ts
// No importes @vercel/node: evita que el bundler del front analice tipos de Node.

const SB_URL = process.env.SUPABASE_URL!;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { externalId, actionId, qty } = body;
    const qtyNum = Number(qty ?? 1);

    if (!externalId || !actionId || isNaN(qtyNum) || qtyNum <= 0) {
      res.status(400).json({
        error: 'externalId, actionId y qty>0 son obligatorios',
        got: { externalId, actionId, qty },
      });
      return;
    }
    if (!SB_URL || !SB_SERVICE) {
      res.status(500).json({
        error: 'Faltan credenciales de Supabase en el servidor',
        have: { SB_URL: !!SB_URL, SB_SERVICE: !!SB_SERVICE }
      });
      return;
    }

    const payload = {
      user_external_id: String(externalId).trim(),
      action_id: String(actionId).trim(),
      qty: qtyNum,
      created_at: new Date().toISOString(),
    };

    const resp = await fetch(`${SB_URL}/rest/v1/action_logs`, {
      method: 'POST',
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { /* puede venir vacío */ }

    if (!resp.ok) {
      res.status(resp.status).json({
        error: 'Insert en action_logs falló',
        supabase: text || '(sin cuerpo)',
        payload,
      });
      return;
    }

    res.status(200).json({
      ok: true,
      row: Array.isArray(data) ? data[0] : data || payload,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}




