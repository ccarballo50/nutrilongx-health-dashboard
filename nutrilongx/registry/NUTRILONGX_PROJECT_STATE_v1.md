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
- **Implementation — Fase 1, actualizado 2026-08-20 tras verificación live**:

  ```yaml
  standalone_backend_phase1:
    schema: APPLIED_AND_VERIFIED
    canonical_import: APPLIED_AND_VERIFIED
    mind_migration: APPLIED_AND_VERIFIED
    referential_integrity: PASS
    rls_security: PASS
    security_advisor_warnings: 0

  apps_script_phase2a:
    foundation: APPLIED_AND_VERIFIED
    clients: APPLIED_AND_VERIFIED
    content: APPLIED_AND_VERIFIED
    deployed: true
    live_verified: true
    script_properties_configured: true

  next_gate:
    READY_FOR_EVIDENCE_IMPLEMENTATION
  ```

  Deploy real completado y verificado 2026-08-20 (sesión posterior, con
  `clasp` autenticado y acceso Supabase vía MCP): proyecto Apps Script
  real, código real subido, Web App desplegado (versión `@1`), los 2
  pasos manuales pendientes (habilitar "Apps Script API"; autorización
  inicial del Web App en navegador) completados por César, Script
  Properties configuradas por César
  (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`DASHBOARD_API_KEY`, nunca
  leídas ni impresas por esta sesión).

  **30/30 puntos de verificación live PASS**: health-check real; auth
  negativa (`UNAUTHORIZED` sin/con key inválida) y positiva reales; router
  allowlist rechaza `__proto__`/`constructor`/`toString`/función
  desconocida (`NOT_FOUND`); fixture `NLX-TEST-2A-001` creado, idempotente,
  conflicto correctamente rechazado; `clients.get/update/getProfile/updateProfile`
  reales, con rechazo de campos prohibidos (`external_code`, `id`,
  `current_level`); `content.listRecipes/getRecipe/listExercises/getExercise`
  reales, `CANONICAL_REFERENCE_NOT_FOUND` para inexistentes; `content.listMind`
  por pilar (`sleep=12, stress=19, conscious_wellbeing=9`, **suma exacta 40**);
  6/6 alias legacy de pilar rechazados; `content.assign` con `pillar`
  derivado server-side (nunca del payload), idempotente en los dos
  mecanismos (`idempotency_key` y duplicado activo); `content.unassign` →
  `cancelled`, nunca `DELETE`; `audit_log` con 5/5 eventos y **5/5
  `request_id` correlacionados exactamente** con las respuestas HTTP; 0
  filas de `audit_log` con patrones de secreto; invariantes de
  gamificación sin cambios (`execution_evidence/action_logs/client_progress/
  daily_progress = 0`); canon sin mutar (`58/24/20/119/12/207/40`
  idénticos al baseline); Security Advisor **17/17 `INFO`, 0 `WARN`**, sin
  cambios. Fixture archivado (`status=archived`) al terminar, sin
  hard-delete, `audit_log` intacto. Detalle test por test en
  `governance/implementation/NUTRILONGX_APPS_SCRIPT_PHASE2A_IMPLEMENTATION_REPORT_v1.md`
  §14-17.

  Código en `apps-script/` (`Errors/Response/Validation/Config/
  SupabaseClient/Audit/ClientsService/ContentService/Router/Main.gs`),
  implementando `clients.*` (list/get/create/update/getProfile/
  updateProfile) y `content.*` (listRecipes/getRecipe/listExercises/
  getExercise/listMind/getMindContent/assign/unassign/listAssignments) del
  contrato funcional. 58/58 tests locales PASS (`node
  apps-script/tests/run_all.mjs`) — puros + con dependencias fake +
  end-to-end con `PropertiesService`/`UrlFetchApp`/`Utilities`/
  `ContentService` nativos stubeados. **No desplegado, no verificado
  contra Apps Script/Supabase reales** — sin credenciales de Google en
  este entorno. Cero referencias a DVG/gamificación/safety rules en
  `apps-script/src/` (verificado por grep) — Fase 2A no toca esos dominios.
  Detalle completo en
  `governance/implementation/NUTRILONGX_APPS_SCRIPT_PHASE2A_IMPLEMENTATION_REPORT_v1.md`.

  `supabase/migrations/0002_standalone_backend_v1.sql` (17 tablas objetivo)
  y `supabase/migrations/0003_standalone_backend_v1_security_hardening.sql`
  (2 `ALTER` de hardening) **aplicadas contra el proyecto Supabase real**
  (`muyqbqbyvysgqasllgni`) y certificadas por CORE CENTRAL — no verificadas
  de forma independiente por Claude Code, que sigue sin credenciales en
  este entorno de ejecución (ver nota de autoría en
  `governance/implementation/NUTRILONGX_BACKEND_PHASE1_IMPLEMENTATION_REPORT_v1.md`
  §0). `public` pasa de 6 a 23 tablas (17 nuevas + 6 legacy preservadas
  intactas). Mente: 27+6+4+3 filas legacy → 40 `mind_content`, 0 huérfanos.
  Import canónico: 58 recipes/207 bindings/24 exercises/20 variants/119
  canonical_actions/12 safety_rules/0 accreditation_rules, verificado
  idempotente (2 ejecuciones `--apply`, mismos counts). Invariantes
  confirmadas live: `execution_evidence=0`, `action_logs=0`,
  `client_progress=0`, `daily_progress=0`. Apps Script sigue
  `NOT_IMPLEMENTED`.
- **Next gate**: `READY_FOR_APPS_SCRIPT_IMPLEMENTATION`. **No**
  `PRODUCTION_READY` — Apps Script y el flujo E2E completo no existen
  todavía.
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
