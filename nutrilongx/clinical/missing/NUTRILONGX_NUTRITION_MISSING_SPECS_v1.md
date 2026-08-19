# NUTRILONGX — Especificaciones clínicas referenciadas y no recuperadas (v1)

Estado del propio documento: **`ACTIVE`** (registro de gobernanza vigente).
Generado: 2026-08-19. Actualizado 2026-08-19 tras corrección de gobernanza
(ver `docs: reconcile recovered nutrition source status`).

`artifact_type`: `governance_record`. `domain`: `clinical`.
`source_of_truth`: `false`. `production_ready`: `false`. `frozen`: `false`.

> **Aviso explícito de alcance — léase antes que nada:**
> Este documento narra el estado de 4 referencias hechas por
> `NUTRILONGX_ALIMENTACION_MASTER_v1.json` en su `specs_recovery_status`.
> **No es, no sustituye, ni reconstruye en ningún grado** ninguna de ellas.
> No contiene umbrales, perfiles ni reglas clínicas inventados o inferidos.
> Cada una de las 4 tiene su propia fila real en
> `NUTRILONGX_ARTIFACT_REGISTRY_v1.json` — este documento es solo la
> narrativa de gobernanza que las acompaña, no las reemplaza como registro.

## Estado actual (corregido)

- **3 especificaciones siguen `REFERENCED_NOT_RECOVERED`** — ningún fichero
  físico localizado, sin `relative_path` en el registry:
  1. `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0`
  2. `NUTRILONGX_CLINICAL_PROFILES_v1.0`
  3. `NUTRILONGX_CLINICAL_RULES_v1.0`
- **1 fichero origen pasa a `RECOVERED_PENDING_CONTENT_VALIDATION`**:
  4. `NUTRILONGX_Motor_Recetas_v1_1.xlsx` — localizado físicamente, con
     `relative_path` y SHA-256 reales en `nutrition/sources/`. **Una sola
     fila lógica**, no una fila real más un placeholder duplicado.

`RECOVERED_PENDING_CONTENT_VALIDATION` significa exclusivamente: *"el
fichero físico esperado ha sido recuperado, pero todavía no se ha auditado
que su contenido corresponda exactamente a la especificación citada durante
la construcción del Master"*. **No significa** que `NUTRIENT_THRESHOLDS`,
`CLINICAL_PROFILES` o `CLINICAL_RULES` se hayan recuperado, que sus reglas
estén validadas, ni que este Excel sea fuente canónica o clínica validada.
El Excel **no sustituye automáticamente** a ninguna de las 3 specs
pendientes — son objetos de gobernanza distintos, sin relación de
equivalencia declarada.

## Registro

| Especificación | Referenciada por | Dónde se referencia dentro del master | Estado |
|---|---|---|---|
| `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0` | 58/58 recetas | `frozen_specs.nutrient_thresholds` + `recipes[].validation.nutrient_threshold_version` | `REFERENCED_NOT_RECOVERED` |
| `NUTRILONGX_CLINICAL_PROFILES_v1.0` | 58/58 recetas | `frozen_specs.clinical_profiles` + `recipes[].validation.clinical_profiles_version` | `REFERENCED_NOT_RECOVERED` |
| `NUTRILONGX_CLINICAL_RULES_v1.0` | 58/58 recetas | `recipes[].observed_legacy_clinical_outputs.<profile>.rule_set_version` + `validation.clinical_rule_version` (no declarada en `frozen_specs`) | `REFERENCED_NOT_RECOVERED` |
| `NUTRILONGX_Motor_Recetas_v1_1.xlsx` | 58/58 recetas | `source_lineage.generated_from_workbook` | `RECOVERED_PENDING_CONTENT_VALIDATION` |

## Nota sobre `NUTRILONGX_Motor_Recetas_v1_1.xlsx`

El propio `NUTRILONGX_ALIMENTACION_MASTER_v1.json` lo marcaba como
`REFERENCED_NOT_RECOVERED` en su `specs_recovery_status` — es decir, en el
momento en que se construyó el master (2026-08-18) ese workbook no estaba
disponible para quien lo generó. **Esa declaración sigue siendo cierta sobre
el propio master FROZEN y no se ha modificado.**

Esta auditoría **sí ha localizado un fichero con ese nombre exacto** fuera
del repositorio, en:

```
C:\Users\CESAR CC\Desktop\Cesar\inteligencia artificial\NutrilongX\Nuevo NUTRILONGX\NUTRILONGX_Motor_Recetas_v1_1.xlsx
```
(SHA-256: `a062770e96396d096b62268a2d2747620aafc7dadb1f509386adaa301d47ca7c`, 34.565 bytes, fecha de modificación 2025-06-26)

Se ha persistido como fichero real en `nutrition/sources/`, clasificado
`artifact_type: SOURCE` (no `LEGACY_SOURCE`): a diferencia de los ficheros
de `gamification/sources/legacy/` (fase Excel 2025, explícitamente sustituida
por el catálogo canónico JSON), este workbook sigue citado como
`generated_from_workbook` en el `source_lineage` del propio master FROZEN
vigente — pertenece al linaje activo del master actual, no a un sistema ya
reemplazado.

**No se ha usado para reconstruir, corregir o completar nada del master
FROZEN, ni se ha auditado su contenido interno**, ni se ha comprobado que
sea la misma versión exacta que generó `NUTRILONGX_RECIPES_MASTER_v1.6/v1.7`.
Esa auditoría de contenido queda explícitamente fuera de esta fase.

## Qué NO se ha hecho

- No se han inferido umbrales nutricionales.
- No se han inferido perfiles clínicos.
- No se han inferido reglas clínicas.
- No se ha modificado `NUTRILONGX_ALIMENTACION_MASTER_v1.json`.
- No se ha auditado el contenido interno de `NUTRILONGX_Motor_Recetas_v1_1.xlsx`.
- No se afirma en ningún documento de este knowledge base que las reglas
  clínicas hayan sido recuperadas.

## Próximo paso (requiere César)

1. Confirmar si las 3 especificaciones (`THRESHOLDS`, `CLINICAL_PROFILES`,
   `CLINICAL_RULES`) existen en algún otro soporte y, si es así, añadirlas a
   `documentos nuevos/` para una futura ronda de reconciliación.
2. Decidir si `NUTRILONGX_Motor_Recetas_v1_1.xlsx` es la misma versión que
   generó `v1.6/v1.7`, y autorizar (o no) una auditoría de su contenido
   interno como fase separada — no iniciada aquí.

Hasta entonces, las 3 specs permanecen como gap documentado y el Excel como
fuente localizada sin validar — ninguno bloquea el resto del knowledge base.
