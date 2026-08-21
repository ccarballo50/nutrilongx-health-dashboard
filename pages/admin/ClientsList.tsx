import React, { useEffect, useState } from "react";
import * as RRD from "react-router-dom";
import { clientsApi } from "../../src/services/appsScriptClientsApi";
import { ContractError } from "../../src/services/appsScriptContract";
import type { ClientListItem } from "../../src/services/appsScriptDtos";

/**
 * ClientsList — primer consumidor real de la capa
 * src/services/appsScriptContract.ts (PR-01). Pantalla nueva, aislada,
 * de solo lectura: no crea, no edita, no asigna contenido todavía.
 *
 * Deliberadamente NO usa el AppContext/localStorage mock del resto del
 * Dashboard (CONSOLA_GLOBAL_MVP) ni el esquema legacy de
 * services/*.ts -- habla directamente con clients.list a través del
 * proxy server-side. Ver docs/DASHBOARD_APPS_SCRIPT_CLIENT_v0.md.
 */

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  archived: "Archivado",
};

function statusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "archived":
      return "bg-gray-200 text-gray-600";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default function ClientsList() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [errCode, setErrCode] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      setErrCode(null);
      const { clients: rows } = await clientsApi.list();
      setClients(rows);
    } catch (e) {
      if (e instanceof ContractError) {
        setErrCode(e.code);
        setErr(e.message);
      } else {
        setErr(e instanceof Error ? e.message : "Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <button className="border rounded px-3 py-1 text-xs" onClick={load} disabled={loading}>
          {loading ? "Cargando…" : "Actualizar"}
        </button>
      </div>

      {loading && <div className="text-sm text-gray-500">Cargando clientes…</div>}

      {!loading && err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
          {errCode && <div className="text-xs font-mono mb-1">{errCode}</div>}
          Error: {err}
        </div>
      )}

      {!loading && !err && clients.length === 0 && (
        <div className="text-sm text-gray-500">Aún no hay clientes registrados.</div>
      )}

      {!loading && !err && clients.length > 0 && (
        <>
          <div className="text-sm text-gray-600 mb-3">Total: {clients.length}</div>
          <ul className="space-y-2">
            {clients.map((c) => (
              <li key={c.id} className="border rounded bg-white">
                <RRD.Link to={`/admin/clients/${c.id}`} className="block p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {c.first_name} {c.last_name ?? ""}
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${statusBadgeClass(c.status)}`}
                    >
                      {(c.status && STATUS_LABEL[c.status]) || c.status || "—"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{c.external_code}</div>
                  {(c.email || c.phone) && (
                    <div className="text-xs text-gray-500">
                      {[c.email, c.phone].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </RRD.Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
