import React, { useState } from "react";

export default function AdviceCard({ defaultPrompt = "Quiero mantenerme activo esta semana" }:{
  defaultPrompt?: string;
}) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  async function ask() {
    setErr(""); setLoading(true);
    try {
      const r = await fetch("/api/advice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
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
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-sm font-semibold mb-2">Consejo IA</div>
      <div className="flex gap-2 mb-2">
        <input className="flex-1 border rounded px-2 py-1"
               value={prompt} onChange={e => setPrompt(e.target.value)} />
        <button className="px-3 py-1 rounded bg-black text-white"
                onClick={ask} disabled={loading}>
          {loading ? "Pensando…" : "Pedir"}
        </button>
      </div>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {text && <div className="text-sm whitespace-pre-wrap">{text}</div>}
    </div>
  );
}
