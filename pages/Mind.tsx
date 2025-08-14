import React, { useEffect, useState } from "react";
import { listPublicContent } from "../services/content";
import ContentCard from "../components/ContentCard";

export default function Mind() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try { setLoading(true); setItems(await listPublicContent("MENTE")); setErr(null); }
    catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const potential = items.reduce((acc, it) => acc + (Number(it?.dvg) || 0), 0);

  return (
    <div>
      <div className="bg-gradient-to-r from-fuchsia-50 to-rose-50 border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="text-xs text-gray-600">Mente</div>
          <div className="text-lg font-semibold leading-tight">Cuida tu atención y calma</div>
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
          <ContentCard key={it.id} item={it} section="MENTE" />
        ))}
        {!loading && items.length === 0 && (
          <div className="text-sm text-gray-500">No hay contenidos publicados aún.</div>
        )}
      </div>
    </div>
  );
}

