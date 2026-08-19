# NUTRILONGX — Canonical Registry v1

Este documento responde, en menos de 5 minutos de lectura, a: **¿cuál es la
fuente de verdad actual de Gamificación, Alimentación y Ejercicio, qué la
sustenta, qué está FROZEN, qué es legacy, qué está superseded, qué está
pendiente y qué referencia no se ha recuperado?**

Regla para cualquier humano o agente que lea esto en el futuro:

> **Ningún agente debe considerar un archivo de `/archive` o de
> `documentos nuevos/` como fuente de verdad si existe un artefacto
> `source_of_truth: true` activo registrado en
> `NUTRILONGX_ARTIFACT_REGISTRY_v1.json`.**

---

## GAMIFICATION

**Fuente de verdad**: `gamification/canonical/NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json`
+ `gamification/canonical/NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json`
— ambos **FROZEN**.

- 600 filas legacy originales → **119 familias canónicas**, 600 variantes de
  nivel (595 activas, 5 deprecated), 4 dominios: `movement` (30 familias),
  `nutrition` (30), `mind` (30), `adherence` (29). Verificado directamente
  contra el JSON (`counts` interno).
- El motor canónico define `base_dvg_hours` directamente desde
  `level_variants[*].base_dvg_hours` del catálogo. La regla histórica
  `levelMultiplier` (Inicial/Bronce/Plata/Oro/Platino =
  0.90/1.00/1.08/1.16/1.24) es **`LEGACY_DEPRECATED`**, excluida del
  `calculation_order`, y **no debe aplicarse** sobre el crédito ya incluido
  en las `level_variants` — confirmado leyendo `governance_decisions_applied`
  del propio motor canónico.
- Mapeo de gobernanza: `gamification/mappings/NUTRILONGX_LEGACY_MAPPING_REPORT_v1.md`
  + `gamification/mappings/legacy_to_canonical_mapping.csv` (600→119).
- Auditoría de origen: `gamification/audits/NUTRILONGX_AUDITORIA_FASE0_v1.md`.
- **Legacy sources** (predecesores del canon, NO usar como fuente de verdad):
  `gamification/sources/legacy/` — `NUTRILONGX_creditos_v3.xlsx` (y su
  predecesora `NUTRILONGX_creditos.xlsx`), `actions_catalog.json`,
  `actions_catalog1.txt`, `engine_config.json`, `engine_reference.ts`,
  `excel_to_json_upsert.py`/`upsert1.py`/`upsert2.py`,
  `NUTRILONGX_README.txt`, `PLAN DE GAMIFICACIÓN NUTRILONGX.pdf`. Localizados
  fuera de `documentos nuevos/`, en la carpeta hermana `Gamificación/`.
- **Importante — knowledge canon ≠ estado real de Supabase**: este registro
  documenta el **catálogo/motor de conocimiento**, no confirma qué tablas
  existen hoy en el Supabase de producción. Ver
  `governance/audits/NUTRILONGX_SUPABASE_SCHEMA_RECONCILIATION_NOTE_v1.md`
  — hay evidencia en conflicto (no resuelta) sobre si `actions_catalog`/
  `action_logs` existen como tablas reales hoy.

## NUTRITION

**Fuente de verdad**: `nutrition/canonical/NUTRILONGX_ALIMENTACION_MASTER_v1.json`
— **FROZEN**, `status` propio: `ACTIVE_WITH_REFERENCED_NOT_RECOVERED_SPECS`.

- 58 recetas. Madurez verificada directamente contra el JSON:
  **8 `ACTIVE_READY`** (NLX-001 a NLX-008), **43 `PARTIAL`**,
  **7 `INCOMPLETE`** (`NLX-015, NLX-016, NLX-018, NLX-020, NLX-032, NLX-045,
  NLX-051` — coincide exactamente con lo esperado).
- Ningún `COMPOSITION_UNKNOWN`/`null` se ha convertido en `0` — no se ha
  tocado el JSON en absoluto (copia byte a byte verificada).
- Schema: `nutrition/schemas/NUTRILONGX_ALIMENTACION_MASTER_SCHEMA_v1.md`.
- Reports: `nutrition/reports/` (`AUDIT_PHASE1_v1`, `FASE1B_PREP_v1`,
  `MASTER_BUILD_REPORT_v1`).
- Sources: `nutrition/sources/` — `NUTRILONGX_RECIPES_MASTER_v1.7_...json`
  (`CANONICAL_BASE`, 58 recetas) y `NUTRILONGX_RECIPES_MASTER_v1.6_...json`
  (`PROVENANCE_COMPARATOR`, diff declarado `IDENTICAL_RECIPES_ADDITIVE_TOPLEVEL_ONLY`
  contra v1.7 — ambos son fuente, no hay supersession clásica entre ellos).
  También `NUTRILONGX_Motor_Recetas_v1_1.xlsx`, localizado fuera de
  `documentos nuevos/` — ver nota en `clinical/missing/`.
- Supporting: `nutrition/supporting/NUTRILONGX_ADHERENCIA_DOMESTICA_RECETAS_v1.md`.
- **REFERENCED_NOT_RECOVERED** (declarado por el propio master, confirmado
  tras la auditoría, sin fichero físico localizado): `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0`,
  `NUTRILONGX_CLINICAL_PROFILES_v1.0`, `NUTRILONGX_CLINICAL_RULES_v1.0`.
  **Las 3 tienen su propia fila independiente** en
  `NUTRILONGX_ARTIFACT_REGISTRY_v1.json` (`artifact_type: referenced_spec`,
  `status: REFERENCED_NOT_RECOVERED`, sin `relative_path`).
- `NUTRILONGX_Motor_Recetas_v1_1.xlsx` **sí se ha localizado físicamente**
  (`nutrition/sources/`, SHA-256 real) y tiene **una única fila lógica** en
  el registry: `artifact_type: SOURCE`, `status:
  RECOVERED_PENDING_CONTENT_VALIDATION`, `source_of_truth: false`. No existe
  una segunda fila placeholder para este mismo fichero — se corrigió una
  inconsistencia previa que lo representaba simultáneamente como fichero
  real y como `REFERENCED_NOT_RECOVERED`.
  `RECOVERED_PENDING_CONTENT_VALIDATION` **no implica** que las 3 specs de
  arriba se hayan recuperado ni que este Excel sea fuente clínica validada.
- `clinical/missing/NUTRILONGX_NUTRITION_MISSING_SPECS_v1.md` es el **registro
  de gobernanza** que narra ambos estados (`artifact_type: governance_record`,
  `status: ACTIVE`, `source_of_truth: false`) — documenta el hallazgo, **no
  sustituye ni reconstruye** ninguna de las 3 especificaciones pendientes ni
  valida el contenido del Excel localizado.
- **Hallazgo adyacente sin clasificar** (no persistido, requiere decisión de
  César): un corpus doctrinal de validación/corrección de recetas v1.2 y una
  versión anterior sin versionar, en `Nuevo NUTRILONGX/`. Ver
  `registry/NUTRILONGX_STAGING_RECONCILIATION_v1.md` §3.

## EXERCISE

**Fuente de verdad (contenido de biblioteca)**:
`exercise/library/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json` — **FROZEN**.
**Fuente de verdad (esquema)**: declarada por la propia library como
`NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.2` — **el fichero físico v1.2 no
existe**; el esquema recuperado más reciente como documento real es
`exercise/schemas/NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.1.md` (`status`
propio: `SCHEMA_APPROVED_NOT_YET_BUILT`).

- Library Pilot v1.1: **24 `EXERCISE` + 20 `EXERCISE_VARIANT` = 44 objetos**,
  verificado contra el `counts` interno del JSON.
- Cadena de supersession de biblioteca: `v1.json` (archive) →
  `v1.1.json` (FROZEN, vigente). Mapping:
  `exercise/mappings/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1_TO_v1.1_MAPPING.csv`.
- Cadena de supersession de schema: `SCHEMA_v1.md` (archive) →
  `SCHEMA_v1.1.md` (recuperado, vigente) → `SCHEMA_v1.2.md`
  (**referenciado por 7 documentos, no recuperado como fichero**).
- Cadena de supersession de plan de piloto: `PHASE3A_PILOT_PLAN_v1.md`
  (archive) → `PHASE3A_PILOT_PLAN_v1.1.md` (vigente, post Entity Purity Pass).
- Safety: `exercise/safety/NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json` — **12
  reglas**, `review_status: PENDING_HUMAN_REVIEW` en las 12,
  `content_maturity: STRUCTURALLY_COMPLETE` en las 12. **No son
  `PRODUCTION_READY`.**
  - Distribución verificada por `safety_status`: **6 `PRECAUTION`, 4
    `ADAPTATION`, 2 `RELATIVE_CONTRAINDICATION`, 0 `ABSOLUTE_CONTRAINDICATION`**.
    ⚠️ **Discrepancia frente a lo esperado en el encargo** (que indicaba 5
    `PRECAUTION` / 5 `ADAPTATION` / 2 `RELATIVE_CONTRAINDICATION`): el total
    (12) y el 0 en `ABSOLUTE_CONTRAINDICATION` coinciden, pero el reparto
    `PRECAUTION`/`ADAPTATION` verificado es 6/4, no 5/5. Se reporta el dato
    verificado contra el fichero real, sin corregir el fichero ni la
    afirmación previa — solo se deja constancia de la diferencia para
    revisión humana.
  - `NOT_ASSESSED` sigue siendo el comportamiento por defecto para
    combinaciones no cubiertas por ninguna de las 12 reglas — no se ha creado
    ninguna regla nueva ni se han convertido gaps (`PARTIALLY_RESOLVED`,
    `UNRESOLVED`, `EVIDENCE_GAP`) en reglas.
- `NUTRILONGX_EJERCICIO_PROVENANCE_SCHEMA_AMENDMENT_v1.md`: status propio
  declarado **`PROPOSED_NOT_APPLIED`**, "pendiente de aprobación de César".
  ⚠️ Difiere ligeramente de la descripción del encargo
  (`APPROVED_FOR_NEXT_BUILD` / `PROPOSED_NOT_APPLIED_TO_v1.1`) — se registra
  el estado tal cual lo declara el documento, no el descrito de memoria. La
  propuesta **no se ha aplicado** a `LIBRARY_PILOT_v1.1.json` (verificado:
  copia byte a byte idéntica al original).
- `#30 entrenamiento_reactivo_de_pasos`: confirmado `EXERCISE`, estado
  `NEXT_APPROVED_EXERCISE_PENDING_BUILD`. **No incorporado** a v1.1 (verificado
  ausente en el JSON).
- `#31 escalera_de_agilidad`: confirmado `SESSION_TEMPLATE`,
  `DEFERRED_TO_PHASE3C`. No construido.
- `BEHAVIOURAL_CONTENT`: tipo formal introducido en gobernanza,
  `PHASE3F_PENDING`.
- `NUTRILONGX_EJERCICIO_MASTER_v1.json` (master completo): **`NOT_BUILT`**.
- `SESSION_TEMPLATE`, `PROGRAM_TEMPLATE`: **`NOT_BUILT`**.
- `PRESCRIPTION`, `EXECUTION`: **`NOT_PART_OF_CONTENT_MASTER`** (fuera del
  alcance del master de contenido por diseño).
- Research: `exercise/research/` (`PHASE3B_TARGETED_RESEARCH_v1`,
  `RESEARCH_REQUIRED_RETAINED_v1` — 6 gaps re-evaluados, 5 `RETAINED` + 1
  `RETAINED_CONDITIONAL`).
- Governance/reports completos preservados en `exercise/governance/` y
  `exercise/reports/` — ver inventario completo en
  `registry/NUTRILONGX_ARTIFACT_REGISTRY_v1.json`.

## CLINICAL

- No existe ningún master clínico (`CLINICAL_PROFILES`, `CLINICAL_RULES`,
  `NUTRIENT_THRESHOLDS`) como artefacto recuperado. Documentado en
  `clinical/missing/NUTRILONGX_NUTRITION_MISSING_SPECS_v1.md`.
- `clinical/profiles/`, `clinical/thresholds/`, `clinical/rules/` quedan
  **vacíos intencionadamente** — no se ha inventado ni inferido contenido
  clínico para rellenarlos.

## INFRASTRUCTURE

- **Separación explícita, per encargo**: este registro documenta
  **conocimiento canónico (JSON/MD versionados)**, no el estado real de
  tablas en Supabase.
- Evidencia real de esquema recogida (no generada, solo trasladada) en
  `governance/audits/`: un snapshot completo de `public` fechado 2026-08-18
  (6 tablas: `content_pieces`, `infografias`, `retos_insignia`,
  `subpilar_mapeo`, `video_bloques`, `videos` — sin `actions_catalog` ni
  `action_logs`) y 3 snapshots de columnas de `action_logs`/`actions_catalog`
  fechados 2025-08-20 (con esas tablas sí presentes). **Conflicto entre
  ambas evidencias registrado explícitamente, no resuelto** — ver
  `NUTRILONGX_SUPABASE_SCHEMA_RECONCILIATION_NOTE_v1.md`.
- No se afirma en ningún punto de este knowledge base que `actions_catalog`,
  `action_logs`, `users`, `achievements`, `user_day`, `user_badges` o
  `badges` existan hoy en el Supabase real, salvo la evidencia fechada
  arriba, presentada como evidencia, no como hecho confirmado.
