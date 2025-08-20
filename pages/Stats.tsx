// pages/Stats.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";

type ProgressItem = {
  id?: string | number;
  created_at?: string;
  title?: string;
  action_id?: string;
  qty?: number;
  points?: number;
  life_days?: number;
  [k: string]: any;
};

type ProgressResponse = {
  ok?: boolean;
  error?: string;
  externalId?: string;
  total_days?: number;    // vida total en días
  total_hours?: number;   // vida total en horas
  by_pillar?: Record<string, number>;
  recent?: ProgressItem[];
  totals?: { actions?: number; points?: number; life?: number };
  [k: string]: any;
};

export default function StatsPage() {
  // Form
  const [externalId, setExternalId] = useState("demo-1");
  const [actionId, setActionId] = useState("ALI-BRO-043");
  const [qty, setQty] = useState<number>(1);

  // UI
  const [loading, setLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [health, setHealth] = useState<null | { ok: boolean; text: string }>(null);

  // Datos
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  const progressQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (externalId.trim()) p.set("externalId", externalId.trim());
    return p.toString();
  }, [externalId]);

  const fetchProgress = useCallback(async () => {
    if (!externalId.trim()) return;
    setProgressLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/progress?${progressQuery}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const txt = await res.text();
      const data: ProgressResponse = txt ? JSON.parse(txt) : {};
      console.log("[progress] GET", data);
      if (!res.ok) {
        setError(`Error al obtener progreso (${res.status}): ${data?.error ?? "desconocido"}`);
      } else {
        setProgress(data);
      }
    } catch (e: any) {
      console.error("[progress] exception:", e);
      setError(`Excepción al obtener progreso: ${e?.message ?? String(e)}`);
    } finally {
      setProgressLoading(false);
    }
  }, [externalId, progressQuery]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const testHealth = useCallback(async () => {
    try {
      const r = await fetch("/api/hello");
      const t = await r.text();
      setHealth({ ok: r.ok, text: t || (r.ok ? "OK" : "ERROR") });
      console.log("[health] /api/hello", r.status, t);
    } catch (e: any) {
      setHealth({ ok: false, text: e?.message ?? String(e) });
    }
  }, []);
  useEffect(() => { testHealth(); }, [testHealth]);

  // Utilidad: timeout seguro
  function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = setTimeout(() => reject(new Error("timeout")), ms);
      p.then(v => { clearTimeout(id); resolve(v); }, e => { clearTimeout(id); reject(e); });
    });
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ext = externalId.trim();
    const act = actionId.trim().toUpperCase();
    const q = Number(qty) || 0;

    if (!ext || !act || q <= 0) {
      setError("Completa externalId, actionId y una cantidad válida (>0).");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // 1) Primero intentamos POST (ideal)
      const payload = { externalId: ext, actionId: act, qty: q };
      console.log("[log] POST /api/actions/log payload:", payload);

      const postRes = await withTimeout(
        fetch("/api/actions/log", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        }),
        15000
      );

      const postTxt = await postRes.text();
      let postData: any = {};
      try { postData = postTxt ? JSON.parse(postTxt) : {}; } catch { postData = { raw: postTxt }; }
      console.log("[log] POST status:", postRes.status, postData);

      if (!postRes.ok || !postData?.ok) {
        throw new Error(postData?.error ?? postData?.details ?? postData?.message ?? `HTTP ${postRes.status}`);
      }

      setMessage("✅ Acción registrada correctamente (POST).");
      await fetchProgress();
      return;
    } catch (errFirst: any) {
      console.warn("[log] POST falló, intento GET como fallback:", errFirst?.message ?? errFirst);

      // 2) Fallback robusto a GET (ya comprobaste que inserta bien)
      try {
        const qs = new URLSearchParams({
          externalId: ext,
          actionId: act,
          qty: String(q),
        }).toString();
        const url = `/api/actions/log?${qs}`;
        console.log("[log] GET fallback:", url);

        const getRes = await withTimeout(fetch(url, { method: "GET" }), 15000);
        const getTxt = await getRes.text();
        let getData: any = {};
        try { getData = getTxt ? JSON.parse(getTxt) : {}; } catch { getData = { raw: getTxt }; }
        console.log("[log] GET status:", getRes.status, getData);

        if (!getRes.ok || !getData?.ok) {
          throw new Error(getData?.error ?? getData?.details ?? getData?.message ?? `HTTP ${getRes.status}`);
        }

        setMessage("✅ Acción registrada correctamente (GET fallback).");
        await fetchProgress();
      } catch (errSecond: any) {
        console.error("[log] Ambos intentos fallaron:", errSecond);
        setError(`No se pudo registrar la acción: ${errSecond?.message ?? String(errSecond)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Derivados para UI
  const totalDays =
    progress?.totals?.life ??
    (typeof progress?.total_days === "number" ? progress?.total_days : 0);

  const actionsCount =
    typeof progress?.totals?.actions === "number"
      ? progress?.totals?.actions
      : Array.isArray(progress?.recent)
      ? progress!.recent!.length
      : 0;

  const pointsTotal = progress?.totals?.points ?? 0;
  const byPillarEntries = Object.entries(progress?.by_pillar || {});
  const recent = progress?.recent || [];

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Estadísticas</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={testHealth} style={btnSecondary}>Probar API</button>
        <button onClick={fetchProgress} disabled={progressLoading} style={btnSecondary}>
          {progressLoading ? "Actualizando..." : "Actualizar progreso"}
        </button>
      </div>

      {/* Formulario */}
      <form
        onSubmit={onSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 120px 140px",
          gap: 12,
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <Field label="External ID">
          <input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="demo-1" autoComplete="off" style={input} />
        </Field>
        <Field label="Action ID">
          <input value={actionId} onChange={(e) => setActionId(e.target.value)} placeholder="ALI-BRO-043" autoComplete="off" style={{ ...input, textTransform: "uppercase" }} />
        </Field>
        <Field label="Cantidad">
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={input} />
        </Field>
        <button type="submit" disabled={loading} style={{
          padding: "12px 18px", borderRadius: 10, border: "none",
          background: loading ? "#a3a3a3" : "#16a34a", color: "#fff",
          fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", height: 44,
        }} aria-busy={loading}>
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>

      {/* Estado API */}
      {health && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: health.ok ? "#ecfdf5" : "#fef2f2", color: health.ok ? "#065f46" : "#991b1b" }}>
          {health.ok ? "API OK" : "API Error"} ({health.text || ""})
        </div>
      )}

      {/* Mensajes */}
      {message && <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: "#ecfdf5", color: "#065f46" }}>{message}</div>}
      {error && <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: "#fef2f2", color: "#991b1b" }}>{error}</div>}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
        <StatCard title="Acciones" value={String(actionsCount)} loading={progressLoading} />
        <StatCard title="Puntos" value={String(pointsTotal)} loading={progressLoading} />
        <StatCard title="Vida (días)" value={String(totalDays ?? 0)} loading={progressLoading} />
      </div>

      {/* Vida por pilar */}
      {byPillarEntries.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ margin: "6px 0 8px" }}>Vida ganada por pilar (días)</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {byPillarEntries.map(([pillar, days]) => (
              <li key={pillar} style={{ lineHeight: 1.6 }}>
                <b>{pillar}:</b> {days}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actividad reciente */}
      <h3 style={{ marginTop: 20, marginBottom: 8 }}>Actividad reciente</h3>
      {!recent.length ? (
        <p style={{ opacity: 0.75 }}>Sin registros aún.</p>
      ) : (
        <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#fafafa" }}>
              <tr>
                <Th>Fecha</Th>
                <Th>Título</Th>
                <Th>Action ID</Th>
                <Th>Cantidad</Th>
                <Th>Puntos</Th>
                <Th>Vida</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, idx) => (
                <tr key={`${r.id ?? idx}-${idx}`} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <Td>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</Td>
                  <Td>{r.title ?? "-"}</Td>
                  <Td>{r.action_id ?? "-"}</Td>
                  <Td>{typeof r.qty === "number" ? r.qty : "-"}</Td>
                  <Td>{typeof r.points === "number" ? r.points : "-"}</Td>
                  <Td>{typeof r.life_days === "number" ? r.life_days : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.6 }}>
        Tip: abre DevTools → Network y Console. Verás el intento <b>POST</b> y, si falla/timeout, el intento <b>GET</b> de fallback.
      </p>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ title, value, loading }: { title: string; value: string; loading?: boolean }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, border: "1px solid #eee", background: "#fff", minHeight: 84 }}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{loading ? "…" : value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, fontSize: 13, borderBottom: "1px solid #eee" }}>
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 12px", fontSize: 14 }}>{children}</td>;
}

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};


