import React, { useEffect, useState } from "react";
import LevelBadge from "../components/LevelBadge";
import ProgressRing from "../components/ProgressRing";
import LeaderboardWidget from "../components/LeaderboardWidget";
import { ensureProfile } from "../services/profile";
import { fetchMe } from "../services/gamification";

type LevelDef = { level: number; name: string; threshold: number };

const LEVELS: LevelDef[] = [
  { level: 1, name: "Inicio",   threshold: 0 },
  { level: 2, name: "Bronce",   threshold: 50 },
  { level: 3, name: "Plata",    threshold: 150 },
  { level: 4, name: "Oro",      threshold: 300 },
  { level: 5, name: "Platino",  threshold: 600 },
  { level: 6, name: "Diamante", threshold: 1000 },
];

function nextThreshold(points: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (points >= l.threshold) current = l;
  const next = LEVELS.find((l) => l.threshold > current.threshold) || null;
  const toNext = next ? Math.max(0, next.threshold - points) : 0;
  const base = current.threshold;
  const total = next ? next.threshold - base : Math.max(points - base, 1);
  const value = points - base;
  return { current, next, toNext, total, value };
}

function badgeEmoji(code: string) {
  const map: Record<string, string> = {
    bronce: "🥉",
    plata: "🥈",
    oro: "🥇",
    platino: "🏆",
    diamante: "💎",
    streak3: "🔥",
    streak7: "🔥",
    streak14: "🔥",
    streak30: "🔥",
  };
  return map[code] ?? "🏅";
}
function humanBadge(code: string) {
  const map: Record<string, string> = {
    bronce: "Bronce",
    plata: "Plata",
    oro: "Oro",
    platino: "Platino",
    diamante: "Diamante",
    streak3: "Racha 3",
    streak7: "Racha 7",
    streak14: "Racha 14",
    streak30: "Racha 30",
  };
  return map[code] ?? code;
}

export default function Dashboard() {
  const [meDetail, setMeDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      await ensureProfile("Cliente");
      const detail = await fetchMe(); // { me, today, badges }
      setMeDetail(detail);
      setErr(null);
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const points = meDetail?.me?.points ?? 0;
  const level = meDetail?.me?.level ?? 1;
  const { current, next, toNext, total, value } = nextThreshold(points);

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* HERO / PROGRESO */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 border">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Tu progreso</div>
            <LevelBadge level={level} />
            <div className="text-xs text-gray-700">
              Puntos: <b>{points}</b>
            </div>
            {next ? (
              <div className="text-xs text-gray-700">
                Te faltan <b>{toNext}</b> para nivel {next.level} · {next.name}
              </div>
            ) : (
              <div className="text-xs text-gray-700">¡Máximo nivel! 🚀</div>
            )}
          </div>
          <div className="text-emerald-600">
            <ProgressRing value={value} total={total} />
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button className="border rounded px-3 py-1 text-xs" onClick={load}>
            Actualizar
          </button>
        </div>
      </div>

      {/* CLASIFICACIÓN */}
      <LeaderboardWidget />

      {/* RACHA, MISIONES Y MEDALLAS */}
      <div className="rounded-2xl p-4 bg-white shadow border space-y-3">
        {loading && <div className="text-sm">Cargando…</div>}
        {err && <div className="text-sm text-red-600">Error: {err}</div>}

        {!loading && meDetail && (
          <>
            {/* Racha */}
            <div>
              <div className="text-sm font-semibold">Racha</div>
              <div className="text-sm text-gray-700">
                🔥 Racha actual: <b>{meDetail.me?.streak_current || 0}</b> · Mejor:{" "}
                <b>{meDetail.me?.streak_best || 0}</b>
              </div>
            </div>

            {/* Misiones del día */}
            <div className="pt-1">
              <div className="text-sm font-semibold mb-1">Misiones de hoy</div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`px-2 py-1 rounded-full ${
                    meDetail.today?.retos > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  ✅ Reto
                </span>
                <span
                  className={`px-2 py-1 rounded-full ${
                    meDetail.today?.rutinas > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  ✅ Rutina
                </span>
                <span
                  className={`px-2 py-1 rounded-full ${
                    meDetail.today?.mente > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  ✅ Mente
                </span>
                {meDetail.today?.bonus_awarded && (
                  <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    ⭐ Bonus +5
                  </span>
                )}
              </div>
            </div>

            {/* Medallas */}
            <div className="pt-1">
              <div className="text-sm font-semibold mb-1">Medallas</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {(meDetail.badges || []).length === 0 && (
                  <span className="text-xs text-gray-500">
                    Aún sin medallas — ¡empieza hoy!
                  </span>
                )}
                {(meDetail.badges || []).map((b: any) => (
                  <span
                    key={b.badge_code}
                    className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-800 border"
                  >
                    {badgeEmoji(b.badge_code)} {humanBadge(b.badge_code)}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="text-[11px] text-gray-500">
        Tip: marca tus contenidos como <b>Hecho</b> para sumar DVG como puntos, completar
        misiones y subir de nivel.
      </div>
    </div>
  );
}
