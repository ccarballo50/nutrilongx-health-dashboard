// api/actions/log.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SB_URL = process.env.SUPABASE_URL!;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // 1) Validación básica
    const { externalId, actionId, qty } = (req.body ?? {}) as {
      externalId?: string; actionId?: string; qty?: number | string;
    };
    const qtyNum = Number(qty ?? 1);

    if (!externalId || !actionId || isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({
        error: 'externalId, actionId y qty>0 son obligatorios',
        got: { externalId, actionId, qty },
      });
    }
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({
        error: 'Faltan credenciales de Supabase en el servidor',
        have: { SB_URL: !!SB_URL, SB_SERVICE: !!SB_SERVICE }
      });
    }

    // 2) Intento de inserción directo (dejamos que Supabase diga por qué falla)
    const payload = {
      user_external_id: String(externalId).trim(),  // <- columna correcta
      action_id: String(actionId).trim(),           // <- FKey al catálogo
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
      // devolvemos TODO para ver exactamente qué está diciendo PostgREST
      return res.status(resp.status).json({
        error: 'Insert en action_logs falló',
        supabase: text || '(sin cuerpo)',
        payload,
      });
    }

    // 3) OK
    return res.status(200).json({
      ok: true,
      row: Array.isArray(data) ? data[0] : data || payload
    });

  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}



