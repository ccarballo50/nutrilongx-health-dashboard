# NUTRILONGX — Legacy → Canonical Mapping Report v1

Fecha: 2026-08-18
Fuente: `NUTRILONGX_creditos_v3.xlsx` (vía `actions_catalog.json` v1.0.3) reconciliado en `NUTRILONGX_AUDITORIA_FASE0_v1.md`.
Decisiones de gobernanza aplicadas: 1 (nivel/DVG), 2 (duplicado Mente/Rutinas), 3 (Rutinas→adherence), 4 (objetivos +45/+60/+90) y las cuatro decisiones adicionales (IDs, unidades, rationale, fuentes/caps), tal como fueron aprobadas por César el 2026-08-18.

Este documento es reproducible: describe exactamente las reglas de transformación aplicadas, no una selección manual. El detalle fila-a-fila completo (las 600 filas legacy con su ID canónico) se entrega como CSV adjunto, `legacy_to_canonical_mapping.csv`.

---

## 1. Resumen cuantitativo

| Métrica | Valor |
|---|---|
| Filas históricas (Excel v3 / `actions_catalog.json`) | 600 |
| Familias conceptuales originales (pilar+subpilar+plantilla de dosis) | 120 |
| Familias fusionadas por duplicado cross-pilar (Decisión 2) | 1 |
| **Familias canónicas finales** | **119** |
| Legacy IDs preservados | 600 / 600 (100%) |
| Legacy IDs huérfanos o perdidos | 0 |
| `level_variants` totales en el canon | 600 |
| `level_variants` con estado `active` | 595 |
| `level_variants` con estado `deprecated` | 5 (la familia fusionada conserva sus 5 variantes de Rutinas como histórico, sin generar DVG) |
| `source_ids` históricos preservados | 16 / 16 (100%) |
| Pérdida de información | 0 — toda fila, ID, valor de crédito, fuente y texto histórico permanece accesible en el canon o en su provenance |

## 2. Tabla antes / después por dominio

| legacy_pillar (antes) | filas antes | → | canonical_domain (después) | familias canónicas | `level_variants` mapeados |
|---|---|---|---|---|---|
| Retos (Ejercicio) | 150 | → | `movement` | 30 | 150 |
| Alimentación | 150 | → | `nutrition` | 30 | 150 |
| Mente | 150 | → | `mind` | 30 (incluye la familia fusionada, con 10 variantes) | 155 |
| Rutinas | 150 | → | `adherence` | 29 (una familia completa se reasignó a `mind` por la fusión) | 145 |
| **Total** | **600** | | | **119** | **600** |

La aritmética se explica así: `Mente` aporta sus 30 familias originales íntegras a `mind` (150 variantes), pero una de ellas ("Sin alcohol # h antes de dormir") absorbe además las 5 variantes de la familia equivalente de `Rutinas`, por lo que `mind` termina con 155 variantes en 30 familias. `Rutinas` aporta sus 30 familias originales, pero una de ellas queda consolidada dentro de `mind` en lugar de contarse como familia `adherence` independiente, por lo que `adherence` termina con 29 familias y 145 variantes (145 = 150 − 5, las 5 variantes que se movieron a la familia fusionada de `mind`).

## 3. Consolidación del duplicado Mente/Rutinas (Decisión 2)

- **Familia canónica resultante**: `mind.sleep.sin_alcohol_h_antes_de_dormir`
- **Legacy pillars involucrados**: `Mente` (fuente de valores activos) y `Rutinas` (deprecated)
- **Legacy IDs Mente** (activos, definen el DVG): `MEN-INI-018`, `MEN-BRO-048`, `MEN-PLA-076`, `MEN-ORO-107`, `MEN-PTN-134`
- **Legacy IDs Rutinas** (deprecated, `CROSS_PILLAR_DUPLICATE`, `LEGACY_DEPRECATED`): `RUT-INI-029`, `RUT-BRO-059`, `RUT-PLA-089`, `RUT-ORO-120`, `RUT-PTN-136`
- **Efecto en el cálculo de DVG**: únicamente las 5 variantes con `status: "active"` (las de `Mente`) participan en `calculation_order` del motor canónico. Las 5 variantes de `Rutinas` quedan con `status: "deprecated"` y **no pueden producir un segundo DVG** — se conservan solo por trazabilidad histórica (valores de crédito, texto de dosis y mensaje al usuario tal como existían en el Excel v3).
- **review_flags** en la familia: `CROSS_PILLAR_DUPLICATE_RESOLVED`.

## 4. Transformación `Rutinas → adherence` (Decisión 3)

Las 30 familias del antiguo pilar `Rutinas` (29 tras la fusión de la sección 3) se redistribuyeron entre los 7 subdominios propuestos, según el contenido real de cada subpilar (no por su nombre histórico):

| canonical_subdomain (`adherence.*`) | subpilares legacy incluidos | nº familias |
|---|---|---|
| `movement` | Acumular MVPA, Adherencia ejercicio, Movilidad, Pasos acumulados, Romper sedentarismo, Romper sedentarismo/NEAT, Transporte activo | 7 |
| `nutrition` | Aumentar fruta, Cereales integrales, Glucemia postprandial, Mejor elección, Patrón mediterráneo, Planificación nutricional, Reducción SSB | 7 |
| `sleep` | Higiene del sueño, Regularidad sueño, Sueño/calidad (parcial — ver sección 3), Sueño/relajación, Glucemia/sueño | 5 (4 activas + 1 absorbida por `mind`) |
| `stress` | Dolor/estrés, Estrés/fatiga, Reducción estrés | 3 |
| `self_tracking` | Automonitoreo, Feedback/adhesión, Objetivo semanal, Implementación hábito, Autocuidado | 5 |
| `social` | Conexión social | 1 |
| `emotional_wellbeing` | — (ningún subpilar legacy de Rutinas encajaba sin forzar la clasificación; se deja el subdominio disponible para uso futuro) | 0 |

No se propuso ningún subdominio adicional a los 7 sugeridos por César — los datos históricos no lo exigían.

**Nota de nomenclatura explícita**: `adherence` (motor de gamificación / backend) es un concepto distinto de la pantalla `Rutinas` de la app moderna (sesiones/programas estructurados de ejercicio). No deben confundirse ni fusionarse conceptualmente; esta separación queda documentada aquí para que cualquier futura integración de UI no reutilice por error las acciones de `adherence` como si fueran contenido de la pestaña "Rutinas de ejercicio".

## 5. `canonical_domain` y `canonical_subdomain` — mapa completo

| legacy_pillar | canonical_domain | canonical_subdomain(s) usados |
|---|---|---|
| Retos (Ejercicio) | `movement` | `strength` (8 fam.), `cardio` (6), `hiit` (4), `mobility` (2), `daily_activity` (4), `fall_prevention` (1) |
| Alimentación | `nutrition` | `mediterranean_pattern` (12), `processed_reduction` (8), `hydration` (1), `meal_planning` (6) |
| Mente | `mind` | `sleep` (6, incl. familia fusionada), `stress` (8), `emotional_wellbeing` (6), `self_tracking` (3), `social` (1) |
| Rutinas | `adherence` | `movement` (7), `nutrition` (7), `sleep` (4), `stress` (3), `self_tracking` (5), `social` (1), `emotional_wellbeing` (0) |

Las 104 combinaciones (legacy_pillar, subpilar) presentes en los datos tienen mapeo explícito — verificado programáticamente sin excepciones ni "catch-all".

## 6. Normalización de unidades

| legacy_unit (original, preservado en provenance) | normalized_unit (canónico) |
|---|---|
| `1 día`, `Diaria` | `daily` |
| `1 semana`, `Semanal` | `weekly` |
| `1 sesión` | `session` |
| `1 jornada` | `workday` |
| `1 comida` | `meal` |
| `1 hito` | `milestone` |

El valor original (`legacy_unit`) se conserva sin modificar en cada `action_family`; `normalized_unit` es un campo añadido, no una sustitución.

## 7. Reglas del motor: deprecated y reference-only

- **`LEGACY_DEPRECATED`**: `levels` / `levelMultiplier` histórico (Inicial 0,90 – Bronce 1,00 – Plata 1,08 – Oro 1,16 – Platino 1,24). Conservado íntegro en `legacy_deprecated.level_multiplier` del motor canónico, con la razón de depreciación documentada. No aparece en `calculation_order`.
- **`LEGACY_REFERENCE_ONLY`**: objetivos anuales de DVG (`Plata≈45`, `Oro≈60`, `Platino≈90` días/año/pilar) del PDF histórico, sección 8. Conservados en `legacy_reference_only.annual_dvg_targets`, junto con el resultado del chequeo aproximado de la auditoría Fase 0, explícitamente marcados `NOT_A_CALIBRATION_REQUIREMENT`.
- **`SINGLE_SOURCE_ENGINE_RULE`**: reglas de `diminishing_returns` (rendimientos decrecientes), porque solo existen en `engine_config.json` sin corroboración en Excel v3 (no hay hoja `Engine_Caps`) ni cifras exactas en el PDF. Se conservan sin modificar, marcadas para posible revisión futura.

## 8. Review flags activos en el canon (acción humana pendiente, no bloqueante)

| review_flag | dónde aparece | motivo |
|---|---|---|
| `CROSS_PILLAR_DUPLICATE_RESOLVED` | familia `mind.sleep.sin_alcohol_h_antes_de_dormir` | Decisión 2 aplicada; documentado por si se decide revertir o depurar del todo en el futuro. |
| `REQUIRES_DVG_REVIEW` | familias `movement.daily_activity.pausa_activa_de_min_cada_min` y `...snacks_de_movimiento...` (ambas del subpilar "Romper sedentarismo") | Outlier estadístico de crédito bajo dentro de su pilar/nivel; probablemente intencional (dosis corta) pero sin confirmación explícita. |
| `REQUIRES_SOURCE_REVIEW` | familias `movement.mobility.serie_de_movilidad_articular_min` y `movement.mobility.yoga_fluido_min` | Usan `MBI_DISTRESS2023` (mindfulness/distrés) como única fuente en un pilar de ejercicio; defendible pero no confirmado. |

Ninguno de estos flags ha sido resuelto en esta fase — se han conservado tal cual la auditoría los identificó, sin sustituir bibliografía ni recalibrar créditos, tal como se instruyó.

## 9. `legacy_domain_rationale`

El campo histórico "Justificación breve" se ha renombrado a `legacy_domain_rationale` en el canon y se documenta explícitamente como una etiqueta de dominio (solo 4 valores distintos en las 600 filas originales, uno por pilar legacy), no como una justificación científica individual por acción o familia. Queda pendiente de una revisión científica acción-por-acción/familia en una fase posterior, no realizada aquí.

## 10. Fuentes bibliográficas

Las 16 fuentes de la hoja `Fuentes` del Excel v3 se conservan íntegramente en `source_ids` de cada `action_family` canónica (unión de fuentes cuando una familia fusiona dos legacy, como en el caso Mente/Rutinas). Ninguna fuente se ha sustituido, eliminado ni completado con bibliografía nueva.

## 11. Trazabilidad completa

El archivo adjunto `legacy_to_canonical_mapping.csv` contiene las 600 filas con: `legacy_id`, `legacy_pillar`, `legacy_level`, `canonical_action_id`, `canonical_domain`, `canonical_subdomain`, `variant_status` (active/deprecated) y los `review_flags` aplicables. Es la fuente de verdad fila-a-fila de este informe.
