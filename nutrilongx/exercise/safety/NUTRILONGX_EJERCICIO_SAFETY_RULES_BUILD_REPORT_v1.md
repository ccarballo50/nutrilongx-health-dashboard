# NUTRILONGX — Ejercicio: Safety Rules Build Report v1 (Fase 3B)

Fecha: 2026-08-19. Reporta la construcción de `NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json` (12 reglas), a partir de `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.2.md`, `LIBRARY_PILOT_v1.1` (FROZEN, no modificado), `PHASE3B_TARGETED_RESEARCH_v1.md` y `RESEARCH_REQUIRED_RETAINED_v1.md`. `CANONICAL v1.0` y `ALIMENTACION_MASTER_v1` no se han tocado. No `SESSION_TEMPLATE`, `PROGRAM_TEMPLATE`, `BEHAVIOURAL_CONTENT`, `PRESCRIPTION`/`EXECUTION`, ni DVG. No SQL/Supabase/GitHub/Vercel.

---

## 1. ESTADO DE PARTIDA CONFIRMADO

`LIBRARY_PILOT_v1.1` declarado `LIBRARY_PILOT_v1.1_FROZEN`: 24 `EXERCISE`, 20 `EXERCISE_VARIANT`, 44 objetos, QA 31 PASS/0 FAIL previo. **Ninguna identidad se modificó durante esta fase** — verificado mecánicamente (QA `S16`: recuentos siguen siendo 24/20).

---

## 2. RECUENTO DE REGLAS CONSTRUIDAS

**12 `safety_rule`**, ninguna duplicada, ninguna a nivel `EXERCISE` individual — todas a nivel `attribute_selector`, `training_format` o `profile_baseline` (ver auditoría de granularidad en `NUTRILONGX_EJERCICIO_SAFETY_RULE_SCHEMA_v1.md` sección A), evitando sistemáticamente duplicar la misma regla por ejercicio.

| # | `safety_rule_id` | Perfil | `safety_status` | Origen |
|---|---|---|---|---|
| 1 | `safety_rule.hta.preparticipation_severe_uncontrolled_baseline` | hta | RELATIVE_CONTRAINDICATION | Fase 1 (ACC/AHA, ya catalogado) |
| 2 | `safety_rule.hta.valsalva_isometric_effort_precaution` | hta | PRECAUTION | Gap 6 (3B-R) |
| 3 | `safety_rule.fragilidad_sarcopenia.floor_transition_adaptation` | fragilidad_sarcopenia | ADAPTATION | Gap 2 (3B-R) |
| 4 | `safety_rule.edad_avanzada.floor_transition_adaptation` | edad_avanzada | ADAPTATION | Gap 2 (3B-R) |
| 5 | `safety_rule.fragilidad_sarcopenia.loaded_carry_grip_precaution` | fragilidad_sarcopenia | PRECAUTION | Gap 3 (3B-R, parcial) |
| 6 | `safety_rule.fragilidad_sarcopenia.hiit_modification_precaution` | fragilidad_sarcopenia | PRECAUTION | Gap 4 (3B-R) |
| 7 | `safety_rule.edad_avanzada.hiit_modification_precaution` | edad_avanzada | PRECAUTION | Gap 4 (3B-R) |
| 8 | `safety_rule.oncologia.hiit_modification_precaution` | oncologia | PRECAUTION | Gap 4 (3B-R) |
| 9 | `safety_rule.renal_leve_moderada.hiit_relative_contraindication` | renal_leve_moderada | RELATIVE_CONTRAINDICATION | Fase 1 (UKKA2021, ya catalogado) |
| 10 | `safety_rule.menopausia.high_impact_precaution` | menopausia | PRECAUTION | Gap 5 (3B-R, parcial) |
| 11 | `safety_rule.fragilidad_sarcopenia.fall_risk_adaptation` | fragilidad_sarcopenia | ADAPTATION | Fase 1 / matriz de cobertura |
| 12 | `safety_rule.edad_avanzada.fall_risk_adaptation` | edad_avanzada | ADAPTATION | Fase 1 / matriz de cobertura |

Distribución de `safety_status`: 2 `RELATIVE_CONTRAINDICATION`, 5 `PRECAUTION`, 5 `ADAPTATION`, 0 `ABSOLUTE_CONTRAINDICATION` (ninguna fuente localizada respalda una prohibición absoluta para ningún atributo/perfil investigado en esta ronda), 0 `NOT_ASSESSED` explícito como objeto (el resto de combinaciones atributo×perfil no cubiertas por estas 12 reglas permanecen `NOT_ASSESSED` por comportamiento por defecto del modelo, no por un objeto explícito — consistente con el principio K.1 ya aprobado).

---

## 3. DISCIPLINA DE EVIDENCIA APLICADA

Ninguna regla fija un umbral numérico (verificado mecánicamente, QA `S3`). Ninguna regla se basa únicamente en fuente editorial (QA `S2` — las 12 tienen `SOURCE_BACKED` en su categoría `SAFETY_CONTRAINDICATION_ADAPTATION`). Ningún resultado de investigación `PARTIALLY_RESOLVED`/`UNRESOLVED`/`EVIDENCE_GAP` se convirtió en `ABSOLUTE`/`RELATIVE_CONTRAINDICATION` sin evidencia suficiente (QA `S11`) — los 2 `RELATIVE_CONTRAINDICATION` de este build provienen de fuentes `GUIDELINE` ya catalogadas en Fase 1 con `evidence_maturity: STRONG` (ACC/AHA, UKKA2021), no de gaps parcialmente resueltos.

Ver `NUTRILONGX_EJERCICIO_PHASE3B_EVIDENCE_TO_RULE_MAPPING_v1.csv` para la trazabilidad completa hallazgo → fuente → estado de evidencia → regla formal o `NO_RULE_CREATED` con motivo, incluyendo los 4 ítems donde hubo evidencia relevante pero **no** se pudo formalizar una regla suficientemente precisa (distinción explícita `EVIDENCE_FOUND` vs. `RULE_CAN_BE_FORMALIZED` pedida por César).

---

## 4. EVALUACIÓN DEL SAFETY GATE PARA #30 (`entrenamiento_reactivo_de_pasos`)

Por instrucción explícita, **no se ha construido #30** en esta ronda. Se evalúa aquí si existe cobertura suficiente para incorporarlo en una futura `Library v1.2`:

| Criterio del Safety Gate | Estado |
|---|---|
| Cobertura de riesgo de caída general (`fall_risk_relevant=true` × FRAG/EA) | **Cubierta automáticamente** — las reglas 11/12 (`attribute_selector`) aplicarían a #30 en cuanto se construya con `fall_risk_relevant: true`, sin necesitar una regla nueva. |
| Cobertura específica de la señal de seguridad encontrada en Gap 1 (29% vs. 20% eventos adversos en entrenamiento reactivo/perturbación) | **NO cubierta.** La regla genérica de `fall_risk_relevant` (ADAPTATION, `supervision_requirement: RECOMMENDED`) es más débil que lo que la evidencia específica de Gap 1 sugiere para esta técnica concreta — esa evidencia apunta a `supervision_requirement: REQUIRED`, no solo recomendada. |
| Denominación canónica final, provenance de la técnica concreta | **NO completada** — sigue siendo el nombre de candidata original, sin revisión editorial dedicada. |
| Mecanismo de esquema para expresar supervisión obligatoria | **Existe** (`supervision_requirement` ya es un campo formal de `safety_rule` desde este build). |

**Conclusión**: el Safety Gate está **parcialmente cumplido**. Recomendación: #30 puede incorporarse a una futura `Library v1.2` **solo si**, en el mismo momento de su construcción, se añade una regla dedicada `safety_rule.fragilidad_sarcopenia.reactive_training_supervision_required` (y equivalente para `edad_avanzada`) con `supervision_requirement: REQUIRED` referenciando directamente el hallazgo de Gap 1 — no basta con que herede la regla genérica de `fall_risk_relevant`. Esto no se construye en esta ronda; queda como condición explícita para la próxima. `#31` permanece sin evaluar para construcción — sigue reservado a Fase 3C sin cambios.

---

## 5. RESULTADOS DE QA

Script `qa_safety_rules.py`: **21 PASS, 0 FAIL, 0 NOT_APPLICABLE.** Cobertura: ausencia de provenance (S1), fuente solo editorial (S2), umbral numérico sin fuente (S3), contraindicación sin evidencia (S4), extrapolación de perfil no declarada (S5), contradicción entre reglas (S6), duplicación (S7), selector huérfano (S8), perfil inexistente (S9), vocabulario de estado (S10), `EVIDENCE_GAP`→contraindicación indebida (S11), `safety_refs` huérfanos (S12), mezcla con `PRESCRIPTION`/`EXECUTION` (S13), datos personales (S14), promoción automática a `PRODUCTION_READY` (S15), `LIBRARY_PILOT_v1.1` no modificado (S16), #30/#31 ausentes como destino directo (S17), claves fuera de alcance (S18), vocabulario de `scope` (S19), `stop_criteria`/`stop_criteria_not_applicable_reason` para estados fuertes (S20).

---

## 6. QUÉ NO SE HA HECHO (por instrucción explícita)

- No se han modificado identidades `EXERCISE`/`EXERCISE_VARIANT` de `LIBRARY_PILOT_v1.1`.
- No se ha construido #30 ni #31.
- No se ha construido `SESSION_TEMPLATE`, `PROGRAM_TEMPLATE` ni `BEHAVIOURAL_CONTENT`.
- No se ha diseñado `PRESCRIPTION`/`EXECUTION` ni integrado DVG.
- No se ha declarado ningún objeto `PRODUCTION_READY` ni `SCIENTIFICALLY_REVIEWED` — las 12 reglas permanecen `STRUCTURALLY_COMPLETE`/`PENDING_HUMAN_REVIEW`.
- No se ha tocado `CANONICAL v1.0` ni `ALIMENTACION_MASTER_v1`. No SQL/Supabase/GitHub/Vercel.

---

## FINAL STATUS

```
PHASE3B_SAFETY_RULES_READY_FOR_GOVERNANCE_REVIEW
```

Condiciones verificadas: todas las 12 reglas tienen `provenance` real (QA S1); ningún `threshold` está inventado (QA S3); los gaps no resueltos permanecen explícitos (`NUTRILONGX_EJERCICIO_PHASE3B_UNRESOLVED_GAPS_v1.md`); no existen contradicciones estructurales sin señalar (QA S6, 0 detectadas); QA = 0 FAIL (21/21 PASS). **No se declara `PRODUCTION_READY`** — revisión humana real sigue siendo obligatoria antes de cualquier uso clínico.

Me detengo aquí. No se inicia construcción de sesiones ni programas, no se integra DVG, a la espera de la revisión de César.
