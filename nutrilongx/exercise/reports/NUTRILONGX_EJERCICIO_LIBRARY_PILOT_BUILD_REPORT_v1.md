# NUTRILONGX — Ejercicio: Build Report — Library Pilot v1 (Fase 3A REAL)

Fecha: 2026-08-18. Reporta la construcción real de `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.json` — primer dataset real de contenido `EXERCISE`/`EXERCISE_VARIANT` de NUTRILONGX Ejercicio. **No es** `NUTRILONGX_EJERCICIO_MASTER_v1.json`. `CANONICAL v1.0` y `NUTRILONGX_ALIMENTACION_MASTER_v1.json` permanecen `FROZEN`, no tocados. No se ha escrito SQL, ni tocado Supabase/GitHub/Vercel/frontend.

---

## 1. ALCANCE DEL DOCUMENTO

`NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.json` contiene únicamente dos arrays de nivel superior, `exercise_library` y `exercise_variants`, más referencias de vocabulario y metadatos de documento. **No existen las claves** `session_templates`, `program_templates`, `behavioural_content`, `prescription` ni `execution` en el documento — ni siquiera como arrays vacíos. Esto es intencional: el documento no debe implicar silenciosamente que esas capas ya existen.

---

## 2. RECUENTOS FINALES

| Tipo | Cantidad |
|---|---|
| `EXERCISE` base | **25** |
| `EXERCISE_VARIANT` | **20** |
| Total de objetos de contenido | **45** |

Distribución de `EXERCISE` por `primary_domain`: CARDIORESPIRATORY 9, RESISTANCE 12, NEUROMOTOR 3, FLEXIBILITY 1.

Distribución de `EXERCISE_VARIANT` por `relationship_type`: REGRESSION 11, PROGRESSION 6, LOAD_VARIANT 2, TECHNICAL_VARIANT 1 (la fusión de #39).

---

## 3. TRAZABILIDAD DESDE LAS 40 CANDIDATAS ORIGINALES

Partiendo de las 40 candidatas auditadas en el Entity Purity Pass (`ENTITY_CLASSIFICATION_v1.md` / `PHASE3A_PILOT_PLAN_v1.1.md`, 26 `EXERCISE` retenidas incl. #39):

- Se retiran del recuento de `EXERCISE` base: **#39** (fusionado como `EXERCISE_VARIANT` `TECHNICAL_VARIANT` de #14, conservando su propia `provenance_trace`), **#30 y #31** (`OTHER_REQUIRES_DECISION`, sin resolver — ver sección 6 de `NUTRILONGX_EJERCICIO_PHASE3A_TO_3B_CHANGELOG_v1.md`), todos los `SESSION_TEMPLATE` (7) y todos los `BEHAVIOURAL_CONTENT` (5).
- Resultado: **26 candidatas `EXERCISE` − 1 (fusión #39) = 25 `EXERCISE` base**, exactamente como se instruyó.

Cada objeto `EXERCISE` y `EXERCISE_VARIANT` incluye un bloque `provenance_trace` con `original_candidate_number`, `candidate_name` y `transformation_notes`. Para #39 el `transformation_notes` documenta explícitamente la fusión aprobada. Los 19 variantes restantes (sin número de candidata original, `original_candidate_number: null`) documentan que son regresiones/progresiones/variantes de carga nuevas, justificadas biomecánicamente, no derivadas de una candidata numerada de las 40 originales.

---

## 4. DECISIÓN DE DISEÑO NO EXPLÍCITAMENTE PEDIDA — 11 FAMILIAS SIN VARIANTES

El encargo pedía variantes "solo donde estén biomecánica/funcionalmente justificadas" y "0, 1, 2 o más — nunca forzadas a 3". Al construir, decidí unilateralmente que las **9 familias `CARDIORESPIRATORY` continuas** (caminata en sus 3 formas, trote, ciclismo, natación, remo en ergómetro, nordic walking, baile recreativo) reciban **0 `EXERCISE_VARIANT`**, más 2 familias adicionales (`movilidad_cadera_dirigida`, `marcha_en_tandem`).

**Razonamiento**: las diferencias entre, por ejemplo, "caminata a ritmo moderado" (#1) y "caminata vigorosa" (#2) son diferencias de intensidad/duración — es decir, de dosis (FITT-VP), no de patrón biomecánico. Ya está establecido en el esquema (Fase 2, decisión de gobernanza) que `training_intensity` nunca vive a nivel `EXERCISE`, sino a nivel de sesión/prescripción. Crear un `EXERCISE_VARIANT` "caminata vigorosa" de "caminata moderada" habría mezclado una variable de dosis dentro de la capa de contenido, violando esa misma separación. Por eso #1 y #2 ya están representadas como dos `EXERCISE` base independientes (correcto, según el Entity Purity Pass), y ninguna de las 9 familias cardiorrespiratorias continuas recibe variantes adicionales — sus regresiones/progresiones reales (p.ej. "caminar con apoyo" vs. "caminar sin apoyo") no estaban en el alcance de estas 9 candidatas tal como fueron definidas originalmente.

Esta decisión **no fue pedida explícitamente en estos términos** por César; se presenta aquí para revisión, no como un hecho consumado. Si se considera que alguna de estas familias sí merece un `EXERCISE_VARIANT` real (p.ej. una regresión de "trote suave" a "caminata-trote intervalada" para deconditioned users), puede añadirse en una iteración posterior sin romper la estructura existente.

`marcha_en_tandem` y `movilidad_cadera_dirigida` se dejaron sin variantes por falta de una regresión/progresión biomecánicamente distinta y suficientemente justificada en esta pasada — no por policy, sino por conservadurismo de contenido (evitar inventar variantes sin base clara).

---

## 5. DISCIPLINA DE `scientific_provenance` APLICADA

Cada uno de los 45 objetos tiene las 6 `content_category` del esquema v1.2. Reglas aplicadas consistentemente:

- **`DOSAGE_FITT_VP`**: `SOURCE_BACKED` en `ACSM_GETP11` por defecto — el marco general de dosis orientativa está respaldado; la nota aclara explícitamente que la fuente no define esta variante/ejercicio concreto en su forma exacta.
- **`TECHNIQUE_CLAIM`**: `EDITORIAL_CONTENT` por defecto — descripción de ejecución biomecánica estándar, sin afirmación de eficacia específica atribuida a una fuente.
- **`PROGRESSION_CLAIM`**: `SOURCE_BACKED` (Kraemer & Ratamess 2002, NASM OPT) **solo** en `EXERCISE` que efectivamente tienen ≥1 `EXERCISE_VARIANT`, y en los `EXERCISE_VARIANT` cuyo `relationship_type` es `REGRESSION` o `PROGRESSION` — nunca en `LOAD_VARIANT` ni `TECHNICAL_VARIANT`, porque esas relaciones no son afirmaciones de progresión/regresión validadas por la fuente. En todos los casos la nota aclara explícitamente: "el marco general está respaldado; esta variante concreta no está definida por la fuente" — evitando citar una guía general de fuerza como si validara la técnica específica de una variante concreta.
- **`SAFETY_CONTRAINDICATION_ADAPTATION`**: `SOURCE_NOT_IDENTIFIED` por defecto en todos los 45 objetos — ningún `safety_rule` real se genera en esta fase; la nota indica explícitamente que está pendiente de Fase 3B/3B-R. Esto es deliberado y honesto: ningún objeto afirma tener respaldo de seguridad que no tiene.
- **`CLINICAL_BENEFIT_CLAIM`** y **`EDITORIAL_DESCRIPTIVE`**: `NOT_APPLICABLE` por defecto — no se afirma beneficio clínico específico ni se usa contenido puramente editorial sin categoría propia en este build.

---

## 6. ATRIBUTOS DE CRIBADO (v1.2) — APLICADOS COMO DESCRIPTIVOS, NO COMO REGLAS

`impact_level`, `balance_requirement_level`, `fall_risk_relevant`, `valsalva_risk_relevant` se aplicaron a los 45 objetos como juicio editorial descriptivo basado en la biomecánica del movimiento (p.ej. zancadas = impacto MODERATE, equilibrio HIGH, riesgo de caída relevante = true; plancha isométrica = valsalva_risk_relevant = true por el patrón de esfuerzo isométrico). **Ninguno de estos valores genera automáticamente una regla clínica**: no existe ningún `safety_rule` en este documento, y ningún campo infiere contraindicación (p.ej. `fall_risk_relevant: true` no implica "contraindicado en frágiles"; `valsalva_risk_relevant: true` no implica "prohibido en HTA"). Esa inferencia clínica queda explícitamente para Fase 3B, con investigación real como base.

`load_intensity_band` e `isometric_effort_level` (atributos de `SESSION_TEMPLATE`, dependientes de prescripción) **no aparecen en ningún objeto `EXERCISE` ni `EXERCISE_VARIANT`** de este documento — verificado por QA16/QA17.

---

## 7. RESULTADOS DE QA

Script `qa_pilot.py` ejecutado sobre el JSON final: **42 PASS, 0 FAIL, 10 NOT_APPLICABLE** (52 checks totales: QA1–QA31 aplicables del esquema v1.2 + QA32–QA40 y checks de `safety_rule`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`/binding de gamificación/`PRESCRIPTION`-`EXECUTION` reportados honestamente como `NOT_APPLICABLE` porque esas entidades no existen en este pilot por diseño — nunca como `PASS` ficticio, más los 11 checks específicos de este piloto A–K).

Checks pilot-específicos A–K: **11/11 PASS**, incluyendo verificación explícita de: 25 IDs únicos en la librería base; ausencia de #39 como base; presencia de #39 exactamente una vez como variante de #14; ausencia de #30/#31; ausencia de `BEHAVIOURAL_CONTENT`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`; ausencia de `user_id`/`prescription`/`execution`; todos los objetos generados en este build ≤ `STRUCTURALLY_COMPLETE`; cero IDs duplicados; cero referencias `variant→base` huérfanas.

---

## 8. LO QUE ESTE DOCUMENTO NO CONTIENE (por diseño)

- Ningún `SESSION_TEMPLATE`, `PROGRAM_TEMPLATE` ni `BEHAVIOURAL_CONTENT`.
- Ningún `safety_rule` real — solo atributos de cribado descriptivos.
- Ninguna `PRESCRIPTION` ni `EXECUTION` — ni datos personales, ni `user_id`.
- Ningún `content_maturity` superior a `STRUCTURALLY_COMPLETE`.
- Ninguna aprobación humana masiva — los 45 objetos están `PENDING_HUMAN_REVIEW`.
- Ninguna imagen/video generado — estructura `media` en `NO_SOURCE_PROVIDED` en los 45 objetos.

---

## FINAL STATUS

```
VALID_WITH_RESEARCH_GAPS
```

El dataset es estructuralmente válido (0 fallos de QA) y consistente con la gobernanza aprobada. Se marca `VALID_WITH_RESEARCH_GAPS`, no `VALID` sin calificar, porque persisten gaps de investigación dirigida (ver `NUTRILONGX_EJERCICIO_PHASE3B_TARGETED_RESEARCH_v1.md`): ninguna categoría `SAFETY_CONTRAINDICATION_ADAPTATION` tiene aún `SOURCE_BACKED`, y la decisión de diseño de la sección 4 (11 familias sin variante) queda pendiente de confirmación explícita de César.

No se ha generado ningún `safety_rule`. No se ha tocado `CANONICAL v1.0` ni `NUTRILONGX_ALIMENTACION_MASTER_v1.json`. No se ha escrito SQL ni tocado Supabase/GitHub/Vercel/frontend.
