# NUTRILONGX — MVP Accreditation Pack v1 Implementation Report

Fecha: 2026-08-21.
Estado del informe: `ACTIVE` — registra lo realmente implementado y
verificado en real, no es fuente de verdad de contenido
(`source_of_truth: false`).

Alcance: 11 reglas de acreditación MVP (`action_accreditation_rules`),
extensión de `ActionsService.gs::accredit()` para resolverlas y crear
`action_logs` (`validated`/`rejected`), y activación de
`execution_evidence.source_entity_type`/`source_entity_id`
(`EvidenceService.gs`). **No** implementa `gamification.*`/`progress.*`/
`safety.*` — confirmado por grep sobre `apps-script/src/` y verificado en
real (`client_progress`/`daily_progress` en 0 tras todas las pruebas).

---

## 1. Objetivo y resultado

Desbloquear el primer flujo `evidence → accreditation → validated
ACTION_LOG` con un subconjunto mínimo determinista, sin construir las 119
reglas del catálogo completo. **Conseguido y verificado en real**: 3
`action_logs` reales creados en esta ronda (2 `validated`, 1 `rejected`),
ninguno inventado, ninguna llamada a gamificación.

## 2. Selección de candidatos — hallazgo previo

`content_action_bindings` real hoy **solo cubre `recipe`/`nutrition`**
(186 `supports` + 3 `contextual_opposite`, 0 en `exercise`/
`mind_content`). De esos 186, solo 1 content item (`NLX-007`) tiene
exactamente 1 binding sin ambigüedad. Esto significa que la vía de
resolución de Fase 2C (`source_content_id` → `content_action_bindings`)
por sí sola no podía cubrir exercise/sleep/stress/conscious_wellbeing sin
inventar bindings inexistentes.

**Mecanismo activado**: `execution_evidence.source_entity_type`/
`source_entity_id` (columnas reales desde Fase 2B, documentadas entonces
como "no utilizadas en esta fase") se activan para
`source_entity_type='canonical_action'` — la evidencia declara
explícitamente de qué acción canónica es evidencia, simétrico a como
`source_content` ya declara de qué contenido es evidencia. Mutuamente
excluyente con `source_content` (`VALIDATION_ERROR` si se combinan).
Resuelve a exactamente 1 candidato por construcción — sin la ambigüedad
de múltiples bindings.

## 3. Las 11 reglas

Fuente canónica completa:
`nutrilongx/accreditation/canonical/NUTRILONGX_MVP_ACCREDITATION_RULES_v1.json`
(`status: APPROVED_FOR_PLAYABLE_MVP`, `not_frozen_full_system: true`,
`provenance.scope: PLAYABLE_MVP`, `coverage: PARTIAL`,
`not_full_action_catalog: true`).

| canonical_action_id | pilar | resolución | condición (level_variant=Inicial) | base_dvg_hours |
|---|---|---|---|---|
| `adherence.nutrition.batch_cooking_saludable_h_sem` | nutrition | content_binding (`NLX-007`, único real) | `duration_minutes >= 120` | 0.8 |
| `nutrition.hydration.agua_l_dia` | nutrition | source_entity_id | `quantity >= 2.5` | 1.4 |
| `nutrition.mediterranean_pattern.fruta_entera_pieza_s` | nutrition | source_entity_id | `quantity >= 1` | 1.7 |
| `movement.cardio.caminata_vigorosa_min` | exercise | source_entity_id | `duration_minutes >= 18` | 1.4 |
| `movement.mobility.yoga_fluido_min` | exercise | source_entity_id | `duration_minutes >= 11` | 1.4 |
| `mind.sleep.cierre_digital_min_antes_de_dormir` | sleep | source_entity_id | `duration_minutes >= 60` | 1.3 |
| `mind.sleep.tiempo_en_cama_h` | sleep | source_entity_id | `420 <= duration_minutes <= 540` | 1.3 |
| `mind.stress.musica_relajante_min` | stress | source_entity_id | `duration_minutes >= 10` | 1.0 |
| `mind.stress.respiracion_durante_min` | stress | source_entity_id | `duration_minutes >= 3` | 1.0 |
| `mind.emotional_wellbeing.meditacion_mindfulness_min` | conscious_wellbeing | source_entity_id | `duration_minutes >= 15` | 1.2 |
| `mind.emotional_wellbeing.mindful_walk_min_sin_movil` | conscious_wellbeing | source_entity_id | `duration_minutes >= 10` | 1.0 |

**Reparto**: nutrition=3, exercise=2, sleep=2, stress=2,
conscious_wellbeing=2. Ningún threshold inventado — cada `conditions`
cita literalmente el `title` del `level_variant` "Inicial" en
`NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json` (ver `condition_source`
en el JSON canónico).

**Decisiones documentadas**:
- Todas las reglas fijan `level_variant='Inicial'` exclusivamente. En la
  mayoría de estas acciones el título/umbral es idéntico en los 5
  niveles del catálogo (solo cambia `base_dvg_hours`) — indica que los
  niveles superiores representan consistencia/repetición acumulada
  (streaks/historial semanal), explícitamente fuera de alcance de este
  pack. Para las 2 acciones donde el umbral sí escala por nivel
  (`caminata_vigorosa_min`, `yoga_fluido_min`) se fija también solo
  Inicial, para mantener una única regla determinista por acción.
- `level_variant` no es una columna propia de `action_accreditation_rules`
  (esquema real) — se declara dentro de `conditions.level_variant`, único
  lugar del esquema apto sin inventar una columna nueva.
- `mind.emotional_wellbeing` (subdominio canónico) se mapea al pilar
  `conscious_wellbeing` (dashboard) — mismo concepto, nombres distintos
  entre el catálogo legacy y el sistema de pilares.
- `accepted_evidence_types` excluye deliberadamente `wearable`/`import`
  en las 11 reglas (criterio `no_wearable_required` del encargo).

## 4. Resolución de `base_dvg_hours` — nunca en la regla

`base_dvg_hours` **nunca** se escribe en `action_accreditation_rules`.
`ActionsService.gs::resolveBaseDvgHours()` lo resuelve en runtime desde
`canonical_actions.data.level_variants[level=conditions.level_variant]
.base_dvg_hours`. Si el `level_variant` declarado por la regla no existe
en el catálogo real → `DATA_INTEGRITY_ERROR`, sin fallback (verificado
con test local dedicado). Verificado en real: `musica_relajante_min`
Inicial → `1.0`; `batch_cooking_saludable_h_sem` Inicial → `0.8` —
exactamente los valores del catálogo canónico, resueltos en runtime, no
copiados a mano en la regla.

## 5. `actions.accredit()` — nueva lógica

1. Resuelve el candidato: vía A (`source_content_id` →
   `content_action_bindings`, sin cambios de Fase 2C) o vía B
   (`source_entity_type='canonical_action'` + `source_entity_id`, nueva).
2. Con 0 candidatos, >1 candidato (vía A), o >1 regla activa para el
   mismo `canonical_action_id` (configuración ambigua no soportada) →
   `review_required`, sin insertar fila — comportamiento de Fase 2C sin
   cambios.
3. Con exactamente 1 candidato y exactamente 1 regla activa: evalúa
   `accepted_evidence_types`/`required_fields`/`conditions` contra la
   evidencia.
   - Cumple → `status=validated`, inserta `action_logs` (o devuelve
     idempotentemente la fila ya creada).
   - No cumple → `status=rejected`, inserta `action_logs` igualmente —
     el contrato funcional exige "create/update ACTION_LOG state" para
     todo desenlace, y el esquema real declara `rejected` como status
     válido (no solo `validated`/`pending`).

## 6. Deduplicación — dos capas nuevas, distintas de `execution_evidence`

- **Idempotencia de intento**: mismo `(evidence_id, canonical_action_id)`
  ya evaluado → se devuelve la misma fila, sin reevaluar ni reinsertar.
- **Tope diario de acreditación validada** (`max_occurrences=1`,
  `aggregation_window={unit:day,value:1}` en las 11 reglas): si el
  cliente ya tiene un `action_log` `validated` para esa acción ese día
  natural (con OTRA evidencia), una nueva evidencia que también cumpliría
  no genera una segunda fila — se devuelve la ya validada. Los intentos
  `rejected` no cuentan para este tope: su `deduplication_key` incluye el
  `evidence_id` (nunca colisiona con el `unique(client_id,
  deduplication_key)` real de `action_logs`), así que un rechazo el mismo
  día no bloquea un reintento correcto posterior.

`engine_version="NUTRILONGX_MVP_ACCREDITATION_ENGINE_v1"`/
`calculation_version="MVP_ACCREDITATION_PACK_v1"` son sellos de versión
de este pack de reglas, no una ejecución del motor de gamificación —
`gamification.calculateAction`/`recalculateDay`/`progress.*` no se
invocan en esta fase.

## 7. Persistencia — migración versionada

`supabase/migrations/0004_mvp_accreditation_rules_v1.sql` — transcripción
literal del JSON canónico, `INSERT ... ON CONFLICT (accreditation_rule_id)
DO UPDATE`, idempotente (misma disciplina que el import canónico de Fase
1). Aplicada contra el proyecto real (`muyqbqbyvysgqasllgni`) y verificada:
11 filas, todas `status=active`, todas `conditions->>'level_variant' =
'Inicial'`. Git es la fuente canónica — no se insertó manualmente solo en
live sin persistir la migración.

## 8. Tests locales

`node apps-script/tests/run_all.mjs` → **118/118 PASS** (103 previos
intactos + 15 nuevos: 10 en `actions_service.test.mjs` + 5 en
`evidence_service.test.mjs`).

Casos cubiertos (checklist del encargo, sección 19): regla encontrada/no
encontrada, `level_variant` correcto/ausente (`DATA_INTEGRITY_ERROR`),
`level_variant` inexistente en el catálogo (`DATA_INTEGRITY_ERROR`, sin
fallback), condición cumple/no cumple, campo requerido ausente,
`source_type` no aceptado, deduplicación por intento repetido,
`max_occurrences`/tope diario, múltiples reglas activas ambiguas,
`contextual_opposite` excluido (ya cubierto en Fase 2C), `action_log`
`validated` creado con `base_dvg_hours` resuelto del catálogo,
`review_required` para una acción sin regla MVP. Más 5 tests de
`EvidenceService.gs`: `source_entity_type`/`id` válido, referencia
inexistente (`CANONICAL_REFERENCE_NOT_FOUND`), par incompleto
(`VALIDATION_ERROR`), combinación con `source_content`
(`VALIDATION_ERROR`, mutuamente excluyentes), no colisión de
deduplicación entre dos `source_entity_id` distintos a la misma hora.

## 9. Deployment

- **Método**: `clasp push` (13 archivos) + `clasp version` + `clasp
  deploy --deploymentId <existente>` — actualiza el Web App ya
  desplegado, mismo `scriptId`/deployment ID que fases anteriores.
- **Versión de script**: 6 ("MVP Accreditation Pack v1 - validated
  action_log").
- **Versión de deployment**: @7.

## 10. Resultado de la verificación live

Fixture reutilizado: cliente `NLX-TEST-2A-001`
(`2fe63c8f-e042-458c-8101-f652aa9b7b99`, `status=archived`), sin crear
cliente nuevo.

| # | Prueba | Resultado |
|---|---|---|
| 1 | Baseline pre-prueba | PASS — `action_logs=0, client_progress=0, daily_progress=0` |
| 2 | `evidence.register` con `source_entity_type=canonical_action` (`mind.stress.musica_relajante_min`, `duration_minutes=15`) | PASS — evidencia creada, `source_content_id=null` |
| 3 | `actions.accredit` → **primer `validated ACTION_LOG` real del sistema** | PASS — `status=validated`, `action_log_created=true`, `level_variant=Inicial`, `base_dvg_hours=1.0` (resuelto del catálogo) |
| 4 | Repetición del mismo `evidence_id` | PASS — `idempotent=true`, `action_log_created=false`, mismo `action_log_id`, **sin fila duplicada** |
| 5 | Evidencia con `duration_minutes=2` (no cumple `>=10`) | PASS — `status=rejected`, `reason=ACCREDITATION_REJECTED`, **fila creada igualmente** con `status=rejected` |
| 6 | `evidence.register` vía `content_binding` real (`NLX-007`) + `actions.accredit` | PASS — `status=validated`, `base_dvg_hours=0.8`, confirma que la vía A (Fase 2C) también produce `validated` ahora |
| 7 | Evidencia **distinta**, misma acción/cliente/día, que también cumpliría | PASS — `status=validated` pero `action_log_created=false`, `idempotent=true`, devuelve el `action_log_id` ya existente — **tope de 1/día verificado en real** |
| 8 | `action_logs` en Supabase tras todo | PASS — **exactamente 3 filas** (2 `validated`, 1 `rejected`), ninguna inesperada |
| 9 | `client_progress`/`daily_progress` tras todo | PASS — ambos en **0**, sin cambios — gamificación no se ejecutó |
| 10 | Router: `gamification.calculateAction`/`actions.accreditAndCalculate` tras redeploy | PASS — `NOT_FOUND` en ambos |
| 11 | `actions.getLog` con el `action_log_id` validado real | PASS — `status=validated` |
| 12 | `actions.listLogs` filtrado por cliente + `status=validated` | PASS — `count=2` |
| 13 | Security Advisor | PASS — 17/17 `INFO rls_enabled_no_policy`, **0 `WARN`**, sin cambios |
| 14 | Regresión local final | PASS — 118/118 |

**14/14 puntos de verificación live PASS.**

## 11. Seguridad

`DASHBOARD_API_KEY` leída únicamente del fichero temporal local indicado
por César, nunca impresa/logueada/persistida/commiteada; fichero borrado
y verificado dos veces al terminar las pruebas; secret scan sobre el
diff antes de commit, sin hallazgos reales. `RLS` sin relajar. Ningún
endpoint ni mecanismo de auth alternativo.

## 12. Limitaciones

- Cobertura parcial deliberada: 11 de 119 familias canónicas
  (`provenance.coverage=PARTIAL`, `not_full_action_catalog=true` en el
  JSON canónico). No implica que las 108 restantes estén descartadas.
- El camino `contextual_opposite`/`unmapped` sigue verificado solo
  localmente (sin cambios respecto a Fase 2C).
- Niveles Bronce/Plata/Oro/Platino no resueltos para ninguna de las 11
  acciones — requeriría lógica de progresión/consistencia (streaks) no
  construida en este pack, deliberadamente fuera de alcance.
- `has_accreditation_rule`/reglas múltiples: si en el futuro se añade una
  segunda regla activa para la misma acción sin desactivar la primera,
  el sistema cae a `review_required` en vez de elegir una — comportamiento
  seguro pero requiere que quien mantenga las reglas gestione su propio
  `status` (`active`/`inactive`) con cuidado.

## 13. Siguiente estado

```text
READY_FOR_MVP_GAMIFICATION_IMPLEMENTATION
```

Con al menos un `validated ACTION_LOG` real y reproducible (§10, punto 3
y 6), el ledger queda desbloqueado. `gamification.calculateAction`/
`recalculateDay`/`progress.*` siguen sin implementarse — es el trabajo de
la siguiente fase, no de esta.
