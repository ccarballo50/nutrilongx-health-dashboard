// pages/Stats.tsx
import React, { useEffect, useMemo, useState } from "react";

type Progress = {
  externalId: string;
  total_days: number;
  total_hours: number;
  by_pillar: Record<string, number>;
  recent: Array<{ action_id: string; title: string; pillar: string; qty: number; created_at: string }>;
};

export default function Stats() {
  const [externalId, setExternalId] = useState("demo-1");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [actionId, setActionId] = useState("RET-INI-001");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  const pillars = useMemo(() => Object.entries(progress?.by_pillar || {}), [progress]);

  async function loadProgress() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/progress?externalId=${encodeURIComponent(externalId)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Error desconocido");
      setProgress(j);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  async function registerAction() {
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch(`/api/actions/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId, actionId, qty })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || JSON.stringify(j));
      setMsg(`Registrada ${actionId} x${qty}`);
      await loadProgress(); // refresca inmediatamente
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  useEffect(() => {
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <h2>Estadísticas</h2>

      <div className="card">
        <label>External ID</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={externalId} onChange={e => setExternalId(e.target.value)} />
          <button onClick={loadProgress} disabled={loading}>Actualizar</button>
        </div>
      </div>

      {err && <div className="card" style={{ color: "crimson" }}>Error: {err}</div>}
      {msg && <div className="card" style={{ color: "green" }}>{msg}</div>}

      <div className="grid">
        <div className="card">
          <div>Usuario</div>
          <div>—</div>
          <div>ID: {externalId || "—"}</div>
        </div>
        <div className="card">
          <div>Nivel</div>
          <div>—</div>
          <div>Puntos: 0</div>
        </div>
        <div className="card">
          <div>Vida ganada total</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {progress ? progress.total_days.toFixed(2) : "0.00"} días
          </div>
          <div>{progress ? progress.total_hours.toFixed(1) : "0.0"} horas</div>
        </div>
      </div>

      <div className="card">
        <h3>Vida ganada por pilar (días)</h3>
        {pillars.length === 0 ? (
          <div>Sin datos aún.</div>
        ) : (
          <ul>
            {pillars.map(([p, d]) => (
              <li key={p}><b>{p}:</b> {d.toFixed(2)}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Actividad reciente</h3>
        {!progress || progress.recent.length === 0 ? (
          <div>Sin registros aún.</div>
        ) : (
          <ul>
            {progress.recent.map((r, i) => (
              <li key={i}>
                <b>{r.title}</b> ({r.pillar}) ×{r.qty} – {new Date(r.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Registrar acción de prueba</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={actionId} onChange={e => setActionId(e.target.value)} />
          <input type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value || "1", 10))} />
          <button onClick={registerAction}>Registrar</button>
        </div>
        <small>
          Consejo: los IDs válidos salen del catálogo (p. ej. <code>RET-INI-001</code>, <code>RUT-INI-005</code>…)
        </small>
      </div>
    </div>
  );
}

