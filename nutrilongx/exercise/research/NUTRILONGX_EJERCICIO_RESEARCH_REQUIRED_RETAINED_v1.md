# NUTRILONGX — Ejercicio: Research Required — Retención post Entity Purity Pass

Fecha: 2026-08-18. Revisa los 6 `NEW_RESEARCH_REQUIRED` de `NUTRILONGX_EJERCICIO_PHASE3B_SAFETY_COVERAGE_PLAN_v1.md` contra el resultado del Entity Purity Pass (`NUTRILONGX_EJERCICIO_ENTITY_CLASSIFICATION_v1.md`) para determinar cuáles siguen vigentes para las entidades realmente conservadas. No se realiza investigación en este documento — solo se re-evalúa la relevancia. La investigación dedicada (Fase 3B-R) es un paso posterior, no ejecutado aquí.

---

## Resultado: LOS 6 GAPS SIGUEN VIGENTES — ninguno se elimina

| # | Gap original | Familia(s) asociada(s) original(es) | Clase final tras el Entity Purity Pass | ¿Sigue vigente? | Nota |
|---|---|---|---|---|---|
| 1 | Entrenamiento reactivo de equilibrio/perturbación y escalera de agilidad — eficacia/seguridad más allá de la recomendación general multicomponente | #30 `entrenamiento_reactivo_de_pasos`, #31 `escalera_de_agilidad` | `OTHER_REQUIRES_DECISION` (ambas) | **RETAINED_CONDITIONAL** | La necesidad de investigación no desaparece por la ambigüedad de clase — al contrario, resolver la pregunta científica podría incluso ayudar a resolver la clasificación (p.ej. si la evidencia describe protocolos multi-patrón, refuerza `SESSION_TEMPLATE`; si describe una técnica única, refuerza `EXERCISE`). Se marca condicional a la resolución de la clasificación, no descartado. |
| 2 | Protocolo de entrenamiento específico y seguridad de la transición suelo↔bipedestación como ejercicio entrenable | #29 `transicion_desde_el_suelo` | `EXERCISE` (confirmado, retenido en Fase 3A) | **RETAINED** | Aplicabilidad directa y sin cambios — #29 se construirá como `EXERCISE` real en Fase 3A y necesitará esta investigación antes de poder alcanzar `SCIENTIFICALLY_REVIEWED` en las categorías `PROGRESSION_CLAIM`/`SAFETY_CONTRAINDICATION_ADAPTATION`. |
| 3 | Parámetros de dosis (carga, distancia, frecuencia) del "loaded carry"/farmer carry | #17 `farmer_carry` | `EXERCISE` (confirmado, retenido en Fase 3A) | **RETAINED** | Sin cambios — aplicabilidad directa. |
| 4 | Seguridad de `training_format: HIIT` en fragilidad/edad avanzada muy desacondicionada/oncología | #19 `burpees` (`EXERCISE`, HIIT), #20 `sprints_intervalos` (ahora `SESSION_TEMPLATE`) | `EXERCISE` (#19) + `SESSION_TEMPLATE` diferido a Fase 3C (#20) | **RETAINED** | Sigue vigente para #19 en Fase 3A inmediatamente, y para #20 cuando se aborde Fase 3C — el cambio de clase de #20 no elimina la necesidad de la investigación, solo cambia el momento en que se necesitará con urgencia. |
| 5 | Umbrales de carga de impacto seguros (supervisado vs. no supervisado) en osteopenia/osteoporosis postmenopáusica | Transversal — aplica a `impact_level` en múltiples `EXERCISE` de `RESISTANCE` (zancadas #16, step-up #40, elevación de cadera glútea #38, entre otros) | Sin cambio — sigue siendo transversal, no atado a una única familia | **RETAINED** | No estaba atado a ninguna de las 9 familias señaladas para reclasificación — su vigencia es independiente del Entity Purity Pass. |
| 6 | Cuantificación de la respuesta de presión arterial por intensidad/duración de esfuerzo isométrico (HTA) | #15 `plancha_isometrica`, #12 `bisagra_de_cadera_kb` (carga pesada), #37 `press_de_hombros` (overhead) | Todas `EXERCISE` (confirmadas, retenidas en Fase 3A) | **RETAINED** | Sin cambios — aplicabilidad directa, especialmente relevante ahora que `isometric_effort_level` y `valsalva_risk_relevant` son atributos formales del esquema v1.2. |

---

## Conclusión

**6 de 6 gaps se retienen.** El Entity Purity Pass no eliminó ninguna necesidad de investigación — en algunos casos (#1) incluso reveló que la propia pregunta científica podría ayudar a resolver una ambigüedad de clasificación pendiente. Ninguno de los 6 se ha investigado en este documento, tal como se instruyó explícitamente ("no investigarlos todavía en este mismo paso").

## RESEARCH_REQUIRED_RETAINED_v1 (lista final para Fase 3B-R)

1. Entrenamiento reactivo de equilibrio/agilidad — `RETAINED_CONDITIONAL` (a la resolución de clase de #30/#31).
2. Transición de suelo entrenable — `RETAINED`.
3. Dosis de loaded carry — `RETAINED`.
4. Seguridad de HIIT en fragilidad/edad avanzada/oncología — `RETAINED`.
5. Umbrales de impacto en osteoporosis postmenopáusica — `RETAINED`.
6. Cuantificación PA/esfuerzo isométrico en HTA — `RETAINED`.

Ninguno se descarta. Ninguno se investiga en este documento. Fase 3B-R (Targeted Safety Research) queda como el siguiente paso natural para estos 6 ítems, pendiente de autorización explícita de César para iniciarse.
