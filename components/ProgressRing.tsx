import React from "react";

export default function ProgressRing({ value, total }: { value: number; total: number }) {
  const radius = 36;
  const stroke = 6;
  const norm = (value && total) ? Math.min(1, Math.max(0, value / total)) : 0;
  const dash = 2 * Math.PI * radius;
  const filled = dash * norm;

  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={radius} stroke="#eee" strokeWidth={stroke} fill="none" />
      <circle
        cx="45" cy="45" r={radius}
        stroke="currentColor" strokeWidth={stroke} fill="none"
        strokeDasharray={`${filled} ${dash - filled}`} strokeLinecap="round"
        transform="rotate(-90 45 45)"
      />
      <text x="50%" y="52%" textAnchor="middle" fontSize="12" dominantBaseline="middle">
        {Math.round(norm * 100)}%
      </text>
    </svg>
  );
}
