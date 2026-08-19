# NUTRILONGX — Ejercicio: Plan de Piloto Fase 3A (Vocabularies + Exercise Library Pilot + Variants)

Fecha: 2026-08-18. Este documento es un **plan de catálogo**, no genera los 40 objetos `EXERCISE` en JSON. Se apoya en `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.1.md` y en el catálogo de fuentes ya aprobado (sección B del esquema) — no se ha realizado nueva investigación bibliográfica en este documento. `CANONICAL v1.0` permanece `FROZEN`, solo se referencia en modo lectura para el mapping conceptual.

---

## Leyenda de abreviaturas

**Equipment**: `BW`=bodyweight · `RB`=resistance_band · `DB`=dumbbell · `KB`=kettlebell · `MACH`=machine · `BARB`=free_weight_barbell · `TREAD`=cardio_equipment_treadmill · `BIKE`=cardio_equipment_bike · `ROW`=cardio_equipment_rower · `ELLIP`=cardio_equipment_elliptical · `JR`=jump_rope

**Context**: `HOME` · `GYM` · `OUT`=outdoor · `POOL`=pool_water · `OFFICE`

**movement_pattern**: `SQ`=squat · `HI`=hinge · `PU`=push · `PL`=pull · `CA`=carry · `RO`=rotate · `GA`=gait · `LO`=locomotion · `IH`=isometric_hold

**functional_relevance**: `ADL`=adl_transfer · `GUF`=getting_up_from_floor · `STC`=stair_climb · `CAR`=carrying_loads · `GSP`=gait_speed · `REA`=reaching · `BAL`=balance_recovery

**scientific_source_strategy** (`source_id` del catálogo aprobado, sección B del esquema v1.1): dosis general de referencia — nunca se afirma que la fuente define el ejercicio concreto (regla A.1.2 del hardening v1.1), solo el marco de dosis/dominio aplicable.

---

## 1. MATRIZ DE COBERTURA DEL PILOTO (40 familias candidatas)

### 1.1 `CARDIORESPIRATORY` (10 familias)

| # | candidate_exercise_family | secondary_domain | movement_pattern | functional_relevance | equipment | context | training_format | expected_variant_chain | scientific_source_strategy | clinical_relevance (perfiles con nota relevante) | reason_for_inclusion |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | caminata_ritmo_moderado | — | `GA`,`LO` | `GSP`,`ADL` | `BW` | `HOME`,`OUT` | — | BASE + PROGRESSION | `WHO2020`,`ACSM_GETP11` | edad_avanzada, obesidad, dm2, hta, renal_leve_moderada (entrada de bajo riesgo casi universal) | Modalidad de entrada más segura y mejor respaldada transversalmente; ancla del dominio cardiorrespiratorio |
| 2 | caminata_vigorosa | — | `GA`,`LO` | `GSP` | `BW` | `HOME`,`OUT` | — | REGRESSION(1) + BASE | `WHO2020`,`ACSM_GETP11` | hta, dm2 | Progresión natural de #1, mapea a `movement.cardio.caminata_vigorosa_min` |
| 3 | caminata_postprandial | — | `GA`,`LO` | `GSP`,`ADL` | `BW` | `HOME`,`OUT` | — | BASE only | `WHO2020`; nota clínica DM2 requiere fuente propia (`COLBERG2016_ADA`, ya en catálogo) | dm2 (control glucémico postprandial) | Mapea directo a `movement.cardio.camina_min_tras_comer`; relevancia clínica DM2 ya documentada en Fase 1 |
| 4 | caminata_por_cuestas | — | `GA`,`LO` | `GSP`,`STC` | `BW` | `OUT` | — | BASE + PROGRESSION | `WHO2020`,`ACSM_GETP11` | hta (vigilar intensidad en no controlada) | Mapea a `movement.cardio.caminata_por_cuestas_min` |
| 5 | trote_suave | REGRESSION de #6 conceptual | `GA`,`LO` | `GSP` | `BW` | `OUT` | — | REGRESSION + BASE + PROGRESSION | `WHO2020`,`ACSM_GETP11` | obesidad (impacto articular — precaución), dm2 | Mapea a `movement.cardio.correr_suave_min` |
| 6 | ciclismo_continuo | — | `LO` | `GSP` | `BIKE` | `GYM`,`HOME`,`OUT` | — | BASE + PROGRESSION | `WHO2020`,`ACSM_GETP11` | obesidad (bajo impacto), renal_leve_moderada | Modalidad sin carga articular, mapea a `movement.cardio.sesion_de_bicicleta_min` |
| 7 | natacion_continua | — | `LO`,`PU`,`PL` | `GSP` | `BW` (`POOL`) | `POOL` | — | BASE only | `WHO2020`,`ACSM_GETP11` | obesidad, edad_avanzada (bajo impacto) | Mapea a `movement.cardio.nadar_min_continuo`; contexto `POOL` único en el piloto |
| 8 | remo_ergometro | — | `HI`,`PL` | `CAR` | `ROW` | `GYM` | — | BASE + PROGRESSION | `WHO2020`,`ACSM_GETP11` | — | Mapea a `movement.cardio.remo_ergometro_min`; cubre patrón `HI`/`PL` en modalidad cardio |
| 9 | nordic_walking | — | `GA`,`LO`,`PU`,`PL` | `GSP`,`BAL` | `BW` (bastones) | `OUT` | — | BASE only | `WHO2020`; equipamiento "bastones" no está en `equipment_vocabulary_v1` — ver sección 6 (extensión propuesta) | edad_avanzada (componente de equilibrio añadido) | Mapea a `movement.cardio.nordic_walking_min`; cruza con `NEUROMOTOR` por el uso de bastones para equilibrio |
| 10 | baile_recreativo | — | `LO`,`RO` | `GSP`,`BAL` | `BW` | `HOME`,`GYM` | — | BASE only | `WHO2020` | menopausia (evidencia INSUFFICIENT para síntomas, no se afirma beneficio específico) | Mapea a `movement.cardio.bailar_min`; modalidad de adherencia alta |

### 1.2 `RESISTANCE` (10 familias, 3 con `training_format: HIIT`)

| # | candidate_exercise_family | secondary_domain | movement_pattern | functional_relevance | equipment | context | training_format | expected_variant_chain | scientific_source_strategy | clinical_relevance | reason_for_inclusion |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 11 | sentadilla | — | `SQ` | `GUF`,`ADL` | `BW`,`DB`,`KB` | `HOME`,`GYM` | — | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11`,`KRAEMER2002_RATAMESS`,`GARBER2011` | fragilidad_sarcopenia (`EWGSOP2_2019`,`ICFSR2019_DENT` — primera línea), edad_avanzada | Patrón fundacional del dominio, cadena de variantes rica (silla→BW→cargada) |
| 12 | bisagra_de_cadera_kb | — | `HI` | `ADL`,`CAR` | `KB`,`DB` | `HOME`,`GYM` | — | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11`,`KRAEMER2002_RATAMESS` | renal_leve_moderada (precaución carga alta impacto — `UKKA2021`) | Mapea a `movement.strength.peso_muerto_con_kettlebell_rep_x` |
| 13 | flexiones | — | `PU` | `ADL` | `BW` | `HOME`,`GYM` | — | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11`,`NASM_OPT`,`KRAEMER2002_RATAMESS` | oncología (precaución tras disección axilar — `SCHMITZ2010_LYMPHEDEMA_RCT`) | Mapea a `movement.strength.flexiones_repeticiones_x`; cadena rodillas→estándar→declinada ya documentada en Fase 1 |
| 14 | remo_con_carga | — | `PL` | `ADL` | `DB`,`RB`,`MACH` | `HOME`,`GYM` | — | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11`,`KRAEMER2002_RATAMESS` | — | Patrón `PL` complementario a `PU` (#13), balance de empuje/tracción |
| 15 | plancha_isometrica | — | `IH` | `ADL` | `BW` | `HOME`,`GYM` | — | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11` | hta (precaución Valsalva en isométrico mantenido — `ACSM_HTA_PRONOUNCEMENT`) | Mapea a `movement.strength.plancha_s_x`; único `IH` puro del piloto, relevante para regla HTA |
| 16 | zancadas | — | `SQ`,`GA` | `GUF`,`GSP`,`ADL` | `BW`,`DB` | `HOME`,`GYM` | — | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11`,`KRAEMER2002_RATAMESS` | edad_avanzada (equilibrio unipodal implícito) | Mapea a `movement.strength.zancadas_rep_x`; cruza con `NEUROMOTOR` por el componente de equilibrio unipodal |
| 17 | farmer_carry | — | `CA` | `CAR`,`ADL` | `DB`,`KB` | `HOME`,`GYM` | — | BASE + PROGRESSION | `ACSM_GETP11` (dosis general); **dosis específica de carga/distancia — ver `NEW_RESEARCH_REQUIRED` #3, sección 6** | fragilidad_sarcopenia (fuerza de agarre, relevante per ICFSR) | Mapea a `movement.strength.farmer_carry_min`; único patrón `CA` puro |
| 18 | sesion_fuerza_full_body | — | `SQ`,`HI`,`PU`,`PL` | `ADL` | `DB`,`BW`,`MACH` | `GYM`,`HOME` | — | BASE only (es una plantilla de sesión conceptual, no una cadena de variantes individual) | `ACSM_GETP11`,`AHA2023_RESISTANCE` | — | Mapea a `movement.strength.sesion_de_fuerza_full_body_min`; ejercicio "compuesto" a nivel conceptual, se resolverá como `SESSION_TEMPLATE` real en Fase 3C, aquí solo como familia de referencia |
| 19 | burpees | — | `SQ`,`PU`,`LO` | `ADL` | `BW` | `HOME`,`GYM` | `HIIT` | BASE + PROGRESSION | `ACSM_GETP11`; **combinación con HIIT en poblaciones de riesgo — ver `NEW_RESEARCH_REQUIRED` #4** | renal_leve_moderada (HIIT excluido explícitamente por `UKKA2021`), fragilidad_sarcopenia (precaución) | Mapea a `movement.hiit.burpees_rep_x`; ejemplo deliberado de `training_format: HIIT` sobre patrón de `RESISTANCE` |
| 20 | sprints_intervalos | — | `LO` | `GSP` | `BW` | `OUT`,`GYM` | `HIIT` | BASE + PROGRESSION | `ACSM_GETP11`; mismo gap que #19 | hta (precaución si no controlada), renal_leve_moderada (exclusión HIIT) | Mapea a `movement.hiit.sprints_de_s_descanso_s`; segundo ejemplo de `HIIT` sobre patrón `CARDIORESPIRATORY`-adyacente clasificado aquí por énfasis de fuerza-potencia |

### 1.3 `FLEXIBILITY` (5 familias, con `mobility_type`)

| # | candidate_exercise_family | secondary_domain | movement_pattern | functional_relevance | equipment | context | mobility_type | expected_variant_chain | scientific_source_strategy | clinical_relevance | reason_for_inclusion |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 21 | movilidad_articular_general | `NEUROMOTOR` | `RO` | `ADL`,`REA` | `BW` | `HOME`,`GYM` | `ACTIVE_MOBILITY` | BASE only | `GARBER2011` (flexibilidad, dosis no cuantificada por WHO/AHA — gap ya documentado en Fase 1); **evidencia específica de "serie de movilidad articular" — ver `NEW_RESEARCH_REQUIRED` #1 parcial** | — | Mapea a `movement.mobility.serie_de_movilidad_articular_min` |
| 22 | yoga_fluido | `NEUROMOTOR` | `RO`,`IH` | `BAL`,`REA` | `BW` | `HOME`,`GYM` | `DYNAMIC_STRETCH` | BASE only | `GARBER2011`; menopausia — única modalidad con evidencia de mejora sintomática (`BMC_MENOPAUSE_REVIEWS2024`, evidencia más fuerte para síntomas totales, aunque no vasomotores) | menopausia (evidencia real, aunque acotada — no sobreclamar) | Mapea a `movement.mobility.yoga_fluido_min`; única familia con relevancia clínica positiva explícita para menopausia en el piloto |
| 23 | estiramiento_estatico_grandes_grupos | — | `IH` | `ADL` | `BW` | `HOME`,`GYM` | `STATIC_STRETCH` | BASE only | `GARBER2011` (≥2–3 días/sem, sin dosis específica más allá de esto) | — | Sin equivalente legacy directo — cubre `FLEXIBILITY` como dominio propio, no solo vía `mobility_type` |
| 24 | movilidad_dinamica_calentamiento | — | `SQ`,`HI`,`RO` | `ADL` | `BW` | `HOME`,`GYM` | `DYNAMIC_STRETCH` | BASE only | `GARBER2011` | — | Cubre el rol de calentamiento pre-sesión, relevante para futuras `SESSION_TEMPLATE` (Fase 3C) |
| 25 | movilidad_cadera_dirigida | `RESISTANCE` | `HI`,`RO` | `ADL`,`GUF` | `BW` | `HOME`,`GYM` | `ACTIVE_MOBILITY` | BASE + PROGRESSION | `GARBER2011`; sin fuente que distinga mobility/flexibility (gap ya documentado) | fragilidad_sarcopenia (prerrequisito de movilidad para sentadilla/bisagra seguras) | Ejemplo deliberado de solapamiento `FLEXIBILITY`↔`RESISTANCE` vía `secondary_domain` |

### 1.4 `NEUROMOTOR` (7 familias, con `fall_prevention_goal`)

| # | candidate_exercise_family | secondary_domain | movement_pattern | functional_relevance | equipment | context | fall_prevention_goal | expected_variant_chain | scientific_source_strategy | clinical_relevance | reason_for_inclusion |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 26 | equilibrio_unipodal | — | `IH` | `BAL` | `BW` | `HOME`,`GYM` | `true` | REGRESSION + BASE + PROGRESSION | `WHO2020`,`NICE_NG249_2025`,`OTAGO_CAMPBELL1999` | edad_avanzada, fragilidad_sarcopenia (ICFSR — componente de equilibrio recomendado) | Mapea directo a `movement.fall_prevention.equilibrio_unipodal_s_lado`; ancla del dominio `NEUROMOTOR` |
| 27 | marcha_en_tandem | — | `GA` | `BAL`,`GSP` | `BW` | `HOME`,`GYM` | `true` | BASE only | `NICE_NG249_2025`,`OTAGO_CAMPBELL1999` | edad_avanzada | Complementa #26, técnica clásica de Otago Exercise Programme |
| 28 | sentarse_levantarse_silla | — | `SQ`,`GA` | `GUF`,`ADL` | `BW` | `HOME` | `true` | REGRESSION + BASE + PROGRESSION | `EWGSOP2_2019` (chair-stand test como marcador diagnóstico, no solo ejercicio — nota metodológica), `NICE_NG249_2025` | fragilidad_sarcopenia (EWGSOP2 usa este mismo movimiento como test diagnóstico — coincidencia relevante a documentar, no a confundir: aquí es ejercicio, no test) | Solapa deliberadamente con el criterio diagnóstico EWGSOP2 — util para futuras `SESSION_TEMPLATE` orientadas a fragilidad |
| 29 | transicion_desde_el_suelo | `RESISTANCE` | `SQ`,`HI`,`PU` | `GUF`,`ADL` | `BW` | `HOME` | `false` | REGRESSION + BASE + PROGRESSION | Ninguna fuente del catálogo cubre este movimiento específicamente — **ver `NEW_RESEARCH_REQUIRED` #2** | fragilidad_sarcopenia, edad_avanzada (alto `functional_requirement`, bajo `technical_complexity` relativo) | Ejemplo canónico de la distinción `technical_complexity` vs `functional_requirement` ya diseñada en el esquema (Fase 1, sección F) |
| 30 | entrenamiento_reactivo_de_pasos | — | `GA`,`LO` | `BAL` | `BW` | `GYM` | `true` | BASE only | Evidencia general de WHO/NICE para "multicomponent balance training" cubre la categoría, pero no esta técnica específica — **ver `NEW_RESEARCH_REQUIRED` #1** | edad_avanzada, fragilidad_sarcopenia | Técnica de "reactive balance/perturbation training", relevante pero con gap de evidencia específica reconocido explícitamente |
| 31 | escalera_de_agilidad | — | `GA`,`LO` | `BAL`,`GSP` | `BW` | `GYM`,`OUT` | `false` | BASE + PROGRESSION | Sin fuente específica en el catálogo — mismo gap que #30, agrupado en `NEW_RESEARCH_REQUIRED` #1 | — | Incluida por cobertura de `NEUROMOTOR`/agilidad, con gap de evidencia ya señalado, no ocultado |
| 32 | circuito_multicomponente_equilibrio_fuerza | `RESISTANCE` | `SQ`,`IH`,`GA` | `BAL`,`ADL` | `BW`,`DB` | `HOME`,`GYM` | `true` | BASE only | `WHO2020` ("multicomponent physical activity... functional balance and strength"), `ICFSR2019_DENT` | fragilidad_sarcopenia (recomendación de primera línea explícita — ICFSR), edad_avanzada | Representa directamente la recomendación WHO/ICFSR de actividad multicomponente — candidata fuerte para `SESSION_TEMPLATE` de Fase 3C |

### 1.5 `SEDENTARY_BEHAVIOUR_INTERRUPTION` (4 familias, como contenido — distintas de `adherence.movement`)

| # | candidate_exercise_family | secondary_domain | movement_pattern | functional_relevance | equipment | context | expected_variant_chain | scientific_source_strategy | clinical_relevance | reason_for_inclusion |
|---|---|---|---|---|---|---|---|---|---|---|
| 33 | pausa_activa_breve | `RESISTANCE` | `SQ`,`GA` | `ADL` | `BW` | `OFFICE`,`HOME` | BASE only | `EKELUND2016`,`REPLACESED2018` | dm2, hta (interrupción de sedentarismo con beneficio metabólico documentado) | Mapea a `movement.daily_activity.pausa_activa_de_min_cada_min`; contenido de ejercicio breve, distinto del hábito gamificado equivalente |
| 34 | snack_de_movimiento_sentadillas | `RESISTANCE` | `SQ` | `ADL` | `BW` | `OFFICE`,`HOME` | BASE only | `EKELUND2016`,`REPLACESED2018` | dm2 | Mapea a `movement.daily_activity.snacks_de_movimiento_min_cada_min_sentad` |
| 35 | subir_escaleras_breve | — | `GA`,`LO` | `STC`,`GSP` | `BW` | `OUT`,`HOME`,`OFFICE` | BASE + PROGRESSION | `EKELUND2016` | — | Mapea a `movement.daily_activity.sube_tramos_de_escaleras` |
| 36 | caminata_acumulada_por_pasos | — | `GA`,`LO` | `GSP`,`ADL` | `BW` | `HOME`,`OUT` | BASE only | `DING2025`,`PALUCH2021` | — | Mapea a `movement.daily_activity.camina_pasos_hoy` / `caminar_pasos_dias_sem` |

### 1.6 Familias adicionales de cierre (4, distribuidas para redondear cobertura sin forzar 1:1)

| # | candidate_exercise_family | primary_domain | secondary_domain | movement_pattern | functional_relevance | equipment | context | expected_variant_chain | scientific_source_strategy | clinical_relevance | reason_for_inclusion |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 37 | press_de_hombros | `RESISTANCE` | — | `PU` | `ADL`,`REA` | `DB`,`BARB` | `HOME`,`GYM` | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11`,`KRAEMER2002_RATAMESS` | dm2 (precaución overhead+Valsalva en retinopatía proliferativa — `COLBERG2016_ADA`) | Único patrón "overhead" explícito del piloto — relevante para el atributo `overhead_movement` propuesto en la Matriz de Seguridad (documento 3) |
| 38 | elevacion_de_cadera_glutea | `RESISTANCE` | `NEUROMOTOR` | `HI` | `ADL`,`GUF` | `BW`,`DB` | `HOME`,`GYM` | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11`,`KRAEMER2002_RATAMESS` | menopausia (relevancia ósea de cadera — `LIFTMOR2018` es sobre carga axial/impacto, no idéntico a este ejercicio; no se afirma equivalencia) | Cubre patrón `HI` de baja complejidad técnica, útil para regresión de #12 |
| 39 | remo_en_maquina_guiada | `RESISTANCE` | — | `PL` | `ADL` | `MACH` | `GYM` | BASE only | `ACSM_GETP11` | — | Variante de baja complejidad técnica de #14, para contextos `GYM` con máquina guiada |
| 40 | subida_al_cajon_step_up | `RESISTANCE` | `NEUROMOTOR` | `SQ`,`GA` | `STC`,`GUF`,`ADL` | `BW`,`DB` | `HOME`,`GYM` | REGRESSION + BASE + PROGRESSION | `ACSM_GETP11`,`WHO2020` (funcional/equilibrio) | fragilidad_sarcopenia, edad_avanzada | Combina fuerza unilateral + equilibrio + relevancia funcional de escaleras — candidato de alto valor para `SESSION_TEMPLATE` multicomponente en Fase 3C |

---

## 2. RESUMEN DE COBERTURA POR DOMINIO

| Dominio/atributo | Familias | Nota |
|---|---|---|
| `CARDIORESPIRATORY` | 10 (#1–10) | Cubre los 10 subgrupos observados en `movement.cardio` sin forzar nombres idénticos |
| `RESISTANCE` | 14 (#11–20, #37–40) | Incluye los patrones fundamentales (`SQ`,`HI`,`PU`,`PL`,`CA`,`IH`) |
| `FLEXIBILITY` | 5 (#21–25) | Incluye `mobility_type` como atributo (decisión 3), nunca como dominio propio |
| `NEUROMOTOR` | 7 (#26–32) | Incluye `fall_prevention_goal` como atributo (decisión 4), nunca como dominio propio |
| `SEDENTARY_BEHAVIOUR_INTERRUPTION` | 4 (#33–36) | Como contenido de `EXERCISE`, explícitamente distinto de `adherence.movement.*` (gamificación) |
| `training_format: HIIT` (transversal) | 2 explícitas (#19, #20) | Decisión 2 — nunca dominio, siempre atributo sobre `CARDIORESPIRATORY`/`RESISTANCE` |

**Total: 40 familias.** Cobertura hacia los 6 subdominios legacy de `movement.*` confirmada sin representación forzada 1:1 (algunas familias del piloto no tienen equivalente legacy directo — p.ej. #23, #37, #40 — deliberadamente, para no limitar el catálogo científico a lo que la gamificación ya cubría).

---

## 3. VARIANT STRATEGY (decisión: solo REGRESSION/BASE/PROGRESSION, nunca niveles de usuario ni de gamificación)

Regla aplicada uniformemente: `progression_stage` describe **modificación biomecánica/funcional** del ejercicio (rango de movimiento, apoyo, carga externa, complejidad de equilibrio), nunca "principiante/intermedio/avanzado" ni "Inicial/Bronce/Plata/Oro/Platino".

| Patrón de cadena | Familias que lo usan | Ejemplo de qué cambia entre eslabones |
|---|---|---|
| `BASE` únicamente (sin cadena) | #3, #6\*, #7, #9, #10, #18, #21, #22, #23, #24, #27, #30, #31, #32, #33, #34, #35\*, #36, #39 | Ejercicios donde no se identificó una regresión/progresión biomecánica clara y útil en esta fase — no se fuerza una cadena artificial |
| `REGRESSION + BASE` | #2 | Reducción de intensidad de marcha (vigorosa→moderada como regresión conceptual, ver nota) |
| `BASE + PROGRESSION` | #1, #4, #6, #8, #17, #19, #20, #25, #31, #35, #40\* | Se añade distancia/duración/carga/complejidad sin cambiar el patrón base |
| `REGRESSION + BASE + PROGRESSION` (cadena completa de 3 eslabones) | #5, #11, #12, #13, #14, #15, #16, #26, #28, #29, #37, #38, #40 | Ejemplo #11 (sentadilla): regresión = apoyo en silla (rango reducido, sin carga) → base = sentadilla con peso corporal → progresión = sentadilla goblet cargada. Ejemplo #26 (equilibrio unipodal): regresión = apoyo en pared/silla → base = sin apoyo, ojos abiertos → progresión = superficie inestable u ojos cerrados (bajo supervisión) |

\* Algunas familias aparecen en más de una fila porque su patrón de cadena real se decidirá con más precisión en el momento de construir el `EXERCISE_VARIANT` (Fase 3A, siguiente sub-entrega tras aprobación de este plan) — aquí se declara la intención, no el JSON final.

**Verificación explícita de la regla**: ninguna celda de esta tabla usa terminología de nivel de usuario o de gamificación — se ha revisado manualmente cada entrada de las 40 familias para confirmar esto antes de entregar el documento.

---

## 4. NOTAS DE CIERRE

- No se ha generado ningún objeto `EXERCISE`/`EXERCISE_VARIANT` en JSON — este documento es exclusivamente el plan de catálogo, tal como se pidió.
- No se ha generado ninguna dosis individual, contraindicación específica, regla clínica ni beneficio clínico no respaldado — las columnas `scientific_source_strategy` y `clinical_relevance` señalan **dónde** aplicaría evidencia general ya catalogada o **dónde** existe un gap, nunca afirman un valor concreto.
- Las acciones gamificadas (`movement.*`) y las familias de ejercicio de este piloto se mantienen como entidades conceptualmente distintas en todo el documento — el mapping es informativo/futuro, no una fusión de modelos de datos.
