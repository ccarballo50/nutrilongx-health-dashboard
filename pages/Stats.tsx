const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const ext = externalId.trim();
  const act = actionId.trim().toUpperCase();
  const q = Number(qty) || 0;

  if (!ext || !act || q <= 0) {
    setError("Completa externalId, actionId y una cantidad válida (>0).");
    return;
  }

  setLoading(true);
  setError("");
  setMessage("");

  // helpers
  const post = () =>
    fetch("/api/actions/log", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ externalId: ext, actionId: act, qty: q }),
    });

  const get = () => {
    const qs = new URLSearchParams({
      externalId: ext,
      actionId: act,
      qty: String(q),
    }).toString();
    return fetch(`/api/actions/log?${qs}`, { method: "GET", cache: "no-cache" });
  };

  // Si el POST tarda más de 3s, lanzamos GET en paralelo.
  let done = false;
  const take = async (label: "POST" | "GET", res: Response) => {
    if (done) return;
    const txt = await res.text();
    let data: any = {};
    try { data = txt ? JSON.parse(txt) : {}; } catch { data = { raw: txt }; }
    console.log(`[log] ${label} status:`, res.status, data);

    if (res.ok && data?.ok) {
      done = true;
      setMessage(`✅ Acción registrada (${label}).`);
      await fetchProgress();
    } else {
      throw new Error(data?.error ?? data?.details ?? data?.message ?? `HTTP ${res.status}`);
    }
  };

  try {
    const postPromise = post().then(r => take("POST", r));
    const timer = new Promise<void>((resolve) => setTimeout(resolve, 3000)); // 3s
    // cuando pasa el timer, disparamos GET; pero no cancelamos el POST (el primero que llegue gana)
    const getAfterTimer = timer.then(() => get().then(r => take("GET", r)).catch(() => {}));

    await Promise.race([postPromise, getAfterTimer]);

    // si el primero falló, espera al otro por si salva
    if (!done) {
      await Promise.allSettled([postPromise, getAfterTimer]);
      if (!done) throw new Error("No se pudo registrar por POST ni por GET.");
    }
  } catch (err: any) {
    console.error("[log] error:", err);
    setError(`No se pudo registrar la acción: ${err?.message ?? String(err)}`);
  } finally {
    setLoading(false);
  }
};



