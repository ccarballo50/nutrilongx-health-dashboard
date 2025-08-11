import React, { useMemo, useRef, useState } from "react";

/**
 * AdminContentManager
 * -------------------------------------------------------------
 * Pantalla de administración para crear contenido destinado a
 * RUTINAS / RETOS / MENTE. Pensada para integrarse en un proyecto
 * React + Vite + TS + Tailwind.
 *
 * ✔ Selección de Admin (desplegable)
 * ✔ Selección de destino (Rutinas/Retos/Mente)
 * ✔ Nombre del reto / contenido (con sugerencias opcionales)
 * ✔ Descripción detallada (contador de caracteres)
 * ✔ Días de Vida Ganados (visible para Retos)
 * ✔ Ubicación / Categoría (Cardio, Fuerza, Yoga, Mindfulness, Alimentación)
 * ✔ Texto asociado (opcional)
 * ✔ Subida de archivos (drag&drop + múltiples: imagen / vídeo / fichero)
 * ✔ Previsualización y eliminación de adjuntos
 * ✔ Guardar como borrador o Publicar
 * ✔ onSave prop para integrarlo con tu store / API
 * ✔ Fallback: guarda en localStorage si no se pasa onSave
 *
 * Integración mínima:
 * 1) Añade una ruta: <Route path="/admin/content" element={<AdminContentManager adminNames={["César","Nutricionista","Entrenador"]} />} />
 * 2) Implementa onSave para despachar a tu Context/Reducer o POST a tu API.
 * 3) (Opcional) Sustituye el almacenamiento local por Vercel Blob / Supabase.
 */

// Tipos --------------------------------------------------------
export type Section = "RETOS" | "RUTINAS" | "MENTE";
export type Categoria = "Cardio" | "Fuerza" | "Yoga" | "Mindfulness" | "Alimentación";

export type MediaKind = "image" | "video" | "file";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  size: number; // bytes
  type: string; // mime
  url: string; // objectUrl o URL remota tras subirlo a tu backend
}

export interface AdminContentPayload {
  id: string;
  adminName: string;
  section: Section;
  title: string; // nombre del reto/contenido
  description: string;
  diasVidaGanados?: number; // aplica sobre todo a RETOS
  categoria: Categoria;
  textContent?: string; // texto adicional opcional
  media: MediaItem[];
  status: "draft" | "published";
  createdAt: string; // ISO
}

export interface AdminContentManagerProps {
  adminNames?: string[]; // para el selector de admins
  existingTitles?: string[]; // para sugerencias (datalist)
  onSave?: (item: AdminContentPayload) => Promise<void> | void; // integración con contexto/API
}

// Utilidades ---------------------------------------------------
const uid = () => Math.random().toString(36).slice(2);

const MAX_FILES = 12;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024; // 200 MB

const ACCEPT = [
  "image/*",
  "video/*",
  ".pdf",
  ".txt",
  ".md",
].join(",");

// Componente ---------------------------------------------------
const AdminContentManager: React.FC<AdminContentManagerProps> = ({
  adminNames = ["César", "Nutricionista", "Entrenador"],
  existingTitles = [
    "Reto 10k pasos",
    "Rutina fuerza inicial",
    "Mindfulness 5 min",
    "Plan proteína semanal",
  ],
  onSave,
}) => {
  const [adminName, setAdminName] = useState(adminNames[0] ?? "");
  const [section, setSection] = useState<Section>("RETOS");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [diasVidaGanados, setDVG] = useState<number | "">("");
  const [categoria, setCategoria] = useState<Categoria>("Cardio");
  const [textContent, setTextContent] = useState<string>("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const totalBytes = useMemo(() => media.reduce((sum, m) => sum + (m.size || 0), 0), [media]);

  const tituloLabel = useMemo(() => {
    if (section === "RETOS") return "Elige nombre del reto";
    if (section === "RUTINAS") return "Nombre de la rutina";
    return "Nombre del contenido"; // MENTE
  }, [section]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDVG("");
    setCategoria("Cardio");
    setTextContent("");
    setMedia([]);
  }

  function showToast(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  }

  function onFilesSelected(files: FileList | null) {
    if (!files) return;

    const next: MediaItem[] = [];
    let bytes = totalBytes;

    for (const file of Array.from(files)) {
      if (media.length + next.length >= MAX_FILES) break;
      if (bytes + file.size > MAX_TOTAL_BYTES) break;

      const kind: MediaKind = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file";

      const url = URL.createObjectURL(file);
      next.push({ id: uid(), kind, name: file.name, size: file.size, type: file.type, url });
      bytes += file.size;
    }

    if (next.length) setMedia((prev) => [...prev, ...next]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) onFilesSelected(e.dataTransfer.files);
  }

  function removeMedia(id: string) {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }

  function validate(): string | null {
    if (!adminName) return "Selecciona un administrador";
    if (!section) return "Selecciona el destino";
    if (!title.trim()) return "Indica un nombre";
    if (!description.trim()) return "Añade una descripción";
    if (section === "RETOS" && (diasVidaGanados === "" || Number.isNaN(Number(diasVidaGanados)))) {
      return "Introduce los Días de Vida Ganados (número)";
    }
    return null;
  }

  async function handleSave(status: "draft" | "published") {
    const err = validate();
    if (err) {
      showToast(err);
      return;
    }

    setSaving(true);
    try {
      const payload: AdminContentPayload = {
        id: uid(),
        adminName,
        section,
        title: title.trim(),
        description: description.trim(),
        diasVidaGanados: section === "RETOS" ? Number(diasVidaGanados) : undefined,
        categoria,
        textContent: textContent?.trim() || undefined,
        media,
        status,
        createdAt: new Date().toISOString(),
      };

      if (onSave) {
        await onSave(payload);
      } else {
        // Fallback: guardar en localStorage si no se provee onSave
        const key = "nlx_admin_drafts";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.unshift(payload);
        localStorage.setItem(key, JSON.stringify(prev));
      }

      showToast(status === "published" ? "Contenido publicado" : "Borrador guardado");
      resetForm();
    } catch (e) {
      console.error(e);
      showToast("No se pudo guardar. Reintenta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Administrador · Carga de contenido</h1>
          <p className="text-sm text-gray-500">Sube y publica contenido para RUTINAS, RETOS o MENTE de forma rápida.</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs text-gray-600">v1</span>
      </header>

      {/* Selección básica */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">Administrador</label>
          <select
            aria-label="Selecciona administrador"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {adminNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">Destino</label>
          <div className="grid grid-cols-3 gap-2">
            {(["RETOS", "RUTINAS", "MENTE"] as Section[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={section === s}
                onClick={() => setSection(s)}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  section === s ? "border-indigo-600 bg-indigo-50" : "hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">Ubicación / Categoría</label>
          <select
            aria-label="Selecciona categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {(["Cardio", "Fuerza", "Yoga", "Mindfulness", "Alimentación"] as Categoria[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </section>

      <hr className="my-6" />

      {/* Título + Descripción */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">{tituloLabel}</label>
          <input
            list="existing-titles"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Escribe o selecciona…"
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {existingTitles?.length ? (
            <datalist id="existing-titles">
              {existingTitles.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          ) : null}
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">{section === "RETOS" ? "Días de Vida Ganados" : "Días de Vida Ganados (opcional)"}</label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={diasVidaGanados}
            onChange={(e) => setDVG(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={section === "RETOS" ? "p. ej. 3" : ""}
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">Indicador de impacto. Útil para priorizar RETOS.</p>
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium">Descripción detallada</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe el contenido, instrucciones y criterios de éxito…"
            className="w-full resize-y rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="mt-1 text-right text-xs text-gray-500">{description.length} caracteres</div>
        </div>
      </section>

      <hr className="my-6" />

      {/* Texto asociado opcional */}
      <section className="mb-4">
        <label className="mb-1 block text-sm font-medium">Texto asociado (opcional)</label>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          rows={3}
          placeholder="Contenido textual, receta, pauta, guion del vídeo…"
          className="w-full resize-y rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </section>

      {/* Subida de archivos */}
      <section>
        <label className="mb-2 block text-sm font-medium">Subir archivos (imagen, vídeo o ficheros)</label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
            isDragging ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"
          }`}
          onClick={() => inputRef.current?.click()}
          role="button"
          aria-label="Subir archivos"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mb-2">
            <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 16.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm">Arrastra y suelta archivos aquí o haz clic para seleccionarlos</p>
          <p className="mt-1 text-xs text-gray-500">Hasta {MAX_FILES} archivos · Máx {(MAX_TOTAL_BYTES / (1024 * 1024)).toFixed(0)} MB en total</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => onFilesSelected(e.target.files)}
          />
        </div>

        {/* Galería de previsualización */}
        {media.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {media.map((m) => (
              <div key={m.id} className="group relative overflow-hidden rounded-xl border">
                <button
                  type="button"
                  onClick={() => removeMedia(m.id)}
                  className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2 py-1 text-xs shadow hover:bg-white"
                  aria-label={`Eliminar ${m.name}`}
                >
                  ✕
                </button>
                {m.kind === "image" && (
                  <img src={m.url} alt={m.name} className="h-48 w-full object-cover" />
                )}
                {m.kind === "video" && (
                  <video src={m.url} controls className="h-48 w-full object-cover" />)
                }
                {m.kind === "file" && (
                  <div className="flex h-48 w-full items-center justify-center bg-gray-50 p-4 text-center text-sm">
                    <div>
                      <div className="mb-2 font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">{(m.size / (1024 * 1024)).toFixed(1)} MB · {m.type || "archivo"}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Resumen de peso total */}
        {media.length > 0 && (
          <div className="mt-2 text-right text-xs text-gray-500">
            Tamaño total: {(totalBytes / (1024 * 1024)).toFixed(1)} MB
          </div>
        )}
      </section>

      {/* Acciones */}
      <footer className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-xs text-gray-500">
          Consejo: mantén los títulos breves y empieza la descripción con el verbo de acción ("Completa", "Realiza", "Practica").
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("draft")}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("published")}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60"
          >
            Publicar
          </button>
        </div>
      </footer>

      {/* Toast simple */}
      {message && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminContentManager;
