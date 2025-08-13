import React, { useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabaseClient";

type Row = {
  id: string;
  section: "RETOS" | "RUTINAS" | "MENTE";
  title: string;
  dvg: number | null;
  category: string;
  created_at: string;
};

export default function AdminContentList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("content")
      .select("id, section, title, dvg, category, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setRows((data as Row[]) || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este contenido?")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/content/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      alert(e.message || "No se pudo borrar");
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-4">Cargando…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Contenidos</h1>
      <div className="text-sm text-gray-600 mb-3">
        Total: {rows.length} · Recientes primero
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="border rounded p-3 bg-white">
            <div className="text-xs text-gray-500">
              {r.section} · {r.category} · {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-gray-500">DVG: {r.dvg ?? "-"}</div>
            <div className="mt-2 flex gap-2">
              {/* Para editar, más abajo añadimos el endpoint de update */}
              <button
                className="px-3 py-1 rounded border"
                onClick={() => alert("Edición rápida en la próxima iteración")}
              >
                Editar
              </button>
              <button
                className="px-3 py-1 rounded border text-red-600"
                disabled={deleting === r.id}
                onClick={() => handleDelete(r.id)}
              >
                {deleting === r.id ? "Borrando…" : "Borrar"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
