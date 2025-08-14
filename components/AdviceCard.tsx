import React, { useState } from "react";

type Ctx = { title?: string; section?: string; category?: string; dvg?: number | null };

export default function AdviceCard({
  defaultPrompt = "Quiero un consejo para hoy",
  context,
}: { defaultPrompt?: string; context?: Ctx }) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  async function ask() {
    setErr(""); setLoading(true);
    try {
      // enriquecemos el prompt con el contexto (título + DVG si llega)
      const extra =
        context
          ? `\nContexto: ${[
              context.section && `Sección: ${context.section}`,
              context.title && `Título: ${context.title}`,
              context.category && `Categoría: ${context.category}`,
              (context.dvg ?? null) !== null && `DVG: ${context.dvg}`
            ].filter(Boolean).join(" · ")}`
          : "";

      const r = await fetch("/api/advice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: `${prompt}${extra}`, profile: context }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error IA");
      setText(j.text || "");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm">
      <div className="text-sm font-semibold mb-2">Consejo IA</div>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Escribe tu objetivo…"
        />
        <button
          className="px-3 py-2 rounded bg-black text-white text-sm"
          onClick={ask}
          disabled={loading}
        >
          {loading ? "Pensando…" : "Pedir"}
        </button>
      </div>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {text && <div className="text-sm whitespace-pre-wrap leading-relaxed">{text}</div>}
    </div>
  );
}
