# NUTRILONGX — Source of Truth Matrix v1

Estado: `APPROVED`. Fecha: 2026-08-19.

Complementa `NUTRILONGX_DOMAIN_INTEGRATION_CONTRACT_v1.md`. Responde a una
única pregunta por concepto: **¿de dónde viene el dato real, hoy?**

**Regla explícita**: el CANON actual vive en Git
(`nutrilongx/**/canonical/`, `nutrilongx/**/library/`, `nutrilongx/**/safety/`).
**No se declara Supabase como source of truth de contenido** hasta que se
diseñe e implemente la próxima migración — este contrato no la diseña.

| Concepto | Source of Truth | Estado | Notas |
|---|---|---|---|
| Recipes | `nutrition/canonical/NUTRILONGX_ALIMENTACION_MASTER_v1.json` | FROZEN | 58 recetas; 3 specs clínicas `REFERENCED_NOT_RECOVERED` |
| Exercises | `exercise/library/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json` | FROZEN (pilot); futuro Exercise Master `NOT_BUILT` | 24 EXERCISE + 20 EXERCISE_VARIANT |
| Safety Rules | `exercise/safety/NUTRILONGX_EJERCICIO_SAFETY_RULES_v1.json` | APPROVED_PENDING_HUMAN_REVIEW | 12 reglas, ninguna PRODUCTION_READY |
| Canonical Actions | `gamification/canonical/NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json` | FROZEN | 119 familias, 600 variantes de nivel |
| Gamification Rules | `gamification/canonical/NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json` | FROZEN | motor + `calculation_order` de 7 pasos |
| Content-Action Bindings (nutrition) | `NUTRILONGX_ALIMENTACION_MASTER_v1.json` → `recipes[].gamification_bindings[]` | FROZEN | 186 supports / 18 candidate / 3 contextual_opposite, en producción real hoy dentro del Master |
| Content-Action Bindings (exercise) | — | `NOT_BUILT` | mismo patrón que nutrition (§2.C del contrato), pendiente de construir |
| Action History | *futuro* `action_logs` | `NOT_BUILT` | única puerta de entrada al motor — no existe todavía como artefacto |
| Progress (DVG, levels, streaks, badges, stats) | *derivado* de `action_logs` | `NOT_BUILT` (conceptual) | nunca es fuente primaria; reconstruible vía `rebuild_progress(user_id)` (conceptual, no implementado) |
| User Execution / Evidence | *futuro* capa `execution`/`evidence` | `NOT_BUILT` | conectores concretos no diseñados en esta fase |
| Clinical Profile (definiciones formales) | *futura* capa clínica canónica | `REFERENCED_NOT_RECOVERED` | `NUTRILONGX_CLINICAL_PROFILES_v1.0` no recuperada; 14 códigos solo listados por nombre en `clinical_profiles_reference` del Master |
| Nutrient Thresholds | *futura* capa clínica canónica | `REFERENCED_NOT_RECOVERED` | `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0` |
| Clinical Rules (motor de reglas clínico) | *futura* capa clínica canónica | `REFERENCED_NOT_RECOVERED` | `NUTRILONGX_CLINICAL_RULES_v1.0` |
| Console / Apps Script | consumidor, no fuente | N/A | debe leer todo lo anterior vía capa de funciones/API (§11 del contrato); nunca redefine ni duplica |
| Supabase (estado desplegado) | evidencia de infraestructura, no canon de contenido | ver `governance/audits/NUTRILONGX_SUPABASE_SCHEMA_RECONCILIATION_NOTE_v1.md` | conflicto de evidencia sin resolver sobre qué tablas existen hoy; no se usa como fuente de decisión de contenido |

## Regla de resolución de conflicto

Si en el futuro dos artefactos parecen declarar el mismo concepto de forma
distinta (p. ej. un valor de `base_dvg_hours` copiado y desincronizado en
otra capa), **gana el artefacto listado en esta tabla como Source of
Truth** — cualquier copia en otra capa se considera caché/derivado y debe
corregirse para apuntar de vuelta al canon, nunca al revés.
