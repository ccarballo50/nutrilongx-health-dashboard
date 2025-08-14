import React, { useEffect, useState } from "react";
import LevelBadge from "../components/LevelBadge";
import ProgressRing from "../components/ProgressRing";
import LeaderboardWidget from "../components/LeaderboardWidget";
import { fetchLeaderboard } from "../services/leaderboard";
import { ensureProfile } from "../services/profile";

const LEVELS = [
  { level: 1, name: 'Inicio',   threshold: 0 },
  { level: 2, name: 'Bronce',   threshold: 50 },
  { level: 3, name: 'Plata',    threshold: 150 },
  { level: 4, name: 'Oro',      threshold: 300 },
  { level: 5, name: 'Platino',  threshold: 600 },
  { level: 6, name: 'Diamante', threshold: 1000 },
];

function nextThreshold(points: number) {
  let current = LEVELS[0], next = null as any;
  for (const l of LEVELS) if (points >= l.threshold) current = l;
  next = LEVELS.find(l => l.threshold > current.threshold) || null;
  return { current, next, toNext: next ? Math.max(0, next.threshold - points) : 0 };
}

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    await ensureProfile("Cliente");
    const lb = await fetchLeaderboard(); // trae "me"
    setMe(lb.me); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const pts = me?.points ?? 0;
  const { current, next, toNext } = nextThreshold(pts);
  const total = next ? (next.threshold - current.threshold) : pts || 1;
  const value = next ? (pts - current.threshold) : total;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 border">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Tu progreso</div>
            <LevelBadge level={me?.level || 1} />
            <div className="text-xs text-gray-600">Puntos: <b>{pts}</b></div>
            {next ? (
              <div className="text-xs text-gray-600">Te faltan <b>{toNext}</b> para nivel {next.level} · {next.name}</div>
            ) : (
              <div className="text-xs text-gray-600">¡Máximo nivel! 🚀</div>
            )}
          </div>
          <div className="text-emerald-600">
            <ProgressRing value={value} total={total} />
          </div>
        </div>
      </div>

      <LeaderboardWidget />

      {!loading && (
        <div className="text-xs text-gray-500">
          Tip: marca tus contenidos como <b>Hecho</b> para sumar DVG como puntos y subir de nivel.
        </div>
      )}
    </div>
  );
}
