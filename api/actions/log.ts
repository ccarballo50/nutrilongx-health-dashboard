// api/actions/log.ts — adaptativo (sin cálculos) + modos de test + GET insert
export const config = { runtime: "nodejs" };

const SB_URL = process.env.SUPABASE_URL as string;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const base = `${(SB_URL || "").replace(/\/$/, "")}/rest/v1`;

const H = {
  "content-type": "application/json",
  apikey: SB_SERVICE,
  Authorization: `Bearer ${SB_SERVICE}`,
};

function withTimeout<T>(p: Promise<T>, ms: number, stage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout at ${stage} (${ms}ms)`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}
function isMissingColumn(txt: string) {
  try {
    const j = JSON.parse(txt);
    if (j?.code === "42703") return true;
    if (typeof j?.message === "string" && j.message.includes("does not exist")) return true;
  } catch {}
  return typeof txt === "string" && txt.includes("does not exist");
}

// 1) SELECT seguro sobre catálogo (prueba varias columnas hasta que pase)
async function selectCatalogRow(actionId: string) {
  const candidates = [
    ["id","title","life_days","points"],
    ["id","title","life_hours","points"],
    ["id","title","life_days"],
    ["id","title","life_hours"],
    ["id","title"],
  ];
  const tried: Array<{sel:string,status:number}> = [];
  for (const cols of candidates) {
    const sel = encodeURIComponent(cols.join(","));
    const url = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=${sel}&limit=1`;
    const r = await withTimeout(fetch(url, { headers: H }), 8000, "catalog-select");
    const txt = await r.text();
    if (r.ok) {
      const arr = txt ? JSON.parse(txt) : [];
      if (Array.isArray(arr) && arr.length) return { row: arr[0], used: cols };
      return { row: null, used: cols }; // select OK pero no hay fila -> actionId inexistente
    }
    if (isMissingColumn(txt)) { tried.push({ sel: cols.join(","), status: r.status }); continue; }
    throw new Error(`catalog ${r.status}: ${txt}`);
  }
  throw new Error(`No valid select; tried: ${tried.map(t=>t.sel).join(" | ")}`);
}

// 2) INSERT adaptativo sobre action_logs
async function insertLogAdaptive(payloadBase: Record<string, any>) {
  const variants: Record<string, any>[] = [
    payloadBase, // con life_days/points si vienen del catálogo
    (() => { const p={...payloadBase}; if(p.life_days!=null&&p.life_hours==null){p.life_hours=p.life_days; delete p.life_days;} return p; })(),
    (() => { const p={...payloadBase}; const v = p.life_days ?? p.life_hours; if(v!=null){delete p.life_days; delete p.life_hours; p.life = v;} return p; })(),
    (() => { const p={...payloadBase}; delete p.life_days; delete p.life_hours; delete p.life; delete p.points; return p; })(),
  ];

  for (const body of variants) {
    const r = await withTimeout(
      fetch(`${base}/action_logs?return=representation`, { method: "POST", headers: H, body: JSON.stringify(body) }),
      8000,
      "insert"
    );
    const txt = await r.text();
    if (r.ok) {
      const rep = txt ? JSON.parse(txt) : [];
      return rep[0] ?? null;
    }
    if (isMissingColumn(txt)) continue; // prueba siguiente variante
    throw new Error(`insert ${r.status}: ${txt}`);
  }
  throw new Error(`No insert variant accepted (columns mismatch)`);
}

function buildPayloadBase(catalogRow: any, externalId: string, actionId: string, qty: number) {
  const payload: Record<string, any> = {
    external_id: externalId,
    action_id: actionId,
    qty,
    title: catalogRow?.title ?? null,
  };
  if ("life_days"  in catalogRow) payload.life_days  = catalogRow.life_days;
  if ("life_hours" in catalogRow) payload.life_hours = catalogRow.life_hours;
  if ("points"     in catalogRow) payload.points     = catalogRow.points;
  return payload;
}

export default async function handler(req: any, res: any) {
  try {
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: "Faltan SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY", stage: "env" });
    }

    // Ping
    if (req.method === "GET" && req.query?.ping === "1") {
      return res.status(200).json({ ok: true, stage: "alive" });
    }

    // CHECK catálogo (diagnóstico)
    if (req.method === "GET" && req.query?.check === "catalog") {
      const actionId = String(req.query.actionId || "").trim().toUpperCase();
      if (!actionId) return res.status(400).json({ error: "actionId requerido", stage: "validate" });
      const { row, used } = await selectCatalogRow(actionId);
      if (!row) return res.status(404).json({ error: "actionId no existe", stage: "catalog" });
      return res.status(200).json({ ok: true, stage: "catalog", used, item: row });
    }

    // DRY-RUN (diagnóstico)
    if (req.method === "GET" && req.query?.dry === "1") {
      const externalId = String(req.query.externalId || "").trim();
      const actionId   = String(req.query.actionId   || "").trim().toUpperCase();
      const qty        = Number(req.query.qty || 0);
      if (!externalId || !actionId || !qty) return res.status(400).json({ error: "params inválidos", stage: "validate" });

      const { row, used } = await selectCatalogRow(actionId);
      if (!row) return res.status(404).json({ error: "actionId no existe", stage: "catalog" });

      const payloadBase = buildPayloadBase(row, externalId, actionId, qty);
      return res.status(200).json({ ok: true, stage: "dry", used, catalog_row: row, payload_base: payloadBase });
    }

    // ⚠️ GET insert (para probar inserción sin POST)
    if (req.method === "GET" && req.query?.insert === "1") {
      const externalId = String(req.query.externalId || "").trim();
      const actionId   = String(req.query.actionId   || "").trim().toUpperCase();
      const qty        = Number(req.query.qty || 0);
      if (!externalId || !actionId || !qty) return res.status(400).json({ error: "params inválidos", stage: "validate" });

      const { row } = await selectCatalogRow(actionId);
      if (!row) return res.status(404).json({ error: "actionId no existe", stage: "catalog" });

      const payloadBase = buildPayloadBase(row, externalId, actionId, qty);
      const inserted = await withTimeout(insertLogAdaptive(payloadBase), 10000, "insert-adaptive");
      return res.status(200).json({ ok: true, stage: "done", inserted });
    }

    // POST normal
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const raw = req.body ?? {};
    const body = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;

    const externalId = String(body.externalId || "").trim();
    const actionId   = String(body.actionId   || "").trim().toUpperCase();
    const qty        = Number(body.qty || 0);
    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "externalId, actionId y qty (>0) son obligatorios", stage: "validate" });
    }

    const { row } = await selectCatalogRow(actionId);
    if (!row) return res.status(404).json({ error: "actionId no existe en catálogo", stage: "catalog" });

    const payloadBase = buildPayloadBase(row, externalId, actionId, qty);
    const inserted = await withTimeout(insertLogAdaptive(payloadBase), 10000, "insert-adaptive");

    return res.status(200).json({ ok: true, stage: "done", id: inserted?.id, created_at: inserted?.created_at });
  } catch (e: any) {
    return res.status(500).json({ error: "Unhandled exception", details: String(e?.message || e), stage: "catch" });
  }
}





