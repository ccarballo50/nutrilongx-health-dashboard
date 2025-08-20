// api/actions/log.ts — inserción mínima y estable (external_id, action_id, qty)
export const config = { runtime: "nodejs" };

const SB_URL = process.env.SUPABASE_URL as string;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const base = `${(SB_URL || "").replace(/\/$/, "")}/rest/v1`;

const H = {
  "content-type": "application/json",
  apikey: SB_SERVICE,
  Authorization: `Bearer ${SB_SERVICE}`,
  Prefer: "return=representation",
};

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
      return res.status(500).json({ error: "Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY", stage: "env" });
    }

    // Ping
    if (req.method === "GET" && req.query?.ping === "1") {
      return res.status(200).json({ ok: true, stage: "alive" });
    }

    // Validación + método
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const raw = req.body ?? {};
    const body = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
    const externalId = String(body.externalId || "").trim();
    const actionId   = String(body.actionId   || "").trim().toUpperCase();
    const qty        = Number(body.qty || 0);
    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "externalId, actionId y qty (>0) son obligatorios", stage: "validate" });
    }

    // 1) Comprueba que la acción existe (sin columnas opcionales)
    {
      const url = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=${encodeURIComponent("id")}&limit=1`;
      const r = await withTimeout(fetch(url, { headers: H }), 8000, "catalog-select");
      if (!r.ok) {
        const txt = await r.text();
        return res.status(r.status).send(txt);
      }
      const arr = await r.json();
      if (!Array.isArray(arr) || !arr.length) {
        return res.status(404).json({ error: "actionId no existe", stage: "catalog" });
      }
    }

    // 2) Inserta SÓLO lo mínimo (evita PGRST204 por columnas ajenas)
    const row = { external_id: externalId, action_id: actionId, qty };
    const ri = await withTimeout(
      fetch(`${base}/action_logs`, {
        method: "POST",
        headers: H,
        body: JSON.stringify(row),
      }),
      8000,
      "insert"
    );
    const txt = await ri.text();
    if (!ri.ok) return res.status(ri.status).send(txt);

    // Representation (si la tabla la soporta). Si no, devolvemos ok sin rep.
    let rep: any = null;
    try { rep = txt ? JSON.parse(txt) : null; } catch {}

    const inserted = Array.isArray(rep) ? rep[0] : rep;
    return res.status(200).json({
      ok: true,
      stage: "done",
      id: inserted?.id ?? null,
      created_at: inserted?.created_at ?? null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: "Unhandled exception", details: String(e?.message || e), stage: "catch" });
  }
}





