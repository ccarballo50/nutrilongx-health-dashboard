import React, { useEffect, useState } from "react";
import { listPublicContent } from "../services/content";

export default function Challenges() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listPublicContent("RETOS");
        setItems(rows || []);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-4">Cargando…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;

  return (
    <div className="p-4 space-y-3">
      {items.map((r) => {
        const img = r.content_media?.find((m: any) => m.kind === "image")?.url;
        return (
          <div key={r.id} className="border rounded overflow-hidden bg-white">
            {img && <img src={img} alt={r.title} className="w-full h-40 object-cover" />}
            <div className="p-3">
              <div className="text-xs text-gray-500">{r.category}</div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-gray-700 line-clamp-3">{r.description}</div>
              {typeof r.dvg === "number" && (
                <div className="text-xs mt-1 text-gray-500">DVG: {r.dvg}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
