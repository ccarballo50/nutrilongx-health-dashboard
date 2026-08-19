# NUTRILONGX — Ejercicio: Build Report — Library Pilot v1.1 (Fase 3A.2 — Library Canonicalization)

Fecha: 2026-08-19. Reporta la construcción de `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json`, generado exclusivamente a partir de `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.json` + `NUTRILONGX_EJERCICIO_EXERCISE_IDENTITY_AUDIT_v1.md`, aplicando las 3 decisiones `FROZEN` aprobadas por César. `CANONICAL v1.0` y `NUTRILONGX_ALIMENTACION_MASTER_v1.json` no se han leído ni tocado en esta ronda. No se ha escrito SQL, ni tocado Supabase/GitHub/Vercel.

---

## 1. CAMBIO APLICADO: FUSIÓN #1 + #2

Se construyó un único objeto `exercise.cardiorespiratory.caminata` (título "Caminata", sin calificador de intensidad) sustituyendo a `exercise.cardiorespiratory.caminata_ritmo_moderado` (#1) y `exercise.cardiorespiratory.caminata_vigorosa` (#2).

**Campos verificados como mecánicamente idénticos entre #1 y #2** (sin necesidad de decisión editorial — copiados directamente al objeto fusionado): `primary_domain`, `secondary_domains`, `training_format`, `mobility_type`, `fall_prevention_goal`, `movement_pattern`, `equipment_required`, `context_compatible`, `impact_level`, `balance_requirement_level`, `fall_risk_relevant`, `valsalva_risk_relevant`, `technical_complexity`, `functional_requirement`, `target_structures`, `typical_reps_range`, `typical_duration_range`, `safety_refs`.

**Único campo que NO pudo reconciliarse mecánicamente — decisión editorial declarada, no silenciosa**: `functional_relevance`. #1 tenía `["GSP", "ADL"]`, #2 tenía `["GSP"]`. Se resolvió tomando la **unión** de ambos conjuntos (`["ADL", "GSP"]`), para no descartar información funcional de ninguna de las dos candidatas originales. Esta decisión se marca explícitamente con el `review_flag` `MERGE_EDITORIAL_DECISION_FUNCTIONAL_RELEVANCE_UNION` en el objeto fusionado (verificado por QA V11-19), en vez de elegirse en silencio.

**`scientific_provenance`**: se regeneró con los valores por defecto del esquema v1.2 (idénticos a los que ya tenían #1 y #2 antes de la fusión) — el objeto fusionado sigue sin variantes asociadas, por lo que `PROGRESSION_CLAIM` permanece `NOT_APPLICABLE`, sin cambios de fondo.

**`training_intensity`**: confirmado ausente en el objeto fusionado y en todo `EXERCISE`/`EXERCISE_VARIANT` del documento (QA9) — la intensidad "moderada"/"vigorosa" NO se representa en este nivel, queda pendiente para `SESSION_TEMPLATE`/`PRESCRIPTION`/`EXECUTION` en una fase posterior, tal como se instruyó.

**Trazabilidad histórica**: el `provenance_trace` del objeto fusionado usa una estructura extendida (plural) respecto al resto de objetos del pilot — `original_candidate_numbers: [1, 2]`, `candidate_names: ["caminata_ritmo_moderado", "caminata_vigorosa"]`, `deprecated_exercise_ids` con ambos IDs antiguos, y `deprecation_reason`. Esta es la única instancia en el documento con esta forma extendida; se documenta aquí explícitamente para que no se lea como una inconsistencia de esquema no intencional, sino como la extensión mínima necesaria para no perder trazabilidad de una fusión N→1.

---

## 2. CAMBIOS NO APLICADOS (confirmados sin cambios)

- `exercise.cardiorespiratory.caminata_por_cuestas` (#4): sin cambios, sigue como `EXERCISE` independiente. No se creó `terrain_type`, `incline_context` ni `environment_modifier`.
- Los otros 22 `EXERCISE` restantes: sin cambios de identidad.
- Las 20 `EXERCISE_VARIANT`: sin cambios — verificado que ninguna referenciaba `caminata_ritmo_moderado` ni `caminata_vigorosa` como `base_exercise_id`, por lo que la fusión no generó ninguna referencia huérfana (QA V11-7).
- El principio de 0 `EXERCISE_VARIANT` permitidas por familia permanece aprobado; no se fabricó ninguna variante artificial.

---

## 3. #30 Y #31 — ESTADO EXPLÍCITO

- **#30 `entrenamiento_reactivo_de_pasos`**: confirmado como `EXERCISE` (decisión de clase ya cerrada), pero **no incorporado** a este documento. Estado declarado: `NEXT_APPROVED_EXERCISE_PENDING_BUILD`. Su construcción real queda ligada a la traducción formal de seguridad derivada de Fase 3B-R (denominación canónica, supervisión, safety coverage, provenance) — no antes.
- **#31 `escalera_de_agilidad`**: confirmado como `SESSION_TEMPLATE`, no incorporado. Permanece reservado para Fase 3C, condicionado a la existencia previa de movimientos/patrones de pisada atómicos.

Ninguno de los dos aparece como objeto en `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json` (QA V11-8, V11-9).

---

## 4. RECUENTOS FINALES

| Tipo | v1 | v1.1 |
|---|---|---|
| `EXERCISE` base | 25 | **24** |
| `EXERCISE_VARIANT` | 20 | **20** |
| Total de objetos | 45 | **44** |

---

## 5. RESULTADOS DE QA

Re-ejecución del subconjunto aplicable de QA1–QA31 del esquema v1.2 (15 checks re-verificados explícitamente; QA32–40 y checks de entidades fuera de alcance — `safety_rule`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`/binding de gamificación/`PRESCRIPTION`-`EXECUTION` — permanecen `NOT_APPLICABLE`, sin cambios respecto a v1, honestamente reportados) + **19 checks específicos de canonicalización v1.1** (V11-1 a V11-19) instruidos explícitamente por César.

**Resultado: 31 PASS, 0 FAIL, 4 NOT_APPLICABLE.** Los 4 `NOT_APPLICABLE` son: el bloque QA32–40/entidades fuera de alcance (heredado de v1, sin cambio), la verificación de ausencia de `safety_rule` nuevo (no existe ningún `safety_rule` en el documento, por lo que "ninguno nuevo" no es un PASS mecánico sino una ausencia estructural — reportado honestamente como `NOT_APPLICABLE` en vez de forzar un PASS), y las dos verificaciones de que `CANONICAL v1.0`/`ALIMENTACION_MASTER_v1` no se modificaron — verificación de proceso (ningún archivo de esos dos fue leído ni escrito en esta sesión de trabajo), no verificable mecánicamente contra el contenido de este JSON.

Checks específicos V11-1 a V11-19: **19/19 PASS**, incluyendo confirmación explícita de: exactamente 24 `EXERCISE` y 20 `EXERCISE_VARIANT`; `exercise.cardiorespiratory.caminata` existe exactamente una vez; los dos IDs deprecados no existen como objetos activos; ambos IDs históricos preservados en `provenance_trace`; `caminata_por_cuestas` intacta; cero variantes huérfanas; #30 y #31 ausentes; cero `SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`/`BEHAVIOURAL_CONTENT`/`PRESCRIPTION`/`EXECUTION`; ningún `content_maturity` superior a `STRUCTURALLY_COMPLETE`; 44 IDs únicos sin duplicados; el `review_flag` de la decisión editorial de fusión está presente.

---

## FREEZE GATE

Condiciones evaluadas:

| Condición | Resultado |
|---|---|
| QA = 0 FAIL | ✅ 0 FAIL |
| 24 `EXERCISE` | ✅ 24 |
| 20 `EXERCISE_VARIANT` | ✅ 20 |
| Provenance #1/#2 íntegra | ✅ ambos IDs y números de candidata preservados en `provenance_trace` |
| 0 referencias huérfanas | ✅ verificado (QA V11-7) |
| Ningún conflicto nuevo | ✅ ninguno detectado |

```
LIBRARY_PILOT_v1.1_READY_TO_FREEZE
```

No se ha iniciado Fase 3B real, ni construido `safety_rules`, sesiones ni programas. No SQL, no Supabase, no GitHub, no Vercel. Me detengo aquí a la espera de la instrucción de César para el siguiente paso.
