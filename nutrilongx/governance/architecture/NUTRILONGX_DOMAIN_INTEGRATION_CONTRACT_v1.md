# NUTRILONGX — Domain Integration Contract v1

Estado: `APPROVED` (contrato conceptual, no artefacto operacional).
Dominio: cross-domain (Gamification + Nutrition + Exercise).
Fecha: 2026-08-19.

Este documento formaliza el contrato de integración entre los 5 artefactos
canónicos ya `FROZEN`/`FROZEN_FOR_INTEGRATION`:

1. `nutrition/canonical/NUTRILONGX_ALIMENTACION_MASTER_v1.json`
2. `exercise/library/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json`
3. `exercise/safety/NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json`
4. `gamification/canonical/NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json`
5. `gamification/canonical/NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json`

**Ninguno de los 5 se ha modificado para producir este documento.** Este
contrato define entidades, relaciones y responsabilidades — no contenido
nuevo, no JSON operacional, no SQL, no código.

---

## 0. Principio de cierre

A partir de esta fase:

| Dominio | Estado |
|---|---|
| Gamification | `FROZEN_FOR_INTEGRATION` |
| Nutrition | `FROZEN_FOR_INTEGRATION` |
| Exercise | `FROZEN_FOR_INTEGRATION` |

`FROZEN_FOR_INTEGRATION` significa que la arquitectura es suficientemente
estable para diseñar backend, APIs, Supabase y consola. **No significa**:

- que Exercise sea `PRODUCTION_READY`;
- que la biblioteca de ejercicios esté completa (24/20 objetos, no un
  Exercise Master);
- que las 12 `safety_rules` hayan superado `HUMAN_REVIEW` (siguen
  `APPROVED_PENDING_HUMAN_REVIEW`);
- que `SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`/`BEHAVIOURAL_CONTENT`/
  `PRESCRIPTION`/`EXECUTION` final/Exercise Master completo existan — todos
  siguen `NOT_BUILT` o `NOT_PART_OF_CONTENT_MASTER`.

El contrato está diseñado para escalar sin romper semántica: 24 ejercicios →
100+, 58 recetas → 100+, 12 safety rules → más reglas, sin cambiar los IDs
canónicos ni la forma de las relaciones descritas aquí.

---

## 1. Cadena conceptual

```
CONTENT
  → BINDING
    → EVIDENCE
      → ACTION_LOG
        → GAMIFICATION ENGINE
          → DERIVED PROGRESS
```

Seis capas, cada una con una responsabilidad exclusiva. Ninguna capa puede
saltarse otra: un `ACTION_LOG` nunca se crea directamente desde `CONTENT`,
siempre pasa por `BINDING` + `EVIDENCE`.

---

## 2. Entidades conceptuales

### A. `CONTENT_ENTITY`

Cualquiera de:

- `RECIPE` (fuente real: `nutrition/canonical/NUTRILONGX_ALIMENTACION_MASTER_v1.json`, campo `recipes[]`)
- `EXERCISE` / `EXERCISE_VARIANT` (fuente real: `exercise/library/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json`, campos `exercise_library[]` / `exercise_variants[]`)
- `SESSION_TEMPLATE` — futuro, `NOT_BUILT`
- `PROGRAM_TEMPLATE` — futuro, `NOT_BUILT`
- `BEHAVIOURAL_CONTENT` — futuro, `PHASE3F_PENDING`
- `MIND_CONTENT` — ya existente en producción (`content_pieces`, `retos_insignia`, `infografias`, migración `0001`), fuera del alcance de este contrato salvo como precedente de patrón

**Regla**: la existencia de una `CONTENT_ENTITY` — que se vea, se abra, se
publique o se apruebe — **no implica que el usuario haya realizado nada**.
Contenido es catálogo, no evento.

### B. `CANONICAL_ACTION`

Proviene **exclusivamente** de `NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json`,
campo `actions[]`. Estructura real verificada:

```
canonical_action_id        (p.ej. "nutrition.mediterranean_pattern.legumbres_veces_sem")
canonical_domain           (movement | nutrition | mind | adherence)
canonical_subdomain
legacy_pillar / legacy_subpillar / legacy_ids   (trazabilidad al Excel v3)
level_variants[]:
  level, title, base_dvg_hours, base_dvg_days, message_user,
  legacy_id, status, review_flags, provenance
```

**No se duplica este catálogo en ninguna otra capa.** Cualquier componente
que necesite el valor de una acción (`base_dvg_hours`, `level`, dominio) lo
lee de aquí, nunca lo copia a una tabla propia como fuente de verdad.

### C. `CONTENT_ACTION_BINDING`

Relaciona `content_entity → canonical_action`. **Semántica ya aprobada y
congelada** (Decisión 3, `NUTRILONGX_ALIMENTACION_MASTER_SCHEMA_v1.md` §B.3),
observable hoy en producción real en `recipes[].gamification_bindings` del
Master (186 `supports`, 18 `candidate`, 3 `contextual_opposite`,
`unmapped`/`direct` declarados en `binding_semantics_reference` pero sin uso
actual en las 58 recetas):

| `binding_type` | Cuándo se asigna | Genera DVG | Recomendación positiva |
|---|---|---|---|
| `supports` | El evidence_tag del contenido describe directamente el mismo comportamiento que la acción canónica premia, sin ambigüedad | **No** | Sí, como explicación/navegación |
| `candidate` | Relación plausible pero el tag es más amplio que la acción, o falta un dato estructurado más fino | **No** | No |
| `contextual_opposite` | El contenido representa precisamente lo que la acción premia *reducir o evitar* | **No** | No — nunca como recomendación positiva |
| `unmapped` | No existe ninguna acción canónica razonablemente relacionada | **No** | No aplica |
| `direct` | Reservado — requeriría una acción canónica redefinida como "haz este contenido exacto". No usado hoy | No usado | No usado |

**Regla explícita, ya congelada en el schema de origen y reafirmada aquí
como contrato cross-dominio**: *el binding, en ninguno de sus 5 tipos,
genera DVG, crea `action_log`, acredita cumplimiento, ni cambia
estadísticas.* El DVG lo genera exclusivamente `action_logs` sobre la acción
real — nunca el binding.

Este mismo patrón (`binding_type` + `status` + `evidence_tag` + `provenance`)
es el que debe reutilizarse cuando se definan bindings `EXERCISE →
canonical_action` — no se diseña un mecanismo distinto para Ejercicio.

### D. `EXECUTION_EVIDENCE` (entidad nueva de este contrato)

Evidencia objetiva/estructurada de que el usuario realizó algo. Fuentes
futuras posibles (no se diseñan conectores concretos aquí): registro manual,
finalización de sesión, ejercicio registrado, pasos/actividad, alimentación
registrada, confirmación profesional, wearable, consola/Apps Script
autorizada.

Campos conceptuales que debe poder expresar (no es un esquema SQL):

```
evidence_id
user_id
source_type            (manual | session_completion | wearable | professional_confirmation | console | ...)
source_entity_type      (RECIPE | EXERCISE | EXERCISE_VARIANT | ...)
source_entity_id
occurred_at
quantity / value
unit
duration
intensity
metadata
provenance
deduplication_key
```

### E. `ACTION_LOG`

Registro canónico de una acción **realmente acreditada**. Debe referenciar:

```
user_id
canonical_action_id
level_variant_id (o variante aplicable dentro de level_variants[])
occurred_at
evidence_id / evidence_refs[]
base_dvg_hours       (copiado del level_variant en el momento del cálculo, no recalculado a mano)
engine_version
calculation_version
deduplication_key
status
provenance
```

**`action_log` es la única puerta de entrada al motor de gamificación.**
Ninguna otra entidad (content, binding, evidence por sí sola) puede invocar
el motor.

---

## 3. Regla fundamental de DVG (FROZEN)

```
RECIPE, EXERCISE, SESSION, PROGRAM, CONTENT
    → NO generan DVG por existir, verse, publicarse o completarse genéricamente.
```

El DVG solo se calcula a partir de un **`ACTION_LOG` validado**, construido
sobre:

```
CANONICAL_ACTION  +  LEVEL_VARIANT  +  EVIDENCE suficiente
```

y procesado exclusivamente por `NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1`.

Esta regla no es nueva: ya está congelada, en estos mismos términos, dentro
del propio `NUTRILONGX_ALIMENTACION_MASTER_SCHEMA_v1.md` para el caso
`RECIPE` ("No — nunca, en ningún tipo — el DVG lo genera `action_logs` sobre
la acción real, no el binding"). Este contrato la **extiende explícitamente**
a `EXERCISE`, `SESSION`, `PROGRAM` y cualquier `CONTENT` futuro.

---

## 4. Nutrition contract

```
RECIPE  →  supports/candidate/contextual_opposite/unmapped/direct  →  canonical_action nutrition.* | adherence.nutrition.*
```

Distinciones obligatorias:

- **"Usuario abre receta" ≠ acción realizada.** Ver la receta no crea
  evidencia ni acción.
- **"Usuario cocina receta" ≠ necesariamente acción canónica realizada.**
  Cocinar no equivale automáticamente a completar el comportamiento que
  premia la acción canónica (p. ej. "cocinar" no confirma "ración de legumbre
  añadida" sin evidencia estructurada).
- **"Usuario registra que consumió una ración" puede convertirse en
  `EXECUTION_EVIDENCE`**, pero solo genera `ACTION_LOG` si: existe un
  binding compatible (`supports`, nunca `contextual_opposite` como
  cumplimiento positivo), existe una `ACTION_ACCREDITATION_RULE` explícita
  (ver documento dedicado), se cumplen sus condiciones, y no hay
  duplicación.
- **`contextual_opposite` se mantiene intacto** para `RED_MEAT` y
  `ADDED_SUGAR` (y cualquier tag futuro equivalente): **nunca genera
  cumplimiento positivo**, en ningún escenario de integración.
- **`recipe_binding` ≠ elegibilidad clínica.** Un `binding_type: supports`
  no dice nada sobre si la receta es clínicamente apta para un perfil — esa
  es la responsabilidad de `observed_legacy_clinical_outputs` /
  `clinical_profiles_reference` (hoy `REFERENCED_NOT_RECOVERED` para la
  capa formal), nunca del binding de gamificación.

---

## 5. Exercise contract

Ejercicio queda `FROZEN_FOR_INTEGRATION`. Fuente actual: 24 `EXERCISE` + 20
`EXERCISE_VARIANT` (`exercise/library/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json`)
+ 12 `safety_rules` (`APPROVED_PENDING_HUMAN_REVIEW`, ver §6).

```
EXERCISE / EXERCISE_VARIANT  →  binding  →  canonical_action movement.* | adherence.movement.*
```

(`canonical_domain` observado en el catálogo real incluye tanto `movement`
como `adherence` con `canonical_subdomain: movement` — el binding debe
poder apuntar a cualquiera de los dos, según cuál sea la acción canónica
real, sin asumir un único dominio fijo.)

```
EXECUTION_EVIDENCE  →  acción acreditable (condicional)
```

Ejemplo conceptual (no regla fijada): `exercise.cardiorespiratory.caminata`
con `duration=30min, intensity=MODERATE` podría satisfacer una acción
distinta que la misma identidad de ejercicio con `duration=20min,
intensity=VIGOROUS` — **sin crear dos identidades `EXERCISE` distintas**. La
variación vive en la capa de acreditación (`ACTION_ACCREDITATION_RULE`), no
en el catálogo de contenido.

**No se fijan aquí las condiciones concretas** porque el catálogo canónico
actual no las define de forma suficiente para el dominio `movement` — se
marca `REQUIRES_ACCREDITATION_RULE_REVIEW` donde corresponda (ver documento
de acreditación).

Separación obligatoria: **identidad del ejercicio** (qué es, catálogo,
`EXERCISE`/`EXERCISE_VARIANT`) **≠ condiciones de acreditación de acción**
(cuánto/cómo hay que hacerlo para que cuente).

---

## 6. Future session/program contract

`SESSION_TEMPLATE` y `PROGRAM_TEMPLATE`: **`NOT_BUILT`**, pero el contrato
los prevé sin diseño de ruptura futura:

```
SESSION_TEMPLATE  = contenido reutilizable (como RECIPE o EXERCISE)
PROGRAM_TEMPLATE  = contenido reutilizable, compuesto de SESSION_TEMPLATE
PRESCRIPTION      = asignación individual futura (usuario ← programa/sesión)
EXECUTION         = lo realmente realizado
```

Solo `EXECUTION`/`EVIDENCE` puede alimentar `ACTION_LOG`. Regla explícita:

```
session_template.completed  → NUNCA genera DVG automáticamente
```

sin una `ACTION_ACCREDITATION_RULE` explícita que lo autorice — exactamente
la misma regla que ya rige para `RECIPE` y `EXERCISE`. No hay excepción de
diseño para contenido compuesto.

---

## 7. Safety contract

`NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json` (12 reglas, campos reales:
`safety_rule_id, target_entity_type, applies_to, clinical_profile_id,
safety_status, condition_trigger, recommendation_adaptation,
supervision_requirement, medical_clearance_required, evidence_strength,
evidence_maturity, review_status, content_maturity, ...`) participa en:

- **screening**
- **adaptation**
- **recommendation**
- **future prescription gating** (cuando exista `PRESCRIPTION`)

**Safety rules no calculan DVG.** No modifican retroactivamente un
`action_log` ya válido, salvo que una futura política de gobernanza lo
autorice explícitamente (no autorizada en este contrato).

Separación obligatoria, sin excepción:

```
SAFETY               ≠ GAMIFICATION
CLINICAL_ELIGIBILITY ≠ DVG_VALUE
```

Una condición clínica (`safety_status: PRECAUTION` / `ADAPTATION` /
`RELATIVE_CONTRAINDICATION`) **no aumenta ni reduce el DVG** de ninguna
acción por sí sola. Las 12 reglas siguen `APPROVED_PENDING_HUMAN_REVIEW` —
**no se usan como automatización clínica `PRODUCTION_READY`** en ningún
punto de este contrato.

---

## 8. Deduplicación (principio, no algoritmo)

Ejemplo de riesgo: una caminata de 30 min puede registrarse por wearable +
por sesión de app + por marca manual del usuario → **nunca deben producir 3
`action_logs` equivalentes**.

Conceptos que el contrato reconoce (sin fijar algoritmo final):

```
deduplication_key   — identificador determinista derivado de (user_id, canonical_action_id, ventana temporal, fuente relevante)
evidence_group      — conjunto de EXECUTION_EVIDENCE que podrían representar el mismo evento real
canonical_action     — la deduplicación ocurre siempre dentro del alcance de una única acción canónica
time_window          — ventana de agregación/tolerancia
```

La deduplicación es responsabilidad de la capa `EVIDENCE → ACTION_LOG`
(vía `ACTION_ACCREDITATION_RULE`), nunca del motor de gamificación ni del
contenido.

---

## 9. Engine input/output contract

**Input** (por `action_log` procesado):

```
user_id, canonical_action_id, level_variant, base_dvg_hours, occurred_at,
action_log_id, engine_context, streak_context, weekly_context
```

**Output**, siguiendo el `calculation_order` ya congelado en
`NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.active.calculation_order`
(7 pasos reales: `base_dvg → streaks → boosters → combos_flat → daily_caps →
weekly_multipliers → weekly_cap`):

```
base_dvg_hours, streak_adjustment, booster_adjustment, combo_adjustment,
daily_cap_adjustment, weekly_multiplier, weekly_cap_adjustment,
final_dvg_hours, final_dvg_days, engine_version, calculation_trace
```

El `calculation_trace` debe permitir reproducir el resultado paso a paso
contra el `calculation_order` documentado — el cálculo debe ser
**reproducible**, nunca una caja negra.

---

## 10. Derived progress

`DVG`, `levels`, `streaks`, `badges`, `stats` son **estado derivado**, no
fuente primaria de verdad. La fuente primaria es siempre `action_logs`.

Si el motor se recalcula (nueva versión del engine, corrección de un log),
el estado derivado debe poder reconstruirse por completo desde
`action_logs` mediante un contrato conceptual `rebuild_progress(user_id)` —
**no se implementa aquí**, solo se deja previsto para que el diseño de
backend no acople irreversiblemente el progreso mostrado al usuario con el
cálculo que lo produjo.

---

## 11. Console / Apps Script contract

Existe un flujo de trabajo paralelo desarrollando una consola/dashboard
administrativo vía Apps Script. Reglas de frontera, sin excepción:

- **Apps Script NO debe contener el motor canónico** (no reimplementa
  `calculation_order`, `base_dvg`, streaks, boosters, combos, caps).
- **Apps Script NO debe redefinir DVG** (no calcula `base_dvg_hours` por su
  cuenta; lo lee de `NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1`).
- **Apps Script NO debe duplicar `safety_rules`** (no reimplementa
  `condition_trigger`/`recommendation_adaptation`; los consulta).
- **Apps Script debe llamar una capa de funciones/API** que use las fuentes
  canónicas como única autoridad.

Catálogo conceptual de funciones que la consola podrá invocar en el futuro
(namespacing por dominio funcional, no nombres de endpoint finales):

```
content.*        — create/update/publish/unpublish/approve/reject content
bindings.*        — create/list bindings content_entity → canonical_action
evidence.*        — register evidence
actions.*         — request action accreditation, read canonical action catalog
gamification.*    — invoke engine (solo vía action_log), read calculation_trace
progress.*         — read derived progress, request rebuild_progress
safety.*           — inspect safety warnings / evaluate safety context
admin.*            — operaciones administrativas generales
```

No se implementa Apps Script en este documento.

---

## 12. API contract (conceptual)

Delimitación de responsabilidades, sin tecnología ni SQL fijados:

```
GET  /api/canonical/actions
GET  /api/content/recipes
GET  /api/content/exercises

POST /api/evidence
POST /api/actions/accredit
GET  /api/progress
GET  /api/safety/evaluate

POST /api/admin/...
```

Cada verbo respeta la cadena §1: nada escribe `action_log` sin pasar antes
por `evidence` + una regla de acreditación válida.

---

## 13. Forward compatibility (no construir Session/Program ahora)

`FROZEN_FOR_INTEGRATION` significa explícitamente que **no es necesario
construir `SESSION_TEMPLATE`/`PROGRAM_TEMPLATE` para empezar la integración
de backend**. El contrato de entidades (§2.A, §6) ya reserva su lugar en la
cadena `CONTENT → BINDING → EVIDENCE → ACTION_LOG` sin necesidad de romper
nada cuando se construyan: seguirán el mismo patrón de `binding_type` y
`ACTION_ACCREDITATION_RULE` que `RECIPE` y `EXERCISE` usan hoy.

Esta compatibilidad hacia delante se documenta aquí explícitamente para que
ningún diseño de backend futuro asuma que solo existen `RECIPE` y
`EXERCISE`/`EXERCISE_VARIANT` como tipos de `content_entity`.
