import React, { useEffect, useState } from "react";
import { listPublicContent } from "../services/content";
import ContentCard from "../components/ContentCard";

export default function Routines() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try { setLoading(true); setItems(await listPublicContent("RUTINAS")); setErr(null); }
    catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const potential = items.reduce((acc, it) => acc + (Number(it?.dvg) || 0), 0);

  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="text-xs text-gray-600">Rutinas</div>
          <div className="text-lg font-semibold leading-tight">Construye tu hábito</div>
          <div className="text-xs text-gray-600 mt-1">DVG potencial: <b>+{potential}</b></div>
          <div className="flex justify-end mt-2">
            <button className="border rounded px-3 py-1 text-xs" onClick={load}>Actualizar</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 grid gap-4">
        {loading && <div>Cargando…</div>}
        {err && <div className="text-red-600">{err}</div>}
        {items.map((it: any) => (
          <ContentCard key={it.id} item={it} section="RUTINAS" />
        ))}
        {!loading && items.length === 0 && (
          <div className="text-sm text-gray-500">No hay rutinas publicadas aún.</div>
        )}
      </div>
    </div>
  );
}
