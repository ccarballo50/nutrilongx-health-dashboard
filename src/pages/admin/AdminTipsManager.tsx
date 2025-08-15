import React, { useEffect, useMemo, useState } from "react";

/**
 * AdminTipsManager
 * - Crea tips
 * - Segmenta por niveles (numéricos), usuarios (externalId) y etiquetas (tags)
 * - Lista últimos tips creados con sus targets
 */
type Tip = {
  id: string;
  title: string;
  body: string;
  is_ai: boolean;
  weight: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  targets?: {
    levels: number[];
    tags: string[];
    users: { user_id: string; external_id: string }[];
  };
};

const ALL_LEVELS = [
  { n: 1, label: "1 · Inicio" },
  { n: 2, label: "2 · Bronce" },
  { n: 3, label: "3 · Plata" },
  { n: 4, label: "4 · Oro" },
  { n: 5, label: "5 · Platino" },
  { n: 6, label: "6 · Diamante" },
];

export default function AdminTipsManager() {
  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isAI, setIsAI] = useState(false);
  const [weight, setWeight] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");

  // Targets
  const [levels, setLevels] = useState<number[]>([]);
  const [extIdsText, setExtIdsText] = useState(""); // externalIds separados por coma/espacio/nueva línea
  const [tagsText, setTagsText] = useState("");     // tags separados por coma/espacio/nueva línea

  // UX
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Listado
  const [tips, setTips] = useState<Tip[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const externalIds = useMemo(() =>
    splitCsv(extIdsText).filter(Boolean),
    [extIdsText]
  );
  const tags = useMemo(() =>
    splitCsv(tagsText).map(t => t.toLowerCase()).filter(Boolean),
    [tagsText]
  );

  useEffect(() => { loadTips(); }, []);

  async function loadTips() {
    setLoadingList(true);
    setErr(null);
    try {
      const r = await fetch("/api/tips/list?limit=50", { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setTips(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoadingList(false);
    }
  }

  function toggleLevel(n: number) {
    setLevels(prev => prev.includes(n) ? prev.filter(x => x !== n) : prev.concat(n));
  }

  function resetForm() {
    setTitle(""); setBody(""); setIsAI(false); setWeight(1); setIsActive(true);
    setStartAt(""); setEndAt("");
    setLevels([]); setExtIdsText(""); setTagsText("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!title.trim() || !body.trim()) {
      setErr("Título y cuerpo son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        is_ai: isAI,
        weight: Number(weight || 1),
        is_active: !!isActive,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
        targets: {
          levels,
          userExternalIds: externalIds,
          tags
        }
      };
      const r = await fetch("/api/tips/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setMsg("Tip creado correctamente.");
      resetForm();
      await loadTips();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Tips (Admin)</h1>
        <p className="text-sm text-gray-600">
          Crea un tip y segmenta por niveles, usuarios (externalId) o etiquetas.
        </p>
      </header>

      {err && <div className="p-2 text-sm bg-red-50 text-red-700 border border-red-100 rounded">{err}</div>}
      {msg && <div className="p-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">{msg}</div>}

      {/* Formulario */}
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-white p-4">
        <div>
          <label className="text-sm font-medium">Título</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Motívate hoy"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Cuerpo (base)</label>
          <textarea
            className="mt-1 w-full border rounded px-3 py-2 h-28"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Texto base del tip. Si activas IA, se reescribe con contexto."
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isAI} onChange={e => setIsAI(e.target.checked)} />
            <span className="text-sm">Generar con IA</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm">Peso</span>
            <input
              type="number"
              min={1}
              className="w-20 border rounded px-2 py-1"
              value={weight}
              onChange={e => setWeight(Number(e.target.value || 1))}
            />
          </div>

          <label className="inline-flex items-center gap-2 ml-auto">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            <span className="text-sm">Activo</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Inicio (opcional)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded px-3 py-2"
              value={startAt}
              onChange={e => setStartAt(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Fin (opcional)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded px-3 py-2"
              value={endAt}
              onChange={e => setEndAt(e.target.value)}
            />
          </div>
        </div>

        {/* Targets */}
        <div className="border-t pt-3 space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">Niveles</div>
            <div className="flex flex-wrap gap-2">
              {ALL_LEVELS.map(l => (
                <button
                  key={l.n}
                  type="button"
                  onClick={() => toggleLevel(l.n)}
                  className={`text-xs px-2 py-1 rounded border ${
                    levels.includes(l.n) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Usuarios (externalId, separados por coma/espacios)</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={extIdsText}
              onChange={e => setExtIdsText(e.target.value)}
              placeholder="demo-1, césar-123, user-xyz"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Etiquetas (tags, separados por coma/espacios)</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={tagsText}
              onChange={e => setTagsText(e.target.value)}
              placeholder="cardio, alimentación, nivel:oro, reto:XXXX-UUID"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-emerald-600 text-white"
          >
            {saving ? "Guardando…" : "Crear tip"}
          </button>
          <button type="button" className="px-4 py-2 rounded border" onClick={resetForm}>
            Limpiar
          </button>
        </div>
      </form>

      {/* Lista */}
      <section className="space-y-2">
        <div className="text-sm font-medium">Últimos tips</div>
        {loadingList ? (
          <div className="text-sm text-gray-600">Cargando…</div>
        ) : tips.length === 0 ? (
          <div className="text-sm text-gray-500">Aún no hay tips.</div>
        ) : (
          <div className="space-y-3">
            {tips.map(t => (
              <div key={t.id} className="border rounded bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{t.title}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                    {t.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="text-sm text-gray-700">{t.body}</div>
                <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-2">
                  <span>IA: {t.is_ai ? 'sí' : 'no'}</span>
                  <span>Peso: {t.weight}</span>
                  {t.start_at && <span>Inicio: {fmtDate(t.start_at)}</span>}
                  {t.end_at && <span>Fin: {fmtDate(t.end_at)}</span>}
                </div>
                {/* Targets */}
                <div className="mt-2 text-xs flex flex-wrap gap-2">
                  {t.targets?.levels?.length ? (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      Niveles: {t.targets.levels.join(', ')}
                    </span>
                  ) : <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-600">Niveles: —</span>}

                  {t.targets?.tags?.length ? (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                      Tags: {t.targets.tags.join(', ')}
                    </span>
                  ) : <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-600">Tags: —</span>}

                  {t.targets?.users?.length ? (
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                      Usuarios: {t.targets.users.map(u => u.external_id).join(', ')}
                    </span>
                  ) : <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-600">Usuarios: —</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function splitCsv(s: string): string[] {
  return s
    .split(/[\s,;]+/g)
    .map(x => x.trim())
    .filter(Boolean);
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
