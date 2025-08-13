import React, { useState } from "react";

type Section = "RETOS" | "RUTINAS" | "MENTE";
type Category = "Cardio" | "Fuerza" | "Yoga" | "Mindfulness" | "Alimentación";

export default function AdminContentManager() {
  const [section, setSection] = useState<Section>("RETOS");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dvg, setDvg] = useState<number | "">("");
  const [category, setCategory] = useState<Category>("Cardio");
  const [createdBy, setCreatedBy] = useState("César");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function publish() {
    setMsg(null);

    if (!title.trim() || !description.trim()) {
      setMsg("Rellena título y descripción.");
      return;
    }
    if (section === "RETOS" && (dvg === "" || isNaN(Number(dvg)))) {
      setMsg("En RETOS, DVG debe ser un número.");
      return;
    }

    const body = {
      section,
      title: title.trim(),
      description: description.trim(),
      dvg: section === "RETOS" ? Number(dvg) : null,
      category,
      duration_min: null,
      level: null,
      tags: null,
      text_content: null,
      visibility: "public",           // <- PUBLICAMOS directamente
      created_by: createdBy,
      media: []                       // <- sin archivos en esta prueba
    };

    try {
      setSaving(true);
      const res = await fetch("/api/content/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const txt = await res.text();
      if (!res.ok) {
        setMsg(`Error ${res.status}: ${txt}`);
        return;
      }
      setMsg(`OK: ${txt}`);
      // limpia el formulario
      setTitle("");
      setDescription("");
      setDvg("");
    } catch (e: any) {
      setMsg(e?.message || "Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Admin · Publicación mínima</h1>

      <label className="block text-sm mb-1">Sección</label>
      <select className="border rounded px-3 py-2 mb-3 w-full"
        value={section} onChange={e => setSection(e.target.value as Section)}>
        <option>RETOS</option>
        <option>RUTINAS</option>
        <option>MENTE</option>
      </select>

      <label className="block text-sm mb-1">Título</label>
      <input className="border rounded px-3 py-2 mb-3 w-full"
        value={title} onChange={e => setTitle(e.target.value)} />

      <label className="block text-sm mb-1">Descripción</label>
      <textarea className="border rounded px-3 py-2 mb-3 w-full"
        value={description} onChange={e => setDescription(e.target.value)} />

      {section === "RETOS" && (
        <>
          <label className="block text-sm mb-1">DVG (número)</label>
          <input type="number" className="border rounded px-3 py-2 mb-3 w-40"
            value={dvg} onChange={e => setDvg(e.target.value === "" ? "" : Number(e.target.value))} />
        </>
      )}

      <label className="block text-sm mb-1">Categoría</label>
      <select className="border rounded px-3 py-2 mb-3 w-full"
        value={category} onChange={e => setCategory(e.target.value as Category)}>
        <option>Cardio</option>
        <option>Fuerza</option>
        <option>Yoga</option>
        <option>Mindfulness</option>
        <option>Alimentación</option>
      </select>

      <label className="block text-sm mb-1">Admin</label>
      <select className="border rounded px-3 py-2 mb-4 w-full"
        value={createdBy} onChange={e => setCreatedBy(e.target.value)}>
        <option>César</option>
        <option>Nutricionista</option>
        <option>Entrenador</option>
      </select>

      <button
        className="px-4 py-2 rounded text-white"
        style={{ background: "#111" }}
        onClick={publish}
        disabled={saving}
      >
        {saving ? "Publicando..." : "Publicar"}
      </button>

      {msg && (
        <div className="mt-4 text-sm">
          {msg.startsWith("OK:") ? (
            <div className="text-green-600 whitespace-pre-wrap">{msg}</div>
          ) : (
            <div className="text-red-600 whitespace-pre-wrap">{msg}</div>
          )}
        </div>
      )}
    </div>
  );
}


