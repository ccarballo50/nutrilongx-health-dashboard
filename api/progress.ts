// api/progress.ts — agrega totals y actividad uniendo catálogo + logs (sin asumir columnas en logs)
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
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

async function fetchJSON(url: string, stage: string) {
  const r = await withTimeout(fetch(url, { headers: H }), 10000, stage);
  const txt = await r.text();
  if (!r.ok) throw new Error(`${stage} ${r.status}: ${txt}`);
  return txt ? JSON.parse(txt) : null;
}

export default async function handler(req: any, res: any) {
  try {
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: "Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY", stage: "env" });
    }

    const ext = String(req.query?.externalId || "").trim();
    if (!ext) return res.status(400).json({ error: "externalId requerido", stage: "validate" });

    // 1) Trae logs del usuario (sólo columnas seguras)
    const logsUrl =
      `${base}/action_logs?external_id=eq.${encodeURIComponent(ext)}` +
      `&select=${encodeURIComponent("id,created_at,action_id,qty")}` +
      `&order=created_at.desc&limit=200`;
    const logs = (await fetchJSON(logsUrl, "logs")) as Array<any>;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(200).json({
        ok: true,
        externalId: ext,
        totals: { actions: 0, points: 0, life: 0 },
        recent: [],
        by_pillar: {},
      });
    }

    // 2) Pide las filas de catálogo para los action_id distintos (probando points opcional)
    const ids = Array.from(new Set(logs.map((l) => l.action_id).filter(Boolean)));
    const inList = `(${ids.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")})`;

    // Intento 1: con points
    let catSel = "id,title,pillar,level,life_days,points";
    let catUrl = `${base}/actions_catalog?id=in.${encodeURIComponent(inList)}&select=${encodeURIComponent(catSel)}&limit=${ids.length}`;
    let cats: Array<any> | null = null;
    try {
      cats = (await fetchJSON(catUrl, "catalog-points")) as Array<any>;
    } catch (_e) {
      // Intento 2: sin points
      catSel = "id,title,pillar,level,life_days";
      catUrl = `${base}/actions_catalog?id=in.${encodeURIComponent(inList)}&select=${encodeURIComponent(catSel)}&limit=${ids.length}`;
      cats = (await fetchJSON(catUrl, "catalog-life")) as Array<any>;
    }

    const mapCat = new Map<string, any>();
    for (const c of cats ?? []) mapCat.set(c.id, c);

    // 3) Mezcla y agrega
    let totalActions = 0;
    let totalLife = 0;
    let totalPoints = 0;
    const recent: Array<any> = [];

    const byPillar: Record<string, number> = {};

    for (const l of logs) {
      const cat = mapCat.get(l.action_id) || {};
      const lifeDays = num(cat.life_days) * num(l.qty); // seguro aunque falte
      const points = num(cat.points) * num(l.qty);      // será 0 si no hay 'points'

      totalActions += num(l.qty);
      totalLife += lifeDays;
      totalPoints += points;

      if (cat.pillar) {
        byPillar[cat.pillar] = (byPillar[cat.pillar] || 0) + lifeDays;
      }

      recent.push({
        id: l.id,
        created_at: l.created_at,
        actionId: l.action_id,
        qty: l.qty,
        title: cat.title ?? null,
        life: lifeDays,
        points: points,
      });
    }

    return res.status(200).json({
      ok: true,
      externalId: ext,
      totals: {
        actions: totalActions,
        points: Math.round(totalPoints),
        life: Number(totalLife.toFixed(2)), // días
      },
      recent,
      by_pillar: byPillar,
    });
  } catch (e: any) {
    return res.status(500).json({ error: "Unhandled exception", details: String(e?.message || e), stage: "catch" });
  }
}

