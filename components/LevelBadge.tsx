import React from "react";

const MAP: Record<number, { name: string; bg: string; text: string }> = {
  1: { name: "Inicio",   bg: "bg-gray-100",   text: "text-gray-800" },
  2: { name: "Bronce",   bg: "bg-amber-100",  text: "text-amber-800" },
  3: { name: "Plata",    bg: "bg-slate-100",  text: "text-slate-800" },
  4: { name: "Oro",      bg: "bg-yellow-100", text: "text-yellow-800" },
  5: { name: "Platino",  bg: "bg-cyan-100",   text: "text-cyan-800" },
  6: { name: "Diamante", bg: "bg-indigo-100", text: "text-indigo-800" },
};

export default function LevelBadge({ level }: { level: number }) {
  const m = MAP[level] || MAP[1];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${m.bg} ${m.text}`}>
      <span aria-hidden>🏅</span> Nivel {level} · {m.name}
    </span>
  );
}
