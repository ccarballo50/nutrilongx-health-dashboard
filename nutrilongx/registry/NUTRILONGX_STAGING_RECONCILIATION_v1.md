# NUTRILONGX — Staging Reconciliation v1

Origen auditado: `documentos nuevos/` (staging/inbox documental), 40 ficheros,
sin subdirectorios. Auditado recursivamente en su totalidad. **No se ha
borrado ni movido ningún original** — esta consolidación solo copia.

Todas las rutas relativas son relativas a la raíz del repo
(`nutrilongx-health-dashboard/`).

## 1. Ficheros de `documentos nuevos/` (40/40 reconciliados)

| # | Filename | SHA-256 (12) | Clasificación | Destino canónico | Notas |
|---|---|---|---|---|---|
| 1 | NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json | `63c3ccdecae4` | CANONICAL / FROZEN | `nutrilongx/gamification/canonical/` | 119 familias, 600 variantes, 4 dominios — verificado |
| 2 | NUTRILONGX_ALIMENTACION_FASE1B_PREP_v1.md | `c4708c1e380e` | BUILD_REPORT | `nutrilongx/nutrition/reports/` | |
| 3 | NUTRILONGX_ALIMENTACION_MASTER_AUDIT_PHASE1_v1.md | `66fa079de612` | AUDIT | `nutrilongx/nutrition/reports/` | persistido como copia canónica |
| 4 | NUTRILONGX_ALIMENTACION_MASTER_AUDIT_PHASE1_v1_1.md | `66fa079de612` | **DUPLICATE (byte-identical)** de #3 | *no copiado* | `duplicate_of`: #3. Mismo SHA-256 exacto. No se persiste dos veces el mismo contenido. |
| 5 | NUTRILONGX_ALIMENTACION_MASTER_BUILD_REPORT_v1.md | `5adab0def124` | BUILD_REPORT | `nutrilongx/nutrition/reports/` | |
| 6 | NUTRILONGX_ALIMENTACION_MASTER_SCHEMA_v1.md | `3d17142c2f28` | SCHEMA | `nutrilongx/nutrition/schemas/` | |
| 7 | NUTRILONGX_ALIMENTACION_MASTER_v1.json | `d045a0833d16` | CANONICAL / FROZEN | `nutrilongx/nutrition/canonical/` | 58 recetas: 8 ACTIVE_READY / 43 PARTIAL / 7 INCOMPLETE — verificado byte a byte contra el JSON |
| 8 | NUTRILONGX_AUDITORIA_FASE0_v1.md | `acc642931ca4` | AUDIT | `nutrilongx/gamification/audits/` | |
| 9 | NUTRILONGX_EJERCICIO_ENTITY_CLASSIFICATION_v1.md | `025ed818d327` | GOVERNANCE | `nutrilongx/exercise/governance/` | |
| 10 | NUTRILONGX_EJERCICIO_EXERCISE_IDENTITY_AUDIT_v1.md | `831d78c9292c` | AUDIT | `nutrilongx/exercise/reports/` | |
| 11 | NUTRILONGX_EJERCICIO_GOVERNANCE_CHANGELOG_v1.1.md | `aacd85e821e4` | GOVERNANCE | `nutrilongx/exercise/governance/` | describe hardening v1.1→v1.2; v1.2 no recuperado como fichero |
| 12 | NUTRILONGX_EJERCICIO_LIBRARY_PILOT_BUILD_REPORT_v1.md | `58c731bc0f92` | BUILD_REPORT | `nutrilongx/exercise/reports/` | corresponde a la library v1 (superseded) |
| 13 | NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json | `e2e1c2a7552b` | CANONICAL / FROZEN | `nutrilongx/exercise/library/` | 24 EXERCISE + 20 EXERCISE_VARIANT = 44 — verificado |
| 14 | NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1_BUILD_REPORT.md | `312d99d32ff3` | BUILD_REPORT | `nutrilongx/exercise/reports/` | |
| 15 | NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.json | `e1c4cb6b51b0` | **SUPERSEDED** | `nutrilongx/exercise/archive/` | `superseded_by`: #13 |
| 16 | NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1_TO_v1.1_MAPPING.csv | `383337c0ca30` | MAPPING | `nutrilongx/exercise/mappings/` | |
| 17 | NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.1.md | `d5695d436c7f` | SCHEMA (recuperado más reciente) | `nutrilongx/exercise/schemas/` | su propio metadata declara `status: SCHEMA_APPROVED_NOT_YET_BUILT` |
| 18 | NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.md | `21041c809667` | **SUPERSEDED** | `nutrilongx/exercise/archive/` | `superseded_by`: #17 (confirmado por cabecera de #17) |
| 19 | NUTRILONGX_EJERCICIO_PHASE2_TO_3_CHANGELOG_v1.md | `6ea9fc7e7666` | GOVERNANCE | `nutrilongx/exercise/governance/` | |
| 20 | NUTRILONGX_EJERCICIO_PHASE3A_CANONICALIZATION_CHANGELOG_v1.md | `1e38647acff4` | GOVERNANCE | `nutrilongx/exercise/governance/` | |
| 21 | NUTRILONGX_EJERCICIO_PHASE3A_PILOT_PLAN_v1.1.md | `597b485722b5` | GOVERNANCE (vigente) | `nutrilongx/exercise/governance/` | |
| 22 | NUTRILONGX_EJERCICIO_PHASE3A_PILOT_PLAN_v1.md | `326f2ef14a4f` | **SUPERSEDED** | `nutrilongx/exercise/archive/` | `superseded_by`: #21 (confirmado por cabecera de #21) |
| 23 | NUTRILONGX_EJERCICIO_PHASE3A_TO_3B_CHANGELOG_v1.md | `9f2569bdd354` | GOVERNANCE | `nutrilongx/exercise/governance/` | |
| 24 | NUTRILONGX_EJERCICIO_PHASE3B_CHANGELOG_v1.md | `3584196ac463` | SAFETY (changelog) | `nutrilongx/exercise/safety/` | |
| 25 | NUTRILONGX_EJERCICIO_PHASE3B_EVIDENCE_TO_RULE_MAPPING_v1.csv | `40e90b6e2470` | SAFETY (mapping) | `nutrilongx/exercise/safety/` | |
| 26 | NUTRILONGX_EJERCICIO_PHASE3B_SAFETY_COVERAGE_PLAN_v1.md | `a000cab0b6b9` | GOVERNANCE | `nutrilongx/exercise/governance/` | |
| 27 | NUTRILONGX_EJERCICIO_PHASE3B_TARGETED_RESEARCH_v1.md | `db631258233c` | RESEARCH_EVIDENCE | `nutrilongx/exercise/research/` | |
| 28 | NUTRILONGX_EJERCICIO_PHASE3B_UNRESOLVED_GAPS_v1.md | `58d19054456c` | SAFETY (gaps) | `nutrilongx/exercise/safety/` | gaps no resueltos preservados tal cual, no convertidos en reglas |
| 29 | NUTRILONGX_EJERCICIO_PROVENANCE_SCHEMA_AMENDMENT_v1.md | `2cb127c19f16` | SCHEMA (propuesta) | `nutrilongx/exercise/schemas/` | status propio declarado: `PROPOSED_NOT_APPLIED` (ver nota de discrepancia en registry humano) |
| 30 | NUTRILONGX_EJERCICIO_RESEARCH_REQUIRED_RETAINED_v1.md | `6db29619a45d` | RESEARCH_EVIDENCE | `nutrilongx/exercise/research/` | |
| 31 | NUTRILONGX_EJERCICIO_SAFETY_RULES_BUILD_REPORT_v1.md | `a8504e21d3ef` | BUILD_REPORT | `nutrilongx/exercise/safety/` | |
| 32 | NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json | `be5a5573547f` | APPROVED_PENDING_HUMAN_REVIEW | `nutrilongx/exercise/safety/` | 12 reglas: 6 PRECAUTION / 4 ADAPTATION / 2 RELATIVE_CONTRAINDICATION / 0 ABSOLUTE — ver nota de discrepancia numérica en registry humano |
| 33 | NUTRILONGX_EJERCICIO_SAFETY_RULE_SCHEMA_v1.md | `ea18ad927c7b` | SCHEMA / APPROVED | `nutrilongx/exercise/schemas/` | |
| 34 | NUTRILONGX_EJERCICIO_SPEC_PHASE1_v1.md | `be3356e197a2` | SCHEMA (spec fundacional) | `nutrilongx/exercise/schemas/` | raíz de `spec_lineage` |
| 35 | NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json | `db26b9b4b458` | CANONICAL / FROZEN | `nutrilongx/gamification/canonical/` | `levelMultiplier` legacy confirmado `LEGACY_DEPRECATED`, excluido de `calculation_order` |
| 36 | NUTRILONGX_LEGACY_MAPPING_REPORT_v1.md | `12cdc24fbf4d` | MAPPING (informe) | `nutrilongx/gamification/mappings/` | |
| 37 | NUTRILONGX_RECIPES_MASTER_v1.6_RETAIL_AGNOSTIC.json | `e4f0fc04c309` | SOURCE (comparador de procedencia) | `nutrilongx/nutrition/sources/` | `role: PROVENANCE_COMPARATOR` según el propio master |
| 38 | NUTRILONGX_RECIPES_MASTER_v1.7_BATCH_AND_COMPOSITION_GAPS.json | `42feb60aab93` | SOURCE (base canónica de recetas) | `nutrilongx/nutrition/sources/` | `role: CANONICAL_BASE` según el propio master |
| 39 | Supabase Snippet Untitled query.csv | `3c6207d13671` | AUDIT (evidencia de infraestructura) | `nutrilongx/governance/audits/` | listado real `table_schema/table_name`, fecha 2026-08-18 — ver nota de reconciliación |
| 40 | legacy_to_canonical_mapping.csv | `14168970543a` | MAPPING | `nutrilongx/gamification/mappings/` | 600 filas legacy → 119 familias |

**Reconciliados: 40/40. Sin `unresolved` dentro de `documentos nuevos/`.**

## 2. Artefactos nombrados en el encargo, buscados fuera de `documentos nuevos/` (Prioridad 3, búsqueda dirigida)

| Artefacto esperado | Encontrado | Ubicación real | Acción |
|---|---|---|---|
| NUTRILONGX_creditos_v3.xlsx | ✅ | `NutriLongX/Gamificación/` | Copiado a `gamification/sources/legacy/` |
| actions_catalog.json (legacy) | ✅ | `NutriLongX/Gamificación/` | Copiado a `gamification/sources/legacy/` |
| engine_config.json | ✅ | `NutriLongX/Gamificación/` | Copiado a `gamification/sources/legacy/` |
| NUTRILONGX_README.txt | ✅ | `NutriLongX/Gamificación/` | Copiado a `gamification/sources/legacy/` |
| PLAN DE GAMIFICACIÓN NUTRILONGX.pdf | ✅ | `NutriLongX/Gamificación/` | Copiado a `gamification/sources/legacy/` |
| NUTRILONGX_ADHERENCIA_DOMESTICA_RECETAS_v1.md | ✅ | `NutriLongX/Nuevo NUTRILONGX/Cuerpo doctrinal GPT/` | Copiado a `nutrition/supporting/` |
| NUTRILONGX_Motor_Recetas_v1_1.xlsx | ✅ | `NutriLongX/Nuevo NUTRILONGX/` | Copiado a `nutrition/sources/` (ver nota en `clinical/missing/`) |
| NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0 | ❌ | — | `REFERENCED_NOT_RECOVERED` (ver `clinical/missing/`) |
| NUTRILONGX_CLINICAL_PROFILES_v1.0 | ❌ | — | `REFERENCED_NOT_RECOVERED` |
| NUTRILONGX_CLINICAL_RULES_v1.0 | ❌ | — | `REFERENCED_NOT_RECOVERED` |
| NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.2.md | ❌ | — | `REFERENCED_NOT_RECOVERED` — citado por 7 documentos distintos como esquema vigente, pero el fichero en sí no existe como artefacto independiente en ningún directorio auditado |

Adicional, no pedido explícitamente pero hallado por asociación directa de
carpeta (mismo directorio que `NUTRILONGX_creditos_v3.xlsx`): `actions_catalog1.txt`,
`engine_reference.ts`, `excel_to_json_upsert.py`/`upsert1.py`/`upsert2.py`,
`NUTRILONGX_creditos.xlsx` (predecesora de v3), `PLAN DE GAMIFICACIÓN
NUTRILONGX.docx`. Se han persistido también como `LEGACY_SOURCE` en
`gamification/sources/legacy/` por ser parte inseparable del mismo lote de
procedencia (misma carpeta, mismas fechas, mismo propósito). Se excluyó
explícitamente `~$NUTRILONGX_creditos_v3.xlsx` (fichero de bloqueo temporal
de Excel, no es contenido real) y **`.env`** (credenciales — ver sección de
seguridad).

Adicional, hallado por relevancia directa para la sección 13 del encargo
(separar knowledge canon de estado real de BD): 3 ficheros CSV en
`NutriLongX/SQL editor/` con esquema real de `action_logs`/`actions_catalog`
fechados 2025-08-20, en aparente conflicto con la evidencia #39 (fechada
2026-08-18). Copiados a `governance/audits/` con nota de reconciliación en
`governance/audits/NUTRILONGX_SUPABASE_SCHEMA_RECONCILIATION_NOTE_v1.md` —
conflicto **registrado, no resuelto silenciosamente**.

## 3. Hallazgos adyacentes — NO persistidos, requieren decisión humana

Durante la búsqueda dirigida de Prioridad 3 aparecieron carpetas y ficheros
claramente relacionados con NutriLongX pero **fuera de lo pedido
explícitamente** en el encargo. Siguiendo la regla "no copies
indiscriminadamente", **no se han incorporado al knowledge base** en esta
fase. Se listan aquí para que César decida:

| Hallazgo | Ubicación | Por qué no se incorpora todavía |
|---|---|---|
| `NUTRILONGX_BIBLIOGRAFIA_NUTRICIONAL_RESUMIDA_v1.2.md`, `NUTRILONGX_EJEMPLOS_VALIDACION_CORRECCION_v1.2.md`, `NUTRILONGX_MANUAL_CORRECCION_RECETAS_v1.2.md`, `NUTRILONGX_MANUAL_VALIDACION_RECETAS_v1.2.md`, `NUTRILONGX_PLANTILLAS_SALIDA_RECETAS_v1.2.md`, `NUTRILONGX_TAXONOMIA_RECETAS_v1.2.md` | `Nuevo NUTRILONGX/Cuerpo doctrinal GPT/` | Corpus doctrinal completo de validación/corrección de recetas, v1.2, no nombrado en el encargo. Podría ser metodología previa al `MASTER_v1` o complementaria — requiere que César confirme su relación con `ALIMENTACION_MASTER_v1` antes de clasificarlo. |
| `NUTRILONGX_EJEMPLOS_VALIDACION_RECETAS_v1.md`, `NUTRILONGX_FLUJO_CORRECCION_ACEPTADA_v1.md`, `NUTRILONGX_MANUAL_VALIDACION_RECETAS_v1.md`, `NUTRILONGX_TAXONOMIA_RECETAS_v1.md`, `NUTRILONGX_Recetas_NLX001_008_v1_1.csv`, `RAW_RECETAS_CRUDAS_50.tsv` | `Nuevo NUTRILONGX/` (raíz) | Versión anterior (sin `.2`) del mismo tipo de metodología. Probablemente superseded por la carpeta `.2` de arriba y en último término por `MASTER_v1`, pero no se ha verificado — no se infiere supersession sin evidencia de contenido. |
| `files_CLAUDE.zip`, `files_CLAUDE2.zip`, `files_CLAUDE3.zip` | `Nuevo NUTRILONGX/` | Zips sin abrir. Abrir contenido de zips no nombrados explícitamente se consideró búsqueda no dirigida — fuera de alcance de esta ronda. |
| `nutrilongx-appscript/` (repo Git independiente) | `Nuevo NUTRILONGX/` | Proyecto de Google Apps Script con su propio historial Git. No es documentación de dominio, es código de otro sistema — fuera de alcance total de esta fase documental. |
| Carpeta `APP/` completa (snapshot antiguo de la app React + capturas + PDF técnico) | `NutriLongX/APP/` | Código y documentación de producto antiguos, no son fuentes canónicas de Gamificación/Alimentación/Ejercicio. Coincide con el modelo mock ya identificado como legacy en la fase anterior de auditoría de código. |
| `Antiguo NUTRILONX/` (app Expo/React Native completa) | `NutriLongX/` | Proyecto distinto, sin relación aparente con los artefactos pedidos. Solo se listó su raíz para descartarlo, no se ha inspeccionado contenido. |
| `nutrilongx/` (carpeta hermana, Next.js) | `NutriLongX/nutrilongx/` | ⚠️ Nombre casi idéntico a la carpeta canónica `nutrilongx/` que se crea dentro de este repo — **son cosas distintas**. Esta es un proyecto Next.js aparte con su propio `.env.local` (no leído, no copiado). Mencionado aquí solo para evitar confusión futura; no se ha tocado. |

Ninguno de estos ficheros se ha leído en profundidad más allá de listar su
nombre (excepto donde se indica lo contrario), y ninguno se ha copiado al
repositorio.
