# NUTRILONGX — Ejercicio: Changelog de Canonicalización — Fase 3A.2

Fecha: 2026-08-19. Consolida el paso de `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.json` a `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json`. `CANONICAL v1.0` y `NUTRILONGX_ALIMENTACION_MASTER_v1.json` permanecen `FROZEN`, no tocados. No SQL/Supabase/GitHub/Vercel.

---

## 1. ENTREGABLES DE ESTA RONDA

| Entregable | Descripción |
|---|---|
| `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json` | Dataset canonicalizado: 24 `EXERCISE` + 20 `EXERCISE_VARIANT` |
| `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1_BUILD_REPORT.md` | Reporte de build, QA, freeze gate |
| `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1_TO_v1.1_MAPPING.csv` | Trazabilidad completa de los 25 `EXERCISE` originales → estado final |
| `NUTRILONGX_EJERCICIO_PHASE3A_CANONICALIZATION_CHANGELOG_v1.md` | Este documento |

---

## 2. DECISIONES APROBADAS Y EJECUTADAS EN ESTA RONDA

1. **Fusión #1+#2** → `exercise.cardiorespiratory.caminata`. Ejecutada. Intensidad removida de la identidad `EXERCISE`; queda pendiente de representación en `SESSION_TEMPLATE`/`PRESCRIPTION`/`EXECUTION` en fase futura. Un campo (`functional_relevance`) requirió decisión editorial no mecánica — resuelto por unión de conjuntos y marcado explícitamente con `review_flag`, documentado en el Build Report §1.
2. **`caminata_por_cuestas` mantenida independiente**, sin campo de terreno nuevo. Ejecutada — sin cambios al objeto.
3. **22 `EXERCISE` restantes sin cambios de identidad.** Ejecutada.
4. **Principio de 0 `EXERCISE_VARIANT` por familia reafirmado.** Sin construcción de variantes artificiales.

---

## 3. #30 Y #31 — ESTADO FORMAL

- **#30 `entrenamiento_reactivo_de_pasos`**: `EXERCISE` confirmado. Estado explícito: **`NEXT_APPROVED_EXERCISE_PENDING_BUILD`**. No incorporado a v1.1. Su construcción se realizará junto con la traducción formal de seguridad derivada de `NUTRILONGX_EJERCICIO_PHASE3B_TARGETED_RESEARCH_v1.md` (Gap 1) — es decir, no antes de que exista al menos un borrador de `safety_rule`/bandera de supervisión asociada.
- **#31 `escalera_de_agilidad`**: `SESSION_TEMPLATE` confirmado. No incorporado. Reservado para Fase 3C, condicionado a la existencia previa de movimientos/patrones de pisada atómicos (gap de entidad nuevo, análogo a los 6 ya identificados en `RESEARCH_REQUIRED_RETAINED_v1.md`).

---

## 4. QUÉ NO SE HA HECHO EN ESTA RONDA (por instrucción explícita)

- No se ha iniciado Fase 3B real (construcción de `safety_rule`).
- No se han construido `SESSION_TEMPLATE` ni `PROGRAM_TEMPLATE`.
- No se ha tocado `CANONICAL v1.0` ni `NUTRILONGX_ALIMENTACION_MASTER_v1.json`.
- No SQL, no Supabase, no GitHub, no Vercel.

---

## 5. PENDIENTES PARA PRÓXIMAS RONDAS

1. Confirmación humana real (revisión clínica/editorial) de los 44 objetos — todos permanecen `PENDING_HUMAN_REVIEW`.
2. Decisión sobre si la estructura extendida de `provenance_trace` usada para el objeto fusionado (campos en plural) debe formalizarse como un patrón de esquema reutilizable para futuras fusiones, o si se prefiere un mecanismo distinto (p.ej. un array `merged_from` genérico) antes de que ocurra una segunda fusión.
3. Construcción real de #30 (tras avance de seguridad) y #31 (tras gap de entidad de pisada) en fases posteriores, no bloqueantes para este freeze.
4. Fase 3F (`BEHAVIOURAL_CONTENT`) y Fase 3C (`SESSION_TEMPLATE`/gaps de entidad atómica) permanecen sin fecha, sin cambios respecto a rondas anteriores.

---

## FINAL STATUS

```
LIBRARY_PILOT_v1.1_READY_TO_FREEZE
```

QA = 0 FAIL, 24 `EXERCISE`, 20 `EXERCISE_VARIANT`, provenance de #1/#2 íntegra, 0 referencias huérfanas, ningún conflicto nuevo detectado. Ver `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1_BUILD_REPORT.md` para el detalle completo del freeze gate.

Me detengo aquí. No se inicia Fase 3B real, ni `safety_rules`, ni sesiones, ni programas, ni SQL/Supabase/GitHub, a la espera de la siguiente instrucción de César.
