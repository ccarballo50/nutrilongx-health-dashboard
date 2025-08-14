import React, { useEffect, useState } from "react";
import { listByCategory } from "../services/content";
import ContentCard from "../components/ContentCard";
import AdviceCard from "../components/AdviceCard";

export default function Nutrition() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setItems(await listByCategory("Alimentación"));
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const potential = items.reduce((acc, it) => acc + (Number(it?.dvg) || 0), 0);

  return (
    <div>
      {/* HERO */}
      <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="text-xs text-gray-600">Alimentación</div>
          <div className="text-lg font-semibold leading-tight">Come mejor, vive más</div>
          <div className="text-xs text-gray-600 mt-1">DVG potencial: <b>+{potential}</b></div>
          <div className="flex justify-end mt-2">
            <button className="border rounded px-3 py-1 text-xs" onClick={load}>Actualizar</button>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <AdviceCard defaultPrompt="Proponme un menú saludable para hoy (desayuno, comida y cena)" />
        {loading && <div>Cargando…</div>}
        {err && <div className="text-red-600">{err}</div>}
        {items.map((it: any) => (
          <ContentCard key={it.id} item={it} section={it.section as "RETOS"|"RUTINAS"|"MENTE"} />
        ))}
        {!loading && items.length === 0 && (
          <div className="text-sm text-gray-500">Aún no hay contenidos de Alimentación.</div>
        )}
      </div>
    </div>
  );
}
