// pages/Stats.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Stats – NutrilongX (Vite + Vercel)
 * - GET /api/progress?externalId=...
 * - POST /api/actions/log
 * - Botón de salud /api/hello para verificar API routes
 * - AbortController para evitar cuelgues y estados colgantes
 */

type ProgressResponse = {
  ok?: boolean;
  externalId?: string;
  totals?: { actions?: number; points?: number; life?: number };
  recent?: Array<{
    id: string | number;
    actionId: string;
    qty: number;
    points?: number;
    life?: number;
    created_at?: string;
    title?: string;
  }>;
  by_pillar?: Record<string, number>;
  [k: string]: any;
};

function toDetail(data: any, status?: number, txt?: string) {
  if (data && typeof data === "object") {
    return (
      data.error ??
      data.message ??
      data.details ??
      JSON.stringify(data)
    );
  }
  if (typeof data === "string") return data;
  if (txt) return txt.slice(0, 800);
  return status ? `HTTP ${status}` : "Error desconocido";
}

export default function Stats() {
  // Form
  const [externalId, setExternalId] = useState("demo-1");
  const [actionId, setActionId] = useState("ALI-BRO-043");
  const [qty, setQty] = useState<number>(1);

  // UI
  const [loading, setLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  // Data
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  // AbortControllers para requests
  const progressAbortRef = useRef<AbortController | null>(null);
  const logAbortRef = useRef<AbortController | null>(null);

  // Base de API relativa (misma origin)
  const apiBase = "";

  const fetchProgress = useCallback(async (id: string) => {
    if (!id.trim()) return;

    // Cancelar petición anterior si existe
    if (progressAbortRef.current) progressAbortRef.current.abort();
    const ac = new AbortController();
    progressAbortRef.current = ac;

    setProgressLoading(true);
    setErr("");
    setMsg("");

    try {
      const url = `${apiBase}/api/progress?externalId=${encodeURIComponent(
        id.trim()
      )}`;
      console.log("[progress] GET", url);
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: ac.signal,
      });

      const txt = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(txt);
      } catch {
        // Puede venir texto plano si hay error en server
        console.warn("Respuesta no JSON de /api/progress:", txt);
      }

      console.log("[progress] status", res.status, "data:", data ?? txt);

      if (!res.ok) {
        setErr(`Error al obtener progreso: ${toDetail(data, res.status, txt)}`);
        return;
      }
      setProgress((data as ProgressResponse) ?? null);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        console.log("[progress] abortado");
        return;
      }
      console.error("[progress] exception:", e);
      setErr(`Excepción al obtener progreso: ${e?.message ?? String(e)}`);
    } finally {
      if (progressAbortRef.current === ac) progressAbortRef.current = null;
      setProgressLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress(externalId);
  }, [externalId, fetchProgress]);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();

    // Cancelar petición anterior si existe
    if (logAbortRef.current) logAbortRef.current.abort();
    const ac = new AbortController();
    logAbortRef.current = ac;

    setLoading(true);
    setErr("");
    setMsg("");

    const ext = externalId.trim();
    const act = actionId.trim().toUpperCase();
    const q = Number(qty);

    if (!ext || !act || !Number.isFinite(q) || q <= 0) {
      setLoading(false);
      setErr("Completa externalId, actionId y una cantidad válida (>0).");
      return;
    }

    try {
      const payload = { externalId: ext, actionId: act, qty: q };
      console.log("[log] POST /api/actions/log payload:", payload);

      const res = await fetch(`${apiBase}/api/actions/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: ac.signal,
      });

      const txt = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(txt);
      } catch {
        console.warn("Respuesta no JSON de /api/actions/log:", txt);
      }

      console.log("[log] status", res.status, "data:", data ?? txt);

      if (!res.ok) {
        setErr(`No se pudo registrar la acción: ${toDetail(data, res.status, txt)}`);
        return;
      }

      // Mostrar stage si viene del backend instrumentado
      if (data?.stage) {
        setMsg(`✅ Acción registrada (stage: ${data.stage}).`);
      } else {
        setMsg("✅ Acción registrada correctamente.");
      }

      await fetchProgress(ext);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        console.log("[log] abortado");
        return;
      }
      console.error("[log] exception:", e);
      setErr(`Excepción al registrar: ${e?.message ?? String(e)}`);
    } finally {
      if (logAbortRef.current === ac) logAbortRef.current = null;
      setLoading(false);
    }
  }

  async function testApiHealth() {
    setErr("");
    setMsg("");
    try {
      console.log("[health] GET /api/hello");
      const r = await fetch(`${apiBase}/api/hello`, {
        method: "GET",
        cache: "no-store",
      });
      const body = await r.text();
      console.log("[health] status", r.status, "body:", body);
      if (!r.ok) {
        setErr(`/api/hello respondió ${r.status}: ${body}`);
      } else {
        setMsg("✅ API OK (/api/hello responde).");
      }
    } catch (e: any) {
      console.error("[health] exception:", e);
      setErr(`Excepción llamando /api/hello: ${e?.message ?? String(e)}`);
    }
  }

  const totals = progress?.totals ?? {};
  const recent = progress?.recent ?? [];
  const byPillar = progress?.by_pillar ?? {};

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 6 }}>Estadísticas</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Registra acciones y consulta tu progreso acumulado.
      </p>

      {/* Panel de salud */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={testApiHealth}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          Probar API
        </button>
        <button
          onClick={() => fetchProgress(externalId)}
          disabled={progressLoading}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: progressLoading ? "not-allowed" : "pointer",
            opacity: progressLoading ? 0.6 : 1,
          }}
        >
          {progressLoading ? "Actualizando…" : "Actualizar progreso"}
        </button>
      </div>

      {/* Formulario */}
      <form
        onSubmit={onRegister}
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 0.8fr auto",
          gap: 12,
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            External ID
          </label>
          <input
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            placeholder="p.ej. demo-1"
            autoComplete="off"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Action ID
          </label>
          <input
            value={actionId}
            onChange={(e) => setActionId(e.target.value)}
            placeholder="p.ej. ALI-BRO-043"
            autoComplete="off"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
              textTransform: "uppercase",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Cantidad
          </label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#9ca3af" : "#16a34a",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            height: 44,
          }}
          aria-busy={loading}
        >
          {loading ? "Registrando…" : "Registrar"}
        </button>
      </form>

      {/* Mensajes */}
      {msg && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 8,
            background: "#ecfdf5",
            color: "#065f46",
          }}
        >
          {msg}
        </div>
      )}
      {err && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 8,
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {err}
        </div>
      )}

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Card title="Acciones" value={String(totals.actions ?? 0)} loading={progressLoading} />
        <Card title="Puntos" value={String(totals.points ?? 0)} loading={progressLoading} />
        <Card title="Vida" value={String(totals.life ?? 0)} loading={progressLoading} />
      </div>

      {/* Vida por pilar */}
      {!!Object.keys(byPillar).length && (
        <div style={{ marginBottom: 12 }}>
          <h4 style={{ margin: "8px 0" }}>Vida ganada por pilar (días)</h4>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {Object.entries(byPillar).map(([pillar, days]) => (
              <li key={pillar}>
                <strong>{pillar}:</strong> {days}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actividad reciente */}
      <h3 style={{ marginTop: 20 }}>Actividad reciente</h3>
      {!recent?.length ? (
        <div style={{ opacity: 0.7 }}>Sin registros aún.</div>
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
                <tr key={`${r.id}-${idx}`} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <Td>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</Td>
                  <Td>{r.title ?? "-"}</Td>
                  <Td>{r.actionId}</Td>
                  <Td>{r.qty}</Td>
                  <Td>{r.points ?? "-"}</Td>
                  <Td>{r.life ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.6 }}>
        Abre DevTools → Network y Console. Al pulsar <b>Registrar</b> verás el <b>POST /api/actions/log</b>,
        y después el <b>GET /api/progress</b>.
      </p>
    </div>
  );
}

function Card({ title, value, loading }: { title: string; value: string; loading?: boolean }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid #eee",
        background: "#fff",
        minHeight: 84,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{loading ? "…" : value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        fontWeight: 700,
        fontSize: 13,
        borderBottom: "1px solid #eee",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 12px", fontSize: 14 }}>{children}</td>;
}



