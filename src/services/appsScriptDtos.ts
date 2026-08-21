/**
 * appsScriptDtos.ts — DASHBOARD_PROVISIONAL_DTO
 *
 * Tipos mínimos y deliberadamente laxos para las respuestas de
 * `clients.*`/`content.*` (Apps Script Phase 2A, `LIVE_VERIFIED`). NO son
 * un esquema de base de datos definitivo ni un contrato congelado: cada
 * interfaz extiende `DashboardProvisionalDto` (índice `[extra: string]:
 * unknown`) porque el backend puede devolver más campos de los aquí
 * listados y el Dashboard no debe romperse por ello.
 *
 * Fuente de verdad real de los campos:
 * nutrilongx/governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md
 * y `apps-script/src/ClientsService.gs` / `ContentService.gs` (campos
 * seleccionados server-side).
 *
 * Estos tipos deben tratarse como provisionales hasta que el Dashboard
 * construya pantallas reales sobre ellos — no imponer aquí decisiones de
 * UI ni de negocio.
 */

/** Marca explícita: cualquier campo adicional que el backend añada es válido. */
export interface DashboardProvisionalDto {
  [extra: string]: unknown;
}

export interface ClientListItem extends DashboardProvisionalDto {
  id: string;
  external_code: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientDetail extends DashboardProvisionalDto {
  id: string;
  external_code: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * client_profiles. `current_level` es estado derivado (client_progress) y
 * el backend rechaza explícitamente intentar escribirlo vía
 * `clients.updateProfile` — no incluir ese campo aquí como escribible.
 */
export interface ClientProfile extends DashboardProvisionalDto {
  client_id: string;
  birth_date?: string | null;
  sex?: string | null;
  clinical_tags?: unknown;
  goals?: unknown;
  preferences?: unknown;
  restrictions?: unknown;
  metadata?: Record<string, unknown>;
}

/** Forma común de recipes/exercises/mind_content devueltos por content.list* / get*. */
export interface ContentItem extends DashboardProvisionalDto {
  id: string;
  canonical_id: string;
  title?: string | null;
  pillar?: string | null;
  content_type?: string | null;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** client_content_assignments, devuelto por content.assign/unassign/listAssignments. */
export interface AssignmentItem extends DashboardProvisionalDto {
  id: string;
  client_id: string;
  content_id: string;
  pillar?: string | null;
  status?: string | null;
  assigned_by_type?: string | null;
  assigned_by?: string | null;
  notes?: string | null;
  assigned_at?: string;
}
