import React, { useEffect, useState } from "react";
import * as RRD from "react-router-dom";
import { clientsApi } from "../../src/services/appsScriptClientsApi";
import { ContractError } from "../../src/services/appsScriptContract";
import type { ClientDetail as ClientDetailDto, ClientProfile } from "../../src/services/appsScriptDtos";

/**
 * ClientDetail — ficha básica de cliente, de solo lectura.
 *
 * Consume clientsApi.get(clientId) + clientsApi.getProfile(clientId)
 * (PR-01/PR-02). No edita, no crea, no asigna contenido. Ese alcance
 * queda para un PR posterior explícito.
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

export default function ClientDetail() {
  const { clientId } = RRD.useParams<{ clientId: string }>();

  const [client, setClient] = useState<ClientDetailDto | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [clientErr, setClientErr] = useState<{ code: string | null; message: string } | null>(null);
  const [profileErr, setProfileErr] = useState<{ code: string | null; message: string } | null>(null);

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

  useEffect(() => {
    if (clientId) load(clientId);
    else {
      setLoading(false);
      setClientErr({ code: null, message: "No se proporcionó client_id en la URL." });
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
    </div>
  );
}
