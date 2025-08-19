import React, { useEffect, useMemo, useState } from "react";

type ProgressResponse = {
  externalId: string;
  total_days: number;
  total_hours: number;
  by_pillar: Record<string, number>; // días por pilar
  recent: Array<{
    when?: string | null;
    action_id: string;
    title?: string | null;
    qty: number;
    hours: number;
  }>;
};

function formatDays(n: number) {
  const d = typeof n === "number" && isFinite(n) ? n : 0;
  return d.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatHours(n: number) {
  const d = typeof n === "number" && isFinite(n) ? n : 0;
  return d.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function Stats() {
  // --- estado UI
  const [externalId, setExternalId] = useState("demo-1");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- datos de progreso
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  // --- registrar acción
  const [actionId, setActionId] = useState("RET-INI-001");
  const [qty, setQty] = useState(1);
  const [regMsg, setRegMsg] = useState<string | null>(null);

  async function fetchProgress(id: string) {
    setLoading(true);
    setErr(null);
    try {
      const url = `/api/progress?externalId=${encodeURIComponent(id)}`;
      const r = await fetch(url, { method: "GET" });
      const txt = await r.text();
      let data: any = null;
      try {
        data = JSON.parse(txt);
      } catch {
        data = null;
      }
      if (!r.ok) {
        setErr(data?.error || txt || `Error HTTP ${r.status}`);
        setProgress(null);
      } else {
        setProgress(data as ProgressResponse);
      }
    } catch (e: any) {
      setErr(e?.message || String(e));
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    await fetchProgress(externalId.trim());
  }

  async function onRegister() {
    setRegMsg(null);
    setErr(null);
    try {
      const body = {
        externalId: externalId.trim(),
        actionId: actionId.trim(),
        qty: Number(qty),
      };
      const r = await fetch("/api/actions/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const txt = await r.text();
      let data: any = null;
      try {
        data = JSON.parse(txt);
      } catch {
        data = null;
      }
      if (!r.ok) {
        setRegMsg(
          `Error: ${data?.error || txt || `HTTP ${r.status}`} (revisa ID y RLS)`
        );
      } else {
        setRegMsg("¡Acción registrada!");
        // refresca progreso al registrar
        await fetchProgress(externalId.trim());
      }
    } catch (e: any) {
      setRegMsg(e?.message || String(e));
    }
  }

  // carga inicial
  useEffect(() => {
    fetchProgress(externalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byPillarEntries = useMemo(() => {
    const obj = progress?.by_pillar || {};
    return Object.entries(obj).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  }, [progress]);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>Estadísticas</h2>

      {/* Header: ExternalId + actualizar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>External ID</div>
          <input
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            style={{ padding: "6px 8px", minWidth: 200 }}
          />
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: "6px 12px",
            background: "#0ea5e9",
            color: "white",
            borderRadius: 6,
            border: "none",
          }}
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      {err && (
        <div style={{ color: "#b91c1c", marginBottom: 12 }}>
          <strong>Error:</strong> {err}
        </div>
      )}

      {/* tarjetas resumen */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Usuario</div>
          <div style={{ fontWeight: 600 }}>{progress?.externalId || "—"}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>ID: {progress?.externalId || "—"}</div>
        </div>

        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Vida ganada total</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {formatDays(progress?.total_days || 0)} días
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {formatHours(progress?.total_hours || 0)} horas
          </div>
        </div>
      </div>

      {/* Vida por pilar */}
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ margin: "8px 0" }}>Vida ganada por pilar (días)</h4>
        {byPillarEntries.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Sin datos aún.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {byPillarEntries.map(([pillar, days]) => (
              <li key={pillar}>
                <strong>{pillar}:</strong> {formatDays(days)} días
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actividad reciente */}
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ margin: "8px 0" }}>Actividad reciente</h4>
        {(!progress || progress.recent.length === 0) ? (
          <div style={{ opacity: 0.7 }}>Sin registros aún.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {progress.recent.map((r, idx) => (
              <li key={idx}>
                {r.when ? new Date(r.when).toLocaleString() : "—"} ·{" "}
                <strong>{r.action_id}</strong>
                {r.title ? ` — ${r.title}` : ""} · qty {r.qty} ·{" "}
                {formatHours(r.hours)} h
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Registrar acción de prueba */}
      <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <h4 style={{ margin: "8px 0" }}>Registrar acción de prueba</h4>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={actionId}
            onChange={(e) => setActionId(e.target.value)}
            style={{ padding: "6px 8px", minWidth: 180 }}
            placeholder="ID de acción (p.ej. ALI-BRO-043)"
          />
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
            style={{ padding: "6px 8px", width: 80 }}
          />
          <button
            onClick={onRegister}
            style={{
              padding: "6px 12px",
              background: "#16a34a",
              color: "white",
              borderRadius: 6,
              border: "none",
            }}
          >
            Registrar
          </button>
        </div>

        {regMsg && (
          <div style={{ marginTop: 8, color: regMsg.startsWith("¡") ? "#166534" : "#b91c1c" }}>
            {regMsg}
          </div>
        )}

        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
          Consejo: los IDs válidos salen del catálogo (p. ej. <code>RET-INI-001</code>,{" "}
          <code>ALI-BRO-043</code>, etc.).
        </div>
      </div>
    </div>
  );
}


