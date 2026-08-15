import React, { useEffect, useState } from "react";
import { listPilaresMente, PilarVisible } from "../services/pilares";

// De cara al usuario, "Mente" ahora se presenta como 3 pilares
// independientes (Sueño / Estrés / Bienestar emocional) mediante un
// selector interno, aunque en el backend sigue siendo un único pilar
// ("MEN") — así lo pidió César. Se mantiene una sola pestaña "Mente" en
// el bottom nav (no se añaden 2 pestañas más) para no sobrecargar la
// navegación móvil; el reparto ocurre dentro de esta página.
//
// Nota: las fichas/retos/infografías de aquí son contenido divulgativo
// (tablas content_pieces / retos_insignia / infografias de la migración
// 0001), no acciones puntuables. No llevan botón "Hecho (+DVG)" como
// ContentCard: el registro de acciones y puntos sigue pasando por
// actions_catalog (pestaña Estadísticas / Retos), y conectar un reto
// insignia concreto con su regla real del motor (nota_motor) queda
// pendiente para una siguiente iteración.

const PILARES: { key: PilarVisible; label: string; color: string; emoji: string }[] = [
  { key: "Sueño", label: "Sueño", color: "#2E6E8E", emoji: "🌙" },
  { key: "Estrés", label: "Estrés", color: "#8E5A2E", emoji: "🧘" },
  { key: "Bienestar emocional", label: "Emociones", color: "#5A7D3A", emoji: "💛" },
];

export default function Mind() {
  const [data, setData] = useState<{ subpilares: any[]; fichas: any[]; retos: any[]; infografias: any[] }>({
    subpilares: [],
    fichas: [],
    retos: [],
    infografias: [],
  });
  const [activo, setActivo] = useState<PilarVisible>("Sueño");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setData(await listPilaresMente());
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const pilarActivo = PILARES.find((p) => p.key === activo)!;
  const infografia = data.infografias.find((i) => i.pilar_visible === activo);
  const fichas = data.fichas.filter((f) => f.pilar_visible === activo);
  const retos = data.retos.filter((r) => r.pilar_visible === activo);

  return (
    <div>
      <div className="border-b" style={{ background: `${pilarActivo.color}15` }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="text-xs text-gray-600">Mente</div>
          <div className="text-lg font-semibold leading-tight">Cuida tu atención y calma</div>

          <div className="flex gap-2 mt-3">
            {PILARES.map((p) => (
              <button
                key={p.key}
                onClick={() => setActivo(p.key)}
                className={`flex-1 text-xs rounded-full px-2 py-2 border transition ${
                  activo === p.key ? "text-white border-transparent" : "text-gray-600 border-gray-200 bg-white"
                }`}
                style={activo === p.key ? { background: p.color } : undefined}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-2">
            <button className="border rounded px-3 py-1 text-xs bg-white" onClick={load}>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 grid gap-4">
        {loading && <div>Cargando…</div>}
        {err && <div className="text-red-600">{err}</div>}

        {!loading && infografia && (
          <div className="rounded-2xl p-4 text-white" style={{ background: pilarActivo.color }}>
            <div className="text-xs opacity-90">{infografia.titulo}</div>
            <div className="text-2xl font-bold mt-1">{infografia.dato_destacado}</div>
            {infografia.dato_contexto && (
              <div className="text-xs opacity-90 mt-1">{infografia.dato_contexto}</div>
            )}
            {infografia.microhabito && (
              <div className="text-xs mt-3 bg-white/15 rounded-lg px-3 py-2">💡 {infografia.microhabito}</div>
            )}
          </div>
        )}

        {!loading && retos.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2">Retos insignia</div>
            <div className="grid gap-2">
              {retos.map((r) => (
                <div key={r.id} className="rounded-xl bg-white shadow ring-1 ring-gray-100 p-3">
                  <div className="font-medium text-sm">{r.nombre}</div>
                  <div className="text-xs text-gray-600 mt-1">{r.descripcion}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{r.duracion}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && fichas.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2">Fichas</div>
            <div className="grid gap-3">
              {fichas.map((f) => (
                <FichaCard key={f.id} ficha={f} color={pilarActivo.color} />
              ))}
            </div>
          </div>
        )}

        {!loading && fichas.length === 0 && retos.length === 0 && !infografia && (
          <div className="text-sm text-gray-500">No hay contenido publicado aún para {activo}.</div>
        )}
      </div>
    </div>
  );
}

function FichaCard({ ficha, color }: { ficha: any; color: string }) {
  const [open, setOpen] = useState(false);
  const fuentes: string[] = Array.isArray(ficha.fuentes) ? ficha.fuentes : [];

  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow ring-1 ring-gray-100 p-4">
      <span
        className="text-[11px] px-2 py-0.5 rounded-full"
        style={{ background: `${color}20`, color }}
      >
        {ficha.tipo === "ficha_pilar" ? "Pilar" : ficha.subpilar || "Subpilar"}
      </span>

      <div className="font-semibold leading-snug mt-2">{ficha.tema}</div>
      <div className="text-sm text-gray-600 mt-1">{ficha.texto_cliente}</div>

      {ficha.actividad_ancla && (
        <div className="text-xs text-gray-500 mt-2">🔗 Actividad: {ficha.actividad_ancla}</div>
      )}

      {fuentes.length > 0 && (
        <>
          <button className="text-xs text-gray-400 underline mt-2" onClick={() => setOpen((o) => !o)}>
            {open ? "Ocultar fuentes" : `Fuentes (${fuentes.length})`}
          </button>
          {open && (
            <ul className="text-[11px] text-gray-500 mt-1 list-disc list-inside">
              {fuentes.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
