# NUTRILONGX — Ejercicio: Gaps No Resueltos tras Fase 3B (Safety Rules Canonicalization v1)

Fecha: 2026-08-19. Consolida, con honestidad explícita, todo lo que **no** se resolvió con `safety_rule` reales en esta ronda — ni por falta de evidencia, ni por falta de entidad destino, ni por decisión deliberada de no extrapolar. Ningún ítem de este documento se ha convertido silenciosamente en "seguro" ni en regla.

---

## 1. GAPS DE EVIDENCIA (evidencia insuficiente o inexistente)

| Ítem | Estado | Por qué no hay regla |
|---|---|---|
| Escalera de agilidad (#31) — eficacia/seguridad | `UNRESOLVED` | Solo estudios primarios pequeños en población no frágil, sin revisión sistemática dedicada. Además #31 permanece `SESSION_TEMPLATE` no construido. |
| Loaded carry (#17) — dosis (carga/distancia) en población frágil | `UNRESOLVED` | Ninguna fuente localizada aborda dosis segura específicamente en fragilidad. Solo se formalizó un principio técnico general (`safety_rule.fragilidad_sarcopenia.loaded_carry_grip_precaution`), sin ningún número. |
| HIIT no modificado / oncología en tratamiento activo | `UNRESOLVED` | La evidencia de Gap 4 cubre HIIT modificado y supervivientes/post-tratamiento; no cubre HIIT estándar sin modificar ni oncología en tratamiento activo o subpoblaciones hematológicas/metástasis ósea. |
| Impacto alto + carga de resistencia pesada en osteoporosis postmenopáusica | `UNRESOLVED` | La revisión narrativa 2025 (HiRIT) señala protocolos prometedores pero sin umbrales validados para uso no supervisado. |
| `balance_requirement_level` como atributo transversal × DM2/EA/FRAG/ONCO | `EVIDENCE_GAP` (matriz de cobertura marcaba `RULE_REQUIRED`, pero ninguno de los 6 gaps de Fase 3B-R lo investigó específicamente) | No se fabricó una regla basada solo en el juicio de la matriz de cobertura sin una fuente citable dedicada. |
| `functional_requirement.requires_overhead_shoulder_rom` × DM2 (capsulitis adhesiva/hombro congelado) | `EVIDENCE_GAP` | Ninguna fuente fue investigada específicamente para esta asociación dentro de este proyecto; crear la regla habría sido extrapolar conocimiento general no verificado contra fuente NUTRILONGX. |
| Menopausia — alivio de síntomas vasomotores/psicológicos con ejercicio aeróbico | `INSUFFICIENT` (ya declarado en Fase 1) | BMC Women's Health 2024: "insufficient evidence to recommend a particular form of exercise" — conclusión explícita de la propia fuente, se respeta tal cual. |
| Inmunosupresión — cualquier regla de ejercicio | `LIMITED` (ya declarado en Fase 1) | Ninguno de los 6 gaps de Fase 3B-R investigó inmunosupresión. Literatura existente es de trasplante de órgano sólido, no de inmunosupresión no-trasplante. Extender cualquier regla de otro perfil sería una extrapolación no declarada. |

---

## 2. GAPS ESTRUCTURALES (evidencia podría existir, pero no hay entidad destino todavía)

| Ítem | Estado | Por qué no hay regla |
|---|---|---|
| Entrenamiento reactivo de perturbación (#30) | Evidencia `PARTIALLY_RESOLVED` (3 SR/MA), pero `NO_RULE_CREATED` | `exercise.neuromotor.entrenamiento_reactivo_de_pasos` no existe todavía en `LIBRARY_PILOT_v1.1` (`NEXT_APPROVED_EXERCISE_PENDING_BUILD`). Crear una regla sin entidad destino generaría un selector potencialmente huérfano. Ver evaluación de suficiencia en `NUTRILONGX_EJERCICIO_SAFETY_RULES_BUILD_REPORT_v1.md`. |
| `load_intensity_band` / `isometric_effort_level` (SESSION_TEMPLATE-only) | Estructuralmente bloqueado | `SESSION_TEMPLATE` no existe todavía (Fase 3C). El `scope: session_attribute` queda reservado en el esquema, sin ninguna instancia. |
| Movimientos/patrones de pisada atómicos para escalera de agilidad | No investigado, no construido | Prerrequisito para #31 (`SESSION_TEMPLATE`), diferido a Fase 3C. |

---

## 3. DECISIONES DE GOBERNANZA CONSERVADAS (no son gaps, son límites deliberados)

- **Dislipemia**: ninguna regla propia — hereda `GENERAL_CV` vía `rule_inheritance`, tal como se instruyó explícitamente ("no conviertas dislipemia en reglas específicas si la evidencia solo sustenta reglas cardiovasculares generales").
- **Impacto MODERATE en menopausia**: no recibe ninguna regla restrictiva — la evidencia lo respalda como generalmente beneficioso para salud ósea; solo `impact_level=HIGH` recibe `PRECAUTION`.
- **Ningún umbral numérico** (mmHg, kg, repeticiones, distancia) se fijó en ninguna de las 12 reglas — verificado mecánicamente por QA (`S3`).

---

## 4. RESUMEN — 6 GAPS DE FASE 3B-R, ESTADO FINAL TRAS FORMALIZACIÓN

| Gap | Evidencia encontrada | Regla formal posible | Resultado |
|---|---|---|---|
| 1a. Reactivo/perturbación | Sí (`PARTIALLY_RESOLVED`) | No — sin entidad destino | `NO_RULE_CREATED`, pendiente construcción #30 |
| 1b. Escalera de agilidad | No (`UNRESOLVED`) | No | `NO_RULE_CREATED` |
| 2. Transición de suelo | Sí (`PARTIALLY_RESOLVED`) | Sí | **2 reglas creadas** (FRAG, EA) |
| 3. Loaded carry | Parcial (sanos sí, frágiles no) | Parcial | **1 regla creada** (técnica general, sin dosis) |
| 4. HIIT frailty/EA/oncología | Sí (`PARTIALLY_RESOLVED`, modificado) | Sí | **3 reglas creadas** (FRAG, EA, ONCO) |
| 5. Impacto osteoporosis | Parcial (moderado sí, alto+carga no) | Parcial | **1 regla creada** (solo impacto HIGH) |
| 6. PA/isométrico HTA | Sí (`PARTIALLY_RESOLVED`) | Sí | **1 regla creada** |

Más 2 reglas adicionales de fuentes ya catalogadas en Fase 1 (no gaps de 3B-R): preparticipación HTA (baseline) y exclusión HIIT en renal. Más 2 reglas de la matriz de cobertura ya aprobada (fall_risk × FRAG/EA). **Total: 12 reglas formales.**

Ningún resultado `PARTIAL`/`UNRESOLVED`/`RETAINED`/`RETAINED_CONDITIONAL`/`EVIDENCE_GAP` se convirtió automáticamente en `ABSOLUTE_CONTRAINDICATION`/`RELATIVE_CONTRAINDICATION`/`PRECAUTION`/`ADAPTATION` sin evidencia suficiente — verificado mecánicamente por QA (`S11`).
