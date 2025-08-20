// pages/Stats.tsx
import React, { useEffect, useMemo, useState } from "react";

type Progress = {
  externalId?: string;
  total_days?: number;
  total_hours?: number;
  by_pillar?: Record<string, number>;
  recent?: Array<{
    id?: string;
    created_at?: string;
    title?: string;
    action_id?: string;
    qty?: number;
    points?: number;
    life_days?: number;
  }>;
  totals?: { actions?: number; points?: number; life?: number };
  error?: string;
};

export default function StatsPage() {
  // Form
  const [externalId, setExternalId] = useState("demo-1");
  const [actionId, setActionId] = useState("ALI-BRO-043");
  const [qty, setQty] = useState(1);

  // UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Data
  const [progress, setProgress] = useState<Progress | null>(null);
  const recent = progress?.recent || [];
  const totalDays =
    progress?.totals?.life ??
    (typeof progress?.total_days === "number" ? progress.total_days : 0);
  const actionsCount =
    typeof progress?.totals?.actions === "number"
      ? progress.totals.actions
      : recent.length;
  const pointsTotal = progress?.totals?.points ?? 0;

  const progressQS = useMemo(() => {
    const p = new URLSearchParams();
    if (externalId.trim()) p.set("externalId", externalId.trim());
    return p.toString();
  }, [externalId]);

  async function fetchProgress() {
    setError("");
    try {
      const r = await fetch(`/api/progress?${progressQS}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const t = await r.text();
      const data = t ? JSON.parse(t) : {};
      console.log("[progress] status", r.status, data);
      if (!r.ok) {
        setError(data?.error || `Error progreso HTTP ${r.status}`);
      } else {
        setProgress(data);
      }
    } catch (e: any) {
      console.error("[progress] exception", e);
      setError(e?.message || String(e));
    }
  }

  useEffect(() => {
    fetchProgress();
  }, [progressQS]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ext = externalId.trim();
    const act = actionId.trim().toUpperCase();
    const q = Number(qty) || 0;

    if (!ext || !act || q <= 0) {
      setError("Completa externalId, actionId y una cantidad válida (>0).");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      // *** REGISTRO POR GET (igual que la URL que te funciona) ***
      const qs = new URLSearchParams({
        externalId: ext,
        actionId: act,
        qty: String(q),
      }).toString();

      const r = await fetch(`/api/actions/log?${qs}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const t = await r.text();
      let data: any = {};
      try { data = t ? JSON.parse(t) : {}; } catch { data = { raw: t }; }
      console.log("[log] GET status", r.status, data);

      if (!r.ok || !data?.ok) {
        setError(data?.error || data?.details || data?.message || `HTTP ${r.status}`);
        return;
      }

      setMessage("✅ Acción registrada.");
      await fetchProgress();
    } catch (e: any) {
      console.error("[log] exception", e);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1>Estadísticas</h1>
      <p>Registra acciones y consulta tu progreso acumulado.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={fetchProgress} style={btnSecondary}>
          Actualizar progreso
        </button>
      </div>

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
          <input
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            placeholder="demo-1"
            style={input}
            autoComplete="off"
          />
        </Field>

        <Field label="Action ID">
          <input
            value={actionId}
            onChange={(e) => setActionId(e.target.value)}
            placeholder="ALI-BRO-043"
            style={{ ...input, textTransform: "uppercase" }}
            autoComplete="off"
          />
        </Field>

        <Field label="Cantidad">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            style={input}
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#a3a3a3" : "#16a34a",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            height: 44,
          }}
        >
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>

      {message && (
        <div style={{ ...alert, background: "#ecfdf5", color: "#065f46" }}>{message}</div>
      )}
      {error && (
        <div style={{ ...alert, background: "#fef2f2", color: "#991b1b" }}>{error}</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <StatCard title="Acciones" value={String(actionsCount)} />
        <StatCard title="Puntos" value={String(pointsTotal)} />
        <StatCard title="Vida (días)" value={String(totalDays || 0)} />
      </div>

      {/* Vida por pilar */}
      {!!progress?.by_pillar && (
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ margin: "6px 0 8px" }}>Vida ganada por pilar (días)</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {Object.entries(progress.by_pillar).map(([pillar, days]) => (
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
              {recent.map((r, i) => (
                <tr key={(r.id || i) + ""} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <Td>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</Td>
                  <Td>{r.title || "-"}</Td>
                  <Td>{r.action_id || "-"}</Td>
                  <Td>{typeof r.qty === "number" ? r.qty : "-"}</Td>
                  <Td>{typeof r.points === "number" ? r.points : "-"}</Td>
                  <Td>{typeof r.life_days === "number" ? r.life_days : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, border: "1px solid #eee", background: "#fff", minHeight: 84 }}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
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

/* estilos simples */
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
const alert: React.CSSProperties = {
  marginBottom: 12,
  padding: 12,
  borderRadius: 8,
};



