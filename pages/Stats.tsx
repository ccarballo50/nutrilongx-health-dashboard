import React, { useEffect, useMemo, useState } from "react";

/** =========================
 *  Tipos de datos esperados
 *  ========================= */
type ProgressByPillar = Record<string, number>;

type RecentItem = {
  id?: string;
  ts?: string;                 // ISO string
  action_id?: string;
  qty?: number;
  hours?: number;
  days?: number;
  pillar?: string;
  title?: string;
};

type ProgressResponse = {
  externalId: string;
  total_days: number;
  total_hours: number;
  by_pillar: ProgressByPillar;
  recent: RecentItem[];
  // (opcional) meta
  user?: { name?: string; level?: string | number; points?: number };
};

type LogPostBody = {
  externalId: string;
  actionId: string;
  qty: number;
};

/** =========================
 *  Utilidades
 *  ========================= */
function parseHashQuery(): URLSearchParams {
  const raw = (window.location.hash || "").split("?")[1] || "";
  return new URLSearchParams(raw);
}

function resolveExternalId(): string {
  // 1) del hash (#/stats?externalId=xxx)
  const qs = parseHashQuery();
  const fromHash = qs.get("externalId") || qs.get("user") || undefined;

  // 2) de localStorage
  const fromLS = localStorage.getItem("external_id") || undefined;

  // 3) fallback
  return fromHash ?? fromLS ?? "demo-1";
}

function fmt(n: number, digits = 2) {
  if (isNaN(n)) return "0";
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** =========================
 *  Componente principal
 *  ========================= */
const Stats: React.FC = () => {
  // ---------- Estado principal ----------
  const [externalId, setExternalId] = useState<string>(() => resolveExternalId());
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Registrar acción (form)
  const [actionId, setActionId] = useState("RET-INI-001");
  const [qty, setQty] = useState<number>(1);
  const [postBusy, setPostBusy] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postOk, setPostOk] = useState<string | null>(null);

  // ---------- Cargar progreso ----------
  async function fetchProgress(id: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const url = `/api/progress?externalId=${encodeURIComponent(id)}`;
      const r = await fetch(url, { method: "GET" });
      const data = await r.json();
      if (!r.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : r.statusText);
      }
      setProgress(data as ProgressResponse);
    } catch (e: any) {
      setLoadError(e?.message ?? String(e));
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial
  useEffect(() => {
    // guarda en LS cada vez que cambie
    if (externalId) localStorage.setItem("external_id", externalId);
    fetchProgress(externalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalId]);

  // ---------- Registrar acción ----------
  async function registerAction() {
    setPostBusy(true);
    setPostError(null);
    setPostOk(null);

    try {
      const body: LogPostBody = {
        externalId,
        actionId: actionId.trim(),
        qty: Number(qty) || 1,
      };
      const r = await fetch("/api/actions/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : r.statusText);
      }
      setPostOk("¡Acción registrada!");
      // refrescar progreso
      await fetchProgress(externalId);
    } catch (e: any) {
      setPostError(e?.message ?? String(e));
    } finally {
      setPostBusy(false);
    }
  }

  const userName = useMemo(() => progress?.user?.name ?? "—", [progress]);
  const userLevel = useMemo(() => progress?.user?.level ?? "—", [progress]);
  const userPoints = useMemo(() => progress?.user?.points ?? 0, [progress]);

  // Para pintar tabla por pilar
  const pillarEntries = useMemo(() => {
    const map = progress?.by_pillar || {};
    return Object.entries(map); // [ ["RET", 1.23], ["ALI", 0.5], ... ]
  }, [progress]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Estadísticas</h1>

      {/* Barra superior: External ID + botones */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          display: "grid",
          gap: 8,
          gridTemplateColumns: "1fr auto auto",
          alignItems: "center",
        }}
      >
        <div>
          <label style={{ fontSize: 12, color: "#666" }}>External ID</label>
          <input
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6 }}
            placeholder="demo-1"
          />
        </div>
        <button
          onClick={() => fetchProgress(externalId)}
          style={{
            padding: "10px 14px",
            background: "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Actualizar
        </button>
        <div style={{ fontSize: 12, color: "#888", textAlign: "right" }}>
          {loading ? "Cargando…" : loadError ? `Error: ${loadError}` : null}
        </div>
      </div>

      {/* Cards de cabecera */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={card}>
          <div style={cardTitle}>Usuario</div>
          <div style={cardBig}>{userName}</div>
          <div style={cardSub}>ID: {externalId || "—"}</div>
        </div>
        <div style={card}>
          <div style={cardTitle}>Nivel</div>
          <div style={cardBig}>{String(userLevel)}</div>
          <div style={cardSub}>Puntos: {fmt(Number(userPoints) || 0, 0)}</div>
        </div>
        <div style={card}>
          <div style={cardTitle}>Vida ganada total</div>
          <div style={cardBig}>{fmt(progress?.total_days ?? 0)} días</div>
          <div style={cardSub}>{fmt(progress?.total_hours ?? 0)} horas</div>
        </div>
      </div>

      {/* Vida por pilar */}
      <div style={cardBlock}>
        <div style={blockTitle}>Vida ganada por pilar (días)</div>
        {pillarEntries.length === 0 ? (
          <div style={muted}>Sin datos aún.</div>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Pilar</th>
                <th style={thRight}>Días</th>
              </tr>
            </thead>
            <tbody>
              {pillarEntries.map(([pillar, days]) => (
                <tr key={pillar}>
                  <td style={td}>{pillar}</td>
                  <td style={tdRight}>{fmt(days)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Actividad reciente */}
      <div style={cardBlock}>
        <div style={blockTitle}>Actividad reciente</div>
        {progress?.recent?.length ? (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Acción</th>
                <th style={thRight}>Qty</th>
                <th style={thRight}>Horas</th>
                <th style={thRight}>Días</th>
              </tr>
            </thead>
            <tbody>
              {progress.recent.map((it, idx) => (
                <tr key={it.id ?? idx}>
                  <td style={td}>{fmtDate(it.ts)}</td>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{it.action_id}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {it.title ?? it.pillar ?? "—"}
                    </div>
                  </td>
                  <td style={tdRight}>{it.qty ?? 1}</td>
                  <td style={tdRight}>{fmt(it.hours ?? 0)}</td>
                  <td style={tdRight}>{fmt(it.days ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={muted}>Sin registros aún.</div>
        )}
      </div>

      {/* Registrar acción de prueba */}
      <div style={cardBlock}>
        <div style={blockTitle}>Registrar acción de prueba</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr auto auto", gap: 8 }}>
          <input
            value={actionId}
            onChange={(e) => setActionId(e.target.value)}
            placeholder="RET-INI-001"
            style={input}
          />
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            style={input}
          />
          <button onClick={registerAction} disabled={postBusy} style={btnPrimary}>
            {postBusy ? "Enviando…" : "Registrar"}
          </button>
          <button onClick={() => fetchProgress(externalId)} style={btn}>
            Refrescar
          </button>
        </div>

        {postError && (
          <div style={{ marginTop: 8, color: "#B00020", fontSize: 13 }}>
            Error: {postError}
          </div>
        )}
        {postOk && (
          <div style={{ marginTop: 8, color: "#0C7A43", fontSize: 13 }}>{postOk}</div>
        )}

        <div style={{ marginTop: 10, color: "#666", fontSize: 12, lineHeight: 1.4 }}>
          Consejo: los IDs de acción válidos salen del catálogo (p. ej. <b>RET-INI-001</b>,{" "}
          <b>RUT-INI-005</b>, etc.).
        </div>
      </div>
    </div>
  );
};

/** =========================
 *  Estilos inline sencillos
 *  ========================= */
const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 8,
  padding: 12,
};

const cardTitle: React.CSSProperties = { fontSize: 12, color: "#666", marginBottom: 6 };
const cardBig: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 4 };
const cardSub: React.CSSProperties = { fontSize: 12, color: "#888" };

const cardBlock: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
};

const blockTitle: React.CSSProperties = { fontWeight: 700, marginBottom: 8 };
const muted: React.CSSProperties = { color: "#777", fontSize: 14 };

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #eee",
  padding: "8px 6px",
  fontSize: 13,
  color: "#666",
};

const thRight: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #f4f4f4" };
const tdRight: React.CSSProperties = { ...td, textAlign: "right" };

const input: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
};

const btn: React.CSSProperties = {
  padding: "10px 14px",
  background: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  background: "#23a559",
  color: "#fff",
  border: "1px solid #1e914e",
  borderRadius: 6,
  cursor: "pointer",
};

export default Stats;


// Dentro de Stats.tsx (en el final, por ejemplo)
const [catItems, setCatItems] = useState<any[]>([]);
const [pillar, setPillar] = useState<string>("Retos (Ejercicio)");

async function loadCatalog() {
  if (!extId) return;
  const p = pillar ? `&pillar=${encodeURIComponent(pillar)}` : "";
  const r = await fetch(`/api/actions/by-level?externalId=${encodeURIComponent(extId)}${p}`);
  const j = await r.json();
  setCatItems(j.items || []);
}

// En el JSX:
<div className="card">
  <div className="card-header">Catálogo por nivel (desde Excel)</div>
  <div className="card-body">
    <div className="row g-2">
      <div className="col-8">
        <select className="form-select" value={pillar} onChange={e => setPillar(e.target.value)}>
          <option>Retos (Ejercicio)</option>
          <option>Rutinas</option>
          <option>Alimentación</option>
          <option>Mente</option>
        </select>
      </div>
      <div className="col-4">
        <button className="btn btn-outline-primary w-100" onClick={loadCatalog}>Ver</button>
      </div>
    </div>
    <ul className="mt-3 list-group">
      {catItems.map((it:any) => (
        <li key={it.id} className="list-group-item">
          <div className="fw-bold">{it.title}</div>
          <div className="text-muted">{it.subpillar} · {it.unit}</div>
          <small>+{it.life_days} días / +{it.life_hours} h</small>
        </li>
      ))}
      {catItems.length === 0 && <div className="text-muted">Sin elementos para este pilar/nivel.</div>}
    </ul>
  </div>
</div>

