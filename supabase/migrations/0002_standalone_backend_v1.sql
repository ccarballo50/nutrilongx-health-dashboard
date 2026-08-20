-- 0002_standalone_backend_v1.sql
--
-- NUTRILONGX — Standalone Backend v1 — Phase 1 schema.
--
-- Fuente de verdad de este esquema:
--   nutrilongx/governance/architecture/NUTRILONGX_STANDALONE_DATA_MODEL_v1.md
--   nutrilongx/governance/decisions/NUTRILONGX_STANDALONE_ARCHITECTURE_DECISION_v1.md
--
-- ADITIVA. No modifica ni toca 0001_contenido_pilares.sql. No hace DROP,
-- TRUNCATE ni DELETE de ninguna tabla legacy. Las 6 tablas de Mente
-- (content_pieces, retos_insignia, videos, video_bloques, infografias,
-- subpilar_mapeo) permanecen intactas; solo se leen (SELECT) al final de
-- este fichero para poblar mind_content de forma idempotente.
--
-- Auditoría live que respalda esta migración (2026-08-20, ejecutada
-- externamente por Cesar vía SQL Editor, ver
-- nutrilongx/governance/implementation/NUTRILONGX_BACKEND_PHASE1_IMPLEMENTATION_REPORT_v1.md):
-- `public` contenía exactamente las 6 tablas de arriba. `actions_catalog`,
-- `action_logs`, `content`, `content_media` NO existían live. Esta
-- migración por tanto no puede colisionar con ellas por nombre real, pero
-- de todas formas usa `create table if not exists` en todo punto por
-- disciplina defensiva, y ningún nombre de tabla nuevo coincide con los 6
-- nombres legacy.
--
-- No se ha ejecutado contra ningún proyecto real desde este entorno: aquí
-- no hay credenciales de Supabase disponibles. Aplicar manualmente (SQL
-- Editor o `supabase db push`) cuando el CORE CENTRAL lo autorice.

-- ============================================================ extensiones
create extension if not exists "pgcrypto"; -- gen_random_uuid(), ya usada por 0001
create extension if not exists "unaccent"; -- para generar slugs deterministas de Mente legacy

-- ============================================================ helper: updated_at
-- Trigger genérico y simple, documentado aquí, reutilizado por todas las
-- tablas que declaran updated_at en el modelo de datos.
create or replace function nlx_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function nlx_set_updated_at() is
  'Trigger generico: fija updated_at = now() en cada UPDATE. Usado por las tablas standalone v1 que declaran updated_at.';

-- ============================================================================
-- 1. clients
-- ============================================================================
create table if not exists clients (
  id              uuid primary key default gen_random_uuid(),
  external_code   text not null unique,
  auth_user_id    uuid unique,
  first_name      text not null,
  last_name       text,
  email           text,
  phone           text,
  status          text not null default 'active' check (status in ('active','paused','discharged','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table clients is 'Identidad operacional minima del cliente. external_code es el identificador de negocio estable.';

drop trigger if exists trg_clients_updated_at on clients;
create trigger trg_clients_updated_at before update on clients
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 2. client_profiles
-- ============================================================================
create table if not exists client_profiles (
  client_id       uuid primary key references clients(id) on delete cascade,
  birth_date      date,
  sex             text,
  clinical_tags   jsonb not null default '{}'::jsonb,
  goals           jsonb not null default '{}'::jsonb,
  preferences     jsonb not null default '{}'::jsonb,
  restrictions    jsonb not null default '{}'::jsonb,
  metadata        jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);
comment on table client_profiles is
  'Perfil extendido/sensible. Decision explicita: current_level NO se guarda aqui -- es estado derivado, vive en client_progress.';

drop trigger if exists trg_client_profiles_updated_at on client_profiles;
create trigger trg_client_profiles_updated_at before update on client_profiles
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 3. content_registry
-- ============================================================================
create table if not exists content_registry (
  id              uuid primary key default gen_random_uuid(),
  content_type    text not null check (content_type in ('recipe','exercise','exercise_variant','mind_content')),
  canonical_id    text not null,
  pillar          text not null check (pillar in ('nutrition','exercise','sleep','stress','conscious_wellbeing')),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (content_type, canonical_id)
);
comment on table content_registry is
  'Identidad universal de contenido para evitar FK polimorficas fragiles. Solo identidad/clasificacion -- no es fuente de contenido rico.';
create index if not exists idx_content_registry_type_active on content_registry(content_type, is_active);

-- ============================================================================
-- 4. recipes
-- ============================================================================
create table if not exists recipes (
  id              uuid primary key default gen_random_uuid(),
  registry_id     uuid not null unique references content_registry(id) on delete restrict,
  canonical_id    text not null unique,
  title           text not null,
  maturity        text,
  data            jsonb not null,
  source_version  text not null,
  schema_version  text,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table recipes is 'Proyeccion operacional de NUTRILONGX_ALIMENTACION_MASTER_v1.json. data preserva el registro rico completo.';
create index if not exists idx_recipes_published on recipes(is_published);

drop trigger if exists trg_recipes_updated_at on recipes;
create trigger trg_recipes_updated_at before update on recipes
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 5. exercises
-- ============================================================================
create table if not exists exercises (
  id                  uuid primary key default gen_random_uuid(),
  registry_id         uuid not null unique references content_registry(id) on delete restrict,
  canonical_id        text not null unique,
  title               text not null,
  domain              text,
  data                jsonb not null,
  content_maturity    text,
  review_status       text,
  source_version      text not null,
  schema_version      text,
  is_published        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table exercises is
  'Proyeccion operacional de NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json (exercise_library[]). NO declarar PRODUCTION_READY mientras la revision de seguridad este incompleta.';
create index if not exists idx_exercises_published on exercises(is_published);

drop trigger if exists trg_exercises_updated_at on exercises;
create trigger trg_exercises_updated_at before update on exercises
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 6. exercise_variants
-- ============================================================================
create table if not exists exercise_variants (
  id                  uuid primary key default gen_random_uuid(),
  registry_id         uuid not null unique references content_registry(id) on delete restrict,
  canonical_id        text not null unique,
  exercise_id         uuid not null references exercises(id) on delete restrict,
  relationship_type   text,
  data                jsonb not null,
  review_status       text,
  source_version      text not null,
  schema_version      text,
  is_published        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table exercise_variants is 'Proyeccion operacional de NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json (exercise_variants[]).';
create index if not exists idx_exercise_variants_exercise on exercise_variants(exercise_id);

drop trigger if exists trg_exercise_variants_updated_at on exercise_variants;
create trigger trg_exercise_variants_updated_at before update on exercise_variants
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 7. mind_content
-- ============================================================================
create table if not exists mind_content (
  id              uuid primary key default gen_random_uuid(),
  registry_id     uuid not null unique references content_registry(id) on delete restrict,
  canonical_id    text not null unique,
  pillar          text not null check (pillar in ('sleep','stress','conscious_wellbeing')),
  content_type    text not null check (content_type in ('pillar_card','subpillar_card','challenge','video','infographic','other')),
  title           text not null,
  data            jsonb not null,
  source_version  text not null,
  schema_version  text,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table mind_content is
  'Tabla operacional unificada de Sueno/Estres/Bienestar consciente. Destino de la migracion de las 6 tablas legacy de 0001 (ver seccion final de este fichero).';
create index if not exists idx_mind_content_pillar_type on mind_content(pillar, content_type);

drop trigger if exists trg_mind_content_updated_at on mind_content;
create trigger trg_mind_content_updated_at before update on mind_content
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 8. canonical_actions
-- ============================================================================
create table if not exists canonical_actions (
  id                      uuid primary key default gen_random_uuid(),
  canonical_action_id     text not null unique,
  domain                  text not null,
  subdomain               text,
  data                    jsonb not null,
  source_version          text not null,
  schema_version          text,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
comment on table canonical_actions is
  'Proyeccion operacional de NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json (actions[]). data.level_variants[] preserva los niveles/base_dvg_hours reales. NO reintroducir levelMultiplier legacy.';
create index if not exists idx_canonical_actions_domain on canonical_actions(domain, subdomain);

drop trigger if exists trg_canonical_actions_updated_at on canonical_actions;
create trigger trg_canonical_actions_updated_at before update on canonical_actions
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 9. content_action_bindings
-- ============================================================================
create table if not exists content_action_bindings (
  id                      uuid primary key default gen_random_uuid(),
  content_id              uuid not null references content_registry(id) on delete cascade,
  canonical_action_id     text not null references canonical_actions(canonical_action_id) on delete restrict,
  binding_type            text not null check (binding_type in ('supports','candidate','contextual_opposite','unmapped','direct')),
  status                  text not null default 'active' check (status in ('active','inactive','review_required')),
  metadata                jsonb not null default '{}'::jsonb,
  provenance              jsonb not null default '{}'::jsonb,
  source_version          text not null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (content_id, canonical_action_id, binding_type)
);
comment on table content_action_bindings is
  'Invariante: un binding NUNCA crea evidence, action_logs, acredita acciones ni genera DVG. Solo asocia contenido a la accion canonica que describe.';
create index if not exists idx_bindings_content on content_action_bindings(content_id);
create index if not exists idx_bindings_action on content_action_bindings(canonical_action_id);

drop trigger if exists trg_bindings_updated_at on content_action_bindings;
create trigger trg_bindings_updated_at before update on content_action_bindings
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 10. exercise_safety_rules
-- ============================================================================
create table if not exists exercise_safety_rules (
  id                  uuid primary key default gen_random_uuid(),
  safety_rule_id      text not null unique,
  scope_type          text not null,
  scope_selector      jsonb,
  clinical_profile    text,
  safety_status       text not null,
  rule_data           jsonb not null,
  review_status       text not null,
  operational_mode    text not null default 'ADVISORY_ONLY' check (operational_mode = 'ADVISORY_ONLY'),
  source_version      text not null,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table exercise_safety_rules is
  'Proyeccion operacional de NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json. operational_mode fijado por CHECK a ADVISORY_ONLY -- ningun bloqueo automatico permitido antes de human-review real. review_status preserva el estado canonico real (hoy PENDING_HUMAN_REVIEW en las 12).';
create index if not exists idx_safety_rules_active on exercise_safety_rules(is_active);

drop trigger if exists trg_safety_rules_updated_at on exercise_safety_rules;
create trigger trg_safety_rules_updated_at before update on exercise_safety_rules
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 11. action_accreditation_rules
-- ============================================================================
create table if not exists action_accreditation_rules (
  id                          uuid primary key default gen_random_uuid(),
  accreditation_rule_id       text not null unique,
  canonical_action_id         text not null references canonical_actions(canonical_action_id) on delete restrict,
  accepted_evidence_types     text[] not null default '{}',
  required_fields             jsonb not null default '{}'::jsonb,
  conditions                  jsonb not null default '{}'::jsonb,
  aggregation_window          jsonb,
  max_occurrences             integer,
  deduplication_policy        jsonb not null default '{}'::jsonb,
  source_priority              jsonb,
  status                      text not null default 'review_required' check (status in ('active','inactive','review_required')),
  provenance                  jsonb not null default '{}'::jsonb,
  source_version              text not null,
  schema_version              text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
comment on table action_accreditation_rules is
  'Ningun threshold ausente de las fuentes canonicas puede inventarse. Tabla vacia tras el import canonico de esta fase es el resultado CORRECTO -- no se genero ninguna regla a partir de titles.';
create index if not exists idx_accreditation_rules_action on action_accreditation_rules(canonical_action_id);

drop trigger if exists trg_accreditation_rules_updated_at on action_accreditation_rules;
create trigger trg_accreditation_rules_updated_at before update on action_accreditation_rules
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 12. client_content_assignments
-- ============================================================================
create table if not exists client_content_assignments (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients(id) on delete cascade,
  content_id          uuid not null references content_registry(id) on delete restrict,
  pillar              text not null check (pillar in ('nutrition','exercise','sleep','stress','conscious_wellbeing')),
  assigned_by_type    text not null check (assigned_by_type in ('professional','system')),
  assigned_by         text,
  assigned_at         timestamptz not null default now(),
  status              text not null default 'assigned' check (status in ('assigned','active','completed','cancelled')),
  notes               text,
  metadata            jsonb not null default '{}'::jsonb,
  idempotency_key     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table client_content_assignments is 'Asignaciones NO generan DVG.';
create index if not exists idx_assignments_client_status on client_content_assignments(client_id, status);
create unique index if not exists uq_assignments_idempotency
  on client_content_assignments(client_id, content_id, idempotency_key)
  where idempotency_key is not null;

drop trigger if exists trg_assignments_updated_at on client_content_assignments;
create trigger trg_assignments_updated_at before update on client_content_assignments
  for each row execute function nlx_set_updated_at();

-- ============================================================================
-- 13. execution_evidence
-- ============================================================================
create table if not exists execution_evidence (
  id                      uuid primary key default gen_random_uuid(),
  client_id               uuid not null references clients(id) on delete cascade,
  source_type             text not null check (source_type in ('manual','dashboard','app','professional','apps_script','wearable','import')),
  source_content_id       uuid references content_registry(id) on delete set null,
  source_entity_type      text,
  source_entity_id        text,
  pillar                  text not null check (pillar in ('nutrition','exercise','sleep','stress','conscious_wellbeing')),
  occurred_at             timestamptz not null,
  quantity                numeric,
  unit                    text,
  duration_minutes        numeric,
  intensity               text,
  metadata                jsonb not null default '{}'::jsonb,
  provenance              jsonb not null default '{}'::jsonb,
  deduplication_key       text not null,
  idempotency_key         text,
  created_at              timestamptz not null default now(),
  unique (client_id, deduplication_key)
);
comment on table execution_evidence is
  'EXECUTION_EVIDENCE pura. NUNCA crea DVG directamente, NUNCA invoca el motor, NUNCA fabrica una accion canonica, NUNCA salta la acreditacion.';
create index if not exists idx_evidence_client_occurred on execution_evidence(client_id, occurred_at);
create index if not exists idx_evidence_content on execution_evidence(source_content_id);

-- ============================================================================
-- 14. action_logs
-- ============================================================================
create table if not exists action_logs (
  id                      uuid primary key default gen_random_uuid(),
  client_id               uuid not null references clients(id) on delete cascade,
  canonical_action_id     text not null references canonical_actions(canonical_action_id) on delete restrict,
  evidence_id             uuid not null references execution_evidence(id) on delete restrict,
  accreditation_rule_id   text,
  level_variant           text not null,
  occurred_at             timestamptz not null,
  base_dvg_hours          numeric not null,
  engine_version          text not null,
  calculation_version     text not null,
  deduplication_key       text not null,
  status                  text not null default 'pending' check (status in ('validated','pending','rejected','reversed')),
  provenance              jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now(),
  unique (client_id, deduplication_key)
);
comment on table action_logs is
  'Ledger canonico de comportamiento acreditado. Unico punto de entrada al motor de gamificacion: solo status=validated puede procesarse. base_dvg_hours es una foto congelada del level_variant en el momento de calculo/acreditacion -- nunca recalculado por Dashboard/Apps Script. Los registros rejected/reversed NO se borran fisicamente.';
create index if not exists idx_action_logs_client_occurred on action_logs(client_id, occurred_at);
create index if not exists idx_action_logs_client_status on action_logs(client_id, status);
create index if not exists idx_action_logs_action on action_logs(canonical_action_id);

-- ============================================================================
-- 15. client_progress
-- ============================================================================
create table if not exists client_progress (
  client_id               uuid primary key references clients(id) on delete cascade,
  total_dvg_hours         numeric not null default 0,
  total_dvg_days          numeric not null default 0,
  current_level           text,
  streaks                 jsonb not null default '{}'::jsonb,
  pillar_progress         jsonb not null default '{}'::jsonb,
  calculation_trace       jsonb,
  calculated_at           timestamptz not null default now(),
  engine_version          text not null,
  calculation_version     text not null
);
comment on table client_progress is
  'Proyeccion derivada. Reconstruible en cualquier momento a partir de action_logs validados -- NO es la fuente de historial de acciones.';

-- ============================================================================
-- 16. daily_progress
-- ============================================================================
create table if not exists daily_progress (
  id                      uuid primary key default gen_random_uuid(),
  client_id               uuid not null references clients(id) on delete cascade,
  date                    date not null,
  pillar                  text not null check (pillar in ('nutrition','exercise','sleep','stress','conscious_wellbeing')),
  action_count            integer not null default 0,
  base_dvg_hours          numeric not null default 0,
  final_dvg_hours         numeric not null default 0,
  calculation_trace       jsonb,
  engine_version          text not null,
  calculation_version     text not null,
  calculated_at           timestamptz not null default now(),
  unique (client_id, date, pillar)
);
comment on table daily_progress is
  'Proyeccion derivada diaria por pilar. weekly_progress NO se crea en v1 -- multiplicadores/caps semanales se representan via calculation_trace/rebuild sin tabla dedicada.';
create index if not exists idx_daily_progress_client_date on daily_progress(client_id, date);

-- ============================================================================
-- 17. audit_log
-- ============================================================================
create table if not exists audit_log (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null,
  actor_type      text not null check (actor_type in ('professional','patient','service','system')),
  actor_id        text,
  action          text not null,
  entity_type     text not null,
  entity_id       text,
  before_data     jsonb,
  after_data      jsonb,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
comment on table audit_log is 'Append-only. No es una plataforma enterprise de auditoria -- cobertura minima de operaciones sensibles/profesionales.';
create index if not exists idx_audit_log_entity on audit_log(entity_type, entity_id);
create index if not exists idx_audit_log_request on audit_log(request_id);

-- ============================================================================================
-- RLS -- las 17 tablas quedan con RLS habilitado y CERO policies nuevas.
-- ============================================================================================
-- Decision explicita (ver NUTRILONGX_STANDALONE_ARCHITECTURE_DECISION_v1.md
-- seccion 8 y el encargo de esta fase, seccion 15): el target es
-- Dashboard -> Apps Script -> Supabase. Apps Script opera con la
-- service-role key (que siempre bypassa RLS) y por tanto NO necesita
-- ninguna policy. anon/authenticated quedan denegados por defecto al no
-- existir ninguna policy de SELECT/INSERT/UPDATE/DELETE -- esto es
-- deliberado, no un olvido: no se abre lectura publica nueva salvo que una
-- fase posterior lo apruebe explicitamente.
alter table clients                       enable row level security;
alter table client_profiles               enable row level security;
alter table content_registry              enable row level security;
alter table recipes                       enable row level security;
alter table exercises                     enable row level security;
alter table exercise_variants             enable row level security;
alter table mind_content                  enable row level security;
alter table canonical_actions             enable row level security;
alter table content_action_bindings       enable row level security;
alter table exercise_safety_rules         enable row level security;
alter table action_accreditation_rules    enable row level security;
alter table client_content_assignments    enable row level security;
alter table execution_evidence            enable row level security;
alter table action_logs                   enable row level security;
alter table client_progress               enable row level security;
alter table daily_progress                enable row level security;
alter table audit_log                     enable row level security;

-- ============================================================================================
-- MIGRACIÓN NO DESTRUCTIVA DE MENTE LEGACY -> mind_content
-- ============================================================================================
-- Lee (SELECT) las 6 tablas de 0001. No las modifica, no las borra, no las
-- renombra. Idempotente: cada bloque usa ON CONFLICT DO NOTHING sobre las
-- claves unicas ya declaradas arriba (content_registry(content_type,
-- canonical_id) y mind_content.canonical_id), asi que re-ejecutar esta
-- migracion (o solo esta seccion) no duplica filas.
--
-- canonical_id determinista: mind.<pillar>.<content_type>.<slug>
-- slug = unaccent + lower + no-alfanumerico->'-' + trim de guiones, sobre
-- el campo de negocio ya UNIQUE de cada tabla origen (tema/nombre/titulo).

-- ---- content_pieces -> pillar_card | subpillar_card ----
insert into content_registry (content_type, canonical_id, pillar, is_active)
select
  'mind_content',
  'mind.' ||
    (case cp.pilar_visible
       when 'Sueño' then 'sleep'
       when 'Estrés' then 'stress'
       when 'Bienestar emocional' then 'conscious_wellbeing'
     end) || '.' ||
    (case cp.tipo when 'ficha_pilar' then 'pillar_card' else 'subpillar_card' end) || '.' ||
    trim(both '-' from regexp_replace(lower(unaccent(cp.tema)), '[^a-z0-9]+', '-', 'g')),
  (case cp.pilar_visible
     when 'Sueño' then 'sleep'
     when 'Estrés' then 'stress'
     when 'Bienestar emocional' then 'conscious_wellbeing'
   end),
  (cp.estado = 'aprobado')
from content_pieces cp
on conflict (content_type, canonical_id) do nothing;

insert into mind_content (registry_id, canonical_id, pillar, content_type, title, data, source_version, is_published)
select
  cr.id,
  cr.canonical_id,
  cr.pillar,
  (case cp.tipo when 'ficha_pilar' then 'pillar_card' else 'subpillar_card' end),
  cp.tema,
  jsonb_build_object(
    'texto_cliente', cp.texto_cliente,
    'texto_equipo', cp.texto_equipo,
    'actividad_ancla', cp.actividad_ancla,
    'subpilar', cp.subpilar,
    'fuentes', to_jsonb(cp.fuentes),
    'estado_legacy', cp.estado,
    'legacy_source', jsonb_build_object(
      'table', 'content_pieces',
      'id', cp.id,
      'original_pillar_visible', cp.pilar_visible,
      'original_tipo', cp.tipo,
      'created_at', cp.created_at,
      'updated_at', cp.updated_at
    )
  ),
  '0001_contenido_pilares.sql',
  (cp.estado = 'aprobado')
from content_pieces cp
join content_registry cr
  on cr.content_type = 'mind_content'
 and cr.canonical_id = 'mind.' ||
       (case cp.pilar_visible
          when 'Sueño' then 'sleep'
          when 'Estrés' then 'stress'
          when 'Bienestar emocional' then 'conscious_wellbeing'
        end) || '.' ||
       (case cp.tipo when 'ficha_pilar' then 'pillar_card' else 'subpillar_card' end) || '.' ||
       trim(both '-' from regexp_replace(lower(unaccent(cp.tema)), '[^a-z0-9]+', '-', 'g'))
on conflict (canonical_id) do nothing;

-- ---- retos_insignia -> challenge ----
insert into content_registry (content_type, canonical_id, pillar, is_active)
select
  'mind_content',
  'mind.' ||
    (case ri.pilar_visible
       when 'Sueño' then 'sleep'
       when 'Estrés' then 'stress'
       when 'Bienestar emocional' then 'conscious_wellbeing'
     end) || '.challenge.' ||
    trim(both '-' from regexp_replace(lower(unaccent(ri.nombre)), '[^a-z0-9]+', '-', 'g')),
  (case ri.pilar_visible
     when 'Sueño' then 'sleep'
     when 'Estrés' then 'stress'
     when 'Bienestar emocional' then 'conscious_wellbeing'
   end),
  (ri.estado = 'aprobado')
from retos_insignia ri
on conflict (content_type, canonical_id) do nothing;

insert into mind_content (registry_id, canonical_id, pillar, content_type, title, data, source_version, is_published)
select
  cr.id, cr.canonical_id, cr.pillar, 'challenge', ri.nombre,
  jsonb_build_object(
    'descripcion', ri.descripcion,
    'duracion', ri.duracion,
    'nota_motor', ri.nota_motor,
    'estado_legacy', ri.estado,
    'legacy_source', jsonb_build_object(
      'table', 'retos_insignia', 'id', ri.id,
      'original_pillar_visible', ri.pilar_visible, 'created_at', ri.created_at
    )
  ),
  '0001_contenido_pilares.sql',
  (ri.estado = 'aprobado')
from retos_insignia ri
join content_registry cr
  on cr.content_type = 'mind_content'
 and cr.canonical_id = 'mind.' ||
       (case ri.pilar_visible
          when 'Sueño' then 'sleep'
          when 'Estrés' then 'stress'
          when 'Bienestar emocional' then 'conscious_wellbeing'
        end) || '.challenge.' ||
       trim(both '-' from regexp_replace(lower(unaccent(ri.nombre)), '[^a-z0-9]+', '-', 'g'))
on conflict (canonical_id) do nothing;

-- ---- videos (+ video_bloques embebidos) -> video ----
-- Nota: videos.subpilar puede ser NULL o no resolver directamente un
-- pilar_visible; se resuelve via subpilar_mapeo. Si no hay mapeo (subpilar
-- NULL o sin fila en subpilar_mapeo), el video se omite de esta pasada y
-- queda registrado como pendiente en el informe de implementacion -- no se
-- fuerza un pilar arbitrario.
insert into content_registry (content_type, canonical_id, pillar, is_active)
select
  'mind_content',
  'mind.' ||
    (case sm.pilar_visible
       when 'Sueño' then 'sleep'
       when 'Estrés' then 'stress'
       when 'Bienestar emocional' then 'conscious_wellbeing'
     end) || '.video.' ||
    trim(both '-' from regexp_replace(lower(unaccent(v.titulo)), '[^a-z0-9]+', '-', 'g')),
  (case sm.pilar_visible
     when 'Sueño' then 'sleep'
     when 'Estrés' then 'stress'
     when 'Bienestar emocional' then 'conscious_wellbeing'
   end),
  (v.estado in ('aprobado','grabado','publicado'))
from videos v
join subpilar_mapeo sm on sm.subpilar = v.subpilar
where v.subpilar is not null
on conflict (content_type, canonical_id) do nothing;

insert into mind_content (registry_id, canonical_id, pillar, content_type, title, data, source_version, is_published)
select
  cr.id, cr.canonical_id, cr.pillar, 'video', v.titulo,
  jsonb_build_object(
    'duracion_objetivo', v.duracion_objetivo,
    'tono', v.tono,
    'url_video', v.url_video,
    'estado_legacy', v.estado,
    'video_blocks', coalesce((
      select jsonb_agg(jsonb_build_object('orden', vb.orden, 'tiempo', vb.tiempo, 'guion', vb.guion) order by vb.orden)
      from video_bloques vb where vb.video_id = v.id
    ), '[]'::jsonb),
    'legacy_source', jsonb_build_object(
      'table', 'videos', 'id', v.id, 'original_subpilar', v.subpilar, 'created_at', v.created_at
    )
  ),
  '0001_contenido_pilares.sql',
  (v.estado in ('aprobado','grabado','publicado'))
from videos v
join subpilar_mapeo sm on sm.subpilar = v.subpilar
join content_registry cr
  on cr.content_type = 'mind_content'
 and cr.canonical_id = 'mind.' ||
       (case sm.pilar_visible
          when 'Sueño' then 'sleep'
          when 'Estrés' then 'stress'
          when 'Bienestar emocional' then 'conscious_wellbeing'
        end) || '.video.' ||
       trim(both '-' from regexp_replace(lower(unaccent(v.titulo)), '[^a-z0-9]+', '-', 'g'))
where v.subpilar is not null
on conflict (canonical_id) do nothing;

-- ---- infografias -> infographic ----
insert into content_registry (content_type, canonical_id, pillar, is_active)
select
  'mind_content',
  'mind.' ||
    (case i.pilar_visible
       when 'Sueño' then 'sleep'
       when 'Estrés' then 'stress'
       when 'Bienestar emocional' then 'conscious_wellbeing'
     end) || '.infographic.' ||
    trim(both '-' from regexp_replace(lower(unaccent(i.titulo)), '[^a-z0-9]+', '-', 'g')),
  (case i.pilar_visible
     when 'Sueño' then 'sleep'
     when 'Estrés' then 'stress'
     when 'Bienestar emocional' then 'conscious_wellbeing'
   end),
  (i.estado = 'aprobado')
from infografias i
on conflict (content_type, canonical_id) do nothing;

insert into mind_content (registry_id, canonical_id, pillar, content_type, title, data, source_version, is_published)
select
  cr.id, cr.canonical_id, cr.pillar, 'infographic', i.titulo,
  jsonb_build_object(
    'color', i.color,
    'dato_destacado', i.dato_destacado,
    'dato_contexto', i.dato_contexto,
    'puntos_clave', to_jsonb(i.puntos_clave),
    'microhabito', i.microhabito,
    'fuentes', to_jsonb(i.fuentes),
    'imagen_url', i.imagen_url,
    'estado_legacy', i.estado,
    'legacy_source', jsonb_build_object(
      'table', 'infografias', 'id', i.id,
      'original_pillar_visible', i.pilar_visible, 'created_at', i.created_at
    )
  ),
  '0001_contenido_pilares.sql',
  (i.estado = 'aprobado')
from infografias i
join content_registry cr
  on cr.content_type = 'mind_content'
 and cr.canonical_id = 'mind.' ||
       (case i.pilar_visible
          when 'Sueño' then 'sleep'
          when 'Estrés' then 'stress'
          when 'Bienestar emocional' then 'conscious_wellbeing'
        end) || '.infographic.' ||
       trim(both '-' from regexp_replace(lower(unaccent(i.titulo)), '[^a-z0-9]+', '-', 'g'))
on conflict (canonical_id) do nothing;

-- subpilar_mapeo no genera filas de contenido propias: solo se usa arriba
-- como tabla de resolucion pilar/provenance para videos. Su informacion de
-- mapeo subpilar->pilar_visible ya queda implicita en el canonical_id y en
-- el bloque legacy_source de cada mind_content generado a partir de ella.
