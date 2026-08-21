-- ============================================================================
-- 0004_mvp_accreditation_rules_v1.sql
--
-- NUTRILONGX PLAYABLE MVP -- MVP Accreditation Pack v1.
--
-- Puebla `action_accreditation_rules` (tabla creada vacia y deliberadamente
-- en 0002_standalone_backend_v1.sql -- "Tabla vacia tras el import canonico
-- de esta fase es el resultado CORRECTO") con un subconjunto MINIMO de 11
-- reglas deterministas, suficiente para desbloquear el primer flujo
-- evidence -> accreditation -> validated ACTION_LOG.
--
-- NO son las 119 reglas del catalogo completo. Alcance explicitamente
-- parcial -- ver nutrilongx/accreditation/canonical/
-- NUTRILONGX_MVP_ACCREDITATION_RULES_v1.json (fuente canonica de este
-- artefacto; esta migracion es una transcripcion literal de ese JSON, no
-- una fuente independiente).
--
-- Ningun threshold es inventado: cada `conditions` cita el valor exacto
-- del title del level_variant "Inicial" en
-- nutrilongx/gamification/canonical/NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json
-- (ver `condition_source` en el JSON canonico para la cita literal).
--
-- Idempotente: ON CONFLICT (accreditation_rule_id) DO UPDATE, misma
-- disciplina que el import canonico de Fase 1 (re-ejecutable sin duplicar).
-- ============================================================================

insert into action_accreditation_rules (
  accreditation_rule_id, canonical_action_id, accepted_evidence_types,
  required_fields, conditions, aggregation_window, max_occurrences,
  deduplication_policy, status, provenance, source_version, schema_version
) values
(
  'MVP_ACCREDITATION_v1.adherence.nutrition.batch_cooking_saludable_h_sem',
  'adherence.nutrition.batch_cooking_saludable_h_sem',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":120}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":0.8,"scope":"PLAYABLE_MVP","resolution_path":"content_binding","content_binding_reference":{"content_type":"recipe","canonical_id":"NLX-007"}}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.nutrition.hydration.agua_l_dia',
  'nutrition.hydration.agua_l_dia',
  array['dashboard','manual','app','professional'],
  '["quantity","unit"]'::jsonb,
  '{"level_variant":"Inicial","quantity":{"gte":2.5}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.4,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.nutrition.mediterranean_pattern.fruta_entera_pieza_s',
  'nutrition.mediterranean_pattern.fruta_entera_pieza_s',
  array['dashboard','manual','app','professional'],
  '["quantity","unit"]'::jsonb,
  '{"level_variant":"Inicial","quantity":{"gte":1}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.7,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.movement.cardio.caminata_vigorosa_min',
  'movement.cardio.caminata_vigorosa_min',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":18}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.4,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.movement.mobility.yoga_fluido_min',
  'movement.mobility.yoga_fluido_min',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":11}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.4,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.mind.sleep.cierre_digital_min_antes_de_dormir',
  'mind.sleep.cierre_digital_min_antes_de_dormir',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":60}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.3,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.mind.sleep.tiempo_en_cama_h',
  'mind.sleep.tiempo_en_cama_h',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":420,"lte":540}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.3,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.mind.stress.musica_relajante_min',
  'mind.stress.musica_relajante_min',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":10}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.0,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.mind.stress.respiracion_durante_min',
  'mind.stress.respiracion_durante_min',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":3}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.0,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.mind.emotional_wellbeing.meditacion_mindfulness_min',
  'mind.emotional_wellbeing.meditacion_mindfulness_min',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":15}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.2,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
),
(
  'MVP_ACCREDITATION_v1.mind.emotional_wellbeing.mindful_walk_min_sin_movil',
  'mind.emotional_wellbeing.mindful_walk_min_sin_movil',
  array['dashboard','manual','app','professional'],
  '["duration_minutes"]'::jsonb,
  '{"level_variant":"Inicial","duration_minutes":{"gte":10}}'::jsonb,
  '{"unit":"day","value":1}'::jsonb,
  1,
  '{"scope":"client_id+canonical_action_id+day","counts_only_status":"validated"}'::jsonb,
  'active',
  '{"source":"NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1","level_variant":"Inicial","base_dvg_hours_at_authoring":1.0,"scope":"PLAYABLE_MVP","resolution_path":"source_entity_id"}'::jsonb,
  'MVP_ACCREDITATION_PACK_v1',
  'NUTRILONGX_MVP_ACCREDITATION_RULES_v1'
)
on conflict (accreditation_rule_id) do update set
  canonical_action_id     = excluded.canonical_action_id,
  accepted_evidence_types = excluded.accepted_evidence_types,
  required_fields         = excluded.required_fields,
  conditions               = excluded.conditions,
  aggregation_window       = excluded.aggregation_window,
  max_occurrences           = excluded.max_occurrences,
  deduplication_policy      = excluded.deduplication_policy,
  status                    = excluded.status,
  provenance                = excluded.provenance,
  source_version            = excluded.source_version,
  schema_version             = excluded.schema_version,
  updated_at                 = now();
