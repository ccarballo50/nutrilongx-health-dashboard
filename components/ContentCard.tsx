import React, { useState } from "react";
import DvgBadge from "./DvgBadge";
import AdviceCard from "./AdviceCard";

export default function ContentCard({ item, section }: { item: any; section: "RETOS"|"RUTINAS"|"MENTE" }) {
  const [showAdvice, setShowAdvice] = useState(false);
  const img = item?.content_media?.find((m: any) => m.kind === "image")?.url;

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
            onClick={() => setShowAdvice(s => !s)}
          >
            {showAdvice ? "Cerrar consejo" : "Consejo IA"}
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
                dvg: item.dvg ?? null
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
