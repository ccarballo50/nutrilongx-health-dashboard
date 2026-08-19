# NUTRILONGX — Ejercicio: Auditoría de Identidad de EXERCISE v1 (Fase 3A.1)

Fecha: 2026-08-19. Auditoría de identidad semántica de los 25 `EXERCISE` base del Pilot, previa a congelar `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.json`. **No se ha modificado el JSON en este documento.** No se han construido `safety_rules`, `SESSION_TEMPLATE` ni el Master final. No SQL/Supabase/Git/Vercel.

Pregunta guía aplicada a cada uno de los 25 objetos: *"¿Este objeto representa una identidad de movimiento realmente distinta, o el mismo movimiento con distinta dosis/intensidad/contexto?"*

---

## A. LOS 25 EXERCISE ACTUALES (línea base auditada)

| # | exercise_id actual | Título | Dominio | Patrón | Equipamiento | Contexto |
|---|---|---|---|---|---|---|
| 1 | exercise.cardiorespiratory.caminata_ritmo_moderado | Caminata a ritmo moderado | CARDIORESPIRATORY | GA, LO | BODYWEIGHT | HOME, OUT |
| 2 | exercise.cardiorespiratory.caminata_vigorosa | Caminata vigorosa | CARDIORESPIRATORY | GA, LO | BODYWEIGHT | HOME, OUT |
| 4 | exercise.cardiorespiratory.caminata_por_cuestas | Caminata por cuestas | CARDIORESPIRATORY | GA, LO | BODYWEIGHT | OUT |
| 5 | exercise.cardiorespiratory.trote_suave | Trote suave | CARDIORESPIRATORY | GA, LO | BODYWEIGHT | OUT |
| 6 | exercise.cardiorespiratory.ciclismo_continuo | Ciclismo continuo | CARDIORESPIRATORY | LO | CARDIO_EQUIPMENT_BIKE | GYM, HOME, OUT |
| 7 | exercise.cardiorespiratory.natacion_continua | Natación continua | CARDIORESPIRATORY | LO, PU, PL | BODYWEIGHT | POOL |
| 8 | exercise.cardiorespiratory.remo_ergometro | Remo en ergómetro | CARDIORESPIRATORY | HI, PL | CARDIO_EQUIPMENT_ROWER | GYM |
| 9 | exercise.cardiorespiratory.nordic_walking | Nordic walking | CARDIORESPIRATORY | GA, LO, PU, PL | TREKKING_POLES | OUT |
| 10 | exercise.cardiorespiratory.baile_recreativo | Baile recreativo | CARDIORESPIRATORY | LO, RO | BODYWEIGHT | HOME, GYM |
| 11 | exercise.resistance.sentadilla | Sentadilla | RESISTANCE | SQ | BODYWEIGHT/DB/KB | HOME, GYM |
| 12 | exercise.resistance.bisagra_de_cadera_kb | Bisagra de cadera con kettlebell | RESISTANCE | HI | KB, DB | HOME, GYM |
| 13 | exercise.resistance.flexiones | Flexiones | RESISTANCE | PU | BODYWEIGHT | HOME, GYM |
| 14 | exercise.resistance.remo_con_carga | Remo con carga | RESISTANCE | PL | DB, BAND, MACHINE | HOME, GYM |
| 15 | exercise.resistance.plancha_isometrica | Plancha isométrica | RESISTANCE | IH | BODYWEIGHT | HOME, GYM |
| 16 | exercise.resistance.zancadas | Zancadas | RESISTANCE | SQ, GA | BODYWEIGHT, DB | HOME, GYM |
| 17 | exercise.resistance.farmer_carry | Farmer carry | RESISTANCE | CA | DB, KB | HOME, GYM |
| 19 | exercise.resistance.burpees | Burpees | RESISTANCE | SQ, PU, LO | BODYWEIGHT | HOME, GYM |
| 25 | exercise.flexibility.movilidad_cadera_dirigida | Movilidad de cadera dirigida | FLEXIBILITY | HI, RO | BODYWEIGHT | HOME, GYM |
| 26 | exercise.neuromotor.equilibrio_unipodal | Equilibrio unipodal | NEUROMOTOR | IH | BODYWEIGHT | HOME, GYM |
| 27 | exercise.neuromotor.marcha_en_tandem | Marcha en tándem | NEUROMOTOR | GA | BODYWEIGHT | HOME, GYM |
| 28 | exercise.neuromotor.sentarse_levantarse_silla | Sentarse y levantarse de la silla | NEUROMOTOR | SQ, GA | BODYWEIGHT | HOME |
| 29 | exercise.resistance.transicion_desde_el_suelo | Transición desde el suelo | RESISTANCE | SQ, HI, PU | BODYWEIGHT | HOME |
| 37 | exercise.resistance.press_de_hombros | Press de hombros | RESISTANCE | PU | DB, BARBELL | HOME, GYM |
| 38 | exercise.resistance.elevacion_de_cadera_glutea | Elevación de cadera glútea | RESISTANCE | HI | BODYWEIGHT, DB | HOME, GYM |
| 40 | exercise.resistance.subida_al_cajon_step_up | Subida al cajón (step-up) | RESISTANCE | SQ, GA | BODYWEIGHT, DB | HOME, GYM |

---

## B. IDENTITY / DUPLICATE GROUPS DETECTADOS

Solo se detectó **un** grupo con solapamiento real de identidad. Todos los demás objetos tienen patrón de movimiento, equipamiento o contexto suficientemente distintos como para no requerir agrupación.

### Grupo 1 — familia "caminata" (candidatas #1, #2, #4)

| exercise_id | impact_level | balance_requirement_level | fall_risk_relevant | functional_relevance | context |
|---|---|---|---|---|---|
| caminata_ritmo_moderado (#1) | LOW | LOW | false | GSP, ADL | HOME, OUT |
| caminata_vigorosa (#2) | LOW | LOW | false | GSP | HOME, OUT |
| caminata_por_cuestas (#4) | MODERATE | MODERATE | **true** | GSP, STC | OUT |

**#1 vs #2**: patrón (GA, LO), equipamiento (BODYWEIGHT), contexto (HOME, OUT), `impact_level`, `balance_requirement_level` y `fall_risk_relevant` son **idénticos** en ambos objetos. La única diferencia real es el nombre/título, que codifica intensidad ("moderada" vs "vigorosa"). No hay ningún atributo de identidad de movimiento ni de cribado de seguridad que las distinga.

**#4 vs #1/#2**: aunque comparte el mismo patrón de movimiento base (GA, LO), `caminata_por_cuestas` tiene valores **distintos** en `impact_level` (MODERATE vs LOW), `balance_requirement_level` (MODERATE vs LOW) y `fall_risk_relevant` (true vs false), y una `functional_relevance` adicional (STC). Estas no son solo etiquetas de intensidad — son atributos de cribado a nivel `EXERCISE` que cambiarían si se fusionara con la caminata base, perdiendo información de seguridad real.

### Grupo 2 — resto de CARDIORESPIRATORY (candidatas #5, #6, #7, #8, #9, #10)

`trote_suave`, `ciclismo_continuo`, `natacion_continua`, `remo_ergometro`, `nordic_walking`, `baile_recreativo`: cada una tiene patrón de movimiento, equipamiento o contexto genuinamente distintos entre sí y respecto a la familia caminata (ver sección C). No se detecta solapamiento — se justifican por ontología, no por nombre, como se pidió explícitamente auditar.

### Resto de dominios (RESISTANCE, NEUROMOTOR, FLEXIBILITY)

Las 12 candidatas `RESISTANCE`, 3 `NEUROMOTOR` y 1 `FLEXIBILITY` tienen patrones de movimiento (`SQ`/`HI`/`PU`/`PL`/`IH`/`CA`) y combinaciones de equipamiento/contexto/dominio secundario mutuamente distintos. No se detecta ningún par o grupo con solapamiento de identidad. Ver justificación puntual en la sección C.

---

## C. CLASIFICACIÓN DEL TIPO DE DIFERENCIA

| Par/grupo | Clasificación | Justificación |
|---|---|---|
| #1 caminata_ritmo_moderado vs #2 caminata_vigorosa | **INTENSITY_ONLY** | Patrón, equipamiento, contexto y los 3 atributos de cribado (impact/balance/fall_risk) son idénticos. La única diferencia es la etiqueta de intensidad en el título. |
| #1/#2 (caminata base) vs #4 caminata_por_cuestas | **MIXED** (TERRAIN_DISTINCT + efecto INTENSITY_ONLY secundario) | El terreno inclinado cambia mecánica de zancada (inclinación de tronco, demanda de tobillo/cadera) y produce diferencias reales y persistentes en `impact_level`, `balance_requirement_level` y `fall_risk_relevant` — no es solo "caminar más fuerte", es un contexto de ejecución que altera atributos de cribado a nivel de identidad de movimiento. |
| #1/#2/#4 (caminata) vs #5 trote_suave | **BIOMECHANICALLY_DISTINCT** | La marcha (walking) y el trote (jogging) son ciclos de zancada biomecánicamente distintos — el trote incluye una fase aérea (ambos pies sin contacto) ausente en la marcha, lo cual ya se refleja en `impact_level` (LOW en caminata vs MODERATE en trote) de forma consistente y no arbitraria. |
| Familia caminata/trote vs #6 ciclismo_continuo | **EQUIPMENT_DISTINCT + BIOMECHANICALLY_DISTINCT** | Patrón se reduce a `LO` (sin `GA`, no hay ciclo de marcha), requiere equipamiento dedicado (bicicleta), cadena cinética cerrada distinta. |
| vs #7 natacion_continua | **ENVIRONMENT_DISTINCT + BIOMECHANICALLY_DISTINCT** | Medio acuático (contexto POOL exclusivo), patrón incluye tracción de tren superior (`PU`) y flotación (`PL`), sin apoyo de peso corporal — cadena cinética fundamentalmente distinta. |
| vs #8 remo_ergometro | **EQUIPMENT_DISTINCT + BIOMECHANICALLY_DISTINCT** | Patrón `HI`+`PL` (bisagra de cadera + tracción), sin componente de marcha, requiere ergómetro dedicado. |
| vs #9 nordic_walking | **EQUIPMENT_DISTINCT** | Comparte base de marcha (`GA`, `LO`) pero añade patrón de tracción de tren superior (`PU`, `PL`) mediante bastones — el equipamiento no es cosmético, cambia el patrón de movimiento registrado y añade `func: BAL`. |
| vs #10 baile_recreativo | **TECHNIQUE_DISTINCT** | Patrón incluye rotación (`RO`), vocabulario de movimiento coreografiado no reducible a marcha/trote continuo. |
| #11 sentadilla vs #16 zancadas | **BIOMECHANICALLY_DISTINCT** | Sentadilla es bilateral simétrica (`SQ` puro); zancadas añade componente de marcha/desplazamiento unilateral (`SQ`+`GA`), con `balance_requirement_level` HIGH vs MODERATE. |
| #11 sentadilla vs #28 sentarse_levantarse_silla | **EQUIPMENT_DISTINCT + TECHNIQUE_DISTINCT** | Tarea funcional específica anclada a un objeto (silla), patrón de referencia externo, contexto restringido a HOME — no es una simple regresión de sentadilla, es una habilidad funcional propia (ya representada correctamente como `EXERCISE` distinto, no como `EXERCISE_VARIANT` de sentadilla). |
| #12 bisagra_de_cadera_kb vs #25 movilidad_cadera_dirigida | **EQUIPMENT_DISTINCT + TECHNIQUE_DISTINCT** | Mismo patrón base (`HI`) pero uno es un movimiento de fuerza cargado (dominio RESISTANCE, equipamiento KB/DB) y el otro es movilidad activa sin carga (dominio FLEXIBILITY, `mobility_type: ACTIVE_MOBILITY`) — objetivos de entrenamiento y equipamiento distintos, no la misma identidad con distinta dosis. |
| #19 burpees vs #29 transicion_desde_el_suelo | **TECHNIQUE_DISTINCT** | Ambos multi-fase con patrones que incluyen `SQ`+`PU`, pero burpees incluye componente de salto/impacto (`impact: HIGH`, `training_format: HIIT`) mientras que transición de suelo es un patrón funcional controlado sin salto (`impact: LOW`) orientado a seguridad, no a acondicionamiento. |
| Resto de pares RESISTANCE/NEUROMOTOR no listados | **BIOMECHANICALLY_DISTINCT o EQUIPMENT_DISTINCT** | Cada patrón de movimiento (`PU`, `IH`, `CA`, etc.) y/o combinación equipamiento+contexto es único en el dataset — no se encontró ningún otro par candidato a fusión. |

Ninguna diferencia detectada fuera del Grupo 1 se clasifica como `INTENSITY_ONLY`, `DURATION_ONLY`, `VOLUME_ONLY`, `TIMING_ONLY` o `BEHAVIOURAL_CONTEXT_ONLY`.

---

## D. DECISIÓN POR OBJETO

| # | exercise_id actual | Decisión |
|---|---|---|
| 1 | caminata_ritmo_moderado | **MERGE** (en #2, → identidad única "caminata") |
| 2 | caminata_vigorosa | **MERGE** (base de la identidad única "caminata") |
| 4 | caminata_por_cuestas | **KEEP_AS_DISTINCT** |
| 5 | trote_suave | **KEEP_AS_DISTINCT** |
| 6 | ciclismo_continuo | **KEEP_AS_DISTINCT** |
| 7 | natacion_continua | **KEEP_AS_DISTINCT** |
| 8 | remo_ergometro | **KEEP_AS_DISTINCT** |
| 9 | nordic_walking | **KEEP_AS_DISTINCT** |
| 10 | baile_recreativo | **KEEP_AS_DISTINCT** |
| 11 | sentadilla | **KEEP_AS_DISTINCT** |
| 12 | bisagra_de_cadera_kb | **KEEP_AS_DISTINCT** |
| 13 | flexiones | **KEEP_AS_DISTINCT** |
| 14 | remo_con_carga | **KEEP_AS_DISTINCT** |
| 15 | plancha_isometrica | **KEEP_AS_DISTINCT** |
| 16 | zancadas | **KEEP_AS_DISTINCT** |
| 17 | farmer_carry | **KEEP_AS_DISTINCT** |
| 19 | burpees | **KEEP_AS_DISTINCT** |
| 25 | movilidad_cadera_dirigida | **KEEP_AS_DISTINCT** |
| 26 | equilibrio_unipodal | **KEEP_AS_DISTINCT** |
| 27 | marcha_en_tandem | **KEEP_AS_DISTINCT** |
| 28 | sentarse_levantarse_silla | **KEEP_AS_DISTINCT** |
| 29 | transicion_desde_el_suelo | **KEEP_AS_DISTINCT** |
| 37 | press_de_hombros | **KEEP_AS_DISTINCT** |
| 38 | elevacion_de_cadera_glutea | **KEEP_AS_DISTINCT** |
| 40 | subida_al_cajon_step_up | **KEEP_AS_DISTINCT** |

Ningún objeto se clasifica como `variant` (candidato a pasar a `EXERCISE_VARIANT` de otro) ni como `requires_decision` — el único caso de identidad ambigua real (#4, terreno) tiene una recomendación razonada (sección E), no una ambigüedad sin resolver.

---

## E. TERRAIN / ENVIRONMENT — PROPUESTA

No se propone crear un campo nuevo (`terrain_type`, `incline_context`, `environment_modifier`) en este momento. Razonamiento:

- Priorizando el modelo más simple: hoy solo existe **una** candidata con demanda de terreno distinta (`caminata_por_cuestas`), y ya tiene representación completa como `EXERCISE` propio con sus propios `impact_level`/`balance_requirement_level`/`fall_risk_relevant`. Inventar un campo formal para un único caso es sobre-ingeniería prematura.
- Si en el futuro aparecen más combinaciones terreno × movimiento base (p.ej. "trote por cuestas", "nordic walking por cuestas"), y la relación es sistemática (mismo delta de atributos aplicado a múltiples bases), **entonces** valdría la pena evaluar un modificador de contexto formal — pero no antes de tener esa evidencia de necesidad.
- El terreno **no** debe vivir en `SESSION_TEMPLATE` en este caso concreto, porque cambia atributos de cribado de seguridad a nivel `EXERCISE` (`fall_risk_relevant`, `impact_level`) que son responsabilidad de la capa de contenido, no de la capa de sesión/prescripción — mover "cuestas" a `SESSION_TEMPLATE` perdería esa señal de seguridad en el nivel donde el resto del esquema espera encontrarla.

**Recomendación explícita**: mantener `caminata_por_cuestas` como `EXERCISE` propio (sin cambios), sin crear campo de terreno nuevo. Queda para César confirmar o corregir este juicio, tal como se pidió no adoptarlo automáticamente.

---

## F. MAPPING: current_exercise_id → proposed_final_exercise_id

| current_exercise_id | proposed_final_exercise_id | Nota |
|---|---|---|
| exercise.cardiorespiratory.caminata_ritmo_moderado | exercise.cardiorespiratory.caminata | Fusionado — identidad única de marcha en llano |
| exercise.cardiorespiratory.caminata_vigorosa | exercise.cardiorespiratory.caminata | Fusionado — mismo objetivo que la fila anterior |
| exercise.cardiorespiratory.caminata_por_cuestas | exercise.cardiorespiratory.caminata_por_cuestas | Sin cambio |
| exercise.cardiorespiratory.trote_suave | exercise.cardiorespiratory.trote_suave | Sin cambio |
| exercise.cardiorespiratory.ciclismo_continuo | exercise.cardiorespiratory.ciclismo_continuo | Sin cambio |
| exercise.cardiorespiratory.natacion_continua | exercise.cardiorespiratory.natacion_continua | Sin cambio |
| exercise.cardiorespiratory.remo_ergometro | exercise.cardiorespiratory.remo_ergometro | Sin cambio |
| exercise.cardiorespiratory.nordic_walking | exercise.cardiorespiratory.nordic_walking | Sin cambio |
| exercise.cardiorespiratory.baile_recreativo | exercise.cardiorespiratory.baile_recreativo | Sin cambio |
| exercise.resistance.sentadilla … exercise.resistance.subida_al_cajon_step_up (16 objetos RESISTANCE) | sin cambio | Sin cambio en los 16 |
| exercise.flexibility.movilidad_cadera_dirigida | exercise.flexibility.movilidad_cadera_dirigida | Sin cambio |
| exercise.neuromotor.equilibrio_unipodal / marcha_en_tandem / sentarse_levantarse_silla | sin cambio | Sin cambio en los 3 |

El nuevo identificador propuesto `exercise.cardiorespiratory.caminata` sustituye a `caminata_ritmo_moderado` como identidad base; `caminata_vigorosa` queda deprecado (su `provenance_trace` original, candidata #2, se conservaría dentro del objeto fusionado como referencia histórica adicional, no se pierde).

---

## G. IMPACTO EN LAS 20 EXERCISE_VARIANT EXISTENTES

**Ninguno.** Verificado contra el JSON actual: ninguna de las 20 `EXERCISE_VARIANT` tiene `base_exercise_id` apuntando a `caminata_ritmo_moderado` ni a `caminata_vigorosa` (consistente con la decisión ya aprobada de que las 9 familias cardiorrespiratorias continuas tienen 0 variantes). La fusión propuesta en la sección F no generaría ninguna referencia huérfana ni requeriría reescribir ningún `base_exercise_id` existente.

---

## H. IMPACTO CONCEPTUAL EN FUTURE GAMIFICATION BINDINGS

No se diseña autorización DVG en este documento. Conceptualmente: la fusión propuesta es compatible con el modelo de binding de gamificación ya aprobado (1 `EXERCISE` → N `canonical_action` bindings con distintas condiciones de ejecución). Un único `exercise.cardiorespiratory.caminata` podría tener, en el futuro, bindings distintos hacia acciones como "caminata moderada" y "caminata vigorosa" del catálogo `movement.*`/`adherence.movement.*` (`CANONICAL v1.0`, sin modificar), distinguidos por condiciones de ejecución a nivel `PRESCRIPTION`/`EXECUTION` (p.ej. `training_intensity` de la sesión) — no por la existencia de dos `EXERCISE` distintos. Esto es exactamente el patrón que el esquema ya preveía para separar identidad de movimiento de dosis, y confirma que la fusión no rompe la capacidad de distinguir acciones gamificadas.

---

## I. RECUENTO ESPERADO FINAL DE EXERCISE BASE

| | Cantidad |
|---|---|
| `EXERCISE` en el Pilot actual | 25 |
| Fusiones propuestas | 1 (candidatas #1+#2 → 1 identidad) |
| **`EXERCISE` base esperado tras canonicalización** | **24** |

Este recuento **no incluye** #30 (`entrenamiento_reactivo_de_pasos`), que queda confirmado como `EXERCISE` pero explícitamente fuera del Pilot hasta la siguiente iteración según instrucción de esta misma ronda.

---

## RESUMEN DE DECISIONES QUE REQUIEREN CONFIRMACIÓN DE CÉSAR

1. Fusionar #1 (`caminata_ritmo_moderado`) + #2 (`caminata_vigorosa`) en una única identidad `exercise.cardiorespiratory.caminata`, representando "moderada"/"vigorosa" como `training_intensity` en `SESSION_TEMPLATE`/`PRESCRIPTION`, no en `EXERCISE`.
2. Mantener `caminata_por_cuestas` (#4) como `EXERCISE` distinto, sin crear un campo de terreno formal todavía.
3. Ningún otro cambio de identidad propuesto en las 22 candidatas restantes.

Ningún cambio se ha aplicado al JSON. Esta auditoría es una propuesta para la siguiente iteración de canonicalización.

---

## FINAL STATUS

```
READY_FOR_LIBRARY_CANONICALIZATION
```

Se detecta exactamente un caso de solapamiento de identidad (#1/#2), resuelto con una recomendación clara y de bajo impacto (0 variantes afectadas, 0 referencias huérfanas). El caso de terreno (#4) se audita y se resuelve con una recomendación razonada, no como conflicto sin resolver. No se declara `IDENTITY_CONFLICT_REQUIRES_GOVERNANCE` porque no hay ninguna ambigüedad estructural sin una propuesta concreta de resolución.

Me detengo aquí, como se instruyó, a la espera de tu confirmación antes de aplicar cualquier cambio al JSON.
