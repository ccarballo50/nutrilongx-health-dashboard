# NUTRILONGX — Ejercicio: Safety Rule Schema v1 (Fase 3B)

Fecha: 2026-08-19. Formaliza la estructura `safety_rule` esbozada en `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.2.md` (sección K), sin modificarla retroactivamente — este documento es la especificación completa para las reglas construidas en esta fase. No genera `NUTRILONGX_EJERCICIO_MASTER_v1.json`. `CANONICAL v1.0` y `ALIMENTACION_MASTER_v1` no se han tocado. `LIBRARY_PILOT_v1.1` permanece `FROZEN` — ninguna identidad `EXERCISE`/`EXERCISE_VARIANT` se modifica aquí.

---

## A. AUDITORÍA DE GRANULARIDAD — ¿DOMAIN, EXERCISE, ATTRIBUTE, o SESSION?

Antes de fijar el modelo se auditaron los 4 niveles posibles contra las necesidades reales detectadas en `PHASE3B_SAFETY_COVERAGE_PLAN_v1.md` y `PHASE3B_TARGETED_RESEARCH_v1.md`:

| Nivel | ¿Se necesita en esta ronda? | Justificación |
|---|---|---|
| **`DOMAIN`** (`CARDIORESPIRATORY`/`RESISTANCE`/etc.) | **No, en esta ronda.** | Ninguno de los 6 gaps de Fase 3B-R ni la matriz de cobertura exige una regla que aplique a un dominio completo sin distinción de atributo — todas las necesidades detectadas se expresan mejor a nivel de atributo transversal (más preciso, sin perder cobertura). Se conserva `domain` como `scope` válido para el futuro, pero no se usa en esta ronda. |
| **`EXERCISE`/`EXERCISE_VARIANT` individual** | **No, salvo que sea inevitable.** | Habría exigido duplicar la misma regla en hasta 12+ objetos (p.ej. todos los `EXERCISE` con `valsalva_risk_relevant: true`). Se evita sistemáticamente — ver sección C. |
| **`ATTRIBUTE_SELECTOR`** (nuevo, ver sección B) | **Sí — es el nivel dominante en este build.** | `impact_level`, `balance_requirement_level`, `fall_risk_relevant`, `valsalva_risk_relevant`, `functional_requirement.requires_floor_transition`, `functional_requirement.requires_grip_strength`, `training_format` ya son atributos reales del esquema v1.2 y de `LIBRARY_PILOT_v1.1` — permiten expresar una regla una sola vez y que se aplique automáticamente a cualquier objeto presente o futuro que cumpla la condición, sin mantenimiento manual de una lista de IDs. |
| **`SESSION`** (`load_intensity_band`, `isometric_effort_level`, `training_intensity`) | **No — reservado, no construido.** | Estos atributos son explícitamente `SESSION_TEMPLATE`-only (Schema v1.2, decisión de Fase 2) y `SESSION_TEMPLATE` no existe todavía (Fase 3C). Cualquier regla que dependiera de ellos quedaría huérfana. Se documenta el `scope` reservado en el vocabulario (sección B) pero **no se instancia ninguna regla con él en este build**. |
| **`PROFILE_BASELINE`** (nuevo, no anticipado originalmente) | **Sí — 1 caso.** | Durante la construcción apareció una necesidad real que no encaja en ningún nivel anterior: una regla de estratificación de riesgo cardiovascular de preparticipación (ACC/AHA, ya citada en `NUTRILONGX_EJERCICIO_SPEC_PHASE1_v1.md` sección B.3) que no depende de ningún atributo de ejercicio concreto — aplica al perfil clínico como puerta de entrada, independientemente de qué se vaya a entrenar. Se añade como quinto valor de `scope` (ver sección B), auditado y justificado aquí, no adoptado ciegamente de la lista original propuesta por César. |

**Conclusión de la auditoría**: el modelo final usa `attribute_selector` como nivel dominante (evita duplicación), añade `profile_baseline` como caso nuevo justificado, mantiene `domain`/`exercise_id`/`variant_id`/`movement_pattern`/`training_format` como `scope` válidos heredados de v1.0–v1.2 (sin usarlos todavía salvo `training_format`), y reserva explícitamente (sin instanciar) un `scope: session_attribute` para cuando exista `SESSION_TEMPLATE`.

---

## B. ESTRUCTURA FORMAL DE `safety_rule`

```json
{
  "safety_rule_id": "safety_rule.hta.valsalva_isometric_effort_precaution",
  "target_entity_type": "EXERCISE_AND_EXERCISE_VARIANT",
  "applies_to": {
    "scope": "attribute_selector",
    "attribute_name": "valsalva_risk_relevant",
    "attribute_value": true
  },
  "clinical_profile_id": "hta",
  "safety_status": "PRECAUTION",
  "condition_trigger": "Cualquier EXERCISE o EXERCISE_VARIANT con valsalva_risk_relevant=true, para usuarios con perfil clinical_profile_id=hta.",
  "recommendation_adaptation": "Evitar maniobra de Valsalva sostenida; priorizar tecnica de respiracion controlada (exhalar en la fase de esfuerzo); considerar carga submaxima cuando el patron lo permita.",
  "supervision_requirement": "RECOMMENDED",
  "medical_clearance_required": false,
  "evidence_strength": "MODERATE",
  "evidence_maturity": "MODERATE",
  "scientific_provenance": [
    {"content_category": "SAFETY_CONTRAINDICATION_ADAPTATION", "source_status": "SOURCE_BACKED",
     "source_ids": ["MACDOUGALL1985", "SPORTS_MED_ISOMETRIC_BP2024", "ACSM_HTA_PRONOUNCEMENT"],
     "note": "relacion dosis-respuesta aguda entre intensidad/duracion de esfuerzo isometrico y presion arterial bien cuantificada en poblacion general y con datos preliminares en HTA; no se fija ningun umbral numerico de PA como regla porque la fuente no lo valida para uso no supervisado"}
  ],
  "source_ids": ["MACDOUGALL1985", "SPORTS_MED_ISOMETRIC_BP2024", "ACSM_HTA_PRONOUNCEMENT"],
  "rationale": "MacDougall 1985 y la revision sistematica 2024 cuantifican picos de presion sistolica proporcionales a la intensidad/duracion del esfuerzo isometrico; el meta-analisis BJSM 2023 confirma que el entrenamiento isometrico bien dosificado tiene beneficio cronico, por lo que la regla es de PRECAUCION (tecnica), no de contraindicacion categorica.",
  "stop_criteria": ["mareo o vision borrosa durante el esfuerzo", "cefalea subita durante el esfuerzo", "dolor toracico"],
  "stop_criteria_not_applicable_reason": null,
  "review_status": "PENDING_HUMAN_REVIEW",
  "review_flags": ["AI_GENERATED_UNREVIEWED"],
  "content_maturity": "STRUCTURALLY_COMPLETE",
  "generated_via": "AI_ASSISTED_SEED_CONTENT_v1",
  "provenance_trace": {
    "research_source_document": "NUTRILONGX_EJERCICIO_PHASE3B_TARGETED_RESEARCH_v1.md",
    "research_gap_reference": "Gap 6 -- PA/esfuerzo isometrico en HTA",
    "gap_resolution_status": "PARTIALLY_RESOLVED"
  }
}
```

### B.1 `applies_to.scope` — vocabulario completo (extendido en esta fase)

| `scope` | Campos adicionales requeridos | Estado en este build |
|---|---|---|
| `exercise_id` | `value` (string, debe existir en `LIBRARY_PILOT_v1.1`) | Heredado v1.0, no usado en este build |
| `variant_id` | `value` (string, debe existir) | Heredado v1.0, no usado en este build |
| `domain` | `value` (string, `primary_domain` válido) | Heredado v1.0, no usado en este build (ver auditoría A) |
| `movement_pattern` | `value` (string, código de patrón válido) | Heredado v1.0, no usado en este build |
| `training_format` | `value` (string, p.ej. `"HIIT"`) | **Usado en este build** (4 reglas) |
| `attribute_selector` **[nuevo v1 safety schema]** | `attribute_name` (string, ruta del atributo, admite notación con punto p.ej. `functional_requirement.requires_floor_transition`), `attribute_value` (tipo según atributo) | **Usado en este build** (7 reglas) — nivel dominante |
| `profile_baseline` **[nuevo v1 safety schema]** | ninguno adicional — aplica al perfil clínico completo, independiente del ejercicio | **Usado en este build** (1 regla) |
| `session_attribute` **[reservado, NO instanciado]** | `attribute_name` ∈ `{load_intensity_band, isometric_effort_level, training_intensity}` | **Reservado para Fase 3C**, cero reglas con este scope existen todavía — requiere que `SESSION_TEMPLATE` exista primero |

### B.2 `safety_status` (sin cambios respecto al modelo K.1 ya aprobado)

`{ABSOLUTE_CONTRAINDICATION, RELATIVE_CONTRAINDICATION, PRECAUTION, ADAPTATION, NOT_ASSESSED}`. `NOT_ASSESSED` sigue siendo el valor por defecto obligatorio de cualquier combinación sin regla explícita — nunca se omite ni se infiere "seguro" (principio reafirmado, sin cambios).

### B.3 Disciplina de evidencia (principio fundamental de esta fase)

Ningún `safety_rule` de este build fue derivado de un estado de investigación `PARTIAL`/`UNRESOLVED`/`RETAINED`/`RETAINED_CONDITIONAL`/`EVIDENCE_GAP` sin evidencia suficiente para esa regla concreta. La disciplina aplicada:

- `evidence_strength` describe la fuerza de la evidencia que respalda **esta regla específica** (no el perfil en general), derivada de la clasificación de fuentes citadas (`GUIDELINE`/`CONSENSUS` → tiende a `STRONG`; `SYSTEMATIC_REVIEW`/`META_ANALYSIS` → tiende a `MODERATE`-`STRONG`; solo `PRIMARY_STUDY` pequeño → `LIMITED`).
- `evidence_maturity` refleja el estado de resolución del gap de investigación del que procede (alineado con `PHASE3B_TARGETED_RESEARCH_v1.md`: `PARTIALLY_RESOLVED` → normalmente `MODERATE`; evidencia consistente de múltiples fuentes de alto nivel → `STRONG`).
- Ningún `safety_rule` fija un umbral numérico (mmHg, kg, repeticiones, distancia) salvo que la fuente citada lo defina explícitamente para ese contexto de uso — en este build, **ninguna regla fija un umbral numérico**, todas son de tipo cualitativo (evitar/adaptar/supervisar), consistente con que ninguna de las fuentes de Fase 3B-R validó un umbral operacionalizable para uso no supervisado.
- Cuando la evidencia encontrada no permite formalizar una regla (aunque exista evidencia relevante), se declara `NO_RULE_CREATED` con motivo explícito — ver `NUTRILONGX_EJERCICIO_PHASE3B_EVIDENCE_TO_RULE_MAPPING_v1.csv`.

### B.4 `content_maturity` y revisión humana (Safety Gate — ver sección D)

Todo `safety_rule` de este build nace `content_maturity: STRUCTURALLY_COMPLETE` como máximo, `review_status: PENDING_HUMAN_REVIEW`, `generated_via: AI_ASSISTED_SEED_CONTENT_v1` — misma disciplina que `LIBRARY_PILOT_v1.1`. Ninguna regla de seguridad generada por IA alcanza `SCIENTIFICALLY_REVIEWED` ni `PRODUCTION_READY` sin revisión humana real, sin excepción — el hecho de citar fuentes `GUIDELINE`/`SYSTEMATIC_REVIEW` no sustituye la revisión humana, solo la hace más eficiente.

---

## C. ANTI-DUPLICACIÓN — CÓMO SE EVITÓ REPETIR LA MISMA REGLA POR EJERCICIO

Ejemplo concreto: 12 de los 24 `EXERCISE` de `LIBRARY_PILOT_v1.1` tienen `valsalva_risk_relevant: true`. En vez de crear 12 objetos `safety_rule` idénticos (uno por `exercise_id`), se creó **1** objeto con `scope: attribute_selector`, `attribute_name: "valsalva_risk_relevant"`, `attribute_value: true` — aplica automáticamente a los 12 actuales y a cualquier futuro `EXERCISE`/`EXERCISE_VARIANT` que declare ese atributo, sin necesidad de mantenimiento manual. El mismo patrón se aplicó a `fall_risk_relevant`, `functional_requirement.requires_floor_transition`, `functional_requirement.requires_grip_strength` y `training_format`.

---

## D. SAFETY GATE — QUÉ NO CAMBIA SOLO PORQUE EXISTAN `safety_rule`

Un objeto **no alcanza `PRODUCTION_READY` por el mero hecho de que existan `safety_rule` que lo cubran**. El umbral `PRODUCTION_READY` de 11 criterios (`MASTER_SCHEMA_v1.2.md`, sección F) ya incluye QA39 (cross-check contra la matriz `RULE_REQUIRED`) como **una condición necesaria, no suficiente** — junto a ella siguen exigiéndose: revisión humana real (`review.reviewer`/`review.reviewed_at` no nulos), ausencia de `review_flags` críticos abiertos, multimedia poblada o `media_waiver` explícito, y secuencia de `content_maturity` completa (`DRAFT → STRUCTURALLY_COMPLETE → SCIENTIFICALLY_REVIEWED → PRODUCTION_READY`, nunca salto directo).

**Reafirmación explícita para esta fase**: la existencia de las 12 reglas de este build **no promueve automáticamente ningún objeto de `LIBRARY_PILOT_v1.1`** a `SCIENTIFICALLY_REVIEWED` ni `PRODUCTION_READY`. Los 24 `EXERCISE` + 20 `EXERCISE_VARIANT` permanecen exactamente en `STRUCTURALLY_COMPLETE`/`PENDING_HUMAN_REVIEW`, sin cambios — este build es aditivo (nuevos objetos `safety_rule`), no modifica ningún objeto existente del Library Pilot congelado.

---

## E. PERFILES CLÍNICOS — SIN CAMBIOS EN LA LISTA, `rule_inheritance` RESPETADO

Los 11 perfiles de `NUTRILONGX_EJERCICIO_SPEC_PHASE1_v1.md` (sección B.4) se mantienen sin alteración: `adulto_sano`, `obesidad`, `hta`, `dm2`, `dislipemia`, `edad_avanzada`, `fragilidad_sarcopenia`, `menopausia`, `oncologia`, `renal_leve_moderada`, `inmunosupresion`. Ninguna regla nueva se creó para `dislipemia` — su `rule_inheritance: GENERAL_CV` (ya definido en `MASTER_SCHEMA_v1.md` sección L) significa que hereda las reglas de estratificación cardiovascular general (regla R1 de este build, ver Build Report) sin necesitar una fila propia, tal como se instruyó explícitamente. `menopausia` e `inmunosupresion` conservan su `evidence_maturity` real (`MIXED`/`LIMITED`) — ninguna regla de este build les asigna certeza que la evidencia no respalda; `menopausia` recibe 1 regla (impacto alto, evidencia `MODERATE` específica de ese sub-aspecto), `inmunosupresion` no recibe ninguna regla nueva en este build (ninguno de los 6 gaps de Fase 3B-R la investigó).
