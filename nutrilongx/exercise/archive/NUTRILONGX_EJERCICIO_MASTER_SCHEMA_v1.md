# NUTRILONGX — Ejercicio: Master Schema v1 (Fase 2)

Fecha: 2026-08-18. Continuación de `NUTRILONGX_EJERCICIO_SPEC_PHASE1_v1.md`, aprobada con `STATUS: APPROVED_WITH_GOVERNANCE_DECISIONS` (13 decisiones de gobernanza + 1 cambio arquitectónico adicional). Este documento especifica el **esquema** de `NUTRILONGX_EJERCICIO_MASTER_v1.json` — no genera el Master, no genera biblioteca de ejercicios, sesiones, programas, contenido clínico con valores, SQL, tablas Supabase ni frontend. `CANONICAL v1.0` y `NUTRILONGX_ALIMENTACION_MASTER_v1.json` permanecen `FROZEN`, no tocados.

---

## A. METADATA / VERSIONING

```json
{
  "schema": "NUTRILONGX_EJERCICIO_MASTER_v1",
  "schema_doc_version": "1.0.0",
  "generated_at": null,
  "status": "SCHEMA_APPROVED_NOT_YET_BUILT",
  "spec_lineage": [
    "NUTRILONGX_EJERCICIO_SPEC_PHASE1_v1.md (APPROVED_WITH_GOVERNANCE_DECISIONS, 2026-08-18)",
    "governance_decisions_applied: 13 + 1 cambio arquitectónico (content/personalization layer split)"
  ],
  "change_log": []
}
```

El futuro Master llevará su propio `version` (semver) y `generated_at` independientes de este documento de esquema, siguiendo el mismo patrón que `NUTRILONGX_ALIMENTACION_MASTER_v1.json`.

---

## B. SCIENTIFIC SOURCE LINEAGE

Estructura reutilizable para registrar cada fuente citada, aplicada de forma uniforme en todo el Master (nunca una regla sin `source_id` trazable):

```json
{
  "source_id": "GARBER2011",
  "citation": "Garber CE et al., ACSM Position Stand, Medicine & Science in Sports & Exercise 43(7), 2011",
  "classification": "GUIDELINE",
  "organization": "ACSM",
  "year": 2011,
  "topic_tags": ["taxonomy", "domains", "neuromotor"]
}
```

`classification` ∈ `{GUIDELINE, CONSENSUS, SYSTEMATIC_REVIEW, META_ANALYSIS, PRIMARY_STUDY}`.

Catálogo de `source_id` establecido en Fase 1 (lista cerrada de partida, ampliable solo con nueva investigación explícita, no por inferencia): `WHO2020`, `BULL2020_BJSM`, `GARBER2011`, `ACSM_GETP11`, `ACSM_ESSA2024`, `AHA2023_RESISTANCE`, `KRAEMER2002_RATAMESS`, `NASM_OPT` (marco de certificación, no académico — se marca `classification: "INDUSTRY_FRAMEWORK_NOT_PEER_REVIEWED"` cuando se cite), `BORG1970`, `BORG1982`, `ZOURDOS2016`, `HELMS2016`, `BASTOS2024_RIR_SCOPING`, `GIBBONS_ACC_AHA_1997`, `PARQ_PLUS`, `AINSWORTH_COMPENDIUM`, `IDE2022_FUNCTIONAL`, `PEREIRA2025_DELPHI`, `JAKICIC2024_ACSM_OBESITY`, `DONNELLY2009_ACSM_OBESITY`, `ADA_STANDARDS2026`, `COLBERG2016_ADA`, `ESH2023`, `ACSM_HTA_PRONOUNCEMENT`, `ESC_EAS2019`, `KDIGO2024`, `UKKA2021`, `EWGSOP2_2019`, `ICFSR2019_DENT`, `ACSM_ONCOLOGY_ROUNDTABLE_2010`, `CAMPBELL2019_ONCOLOGY_UPDATE`, `ASCO2022_2024`, `IBMEWG2022_BONE_METS`, `SCHMITZ2010_LYMPHEDEMA_RCT`, `NAMS2021_OSTEOPOROSIS`, `LIFTMOR2018`, `BMC_MENOPAUSE_REVIEWS2024`, `DESMET2024_TRANSPLANT`, `NICE_NG249_2025`, `OTAGO_CAMPBELL1999`, `ACSM_POSITION_OLDER_ADULTS_2009`.

Cada regla, taxonomía o vocabulario del Master referenciará estos `source_id` por código, nunca reproduciendo el texto completo de la fuente.

---

## C. TAXONOMY REFERENCE

### C.1 Dominios (decisión 1)

```json
{
  "domains": [
    {"domain_id": "CARDIORESPIRATORY", "is_physiological_domain": true, "source_ids": ["GARBER2011","WHO2020"]},
    {"domain_id": "RESISTANCE", "is_physiological_domain": true, "source_ids": ["GARBER2011","WHO2020"]},
    {"domain_id": "FLEXIBILITY", "is_physiological_domain": true, "source_ids": ["GARBER2011"]},
    {"domain_id": "NEUROMOTOR", "is_physiological_domain": true, "source_ids": ["GARBER2011"], "note": "fusiona equilibrio + agilidad + coordinación + marcha, per Garber 2011"},
    {"domain_id": "SEDENTARY_BEHAVIOUR_INTERRUPTION", "is_physiological_domain": false, "note": "constructo conductual transversal (decisión 1), no dominio de entrenamiento ACSM"}
  ]
}
```

### C.2 Atributos transversales (decisiones 2–5)

```json
{
  "attributes": [
    {
      "attribute_id": "training_format",
      "applies_within_domains": ["CARDIORESPIRATORY", "RESISTANCE"],
      "controlled_vocabulary_ref": "training_format_vocabulary_v1",
      "example_values": ["HIIT", "CONTINUOUS", "CIRCUIT", "TRADITIONAL_SETS"],
      "legacy_mapping": {"HIIT": {"legacy_subdomain": "movement.hiit", "mapping_type": "EXACT", "note": "decisión 2 — HIIT es training_format, no dominio, pero conserva mapping explícito 1:1 con el subdominio legacy congelado"}}
    },
    {
      "attribute_id": "mobility_type",
      "applies_within_domains": ["FLEXIBILITY"],
      "controlled_vocabulary_ref": "mobility_type_vocabulary_v1",
      "example_values": ["ACTIVE_MOBILITY", "DYNAMIC_STRETCH", "STATIC_STRETCH"],
      "legacy_mapping": {"ACTIVE_MOBILITY": {"legacy_subdomain": "movement.mobility", "mapping_type": "CONCEPTUAL", "note": "decisión 3 — mobility no es dominio propio; FLEXIBILITY es el dominio científico, mobility es su atributo/tipo transversal. Mapping con movement.mobility conservado explícitamente. Gap de evidencia sobre distinción mobility/flexibility no resuelto, ver sección U."}}
    },
    {
      "attribute_id": "fall_prevention_goal",
      "type": "boolean",
      "applies_primarily_within_domains": ["NEUROMOTOR"],
      "legacy_mapping": {"true": {"legacy_subdomain": "movement.fall_prevention", "mapping_type": "CONCEPTUAL", "note": "decisión 4 — objetivo/tag de programación, no dominio."}}
    },
    {
      "attribute_id": "movement_pattern",
      "type": "array",
      "controlled_vocabulary_ref": "movement_pattern_vocabulary_v1",
      "example_values": ["SQUAT","HINGE","PUSH","PULL","CARRY","ROTATE","GAIT","LOCOMOTION"],
      "note": "decisión 5 — patrón biomecánico puro. NO debe confundirse con functional_relevance."
    },
    {
      "attribute_id": "functional_relevance",
      "aka": "functional_goal",
      "type": "array",
      "controlled_vocabulary_ref": "functional_goal_vocabulary_v1",
      "example_values": ["ADL_TRANSFER","GETTING_UP_FROM_FLOOR","STAIR_CLIMB","CARRYING_LOADS","GAIT_SPEED"],
      "note": "decisión 5 — objetivo/relevancia funcional en la vida diaria, campo separado de movement_pattern. Un mismo ejercicio puede tener movement_pattern=[HINGE] y functional_relevance=[GETTING_UP_FROM_FLOOR] simultáneamente, sin que uno derive del otro."
    }
  ]
}
```

### C.3 Tabla de mapping legacy completa (obligatoria, verificada contra `CANONICAL v1.0` FROZEN)

| Legacy subdomain (`movement.*`, FROZEN) | Familias | Representación en la nueva taxonomía | Tipo de mapping |
|---|---|---|---|
| `cardio` | 10 | `domain: CARDIORESPIRATORY` | `EXACT` |
| `strength` | 8 | `domain: RESISTANCE` | `EXACT` |
| `daily_activity` | 5 | `domain: SEDENTARY_BEHAVIOUR_INTERRUPTION` | `EXACT` |
| `hiit` | 4 | `attribute: training_format=HIIT` dentro de `CARDIORESPIRATORY`/`RESISTANCE` | `EXACT` (decisión 2) |
| `mobility` | 2 | `attribute: mobility_type` dentro de `domain: FLEXIBILITY` | `CONCEPTUAL` (decisión 3) |
| `fall_prevention` | 1 | `attribute: fall_prevention_goal=true` dentro de `domain: NEUROMOTOR` | `CONCEPTUAL` (decisión 4) |
| `adherence.movement.*` | 8 | Sin mapping a dominio de contenido — permanece exclusivamente como capa de comportamiento gamificado (sección O), no se representa como `EXERCISE`. | `NOT_APPLICABLE` (por diseño) |

Ninguna familia legacy queda huérfana de mapping.

---

## D. CONTROLLED VOCABULARIES

Todos los vocabularios son propiedad de NUTRILONGX (decisión 10), versionados independientemente dentro del Master:

```json
{
  "controlled_vocabularies": [
    {"vocab_id": "training_format_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["HIIT","CONTINUOUS","CIRCUIT","TRADITIONAL_SETS"]},
    {"vocab_id": "mobility_type_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["ACTIVE_MOBILITY","DYNAMIC_STRETCH","STATIC_STRETCH"]},
    {"vocab_id": "movement_pattern_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["SQUAT","HINGE","PUSH","PULL","CARRY","ROTATE","GAIT","LOCOMOTION","ISOMETRIC_HOLD","OTHER"]},
    {"vocab_id": "functional_goal_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["ADL_TRANSFER","GETTING_UP_FROM_FLOOR","STAIR_CLIMB","CARRYING_LOADS","GAIT_SPEED","REACHING","BALANCE_RECOVERY","OTHER"]},
    {"vocab_id": "equipment_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["BODYWEIGHT","RESISTANCE_BAND","DUMBBELL","KETTLEBELL","MACHINE","FREE_WEIGHT_BARBELL","CARDIO_EQUIPMENT_TREADMILL","CARDIO_EQUIPMENT_BIKE","CARDIO_EQUIPMENT_ROWER","CARDIO_EQUIPMENT_ELLIPTICAL","JUMP_ROPE","OTHER"]},
    {"vocab_id": "context_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["HOME","GYM","OUTDOOR","POOL_WATER","OFFICE"]},
    {"vocab_id": "safety_state_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["ABSOLUTE_CONTRAINDICATION","RELATIVE_CONTRAINDICATION","PRECAUTION","ADAPTATION","NOT_ASSESSED"]},
    {"vocab_id": "evidence_maturity_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["STRONG","MODERATE","LIMITED","INSUFFICIENT"]},
    {"vocab_id": "review_status_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["PENDING_HUMAN_REVIEW","HUMAN_REVIEWED_APPROVED","HUMAN_REVIEWED_REJECTED","NEEDS_REVISION"]},
    {"vocab_id": "review_flag_vocabulary", "version": "1.0", "owner": "NUTRILONGX", "items": ["NO_PRIMARY_SOURCE_CITED","AI_GENERATED_UNREVIEWED","CONFLICTING_SOURCES","SAFETY_RULE_NOT_ASSESSED","TAXONOMY_MAPPING_AMBIGUOUS","EQUIPMENT_AMBIGUOUS","DUPLICATE_CANDIDATE"]},
    {"vocab_id": "gamification_binding_type_vocabulary", "version": "1.0 (heredado de Alimentación Binding Semantics v1.0)", "owner": "NUTRILONGX", "items": ["supports","candidate","contextual_opposite","unmapped","direct"]}
  ]
}
```

Estos vocabularios son mínimos de partida — se amplían por decisión de producto/gobernanza, no por inferencia libre durante la construcción del Master.

---

## E. EXERCISE SCHEMA

```json
{
  "exercise_id": "exercise.resistance.sentadilla_goblet",
  "title": "Sentadilla goblet",
  "primary_domain": "RESISTANCE",
  "secondary_domains": [],
  "training_format": [],
  "mobility_type": null,
  "fall_prevention_goal": false,
  "movement_pattern": ["SQUAT"],
  "functional_relevance": ["GETTING_UP_FROM_FLOOR", "ADL_TRANSFER"],
  "technical_complexity": "MODERATE",
  "functional_requirement": {
    "requires_standing_balance": true,
    "requires_floor_transition": false,
    "requires_grip_strength": "LOW",
    "requires_overhead_shoulder_rom": false
  },
  "equipment_required": ["DUMBBELL"],
  "context_compatible": ["HOME", "GYM"],
  "target_structures": {"vocabulary_status": "NOT_STANDARDIZED", "value": ["cuádriceps", "glúteo"], "note": "sin fuente GUIDELINE de vocabulario muscular estandarizado localizada en Fase 1 — texto libre hasta decisión futura"},
  "typical_reps_range": {"min": 8, "max": 15, "note": "orientativo, no prescriptivo"},
  "typical_duration_range": null,
  "safety_refs": [],
  "media": { "...": "ver sección N" },
  "provenance": {
    "source_ids": [],
    "generated_via": "AI_ASSISTED_SEED_CONTENT_v1",
    "review_status": "PENDING_HUMAN_REVIEW",
    "review_flags": ["AI_GENERATED_UNREVIEWED"],
    "created_at": null,
    "last_modified_at": null
  },
  "status": "DRAFT"
}
```

Notas de diseño: `training_intensity` **no existe** como campo de `EXERCISE` — es intencional (ver sección J). `primary_domain` es obligatorio y único; `secondary_domains` es opcional para ejercicios híbridos (p.ej. kettlebell swing toca `RESISTANCE` y `CARDIORESPIRATORY`). `safety_refs` apunta por id a reglas del modelo de seguridad (sección K), nunca las incrusta.

---

## F. EXERCISE_VARIANT SCHEMA

```json
{
  "variant_id": "exercise_variant.resistance.sentadilla_goblet.regresion_silla",
  "base_exercise_id": "exercise.resistance.sentadilla_goblet",
  "relationship_type": "REGRESSION",
  "progression_stage": -1,
  "delta_description": "Sentadilla asistida con apoyo en silla, rango de movimiento reducido",
  "technical_complexity": "LOW",
  "functional_requirement": {"requires_standing_balance": false, "requires_floor_transition": false},
  "equipment_required": ["BODYWEIGHT"],
  "provenance": { "...": "misma forma que EXERCISE" }
}
```

`relationship_type` ∈ `{TECHNICAL_VARIANT, LOAD_VARIANT, REGRESSION, PROGRESSION}`. `progression_stage` es un entero relativo al ejercicio base (0 = base, negativo = regresión, positivo = progresión); no representa nivel de gamificación bajo ninguna circunstancia.

---

## G. SESSION_TEMPLATE SCHEMA

```json
{
  "session_template_id": "session_template.resistance.full_body_general_v1",
  "title": "Fuerza full-body general",
  "session_focus_domains": ["RESISTANCE"],
  "target_profile_hint": "GENERAL_HEALTHY_ADULT",
  "estimated_duration_min": 40,
  "equipment_required_aggregated": ["DUMBBELL", "BODYWEIGHT"],
  "exercises": [
    {
      "order": 1,
      "exercise_or_variant_id": "exercise.resistance.sentadilla_goblet",
      "sets": 3,
      "reps_range": {"min": 8, "max": 12},
      "rest_seconds": 90,
      "target_intensity": {"scale": "RIR_0_10", "value_range": {"min": 1, "max": 3}},
      "notes": null
    }
  ],
  "gamification_bindings": [],
  "provenance": { "...": "misma forma que EXERCISE" }
}
```

`target_profile_hint` es una etiqueta descriptiva del diseño de la plantilla (a qué población general se orientó), **no** una `PRESCRIPTION` — no contiene datos de usuario ni adaptaciones individuales (frontera con sección Q).

---

## H. PROGRAM_TEMPLATE SCHEMA

```json
{
  "program_template_id": "program_template.general_health.8_semanas_v1",
  "title": "Programa general de salud — 8 semanas",
  "program_goal": "GENERAL_HEALTH_MAINTENANCE",
  "duration_weeks": 8,
  "sessions_sequence": [
    {"week": 1, "session_template_id": "session_template.resistance.full_body_general_v1", "notes": null}
  ],
  "progression_rules": [
    {"week_range": [1, 4], "adjustment_type": "TECHNIQUE_CONSOLIDATION", "magnitude_hint": "sin incremento de carga"},
    {"week_range": [5, 8], "adjustment_type": "LOAD_INCREASE", "magnitude_hint": "orientativo, no prescriptivo — ver PRESCRIPTION"}
  ],
  "target_domains_aggregated": ["RESISTANCE"],
  "provenance": { "...": "misma forma que EXERCISE" }
}
```

`program_goal` debe estar acotado a lo que la evidencia respalda (sección B/L) — nunca una promesa clínica no sustentada (p.ej. no "revierte la diabetes", sí "mantenimiento general de salud" o, cuando exista regla clínica aprobada, un objetivo ligado a `clinical_profile_id` con su propia `evidence_maturity`).

---

## I. FITT-VP REPRESENTATION

| Componente | `EXERCISE`/`VARIANT` | `SESSION_TEMPLATE` | `PROGRAM_TEMPLATE` | `PRESCRIPTION` (fuera del Master) |
|---|---|---|---|---|
| Frequency | — | — | `sessions_per_week` (derivado de `sessions_sequence`) | override individual |
| Intensity | `typical_*` orientativo | `target_intensity {scale, value_range}` | `progression_rules[].magnitude_hint` | valor concreto asignado al usuario |
| Time | `typical_duration_range` orientativo | `estimated_duration_min` | `duration_weeks` | valor concreto |
| Type | `primary_domain` + atributos | `session_focus_domains` | `target_domains_aggregated` | heredado + posible sustitución de ejercicio |
| Volume | — | `sets`/`reps_range` por ejercicio | agregado a nivel de programa (no en Master, calculado) | valor concreto |
| Progression | `progression_stage` (relación entre variantes) | — | `progression_rules` | aplicación real, día a día |

Escalas de intensidad soportadas (`scale` field, obligatorio siempre que exista `intensity`): `BORG_6_20`, `BORG_CR10`, `RIR_0_10`, `PERCENT_1RM`, `PERCENT_HRR`, `PERCENT_HRMAX`, `METS`. Ningún valor numérico de intensidad puede aparecer sin `scale` declarada.

---

## J. DIFFICULTY / CAPACITY MODEL

Los 4 ejes aprobados (decisión 6), formalizados:

| Campo | Tipo | Vive en | Nunca vive en |
|---|---|---|---|
| `technical_complexity` | enum `LOW`/`MODERATE`/`HIGH` | `EXERCISE`, `EXERCISE_VARIANT` | `SESSION_TEMPLATE`, `PROGRAM_TEMPLATE` |
| `functional_requirement` | objeto estructurado (flags/enum por capacidad basal) | `EXERCISE`, `EXERCISE_VARIANT` | Nunca a nivel de sesión/programa — es propiedad del movimiento, no de la dosis |
| `training_intensity` | `{scale, value/value_range}` | `SESSION_TEMPLATE` (como objetivo de plantilla), `PRESCRIPTION` (valor real asignado) | **Nunca** en `EXERCISE`/`EXERCISE_VARIANT` — es prescripción, no propiedad fija |
| `progression_stage` | entero relativo | Relación entre `EXERCISE_VARIANT`s de una misma cadena | No es campo aislado de un ejercicio sin cadena |

`exercise_difficulty` (decisión 6): permitido **únicamente** como `derived_ui.exercise_difficulty_label`, calculado por una función de UI a partir de los 3 campos fijos (`technical_complexity`, `functional_requirement`, y opcionalmente `progression_stage`), marcado `"is_derived": true, "source_of_truth": false`. **Prohibido explícitamente** su uso como criterio de filtrado de seguridad clínica o de elegibilidad — esa función queda reservada al modelo de seguridad (sección K) y al perfil clínico (sección L).

---

## K. SAFETY MODEL

### K.1 Estados (decisión 7)

`safety_state` ∈ `{ABSOLUTE_CONTRAINDICATION, RELATIVE_CONTRAINDICATION, PRECAUTION, ADAPTATION, NOT_ASSESSED}`. `NOT_ASSESSED` es el valor por defecto obligatorio de cualquier combinación `(exercise_id o domain o movement_pattern) × clinical_profile_id` sin regla explícita — nunca se omite el campo ni se infiere `"seguro"`.

### K.2 Estructura de regla (sin valores poblados en esta fase)

```json
{
  "safety_rule_id": "safety_rule.hta.avoid_heavy_valsalva",
  "applies_to": {"scope": "movement_pattern", "value": "ISOMETRIC_HOLD"},
  "clinical_profile_id": "hta",
  "state": "PRECAUTION",
  "rationale_source_ids": ["ACSM_HTA_PRONOUNCEMENT", "AHA2023_RESISTANCE"],
  "stop_criteria": [],
  "medical_clearance_required": false,
  "status": "DEFINITION_NOT_PROVIDED_FINAL"
}
```

`applies_to.scope` ∈ `{exercise_id, variant_id, domain, movement_pattern, training_format}` — permite reglas a distintos niveles de granularidad sin duplicar por cada ejercicio individual. `stop_criteria` es una lista separada de síntomas de cese inmediato durante la ejecución (distinta de la contraindicación evaluada antes de empezar). Ninguna regla con valores reales se genera en esta fase — solo la estructura.

---

## L. CLINICAL PROFILES AND RULE INHERITANCE

```json
{
  "clinical_profile_id": "dislipemia",
  "evidence_maturity": "MODERATE",
  "primary_sources": ["ESC_EAS2019"],
  "rule_inheritance": "GENERAL_CV",
  "status": "DEFINITION_NOT_PROVIDED_FINAL",
  "notes": "decisión 8 — perfil independiente conservado; sin regla de ejercicio distintiva en la literatura, hereda de reglas generales cardiovasculares (HTA/riesgo CV) hasta que exista evidencia específica que la sustituya explícitamente."
}
```

11 perfiles, cada uno con esta forma:

| `clinical_profile_id` | `evidence_maturity` | `rule_inheritance` |
|---|---|---|
| `adulto_sano` | `STRONG` | `null` |
| `obesidad` | `STRONG` | `null` |
| `hta` | `STRONG` | `null` |
| `dm2` | `STRONG` | `null` |
| `dislipemia` | `MODERATE` | `GENERAL_CV` (decisión 8) |
| `edad_avanzada` | `STRONG` | `null` |
| `fragilidad_sarcopenia` | `STRONG` | `null` |
| `menopausia` | `MIXED` (`STRONG` en salud ósea, `INSUFFICIENT` en síntomas) | `null` |
| `oncologia` | `STRONG` (general), `MODERATE` (subpoblaciones: hematológico, metástasis ósea) | `null` |
| `renal_leve_moderada` | `STRONG` | `null` |
| `inmunosupresion` | `LIMITED` | `null` |

`rule_inheritance` es un mecanismo explícito y auditable — cuando está poblado, significa "sin override propio, aplican las reglas del perfil referenciado"; nunca implica invención de una regla nueva. `menopausia` e `inmunosupresion` (decisión 9) conservan su `evidence_maturity` real y no se les asignan reglas firmes solo porque el producto lo necesite — su `status` permanece `DEFINITION_NOT_PROVIDED_FINAL` hasta que exista evidencia suficiente o una decisión explícita de gobernanza que asuma el riesgo de una recomendación conservadora.

---

## M. EQUIPMENT / CONTEXT VOCABULARY

Ver sección D (`equipment_vocabulary`, `context_vocabulary`) — confirmado como vocabulario controlado propiedad de NUTRILONGX, versionado (decisión 10), no como taxonomía científica (no existe fuente `GUIDELINE`/`CONSENSUS` para esto, documentado ya en Fase 1 sección I). Cambios futuros al vocabulario se versionan (`v1.0` → `v1.1`...), nunca se sobrescriben en silencio.

---

## N. MULTIMEDIA MODEL

```json
{
  "media": {
    "image": {"status": "NO_SOURCE_PROVIDED", "url": null},
    "demonstration_video": {"status": "NO_SOURCE_PROVIDED", "url": null},
    "technique_instructions": {"status": "NO_SOURCE_PROVIDED", "text": null},
    "common_errors": {"status": "NO_SOURCE_PROVIDED", "items": []},
    "safety_cues": {"status": "NO_SOURCE_PROVIDED", "items": []}
  }
}
```

Presente estructuralmente en cada `EXERCISE`/`EXERCISE_VARIANT`, vacío hasta que exista fuente real — mismo patrón que en `NUTRILONGX_ALIMENTACION_MASTER_v1.json`.

---

## O. GAMIFICATION BINDINGS

### O.1 Distinción importante

La tabla de mapping de la sección C (taxonomía↔subdominio legacy: HIIT↔`movement.hiit`, mobility↔`movement.mobility`, fall_prevention↔`movement.fall_prevention`) es un mapping **conceptual, a nivel de taxonomía** — no genera bindings de gamificación por sí sola. Los `gamification_bindings` de esta sección son **instancia a instancia**: de un `EXERCISE`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE` concreto hacia un `canonical_action_id` concreto del catálogo `CANONICAL v1.0`. No se generan en esta fase.

### O.2 Estructura (decisión 12 — reutiliza Binding Semantics v1.0 de Alimentación)

```json
{
  "canonical_action_id": "movement.strength.sesion_de_fuerza_full_body_min",
  "canonical_catalog_version": "CANONICAL_v1.0",
  "binding_type": "candidate",
  "status": "DEFINITION_NOT_PROVIDED_FINAL",
  "evidence_source": {"type": "session_template_id", "value": "session_template.resistance.full_body_general_v1"},
  "notes": null
}
```

`binding_type` ∈ `{supports, candidate, contextual_opposite, unmapped, direct}`, idéntico al vocabulario ya aprobado en Alimentación.

### O.3 Regla de DVG (decisión 13)

Ningún `binding` genera DVG por sí mismo. `SESSION_TEMPLATE`/`PROGRAM_TEMPLATE` nunca generan DVG automáticamente por existir, visualizarse o marcarse genéricamente como completados. Una futura `EXECUTION` (fuera del Master, sección R) podrá constituir evidencia para registrar una acción `CANONICAL` concreta **solo cuando**: (a) exista un `binding` explícito con `binding_type` compatible (`supports`/`direct`, nunca `contextual_opposite` como recomendación positiva — regla ya verificada en Alimentación QA11 y reutilizada aquí); (b) se cumplan las condiciones de esa regla (aún no diseñadas); (c) la lógica futura del motor de gamificación lo autorice explícitamente. El diseño de esa lógica de autorización y de la deduplicación (evitar doble registro cuando el usuario completa una sesión Y registra manualmente la misma acción) queda fuera de alcance de este documento — se señala como requisito para una fase de diseño de motor futura, no resuelto aquí.

---

## P. PROVENANCE / REVIEW MODEL

Estructura uniforme aplicada a `EXERCISE`, `EXERCISE_VARIANT`, `SESSION_TEMPLATE`, `PROGRAM_TEMPLATE` (decisión 11):

```json
{
  "provenance": {
    "source_ids": [],
    "generated_via": "AI_ASSISTED_SEED_CONTENT_v1",
    "review_status": "PENDING_HUMAN_REVIEW",
    "review_flags": [],
    "reviewer": null,
    "reviewed_at": null,
    "created_at": null,
    "last_modified_at": null
  }
}
```

`review_status` ∈ `{PENDING_HUMAN_REVIEW, HUMAN_REVIEWED_APPROVED, HUMAN_REVIEWED_REJECTED, NEEDS_REVISION}`. Ningún elemento con `review_status: PENDING_HUMAN_REVIEW` debe considerarse apto para producción — esto es un requisito estructural del esquema, no solo una convención documental (se valida en QA, sección T). `source_ids` debe apuntar al catálogo de la sección B; `generated_via` documenta explícitamente que el contenido semilla es asistido por IA (decisión 11), nunca oculta ese origen.

---

## Q. CONCEPTUAL BOUNDARY WITH PRESCRIPTION

`PRESCRIPTION` **no vive en el Master**. Vive en una futura capa de datos de usuario (Supabase, fuera de alcance SQL en esta fase). Forma conceptual:

```json
{
  "prescription_id": "…",
  "user_id": "…",
  "based_on": {"type": "session_template_id | program_template_id", "value": "…"},
  "fitt_vp_overrides": {},
  "safety_adaptations_applied": [],
  "clinical_profile_context": [],
  "created_at": "…"
}
```

Regla de frontera: el Master nunca contiene `user_id` ni ningún campo con forma de dato personal. `PRESCRIPTION` referencia `session_template_id`/`program_template_id`/`exercise_id` del Master **solo por id** (relación de solo lectura, tipo clave foránea conceptual) — el Master no sabe que existen prescripciones, no las referencia hacia atrás.

---

## R. CONCEPTUAL BOUNDARY WITH EXECUTION

`EXECUTION` tampoco vive en el Master. Forma conceptual:

```json
{
  "execution_id": "…",
  "user_id": "…",
  "prescription_id": null,
  "what_was_done": {"exercise_or_variant_id": "…", "sets_completed": 0, "reps_completed": 0},
  "completed_at": "…",
  "self_reported_intensity": {"scale": "RIR_0_10", "value": null},
  "adherence_status": "…"
}
```

`prescription_id` es opcional — permite `EXECUTION` ad-hoc no prescrita. La relación `EXECUTION` → posible `action_log` de gamificación pasa siempre por el `binding` (sección O.3): `EXECUTION` es la evidencia candidata, nunca el disparador automático. Este documento **no diseña** esa lógica de autorización — la señala como límite explícito para no mezclar contenido canónico con datos de usuario dentro del mismo artefacto versionado.

---

## S. FUTURE SUPABASE ENTITY MAP (conceptual — SIN SQL)

| Tabla conceptual futura | Naturaleza | Contiene `user_id` |
|---|---|---|
| `exercise_library` | Contenido canónico, espejo de `EXERCISE` del Master, gestión admin | No |
| `exercise_variants` | Contenido canónico | No |
| `session_templates` | Contenido canónico | No |
| `program_templates` | Contenido canónico | No |
| `user_prescriptions` (futura) | Dato de usuario, referencia por id a las tablas de contenido | Sí |
| `user_executions` (futura, potencialmente unificada con el todavía-inexistente `action_logs` del motor de gamificación) | Dato de usuario | Sí |

Frontera explícita para quien diseñe el SQL en una fase posterior: las tablas de contenido deben ser de solo lectura para el cliente (gestión admin), las tablas de usuario deben llevar RLS (row-level security) y clave foránea hacia las de contenido — **no se diseña el DDL aquí**, solo se deja señalado el requisito para que Supabase nunca termine mezclando contenido canónico y datos personales en una misma tabla, tal como pidió César explícitamente.

---

## T. MANDATORY QA VALIDATIONS FOR FUTURE MASTER BUILD

Batería obligatoria antes de declarar válido un futuro build de `NUTRILONGX_EJERCICIO_MASTER_v1.json` (mismo nivel de rigor que las 20 validaciones aplicadas en Alimentación):

1. Todo `EXERCISE` tiene ≥1 `source_id` en `provenance.source_ids`, salvo `review_status: PENDING_HUMAN_REVIEW` explícitamente marcado como tal.
2. Ningún `EXERCISE` carece de `primary_domain`.
3. Todo `EXERCISE_VARIANT.base_exercise_id` referencia un `exercise_id` existente en el Master.
4. `progression_stage` forma una cadena válida y no cíclica por cada `base_exercise_id`.
5. `training_intensity` nunca aparece como campo de `EXERCISE`/`EXERCISE_VARIANT` (solo en `SESSION_TEMPLATE`) — invariante estructural.
6. `exercise_difficulty_label` (`derived_ui`) nunca se referencia desde ninguna `safety_rule` ni desde ningún criterio de elegibilidad clínica.
7. Ninguna `safety_rule.state` distinto de `NOT_ASSESSED` carece de `rationale_source_ids` no vacío.
8. Los 11 `clinical_profile_id` de la sección L están presentes, cada uno con `evidence_maturity` no nulo.
9. `dislipemia.rule_inheritance == "GENERAL_CV"` salvo que exista una regla propia con `source_id` explícito que la sustituya.
10. `menopausia` e `inmunosupresion` nunca tienen `evidence_maturity` escalado a `STRONG` sin que exista un nuevo `source_id` añadido a la sección B respaldándolo.
11. `HIIT` nunca aparece como valor de `primary_domain`/`secondary_domains` — solo como valor de `training_format`.
12. Mobility (`ACTIVE_MOBILITY`/similares) nunca aparece como dominio de primer nivel — solo como `mobility_type` dentro de ejercicios con `FLEXIBILITY` en dominio.
13. `fall_prevention_goal: true` solo aparece en ejercicios cuyo `primary_domain` o `secondary_domains` incluya `NEUROMOTOR`, salvo excepción explícitamente anotada.
14. Todo `EXERCISE`/`EXERCISE_VARIANT`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE` tiene `provenance.review_status` poblado (campo nunca ausente).
15. Ningún objeto con forma de `PRESCRIPTION` o `EXECUTION` aparece en ninguna parte del Master (chequeo estructural de claves prohibidas: `user_id`, `prescription_id`, `execution_id`, `completed_at`).
16. Ningún campo con forma de dato personal (`user_id` o equivalente) aparece en el documento.
17. Todo `gamification_binding.canonical_action_id` existe verificado contra `NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json` (FROZEN, leído en modo solo lectura).
18. Ningún `binding_type` fuera de los 5 valores aprobados.
19. Todos los valores de `movement_pattern` provienen del vocabulario controlado (sección D).
20. Todos los valores de `equipment_required`/`context_compatible` provienen de sus vocabularios controlados.
21. La tabla de mapping legacy (sección C.3) cubre las 6 subdominios `movement.*` sin huérfanos.
22. Ningún `contextual_opposite` aparece nunca como `supports` (misma regla que QA11 de Alimentación, reaplicada).
23. `information_loss`/gaps declarados explícitamente a nivel de documento — ninguna omisión silenciosa de cobertura.

---

## U. OPEN GAPS

1. **Bloqueo principal**: la biblioteca de ejercicios sigue sin construirse — este documento solo especifica su forma (decisión 11: semilla asistida por IA + revisión humana obligatoria, `review_status` nunca implícitamente aprobado).
2. Distinción científica mobility vs. flexibility sigue sin fuente `GUIDELINE`/`CONSENSUS` confirmada — la decisión 3 se tomó reconociendo explícitamente este gap, no resolviéndolo.
3. `functional_relevance`/`movement_pattern` como campos separados (decisión 5) son de nueva creación en esta fase — su vocabulario (sección D) es un punto de partida mínimo, no exhaustivo; necesitará ampliación editorial en Fase 3.
4. No se han diseñado las preguntas de onboarding que alimentarían `medical_clearance_required` ni la asignación de `clinical_profile_id` a un usuario real — depende de decisiones de producto no tomadas.
5. No se han revisado wireframes reales de Rutinas/Retos/Estadísticas/Dashboard — el modelo de consumo de Fase 1 (sección M de ese documento) sigue sin validar contra diseño.
6. La lógica de autorización de `EXECUTION` → `action_log` (sección O.3/R) es un requisito señalado, no diseñado — es la pieza más compleja pendiente y no debe subestimarse en Fase 3+.
7. El vocabulario de `target_structures` (grupos musculares) permanece `NOT_STANDARDIZED` — no se encontró una fuente `GUIDELINE` de nomenclatura muscular estandarizada en la investigación de Fase 1; queda como texto libre marcado explícitamente hasta que se decida adoptar una (p.ej. terminología anatómica estándar).

---

## V. RECOMMENDED PHASE 3 BUILD STRATEGY

1. Completar y congelar la versión inicial de los vocabularios controlados (sección D) — decisión de bajo riesgo, base de todo lo demás.
2. Construir un lote piloto pequeño (≈30–50 `EXERCISE`) cubriendo, como mínimo, las combinaciones ya mapeadas desde `CANONICAL v1.0` (cardio, strength, hiit, mobility, fall_prevention — sección C.3), con contenido semilla asistido por IA y `review_status: PENDING_HUMAN_REVIEW` explícito en el 100% de los casos, más `source_ids` de la sección B donde aplique.
3. Construir las cadenas `EXERCISE_VARIANT` correspondientes al lote piloto (regresión/progresión).
4. Construir 3–5 `SESSION_TEMPLATE` y 1–2 `PROGRAM_TEMPLATE` piloto, ejecutar la batería completa de QA (sección T) sobre ese subconjunto antes de escalar.
5. Solo tras superar el piloto: ampliar cobertura de dominio en dominio, manteniendo siempre `review_status` real (nunca aprobar en bloque sin revisión humana efectiva).
6. Proponer el diseño SQL de las tablas de contenido (sección S) como paso de gobernanza separado — todavía sin SQL en esta fase.
7. Diferir explícitamente el diseño del motor `PRESCRIPTION`/`EXECUTION`/autorización de DVG a una fase dedicada — no conflacionar con la construcción del contenido canónico del Master.

---

## FINAL STATUS

```
READY_FOR_EXERCISE_MASTER_SCHEMA_REVIEW
```
