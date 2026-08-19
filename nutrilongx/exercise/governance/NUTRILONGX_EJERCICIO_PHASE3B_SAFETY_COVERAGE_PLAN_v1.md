# NUTRILONGX — Ejercicio: Plan de Cobertura de Seguridad Fase 3B (previo a `safety_rule`)

Fecha: 2026-08-18. **Esta matriz NO es todavía una `safety_rule`** (estructura definida en `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.1.md`, sección K). No convierte ausencia de regla en `SAFE`, no infiere contraindicación. Su único objetivo es determinar **dónde habrá que investigar** en la construcción real de reglas de seguridad (fuera de alcance de este documento). Se apoya exclusivamente en el catálogo de fuentes ya aprobado (sección B del esquema) — no se ha hecho investigación bibliográfica nueva.

Perfiles clínicos (códigos usados en la matriz): `AS`=adulto sano · `OB`=obesidad · `HTA`=hipertensión · `DM2`=diabetes tipo 2 · `DISLIP`=dislipemia · `EA`=edad avanzada · `FRAG`=fragilidad/sarcopenia · `MENO`=menopausia · `ONCO`=oncología · `RENAL`=renal leve/moderada · `INMUNO`=inmunosupresión.

Estados de la matriz: `RR`=`RULE_REQUIRED` · `GR`=`GENERAL_RULE_MAY_APPLY` · `NE`=`NOT_EXPECTED_TO_REQUIRE_SPECIFIC_RULE` · `EG`=`EVIDENCE_GAP` · `RV`=`REQUIRES_REVIEW`.

---

## 1. MATRIZ DE COBERTURA — DOMINIOS

| Dominio | AS | OB | HTA | DM2 | DISLIP | EA | FRAG | MENO | ONCO | RENAL | INMUNO |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `CARDIORESPIRATORY` | NE | GR | RR | RR | GR | GR | RR | EG | RR | RR | RR |
| `RESISTANCE` | NE | GR | RR | RR | GR | GR | RR | RR | RR | GR | GR |
| `FLEXIBILITY` | NE | NE | NE | NE | NE | GR | GR | NE | GR | NE | NE |
| `NEUROMOTOR` | NE | NE | NE | GR | NE | RR | RR | NE | GR | GR | NE |
| `SEDENTARY_BEHAVIOUR_INTERRUPTION` | NE | GR | GR | RR | NE | GR | GR | NE | GR | GR | NE |

Notas puntuales:
- `CARDIORESPIRATORY × MENO = EG`: la evidencia de ejercicio aeróbico para síntomas de menopausia es explícitamente insuficiente (`BMC_MENOPAUSE_REVIEWS2024`) — no se puede escribir regla ni afirmar ausencia de necesidad de regla; queda como gap declarado, no como `NE`.
- `RESISTANCE × MENO = RR`: distinto del caso anterior — aquí sí hay evidencia fuerte pero orientada a beneficio óseo con carga progresiva supervisada (`LIFTMOR2018`), lo que **exige** una regla de progresión/supervisión, no solo puede aplicar una regla general.
- `RESISTANCE × FRAG = RR`: ICFSR (`ICFSR2019_DENT`) es explícito — "first-line therapy... resistance-based training component" — la fuerza de esta recomendación por sí sola exige regla dedicada, no una regla general heredada.

---

## 2. MATRIZ DE COBERTURA — ATRIBUTOS TRANSVERSALES

| Atributo | AS | OB | HTA | DM2 | DISLIP | EA | FRAG | MENO | ONCO | RENAL | INMUNO |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `training_format = HIIT` | NE | GR | RR | GR | GR | RV | EG | EG | RV | RR | RR |
| `impact_level` (★ nuevo, ver §3) | NE | GR | NE | GR | NE | GR | RR | RR | RR | RR | GR |
| `heavy_resistance` (★ nuevo, ver §3) | NE | NE | RR | RR | GR | GR | RR | RR | RR | GR | GR |
| `isometric_effort` / `valsalva_risk` (★ nuevo, ver §3) | NE | NE | RR | RR | GR | GR | GR | NE | GR | GR | NE |
| `balance_requirement` (★ nuevo, ver §3) | NE | NE | NE | RR | NE | RR | RR | NE | RR | GR | NE |
| `functional_requirement.requires_floor_transition` (ya existe en esquema) | NE | GR | NE | NE | NE | RR | RR | NE | GR | GR | NE |
| `functional_requirement.requires_overhead_shoulder_rom` (ya existe en esquema) | NE | NE | GR | RR | NE | NE | NE | NE | RR | NE | NE |
| `fall_risk` (★ nuevo, ver §3 — distinto de `fall_prevention_goal`) | NE | NE | NE | RR | NE | RR | RR | NE | RR | GR | NE |

`training_format=HIIT × RENAL = RR`: no es ambigüedad — `UKKA2021` **excluye explícitamente** HIIT de sus recomendaciones para ERC por relación beneficio-riesgo desfavorable; esto es ya una base suficiente para escribir la regla (probablemente `RELATIVE_CONTRAINDICATION` o `PRECAUTION` fuerte), no un gap.

`training_format=HIIT × EA = RV` y `× FRAG = EG`: aquí sí hay diferencia real — para edad avanzada general existe cuerpo de literatura sobre HIIT en mayores relativamente activos que requiere revisión antes de decidir (`REQUIRES_REVIEW`), mientras que para fragilidad específicamente el catálogo actual no tiene ninguna fuente que mencione HIIT en absoluto (ICFSR/EWGSOP2 no lo abordan) — eso es un vacío de evidencia real, no solo pendiente de revisión editorial.

---

## 3. VOCABULARY / SCHEMA EXTENSION CANDIDATES (NO introducidos silenciosamente)

Durante la construcción de esta matriz aparecieron atributos de seguridad potencialmente relevantes que **no existen formalmente** en `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.1.md`. Se listan aquí como candidatos a proponer, no se han añadido al esquema:

| Atributo candidato | Ya existe algo parecido? | Propuesta |
|---|---|---|
| `impact_level` | No | Enum `LOW`/`MODERATE`/`HIGH` a nivel `EXERCISE`/`EXERCISE_VARIANT` — necesario para `RENAL` (UKKA2021 excluye alto impacto no supervisado), `MENO`/`ONCO` (fractura/metástasis ósea) |
| `heavy_resistance` (umbral de carga) | Parcial — `training_intensity.scale: PERCENT_1RM` ya permite representar el valor, pero no existe un flag categórico reutilizable para reglas de seguridad sin tener que parsear el valor numérico | Añadir enum derivado `load_intensity_band: LOW/MODERATE/HIGH` calculado o declarado junto a `training_intensity`, para que las `safety_rule` puedan referenciarlo sin lógica numérica embebida |
| `isometric_effort` / `valsalva_risk` | Parcial — `movement_pattern: ISOMETRIC_HOLD` existe, pero no distingue intensidad/riesgo de maniobra de Valsalva | Añadir `valsalva_risk_flag: boolean` o `isometric_effort_level` independiente de `movement_pattern`, ya que no todo `ISOMETRIC_HOLD` implica el mismo riesgo (una plancha suave ≠ un press isométrico máximo) |
| `balance_requirement` | Parcial — el dominio `NEUROMOTOR` y `fall_prevention_goal` cubren el *objetivo* de entrenar equilibrio, pero no la *demanda* de equilibrio de un ejercicio de otro dominio (p.ej. una zancada de `RESISTANCE` exige equilibrio aunque su dominio primario no sea `NEUROMOTOR`) | Añadir `balance_requirement_level: LOW/MODERATE/HIGH` transversal a cualquier dominio |
| `floor_transitions` | **Ya existe** (`functional_requirement.requires_floor_transition`, definido en Fase 2) | Ninguna — se usa tal cual, aquí solo se confirma cobertura |
| `overhead_movement` | **Ya existe** (`functional_requirement.requires_overhead_shoulder_rom`, definido en Fase 2) | Ninguna — se usa tal cual |
| `fall_risk` | No — es semánticamente distinto de `fall_prevention_goal` (que describe el *propósito* de un ejercicio de `NEUROMOTOR`, no si un ejercicio de *otro* dominio incrementa el riesgo de caída para un perfil vulnerable — p.ej. una zancada cargada es `RESISTANCE`, no tiene `fall_prevention_goal`, pero sí es `fall_risk`-relevante para `FRAG`/`EA`) | Añadir `fall_risk_relevant: boolean` como atributo de seguridad independiente de `fall_prevention_goal` |

Ninguno de estos 6 candidatos se ha incorporado al esquema — quedan pendientes de aprobación explícita de César antes de usarse en `safety_rule` real.

---

## 4. NEW_RESEARCH_REQUIRED (fuera de alcance de este documento, no se investiga aquí)

1. **Pregunta**: ¿Qué evidencia respalda la eficacia y seguridad del entrenamiento reactivo de equilibrio/perturbación y de escaleras de agilidad, más allá de la recomendación general de actividad multicomponente de WHO/Otago? — **Población**: adultos mayores comunitarios y personas frágiles. — **Atributo/intervención**: `NEUROMOTOR` — entrenamiento reactivo/agilidad (familias #30, #31 del piloto). — **Tipo de evidencia buscada**: `SYSTEMATIC_REVIEW`/`GUIDELINE` específico de entrenamiento reactivo de equilibrio (no solo multicomponente general).
2. **Pregunta**: ¿Existe protocolo de entrenamiento específico y evidencia de seguridad para la transición suelo↔bipedestación como ejercicio entrenable (más allá de su uso como test diagnóstico EWGSOP2)? — **Población**: fragilidad/sarcopenia, edad avanzada. — **Atributo/intervención**: `functional_requirement.requires_floor_transition` (familia #29). — **Tipo de evidencia buscada**: `PRIMARY_STUDY`/`SYSTEMATIC_REVIEW` sobre entrenamiento de transiciones de suelo.
3. **Pregunta**: ¿Qué parámetros de dosis (carga, distancia, frecuencia) existen para el "loaded carry"/farmer carry como modalidad de entrenamiento de fuerza de agarre? — **Población**: adulto sano y fragilidad/sarcopenia. — **Atributo/intervención**: `RESISTANCE`, patrón `CARRY` (familia #17). — **Tipo de evidencia buscada**: `GUIDELINE`/`SYSTEMATIC_REVIEW` de parámetros de "loaded carry training".
4. **Pregunta**: ¿Es seguro y bajo qué condiciones el `training_format: HIIT` en adultos mayores frágiles o en supervivientes de cáncer con cribado cardiotóxico? — **Población**: fragilidad/sarcopenia, edad avanzada muy desacondicionada, oncología. — **Atributo/intervención**: `training_format=HIIT`. — **Tipo de evidencia buscada**: `GUIDELINE`/`CONSENSUS` de seguridad de HIIT específico para estas subpoblaciones (el catálogo actual solo cubre la exclusión explícita en ERC, `UKKA2021`, y guías generales no específicas de fragilidad/oncología).
5. **Pregunta**: ¿Qué umbrales de carga de impacto son seguros para entrenamiento no supervisado (vs. supervisado) en mujeres postmenopáusicas con osteopenia/osteoporosis, más allá del protocolo único supervisado de LIFTMOR? — **Población**: menopausia con osteopenia/osteoporosis diagnosticada. — **Atributo/intervención**: `impact_level`, `heavy_resistance`. — **Tipo de evidencia buscada**: `SYSTEMATIC_REVIEW`/`META_ANALYSIS` sobre umbrales seguros de impacto/carga en contexto no clínico/no supervisado.
6. **Pregunta**: ¿Qué magnitud de elevación aguda de presión arterial se asocia a distintos niveles de intensidad/duración de esfuerzo isométrico (para operacionalizar un umbral concreto de `isometric_effort_level`)? — **Población**: HTA controlada vs. no controlada. — **Atributo/intervención**: `isometric_effort`/`valsalva_risk`. — **Tipo de evidencia buscada**: `PRIMARY_STUDY`/`SYSTEMATIC_REVIEW` que cuantifique la respuesta de PA por intensidad/duración isométrica (la fuente actual, `ACSM_HTA_PRONOUNCEMENT`, es cualitativa, no cuantitativa).

Ninguno de estos 6 gaps se ha rellenado con conocimiento general — quedan explícitamente marcados `NEW_RESEARCH_REQUIRED` para una futura Fase 3B efectiva (construcción de `safety_rule` reales), no resueltos en este plan.

---

## 5. RELACIÓN CON EL PILOTO DE FASE 3A

Las familias del piloto (`NUTRILONGX_EJERCICIO_PHASE3A_PILOT_PLAN_v1.md`) con mayor concentración de celdas `RR`/`RV`/`EG` en esta matriz — #11 (sentadilla), #12 (bisagra KB), #15 (plancha isométrica), #19/#20 (HIIT), #26 (equilibrio unipodal), #28 (sentarse-levantarse), #29 (transición de suelo), #32 (circuito multicomponente), #37 (press hombros overhead) — son las candidatas prioritarias para investigación dedicada en una futura Fase 3B efectiva, antes de construir cualquier `safety_rule` con valores reales para esas familias.

---

## FINAL STATUS DE ESTE DOCUMENTO

```
SAFETY_COVERAGE_MAPPED_NEW_RESEARCH_REQUIRED_FOR_6_ITEMS
```

(Ver `NUTRILONGX_EJERCICIO_PHASE2_TO_3_CHANGELOG_v1.md` para el status final consolidado.)
