# NUTRILONGX — Project State v1

Fecha: 2026-08-19. Refleja exclusivamente lo verificado durante esta
consolidación documental. No se inventa ni se extrapola nada más allá de lo
que los propios artefactos declaran.

## DOMAIN INTEGRATION CONTRACT (2026-08-19)

Los 3 dominios pasan a `FROZEN_FOR_INTEGRATION` — arquitectura estable para
diseñar backend/APIs/Supabase/consola, **sin** implicar `PRODUCTION_READY`.
Ver `governance/decisions/NUTRILONGX_DOMAIN_FREEZE_DECISION_v1.md` y
`governance/architecture/NUTRILONGX_DOMAIN_INTEGRATION_CONTRACT_v1.md`
(+ `SOURCE_OF_TRUTH_MATRIX_v1.md`, `ACTION_ACCREDITATION_CONTRACT_v1.md`,
`CONSOLE_API_BOUNDARY_v1.md`). Regla fundamental fijada: `RECIPE`,
`EXERCISE`, `SESSION`, `PROGRAM`, `CONTENT` nunca generan DVG por existir —
solo un `ACTION_LOG` validado, vía el motor canónico. No se ha construido
ningún `action_log`, `ACTION_ACCREDITATION_RULE` ni conector de evidencia
real en esta fase — son contratos conceptuales.

## STANDALONE BACKEND v1 (2026-08-20)

- **Specs**: `APPROVED` — 5 documentos persistidos como canon (arquitectura,
  modelo de datos, contrato de funciones Apps Script, auditoría Supabase
  existente, plan de implementación). Ver sección `STANDALONE BACKEND v1`
  de `NUTRILONGX_CANONICAL_REGISTRY_v1.md`.
- **Implementation — Fase 1 (2026-08-20)**: `IMPLEMENTATION_READY_FOR_SUPABASE_APPLY`.
  `supabase/migrations/0002_standalone_backend_v1.sql` (17 tablas objetivo,
  aditiva, sin DROP de legacy, RLS habilitado sin policies nuevas,
  migración no destructiva de Mente incluida) **escrita, validada
  estáticamente, NO aplicada contra Supabase real** — sin credenciales
  disponibles en el entorno de ejecución. `scripts/nutrilongx/import_standalone_canon.mjs`
  (dry-run: 58 recipes/207 bindings/24 exercises/20 variants/119
  canonical_actions/12 safety_rules/0 accreditation_rules, todos verificados
  contra el canon real en Git) y `scripts/nutrilongx/verify_standalone_backend.mjs`
  escritos, sintaxis validada, no ejecutados contra un proyecto real.
  Apps Script sigue `NOT_IMPLEMENTED`. Detalle completo en
  `governance/implementation/NUTRILONGX_BACKEND_PHASE1_IMPLEMENTATION_REPORT_v1.md`.
- **Next gate**: `IMPLEMENTATION_READY_FOR_SUPABASE_APPLY` (no
  `READY_FOR_APPS_SCRIPT_IMPLEMENTATION` — no declarado hasta que la
  migración se aplique y verifique contra el proyecto real).
- Decisiones CORE CENTRAL congeladas: `content_registry` añadido (17 tablas
  objetivo, no 16); las 6 tablas legacy de Mente migran a `mind_content` sin
  `DROP` inicial; Google Apps Script pasa a ser la service/function layer
  standalone (retirada progresiva de browser→Supabase directo y APIs
  funcionales legacy de Vercel tras cutover validado).
- Ningún estado `FROZEN`/`FROZEN_FOR_INTEGRATION` previo (Gamification,
  Nutrition, Exercise) se altera por esta fase — se preservan tal cual
  abajo.

## GAMIFICATION

status: `FROZEN_FOR_INTEGRATION`.

- Canónico v1 construido y **FROZEN**.
- 119 action families canónicas (de 600 filas legacy), 4 dominios
  (`movement`, `nutrition`, `mind`, `adherence`).
- Motor canónico separado del catálogo, también **FROZEN**.
- **No confundir este catálogo documental con el estado real de tablas
  Supabase** — ver sección INFRASTRUCTURE.

## NUTRITION

status: `FROZEN_FOR_INTEGRATION`.

- `ALIMENTACION_MASTER_v1` **FROZEN**.
- 58 recetas.
- 8 `ACTIVE_READY`, 43 `PARTIAL`, 7 `INCOMPLETE`.
- 3 specs clínicas (`NUTRIENT_THRESHOLDS_v1.0`, `CLINICAL_PROFILES_v1.0`,
  `CLINICAL_RULES_v1.0`) siguen `REFERENCED_NOT_RECOVERED` tras auditoría
  local exhaustiva (incluida búsqueda dirigida fuera de `documentos
  nuevos/`).
- 1 workbook adicional (`NUTRILONGX_Motor_Recetas_v1_1.xlsx`) sí se ha
  localizado fuera de `documentos nuevos/`, pero el master lo declara
  `REFERENCED_NOT_RECOVERED` en su propia procedencia — no se ha usado para
  modificar el master.

## EXERCISE

status: `FROZEN_FOR_INTEGRATION`. Explícitamente **no** `PRODUCTION_READY`.

- `MASTER_SCHEMA_v1.2` referenciado como vigente por 7 documentos
  distintos, pero **el fichero físico no se ha recuperado**; el schema
  recuperado más reciente en disco es `v1.1` (`SCHEMA_APPROVED_NOT_YET_BUILT`).
- `Library Pilot v1.1` **FROZEN**.
- 24 `EXERCISE`, 20 `EXERCISE_VARIANT`.
- 12 `safety_rules`, todas `APPROVED_PENDING_HUMAN_REVIEW`, ninguna
  `PRODUCTION_READY`. Distribución verificada: 6 `PRECAUTION` / 4
  `ADAPTATION` / 2 `RELATIVE_CONTRAINDICATION` / 0 `ABSOLUTE_CONTRAINDICATION`
  (difiere del reparto 5/5/2 descrito en el encargo — total y `ABSOLUTE`
  coinciden, el reparto interno `PRECAUTION`/`ADAPTATION` no).
- `Exercise Master` final: **`NOT_BUILT`**.
- `Sessions`: **`NOT_BUILT`**.
- `Programs`: **`NOT_BUILT`**.
- `Behavioural Content`: **`PHASE3F_PENDING`**.
- `#30` (`entrenamiento_reactivo_de_pasos`): **`NEXT_APPROVED_EXERCISE_PENDING_BUILD`**,
  no incorporado.
- `#31` (`escalera_de_agilidad`): **`DEFERRED_TO_PHASE3C`**, no construido.
- `Provenance schema amendment`: status propio declarado **`PROPOSED_NOT_APPLIED`**
  ("pendiente de aprobación de César"), **no aplicado** a `LIBRARY_PILOT_v1.1`
  (verificado byte a byte).

## CLINICAL

- Sin master clínico recuperado. Carpetas `clinical/profiles/`,
  `clinical/thresholds/`, `clinical/rules/` vacías intencionadamente.
- 3 especificaciones (`NUTRIENT_THRESHOLDS_v1.0`, `CLINICAL_PROFILES_v1.0`,
  `CLINICAL_RULES_v1.0`) siguen `REFERENCED_NOT_RECOVERED` en el artifact
  registry, sin `relative_path` (ningún fichero físico localizado).
- `Motor_Recetas_v1_1.xlsx` **ya no** se representa como
  `REFERENCED_NOT_RECOVERED`: tiene una única fila física real
  (`artifact_type: SOURCE`, `status: RECOVERED_PARTIAL_SOURCE`,
  `source_of_truth: false`, `production_ready: false`).
  Auditoría de contenido READ-ONLY completada y aprobada (2026-08-19):
  fuente real de contenido/receta para **8/58 recetas** (`NLX-001`–`NLX-008`);
  **NUTRIENT_THRESHOLDS, CLINICAL_PROFILES y CLINICAL_RULES: los 3 `NOT_FOUND`**
  en el workbook (0 fórmulas, 0 definición de perfiles, 0 tabla de umbrales).
  Contiene salidas clínicas ya aplicadas (`contains_clinical_outputs: true`,
  matriz de 10 categorías `APTO_*`) pero ninguna regla que las produjera
  (`contains_clinical_rules: false`). No implica recuperación de las 3
  especificaciones — siguen `REFERENCED_NOT_RECOVERED`.
  `clinical/missing/NUTRILONGX_NUTRITION_MISSING_SPECS_v1.md` es un registro
  de gobernanza `ACTIVE` que narra ambos estados — no sustituye ni
  reconstruye ninguna de las 3 specs pendientes.
- `NUTRILONGX_ALIMENTACION_MASTER_v1` sigue `FROZEN`. Impacto de esta
  auditoría: `NO_MASTER_CHANGE_REQUIRED` — no se genera `v1.1`.
- Auditoría del workbook persistida en `nutrition/reports/`:
  `NUTRILONGX_MOTOR_RECETAS_WORKBOOK_AUDIT_v1.md` (`AUDIT`) +
  `NUTRILONGX_MOTOR_RECETAS_WORKBOOK_SHEET_INVENTORY_v1.csv` (`AUDIT_SUPPORT`) +
  `NUTRILONGX_MOTOR_RECETAS_WORKBOOK_RULE_CANDIDATES_v1.csv` (`AUDIT_SUPPORT`).
  Ninguno es `source_of_truth`.

## INFRASTRUCTURE

- Supabase/Vercel **no se han modificado** en esta fase. Ninguna migración
  ejecutada, ningún SQL corrido, ningún despliegue de Vercel tocado.
- **No se afirma** que `actions_catalog`, `action_logs`, `users`,
  `achievements`, `user_day`, `user_badges` o `badges` existan en el Supabase
  real hoy, salvo por la evidencia fechada y en conflicto documentada en
  `governance/audits/NUTRILONGX_SUPABASE_SCHEMA_RECONCILIATION_NOTE_v1.md`
  (snapshot de 2026-08-18 sin esas tablas en `public`, frente a snapshots de
  columnas de esas mismas tablas fechados 2025-08-20).
- **KNOWLEDGE CANON** (este directorio `nutrilongx/`) se mantiene
  explícitamente separado de **DEPLOYED DATABASE STATE** (lo que realmente
  hay hoy en `muyqbqbyvysgqasllgni`). Ningún documento de este knowledge base
  debe leerse como confirmación de esquema desplegado.
