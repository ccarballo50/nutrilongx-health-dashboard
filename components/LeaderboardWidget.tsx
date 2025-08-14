import React, { useEffect, useState } from "react";
import { fetchLeaderboard } from "../services/leaderboard";
import LevelBadge from "./LevelBadge";

export default function LeaderboardWidget() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try { setLoading(true); setData(await fetchLeaderboard()); setErr(null); }
    catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-sm">Cargando clasificación…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;
  if (!data) return null;

  const me = data.me;
  const top: any[] = data.top || [];

  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Clasificación</div>
        <LevelBadge level={data.level} />
      </div>
      <ol className="space-y-1">
        {top.map((u, i) => (
          <li key={u.external_id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 text-right">{i + 1}.</span>
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                {(u.display_name || "Anon").slice(0,1).toUpperCase()}
              </div>
              <span className="truncate max-w-[140px]">{u.display_name || "Anónimo"}</span>
            </div>
            <span className="text-gray-600">{u.points} pts</span>
          </li>
        ))}
      </ol>

      {me && (
        <div className="mt-3 text-xs text-gray-600">
          Tú: <b>{me.display_name || "Tú"}</b> · Nivel {me.level} · {me.points} pts
          {data.myRank ? <> · Puesto #{data.myRank}</> : null}
        </div>
      )}

      <div className="flex justify-end mt-2">
        <button className="border rounded px-3 py-1 text-xs" onClick={load}>Actualizar</button>
      </div>
    </div>
  );
}
