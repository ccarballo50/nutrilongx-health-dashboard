import React, { useState } from "react";
import DvgBadge from "./DvgBadge";
import AdviceCard from "./AdviceCard";
import { logAchievement } from "../services/achievements";

type Section = "RETOS" | "RUTINAS" | "MENTE";

export default function ContentCard({
  item,
  section,
}: {
  item: any;
  section: Section;
}) {
  const [showAdvice, setShowAdvice] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const img = item?.content_media?.find((m: any) => m.kind === "image")?.url;
  const gain = Number.isFinite(item?.dvg) ? Number(item.dvg) : 1;

  async function markDone() {
    try {
      setSaving(true);
      const res = await logAchievement({
        contentId: item.id,
        section,
        title: item.title,
        dvg: item.dvg ?? 1,
      });
      // res: { ok, level, levelName, points, nextLevel, toNext, streakCurrent, streakBest, dailyBonusAwarded, badges }
      const parts = [
        `¡Hecho! +${gain} pts`,
        `Nivel ${res.level}`,
        res.toNext ? `faltan ${res.toNext}` : null,
        `🔥 Racha ${res.streakCurrent}`,
        res.dailyBonusAwarded ? "⭐ Bonus diario +5" : null,
        Array.isArray(res.badges) ? `🏅 ${res.badges.length} medallas` : null,
      ].filter(Boolean);
      setDoneMsg(parts.join(" · "));
      setTimeout(() => setDoneMsg(null), 3500);
    } catch (e: any) {
      setDoneMsg(`Error: ${e?.message || "no se pudo registrar"}`);
      setTimeout(() => setDoneMsg(null), 3500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow ring-1 ring-gray-100">
      {img && (
        <img src={img} alt={item.title} className="w-full aspect-video object-cover" />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {item.category}
          </span>
          <DvgBadge dvg={item.dvg} />
        </div>

        <div className="font-semibold leading-snug">{item.title}</div>
        <div className="text-sm text-gray-600">{item.description}</div>

        <div className="flex gap-2 pt-2">
          <button
            className="text-xs px-3 py-1.5 rounded bg-emerald-600 text-white"
            onClick={() => setShowAdvice((s) => !s)}
          >
            {showAdvice ? "Cerrar consejo" : "Consejo IA"}
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded border"
            onClick={markDone}
            disabled={saving}
            title="Sumar DVG como puntos"
          >
            {saving ? "Guardando…" : `Hecho (+${gain})`}
          </button>
        </div>

        {showAdvice && (
          <div className="pt-2">
            <AdviceCard
              defaultPrompt="Ayúdame a completar esto paso a paso"
              context={{
                section,
                title: item.title,
                category: item.category,
                dvg: item.dvg ?? null,
              }}
            />
          </div>
        )}

        {doneMsg && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
            {doneMsg}
          </div>
        )}
      </div>
    </div>
  );
}

