import React, { useCallback, useMemo, useRef, useState } from "react";

/**
 * AdminContentManager
 * - Sube cada archivo a /api/upload (Supabase Storage) → recibe URL pública
 * - Crea el registro en /api/content/create con esas URLs
 * - Nada de localStorage; todo va a la nube
 */

type Section = "RETOS" | "RUTINAS" | "MENTE";
type Category = "Cardio" | "Fuerza" | "Yoga" | "Mindfulness" | "Alimentación";
type SaveStatus = "draft" | "published";
type MediaKind = "image" | "video" | "file";

type Props = { adminNames?: string[] };

type MediaItem = {
  id: string;
  kind: MediaKind;
  name: string;
  size: number;
  type: string;
  url: string;   // objectURL para preview; se sustituye por la URL pública tras subir
  file?: File;   // el File real para subir
};

const DEFAULT_ADMINS = ["César", "Nutricionista", "Entrenador"];
const ACCEPT = [
  "image/*",
  "video/*",
  ".pdf",
  ".txt",
  ".md",
  ".doc",
  ".docx",
].join(",");

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function detectKind(mime: string): MediaKind {
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  return "file";
}

export default function AdminContentManager({ adminNames = DEFAULT_ADMINS }: Props) {
  // FORM
  const [adminName, setAdminName] = useState<string>(adminNames[0] ?? "Admin");
  const [section, setSection] = useState<Section>("RETOS");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [diasVidaGanados, setDiasVidaGanados] = useState<number | "">("");
  const [categoria, setCategoria] = useState<Category>("Cardio");
  const [textContent, setTextContent] = useState<string>("");

  // MEDIA
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // UI
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  const canShowDVG = section === "RETOS";

  const derivedErrors = useMemo(() => {
    const errs: string[] = [];
    if (!section) errs.push("Falta la sección.");
    if (!title.trim()) errs.push("Falta el título.");
    if (!description.trim()) errs.push("Falta la descripción.");
    if (!categoria) errs.push("Falta la categoría.");
    if (section === "RETOS" && (diasVidaGanados === "" || isNaN(Number(diasVidaGanados)))) {
      errs.push("En RETOS debes indicar los DVG (número).");
    }
    return errs;
  }, [section, title, description, categoria, diasVidaGanados]);

  const showToast = (type: "ok" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  /** Seleccionar archivos (input) o soltar (drop) */
  const onFilesSelected = useCallback((files: FileList | null) => {
    if (!files || !files.length) return;
    const next: MediaItem[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      next.push({
        id: uid(),
        kind: detectKind(file.type),
        name: file.name,
        size: file.size,
        type: file.type,
        url,      // preview
        file,     // NECESARIO para /api/upload
      });
    });
    setMedia((prev) => [...next, ...prev]);
  }, []);

  // Drag & drop handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    onFilesSelected(e.dataTransfer.files);
  };

  const removeMedia = (id: string) => setMedia((prev) => prev.filter((m) => m.id !== id));

  function resetForm() {
    setTitle("");
    setDescription("");
    setDiasVidaGanados("");
    setCategoria("Cardio");
    setTextContent("");
    setMedia([]);
  }

  /** Sube 1 archivo a /api/upload y devuelve la URL pública */
  async function uploadOneToSupabase(m: MediaItem): Promise<string> {
    if (!m.file) return m.url; // si no hay File, devolvemos la URL tal cual
    const resp = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "x-filename": m.name,
        "x-content-type": m.type || "application/octet-stream",
      },
      body: m.file,
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Upload failed (${resp.status}): ${txt}`);
    }
    const data = await resp.json();
    return data.url as string; // URL pública del Storage
  }

  /** Guardar borrador o publicar */
  async function handleSaveToDB(status: SaveStatus) {
    if (derivedErrors.length) {
      showToast("error", derivedErrors[0]);
      return;
    }
    try {
      setSaving(true);

      // 1) Subir archivos (si hay)
      const uploaded = await Promise.all(
        media.map(async (m) => ({
          ...m,
          url: await uploadOneToSupabase(m), // sustituimos objectURL por URL pública
          file: undefined,                   // ya no necesitamos el File
        }))
      );

      // 2) Payload final
      const body = {
        section,
        title: title.trim(),
        description: description.trim(),
        dvg: section === "RETOS" ? Number(diasVidaGanados) : null,
        category: categoria,
        duration_min: null,
        level: null,
        tags: null,
        text_content: textContent?.trim() || null,
        visibility: status === "published" ? "public" : "draft",
        created_by: adminName,
        media: uploaded, // ← aquí van las URLs públicas
      };

      // 3) Crear en BD
      const res = await fetch("/api/content/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      // DEBUG: deja trazas claras en consola por si algo falla
      console.log("create response status:", res.status);
      if (!res.ok) {
        const txt = await res.text();
        console.error("create error body:", txt);
        throw new Error(`Create failed (${res.status})`);
      }
      const json = await res.json();
      console.log("create response json:", json);

      showToast("ok", status === "published" ? "Contenido publicado" : "Borrador guardado");
      resetForm();
    } catch (err: any) {
      console.error(err);
      showToast("error", err?.message || "No se pudo guardar/publicar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-24">
      <h1 className="text-2xl font-semibold mt-4 mb-2">Gestor de Contenidos</h1>
      <p className="text-sm text-gray-600 mb-6">
        Publica contenido para <strong>RETOS</strong>, <strong>RUTINAS</strong> o <strong>MENTE</strong>.
        Al publicar, los archivos suben a la nube y el contenido se guarda en la base de datos.
      </p>

      {/* ADMIN */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Administrador</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
          >
            {adminNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* SECCIÓN */}
        <div>
          <label className="block text-sm font-medium mb-1">Destino</label>
          <div className="flex gap-2 flex-wrap">
            {(["RETOS", "RUTINAS", "MENTE"] as Section[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                className={`px-3 py-1.5 rounded border ${
                  section === s ? "bg-black text-white border-black" : "bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* TÍTULO */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {section === "RETOS" ? "Nombre del reto" : "Nombre del contenido"}
          </label>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Ej. 10k pasos progresivo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* DESCRIPCIÓN */}
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea
            className="w-full rounded border px-3 py-2 min-h-[100px]"
            placeholder="Describe el objetivo, estructura y recomendaciones…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* DVG */}
        {canShowDVG && (
          <div>
            <label className="block text-sm font-medium mb-1">Días de Vida Ganados (DVG)</label>
            <input
              type="number"
              className="w-40 rounded border px-3 py-2"
              placeholder="Ej. 3"
              value={diasVidaGanados}
              onChange={(e) => {
                const v = e.target.value;
                setDiasVidaGanados(v === "" ? "" : Number(v));
              }}
            />
          </div>
        )}

        {/* CATEGORÍA */}
        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Category)}
          >
            {(["Cardio", "Fuerza", "Yoga", "Mindfulness", "Alimentación"] as Category[]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* TEXTO OPCIONAL */}
        <div>
          <label className="block text-sm font-medium mb-1">Texto asociado (opcional)</label>
          <textarea
            className="w-full rounded border px-3 py-2 min-h-[100px]"
            placeholder="Contenido textual, receta, pausa, guion del vídeo…"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        </div>
      </div>

      {/* UPLOADER */}
      <div
        className={`mt-6 p-6 border-2 rounded-md ${dragActive ? "border-black bg-gray-50" : "border-dashed"}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium">Subir archivos</div>
            <div className="text-xs text-gray-500">
              Arrastra y suelta aquí o <span className="underline">haz clic para seleccionar</span>.
              Soportado: imágenes, vídeos, PDF, TXT, DOC/DOCX.
            </div>
          </div>
          <button
            className="px-3 py-1.5 rounded border"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Elegir archivos
          </button>
        </div>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          multiple
          accept={ACCEPT}
          onChange={(e) => onFilesSelected(e.target.files)}
        />
      </div>

      {/* PREVIEWS */}
      {!!media.length && (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {media.map((m) => (
            <div key={m.id} className="border rounded p-3 flex items-center gap-3 bg-white">
              <Thumb item={m} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-xs text-gray-500">
                  {m.type || m.kind} · {(m.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button className="text-red-600 text-sm underline" type="button" onClick={() => removeMedia(m.id)}>
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ERRORES */}
      {derivedErrors.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded p-3">
          <ul className="list-disc ml-5">{derivedErrors.map((e, i) => (<li key={i}>{e}</li>))}</ul>
        </div>
      )}

      {/* BOTONES */}
      <div className="h-16" />
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur p-3">
        <div className="max-w-xl mx-auto flex items-center justify-end gap-2">
          <button
            className="px-4 py-2 rounded border"
            type="button"
            disabled={saving}
            onClick={() => handleSaveToDB("draft")}
          >
            Guardar borrador
          </button>
          <button
            className="px-4 py-2 rounded text-white"
            style={{ background: "#111" }}
            type="button"
            disabled={saving}
            onClick={() => handleSaveToDB("published")}
          >
            {saving ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded text-sm shadow ${
            toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Thumb({ item }: { item: MediaItem }) {
  if (item.kind === "image") {
    return <img src={item.url} alt={item.name} className="w-16 h-16 object-cover rounded" />;
  }
  if (item.kind === "video") {
    return <video className="w-16 h-16 rounded object-cover" src={item.url} muted controls={false} />;
  }
  return (
    <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
      Archivo
    </div>
  );
}

