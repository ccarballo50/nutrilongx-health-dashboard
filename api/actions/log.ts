// api/actions/log.ts — Adaptativo sin introspección (prueba select/insert hasta que funcione)
export const config = { runtime: "nodejs" };

const SB_URL = process.env.SUPABASE_URL as string;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const base = `${(SB_URL || "").replace(/\/$/, "")}/rest/v1`;

const H = {
  "content-type": "application/json",
  apikey: SB_SERVICE,
  Authorization: `Bearer ${SB_SERVICE}`,
};

// timeout helper
function withTimeout<T>(p: Promise<T>, ms: number, stage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout at ${stage} (${ms}ms)`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

// detecta “column ... does not exist”
function isMissingColumn(respText: string) {
  try {
    const j = JSON.parse(respText);
    if (j?.code === "42703") return true;
    if (typeof j?.message === "string" && j.message.includes("does not exist")) return true;
  } catch {}
  return typeof respText === "string" && respText.includes("does not exist");
}

// intenta varios SELECT hasta que alguno funcione (sin pedir columnas que no haya)
async function selectCatalogRow(actionId: string) {
  const candidates = [
    ["id","title","life_days","points"],
    ["id","title","life_hours","points"],
    ["id","title","life_days"],
    ["id","title","life_hours"],
    ["id","title"],
  ];
  const tried: Array<{sel:string, status:number, body:string}> = [];

  for (const cols of candidates) {
    const sel = encodeURIComponent(cols.join(","));
    const url = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=${sel}&limit=1`;
    const r = await withTimeout(fetch(url, { headers: H }), 8000, "catalog-select");
    const txt = await r.text();
    if (r.ok) {
      const arr = txt ? JSON.parse(txt) : [];
      if (Array.isArray(arr) && arr.length) return { row: arr[0], used: cols };
      // existe el select, pero no hay fila -> no existe la acción
      return { row: null, used: cols };
    }
    if (isMissingColumn(txt)) {
      tried.push({ sel: cols.join(","), status: r.status, body: txt });
      continue; // probamos el siguiente select
    }
    // otro error: devolvemos para diagnosticar
    throw new Error(`catalog ${r.status}: ${txt}`);
  }
  // si todos fallaron por columnas inexistentes, lo reportamos
  throw new Error(`No valid select; tried: ${tried.map(t => t.sel).join(" | ")}`);
}

// inserta probando varias cargas útiles hasta que alguna pase (sin “calcular”)
async function insertLogAdaptive(payloadBase: Record<string, any>) {
  const variants: Record<string, any>[] = [
    // intentamos con life_days + points si están en el catálogo
    payloadBase,
    // si venían life_days del catálogo, intentamos también con life_hours (por si logs usa esa)
    (() => {
      const p = { ...payloadBase };
      if (p.life_days != null && p.life_hours == null) {
        p.life_hours = p.life_days; delete p.life_days;
      }
      return p;
    })(),
    // sólo life (por si logs usa 'life' a secas)
    (() => {
      const p = { ...payloadBase };
      const v = p.life_days ?? p.life_hours;
      if (v != null) {
        delete p.life_days; delete p.life_hours;
        p.life = v;
      }
      return p;
    })(),
    // mínimo: sin vida ni puntos (deja que la BD/trigger los calcule si existe)
    (() => {
      const p = { ...payloadBase };
      delete p.life_days; delete p.life_hours; delete p.life; delete p.points;
      return p;
    })(),
  ];

  const tried: Array<{status:number, body:string}> = [];
  for (const body of variants) {
    const r = await withTimeout(
      fetch(`${base}/action_logs?return=representation`, {
        method: "POST",
        headers: H,
        body: JSON.stringify(body),
      }),
      8000,
      "insert"
    );
    const txt = await r.text();
    if (r.ok) {
      const rep = txt ? JSON.parse(txt) : [];
      return rep[0] ?? null;
    }
    if (isMissingColumn(txt)) {
      tried.push({ status: r.status, body: txt });
      continue; // probamos con la siguiente variante
    }
    throw new Error(`insert ${r.status}: ${txt}`);
  }
  throw new Error(`No insert variant accepted (columns mismatch). Last errors: ${tried.map(t => t.body).join(" | ")}`);
}

export default async function handler(req: any, res: any) {
  try {
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: "Faltan SUPABASE_URL/SERVICE_ROLE", stage: "env" });
    }

    // Ping
    if (req.method === "GET" && req.query?.ping === "1") {
      return res.status(200).json({ ok: true, stage: "alive" });
    }

    // Diagnóstico: check=catalog (sin columnas inexistentes)
    if (req.method === "GET" && req.query?.check === "catalog") {
      const actionId = String(req.query.actionId || "").trim().toUpperCase();
      if (!actionId) return res.status(400).json({ error: "actionId requerido", stage: "validate" });

      const { row, used } = await selectCatalogRow(actionId);
      if (!row) return res.status(404).json({ error: "actionId no existe", stage: "catalog" });
      return res.status(200).json({ ok: true, stage: "catalog", used, item: row });
    }

    // Dry-run (sin insertar): muestra la fila que usaría y el payload base SIN cálculos
    if (req.method === "GET" && req.query?.dry === "1") {
      const externalId = String(req.query.externalId || "").trim();
      const actionId   = String(req.query.actionId   || "").trim().toUpperCase();
      const qty        = Number(req.query.qty || 0);
      if (!externalId || !actionId || !qty) {
        return res.status(400).json({ error: "params inválidos", stage: "validate" });
      }
      const { row, used } = await selectCatalogRow(actionId);
      if (!row) return res.status(404).json({ error: "actionId no existe", stage: "catalog" });

      // payload base: solo campos presentes en catálogo, sin transformar ni calcular
      const payloadBase: Record<string, any> = {
        external_id: externalId,
        action_id: actionId,
        qty,
        title: row.title ?? null,
      };
      if ("life_days" in row)  payloadBase.life_days  = row.life_days;
      if ("life_hours" in row) payloadBase.life_hours = row.life_hours;
      if ("points" in row)     payloadBase.points     = row.points;

      return res.status(200).json({ ok: true, stage: "dry", used, catalog_row: row, payload_base: payloadBase });
    }

    // POST normal (registro)
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const raw = req.body ?? {};
    const body = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
    const externalId = String(body.externalId || "").trim();
    const actionId   = String(body.actionId   || "").trim().toUpperCase();
    const qty        = Number(body.qty || 0);
    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "externalId, actionId y qty (>0) son obligatorios", stage: "validate" });
    }

    const { row, used } = await selectCatalogRow(actionId);
    if (!row) return res.status(404).json({ error: "actionId no existe en catálogo", stage: "catalog" });

    const payloadBase: Record<string, any> = {
      external_id: externalId,
      action_id: actionId,
      qty,
      title: row.title ?? null,
    };
    if ("life_days" in row)  payloadBase.life_days  = row.life_days;
    if ("life_hours" in row) payloadBase.life_hours = row.life_hours;
    if ("points" in row)     payloadBase.points     = row.points;

    const ins = await insertLogAdaptive(payloadBase);
    return res.status(200).json({ ok: true, stage: "done", id: ins?.id, created_at: ins?.created_at, used });
  } catch (e: any) {
    return res.status(500).json({ error: "Unhandled exception", details: String(e?.message || e), stage: "catch" });
  }
}






