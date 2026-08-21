import React, { useEffect, useState } from "react";
import * as RRD from "react-router-dom";
import { clientsApi } from "../../src/services/appsScriptClientsApi";
import { contentApi } from "../../src/services/appsScriptContentApi";
import { ContractError } from "../../src/services/appsScriptContract";
import type { AssignmentItem, ClientDetail as ClientDetailDto, ClientProfile } from "../../src/services/appsScriptDtos";

/**
 * ClientDetail — ficha básica de cliente, de solo lectura.
 *
 * Consume clientsApi.get(clientId) + clientsApi.getProfile(clientId)
 * (PR-01/PR-02) y, en un bloque independiente, contentApi.listAssignments
 * (PR-05A). No edita, no crea, no asigna ni desasigna contenido. Ese
 * alcance queda para un PR posterior explícito.
 *
 * El bloque de asignaciones NO enriquece con el catálogo (no llama a
 * listRecipes/listExercises/listMind, sin joins en frontend): muestra
 * exactamente lo que devuelve client_content_assignments vía
 * listAssignments (id, client_id, content_id, pillar, status,
 * assigned_at, notes -- content_type/canonical_id NO son columnas de esa
 * tabla, ver supabase/migrations/0002_standalone_backend_v1.sql; se
 * intentan leer igualmente de forma tolerante por si un backend futuro
 * los añade, mostrando "—" si no están).
 */

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-1.5 border-b border-gray-100 last:border-0">
      <div className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-gray-800">{value ?? "—"}</div>
    </div>
  );
}

/** Renderiza un valor de perfil (posiblemente objeto/array/primitivo) de forma legible. */
function ProfileValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">—</span>;
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      if (value.length === 0) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {String(v)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <pre className="text-xs bg-gray-50 border rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  if (typeof value === "object") {
    if (Object.keys(value as Record<string, unknown>).length === 0) {
      return <span className="text-gray-400">—</span>;
    }
    return (
      <pre className="text-xs bg-gray-50 border rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <span className="text-sm text-gray-800">{String(value)}</span>;
}

function errorMessage(e: unknown): { code: string | null; message: string } {
  if (e instanceof ContractError) return { code: e.code, message: e.message };
  return { code: null, message: e instanceof Error ? e.message : "Error desconocido" };
}

/** Primer valor no vacío entre varias claves candidatas (DTO provisional, no todas presentes siempre). */
function pick(item: AssignmentItem, keys: string[]): unknown {
  for (const k of keys) {
    const v = item[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function asText(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

/** Renderiza el contenido de una asignación (no un componente propio con `key`, ver ContentCatalog.tsx). */
function renderAssignmentRow(a: AssignmentItem) {
  const assignmentId = pick(a, ["assignment_id", "id"]);
  const contentType = pick(a, ["content_type"]);
  const canonicalId = pick(a, ["canonical_id"]);
  const contentId = pick(a, ["content_id"]);
  const pillar = pick(a, ["pillar"]);
  const status = pick(a, ["status"]);
  const when = pick(a, ["assigned_at", "created_at"]);
  const notes = pick(a, ["notes"]);

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-gray-500 font-mono">{asText(assignmentId)}</div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
          {asText(status)}
        </span>
      </div>
      <div className="text-sm text-gray-800 mt-1">
        Tipo: {asText(contentType)} · Canónico: {asText(canonicalId)}
      </div>
      <div className="text-xs text-gray-500 mt-1 font-mono">Content ID: {asText(contentId)}</div>
      <div className="text-xs text-gray-500 mt-1">
        Pilar: {asText(pillar)} · Asignado: {formatDate(when)}
      </div>
      {notes !== undefined && <div className="text-sm text-gray-700 mt-2">{asText(notes)}</div>}
    </>
  );
}

export default function ClientDetail() {
  const { clientId } = RRD.useParams<{ clientId: string }>();

  const [client, setClient] = useState<ClientDetailDto | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [clientErr, setClientErr] = useState<{ code: string | null; message: string } | null>(null);
  const [profileErr, setProfileErr] = useState<{ code: string | null; message: string } | null>(null);

  // Bloque de asignaciones: deliberadamente independiente de client/profile
  // (su propio loading/error) para que un fallo o lentitud aquí nunca
  // bloquee ni oculte los datos básicos del cliente.
  const [assignments, setAssignments] = useState<AssignmentItem[] | null>(null);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsErr, setAssignmentsErr] = useState<{ code: string | null; message: string } | null>(null);

  async function load(id: string) {
    setLoading(true);
    setClientErr(null);
    setProfileErr(null);
    setClient(null);
    setProfile(null);

    const [clientResult, profileResult] = await Promise.allSettled([
      clientsApi.get(id),
      clientsApi.getProfile(id),
    ]);

    if (clientResult.status === "fulfilled") {
      setClient(clientResult.value.client);
    } else {
      setClientErr(errorMessage(clientResult.reason));
    }

    if (profileResult.status === "fulfilled") {
      // profile puede venir null legítimamente (cliente sin ficha aún) --
      // no es un error, ver clients.getProfile en el contrato.
      setProfile(profileResult.value.profile);
    } else {
      setProfileErr(errorMessage(profileResult.reason));
    }

    setLoading(false);
  }

  async function loadAssignments(id: string) {
    setAssignmentsLoading(true);
    setAssignmentsErr(null);
    try {
      const { assignments: rows } = await contentApi.listAssignments(id);
      setAssignments(rows);
    } catch (e) {
      setAssignmentsErr(errorMessage(e));
    } finally {
      setAssignmentsLoading(false);
    }
  }

  useEffect(() => {
    if (clientId) {
      load(clientId);
      loadAssignments(clientId);
    } else {
      setLoading(false);
      setClientErr({ code: null, message: "No se proporcionó client_id en la URL." });
      setAssignmentsLoading(false);
    }
  }, [clientId]);

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="mb-3">
        <RRD.Link to="/admin/clients" className="text-sm text-emerald-700 hover:underline">
          ← Volver a clientes
        </RRD.Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">
          {client ? `${client.first_name} ${client.last_name ?? ""}`.trim() : "Ficha de cliente"}
        </h1>
        {clientId && (
          <button
            className="border rounded px-3 py-1 text-xs"
            onClick={() => load(clientId)}
            disabled={loading}
          >
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        )}
      </div>

      {clientId && (
        <RRD.Link
          to={`/admin/clients/${clientId}/today`}
          className="block text-center bg-emerald-600 text-white text-sm font-medium rounded-xl px-4 py-2.5 mb-4"
        >
          Ver HOY — marcar actividades y DVG
        </RRD.Link>
      )}

      {loading && <div className="text-sm text-gray-500 mb-4">Cargando ficha…</div>}

      {!loading && clientErr && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3 mb-4">
          {clientErr.code && <div className="text-xs font-mono mb-1">{clientErr.code}</div>}
          Error al cargar el cliente: {clientErr.message}
        </div>
      )}

      {!loading && client && (
        <div className="border rounded-2xl p-4 bg-white shadow mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Datos básicos</h2>
          <Field label="ID" value={<span className="font-mono text-xs">{client.id}</span>} />
          <Field label="Código externo" value={client.external_code} />
          <Field label="Nombre" value={`${client.first_name} ${client.last_name ?? ""}`.trim()} />
          <Field label="Email" value={client.email} />
          <Field label="Teléfono" value={client.phone} />
          <Field label="Estado" value={client.status} />
          <Field label="Creado" value={formatDate(client.created_at)} />
          <Field label="Actualizado" value={formatDate(client.updated_at)} />
        </div>
      )}

      {!loading && !clientErr && (
        <div className="border rounded-2xl p-4 bg-white shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Perfil</h2>

          {profileErr && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
              {profileErr.code && <div className="text-xs font-mono mb-1">{profileErr.code}</div>}
              Error al cargar el perfil: {profileErr.message}
            </div>
          )}

          {!profileErr && profile === null && (
            <div className="text-sm text-gray-500">Perfil no completado.</div>
          )}

          {!profileErr && profile !== null && (
            <>
              <Field label="Fecha de nacimiento" value={formatDate(profile.birth_date)} />
              <Field label="Sexo" value={profile.sex} />
              <Field label="Etiquetas clínicas" value={<ProfileValue value={profile.clinical_tags} />} />
              <Field label="Objetivos" value={<ProfileValue value={profile.goals} />} />
              <Field label="Preferencias" value={<ProfileValue value={profile.preferences} />} />
              <Field label="Restricciones" value={<ProfileValue value={profile.restrictions} />} />
              <Field label="Metadata" value={<ProfileValue value={profile.metadata} />} />
            </>
          )}
        </div>
      )}

      {!loading && !clientErr && client && (
        <div className="border rounded-2xl p-4 bg-white shadow mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Asignaciones actuales</h2>
            <button
              className="border rounded px-3 py-1 text-xs"
              onClick={() => loadAssignments(client.id)}
              disabled={assignmentsLoading}
            >
              {assignmentsLoading ? "Cargando…" : "Actualizar asignaciones"}
            </button>
          </div>

          {assignmentsLoading && <div className="text-sm text-gray-500">Cargando asignaciones…</div>}

          {!assignmentsLoading && assignmentsErr && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
              {assignmentsErr.code && <div className="text-xs font-mono mb-1">{assignmentsErr.code}</div>}
              Error al cargar las asignaciones: {assignmentsErr.message}
            </div>
          )}

          {!assignmentsLoading && !assignmentsErr && assignments && assignments.length === 0 && (
            <div className="text-sm text-gray-500">Este cliente no tiene contenido asignado todavía.</div>
          )}

          {!assignmentsLoading && !assignmentsErr && assignments && assignments.length > 0 && (
            <ul className="space-y-2">
              {assignments.map((a) => (
                <li key={a.id} className="border rounded p-3">
                  {renderAssignmentRow(a)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
