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
  /**
   * Enriquecido server-side por content.listAssignments (Dashboard
   * PR-05-fix): resuelto vía content_id -> content_registry.id -> tabla
   * operacional (recipes/exercises/mind_content) por registry_id. `null`
   * cuando no se pudo resolver -- nunca inventado por el backend.
   */
  content_title?: string | null;
  content_canonical_id?: string | null;
  content_type?: string | null;
  content_pillar?: string | null;
  content_is_published?: boolean | null;
}

// ─── PLAYABLE MVP UI INTEGRATION (evidence.*/actions.*/progress.*) ───
// Fuente de verdad: PLAYABLE_MVP_BACKEND_HANDOFF_v1.md. Igual de laxos/
// provisionales que el resto de este fichero.

/** execution_evidence, devuelto por evidence.register. */
export interface EvidenceItem extends DashboardProvisionalDto {
  id: string;
  client_id: string;
  source_type?: string | null;
  source_content_id?: string | null;
  source_entity_type?: string | null;
  source_entity_id?: string | null;
  pillar?: string | null;
  occurred_at?: string;
  quantity?: number | null;
  unit?: string | null;
  duration_minutes?: number | null;
}

/** Candidato devuelto dentro de actions.accredit/accreditAndCalculate cuando no hay resolución única. */
export interface CandidateAction extends DashboardProvisionalDto {
  canonical_action_id: string;
  binding_type?: string;
  has_accreditation_rule?: boolean;
}

/** data.accredit de actions.accreditAndCalculate (mismo shape que actions.accredit). */
export interface AccreditResult extends DashboardProvisionalDto {
  status: 'validated' | 'pending' | 'rejected';
  reason?: string;
  evidence_id: string;
  action_log_created: boolean;
  action_log_id?: string;
  idempotent?: boolean;
  candidate_actions: CandidateAction[];
  detail?: string;
}

/** data.gamification de actions.accreditAndCalculate (null si accredit no fue "validated"). */
export interface GamificationResult extends DashboardProvisionalDto {
  action_log_id: string;
  event_dvg_hours: number;
  base_dvg_hours: number;
  idempotent?: boolean;
}

/** data.daily_progress de actions.accreditAndCalculate (null si accredit no fue "validated"). */
export interface DailyProgressSummary extends DashboardProvisionalDto {
  client_id: string;
  date: string;
  pillars: string[];
  total_dvg_hours: number;
  action_logs_processed?: number;
}

export interface AccreditAndCalculateResult {
  accredit: AccreditResult;
  gamification: GamificationResult | null;
  daily_progress: DailyProgressSummary | null;
}

/** progress.get — resumen total del cliente. */
export interface ProgressSummary extends DashboardProvisionalDto {
  client_id: string;
  total_dvg_hours: number;
  total_dvg_days: number;
  current_level: string | null;
  by_pillar: {
    nutrition: number;
    exercise: number;
    sleep: number;
    stress: number;
    conscious_wellbeing: number;
  };
  updated_at: string | null;
}

/** daily_progress, devuelto por progress.getDaily/progress.getPillar. */
export interface DailyProgressItem extends DashboardProvisionalDto {
  id: string;
  client_id: string;
  date: string;
  pillar: string;
  action_count: number;
  base_dvg_hours: number;
  final_dvg_hours: number;
  calculated_at?: string;
}
