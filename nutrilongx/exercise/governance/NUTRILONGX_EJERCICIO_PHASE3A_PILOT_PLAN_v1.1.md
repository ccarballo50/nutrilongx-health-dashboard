# NUTRILONGX — Ejercicio: Plan de Piloto Fase 3A v1.1 (post Entity Purity Pass)

Fecha: 2026-08-18. Actualiza `NUTRILONGX_EJERCICIO_PHASE3A_PILOT_PLAN_v1.md` (aprobado como matriz de cobertura, no como lista literal de 40 `EXERCISE`) incorporando el resultado del Entity Purity Pass documentado en `NUTRILONGX_EJERCICIO_ENTITY_CLASSIFICATION_v1.md`. Cero pérdida de trazabilidad: las 40 candidatas originales se conservan todas, reclasificadas donde corresponde. No se genera ningún JSON real en este documento.

---

## A. EXERCISE — retenidos para Fase 3A (26)

| original_candidate_number | original_name | final_entity_class | canonical_candidate_name | reason_for_classification | destination_phase |
|---|---|---|---|---|---|
| 1 | caminata_ritmo_moderado | `EXERCISE` | caminata_ritmo_moderado | Movimiento atómico continuo | Fase 3A |
| 2 | caminata_vigorosa | `EXERCISE` | caminata_vigorosa | Movimiento atómico continuo | Fase 3A |
| 4 | caminata_por_cuestas | `EXERCISE` | caminata_por_cuestas | Movimiento atómico continuo | Fase 3A |
| 5 | trote_suave | `EXERCISE` | trote_suave | Movimiento atómico continuo | Fase 3A |
| 6 | ciclismo_continuo | `EXERCISE` | ciclismo_continuo | Movimiento atómico continuo | Fase 3A |
| 7 | natacion_continua | `EXERCISE` | natacion_continua | Movimiento atómico continuo | Fase 3A |
| 8 | remo_ergometro | `EXERCISE` | remo_ergometro | Movimiento atómico continuo | Fase 3A |
| 9 | nordic_walking | `EXERCISE` | nordic_walking | Movimiento atómico continuo (requiere `TREKKING_POLES`, ya añadido al vocabulario) | Fase 3A |
| 10 | baile_recreativo | `EXERCISE` | baile_recreativo | Movimiento atómico continuo | Fase 3A |
| 11 | sentadilla | `EXERCISE` | sentadilla | Patrón fundacional atómico, repetido | Fase 3A |
| 12 | bisagra_de_cadera_kb | `EXERCISE` | bisagra_de_cadera_kb | Patrón fundacional atómico, repetido | Fase 3A |
| 13 | flexiones | `EXERCISE` | flexiones | Patrón fundacional atómico, repetido | Fase 3A |
| 14 | remo_con_carga | `EXERCISE` | remo_con_carga | Patrón fundacional atómico, repetido | Fase 3A |
| 15 | plancha_isometrica | `EXERCISE` | plancha_isometrica | Movimiento atómico isométrico | Fase 3A |
| 16 | zancadas | `EXERCISE` | zancadas | Patrón fundacional atómico, repetido | Fase 3A |
| 17 | farmer_carry | `EXERCISE` | farmer_carry | Movimiento atómico, único patrón `CARRY` puro | Fase 3A |
| 19 | burpees | `EXERCISE` | burpees | Multi-fase pero integrado/continuo, catalogado convencionalmente como un ejercicio | Fase 3A |
| 25 | movilidad_cadera_dirigida | `EXERCISE` | movilidad_cadera_dirigida | "Dirigida" indica movimiento único, no serie plural (caso límite documentado en Entity Classification §6) | Fase 3A |
| 26 | equilibrio_unipodal | `EXERCISE` | equilibrio_unipodal | Movimiento atómico, único patrón repetido | Fase 3A |
| 27 | marcha_en_tandem | `EXERCISE` | marcha_en_tandem | Movimiento atómico | Fase 3A |
| 28 | sentarse_levantarse_silla | `EXERCISE` | sentarse_levantarse_silla | Movimiento atómico, único patrón repetido | Fase 3A |
| 29 | transicion_desde_el_suelo | `EXERCISE` | transicion_desde_el_suelo | Multi-fase pero integrado/continuo, mismo criterio que burpee | Fase 3A |
| 37 | press_de_hombros | `EXERCISE` | press_de_hombros | Patrón fundacional atómico, repetido | Fase 3A |
| 38 | elevacion_de_cadera_glutea | `EXERCISE` | elevacion_de_cadera_glutea | Patrón fundacional atómico, repetido | Fase 3A |
| 39 | remo_en_maquina_guiada | `EXERCISE` (con nota) | remo_en_maquina_guiada | Movimiento atómico legítimo, pero **recomendado fusionar como `EXERCISE_VARIANT` de #14** en la construcción real (ver Entity Classification §5) — no es reclasificación de clase, es nota de catalogación | Fase 3A (con decisión de fusión pendiente) |
| 40 | subida_al_cajon_step_up | `EXERCISE` | subida_al_cajon_step_up | Movimiento atómico, único patrón repetido | Fase 3A |

**Subtotal: 26 `EXERCISE`.**

---

## B. SESSION_TEMPLATE — diferidos a Fase 3C (7)

| original_candidate_number | original_name | final_entity_class | canonical_candidate_name | reason_for_classification | destination_phase |
|---|---|---|---|---|---|
| 18 | sesion_fuerza_full_body | `SESSION_TEMPLATE` | sesion_fuerza_full_body | Combinación de varios ejercicios (sentadilla+bisagra+press+remo) | Fase 3C |
| 20 | sprints_intervalos | `SESSION_TEMPLATE` | sprints_intervalos | Protocolo de trabajo/descanso, no un movimiento — **gap**: falta `EXERCISE` atómico "sprint" | Fase 3C (bloqueado por gap #1, sección D) |
| 21 | movilidad_articular_general | `SESSION_TEMPLATE` | movilidad_articular_general | "Serie" = combinación de varios movimientos de distintas articulaciones — **gap**: movimientos atómicos no definidos | Fase 3C (bloqueado por gap #2) |
| 22 | yoga_fluido | `SESSION_TEMPLATE` | yoga_fluido | "Flow" = secuencia de posturas distintas — **gap**: posturas atómicas no definidas | Fase 3C (bloqueado por gap #3, o decisión de no descomponer) |
| 23 | estiramiento_estatico_grandes_grupos | `SESSION_TEMPLATE` | estiramiento_estatico_grandes_grupos | "Grandes grupos" (plural) = combinación de varios estiramientos — **gap**: estiramientos atómicos no definidos | Fase 3C (bloqueado por gap #4) |
| 24 | movilidad_dinamica_calentamiento | `SESSION_TEMPLATE` (subtipo calentamiento) | movilidad_dinamica_calentamiento | Combinación de movimientos preparatorios — **gap**: movimientos atómicos no definidos | Fase 3C (bloqueado por gap #5) |
| 32 | circuito_multicomponente_equilibrio_fuerza | `SESSION_TEMPLATE` | circuito_multicomponente_equilibrio_fuerza | "Circuito" — combinación estructurada explícita de varios ejercicios de distintos dominios | Fase 3C |

**Subtotal: 7 `SESSION_TEMPLATE` diferidos.**

---

## C. BEHAVIOURAL_CONTENT (5)

| original_candidate_number | original_name | final_entity_class | canonical_candidate_name | reason_for_classification | destination_phase |
|---|---|---|---|---|---|
| 3 | caminata_postprandial | `BEHAVIOURAL_CONTENT` | caminata_postprandial | Mismo movimiento que #1, distinguido solo por timing/contexto clínico (DM2) — referencia `EXERCISE` #1 | Fase futura no numerada — ver sección E |
| 33 | pausa_activa_breve | `BEHAVIOURAL_CONTENT` | pausa_activa_breve | Patrón de comportamiento genérico, sin movimiento único referenciable | Fase futura no numerada |
| 34 | snack_de_movimiento_sentadillas | `BEHAVIOURAL_CONTENT` | snack_de_movimiento_sentadillas | Patrón de comportamiento que referencia `EXERCISE` #11 (sentadilla) | Fase futura no numerada |
| 35 | subir_escaleras_breve | `BEHAVIOURAL_CONTENT` | subir_escaleras_breve | Patrón de comportamiento — **gap**: sin `EXERCISE` atómico limpio al que referenciar (ver `OTHER_REQUIRES_DECISION` sub-nota, Entity Classification §3) | Fase futura no numerada |
| 36 | caminata_acumulada_por_pasos | `BEHAVIOURAL_CONTENT` | caminata_acumulada_por_pasos | Mismo movimiento que #1, distinguido por acumulación fragmentada por pasos — referencia `EXERCISE` #1 | Fase futura no numerada |

**Subtotal: 5 `BEHAVIOURAL_CONTENT`.**

**Nota de fase**: `BEHAVIOURAL_CONTENT` es un tipo de entidad recién formalizado en `MASTER_SCHEMA_v1.2.md` — no existía una fase asignada para su construcción en el plan Fase 3A–3E original (que solo cubría vocabularios+biblioteca, seguridad, sesiones, programas, build). Se deja explícitamente como decisión pendiente de César si merece su propia sub-fase (p.ej. "Fase 3F — Behavioural Content Library") o se incorpora dentro de una fase existente.

---

## D. OTHER_REQUIRES_DECISION (2)

| original_candidate_number | original_name | final_entity_class | canonical_candidate_name | reason_for_classification | destination_phase |
|---|---|---|---|---|---|
| 30 | entrenamiento_reactivo_de_pasos | `OTHER_REQUIRES_DECISION` | entrenamiento_reactivo_de_pasos | Ambigüedad genuina: ¿movimiento único repetido o combinación de patrones reactivos distintos? | Pendiente de decisión antes de asignar fase |
| 31 | escalera_de_agilidad | `OTHER_REQUIRES_DECISION` | escalera_de_agilidad | El nombre describe el equipamiento/formato, no un movimiento — caben múltiples patrones de pisada distintos bajo el mismo nombre | Pendiente de decisión antes de asignar fase |

**Subtotal: 2 `OTHER_REQUIRES_DECISION`.**

---

## E. GAPS DE ENTIDAD ATÓMICA DETECTADOS (no forman parte del recuento de 40, se listan por transparencia)

1. `EXERCISE` "sprint" — requerido por B/#20.
2. Movimientos individuales de movilidad articular — requeridos por B/#21.
3. Posturas de yoga individuales — requeridos por B/#22 (o decisión de no descomponer).
4. Estiramientos individuales por grupo muscular — requeridos por B/#23.
5. Movimientos individuales de calentamiento dinámico — requeridos por B/#24.
6. `EXERCISE` atómico de subida de escalones real (distinto de #40, step-up con cajón) — potencialmente requerido por C/#35.

Ninguno de estos 6 gaps se resuelve en este documento — quedan como trabajo pendiente para cuando se aborden las fases correspondientes (3C para los primeros 5, decisión de contenido para el 6º).

---

## F. RECUENTO FINAL

| Clase | Cantidad |
|---|---|
| `EXERCISE` (Fase 3A) | **26** |
| `SESSION_TEMPLATE` (Fase 3C, diferidos) | **7** |
| `BEHAVIOURAL_CONTENT` (fase a definir) | **5** |
| `OTHER_REQUIRES_DECISION` (pendiente) | **2** |
| `PROGRAM_TEMPLATE` | **0** |
| **Total auditado** | **40/40** |
