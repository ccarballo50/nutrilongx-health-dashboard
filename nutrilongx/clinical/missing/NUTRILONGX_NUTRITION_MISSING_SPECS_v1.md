# NUTRILONGX — Especificaciones clínicas referenciadas y no recuperadas (v1)

Estado del propio documento: **`ACTIVE`** (registro de gobernanza vigente).
Generado: 2026-08-19, como parte de `docs: persist NutriLongX canonical knowledge base v1`.

`artifact_type`: `governance_record`. `domain`: `clinical`.
`source_of_truth`: `false`. `production_ready`: `false`. `frozen`: `false`.

> **Aviso explícito de alcance — léase antes que nada:**
> Este documento **documenta que 4 especificaciones fueron referenciadas y no
> recuperadas** durante esta auditoría. **No es, no sustituye, ni reconstruye
> en ningún grado** a ninguna de las 4 especificaciones originales:
> `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0`, `NUTRILONGX_CLINICAL_PROFILES_v1.0`,
> `NUTRILONGX_CLINICAL_RULES_v1.0`, `NUTRILONGX_Motor_Recetas_v1_1.xlsx`. No
> contiene umbrales, perfiles ni reglas clínicas inventados o inferidos. Las
> 4 especificaciones originales tienen su propia entrada independiente en
> `NUTRILONGX_ARTIFACT_REGISTRY_v1.json`, con `status: REFERENCED_NOT_RECOVERED`
> y sin `relative_path` cuando no se ha localizado fichero físico — este
> documento es solo la narrativa de gobernanza que las acompaña, no las
> reemplaza como registro.

## Qué es este documento

`NUTRILONGX_ALIMENTACION_MASTER_v1.json` (FROZEN) declara en su propio bloque
`specs_recovery_status` que las siguientes 4 especificaciones fueron
referenciadas durante su construcción (por 58/58 recetas) pero **no se
recuperaron como ficheros independientes** ni en `documentos nuevos/` ni en
el resto del árbol local auditado bajo
`C:\Users\CESAR CC\Desktop\Cesar\inteligencia artificial\NutrilongX\`.

Esto **no implica que no existan** — el propio master lo dice explícitamente
("No implica inexistencia") — solo que no se han localizado como artefactos
independientes en esta ronda de auditoría.

## Registro

| Especificación | Referenciada por | Dónde se referencia dentro del master | Recuperada |
|---|---|---|---|
| `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0` | 58/58 recetas | `frozen_specs.nutrient_thresholds` + `recipes[].validation.nutrient_threshold_version` | ❌ No |
| `NUTRILONGX_CLINICAL_PROFILES_v1.0` | 58/58 recetas | `frozen_specs.clinical_profiles` + `recipes[].validation.clinical_profiles_version` | ❌ No |
| `NUTRILONGX_CLINICAL_RULES_v1.0` | 58/58 recetas | `recipes[].observed_legacy_clinical_outputs.<profile>.rule_set_version` + `validation.clinical_rule_version` (no declarada en `frozen_specs`) | ❌ No |
| `NUTRILONGX_Motor_Recetas_v1_1.xlsx` | 58/58 recetas | `source_lineage.generated_from_workbook` | ⚠️ Parcial — ver nota |

## Nota sobre `NUTRILONGX_Motor_Recetas_v1_1.xlsx`

El propio `NUTRILONGX_ALIMENTACION_MASTER_v1.json` lo marca como
`REFERENCED_NOT_RECOVERED` en su `specs_recovery_status` — es decir, en el
momento en que se construyó el master (2026-08-18) ese workbook no estaba
disponible para quien lo generó.

Sin embargo, esta auditoría **sí ha localizado un fichero con ese nombre
exacto** fuera del repositorio, en:

```
C:\Users\CESAR CC\Desktop\Cesar\inteligencia artificial\NutrilongX\Nuevo NUTRILONGX\NUTRILONGX_Motor_Recetas_v1_1.xlsx
```
(SHA-256: `a062770e96396d096b62268a2d2747620aafc7dadb1f509386adaa301d47ca7c`, 34.565 bytes, fecha de modificación 2025-06-26)

Se ha persistido en `nutrition/sources/` como fuente localizada — **pero no
se ha usado para reconstruir, corregir o completar nada del master FROZEN**,
ni se ha comprobado que sea la misma versión exacta que generó
`NUTRILONGX_RECIPES_MASTER_v1.6/v1.7`. Queda como candidato a provenance,
pendiente de que César confirme si es el mismo artefacto y de una decisión
humana sobre si debe re-vincularse formalmente al master en una build
posterior.

## Qué NO se ha hecho

- No se han inferido umbrales nutricionales.
- No se han inferido perfiles clínicos.
- No se han inferido reglas clínicas.
- No se ha modificado `NUTRILONGX_ALIMENTACION_MASTER_v1.json`.

## Próximo paso (requiere César)

Confirmar si estas 3 especificaciones (`THRESHOLDS`, `CLINICAL_PROFILES`,
`CLINICAL_RULES`) existen en algún otro soporte (otro equipo, otra carpeta,
un hilo de chat no descargado) y, si es así, añadirlas a `documentos nuevos/`
para una futura ronda de reconciliación. Hasta entonces permanecen aquí como
gap documentado, no como bloqueo del resto del knowledge base.
