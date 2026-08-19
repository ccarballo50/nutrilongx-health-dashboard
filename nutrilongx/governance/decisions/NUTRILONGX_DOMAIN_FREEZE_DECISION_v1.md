# NUTRILONGX — Domain Freeze Decision v1

Estado: `APPROVED`. Fecha: 2026-08-19.
Decisión de gobernanza, no artefacto técnico.

---

## Decisión

A partir de esta fase, los 3 dominios quedan formalizados así:

| Dominio | Estado |
|---|---|
| Gamification | `FROZEN_FOR_INTEGRATION` |
| Nutrition | `FROZEN_FOR_INTEGRATION` |
| Exercise | `FROZEN_FOR_INTEGRATION` |

## Justificación por dominio

**Gamification**: canon completo para integración. `NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1`
(119 familias, 600 variantes) y `NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1`
(motor + `calculation_order` de 7 pasos, documentado como dato, no solo
prosa) están completos y consistentes entre sí. No requieren contenido
adicional para empezar a diseñar backend.

**Nutrition**: `NUTRILONGX_ALIMENTACION_MASTER_v1` completo para
integración (58 recetas, `gamification_bindings` ya poblado con semántica
congelada), **con 3 specs clínicas `REFERENCED_NOT_RECOVERED`**
(`NUTRIENT_THRESHOLDS_v1.0`, `CLINICAL_PROFILES_v1.0`, `CLINICAL_RULES_v1.0`)
que no bloquean la integración de contenido/gamificación pero sí cualquier
automatización clínica futura.

**Exercise**: schema (`v1.1` recuperado; `v1.2` referenciado, no
recuperado como fichero), library (24 EXERCISE + 20 EXERCISE_VARIANT) y
safety (12 reglas) disponibles para integración — **pero contenido
incompleto** (biblioteca piloto, no un Exercise Master; `SESSION_TEMPLATE`/
`PROGRAM_TEMPLATE`/`BEHAVIOURAL_CONTENT`/`PRESCRIPTION`/`EXECUTION` final
`NOT_BUILT`) **y safety pendiente de `HUMAN_REVIEW`** (las 12 reglas siguen
`APPROVED_PENDING_HUMAN_REVIEW`, ninguna `PRODUCTION_READY`).

## Lo que esta decisión NO afirma

- **No se usa `PRODUCTION_READY` para Exercise**, en ningún documento de
  este cierre.
- No se declara que la biblioteca de ejercicios esté completa.
- No se declara que las safety rules hayan superado revisión humana.
- No se declara que `SESSION_TEMPLATE`/`PROGRAM_TEMPLATE` existan.
- No se inicia Ejercicio Fase 3C.
- No se modifica ningún artefacto `FROZEN` existente (verificado byte a
  byte antes de este cierre).

## Alcance del freeze

`FROZEN_FOR_INTEGRATION` autoriza a **empezar a diseñar** backend, APIs,
Supabase y consola sobre estos 5 artefactos, siguiendo el contrato definido
en `NUTRILONGX_DOMAIN_INTEGRATION_CONTRACT_v1.md`,
`NUTRILONGX_SOURCE_OF_TRUTH_MATRIX_v1.md`,
`NUTRILONGX_ACTION_ACCREDITATION_CONTRACT_v1.md` y
`NUTRILONGX_CONSOLE_API_BOUNDARY_v1.md`. No autoriza a: escribir SQL,
modificar Supabase, tocar Vercel, iniciar Apps Script, ni construir
`SESSION_TEMPLATE`/`PROGRAM_TEMPLATE`/Exercise Master.

## Documentos relacionados de este cierre

- `governance/architecture/NUTRILONGX_DOMAIN_INTEGRATION_CONTRACT_v1.md`
- `governance/architecture/NUTRILONGX_SOURCE_OF_TRUTH_MATRIX_v1.md`
- `governance/architecture/NUTRILONGX_ACTION_ACCREDITATION_CONTRACT_v1.md`
- `governance/architecture/NUTRILONGX_CONSOLE_API_BOUNDARY_v1.md`
