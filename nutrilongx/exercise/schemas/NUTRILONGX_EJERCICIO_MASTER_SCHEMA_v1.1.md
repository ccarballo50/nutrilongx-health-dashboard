# NUTRILONGX — Ejercicio: Master Schema v1.1 (Hardening de gobernanza)

Fecha: 2026-08-18. Parte de `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.0.md` (aprobado, `READY_FOR_EXERCISE_MASTER_SCHEMA_REVIEW`). Preserva íntegras todas las decisiones ya aprobadas en Fase 1 y Fase 2. Introduce exclusivamente los 4 ajustes de gobernanza solicitados (A–D). No genera `NUTRILONGX_EJERCICIO_MASTER_v1.json`, ni `SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`/`PRESCRIPTION`/`EXECUTION` reales, ni SQL, ni frontend. `CANONICAL v1.0` y `NUTRILONGX_ALIMENTACION_MASTER_v1.json` permanecen `FROZEN`, no tocados.

Los cambios respecto a v1.0 están marcados `[v1.1]` inline. Todo lo no marcado es idéntico a v1.0 en sustancia.

---

## A. METADATA / VERSIONING

```json
{
  "schema": "NUTRILONGX_EJERCICIO_MASTER_v1",
  "schema_doc_version": "1.1.0",
  "generated_at": null,
  "status": "SCHEMA_APPROVED_NOT_YET_BUILT",
  "spec_lineage": [
    "NUTRILONGX_EJERCICIO_SPEC_PHASE1_v1.md (APPROVED_WITH_GOVERNANCE_DECISIONS)",
    "NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.0.md (READY_FOR_EXERCISE_MASTER_SCHEMA_REVIEW)",
    "NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.1.md — hardening: scientific_provenance, target_profile_hint guardrails, content_maturity, QA24-30"
  ],
  "change_log": [
    {"version": "1.1.0", "changes": ["scientific_provenance distinto de review_status", "target_profile_hint restringido explícitamente", "eje content_maturity introducido", "QA ampliado de 23 a 30 obligatorias + 3 propuestas"]}
  ]
}
```

*(Secciones B, C, D, I, K, L, M, N, Q, R, S, U, V: sin cambios de sustancia respecto a v1.0 — se resumen aquí por referencia y se listan íntegras solo donde el hardening las afecta. El documento completo de v1.0 sigue vigente para estas secciones; no se reproduce cada tabla para evitar duplicar contenido ya aprobado sin cambios.)*

---

## A.1 [v1.1] PROVENANCE CIENTÍFICA — no confundir con `review_status`

**Problema identificado**: en v1.0, `provenance.review_status: PENDING_HUMAN_REVIEW` podía leerse implícitamente como "aún no necesita fuente". Eso es incorrecto y se corrige aquí de forma estructural, no solo documental.

### A.1.1 Categorías de contenido (`content_category`)

Toda afirmación dentro de un `EXERCISE`/`EXERCISE_VARIANT`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE` se clasifica en una de 6 categorías:

| # | `content_category` | Ejemplo |
|---|---|---|
| 1 | `EDITORIAL_DESCRIPTIVE` | Nombre del ejercicio, descripción general, título |
| 2 | `TECHNIQUE_CLAIM` | Instrucciones de ejecución, cues técnicos |
| 3 | `DOSAGE_FITT_VP` | Series/reps/duración/intensidad orientativos |
| 4 | `PROGRESSION_CLAIM` | Relación regresión/progresión entre variantes |
| 5 | `CLINICAL_BENEFIT_CLAIM` | Cualquier afirmación de beneficio para salud/condición clínica |
| 6 | `SAFETY_CONTRAINDICATION_ADAPTATION` | Contraindicación, precaución, adaptación |

### A.1.2 Estado de fuente (`source_status`)

`source_status` ∈ `{SOURCE_BACKED, EDITORIAL_CONTENT, SOURCE_NOT_IDENTIFIED, NOT_APPLICABLE}`.

- `SOURCE_BACKED`: la afirmación es trazable a `source_ids` reales del catálogo (sección B de v1.0), y esos `source_ids` efectivamente sustentan **esa afirmación concreta**, no solo el dominio general. Regla explícita: **no se inventa una fuente para un movimiento convencional si la fuente científica no define ese ejercicio concreto** — p.ej. citar `ACSM_GETP11` para justificar la existencia de "sentadilla goblet" es inválido; `ACSM_GETP11` respalda dosis general de fuerza, no la técnica de un ejercicio específico no mencionado en el texto.
- `EDITORIAL_CONTENT`: contenido descriptivo/técnico razonable sin necesidad de cita científica (p.ej. cómo describir verbalmente un movimiento biomecánicamente estándar) — válido para categorías 1–2, **nunca** para 3–6.
- `SOURCE_NOT_IDENTIFIED`: se buscó y no se encontró fuente aplicable — estado honesto, no bloquea `DRAFT`/`STRUCTURALLY_COMPLETE`, pero bloquea el ascenso a `SCIENTIFICALLY_REVIEWED`/`PRODUCTION_READY` para categorías 3–6 (ver A.3).
- `NOT_APPLICABLE`: la categoría no aplica a este objeto (p.ej. un `EXERCISE` sin ninguna afirmación de beneficio clínico explícita no necesita entrada `CLINICAL_BENEFIT_CLAIM`).

### A.1.3 Estructura `scientific_provenance` (nuevo campo, reemplaza la suposición implícita de v1.0)

```json
{
  "scientific_provenance": [
    {"content_category": "EDITORIAL_DESCRIPTIVE", "source_status": "NOT_APPLICABLE", "source_ids": [], "note": null},
    {"content_category": "TECHNIQUE_CLAIM", "source_status": "EDITORIAL_CONTENT", "source_ids": [], "note": "descripción de ejecución estándar, sin afirmación de eficacia"},
    {"content_category": "DOSAGE_FITT_VP", "source_status": "SOURCE_BACKED", "source_ids": ["ACSM_GETP11"], "note": "rango de series/reps general de fuerza, no específico del ejercicio"},
    {"content_category": "PROGRESSION_CLAIM", "source_status": "SOURCE_BACKED", "source_ids": ["KRAEMER2002_RATAMESS", "NASM_OPT"]},
    {"content_category": "CLINICAL_BENEFIT_CLAIM", "source_status": "NOT_APPLICABLE", "source_ids": []},
    {"content_category": "SAFETY_CONTRAINDICATION_ADAPTATION", "source_status": "SOURCE_NOT_IDENTIFIED", "source_ids": [], "note": "pendiente Fase 3B — ver Safety Coverage Plan"}
  ]
}
```

Este array es **independiente** de `provenance.review_status` (workflow de revisión humana, sección A.2) y de `content_maturity` (sección A.3). `review_status: PENDING_HUMAN_REVIEW` nunca se acepta como sustituto de una entrada `scientific_provenance` ausente o incompleta.

### A.1.4 Regla de trazabilidad obligatoria

Toda afirmación de categorías 3–6 (`DOSAGE_FITT_VP`, `PROGRESSION_CLAIM`, `CLINICAL_BENEFIT_CLAIM`, `SAFETY_CONTRAINDICATION_ADAPTATION`) debe ser trazable a `source_ids` **cuando se incorpore al Master** con `content_maturity ≥ SCIENTIFICALLY_REVIEWED` (ver A.3). En `DRAFT`/`STRUCTURALLY_COMPLETE` puede existir con `source_status: SOURCE_NOT_IDENTIFIED`, documentando honestamente el gap en vez de bloquear la creación del borrador.

---

## A.2 `review_status` (workflow de revisión — sin cambios de fondo respecto a v1.0, ahora explícitamente desacoplado)

```json
{"review_status": "PENDING_HUMAN_REVIEW", "reviewer": null, "reviewed_at": null, "review_flags": []}
```

`review_status` mide **si un humano ha revisado el objeto**, no si el contenido tiene fuente científica. Ambos ejes son ortogonales — un objeto puede estar `HUMAN_REVIEWED_APPROVED` en cuanto a redacción/estructura y aun así tener `scientific_provenance` con `SOURCE_NOT_IDENTIFIED` en una categoría 3–6 pendiente de investigación (Fase 3B).

---

## A.3 [v1.1] CONTENT MATURITY — nuevo eje ortogonal

`content_maturity` ∈ `{DRAFT, STRUCTURALLY_COMPLETE, SCIENTIFICALLY_REVIEWED, PRODUCTION_READY}`. Ortogonal a `review_status`, a `safety_state` (K), a elegibilidad clínica (L) y a `evidence_maturity` (B/L) — ninguno de esos campos implica ni sustituye a `content_maturity`.

### A.3.1 Requisitos mínimos de transición

| Estado | Requisito mínimo para entrar en este estado |
|---|---|
| `DRAFT` | Estado inicial por defecto. Puede contener campos vacíos, `scientific_provenance` incompleto, gaps conocidos y documentados. |
| `STRUCTURALLY_COMPLETE` | Todos los campos obligatorios del esquema (secciones E–H) presentes; todos los valores de vocabularios controlados (D) son válidos; `scientific_provenance` tiene una entrada por cada `content_category` aplicable (aunque su `source_status` sea `SOURCE_NOT_IDENTIFIED`). Chequeo puramente estructural, sin validación de calidad científica. |
| `SCIENTIFICALLY_REVIEWED` | Además de lo anterior: toda entrada `scientific_provenance` con `content_category` ∈ {3,4,5,6} tiene `source_status == SOURCE_BACKED` con `source_ids` no vacío, **o** está explícita y deliberadamente marcada `NOT_APPLICABLE` con justificación en `note`. Un revisor humano cualificado (`reviewer` no nulo, `reviewed_at` no nulo) ha verificado específicamente esta trazabilidad — no basta con revisión editorial general. |
| `PRODUCTION_READY` | Además de `SCIENTIFICALLY_REVIEWED`: `review_status == HUMAN_REVIEWED_APPROVED`; batería QA completa (sección T) superada; mínimos de multimedia/técnica/seguridad definidos para producción presentes (umbral exacto a definir en Fase 3E — aquí solo se señala el requisito, no se fijan valores concretos todavía). |

### A.3.2 Regla explícita

Ningún contenido generado directamente por `AI_ASSISTED_SEED_CONTENT_v1` puede alcanzar `SCIENTIFICALLY_REVIEWED` ni `PRODUCTION_READY` sin un evento de revisión humana registrado posterior (`reviewer` y `reviewed_at` poblados) — un objeto recién generado por IA nace, como máximo, en `STRUCTURALLY_COMPLETE`.

---

## B. [v1.1] TARGET_PROFILE_HINT — restricción explícita

`target_profile_hint` (introducido en v1.0, sección G) se mantiene **exclusivamente como metadata editorial** de una `SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`. Queda **explícitamente prohibido** usarlo como:

- regla de elegibilidad de usuario;
- regla clínica de ningún tipo;
- sustituto de `clinical_profile_id` (sección L);
- sustituto de `safety_rule` (sección K);
- contraindicación, precaución o adaptación de ningún tipo;
- autorización automática de una `PRESCRIPTION` (sección Q).

```json
{
  "target_profile_hint": "GENERAL_HEALTHY_ADULT",
  "target_profile_hint_disclaimer": "editorial_only — no constituye regla de elegibilidad, clínica ni de seguridad; ver safety_model (K) y clinical_profiles (L) para cualquier decisión de personalización"
}
```

Se añade el campo `target_profile_hint_disclaimer` como recordatorio estructural en el propio esquema, y la restricción se refuerza con `QA24` (sección T).

---

## E–H. [v1.1] Actualización de forma en `EXERCISE`/`EXERCISE_VARIANT`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`

Los 4 esquemas de v1.0 (secciones E, F, G, H) se mantienen sin cambios en sus campos de contenido (dominio, atributos, FITT-VP, etc.). El bloque `provenance` de cada uno se **reemplaza** por la combinación de los tres ejes ahora explícitos:

```json
{
  "scientific_provenance": [ "... ver A.1.3 ..." ],
  "review": {"review_status": "PENDING_HUMAN_REVIEW", "reviewer": null, "reviewed_at": null, "review_flags": []},
  "content_maturity": "DRAFT",
  "created_at": null,
  "last_modified_at": null,
  "generated_via": "AI_ASSISTED_SEED_CONTENT_v1"
}
```

Esto sustituye al bloque `provenance` plano de v1.0 (que mezclaba `source_ids` + `review_status` en un solo objeto, precisamente la conflación que este hardening corrige).

---

## T. [v1.1] QA — de 23 a 30 validaciones obligatorias + 3 propuestas

### T.1 Las 23 validaciones de v1.0 se mantienen íntegras, con la siguiente corrección:

**QA1 [v1.1, reemplaza a QA1 de v1.0]**: Todo `EXERCISE` tiene un array `scientific_provenance` no vacío. Para cada entrada con `content_category` ∈ {`DOSAGE_FITT_VP`, `PROGRESSION_CLAIM`, `CLINICAL_BENEFIT_CLAIM`, `SAFETY_CONTRAINDICATION_ADAPTATION`}: si `source_status == SOURCE_BACKED`, entonces `source_ids` no vacío. `source_status == SOURCE_NOT_IDENTIFIED` es válido en `content_maturity` `DRAFT`/`STRUCTURALLY_COMPLETE` pero bloquea el ascenso a `SCIENTIFICALLY_REVIEWED`/`PRODUCTION_READY` (ver QA29/QA30). **`review_status` nunca se acepta como sustituto de esta validación** — chequeo explícito de que ambos campos son independientes.

*(QA2–QA23 de v1.0 se mantienen sin cambios de fondo — mismas 22 validaciones restantes, ahora referenciando `review.review_status` en vez de `provenance.review_status` donde aplique, por el cambio de forma de la sección E–H.)*

### T.2 [v1.1] Nuevas validaciones obligatorias

- **QA24**: `target_profile_hint` nunca participa en ninguna evaluación de seguridad o elegibilidad — chequeo estructural: ningún `safety_rule.applies_to` ni ningún criterio de `clinical_profile` referencia `target_profile_hint` como condición.
- **QA25**: Todo objeto (`EXERCISE`/`EXERCISE_VARIANT`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`) tiene `content_maturity` con un valor válido del vocabulario de 4 estados — campo nunca ausente.
- **QA26**: Ningún objeto con `review.review_status == PENDING_HUMAN_REVIEW` tiene `content_maturity == PRODUCTION_READY`.
- **QA27**: Ningún objeto con `review.review_status == HUMAN_REVIEWED_REJECTED` tiene `content_maturity == PRODUCTION_READY`.
- **QA28**: Toda `safety_rule` con `state` distinto de `NOT_ASSESSED` tiene `scientific_provenance`-equivalente propio (su `rationale_source_ids`, ya exigido en K de v1.0) no vacío — reafirmado aquí como parte del mismo principio de trazabilidad, no como regla nueva independiente.
- **QA29**: Toda afirmación de `content_category` ∈ {`DOSAGE_FITT_VP`, `PROGRESSION_CLAIM`, `CLINICAL_BENEFIT_CLAIM`} presente en un objeto con `content_maturity ≥ SCIENTIFICALLY_REVIEWED` tiene `source_status == SOURCE_BACKED` y `source_ids` no vacío — sin excepciones.
- **QA30**: Ningún elemento con `generated_via == AI_ASSISTED_SEED_CONTENT_v1` alcanza `content_maturity` `SCIENTIFICALLY_REVIEWED` o `PRODUCTION_READY` sin `review.reviewer` y `review.reviewed_at` poblados (registro de revisión humana posterior a la generación).

### T.3 [v1.1] Invariantes propuestos — NO obligatorios todavía, requieren ratificación de César

Se detectaron durante este hardening tres invariantes adicionales razonables, que se proponen por separado en vez de incorporarlos silenciosamente a la lista obligatoria:

- **QA31 (propuesto)**: `scientific_provenance` debe cubrir explícitamente las 6 categorías (aunque sea con `NOT_APPLICABLE`) — no basta con que el array no esté vacío; debe tener exactamente una entrada por categoría. *Justificación*: evita que una categoría relevante (p.ej. `SAFETY_CONTRAINDICATION_ADAPTATION`) quede omitida por descuido en vez de marcada `NOT_APPLICABLE` conscientemente.
- **QA32 (propuesto)**: `content_maturity` nunca retrocede (p.ej. `PRODUCTION_READY` → `DRAFT`) sin una entrada de `change_log` explícita justificando el retroceso. *Justificación*: integridad de datos ante ediciones futuras del catálogo — un retroceso silencioso podría ocultar una regresión de calidad no intencionada.
- **QA33 (propuesto)**: Toda `safety_rule` con `state` ∈ {`ABSOLUTE_CONTRAINDICATION`, `RELATIVE_CONTRAINDICATION`} tiene `stop_criteria` no vacío, o una justificación explícita de por qué no aplica. *Justificación*: estos dos estados son los de mayor criticidad de seguridad; dejar `stop_criteria` vacío sin justificar es el tipo de omisión silenciosa que este documento busca prevenir en general.

---

## RESTO DE SECCIONES (C, D, I, J, K, L, M, N, O, P, Q, R, S, U, V)

Sin cambios de sustancia respecto a `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.0.md` — permanecen vigentes tal como se aprobaron, incorporando únicamente el cambio de forma en el bloque de provenance descrito en la sección E–H de este documento (que sustituye, en cualquier sección que lo referencie — p.ej. K.2 `safety_rule`, O.2 `gamification_binding` — el antiguo campo `status: "DEFINITION_NOT_PROVIDED_FINAL"` por la combinación `scientific_provenance` + `content_maturity` cuando ese objeto tenga forma de contenido versionable; `safety_rule` y `gamification_binding` mantienen además su propio `status`/`rationale_source_ids` ya definidos en v1.0, ahora consistentes con el principio de A.1).

---

## FINAL STATUS DE ESTE DOCUMENTO

```
SCHEMA_HARDENING_APPROVED_PENDING_FINAL_CONFIRMATION
```

(Ver `NUTRILONGX_EJERCICIO_PHASE2_TO_3_CHANGELOG_v1.md` para el status final consolidado de todo el cierre de Fase 2 + preparación de Fase 3A.)
