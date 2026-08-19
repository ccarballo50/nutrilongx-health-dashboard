# NUTRILONGX — Ejercicio: Changelog Fase 3B — Safety Rules Canonicalization v1

Fecha: 2026-08-19. Consolida el cierre de Fase 3A.2 (`LIBRARY_PILOT_v1.1_FROZEN`) y la construcción de la primera generación real de `safety_rule`. `CANONICAL v1.0` y `ALIMENTACION_MASTER_v1` permanecen `FROZEN`, no tocados. No SQL/Supabase/GitHub/Vercel.

---

## 1. ENTREGABLES DE ESTA RONDA

| # | Entregable | Contenido |
|---|---|---|
| 1 | `NUTRILONGX_EJERCICIO_SAFETY_RULE_SCHEMA_v1.md` | Esquema formal de `safety_rule`, auditoría de granularidad (DOMAIN/EXERCISE/ATTRIBUTE/SESSION), nuevos `scope`: `attribute_selector`, `profile_baseline`, `session_attribute` (reservado) |
| 2 | `NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json` | 12 `safety_rule` reales, QA 21/21 PASS |
| 3 | `NUTRILONGX_EJERCICIO_SAFETY_RULES_BUILD_REPORT_v1.md` | Build report, evaluación del Safety Gate para #30 |
| 4 | `NUTRILONGX_EJERCICIO_PHASE3B_EVIDENCE_TO_RULE_MAPPING_v1.csv` | 16 filas: hallazgo → fuente → estado de evidencia → regla formal o `NO_RULE_CREATED` + motivo |
| 5 | `NUTRILONGX_EJERCICIO_PHASE3B_UNRESOLVED_GAPS_v1.md` | Gaps de evidencia, gaps estructurales, decisiones de gobernanza conservadas |
| 6 | `NUTRILONGX_EJERCICIO_PROVENANCE_SCHEMA_AMENDMENT_v1.md` | Propuesta `source_candidates` normalizada, `PROPOSED_NOT_APPLIED` |
| 7 | `NUTRILONGX_EJERCICIO_PHASE3B_CHANGELOG_v1.md` | Este documento |

---

## 2. DECISIÓN DE GOBERNANZA — PROVENANCE (propuesta, no aplicada)

Se diseñó `source_candidates: [{original_candidate_number, candidate_name, legacy_or_previous_id}]` como estructura normalizada N→1 para reemplazar la disparidad singular/plural actual de `LIBRARY_PILOT_v1.1`, con mapping backwards-compatible verificado para los 44 objetos existentes. **No se ha reescrito `LIBRARY_PILOT_v1.1.json`** — la propuesta queda pendiente de aprobación para aplicarse en la próxima construcción real (`Library v1.2` o Master), no retroactivamente sobre el snapshot congelado.

---

## 3. SAFETY RULES — RESUMEN

12 reglas construidas: 6 derivadas directamente de los 4 gaps de Fase 3B-R que sí permitieron formalización (`RULE_CAN_BE_FORMALIZED`), 2 de fuentes ya catalogadas en Fase 1 (preparticipación HTA, exclusión HIIT renal), 2 de la matriz de cobertura ya aprobada (`fall_risk_relevant` × FRAG/EA), más 2 reglas HIIT adicionales (FRAG, EA) del mismo Gap 4. Todas a nivel `attribute_selector`/`training_format`/`profile_baseline` — cero duplicación por ejercicio individual. Ningún umbral numérico inventado. Ningún perfil recibe certeza que su evidencia no respalda (`dislipemia` hereda `GENERAL_CV`; `menopausia`/`inmunosupresión` conservan su `evidence_maturity` real).

De los 6 gaps de Fase 3B-R: 2 gaps (transición de suelo, PA/isométrico HTA) produjeron reglas completas; 2 gaps (loaded carry, impacto osteoporosis) produjeron reglas parciales (cubren el sub-aspecto resuelto, dejan explícito el sub-aspecto no resuelto); 1 gap (HIIT) produjo 3 reglas (una por perfil aplicable); 1 gap (reactivo/agilidad) no produjo ninguna regla por ausencia de entidad destino (#30/#31 no construidos).

---

## 4. #30 Y #31 — ESTADO SIN CAMBIOS DE CONSTRUCCIÓN, EVALUACIÓN NUEVA

- **#30**: sigue sin construirse. Nueva evaluación del Safety Gate (`SAFETY_RULES_BUILD_REPORT_v1.md` §4): **parcialmente cumplido** — la cobertura general de riesgo de caída ya aplicaría automáticamente en cuanto se construya, pero la señal de seguridad específica de Gap 1 (29% vs. 20% eventos adversos) requiere una regla dedicada con `supervision_requirement: REQUIRED` que **debe** crearse en el mismo momento de construir #30, no antes ni después. Sigue como `NEXT_APPROVED_EXERCISE_PENDING_BUILD`.
- **#31**: sin cambios — `SESSION_TEMPLATE` reservado a Fase 3C, no evaluado para construcción en esta ronda.

---

## 5. QA CONSOLIDADO DE ESTA RONDA

`NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json`: **21 PASS, 0 FAIL, 0 NOT_APPLICABLE.** `LIBRARY_PILOT_v1.1` re-verificado sin cambios (24 `EXERCISE`, 20 `EXERCISE_VARIANT`, QA `S16` PASS).

---

## 6. PENDIENTES PARA PRÓXIMAS RONDAS

1. Revisión humana real de las 12 `safety_rule` (todas `PENDING_HUMAN_REVIEW`).
2. Aprobación o rechazo de la propuesta de `provenance` normalizada (`source_candidates`).
3. Decisión sobre construir #30 en `Library v1.2` con su regla de supervisión dedicada, según la condición del Safety Gate.
4. Investigación pendiente: `balance_requirement_level` transversal, `requires_overhead_shoulder_rom` × DM2, dosis de loaded carry en fragilidad, impacto alto + carga en osteoporosis, HIIT no modificado/oncología activa, escalera de agilidad — todos documentados en `PHASE3B_UNRESOLVED_GAPS_v1.md`.
5. Fase 3F (`BEHAVIOURAL_CONTENT`) y Fase 3C (`SESSION_TEMPLATE`, gaps de entidad atómica) permanecen sin fecha, sin cambios respecto a rondas anteriores.

---

## FINAL STATUS

```
PHASE3B_SAFETY_RULES_READY_FOR_GOVERNANCE_REVIEW
```

No se declara `PRODUCTION_READY`. No se ha iniciado construcción de sesiones ni programas. No se ha integrado DVG. No SQL/Supabase/GitHub/Vercel. Me detengo aquí y entrego los 7 artefactos a César.
