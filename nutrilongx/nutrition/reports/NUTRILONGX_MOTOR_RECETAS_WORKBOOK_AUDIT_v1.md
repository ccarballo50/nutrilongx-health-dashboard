# NUTRILONGX — Nutrition Workbook Recovery Audit v1

**Objeto**: `nutrilongx/nutrition/sources/NUTRILONGX_Motor_Recetas_v1_1.xlsx`
**Tipo**: Auditoría READ-ONLY. El fichero no se ha modificado, guardado, regenerado, normalizado ni recalculado en ningún momento.
**Fecha**: 2026-08-19.
**Estado del documento**: WORKING AUDIT — sin commit, pendiente de revisión de César.

---

## A. Executive Summary

1. El workbook contiene **6 hojas, todas visibles** (ninguna oculta ni muy oculta), **0 fórmulas Excel en total** (verificado a nivel de elemento XML `<f>`, no solo por valor de celda), **0 macros/VBA**, **0 conexiones externas**, **0 named ranges propios** (solo autofiltros internos de Excel), **0 comentarios**, **0 formato condicional**.
2. El workbook cubre **exactamente 8 recetas** (`NLX-001` a `NLX-008`) en todas sus hojas de datos — no 58, no 30. Su propia hoja de instrucciones lo dice explícitamente: *"Versión base para escalar a 30 recetas"*.
3. **`NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0`: NOT_FOUND.** No existe ninguna tabla, rango con nombre, fórmula ni celda que codifique un umbral nutricional con operador. Solo hay valores de composición nutricional en bruto por receta (kcal, proteína, carbohidratos, grasas, fibra, sodio).
4. **`NUTRILONGX_CLINICAL_PROFILES_v1.0`: NOT_FOUND.** El workbook contiene una matriz de 10 columnas `APTO_*` (salida por receta: SI/NO/PENDIENTE_REVISION/NO_APLICA), no las definiciones de los 14 perfiles clínicos. Su propia hoja de instrucciones declara explícitamente que la hoja de definición de perfiles (`PERFILES_CLIENTE`) **no se ha creado todavía** ("Planificado para Sprint 3"). Los 10 códigos del workbook (`PERDIDA_PESO, GANANCIA_MASA, MENOPAUSIA, LONGEVIDAD, ONCOLOGIA, DIABETES, RENAL, CARDIOVASCULAR, TCA, EMBARAZO`) **no coinciden literalmente** con los 14 códigos clínicos que usa el Master (`HTA, DM2, DYSLIPIDEMIA, OBESITY, HF, HYPERURICEMIA_GOUT, CKD_MILD, CKD_MODERATE, CKD_ADVANCED, MENOPAUSE, PREGNANCY, OLDER_ADULT, ONCOLOGY, IMMUNOSUPPRESSION`).
5. **`NUTRILONGX_CLINICAL_RULES_v1.0`: NOT_FOUND.** Cero fórmulas en todo el libro. `RECETAS_TEST_RESULTS` contiene únicamente veredictos ya aplicados (`OK`/`REVISION`) sin ninguna regla visible que los produjera — exactamente el patrón "output sin la regla" que la auditoría debía descartar o confirmar.
6. **Hallazgo decisivo, corroborado por el propio Master FROZEN**: el campo `pilot_review_v1_1` del Master está presente en **exactamente las mismas 8 recetas** que cubre este workbook (`NLX-001`–`NLX-008`), confirmando lineage directo para esas 8 filas. Pero `pilot_review_v1_1.clinical_profile_review_scope = "14_PROFILES"` para esas mismas 8 recetas, mientras que el workbook en disco solo contiene 10 categorías `APTO_*` sin `reason_codes` ni `fit` — es decir, **el workbook, tal como existe hoy, es insuficiente para haber producido por sí solo** el contenido de `observed_legacy_clinical_outputs` que hoy aparece en el Master para esas 8 recetas.
7. El propio Master ya documenta esto internamente, de forma independiente a esta auditoría: `observed_legacy_clinical_outputs._meta.note` dice literalmente *"Preservado tal cual de la fuente legacy (recipes[].clinical_profiles en v1.7). NO reconstruido ni verificado contra el motor de reglas original (NUTRILONGX_CLINICAL_RULES_v1.0, referenced_not_recovered)"* — y `nutritional_rules_reference.rules: []` (vacío). Esta auditoría **confirma de forma independiente**, por inspección directa del workbook, la misma conclusión a la que ya había llegado quien construyó el Master.
8. El workbook **sí** aporta valor real y trazable: es la fuente directa de los datos de contenido (título, ingredientes, preparación, macros declarados, tags dietéticos, chunks de texto cliente) para esas mismas 8 recetas, más una hoja de fuentes bibliográficas de composición nutricional (USDA FoodData Central, Open Food Facts) con licencias y estado de revisión legal documentados.
9. `WORKBOOK_SHA256_BEFORE == WORKBOOK_SHA256_AFTER` — confirmado, ver sección B.
10. Veredicto de rol: **`WORKBOOK_VALIDATED_AS_RECIPE_SOURCE_ONLY`** (ver sección M). No se recomienda cambiar el estado de las 3 specs clínicas. Sí se recomienda perfeccionar la descripción del estado del workbook en el registry (ver sección P).

---

## B. Workbook Integrity

| | |
|---|---|
| Ruta | `nutrilongx/nutrition/sources/NUTRILONGX_Motor_Recetas_v1_1.xlsx` |
| **WORKBOOK_SHA256_BEFORE** | `a062770e96396d096b62268a2d2747620aafc7dadb1f509386adaa301d47ca7c` |
| **WORKBOOK_SHA256_AFTER** | `a062770e96396d096b62268a2d2747620aafc7dadb1f509386adaa301d47ca7c` |
| BEFORE == AFTER | ✅ **PASS** — idéntico al recogido en el Artifact Registry |
| Tamaño | 34.565 bytes |
| Nº de hojas | 6 |
| Hojas ocultas/muy ocultas | 0 (las 6 `state="visible"`, confirmado en `xl/workbook.xml` y por hoja) |
| Named ranges propios | 0 (solo 5 `_xlnm._FilterDatabase` internos de autofiltro, no son named ranges de negocio) |
| Excel Tables (ListObjects) | 0 |
| Fórmulas (`<f>` reales, no coincidencias de substring) | **0** en las 6 hojas |
| Validaciones de datos | 34 reglas de lista (listas desplegables), concentradas en `RECETAS_NUTRILONGX` (32) y `CHUNKS` (2) |
| Hipervínculos | 0 |
| Conexiones externas / `externalLinks` | 0 |
| Macros / VBA (`vbaProject.bin`) | 0 — no encontrado en el paquete |
| Hojas protegidas | 0 — `workbookProtection` vacío, ningún `sheetProtection` en ninguna hoja |
| Comentarios / notas de celda | 0 |
| Formato condicional | 0 |
| `sharedStrings.xml` | Ausente del paquete (cadenas inline; consistente con generación por `openpyxl`, ver Provenance) |
| Filas/columnas ocultas | 0 en todas las hojas |

**Nota de integridad del propio fichero**: `docProps/core.xml` declara `creator: openpyxl`, `created = modified = 2026-06-24T22:49:01Z`. Es decir, el propio fichero se autodeclara **generado programáticamente**, no editado a mano en Excel — dato relevante para la sección J (Provenance).

---

## C. Sheet Inventory

| Hoja | Visibilidad | Rango usado | Filas datos | Cols | Fórmulas | Celdas no vacías | Clasificación |
|---|---|---|---|---|---|---|---|
| `📋 INSTRUCCIONES` | visible | A1:C21 | 17 notas | 3 | 0 | 52 | `OTHER` (changelog/gobernanza del propio workbook) |
| `FUENTES_RECETAS` | visible | A1:K8 | 5 fuentes | 11 | 0 | 68 | `SOURCES` |
| `RECETAS_NUTRILONGX` | visible | A1:BL12 | 8 recetas | 64 | 0 | 557 | `RECIPES` (contiene también columnas de eligibilidad — ver nota) |
| `CHUNKS` | visible | A1:G54 | 51 chunks | 7 | 0 | 366 | `OUTPUTS` (contenido de cliente ya redactado, no reglas) |
| `RECETAS_TEST_RESULTS` | visible | A1:O11 | 8 veredictos | 15 | 0 | 137 | `OUTPUTS` |
| `RAW_IDEAS` | visible | A1:K3 | 0 (solo cabecera) | 11 | 0 | 13 | `OTHER` (plantilla vacía) |

Detalle CSV completo (todas las columnas, tipos de dato aparentes, y comentario de propósito) en `NUTRILONGX_MOTOR_RECETAS_WORKBOOK_SHEET_INVENTORY_v1.csv`.

**Nota sobre `RECETAS_NUTRILONGX`**: aunque el propósito dominante es `RECIPES`, 10 de sus 64 columnas (`APTO_PERDIDA_PESO` … `APTO_EMBARAZO`, más 3 `JUSTIFICACION_APTO_*`) son una matriz de salida de elegibilidad — clasificadas por separado como `PROFILE_OUTPUT_MATRIX` en la sección F, no como `RECIPES` puro.

---

## D. Recipe Content

- **8 recetas reales**: `NLX-001` a `NLX-008`. Ningún ID adicional en ninguna hoja (`CHUNKS` y `RECETAS_TEST_RESULTS` cubren exactamente el mismo conjunto de 8).
- Campos por receta (64 columnas, ver §C y el CSV de inventario): identidad (`RECETA_ID, VERSION_RECETA, TITULO_NUTRILONGX, TIPO_COMIDA, OBJETIVO, TIEMPO_PREP_MIN, DIFICULTAD, RACIONES, PORCION_GRAMOS, TEMPORADA`), macros y coherencia (`KCAL_DECLARADAS, PROTEINA_G, CARBS_G, GRASAS_G, FIBRA_G, SODIO_MG, KCAL_CALCULADAS_MACROS, DELTA_KCAL, DELTA_KCAL_FLAG, FUENTE_KCAL, MACROS_REVISADOS`), contenido (`INGREDIENTES_NLX, PREPARACION_NLX`), etiquetas dietéticas booleanas (`ALERGENOS, SIN_LACTOSA, SIN_GLUTEN, VEGETARIANA, VEGANA, ALTA_PROTEINA, BAJA_KCAL, MEAL_PREP, MEDITERRANEA`), elegibilidad (10 `APTO_*` + 3 justificaciones, ver §F), exclusiones (`NO_APTO_PARA, ALIMENTOS_EXCLUIDOS_ADICIONALES, PERFIL_CLINICO_SENSIBLE`), revisión (`REQUIERE_REVISION_PROFESIONAL, MOTIVO_REVISION_PROFESIONAL, CLAIMS_MEDICOS_FLAG, CLAIMS_MEDICOS_DETECTADOS`), workflow (`ESTADO, NIVEL_VALIDACION, VALIDADA_NUTRICION, VALIDADA_CLINICA, VALIDADA_ENTRENAMIENTO, VALIDADA_POR, FECHA_ULTIMA_REVISION, RECETA_VISIBLE_CLIENTE, NOTA_INTERNA_PROFESIONAL`), y procedencia editorial (`SUSTITUCIONES, FUENTE_INSPIRACION, URL_ORIGEN_INTERNA`).
- **Solo `NLX-001` y `NLX-003` tienen `VALIDADA_CLINICA = SI`** — declarado explícitamente en `INSTRUCCIONES`. Las 6 restantes esperan revisión.
- `CHUNKS`: 51 fragmentos de texto ya redactado (ingredientes, preparación, versión cliente, sustituciones, notas profesionales, variantes sin lactosa/gluten/alta proteína/baja kcal/meal prep) para las mismas 8 recetas. Contenido editorial, no reglas.
- `RECETAS_TEST_RESULTS`: 10 checks por receta + veredicto final, ya aplicados (ver §G).

---

## E. Nutrient Threshold Recovery

Búsqueda dirigida (términos: threshold/umbral, sodium/sodio, fiber/fibra, protein/proteína, potassium/potasio, phosphorus/fósforo, calcium/calcio, saturated/saturada, sugar/azúcar, carbohydrate, fat, kcal, energy; operadores `>`, `>=`, `<`, `<=`, BETWEEN, MIN, MAX) sobre nombres de hoja, headers, celdas, fórmulas y named ranges.

**Resultado: `NOT_FOUND`.**

- Los únicos términos nutricionales presentes son columnas de **valor observado por receta**: `KCAL_DECLARADAS, PROTEINA_G, CARBS_G, GRASAS_G, FIBRA_G, SODIO_MG` (hoja `RECETAS_NUTRILONGX`) — clasificación: `NUTRIENT_VALUE_ONLY`, no `EXPLICIT_THRESHOLD_RULE`.
- `POTASSIUM`/`potasio`, `PHOSPHORUS`/`fósforo`, `CALCIUM`/`calcio`, `SATURATED`/`saturada`, `SUGAR`/`azúcar` — **ausentes por completo** de headers y celdas. `INSTRUCCIONES` lo confirma indirectamente: *"FIBRA_G completada solo en 8 recetas piloto... calcular FIBRA_G desde USDA FoodData"* — ni siquiera la fibra está sistematizada más allá del piloto, y no hay mención de umbrales para ningún nutriente.
- Ningún operador (`>`, `<`, `>=`, `<=`, `BETWEEN`, `MIN`, `MAX`) aparece en ninguna celda de texto ni en ninguna fórmula (no hay fórmulas).
- `DELTA_KCAL_FLAG` (valores `OK`/otros) es un **resultado ya calculado** de coherencia kcal-macros, no una regla de umbral visible — se desconoce el criterio numérico exacto que produce el flag.

Ningún candidato alcanzó siquiera `AMBIGUOUS`; todo lo relacionado con nutrientes es `NUTRIENT_VALUE_ONLY` u `OUTPUT_ONLY` (el flag).

---

## F. Clinical Profiles Recovery

Búsqueda dirigida sobre `profile/perfil/clinical/eligibility/apto/precaución/no_apto/no_evaluado/reason_code/rule_set` y nombres de perfiles del proyecto.

**Resultado: `NOT_FOUND`** (definición de los 14 perfiles). Lo que sí existe es una **`PROFILE_OUTPUT_MATRIX`** parcial y con una taxonomía distinta.

### Qué existe realmente

10 columnas booleanas/enum de elegibilidad por receta en `RECETAS_NUTRILONGX` (valores `SI/NO/PENDIENTE_REVISION/NO_APLICA`, confirmado explícitamente en `INSTRUCCIONES` fila 6): `APTO_PERDIDA_PESO, APTO_GANANCIA_MASA, APTO_MENOPAUSIA, APTO_LONGEVIDAD, APTO_ONCOLOGIA, APTO_DIABETES, APTO_RENAL, APTO_CARDIOVASCULAR, APTO_TCA, APTO_EMBARAZO` + 3 columnas de justificación en texto libre (`JUSTIFICACION_APTO_MENOPAUSIA/LONGEVIDAD/ONCOLOGIA` — solo 3 de los 10, sin justificación estructurada para las otras 7).

Valores reales de las 8 recetas (matriz completa):

| RECETA_ID | PERDIDA_PESO | GANANCIA_MASA | MENOPAUSIA | LONGEVIDAD | ONCOLOGIA | DIABETES | RENAL | CARDIOVASCULAR | TCA | EMBARAZO |
|---|---|---|---|---|---|---|---|---|---|---|
| NLX-001 | SI | NO | SI | SI | PENDIENTE_REVISION | SI | PENDIENTE_REVISION | SI | NO_APLICA | PENDIENTE_REVISION |
| NLX-002 | SI | SI | SI | SI | PENDIENTE_REVISION | SI | PENDIENTE_REVISION | SI | NO_APLICA | PENDIENTE_REVISION |
| NLX-003 | SI | SI | SI | SI | PENDIENTE_REVISION | SI | PENDIENTE_REVISION | SI | NO_APLICA | PENDIENTE_REVISION |
| NLX-004 | NO | NO | SI | SI | PENDIENTE_REVISION | SI | PENDIENTE_REVISION | SI | NO_APLICA | PENDIENTE_REVISION |
| NLX-005 | SI | NO | SI | SI | PENDIENTE_REVISION | PENDIENTE_REVISION | PENDIENTE_REVISION | SI | NO_APLICA | PENDIENTE_REVISION |
| NLX-006 | SI | NO | SI | SI | PENDIENTE_REVISION | SI | PENDIENTE_REVISION | SI | NO_APLICA | PENDIENTE_REVISION |
| NLX-007 | SI | NO | SI | SI | PENDIENTE_REVISION | PENDIENTE_REVISION | SI | PENDIENTE_REVISION | NO_APLICA | SI |
| NLX-008 | NO | SI | SI | SI | PENDIENTE_REVISION | SI | PENDIENTE_REVISION | SI | NO_APLICA | PENDIENTE_REVISION |

Clasificación: **`PROFILE_OUTPUT_MATRIX`** (resultado por receta), no `PROFILE_DEFINITION`. No hay `included_tags`/`excluded_tags`/`caution_tags` por perfil, no hay herencia, no hay matriz perfil × condición con criterios — solo el veredicto final.

### Confirmación explícita de que la definición NO existe

`INSTRUCCIONES`, fila 21: *"Hoja PERFILES_CLIENTE — No crear hasta tener ≥30 recetas validadas. Planificado para Sprint 3."* — el propio workbook declara, con sus propias palabras, que la hoja de definición de perfiles **fue planificada y deliberadamente no construida todavía**.

### Discrepancia de taxonomía frente al Master (hallazgo clave)

El Master FROZEN usa, para estas mismas 8 recetas, un conjunto de **14 códigos clínicos** en `observed_legacy_clinical_outputs`: `HTA, DM2, DYSLIPIDEMIA, OBESITY, HF, HYPERURICEMIA_GOUT, CKD_MILD, CKD_MODERATE, CKD_ADVANCED, MENOPAUSE, PREGNANCY, OLDER_ADULT, ONCOLOGY, IMMUNOSUPPRESSION` (verificado programáticamente contra las 58 recetas del JSON).

Comparación literal:

| Categoría workbook (10) | ¿Coincide literalmente con algún código del Master (14)? |
|---|---|
| `MENOPAUSIA` | Parecido a `MENOPAUSE` — no idéntico, no hay tabla de equivalencia en el workbook |
| `ONCOLOGIA` | Parecido a `ONCOLOGY` — no idéntico, sin tabla de equivalencia |
| `DIABETES` | Parecido a `DM2` — no idéntico, sin tabla de equivalencia |
| `RENAL` | Posible correspondencia 1→3 con `CKD_MILD/CKD_MODERATE/CKD_ADVANCED` — ambiguo, sin tabla |
| `CARDIOVASCULAR` | Posible correspondencia 1→N con `HTA`/`HF`/`DYSLIPIDEMIA` — ambiguo, sin tabla |
| `EMBARAZO` | Parecido a `PREGNANCY` — no idéntico, sin tabla de equivalencia |
| `TCA` | Sin correspondencia en los 14 códigos del Master |
| `PERDIDA_PESO`, `GANANCIA_MASA` | Sin correspondencia directa (son objetivos, no perfiles clínicos); posible relación laxa con `OBESITY` |
| `LONGEVIDAD` | Sin correspondencia en los 14 códigos del Master (es un pilar del programa, no un perfil clínico) |
| — | `HYPERURICEMIA_GOUT`, `IMMUNOSUPPRESSION`, `OLDER_ADULT` no existen como columna en el workbook |

**No se ha inferido ninguna de estas correspondencias como regla real** — se listan solo como similitud léxica superficial, sin tabla de mapeo explícita en el workbook que las respalde. Por disciplina de la sección 2 del encargo, ninguna cuenta como recuperación.

---

## G. Clinical Rules Recovery

Búsqueda dirigida sobre `rule/regla/condition/operator/threshold/profile/result/eligibility/reason_code/priority/tag/exclusion/caution/contraindication`, con inspección específica de fórmulas.

**Resultado: `NOT_FOUND`.**

- **0 fórmulas** en todo el libro (confirmado dos veces: por valor de celda vía `openpyxl` y por elemento XML `<f>` real vía inspección directa del paquete). No existe, por tanto, ninguna expresión `nutriente + operador + threshold + perfil → resultado` codificada de forma ejecutable.
- `RECETAS_TEST_RESULTS` (hoja `RECETAS_TEST_RESULTS`, 8 filas) contiene 10 checks + veredicto por receta: `TEST_KCAL_MACROS, DELTA_KCAL, TEST_ALERGENOS, TEST_INTOLERANCIAS, TEST_CLAIMS, TEST_PERFIL_CLINICO, TEST_ALIMENTOS_EXCLUIDOS, TEST_SUPLEMENTOS, TEST_OBJETIVO, RESULTADO_FINAL, MOTIVOS, REQUIERE_REVISION_PROF`. Todos los valores son **veredictos ya aplicados** (`OK`/`REVISION`) con una columna `MOTIVOS` de texto libre (p. ej. *"Alérgenos: REVISION | Requiere revisión profesional"* para `NLX-007`) — sin exponer el criterio numérico o lógico que produjo el veredicto.
- Clasificación de todos los candidatos inspeccionados: **`OUTPUT_ONLY`**. Ninguno alcanza `PARTIALLY_RECOVERED` ni `EXPLICITLY_RECOVERED` porque no hay ninguna regla — solo su resultado.
- El citado `rule_set_version: "NUTRILONGX_CLINICAL_RULES_v1.0"` que aparece en el Master (`observed_legacy_clinical_outputs.<profile>.rule_set_version`) es una **cadena de texto citada como procedencia**, no contenido de regla — y no aparece en ningún lugar de este workbook (el workbook no menciona `CLINICAL_RULES` en ninguna celda).

No se generó ningún CSV de "reglas recuperadas" porque no hay ninguna — `NUTRILONGX_MOTOR_RECETAS_WORKBOOK_RULE_CANDIDATES_v1.csv` documenta explícitamente los candidatos **evaluados y descartados**, no reglas confirmadas.

---

## H. Tags / Mappings

- **Tags de dietas/ingredientes** existen como columnas booleanas independientes en `RECETAS_NUTRILONGX` (`SIN_LACTOSA, SIN_GLUTEN, VEGETARIANA, VEGANA, ALTA_PROTEINA, BAJA_KCAL, MEAL_PREP, MEDITERRANEA`) y como campo de texto libre `TAGS` en `CHUNKS` (valores observados: `VEGANA,SIN_GLUTEN,SIN_LACTOSA,LONGEVIDAD`, `VEGANA,MEAL_PREP`, etc., separados por comas).
- **No existe un diccionario de tags centralizado** (ninguna hoja `TAGS`/`TAG_DICTIONARY`), ni una tabla `nutrient/composition → tag`, ni `ingredient → tag`, ni `tag → profile eligibility`, ni `tag → reason_code`. Cada receta declara sus propios tags de forma independiente, sin tabla de referencia.
- `RESTRICCIONES` en `CHUNKS` es texto libre (`Ninguna` en los ejemplos vistos), no una lista controlada con mapeo.
- No se ha completado ningún mapping ausente.

---

## I. Formula Audit

**No hay lógica ejecutable en el workbook.** Inventario de patrones buscados (`IF, IFS, AND, OR, LOOKUP, VLOOKUP, XLOOKUP, INDEX, MATCH, SUMIF/S, COUNTIF/S`): **0 ocurrencias**, porque no hay ningún elemento `<f>` en ninguna de las 6 hojas (verificado con regex sobre el XML crudo de cada `xl/worksheets/sheetN.xml`, no solo mediante `openpyxl`).

Las 34 reglas de validación de datos encontradas (`data validations`, sección B) son **listas desplegables de UI** (p. ej. `TIPO_COMIDA` restringido a `DESAYUNO,ALMUERZO,COMIDA,...`), no lógica de negocio ni reglas clínicas — limitan qué puede escribirse en una celda, no calculan nada.

---

## J. Provenance / Sources

- `FUENTES_RECETAS` documenta 5 fuentes de datos de **ingredientes/composición**, con revisión legal explícita: `USDA FoodData Central` (API pública, dominio público), `Open Food Facts` (CC BY-SA 3.0, requiere atribución), `Wikibooks Cookbook` (CC BY-SA 3.0, "reformulación obligatoria"), `PubMed Nutrition` (solo metadatos/abstracts, evidencia clínica general — no reglas concretas citadas), `Allrecipes` (**`ESTADO: DESCARTADA`**, "ToS prohíben scraping").
- Esto es provenance de **datos de ingredientes**, no provenance de reglas clínicas o umbrales — ninguna fila de `FUENTES_RECETAS` se cita como origen de un threshold o de una regla de perfil.
- Metadata interna del propio fichero (`docProps/core.xml`): `creator: openpyxl`, fecha de creación/modificación `2026-06-24T22:49:01Z` — el fichero es una **exportación programática**, no un documento de autoría manual en Excel. Esto es coherente con que no contenga fórmulas: fue generado ya con los valores resueltos, no como una hoja de cálculo viva.
- **Ninguna regla recuperada en este workbook (porque no hay ninguna) puede por tanto clasificarse como `SCIENTIFICALLY_VALIDATED`** — no aplica, al no existir contenido de regla que validar.

---

## K. Workbook ↔ Master v1 Lineage

Matriz conceptual (`MASTER_FIELD | WORKBOOK_SOURCE | RECOVERED? | TRANSFORMATION | NOTES`), limitada a las 8 recetas donde el Master declara `pilot_review_v1_1` (`NLX-001`–`NLX-008`; verificado programáticamente: son exactamente y solo esas 8):

| MASTER_FIELD | WORKBOOK_SOURCE | RECOVERED? | TRANSFORMATION | NOTES |
|---|---|---|---|---|
| `recipe_id` | `RECETA_ID` | Sí | directa | |
| `recipe_version` | `VERSION_RECETA` | Sí | directa | |
| `title` | `TITULO_NUTRILONGX` | Sí | directa | |
| `meal_type` | `TIPO_COMIDA` | Sí | directa | |
| `objective_legacy` | `OBJETIVO` | Sí | directa | |
| `prep_time_min` | `TIEMPO_PREP_MIN` | Sí | directa | |
| `difficulty` | `DIFICULTAD` | Sí | directa | |
| `servings` | `RACIONES` | Sí | directa | |
| `nutrition` | `KCAL_DECLARADAS/PROTEINA_G/CARBS_G/GRASAS_G/FIBRA_G/SODIO_MG` | Sí | directa | valores en bruto, no umbrales |
| `ingredients_text` / `preparation_text` | `INGREDIENTES_NLX` / `PREPARACION_NLX` (+ chunks `INGREDIENTES`/`PREPARACION`) | Sí | directa/reformato | |
| `substitutions` | `SUSTITUCIONES` (+ chunk `SUSTITUCIONES`) | Sí | directa | |
| `dietary_restrictions` / `public_tags` | columnas booleanas de dieta | Parcial | reformato a array | |
| `allergens_legacy` | `ALERGENOS` | Sí | directa | |
| `review_flags` | `REQUIERE_REVISION_PROFESIONAL, MOTIVO_REVISION_PROFESIONAL, NIVEL_VALIDACION, VALIDADA_*` | Sí | reformato | |
| `pilot_review_v1_1.review_status/public_copy_review/macro_coherence_review` | `ESTADO`, `TEST_KCAL_MACROS`/`DELTA_KCAL`, `TEST_CLAIMS` (hoja test) | Parcial | reformato/renombrado | correspondencia razonable, no 1:1 literal en nombre de campo |
| `pilot_review_v1_1.clinical_profile_review_scope = "14_PROFILES"` | — | **No** | — | el workbook solo tiene 10 categorías, no 14; no hay evidencia de dónde sale el número 14 dentro de este fichero |
| `observed_legacy_clinical_outputs.<HTA/DM2/...>` (14 códigos, con `eligibility/fit/reason_codes/rule_set_version`) | `APTO_*` (10 categorías, sin `fit` ni `reason_codes` estructurados) | **No** (taxonomía distinta) | — | el propio Master aclara que este campo viene de `v1.7`, no directamente de este workbook (ver `_meta.note`) |
| `nutritional_rules_reference` / `clinical_profiles_reference` (specs) | — | **No** | — | `NOT_FOUND` en el workbook, confirmado independientemente de la declaración `REFERENCED_NOT_RECOVERED` ya existente en el propio Master |
| `gamification_bindings` | — | **No** | — | ningún dato de puntos/DVG/`life_days` en el workbook |

**Determinación (opciones A–D del encargo)**: **B. El workbook es fuente parcial** — fuente directa y trazable del contenido editorial/nutricional en bruto de 8/58 recetas, pero **no** de las salidas clínicas de 14 perfiles ni de ninguna de las 3 specs. Para los otros 50/58 recetas del Master, este workbook no aporta ninguna fila — no hay lineage demostrable ahí (`D` para esas 50).

---

## L. Three-Spec Recovery Verdict

### NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0

**`NOT_FOUND`**

Ningún threshold, operador, ni tabla de límites nutricionales en ninguna hoja, fórmula, named range o celda.

### NUTRILONGX_CLINICAL_PROFILES_v1.0

**`NOT_FOUND`**

Existe una matriz de salida (`PROFILE_OUTPUT_MATRIX`) de 10 categorías sin definiciones, con taxonomía distinta a los 14 códigos reales del Master, y el propio workbook declara explícitamente no haber construido todavía la hoja de definición de perfiles.

### NUTRILONGX_CLINICAL_RULES_v1.0

**`NOT_FOUND`**

Cero fórmulas en el libro completo. Solo veredictos ya aplicados (`OUTPUT_ONLY`), sin ninguna regla explícita, threshold, operador o estructura de decisión recuperable.

---

## M. Workbook Role Verdict

# `WORKBOOK_VALIDATED_AS_RECIPE_SOURCE_ONLY`

Justificación: el workbook demuestra ser fuente real, directa y trazable de **contenido de receta** (identidad, macros declarados, ingredientes, preparación, tags dietéticos, chunks de texto cliente, bibliografía de ingredientes) para exactamente 8 de las 58 recetas del Master — pero no aporta ninguna de las 3 specs clínicas, ni siquiera parcialmente, ni puede explicar por sí solo el contenido de 14 perfiles que el Master atribuye a esta misma "pilot v1.1".

**Recomendación sobre el estado actual `RECOVERED_PENDING_CONTENT_VALIDATION`**: se puede sustituir por un estado más preciso — se recomienda (sin aplicarlo aquí, per instrucción de no tocar el registry todavía):

```
RECOVERED_VALIDATED_AS_PARTIAL_RECIPE_SOURCE
```
o, si se prefiere mantener el vocabulario ya usado en el registry:
```
status: RECOVERED_PARTIAL_SOURCE
scope: "8/58 recetas (NLX-001–NLX-008); NO aporta NUTRIENT_THRESHOLDS_v1.0, CLINICAL_PROFILES_v1.0 ni CLINICAL_RULES_v1.0"
```
**No se ha aplicado ningún cambio al registry** — queda como recomendación, pendiente de decisión de César (sección 15 del encargo).

---

## N. Potential Master Impact

# `NO_MASTER_CHANGE_REQUIRED`

Justificación: esta auditoría no ha recuperado ninguna spec nueva ni ha encontrado ninguna inconsistencia en el propio `NUTRILONGX_ALIMENTACION_MASTER_v1.json` — al contrario, **confirma de forma independiente** lo que el Master ya declaraba sobre sí mismo (`REFERENCED_NOT_RECOVERED`, `rules: []`, `_meta.note` de `observed_legacy_clinical_outputs`). No hay contenido nuevo que justifique un `v1.1` del Master derivado de este workbook. Si en el futuro aparecieran las 3 specs reales (en otro soporte), **entonces sí** procedería evaluar `MASTER_v1_1_RECOMMENDED` — pero eso no ha ocurrido en esta auditoría.

---

## O. Gaps / Ambiguities

1. El origen real de la matriz de 14 perfiles (`observed_legacy_clinical_outputs`) sigue sin identificarse — el propio Master apunta a `v1.7` como fuente inmediata, pero `v1.7` a su vez no expone de dónde salieron esos 14 códigos ni sus reglas (fuera del alcance de esta auditoría, que es solo sobre el `.xlsx`).
2. No hay tabla de equivalencia documentada entre los 10 códigos `APTO_*` del workbook y los 14 códigos clínicos del Master — cualquier correspondencia sugerida en §F es solo similitud léxica, no una equivalencia verificada.
3. Se desconoce si existe una versión más completa/posterior de este mismo workbook (p. ej. con la hoja `PERFILES_CLIENTE` ya construida, mencionada como plan de "Sprint 3") en algún otro soporte no auditado.
4. El criterio exacto detrás de `DELTA_KCAL_FLAG = OK` (¿qué margen de delta se considera aceptable?) no está documentado en ninguna celda — es un output, no una regla, pero se señala como ambigüedad menor.
5. `TEST_PERFIL_CLINICO = OK` en `RECETAS_TEST_RESULTS` para las 8 recetas no aclara contra qué perfiles o qué criterio se verificó — otro output sin regla visible.

---

## P. Recommended Next Action

Un único paso: **preguntar a César si existe una versión posterior de este workbook (post-Sprint 3, con la hoja `PERFILES_CLIENTE` ya construida) en algún soporte no auditado todavía** — es el único hilo concreto que el propio fichero deja abierto hacia una posible recuperación futura de `NUTRILONGX_CLINICAL_PROFILES_v1.0`. Mientras no aparezca, no hay más acción de recuperación posible sobre el `.xlsx` actual.

---

## QA

| # | Comprobación | Resultado |
|---|---|---|
| QA1 | SHA-256 before == after | ✅ PASS (`a062770e...b699d3` en ambos) |
| QA2 | Workbook no modificado | ✅ PASS |
| QA3 | Todas las hojas inventariadas | ✅ PASS (6/6) |
| QA4 | Hojas hidden/very hidden auditadas | ✅ PASS (0 encontradas, las 6 visibles) |
| QA5 | Named ranges auditados | ✅ PASS (0 propios; 5 `_xlnm._FilterDatabase` internos documentados) |
| QA6 | Fórmulas auditadas | ✅ PASS (0, verificado por XML y por `openpyxl`) |
| QA7 | 58 recetas buscadas explícitamente | ✅ PASS — buscadas; solo 8 encontradas (`NLX-001`–`NLX-008`), documentado como hallazgo, no como fallo |
| QA8 | Ninguna regla reconstruida por inferencia | ✅ PASS — toda correspondencia especulativa (§F) marcada explícitamente como no verificada |
| QA9 | `RECOVERED_COMPLETE` solo con evidencia determinista | ✅ PASS — no se usó en ningún veredicto |
| QA10 | Outputs clínicos no confundidos con reglas | ✅ PASS — `RECETAS_TEST_RESULTS` y `APTO_*` clasificados como `OUTPUT_ONLY`/`PROFILE_OUTPUT_MATRIX`, nunca como regla |
| QA11 | Profile IDs no confundidos con profile definitions | ✅ PASS — distinción explícita en §F |
| QA12 | Nutrient values no confundidos con thresholds | ✅ PASS — distinción explícita en §E |
| QA13 | Tags no confundidos automáticamente con reglas | ✅ PASS — §H documenta ausencia de mapping, sin inventar ninguno |
| QA14 | Master v1 no modificado | ✅ PASS (solo lectura, verificado por hash sin cambios) |
| QA15 | Recipes source v1.7 no modificado | ✅ PASS (no se ha escrito en ese fichero) |
| QA16 | Registry no modificado | ✅ PASS (no tocado en esta fase) |
| QA17 | Manifest no modificado | ✅ PASS (no tocado en esta fase) |
| QA18 | No Supabase | ✅ PASS |
| QA19 | No SQL | ✅ PASS |
| QA20 | No Vercel | ✅ PASS |
| QA21 | No cambios funcionales | ✅ PASS |
| QA22 | No secretos impresos ni persistidos | ✅ PASS — ningún dato personal/credencial en el workbook |
| QA23 | Toda conclusión respaldada por celdas/hojas/fórmulas concretas | ✅ PASS — cada verdict cita hoja/columna/fila |
| QA24 | Distinción clara RECOVERED vs. VALIDATED | ✅ PASS — §J aclara explícitamente que nada aquí es `SCIENTIFICALLY_VALIDATED` |

**QA: 24/24 PASS.**
