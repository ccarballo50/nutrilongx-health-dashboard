# NUTRILONGX — Ejercicio: Governance Changelog v1.1 — Cierre Fase 2 + Entity Purity Pass + Preparación Final 3A/3B

Fecha: 2026-08-18. Consolida el cierre de gobernanza de este ciclo: hardening de esquema (v1.1→v1.2), aprobación de nuevos atributos, extensión de vocabulario, Entity Purity Pass sobre las 40 familias candidatas, y re-evaluación de investigación pendiente. `CANONICAL v1.0` y `NUTRILONGX_ALIMENTACION_MASTER_v1.json` permanecen `FROZEN` — no tocados en ningún momento de este ciclo.

---

## 1. RESUMEN DE CAMBIOS DE ESTE CIERRE

| Área | Qué cambió | Documento |
|---|---|---|
| QA | QA31–33 pasan de propuestos a obligatorios; QA32 reformulado (retroceso permitido con `change_log`, no prohibido); QA34–40 nuevas (umbral `PRODUCTION_READY`) | `MASTER_SCHEMA_v1.2.md` |
| `safety_rule` | Nuevo campo `stop_criteria_not_applicable_reason` | `MASTER_SCHEMA_v1.2.md` |
| Atributos `EXERCISE`/`EXERCISE_VARIANT` | `impact_level`, `balance_requirement_level`, `fall_risk_relevant`, `valsalva_risk_relevant` | `MASTER_SCHEMA_v1.2.md` |
| Atributos `SESSION_TEMPLATE` (prescripción-dependientes) | `load_intensity_band`, `isometric_effort_level` — explícitamente NO en `EXERCISE` | `MASTER_SCHEMA_v1.2.md` |
| Vocabulario | `equipment_vocabulary` v1.0→v1.1, añade `TREKKING_POLES` | `MASTER_SCHEMA_v1.2.md` |
| Modelo de entidades | Nuevo tipo formal `BEHAVIOURAL_CONTENT`; gobernanza de clasificación de entidad formalizada como principio permanente | `MASTER_SCHEMA_v1.2.md` |
| `PRODUCTION_READY` | Umbral de 11 criterios + `media_waiver` | `MASTER_SCHEMA_v1.2.md` |
| Entity Purity Pass | Las 40 candidatas auditadas y reclasificadas: 26 `EXERCISE`, 7 `SESSION_TEMPLATE`, 5 `BEHAVIOURAL_CONTENT`, 2 `OTHER_REQUIRES_DECISION`, 0 `PROGRAM_TEMPLATE` | `ENTITY_CLASSIFICATION_v1.md`, `PHASE3A_PILOT_PLAN_v1.1.md` |
| Investigación pendiente | Los 6 `NEW_RESEARCH_REQUIRED` originales se re-evalúan: 6/6 retenidos (5 `RETAINED`, 1 `RETAINED_CONDITIONAL`) | `RESEARCH_REQUIRED_RETAINED_v1.md` |

Ninguna decisión `FROZEN` (Fase 0 gamificación, Alimentación Master, ni las 13 decisiones de gobernanza de Ejercicio Fase 2) se ha modificado.

---

## 2. GAPS ADICIONALES DETECTADOS DURANTE EL ENTITY PURITY PASS (no resueltos, listados por transparencia)

1. 6 gaps de entidad atómica (sprint, movimientos de movilidad articular, posturas de yoga, estiramientos individuales, movimientos de calentamiento, subida de escalones real) — necesarios antes de construir los 7 `SESSION_TEMPLATE` diferidos y 1 `BEHAVIOURAL_CONTENT` (#35) en fases posteriores.
2. `BEHAVIOURAL_CONTENT` no tiene fase asignada en el plan Fase 3A–3E original — decisión pendiente sobre si merece sub-fase propia.
3. #39 (`remo_en_maquina_guiada`) recomendado para fusión como `EXERCISE_VARIANT` de #14 en vez de familia base independiente — decisión de catalogación pendiente para la ejecución real.
4. #30/#31 (`OTHER_REQUIRES_DECISION`) siguen sin resolver — su resolución podría beneficiarse de la investigación del gap #1 de `RESEARCH_REQUIRED_RETAINED_v1.md`.

---

## 3. DECISIONES QUE AÚN REQUIEREN APROBACIÓN DE CÉSAR (antes de generar JSON real)

1. **#30/#31**: ¿se resuelven como `EXERCISE` único, se descomponen en varios `EXERCISE` de patrones distintos, o se tratan como `SESSION_TEMPLATE`? (Puede diferirse hasta después de investigar el gap #1 de `RESEARCH_REQUIRED_RETAINED_v1.md`.)
2. **`BEHAVIOURAL_CONTENT`**: ¿se define una nueva sub-fase (p.ej. "Fase 3F") o se incorpora en una fase ya existente?
3. **#39**: ¿se confirma la fusión como `EXERCISE_VARIANT` de #14 antes de generar los objetos reales de Fase 3A?
4. **Fase 3B-R (Targeted Safety Research)**: ¿se autoriza ya, o se espera a tener más del catálogo `EXERCISE` construido primero?
5. **6 gaps de entidad atómica** (sección 2, punto 1): ¿se generan ahora como parte de una Fase 3A ampliada, o se posponen estrictamente a Fase 3C cuando se aborden sus `SESSION_TEMPLATE` dependientes?

---

## FINAL STATUS

```
READY_FOR_PHASE3A_EXERCISE_BUILD
```

- **Número final de `EXERCISE` base a generar en Fase 3A**: **26** (ver sección A de `PHASE3A_PILOT_PLAN_v1.1.md`; nota: 1 de los 26, #39, tiene recomendación de fusión como `EXERCISE_VARIANT` de #14 pendiente de confirmación — si se aprueba la fusión, el recuento bajaría a 25 familias base + 1 variante adicional de #14).
- **Número de `SESSION_TEMPLATE` diferidas a Fase 3C**: **7**.
- **Número de `BEHAVIOURAL_CONTENT`**: **5** (fase de destino aún sin asignar formalmente — ver decisión #2 de la sección 3).
- **Número `OTHER_REQUIRES_DECISION`**: **2** (#30, #31 — sin fase asignada hasta su resolución).
- **`PROGRAM_TEMPLATE`**: **0**.
- **Gaps de investigación (`NEW_RESEARCH_REQUIRED`) vigentes**: **6 de 6** — ninguno se ha descartado. 5 `RETAINED` (transición de suelo #29, loaded carry #17, HIIT en fragilidad/edad avanzada/oncología #19+#20, umbrales de impacto en osteoporosis, cuantificación PA/isométrico en HTA), 1 `RETAINED_CONDITIONAL` (entrenamiento reactivo/agilidad, condicional a la resolución de #30/#31).

No se declara `BLOCKED_BY_ENTITY_MODEL_CONFLICT` — el Entity Purity Pass no encontró ningún conflicto estructural irresoluble en el modelo de datos; encontró candidatas mal clasificadas en el plan original, que ya han sido reclasificadas con trazabilidad completa. Los 2 `OTHER_REQUIRES_DECISION` y las decisiones de la sección 3 son pendientes de contenido/producto, no bloqueos de arquitectura — por eso el status es `READY`, no `BLOCKED`.

No se ha generado ningún objeto `EXERCISE`/`SESSION_TEMPLATE`/`BEHAVIOURAL_CONTENT` en JSON. No se ha escrito SQL. No se ha tocado Supabase, GitHub ni Vercel.
