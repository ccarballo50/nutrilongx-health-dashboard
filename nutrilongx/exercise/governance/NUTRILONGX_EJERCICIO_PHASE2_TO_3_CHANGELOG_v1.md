# NUTRILONGX — Ejercicio: Changelog Fase 2 → Fase 3 y Cierre de Gobernanza

Fecha: 2026-08-18. Consolida el cierre de Fase 2 (hardening de esquema) y la preparación de Fase 3A (piloto de biblioteca) + 3B (cobertura de seguridad). `CANONICAL v1.0` y `NUTRILONGX_ALIMENTACION_MASTER_v1.json` permanecen `FROZEN` — no se ha modificado ninguno en este cierre.

---

## 1. QUÉ CAMBIÓ RESPECTO A v1.0 (resumen ejecutivo)

| Cambio | Documento | Motivo |
|---|---|---|
| `scientific_provenance` desacoplado de `review_status` | `MASTER_SCHEMA_v1.1.md`, sección A.1 | v1.0 permitía leer implícitamente `PENDING_HUMAN_REVIEW` como "sin necesidad de fuente" — corregido con 6 `content_category` + 4 `source_status` |
| `target_profile_hint` restringido explícitamente | `MASTER_SCHEMA_v1.1.md`, sección B | Evita que una etiqueta editorial se use accidentalmente como regla clínica o de elegibilidad |
| Eje `content_maturity` (4 estados) introducido | `MASTER_SCHEMA_v1.1.md`, sección A.3 | Ortogonal a `review_status`/`safety_state`/`evidence_maturity` — mide madurez del contenido, no del workflow ni de la evidencia clínica del perfil |
| QA ampliado de 23 a 30 obligatorias + 3 propuestas (no ratificadas) | `MASTER_SCHEMA_v1.1.md`, sección T | QA1 corregido para no aceptar `review_status` como sustituto de provenance; QA24–30 nuevas; QA31–33 propuestas separadamente |
| Plan de piloto de 40 familias `EXERCISE` (sin JSON aún) | `PHASE3A_PILOT_PLAN_v1.md` | Cobertura deliberada de los 5 dominios/constructo + mapping hacia los 6 subdominios legacy `movement.*`, sin forzar 1:1 |
| Matriz de cobertura de seguridad (dominio+atributo × 11 perfiles) | `PHASE3B_SAFETY_COVERAGE_PLAN_v1.md` | Identifica dónde se necesitará regla real antes de escribir ninguna `safety_rule` con valores |
| 6 candidatos de extensión de vocabulario/esquema propuestos, no incorporados | `PHASE3B_SAFETY_COVERAGE_PLAN_v1.md`, sección 3 | `impact_level`, `load_intensity_band`, `valsalva_risk_flag`/`isometric_effort_level`, `balance_requirement_level`, `fall_risk_relevant` — `floor_transitions` y `overhead_movement` ya existían en el esquema de Fase 2 y se confirma su cobertura, no se duplican |
| 6 `NEW_RESEARCH_REQUIRED` explícitos | `PHASE3B_SAFETY_COVERAGE_PLAN_v1.md`, sección 4 | Ninguno se ha rellenado con conocimiento general — quedan pendientes de investigación dedicada |

Ninguna decisión ya `FROZEN` (Fase 0 gamificación, Fase 1B/Master de Alimentación, ni las 13 decisiones de gobernanza de Ejercicio Fase 2) se ha modificado. El hardening es aditivo/correctivo sobre la disciplina de provenance, no un cambio de arquitectura.

---

## 2. DECISIONES QUE REQUIEREN APROBACIÓN DE CÉSAR

1. **QA31–33 (propuestos)**: ¿se ratifican como obligatorios, se descartan, o quedan como "recomendados pero no bloqueantes" para la Fase 3E?
2. **6 candidatos de extensión de vocabulario/esquema** (`impact_level`, `load_intensity_band`, `valsalva_risk_flag`/`isometric_effort_level`, `balance_requirement_level`, `fall_risk_relevant`): ¿se aprueban para incorporarse formalmente al esquema antes de generar los 40 objetos `EXERCISE` reales, o se generan primero los objetos sin estos atributos y se añaden en una revisión posterior (con el coste de tener que revisar retroactivamente)?
3. **Extensión de `equipment_vocabulary`**: añadir `TREKKING_POLES` (u equivalente) para cubrir la familia #9 (`nordic_walking`) del piloto, hoy sin equipamiento representable en el vocabulario v1.0.
4. **Plan de catálogo piloto (40 familias)**: ¿se aprueba tal cual, o César quiere ajustar la composición (p.ej. más/menos familias en algún dominio) antes de iniciar la generación real de objetos `EXERCISE` en una futura entrega?
5. **6 ítems `NEW_RESEARCH_REQUIRED`**: ¿se investigan ahora (como una sub-fase de investigación dedicada, análoga a la de Fase 1) o se difieren hasta que la Fase 3B los necesite en firme? Ninguno bloquea la Fase 3A (construcción de contenido en `DRAFT`/`STRUCTURALLY_COMPLETE`), pero todos bloquean el ascenso de las familias afectadas a `SCIENTIFICALLY_REVIEWED`/`PRODUCTION_READY`.
6. **Umbrales mínimos de `PRODUCTION_READY`** (multimedia/técnica/seguridad mínimos): señalados como pendientes en `MASTER_SCHEMA_v1.1.md` sección A.3.1 — sin definir todavía, decisión de producto más que científica, necesaria antes de la Fase 3E.
7. **Secuencia de ejecución**: ¿procede ya la generación literal de los 40 objetos `EXERCISE` en JSON (ejecución real de Fase 3A) en la próxima entrega, o se espera primero a resolver las decisiones #2 y #3 (vocabularios) para evitar retrabajo?

Ninguna de estas 7 decisiones se ha resuelto unilateralmente en este documento — todas quedan explícitamente abiertas para César.

---

## 3. QUÉ NO SE HA HECHO EN ESTE CIERRE (recordatorio de alcance)

- No se ha generado `NUTRILONGX_EJERCICIO_MASTER_v1.json`.
- No se ha generado ningún objeto `EXERCISE`/`EXERCISE_VARIANT`/`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE` real en JSON.
- No se ha generado ninguna `safety_rule` con valores.
- No se ha generado ningún objeto `PRESCRIPTION`/`EXECUTION`.
- No se ha escrito SQL ni se ha tocado Supabase, GitHub ni Vercel.
- No se ha modificado `CANONICAL v1.0` ni `NUTRILONGX_ALIMENTACION_MASTER_v1.json`.
- No se ha realizado nueva investigación bibliográfica masiva — los 6 gaps de la sección 4 del Plan de Seguridad quedan marcados, no resueltos.

---

## FINAL STATUS

```
READY_WITH_NEW_RESEARCH_REQUIRED
```

**Aclaración explícita de alcance de este status**: la Fase 3A (construcción literal de los 40 objetos `EXERCISE` en `content_maturity: DRAFT`/`STRUCTURALLY_COMPLETE`) **no está bloqueada** por los 6 ítems `NEW_RESEARCH_REQUIRED` — puede iniciarse en cuanto César resuelva las decisiones #2/#3/#4/#7 de la sección 2. Lo que sí queda condicionado a la investigación pendiente es el ascenso de contenido relacionado con seguridad/dosis/beneficio clínico a `SCIENTIFICALLY_REVIEWED`/`PRODUCTION_READY` (Fase 3B en adelante) para las familias identificadas en la sección 5 del Plan de Seguridad. No se declara `BLOCKED_BY_SCHEMA_GAP` porque no se ha detectado ninguna incoherencia estructural en el esquema v1.1 — los gaps son de evidencia científica, no de arquitectura de datos.
