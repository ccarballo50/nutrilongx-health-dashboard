import React, { useEffect, useState } from "react";
import * as RRD from "react-router-dom";
import { clientsApi } from "../../src/services/appsScriptClientsApi";
import { evidenceApi } from "../../src/services/appsScriptEvidenceApi";
import { actionsApi } from "../../src/services/appsScriptActionsApi";
import { progressApi } from "../../src/services/appsScriptProgressApi";
import { ContractError } from "../../src/services/appsScriptContract";
import type { ClientDetail as ClientDetailDto, AccreditAndCalculateResult } from "../../src/services/appsScriptDtos";
import type { ProgressSummary } from "../../src/services/appsScriptDtos";
import { MVP_PILLARS, actionsForPillar, type MvpAccreditedAction } from "../../src/services/mvpAccreditedActions";

/**
 * ClientToday — "HOY": primer MVP jugable visible de NUTRILONGX.
 *
 * Flujo "marcar hecho" (PLAYABLE_MVP_BACKEND_HANDOFF_v1.md §2):
 *   evidence.register -> actions.accreditAndCalculate -> progress.get
 *
 * No calcula DVG ni reproduce reglas de acreditación -- solo interpreta
 * `data.accredit.status` (validated/pending/rejected) para decidir el
 * feedback. Las 11 acciones acreditables vienen de
 * `mvpAccreditedActions.ts` (espejo del handoff), agrupadas por pilar.
 *
 * Deliberadamente NO intenta convertir cada `client_content_assignments`
 * en un botón HECHO: hoy `content_action_bindings` solo cubre
 * recipe/nutrition, y la mayoría de asignaciones no tienen una regla de
 * acreditación resoluble -- ver encargo PLAYABLE MVP UI INTEGRATION §6.
 * El bloque de asignaciones reales (ya construido en ClientDetail.tsx)
 * se enlaza aparte, no se duplica aquí.
 */

type DoneResult =
  | { kind: "validated"; dvg: number }
  | { kind: "pending" }
  | { kind: "rejected" }
  | { kind: "error"; code: string | null; message: string };

function errorInfo(e: unknown): { code: string | null; message: string } {
  if (e instanceof ContractError) return { code: e.code, message: e.message };
  return { code: null, message: e instanceof Error ? e.message : "Error desconocido" };
}

/** Mensaje genérico para errores técnicos (encargo sección 9) -- nunca se muestra error.message crudo al usuario final. */
function genericTechnicalMessage(code: string | null): string {
  switch (code) {
    case "UNAUTHORIZED":
      return "Sesión no autorizada. Vuelve a iniciar sesión en el Dashboard.";
    case "VALIDATION_ERROR":
      return "Los datos introducidos no son válidos. Revisa el valor e inténtalo de nuevo.";
    case "NOT_FOUND":
    case "CANONICAL_REFERENCE_NOT_FOUND":
      return "No se ha encontrado el recurso necesario para registrar esta actividad.";
    case "CONFLICT":
    case "DUPLICATE_REQUEST":
      return "Ya existe un registro para esta actividad.";
    case "DATA_INTEGRITY_ERROR":
    case "INTERNAL_ERROR":
    default:
      return "No se ha podido registrar la actividad. Inténtalo de nuevo en unos segundos.";
  }
}

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDvg(hours: number): string {
  return `${hours.toFixed(1)} h`;
}

function ActionCard({
  action,
  clientId,
  onDone,
}: {
  action: MvpAccreditedAction;
  clientId: string;
  onDone: (r: AccreditAndCalculateResult) => void;
}) {
  const [value, setValue] = useState<number>(action.threshold);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DoneResult | null>(null);

  async function markDone() {
    if (submitting) return; // bloquea doble click mientras la request está en vuelo (encargo sección 8)
    setSubmitting(true);
    setResult(null);

    // idempotency_key estable por cliente+accion+dia -- un doble click o un
    // reintento tras refrescar la pagina el mismo dia nunca crea una
    // segunda evidencia (evidence.register ya deduplica por esta clave).
    const idempotencyKey = `dashboard-${clientId}-${action.canonical_action_id}-${todayDateStr()}`;

    try {
      const registerPayload: Parameters<typeof evidenceApi.register>[0] = {
        client_id: clientId,
        source_type: "dashboard",
        occurred_at: new Date().toISOString(),
        idempotency_key: idempotencyKey,
        ...(action.field === "duration_minutes" ? { duration_minutes: value } : { quantity: value, unit: action.unit }),
        ...(action.resolution.type === "content"
          ? { source_content: { content_type: action.resolution.content_type, canonical_id: action.resolution.canonical_id } }
          : { source_entity_type: "canonical_action" as const, source_entity_id: action.canonical_action_id, pillar: action.pillar }),
      };

      const { evidence } = await evidenceApi.register(registerPayload);
      const outcome = await actionsApi.accreditAndCalculate(evidence.id);

      if (outcome.accredit.status === "validated" && outcome.gamification) {
        setResult({ kind: "validated", dvg: outcome.gamification.event_dvg_hours });
      } else if (outcome.accredit.status === "rejected") {
        setResult({ kind: "rejected" });
      } else {
        // "pending" (ACCREDITATION_REVIEW_REQUIRED) -- estado funcional, no un error.
        setResult({ kind: "pending" });
      }
      onDone(outcome);
    } catch (e) {
      const info = errorInfo(e);
      setResult({ kind: "error", code: info.code, message: genericTechnicalMessage(info.code) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border rounded-2xl p-4 bg-white shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{action.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{action.conditionHint}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <input
          type="number"
          className="w-24 border rounded px-2 py-1 text-sm"
          value={value}
          min={0}
          step={action.field === "quantity" ? 0.5 : 1}
          onChange={(e) => setValue(Number(e.target.value))}
          disabled={submitting}
          aria-label={action.field === "duration_minutes" ? "Minutos" : `Cantidad (${action.unit})`}
        />
        <span className="text-xs text-gray-500">
          {action.field === "duration_minutes" ? "min" : action.unit}
        </span>
        <button
          className="ml-auto bg-emerald-600 text-white text-sm rounded-full px-4 py-1.5 disabled:opacity-50"
          onClick={markDone}
          disabled={submitting}
        >
          {submitting ? "Registrando…" : "✓ HECHO"}
        </button>
      </div>

      {result && (
        <div className="mt-3 text-sm rounded-lg p-2.5">
          {result.kind === "validated" && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg p-2.5">
              ✓ Actividad registrada
              <br />+ {formatDvg(result.dvg)} de vida ganada
            </div>
          )}
          {result.kind === "pending" && (
            <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-lg p-2.5">
              Actividad registrada.
              <br />
              Pendiente de validación.
            </div>
          )}
          {result.kind === "rejected" && (
            <div className="bg-gray-100 text-gray-700 border border-gray-200 rounded-lg p-2.5">
              La actividad se ha registrado, pero no cumple los criterios de acreditación.
            </div>
          )}
          {result.kind === "error" && (
            <div className="bg-red-50 text-red-700 border border-red-100 rounded-lg p-2.5">
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientToday() {
  const { clientId } = RRD.useParams<{ clientId: string }>();

  const [client, setClient] = useState<ClientDetailDto | null>(null);
  const [clientErr, setClientErr] = useState<{ code: string | null; message: string } | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressErr, setProgressErr] = useState<{ code: string | null; message: string } | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  async function loadClient(id: string) {
    setClientLoading(true);
    setClientErr(null);
    try {
      const { client: c } = await clientsApi.get(id);
      setClient(c);
    } catch (e) {
      setClientErr(errorInfo(e));
    } finally {
      setClientLoading(false);
    }
  }

  async function loadProgress(id: string) {
    setProgressLoading(true);
    setProgressErr(null);
    try {
      const p = await progressApi.get(id);
      setProgress(p);
    } catch (e) {
      setProgressErr(errorInfo(e));
    } finally {
      setProgressLoading(false);
    }
  }

  useEffect(() => {
    if (clientId) {
      loadClient(clientId);
      loadProgress(clientId);
    } else {
      setClientLoading(false);
      setProgressLoading(false);
      setClientErr({ code: null, message: "No se proporcionó client_id en la URL." });
    }
  }, [clientId]);

  if (!clientId) {
    return (
      <div className="max-w-xl mx-auto p-4 text-sm text-red-600">
        No se proporcionó client_id en la URL.
      </div>
    );
  }

  const firstName = client ? client.first_name : null;

  return (
    <div className="max-w-xl mx-auto p-4 pb-10">
      <div className="mb-3">
        <RRD.Link to={`/admin/clients/${clientId}`} className="text-sm text-emerald-700 hover:underline">
          ← Ficha del cliente
        </RRD.Link>
      </div>

      <h1 className="text-xl font-semibold mb-1">
        {clientLoading ? "Cargando…" : firstName ? `Hola, ${firstName}` : "Hoy"}
      </h1>
      {clientErr && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3 mb-3">
          {clientErr.code && <div className="text-xs font-mono mb-1">{clientErr.code}</div>}
          Error al cargar el cliente: {clientErr.message}
        </div>
      )}

      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">Hoy</div>

      {MVP_PILLARS.map((p) => {
        const actions = actionsForPillar(p.key);
        return (
          <div key={p.key} className="mb-5">
            <div className="text-sm font-medium mb-2">
              {p.emoji} {p.label}
            </div>
            <div className="space-y-3">
              {actions.map((a) => (
                // `key` en el wrapper, no como prop de ActionCard -- mismo patrón que
                // ClientDetail.tsx/ContentCatalog.tsx (tsconfig sin strictNullChecks,
                // el despojo automático de `key` de las props de un hijo tipado no es fiable aquí).
                <div key={a.canonical_action_id}>
                  <ActionCard
                    action={a}
                    clientId={clientId}
                    onDone={(outcome) => {
                      if (outcome.accredit.status === "validated") loadProgress(clientId);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="border rounded-2xl p-4 bg-white shadow mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Vida ganada</h2>
          <button
            className="border rounded px-3 py-1 text-xs"
            onClick={() => loadProgress(clientId)}
            disabled={progressLoading}
          >
            {progressLoading ? "Cargando…" : "Actualizar"}
          </button>
        </div>

        {progressLoading && <div className="text-sm text-gray-500">Cargando progreso…</div>}

        {!progressLoading && progressErr && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
            {progressErr.code && <div className="text-xs font-mono mb-1">{progressErr.code}</div>}
            Error al cargar el progreso: {progressErr.message}
          </div>
        )}

        {!progressLoading && !progressErr && progress && (
          <>
            <div className="text-3xl font-semibold text-emerald-700">{formatDvg(progress.total_dvg_hours)}</div>
            {/* current_level solo se muestra si el backend lo resuelve -- nunca se inventa Bronce/Plata/Oro (encargo sección 5). */}
            {progress.current_level && (
              <div className="text-xs text-gray-500 mt-1">Nivel: {progress.current_level}</div>
            )}

            <div className="mt-4 space-y-1.5">
              {MVP_PILLARS.map((p) => (
                <div key={p.key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {p.emoji} {p.label}
                  </span>
                  <span className="font-medium">{formatDvg(progress.by_pillar[p.key] ?? 0)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
