import React from "react";

export default function DvgBadge({ dvg }: { dvg?: number | null }) {
  if (dvg == null || isNaN(Number(dvg))) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
      <span aria-hidden>✨</span> DVG +{Number(dvg)}
    </span>
  );
}
