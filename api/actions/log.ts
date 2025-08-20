// api/actions/log.ts — se adapta a tu esquema real (life_days / life_hours), sin pedir columnas inexistentes
export const config = { runtime: "nodejs" };

const SB_URL = process.env.SUPABASE_URL as string;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const base = `${(SB_URL || "").replace(/\/$/, "")}/rest/v1`;

function headersJSON() {
  return {
    "content-type": "application/json",
    apikey: SB_SERVICE,
    Authorization: `Bearer ${SB_SERVICE}`,
  };
}

function withTimeout<T>(p: Promise<T>, ms: number, stage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout at ${stage} (${ms}ms)`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// --- introspección de columnas seguras (evita 42703) ---
async function listColumns(table: string) {
  const url = `${base}/information_schema.columns?table_schema=eq.public&table_name=eq.${encodeURIComponent(
    table
  )}&select=column_name`;
  const r = await withTimeout(fetch(url, { headers: headersJSON() }), 8000, `columns-${table}`);
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`columns(${table}) ${r.status}: ${txt}`);
  }
  const rows = (await r.json()) as Array<{ column_name: string }>;
  return new Set(rows.map((x) => x.column_name));
}

export default async function handler(req: any, res: any) {
  try {
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: "Faltan SUPABASE_URL/SERVICE_ROLE", stage: "env" });
    }

    // --- Pings / diagnósticos (GET) ---
    if (req.method === "GET" && req.query?.ping === "1") {
      return res.status(200).json({ ok: true, stage: "alive" });
    }

    // Descubre columnas reales del catálogo y del log
    const catCols = await listColumns("actions_catalog");
    const logCols = await listColumns("action_logs");

    // decide qué columnas usar en catálogo
    const lifeDaysCol = catCols.has("life_days") ? "life_days" : undefined;
    const lifeHoursCol = !lifeDaysCol && catCols.has("life_hours") ? "life_hours" : undefined;
    const pointsCol = catCols.has("points") ? "points" : (catCols.has("points_value") ? "points_value" : undefined);

    // decide columnas de destino en action_logs
    const logLifeCol = logCols.has("life_days")
      ? "life_days"
      : logCols.has("life")
      ? "life"
      : undefined;
    const logPointsCol = logCols.has("points")
      ? "points"
      : logCols.has("points_value")
      ? "points_value"
      : undefined;

    // helper para obtener 1 acción con sólo columnas existentes
    async function getCatalogRow(actionId: string) {
      const selectCols = ["id", "title"];
      if (lifeDaysCol) selectCols.push(lifeDaysCol);
      if (lifeHoursCol) selectCols.push(lifeHoursCol);
      if (pointsCol) selectCols.push(pointsCol);

      const sel = encodeURIComponent(selectCols.join(","));
      const url = `${base}/actions_catalog?id=eq.${encodeURIComponent(actionId)}&select=${sel}&limit=1`;
      const r = await withTimeout(fetch(url, { headers: headersJSON() }), 8000, "catalog-lookup");
      const txt = await r.text();
      if (!r.ok) throw new Error(`catalog ${r.status}: ${txt}`);
      const data = txt ? JSON.parse(txt) : [];
      return data[0];
    }

    // check=catalog (GET) — ahora sin pedir columnas inexistentes
    if (req.method === "GET" && req.query?.check === "catalog") {
      const actionId = String(req.query.actionId || "").trim().toUpperCase();
      if (!actionId) return res.status(400).json({ error: "actionId requerido", stage: "validate" });

      const cat = await getCatalogRow(actionId);
      if (!cat) return res.status(404).json({ error: "actionId no existe", stage: "catalog" });
      return res.status(200).json({ ok: true, stage: "catalog", item: cat });
    }

    // dry=1 (GET): calcula lo que insertaría, sin insertar
    if (req.method === "GET" && req.query?.dry === "1") {
      const externalId = String(req.query.externalId || "").trim();
      const actionId = String(req.query.actionId || "").trim().toUpperCase();
      const qty = Number(req.query.qty || 0);
      if (!externalId || !actionId || !qty) {
        return res.status(400).json({ error: "params inválidos", stage: "validate" });
      }

      const cat = await getCatalogRow(actionId);
      if (!cat) return res.status(404).json({ error: "actionId no existe", stage: "catalog" });

      const lifeDays =
        num(cat[lifeDaysCol as any]) ??
        (lifeHoursCol ? (num(cat[lifeHoursCol]) || 0) / 24 : undefined) ??
        0;

      const points =
        (pointsCol ? num(cat[pointsCol]) : undefined) ??
        Math.round((lifeDays || 0) * 10); // TODO: tu fórmula real

      const row: Record<string, any> = {
        external_id: externalId,
        action_id: actionId,
        qty,
        title: cat.title ?? null,
      };
      if (logLifeCol) row[logLifeCol] = lifeDays;
      if (logPointsCol) row[logPointsCol] = points;

      return res.status(200).json({ ok: true, stage: "dry", would_insert: row, using: { lifeDaysCol, lifeHoursCol, pointsCol, logLifeCol, logPointsCol } });
    }

    // --- POST normal ---
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const raw = req.body ?? {};
    const body = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
    const externalId = String(body.externalId || "").trim();
    const actionId = String(body.actionId || "").trim().toUpperCase();
    const qty = Number(body.qty || 0);
    if (!externalId || !actionId || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "externalId, actionId y qty (>0) son obligatorios", stage: "validate" });
    }

    const cat = await getCatalogRow(actionId);
    if (!cat) return res.status(404).json({ error: "actionId no existe en catálogo", stage: "catalog" });

    const lifeDays =
      num(cat[lifeDaysCol as any]) ??
      (lifeHoursCol ? (num(cat[lifeHoursCol]) || 0) / 24 : undefined) ??
      0;

    const points =
      (pointsCol ? num(cat[pointsCol]) : undefined) ??
      Math.round((lifeDays || 0) * 10); // TODO: tu conversión de vida→puntos

    // construye sólo con columnas que EXISTEN en action_logs
    const row: Record<string, any> = {
      external_id: externalId,
      action_id: actionId,
      qty,
      title: cat.title ?? null,
    };
    if (logLifeCol) row[logLifeCol] = lifeDays;
    if (logPointsCol) row[logPointsCol] = points;

    const insURL = `${base}/action_logs?return=representation`;
    const ri = await withTimeout(
      fetch(insURL, { method: "POST", headers: headersJSON(), body: JSON.stringify(row) }),
      8000,
      "insert"
    );
    const txt = await ri.text();
    if (!ri.ok) return res.status(ri.status).send(txt);

    const rep = txt ? JSON.parse(txt) : [];
    const inserted = rep[0] ?? null;
    return res.status(200).json({ ok: true, id: inserted?.id, created_at: inserted?.created_at, stage: "done" });
  } catch (e: any) {
    return res.status(500).json({ error: "Unhandled exception", details: String(e?.message || e), stage: "catch" });
  }
}






