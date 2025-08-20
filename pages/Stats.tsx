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

  // helpers sin tipos genéricos
  const doPost = () =>
    fetch("/api/actions/log", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ externalId: ext, actionId: act, qty: q }),
    });

  const doGet = () => {
    const qs = new URLSearchParams({
      externalId: ext,
      actionId: act,
      qty: String(q),
    }).toString();
    return fetch(`/api/actions/log?${qs}`, { method: "GET", cache: "no-cache" });
  };

  let terminado = false;
  let fallbackLanzado = false;
  let timerId: any = null;

  const manejarRespuesta = async (label: "POST" | "GET", res: Response) => {
    if (terminado) return;
    const texto = await res.text();
    let data: any = {};
    try { data = texto ? JSON.parse(texto) : {}; } catch { data = { raw: texto }; }
    console.log(`[log] ${label} status:`, res.status, data);

    if (res.ok && data && data.ok) {
      terminado = true;
      if (timerId) clearTimeout(timerId);
      setMessage(`✅ Acción registrada (${label}).`);
      await fetchProgress();
      setLoading(false);
    } else {
      throw new Error(data?.error ?? data?.details ?? data?.message ?? `HTTP ${res.status}`);
    }
  };

  try {
    // Lanza POST
    const postProm = doPost().then((r) => manejarRespuesta("POST", r));

    // Si en 3s no ha resuelto, lanza GET en paralelo
    timerId = setTimeout(() => {
      if (!terminado && !fallbackLanzado) {
        fallbackLanzado = true;
        void doGet()
          .then((r) => manejarRespuesta("GET", r))
          .catch((err) => console.warn("[log] GET fallo:", err));
      }
    }, 3000);

    // Espera a que termine cualquiera
    await postProm;

    // Si POST falló antes de que GET se lanzara/terminara, intenta un GET directo como último recurso
    if (!terminado && !fallbackLanzado) {
      const r = await doGet();
      await manejarRespuesta("GET", r);
    }
  } catch (err: any) {
    console.error("[log] error:", err);
    if (timerId) clearTimeout(timerId);
    setError(`No se pudo registrar la acción: ${err?.message ?? String(err)}`);
    setLoading(false);
  }
};



