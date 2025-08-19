// pages/Stats.tsx (extracto relevante de registrar)
async function registerAction() {
  setMsg(null);
  setErr(null);
  try {
    const r = await fetch(`/api/actions/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ externalId, actionId, qty })
    });
    const j = await r.json();
    if (!r.ok) {
      // mostramos todo lo que devuelva el servidor
      throw new Error(j?.error + (j?.supabase ? ` | ${j.supabase}` : ""));
    }
    setMsg(`Registrada ${actionId} x${qty}`);
    await loadProgress(); // refresca
  } catch (e: any) {
    setErr(e?.message || String(e));
  }
}


