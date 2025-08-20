// pages/Stats.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Stats Page – NutrilongX
 * - Registra acciones (POST /api/actions/log)
 * - Muestra progreso (GET /api/progress?externalId=...)
 * - Manejo de errores + trazas en consola para depuración
 */

type ProgressResponse = {
  ok?: boolean;
  externalId?: string;
  totals?: {
    actions?: number;
    points?: number;
    life?: number; // horas o días, según el back
  };
  // Opcional según tu back:
  recent?: Array<{
    id: string | number;
    actionId: string;
    qty: number;
    points?: number;
    life?: number;
    created_at?: string;
  }>;
  // fallback genérico
  [k: string]: any;
};

export default function StatsPage() {
  // Estado del formulario
  const [externalId, setExternalId] = useState<string>("demo-1");
  const [actionId, setActionId] = useState<string>("ALI-BRO-043");
  const [qty, setQty] = useState<number>(1);

  // Estado de UI
  const [loading, setLoading] = useState<boolean>(false);
  const [progressLoading, setProgressLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Datos de progreso
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  const progressQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (externalId) p.set("externalId", externalId.trim());
    return p.toString();
  }, [externalId]);

  const fetchProgress = useCallback(async () => {
    if (!externalId.trim()) return;
    setProgressLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/progress?${progressQuery}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });
      const data = (await res.json()) as ProgressResponse;
      console.log("[/api/progress] response:", data);
      if (!res.ok) {
        setError(`Error al obtener progreso (${res.status}): ${data?.error ?? "Desconocido"}`);
      } else {
        setProgress(data);
      }
    } catch (e: any) {
      console.error("[/api/progress] exception:", e);
      setError(`Excepción al obtener progreso: ${e?.message ?? e}`);
    } finally {
      setProgressLoading(false);
    }
  }, [externalId, progressQuery]);

  useEffect(() => {
    // Carga inicial del progreso
    fetchProgress();
  }, [fetchProgress]);

  const onSubmit = async (e: React.FormEven



