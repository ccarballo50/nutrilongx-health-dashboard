// /api/actions/log.ts
import type { VercelRequest, VercelResponse } from "vercel";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const base = `${url}/rest/v1`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const { externalId, actionId, qty = 1 } = req.body || {};
    if (!externalId || !actionId) {
      res.status(400).json({ error: "externalId y actionId son obligatorios" });
      return;
    }

    const payload = [{
      user_external_id: String(externalId),
      action_id: String(actionId),
      qty: Number(qty) || 1,
      channel: "app",
      meta: null
    }];

    const r = await fetch(`${base}/action_logs`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });

    const txt = await r.text();
    if (!r.ok) {
      res.status(r.status).send(txt);
      return;
    }

    res.status(200).json({ ok: true, inserted: JSON.parse(txt) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Unexpected error" });
  }
}

