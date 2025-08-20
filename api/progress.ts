// api/progress.ts
// Resumen de progreso por usuario leyendo Supabase REST.
// - totals.actions / totals.life (días) / totals.points (0 por ahora)
// - total_hours / total_days
// - by_pillar (días)
// - recent (últimas 20 filas) con título del catálogo

export const config = { runtime: "nodejs" };

const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BASE = `${SB_URL}/rest/v1`;

const H_JSON = {
  apikey: SB_SERVICE,
  Authorization: `Bearer ${SB_SERVICE}`,
  "content-type": "application/json",
  Prefer: "count=exact", // para Content-Range
};

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data, text, headers: res.headers };
}

export default async function handler(req: any, res: any) {
  try {
    if (!SB_URL || !SB_SERVICE) {
      return res.status(500).json({ error: "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" });
    }

    const externalId = String(req.query.externalId || "").trim();
    if (!externalId) {
      return res.status(400).json({ error: "externalId es obligatorio" });
    }

    // 1) Traer TODOS los logs (solo columnas mínimas) para totales
    const allURL =
      `${BASE}/action_logs` +
      `?select=base_hours,pillar` +
      `&user_external_id=eq.${encodeURIComponent(externalId)}` +
      `&limit=10000`;

    const all = await fetchJSON(allURL, { headers: H_JSON });
    if (!all.ok) return res.status(all.status).send(all.text || "");

    const logsAll: Array<{ base_hours?: number; pillar?: string }> = Array.isArray(all.data) ? all.data : [];
    const contentRange = all.headers.get("content-range") || "";
    // content-range: "0-123/124" -> actions = 124
    let actionsCount = 0;
    const m = contentRange.match(/\/(\d+)\s*$/);
    if (m) actionsCount = parseInt(m[1], 10) || 0;
    else actionsCount = logsAll.length;

    let total_hours = 0;
    const byPillarHours: Record<string, number> = {};
    for (const r of logsAll) {
      const h = Number(r.base_hours || 0);
      total_hours += h;
      const p = (r.pillar || "Otros").toString();
      byPillarHours[p] = (byPillarHours[p] || 0) + h;
    }
    const total_days = r2(total_hours / 24);

    const by_pillar: Record<string, number> = {};
    for (const [k, v] of Object.entries(byPillarHours)) by_pillar[k] = r2(v / 24);

    // 2) Últimos 20 para "Actividad reciente"
    const recentURL =
      `${BASE}/action_logs` +
      `?select=id,created_at,action_id,qty,base_hours` +
      `&user_external_id=eq.${encodeURIComponent(externalId)}` +
      `&order=created_at.desc&limit=20`;

    const recentRes = await fetchJSON(recentURL, { headers: H_JSON });
    if (!recentRes.ok) return res.status(recentRes.status).send(recentRes.text || "");
    const recentRaw: Array<any> = Array.isArray(recentRes.data) ? recentRes.data : [];

    // 3) Títulos del catálogo para los recent
    const actionIds = Array.from(new Set(recentRaw.map((r) => String(r.action_id || "").trim()).filter(Boolean)));
    let titleMap: Record<string, string> = {};
    if (actionIds.length > 0) {
      // id=in.("A","B","C")
      const inList = `(${actionIds.map((s) => `"${s.replace(/"/g, '""')}"`).join(",")})`;
      const catURL = `${BASE}/actions_catalog?id=in.${encodeURIComponent(inList)}&select=id,title&limit=${actionIds.length}`;
      const catRes = await fetchJSON(catURL, { headers: H_JSON });
      if (catRes.ok && Array.isArray(catRes.data)) {
        for (const r of catRes.data) {
          titleMap[String(r.id)] = String(r.title ?? "");
        }
      }
    }
    const recent = recentRaw.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      action_id: r.action_id,
      qty: r.qty,
      life_days: r2(Number(r.base_hours || 0) / 24),
      points: undefined, // aún no definido
      title: titleMap[String(r.action_id || "")] || undefined,
    }));

    // 4) Respuesta final con "totals" para tu UI actual
    return res.status(200).json({
      ok: true,
      externalId,
      total_days,
      total_hours: r2(total_hours),
      by_pillar,
      recent,
      totals: {
        actions: actionsCount,
        points: 0,        // define tu lógica cuando toque
        life: total_days, // para la cabecera actual
      },
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: "Unhandled exception", details: String(e?.message || e) });
  }
}


