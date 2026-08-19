# NUTRILONGX — Ejercicio: Changelog Fase 3A REAL → Fase 3B-R

Fecha: 2026-08-18. Consolida la construcción del primer dataset real (`NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.json`) y la investigación dirigida (Fase 3B-R). `CANONICAL v1.0` y `NUTRILONGX_ALIMENTACION_MASTER_v1.json` permanecen `FROZEN`, no tocados en ningún momento. No se ha escrito SQL, ni tocado Supabase/GitHub/Vercel/frontend.

---

## 1. QUÉ SE CONSTRUYÓ

| Entregable | Contenido | Status |
|---|---|---|
| `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.json` | 25 `EXERCISE` + 20 `EXERCISE_VARIANT` (incl. fusión #39→#14) | Ver Build Report |
| `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_BUILD_REPORT_v1.md` | Reporte de build, QA, trazabilidad, decisión de diseño no pedida explícitamente (11 familias sin variante) | `VALID_WITH_RESEARCH_GAPS` |
| `NUTRILONGX_EJERCICIO_PHASE3B_TARGETED_RESEARCH_v1.md` | Investigación de los 6 gaps retenidos | `READY_FOR_GOVERNANCE_REVIEW` |
| `NUTRILONGX_EJERCICIO_PHASE3A_TO_3B_CHANGELOG_v1.md` | Este documento | — |

---

## 2. DECISIONES DE GOBERNANZA YA APLICADAS EN ESTA RONDA (confirmadas por César, ejecutadas aquí)

1. #39 (`remo_en_maquina_guiada`) fusionado como `EXERCISE_VARIANT` `TECHNICAL_VARIANT` de #14 (`remo_con_carga`), `progression_stage: 0`, conservando su propia `provenance_trace`. **Ejecutado.**
2. #30/#31 permanecen `OTHER_REQUIRES_DECISION`, pendientes de la investigación del gap #1 — **no construidos** como objetos en este pilot. **Ejecutado** (ver sección 4 de este changelog para la recomendación post-investigación).
3. Los 5 `BEHAVIOURAL_CONTENT` quedan fuera de esta fase, destinados a una futura "Fase 3F" — **no construidos aquí, sin cambios respecto al plan anterior.**
4. Fase 3B-R autorizada y ejecutada en paralelo al build — **completada**, ver `PHASE3B_TARGETED_RESEARCH_v1.md`.
5. Los 6 gaps de entidad atómica (sprint, movilidad articular individual, posturas de yoga, estiramientos individuales, movimientos de calentamiento, subida de escalones real) siguen diferidos a antes/durante Fase 3C — **sin cambios, no bloquean esta entrega.**

---

## 3. QUÉ NO SE CONSTRUYÓ (por diseño, según instrucción explícita)

- Ningún `SESSION_TEMPLATE`, `PROGRAM_TEMPLATE`, `BEHAVIOURAL_CONTENT`.
- Ningún `safety_rule` real (5-estado, `stop_criteria_not_applicable_reason`) — solo hallazgos de investigación e implicaciones propuestas, sin traducir a regla formal.
- Ninguna `PRESCRIPTION` ni `EXECUTION`.
- `NUTRILONGX_EJERCICIO_MASTER_v1.json` — no existe todavía.
- Ningún objeto `content_maturity` superior a `STRUCTURALLY_COMPLETE`; ninguna aprobación humana masiva (los 45 objetos están `PENDING_HUMAN_REVIEW`).

---

## 4. RE-ANÁLISIS DE #30/#31 TRAS INVESTIGACIÓN DEL GAP #1 — RECOMENDACIÓN (NO CONSTRUCCIÓN)

Con base en `PHASE3B_TARGETED_RESEARCH_v1.md` (Gap 1):

**#30 `entrenamiento_reactivo_de_pasos`** → recomendación: **`EXERCISE`**. La evidencia SR/MA describe consistentemente protocolos de **una técnica reactiva entregada de forma repetida** (p.ej. perturbación de traslación repetida), lo que encaja con el criterio operacional de "movimiento único repetido" ya usado en el Entity Purity Pass — no una combinación de patrones distintos. Se recomienda además que, dado el señal de seguridad encontrado (29% vs 20% eventos adversos), cualquier construcción real de este `EXERCISE` incluya desde el inicio una bandera de cribado (`fall_risk_relevant: true` como mínimo) y quede marcada para revisión prioritaria de `safety_rule` en Fase 3B, con requisito de supervisión — sin que esto implique construir la regla ahora.

**#31 `escalera_de_agilidad`** → recomendación: **`SESSION_TEMPLATE`**. La evidencia (o su ausencia) confirma que el nombre describe un formato/equipamiento que admite múltiples patrones de pisada distintos combinados en la misma sesión — consistente con el criterio de "combinación de movimientos distintos" usado para clasificar `SESSION_TEMPLATE` en el resto del Entity Purity Pass. Se recomienda que, cuando se aborde su construcción (Fase 3C), quede condicionada a definir primero los movimientos atómicos de pisada individuales (nuevo gap de entidad, análogo a los 6 ya identificados) y a una puerta de gating por perfil de fragilidad, dado que la evidencia disponible es escasa y no incluye población frágil.

**Ninguno de los dos objetos se ha construido en este pilot.** Esta es una recomendación para decisión de César, consistente con la instrucción de "proponer, no construir".

---

## 5. DECISIONES PENDIENTES DE CÉSAR

1. **Confirmar o corregir** la recomendación de la sección 4 (#30 → `EXERCISE`, #31 → `SESSION_TEMPLATE`).
2. **Revisar la decisión de diseño no pedida explícitamente** documentada en la sección 4 del Build Report: 11 familias `EXERCISE` (9 cardiorrespiratorias continuas + `marcha_en_tandem` + `movilidad_cadera_dirigida`) reciben 0 `EXERCISE_VARIANT` en este pilot. Confirmar si esto es correcto o si alguna merece una variante real en una iteración posterior.
3. **Fase 3F** (`BEHAVIOURAL_CONTENT`): sigue sin fecha/alcance formal asignado — pendiente de decisión previa ya señalada en la ronda anterior, sin cambios.
4. Los 6 gaps de entidad atómica y el nuevo gap de movimientos de pisada individual (sección 4, #31) permanecen diferidos a antes/durante Fase 3C.
5. Traducción de los hallazgos de `PHASE3B_TARGETED_RESEARCH_v1.md` a `safety_rule` formales — requiere autorización explícita para iniciar la Fase 3B real (construcción de reglas), distinta de la Fase 3B-R (investigación) ya completada aquí.

---

## FINAL STATUS

```
VALID_WITH_RESEARCH_GAPS
```

Consistente con el Build Report. El pilot es estructuralmente válido y trazable; persisten gaps de investigación y decisiones de contenido pendientes, ninguno de los cuales es un conflicto estructural de modelo de datos.

**Me detengo aquí y pido revisión de César antes de iniciar la Fase 3B real (construcción de `safety_rule`) o la Fase 3C (sesiones), tal como se instruyó.**
