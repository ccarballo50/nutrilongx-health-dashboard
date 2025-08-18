// api/actions/log.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SB_URL = process.env.SUPABASE_URL!;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { externalId, actionId, qty } = req.body || {};
    const qtyNum = Number(qty ?? 1);

    if (!externalId || !actionId || isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ error: 'externalId, actionId y qty>0 son obligatorios' });
    }
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: 'Faltan credenciales de Supabase en el servidor' });
    }

    // (Opcional) valida que el actionId exista
    {
      const r = await fetch(`${SB_URL}/rest/v1/actions_catalog?id=eq.${encodeURIComponent(actionId)}`, {
        headers: {
          apikey: SB_SERVICE,
          Authorization: `Bearer ${SB_SERVICE}`,
          Prefer: 'count=exact'
        }
      });
      if (!r.ok) {
        const tx = await r.text();
        return res.status(502).json({ error: 'Error validando actionId', details: tx });
      }
      const arr = await r.json();
      if (!Array.isArray(arr) || arr.length === 0) {
        return res.status(400).json({ error: `actionId no existe en catálogo: ${actionId}` });
      }
    }

    // Inserta log
    const payload = {
      user_external_id: externalId, // << clave: columna correcta
      action_id: actionId,
      qty: qtyNum,
      created_at: new Date().toISOString()
    };

    const resp = await fetch(`${SB_URL}/rest/v1/action_logs`, {
      method: 'POST',
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { /* puede venir vacío */ }

    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Insert en action_logs falló', details: text });
    }

    return res.status(200).json({ ok: true, row: Array.isArray(data) ? data[0] : data || payload });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}


