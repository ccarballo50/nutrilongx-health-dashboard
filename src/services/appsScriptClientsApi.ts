/**
 * appsScriptClientsApi.ts — wrappers finos sobre `callContract` para
 * `clients.*`. No añaden lógica de negocio, solo tipan el payload/la
 * respuesta y evitan repetir el nombre de función string en cada
 * pantalla. Ninguna pantalla usa esto todavía (PR-01 es solo la capa
 * base) — ver docs/DASHBOARD_APPS_SCRIPT_CLIENT_v0.md.
 */

import { callContract } from './appsScriptContract';
import type { ClientDetail, ClientListItem, ClientProfile } from './appsScriptDtos';

export interface ClientsListFilters {
  status?: string;
  limit?: number;
  cursor?: string | null;
}

export interface ClientCreatePayload {
  external_code: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
}

/** Campos actualizables de `clients` (ver ClientsService.gs::CLIENTS_UPDATABLE_FIELDS). */
export interface ClientUpdatePatch {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
}

/** Campos actualizables de `client_profiles` (ver ClientsService.gs::CLIENT_PROFILE_FIELDS). */
export interface ClientProfilePatch {
  birth_date?: string;
  sex?: string;
  clinical_tags?: unknown;
  goals?: unknown;
  preferences?: unknown;
  restrictions?: unknown;
  metadata?: Record<string, unknown>;
}

export const clientsApi = {
  list: (filters?: ClientsListFilters) =>
    callContract<{ clients: ClientListItem[]; count: number }>('clients.list', filters),

  get: (clientId: string) =>
    callContract<{ client: ClientDetail }>('clients.get', { client_id: clientId }),

  create: (payload: ClientCreatePayload) =>
    callContract<{ client: ClientDetail; idempotent: boolean }>('clients.create', payload),

  update: (clientId: string, patch: ClientUpdatePatch) =>
    callContract<{ client: ClientDetail; changed: boolean }>('clients.update', {
      client_id: clientId,
      patch,
    }),

  getProfile: (clientId: string) =>
    callContract<{ profile: ClientProfile | null }>('clients.getProfile', { client_id: clientId }),

  updateProfile: (clientId: string, patch: ClientProfilePatch) =>
    callContract<{ profile: ClientProfile }>('clients.updateProfile', {
      client_id: clientId,
      patch,
    }),
};
