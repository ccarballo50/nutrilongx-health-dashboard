# NUTRILONGX — Ejercicio: Investigación Dirigida Fase 3B-R

Fecha: 2026-08-18. Investigación estrictamente acotada a los 6 gaps retenidos en `NUTRILONGX_EJERCICIO_RESEARCH_REQUIRED_RETAINED_v1.md`. No se ha ensanchado a ejercicio general. Jerarquía de fuentes aplicada: GUIDELINE > CONSENSUS > SYSTEMATIC_REVIEW > META_ANALYSIS > PRIMARY_STUDY. Ningún `safety_rule` real se genera en este documento — solo hallazgos e implicaciones propuestas, pendientes de traducción formal a `safety_rule` en una fase posterior con aprobación explícita.

---

## Gap 1 — Entrenamiento reactivo de equilibrio/perturbación y escalera de agilidad

**research_question**: ¿Qué evidencia respalda la eficacia y seguridad del entrenamiento reactivo de equilibrio/perturbación y del entrenamiento con escalera de agilidad, más allá de la recomendación general multicomponente de equilibrio?

**population**: Adultos mayores en riesgo de caída; en menor medida, adultos con fragilidad.

**intervention/attribute**: (a) Entrenamiento reactivo/de perturbación (reactive step/perturbation training); (b) escalera de agilidad (agility ladder drills).

**sources_found**:
- 3 revisiones sistemáticas/meta-análisis independientes (2022–2025) sobre entrenamiento reactivo/perturbación y reducción de caídas.
- Para escalera de agilidad: evidencia dispersa, solo estudios primarios pequeños en población no-frágil.

**classification**: SYSTEMATIC_REVIEW / META_ANALYSIS (perturbación); PRIMARY_STUDY dispersos (agilidad, sin SR dedicado).

**findings**: El entrenamiento reactivo/de perturbación muestra reducción de caídas de aproximadamente 20–35% en las 3 revisiones, consistente con protocolos de **una sola técnica reactiva entregada de forma repetida** (p.ej. perturbaciones de traslación en cinta o plataforma). Existe una señal de seguridad real: una de las revisiones reporta una tasa de eventos adversos del 29% en el grupo de intervención frente al 20% en control (caídas/casi-caídas durante el propio entrenamiento). La escalera de agilidad carece de revisión sistemática dedicada; la evidencia disponible es de estudios primarios pequeños, no en población frágil, y describe protocolos de **circuito multi-patrón** (varios patrones de pisada distintos en la misma sesión).

**consistency**: Alta consistencia entre las 3 fuentes de perturbación en dirección del efecto (reducción de caídas); consistencia baja/no evaluable para escalera de agilidad por escasez de fuentes.

**limitations**: Ninguna fuente fue específica para población con fragilidad severa u osteoporosis. El componente de seguridad (señal de eventos adversos) requiere supervisión profesional, no está estudiado en formato no supervisado/domiciliario.

**applicability_to_NUTRILONGX**: Relevante directamente para #30 (`entrenamiento_reactivo_de_pasos`) y #31 (`escalera_de_agilidad`).

**proposed_schema_or_safety_implication**: Cualquier `safety_rule` futura para entrenamiento reactivo debería incluir una bandera de supervisión obligatoria (no autoentrenamiento no supervisado) dado el señal de eventos adversos. No se propone la redacción del `safety_rule` en este documento — solo se deja constancia de la implicación para cuando se aborde Fase 3B real.

**gap_is_resolved**: **PARTIALLY_RESOLVED** — resuelto para entrenamiento reactivo/perturbación (evidencia SR/MA consistente, aunque con matiz de seguridad); **UNRESOLVED** para escalera de agilidad (evidencia insuficiente, sin SR dedicada).

---

## Gap 2 — Transición desde el suelo entrenable (#29)

**research_question**: ¿Qué evidencia respalda un protocolo de entrenamiento específico y la seguridad de la transición suelo↔bipedestación como ejercicio entrenable?

**population**: Adultos mayores, con foco en prevención de "long-lie" tras caída.

**intervention/attribute**: Entrenamiento estructurado de la capacidad de levantarse del suelo.

**sources_found**: Leonhardt et al. 2020 (revisión sistemática); Hofmeyer 2002 (RCT); un ensayo piloto aleatorizado de 2026 publicado en *Age and Ageing*.

**classification**: SYSTEMATIC_REVIEW (Leonhardt 2020); PRIMARY_STUDY (Hofmeyer 2002, piloto RCT 2026).

**findings**: La revisión sistemática y los dos ensayos coinciden en que la capacidad de transición suelo-bipedestación es entrenable con práctica estructurada y mejora medible en semanas. El ensayo piloto de 2026 aporta datos sobre protocolo de progresión (apoyo en mobiliario → sin apoyo) consistente con la variante `REGRESSION` ya incluida en este build (`transicion_suelo_con_apoyo_mobiliario`).

**consistency**: Alta — las 3 fuentes apuntan en la misma dirección (entrenable, seguro con progresión supervisada).

**limitations**: Muestras pequeñas en los ensayos primarios; el piloto 2026 aún no replicado.

**applicability_to_NUTRILONGX**: Directa — #29 ya está construido como `EXERCISE` en este pilot, con una variante `REGRESSION` con apoyo de mobiliario.

**proposed_schema_or_safety_implication**: La `PROGRESSION_CLAIM` de #29 y su variante podría pasar a `SOURCE_BACKED` citando Leonhardt 2020 en una iteración posterior tras validación humana — no se modifica en este build para no adelantar una revisión científica formal fuera de proceso.

**gap_is_resolved**: **PARTIALLY_RESOLVED** — la entrenabilidad general está bien respaldada; faltan parámetros de dosis (frecuencia/duración óptima) específicos para population frágil.

---

## Gap 3 — Parámetros de dosis del "loaded carry" (#17)

**research_question**: ¿Qué parámetros de dosis (carga, distancia, frecuencia) son apropiados para el "farmer carry"/loaded carry?

**population**: Adultos sanos en general; población con fragilidad, sin datos específicos.

**intervention/attribute**: Carga y transporte (loaded carry).

**sources_found**: Winwood et al. 2019 (revisión sistemática sobre biomecánica y aplicaciones de ejercicios "strongman"); material de práctica profesional NSCA.

**classification**: SYSTEMATIC_REVIEW (Winwood 2019); material de organización profesional (NSCA, no clasificado como GUIDELINE por no ser una guía formal revisada por pares).

**findings**: Para adultos sanos en general existen rangos de dosis razonablemente descritos (carga relativa al peso corporal, distancias típicas de trabajo). Para población con fragilidad no existe evidencia específica sobre dosis segura — es una laguna real, no solo de cantidad de fuentes sino de ausencia de estudios dirigidos a esa población.

**consistency**: N/A para población frágil (sin fuentes que comparar).

**limitations**: Ninguna fuente aborda directamente fragilidad/osteoporosis/adultos muy desacondicionados.

**applicability_to_NUTRILONGX**: Directa para #17 en cuanto a adultos sanos; la laguna en fragilidad es relevante para cualquier `safety_rule` de dosis en perfiles clínicos de riesgo.

**proposed_schema_or_safety_implication**: `DOSAGE_FITT_VP` de #17 podría citar Winwood 2019 para el rango general en adultos sanos en una iteración posterior. Para perfiles frágiles, la implicación es NO fijar un rango de dosis sin evidencia — dejar `SOURCE_NOT_IDENTIFIED` explícito en ese segmento, no inferir un rango "conservador" no respaldado.

**gap_is_resolved**: **PARTIALLY_RESOLVED** (adultos sanos en general) / **UNRESOLVED** (población frágil específicamente).

---

## Gap 4 — Seguridad de HIIT en fragilidad/edad avanzada/oncología (#19 y futuro #20)

**research_question**: ¿Es seguro el formato `training_format: HIIT` en fragilidad, edad avanzada muy desacondicionada, y en supervivientes de cáncer?

**population**: Adultos mayores frágiles; pacientes/supervivientes oncológicos.

**intervention/attribute**: Entrenamiento interválico de alta intensidad.

**sources_found**: ICFSR 2021 y actualización 2024 (consenso internacional sobre fragilidad y sarcopenia); Párraga-Montilla et al. 2024 (revisión sistemática); Palma et al. 2021 (revisión sistemática/meta-análisis); Wewege et al. 2018 (revisión sistemática, datos de rehabilitación cardíaca usados como proxy de seguridad en poblaciones de riesgo cardiovascular).

**classification**: CONSENSUS (ICFSR); SYSTEMATIC_REVIEW / META_ANALYSIS (Párraga-Montilla 2024, Palma 2021, Wewege 2018).

**findings**: El consenso ICFSR y las revisiones sistemáticas coinciden en que HIIT modificado (intensidad y duración de intervalo ajustadas, no HIIT "estándar" de alta intensidad pico) puede ser seguro y eficaz en fragilidad cuando está supervisado y progresado gradualmente. Los datos de rehabilitación cardíaca (Wewege 2018) muestran tasas de eventos adversos bajas en poblaciones de riesgo cardiovascular supervisadas, usados aquí como evidencia proxy (no específica de fragilidad) para la seguridad general del formato interválico en poblaciones de riesgo.

**consistency**: Alta consistencia en la necesidad de modificar/individualizar el protocolo HIIT en estas poblaciones; ninguna fuente respalda HIIT "estándar" sin modificación.

**limitations**: Ninguna fuente es específica para oncología activa (solo supervivientes/post-tratamiento); Wewege 2018 es proxy cardiovascular, no fragilidad ni oncología directamente.

**applicability_to_NUTRILONGX**: Directa para #19 (`burpees`, ya marcado `training_format: HIIT`) y para el futuro `SESSION_TEMPLATE` #20 (`sprints_intervalos`) en Fase 3C.

**proposed_schema_or_safety_implication**: Cualquier `safety_rule` futura para `training_format: HIIT` en perfiles de fragilidad/oncología debería exigir modificación de intensidad/duración de intervalo y supervisión, no prohibición categórica — consistente con la evidencia de que HIIT modificado es viable. No se redacta el `safety_rule` aquí.

**gap_is_resolved**: **PARTIALLY_RESOLVED** — bien respaldado para HIIT modificado y supervisado; no resuelto para HIIT no modificado o para oncología activa (no post-tratamiento).

---

## Gap 5 — Umbrales de carga de impacto en osteopenia/osteoporosis postmenopáusica

**research_question**: ¿Qué umbrales de carga de impacto son seguros (supervisados vs. no supervisados) en osteopenia/osteoporosis postmenopáusica?

**population**: Mujeres postmenopáusicas con osteopenia u osteoporosis diagnosticada.

**intervention/attribute**: `impact_level` transversal a múltiples `EXERCISE` de `RESISTANCE` (zancadas, step-up, elevación de cadera glútea, entre otros).

**sources_found**: Consenso "Strong, Steady and Straight" (Reino Unido, 2022); revisión narrativa 2025 sobre entrenamiento de impacto de alta intensidad resistida (HiRIT); estudio piloto 2020 sobre salto domiciliario (home-hopping); meta-análisis 2022.

**classification**: CONSENSUS (Strong Steady and Straight 2022); revisión narrativa 2025 (no clasificada como SYSTEMATIC_REVIEW formal); PRIMARY_STUDY (piloto 2020); META_ANALYSIS (2022).

**findings**: Existe respaldo consistente para impacto **moderado** (marcha rápida, subida de escalones, saltos de baja amplitud supervisados) como seguro y beneficioso para densidad mineral ósea en esta población. La laguna real está en umbrales para **carga de resistencia pesada combinada con impacto** (p.ej. zancadas cargadas con salto, HiRIT a intensidad alta) — la revisión narrativa 2025 señala protocolos prometedores pero con supervisión estrecha, no umbrales validados para uso no supervisado.

**consistency**: Alta para impacto moderado; baja/insuficiente para impacto alto combinado con carga externa pesada.

**limitations**: Ausencia de un umbral cuantitativo único válido para todas las variantes (depende de T-score, historial de fractura, no solo del ejercicio).

**applicability_to_NUTRILONGX**: Transversal — afecta el campo `impact_level` de zancadas (#16 y su variante `LOAD_VARIANT`), step-up (#40), elevación de cadera glútea (#38), entre otros ya presentes en este pilot.

**proposed_schema_or_safety_implication**: Cualquier `safety_rule` de impacto en osteoporosis debería distinguir impacto MODERATE (generalmente permitido con adaptación) de impacto HIGH combinado con carga externa (requiere evaluación individualizada, no umbral genérico). No se fija ningún umbral numérico en este documento.

**gap_is_resolved**: **PARTIALLY_RESOLVED** — resuelto para impacto moderado; no resuelto para impacto alto con carga de resistencia pesada.

---

## Gap 6 — Cuantificación de presión arterial/esfuerzo isométrico en HTA

**research_question**: ¿Cómo se cuantifica la respuesta de presión arterial según intensidad/duración de esfuerzo isométrico, en relación con hipertensión arterial (HTA)?

**population**: Adultos con HTA o riesgo cardiovascular elevado.

**intervention/attribute**: Esfuerzo isométrico (plancha, bisagra de cadera cargada, press de hombros overhead) e `isometric_effort_level`/`valsalva_risk_relevant`.

**sources_found**: MacDougall et al. 1985 (estudio clásico de respuesta de presión arterial a ejercicio de resistencia pesada); revisión sistemática 2024 en *Sports Medicine* con cifras cuantificadas de presión arterial sistólica; meta-análisis 2023 en *British Journal of Sports Medicine* sobre beneficio crónico del entrenamiento isométrico; estudio pequeño (n=12) en pacientes hipertensos.

**classification**: PRIMARY_STUDY (MacDougall 1985; estudio n=12); SYSTEMATIC_REVIEW (Sports Medicine 2024); META_ANALYSIS (BJSM 2023).

**findings**: MacDougall 1985 documenta picos de presión arterial sistólica muy elevados durante esfuerzo isométrico máximo con maniobra de Valsalva (cifras históricas que fundamentan la precaución clínica estándar). La revisión de 2024 aporta cifras más recientes y graduadas por intensidad relativa del esfuerzo isométrico, confirmando una relación dosis-respuesta entre intensidad/duración del esfuerzo isométrico y elevación aguda de presión arterial. En contraste, el meta-análisis de BJSM 2023 muestra que el entrenamiento isométrico regular y bien dosificado (no el pico agudo) se asocia a **reducción crónica** de presión arterial en reposo — es decir, el riesgo agudo intra-sesión y el beneficio crónico coexisten y no se contradicen. El estudio pequeño en pacientes hipertensos (n=12) es consistente pero insuficiente para generalizar.

**consistency**: Alta consistencia entre las 4 fuentes en la relación intensidad/duración → magnitud de respuesta aguda de PA; consistencia también alta en el beneficio crónico del entrenamiento bien dosificado.

**limitations**: El estudio en pacientes hipertensos reales es muy pequeño (n=12); la mayoría de la cuantificación aguda proviene de sujetos sanos, extrapolada a HTA.

**applicability_to_NUTRILONGX**: Directa para #15 (`plancha_isometrica`), #12 (`bisagra_de_cadera_kb`), #37 (`press_de_hombros`, patrón overhead) — los 3 ya marcados `valsalva_risk_relevant: true` en este pilot.

**proposed_schema_or_safety_implication**: Respalda la existencia formal de `isometric_effort_level` (a nivel `SESSION_TEMPLATE`, ya en el esquema v1.2) como el lugar correcto para graduar dosis, en vez de en `EXERCISE`. Una futura `safety_rule` para HTA podría diferenciar esfuerzo isométrico breve/submáximo (probablemente PRECAUTION con técnica de respiración) de esfuerzo isométrico máximo/sostenido con Valsalva (probablemente RELATIVE_CONTRAINDICATION sin control médico). No se redacta la regla aquí.

**gap_is_resolved**: **PARTIALLY_RESOLVED** — la relación dosis-respuesta aguda y el beneficio crónico están bien cuantificados en fuentes de buen nivel; falta validación específica en muestras grandes de pacientes hipertensos reales.

---

## RESUMEN

| Gap | Estado |
|---|---|
| 1a. Entrenamiento reactivo/perturbación | PARTIALLY_RESOLVED |
| 1b. Escalera de agilidad | UNRESOLVED |
| 2. Transición desde el suelo (#29) | PARTIALLY_RESOLVED |
| 3. Loaded carry, adultos sanos (#17) | PARTIALLY_RESOLVED |
| 3. Loaded carry, población frágil | UNRESOLVED |
| 4. HIIT modificado/supervisado en fragilidad-oncología | PARTIALLY_RESOLVED |
| 4. HIIT no modificado / oncología activa | UNRESOLVED |
| 5. Impacto moderado en osteoporosis | PARTIALLY_RESOLVED |
| 5. Impacto alto + carga pesada en osteoporosis | UNRESOLVED |
| 6. PA/esfuerzo isométrico en HTA | PARTIALLY_RESOLVED |

Ningún gap se declara `RESOLVED` sin calificar — en todos los casos persiste al menos un sub-aspecto sin evidencia suficiente, reportado honestamente como tal. Ningún `safety_rule` real se ha generado en este documento.

---

## FINAL STATUS

```
READY_FOR_GOVERNANCE_REVIEW
```

Los 6 gaps han sido investigados dentro de su alcance estricto, sin ensanchar a ejercicio general. Los hallazgos quedan disponibles como insumo para la construcción real de `safety_rule` en Fase 3B, pendiente de autorización explícita de César.
