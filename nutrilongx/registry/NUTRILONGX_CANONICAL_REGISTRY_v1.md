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

**Estado del dominio: `FROZEN_FOR_INTEGRATION`** (2026-08-19). Ver
`governance/decisions/NUTRILONGX_DOMAIN_FREEZE_DECISION_v1.md` y el
contrato de integración cross-dominio en
`governance/architecture/NUTRILONGX_DOMAIN_INTEGRATION_CONTRACT_v1.md`.

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

**Estado del dominio: `FROZEN_FOR_INTEGRATION`** (2026-08-19). No bloquea
integración de contenido/gamificación; sí bloquea automatización clínica
mientras las 3 specs sigan `REFERENCED_NOT_RECOVERED`.

**Fuente de verdad**: `nutrition/canonical/NUTRILONGX_ALIMENTACION_MASTER_v1.json`
— **FROZEN**, `status` propio: `ACTIVE_WITH_REFERENCED_NOT_RECOVERED_SPECS`.
Tras la auditoría del workbook recuperado (ver abajo): **`NO_MASTER_CHANGE_REQUIRED`**
— no se ha generado ni se genera `NUTRILONGX_ALIMENTACION_MASTER_v1.1`, y el JSON
FROZEN sigue byte a byte idéntico.

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
  el registry: `artifact_type: SOURCE`, `status: RECOVERED_PARTIAL_SOURCE`,
  `source_of_truth: false`, `production_ready: false`. No existe una segunda
  fila placeholder para este mismo fichero.
  Tras la auditoría de contenido READ-ONLY
  (`nutrition/reports/NUTRILONGX_MOTOR_RECETAS_WORKBOOK_AUDIT_v1.md`,
  aprobada 2026-08-19), el alcance queda determinado con evidencia interna
  del propio fichero: `source_scope` = fuente de contenido/receta para
  **8/58 recetas** (`NLX-001`–`NLX-008`); `clinical_spec_recovery` = las 3
  specs `NOT_FOUND` (0 fórmulas, 0 definiciones de perfil, 0 tabla de
  umbrales); `contains_clinical_outputs: true` (matriz de 10 categorías
  `APTO_*`, salida por receta) pero `contains_clinical_rules: false`;
  `contains_formulas: false`. `RECOVERED_PARTIAL_SOURCE` **no implica** que
  las 3 specs de arriba se hayan recuperado ni que este Excel sea fuente
  clínica validada — sigue sin ser `CANONICAL`.
- `clinical/missing/NUTRILONGX_NUTRITION_MISSING_SPECS_v1.md` es el **registro
  de gobernanza** que narra ambos estados (`artifact_type: governance_record`,
  `status: ACTIVE`, `source_of_truth: false`) — documenta el hallazgo, **no
  sustituye ni reconstruye** ninguna de las 3 especificaciones pendientes ni
  valida el contenido del Excel localizado.
- Auditoría de contenido del workbook, persistida en `nutrition/reports/`:
  `NUTRILONGX_MOTOR_RECETAS_WORKBOOK_AUDIT_v1.md` (`artifact_type: AUDIT`) +
  2 CSV de soporte (`artifact_type: AUDIT_SUPPORT`) — inventario de hojas y
  candidatos de regla evaluados. Ninguno es `source_of_truth`.
- **Hallazgo adyacente sin clasificar** (no persistido, requiere decisión de
  César): un corpus doctrinal de validación/corrección de recetas v1.2 y una
  versión anterior sin versionar, en `Nuevo NUTRILONGX/`. Ver
  `registry/NUTRILONGX_STAGING_RECONCILIATION_v1.md` §3.

## EXERCISE

**Estado del dominio: `FROZEN_FOR_INTEGRATION`** (2026-08-19). **No**
`PRODUCTION_READY` — biblioteca piloto incompleta y safety rules pendientes
de `HUMAN_REVIEW`. Ver `governance/decisions/NUTRILONGX_DOMAIN_FREEZE_DECISION_v1.md`.

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

## STANDALONE BACKEND v1

**Estado: specs `APPROVED`, implementación `NOT_STARTED`** (2026-08-20).
Decisión de CORE CENTRAL, subordinada a — y consistente con — el
`DOMAIN_INTEGRATION_CONTRACT_v1` y el `DOMAIN_FREEZE_DECISION_v1` ya
`FROZEN`. Ningún artefacto FROZEN previo (Masters/Library/Safety/Catalog/
Engine) se ha modificado para producir esta sección.

**Fuente de verdad** de las 5 specs siguientes: cada documento es
`source_of_truth: true` para su propio dominio (excepto la auditoría, que es
evidencia, no fuente):

- `governance/decisions/NUTRILONGX_STANDALONE_ARCHITECTURE_DECISION_v1.md`
  — decisión arquitectónica: añade `content_registry` (17 tablas objetivo);
  las 6 tablas legacy de Mente (`content_pieces, retos_insignia, videos,
  video_bloques, infografias, subpilar_mapeo`) migran a `mind_content` **sin
  DROP inicial**; Google Apps Script pasa a ser la **service/function layer
  standalone** — los accesos directos browser→Supabase y las APIs
  funcionales legacy de Vercel se retiran progresivamente tras cutover
  validado. **Esta decisión prevalece explícitamente** sobre la redacción
  conceptual previa de `NUTRILONGX_CONSOLE_API_BOUNDARY_v1.md` (que
  describía Apps Script como mero cliente de otra API) — se mantiene, sin
  excepción, la frontera ya congelada: Dashboard/Apps Script **no**
  redefinen catálogo, DVG, motor ni safety rules.
- `governance/architecture/NUTRILONGX_STANDALONE_DATA_MODEL_v1.md` — modelo
  de datos conceptual de las 17 tablas objetivo (`clients` … `audit_log`).
  Ningún SQL ejecutado.
- `governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md`
  — contrato funcional (`clients.*`, `content.*`, `evidence.*`, `actions.*`,
  `gamification.*`, `progress.*`, `safety.*`), envelopes de éxito/error,
  idempotencia. Ningún Apps Script implementado.
- `governance/audits/NUTRILONGX_EXISTING_SUPABASE_AUDIT_v1.md` — auditoría
  read-only de estructuras Supabase-facing existentes (migración `0001`,
  `api/pilares/mente`, `api/content/create.ts`, `actions_catalog`/
  `action_logs` históricos), clasificadas `KEEP`/`ADAPT`/`MIGRATE`/
  `DEPRECATE`. **No autoriza ninguna eliminación.** `source_of_truth: false`
  — es evidencia, no fuente de contenido; consistente con el conflicto ya
  registrado y no resuelto en `NUTRILONGX_SUPABASE_SCHEMA_RECONCILIATION_NOTE_v1.md`.
- `governance/implementation/NUTRILONGX_BACKEND_IMPLEMENTATION_PLAN_v1.md`
  — secuencia de implementación (Fase 0–8). Ninguna fase ejecutada.

Los 5 documentos son `frozen: true` (no se editan in situ; una revisión
futura requeriría `_v2`) y `production_ready: false` — son especificaciones
aprobadas previas a implementación, no el backend en sí.

**Fase 1 de implementación — `APPLIED_AND_VERIFIED` (2026-08-20)**:
`supabase/migrations/0002_standalone_backend_v1.sql` (17 tablas, aditiva,
RLS sin policies nuevas, migración de Mente incluida) +
`supabase/migrations/0003_standalone_backend_v1_security_hardening.sql`
(2 `ALTER` de hardening: `search_path` de `nlx_set_updated_at()` y schema
de la extensión `unaccent`) **aplicadas contra el proyecto Supabase real**
(`muyqbqbyvysgqasllgni`) y certificadas por CORE CENTRAL — `public` pasa de
6 a 23 tablas, Security Advisor `WARN: 0` tras el hardening. Import
canónico ejecutado y verificado idempotente: 58 recipes/207 bindings/24
exercises/20 variants/119 canonical_actions/12 safety_rules/0
accreditation_rules. Mente migrada: 27+6+4+3 filas legacy → 40
`mind_content`, 0 huérfanos. Invariantes confirmadas live
(`execution_evidence/action_logs/client_progress/daily_progress = 0`).
**No verificado de forma independiente por Claude Code** — ejecutado y
certificado externamente, sin credenciales disponibles en este entorno.
Detalle completo en
`governance/implementation/NUTRILONGX_BACKEND_PHASE1_IMPLEMENTATION_REPORT_v1.md`.

**Fase 2A de implementación — `IMPLEMENTED, PENDING_DEPLOY` (2026-08-20)**:
`apps-script/` implementa `FOUNDATION` + `clients.*` + `content.*` del
`NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1`. 58/58 tests locales PASS
(`node apps-script/tests/run_all.mjs`) — puros, con dependencias fake, y
end-to-end con `PropertiesService`/`UrlFetchApp`/`Utilities`/
`ContentService` nativos stubeados. **No desplegado ni verificado contra
Apps Script/Supabase reales** — sin credenciales de Google en este entorno.
Cero referencias a DVG/gamificación/safety rules en `apps-script/src/`
(verificado por grep). Detalle completo en
`governance/implementation/NUTRILONGX_APPS_SCRIPT_PHASE2A_IMPLEMENTATION_REPORT_v1.md`.

**Siguiente gate**: `APPS_SCRIPT_2A_IMPLEMENTED_PENDING_DEPLOY`. No
`READY_FOR_EVIDENCE_IMPLEMENTATION`, no `PRODUCTION_READY`.

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
