import React, { useEffect, useMemo, useState } from "react";

type UserInfo = {
  external_id?: string;
  display_name?: string;
  level?: number;
  points?: number;
};

type Totals = {
  actions?: number;   // nº de filas distintas (opcional)
  qty?: number;       // sum(qty)
  life_days?: number; // vida ganada en días
  life_hours?: number;// vida ganada en horas
  by_pillar?: Record<string, number>; // {RET: 12.5, RUT: 4.0, ...} días
};

type RecentLog = {
  id?: string;
  inserted_at?: string;
  action_id?: string;
  qty?: number;
  title?: string;
  pillar?: string;
  level?: string | number;
  life_days?: number;
};

type ProgressPayload = {
  user?: UserInfo;
  totals?: Totals;
  recent?: RecentLog[];
};

const EXTERNAL_ID = "demo-1"; // <-- cámbialo más adelante por el del usuario logueado

export default function Stats() {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Para registrar una acción de prueba desde la UI
  const [testActionId, setTestActionId] = useState("RET-INI-001");
  const [testQty, setTestQty] = useState<number>(1);
  const [postBusy, setPostBusy] = useState(false);
  const [postMsg, setPostMsg] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/progress?externalId=${encodeURIComponent(EXTERNAL_ID)}`);
      if (!res.ok) throw new Error(`GET /api/progress -> ${res.status}`);
      const payload: ProgressPayload = await res.json();
      setData(payload);
    } catch (e: any) {
      setErr(e.message || "Error cargando progreso");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function logTestAction() {
    try {
      setPostBusy(true);
      setPostMsg(null);
      const res = await fetch(`/api/actions/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: EXTERNAL_ID,
          actionId: testActionId.trim(),
          qty: Number(testQty) || 1
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`POST /api/actions/log -> ${res.status}: ${t}`);
      }
      setPostMsg("Acción registrada. Refrescando…");
      await load();
      setPostMsg("¡Listo! Refrescado.");
    } catch (e: any) {
      setPostMsg(`Error: ${e.message}`);
    } finally {
      setPostBusy(false);
    }
  }

  const byPillar = useMemo(() => data?.totals?.by_pillar || {}, [data]);
  const user = data?.user || {};
  const totals = data?.totals || {};

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Estadísticas</h1>
        <button
          onClick={load}
          className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
        >
          Actualizar
        </button>
      </div>

      {loading && <div>Cargando…</div>}
      {err && <div className="text-red-600">Error: {err}</div>}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500">Usuario</div>
          <div className="text-lg font-medium">
            {user.display_name || user.external_id || "—"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ID: {user.external_id || "—"}
          </div>
        </div>

        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500">Nivel</div>
          <div className="text-lg font-medium">{user.level ?? "—"}</div>
          <div className="text-xs text-gray-500 mt-1">
            Puntos: {user.points ?? 0}
          </div>
        </div>

        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500">Vida ganada total</div>
          <div className="text-lg font-medium">
            {(totals.life_days ?? 0).toFixed(2)} días
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {(totals.life_hours ?? 0).toFixed(1)} horas
          </div>
        </div>
      </div>

      {/* Por pilar */}
      <div className="rounded border bg-white p-3">
        <div className="text-sm font-semibold mb-2">Vida ganada por pilar (días)</div>
        <div className="space-y-2">
          {Object.keys(byPillar).length === 0 && (
            <div className="text-sm text-gray-500">Sin datos aún.</div>
          )}
          {Object.entries(byPillar).map(([pillar, days]) => (
            <div key={pillar} className="flex items-center gap-3">
              <div className="w-20 text-xs font-medium">{pillar}</div>
              <div className="flex-1 bg-gray-100 h-2 rounded">
                <div
                  className="h-2 bg-green-500 rounded"
                  style={{ width: `${Math.min(100, (Number(days) || 0) * 5)}%` }}
                  title={`${days?.toFixed?.(2)} días`}
                />
              </div>
              <div className="w-16 text-right text-xs">
                {(Number(days) || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos registros */}
      <div className="rounded border bg-white p-3">
        <div className="text-sm font-semibold mb-2">Actividad reciente</div>
        {!data?.recent?.length && (
          <div className="text-sm text-gray-500">Sin registros aún.</div>
        )}
        <div className="divide-y">
          {data?.recent?.slice(0, 10).map((r, i) => (
            <div key={i} className="py-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {r.title || r.action_id}
                </div>
                <div className="text-xs text-gray-500">
                  {r.pillar || "—"} · {r.qty}× · {(r.life_days ?? 0).toFixed(2)} días ·{" "}
                  {r.inserted_at ? new Date(r.inserted_at).toLocaleString() : "—"}
                </div>
              </div>
              <div className="text-xs text-gray-500 ml-2">
                {r.level ? `Nivel ${r.level}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registrar acción de prueba */}
      <div className="rounded border bg-white p-3">
        <div className="text-sm font-semibold mb-2">Registrar acción de prueba</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="ActionId (p.ej. RET-INI-001)"
            value={testActionId}
            onChange={(e) => setTestActionId(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1"
            type="number"
            min={1}
            value={testQty}
            onChange={(e) => setTestQty(Number(e.target.value))}
          />
          <button
            disabled={postBusy}
            onClick={logTestAction}
            className="border rounded px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {postBusy ? "Enviando…" : "Registrar"}
          </button>
          <button
            onClick={load}
            className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
          >
            Refrescar
          </button>
        </div>
        {postMsg && <div className="text-xs mt-2 text-gray-600">{postMsg}</div>}
        <div className="text-xs text-gray-500 mt-2">
          Consejo: los IDs de acción válidos salen del catálogo (p. ej. <code>RET-INI-001</code>, <code>RUT-INI-005</code>, etc.).
        </div>
      </div>
    </div>
  );
}
