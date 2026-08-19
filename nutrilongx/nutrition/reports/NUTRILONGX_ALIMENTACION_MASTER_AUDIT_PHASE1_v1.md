# NUTRILONGX — Alimentación Master, Fase 1: Auditoría de Fuentes

Fecha: 2026-08-18. Fase exclusivamente de lectura/reconciliación/normalización de esquema/trazabilidad. No se ha generado `NUTRILONGX_ALIMENTACION_MASTER_v1.json` todavía. Los artefactos `CANONICAL v1.0` (actions catalog, engine, legacy mapping) permanecen `FROZEN` — no se han tocado, solo se han leído para el cruce de bindings.

Fuentes recibidas y auditadas: `NUTRILONGX_RECIPES_MASTER_v1.7_BATCH_AND_COMPOSITION_GAPS.json`, `NUTRILONGX_RECIPES_MASTER_v1.6_RETAIL_AGNOSTIC.json`. No se han recibido `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0`, matriz de perfiles clínicos, diccionario de tags, JSON maestro previo de recetas etiquetadas, ni documentos CORE de alimentación adicionales — su ausencia se documenta como gap en cada sección donde aplica, no se ha suplido con inferencia propia.

---

## 1. AUDITORÍA DE FUENTES — v1.6 vs v1.7

**Resultado: CASO A puro — v1.7 contiene íntegramente lo válido de v1.6, sin excepción.**

El array `recipes` (58 recetas en ambos ficheros) es **byte a byte idéntico** entre v1.6 y v1.7: mismos 58 `recipe_id` (`NLX-001`…`NLX-058`, sin huecos), mismo contenido campo a campo en las 58, verificado por comparación JSON canonicalizada. Ninguna receta cambió de valor, texto, tag, nutrición o provenance entre versiones.

De los 19 bloques de nivel superior del documento, **16 son idénticos byte a byte** entre v1.6 y v1.7 (`schema`, `generated_from`, `frozen_specs`, `governance`, `summary`, `recipes`, `pilot_001_008_review`, `composition_policy_v1_0`, `normalization_standard_v1_0`, `composition_source_execution_v1_0`, `pilot_composition_execution_summary`, `spain_sourcing_policy_v1_0`, `pilot_spain_sourcing_summary`, `NUTRILONGX_SHOPPING_MODEL_v1`, `retail_validation_internal_v1`, `spain_sourcing_policy_v1_1`, `canonical_food_catalogue_v1`, `shopping_list_aggregation_schema_v1`). Difieren únicamente:
- `version` (`"1.6"` → `"1.7"`) y `status` (`RETAIL_AGNOSTIC_CANONICAL_FOOD_MODEL` → `RETAIL_AGNOSTIC_BATCH_READY_COMPOSITION_JOIN_PENDING`).
- v1.7 añade tres bloques nuevos, puramente aditivos, que no existen en v1.6: `pilot_composition_gap_matrix_v1` (matriz de qué nutrientes faltan por receta piloto y su estado de unión con base de datos de composición), `pilot_batch_shopping_example_v1` (ejemplo de lista de la compra agregada para las 8 recetas piloto) y `composition_execution_note_v1` (nota explícita: no se han inventado valores de grasa saturada/potasio/fósforo por no disponer de un dataset BEDCA/USDA local completo en el entorno de ejecución que generó estos ficheros).

**Conclusión de jerarquía**: v1.7 = base canónica (contiene todo v1.6 más el aparataje de gaps de composición y ejemplo de compra por lotes). v1.6 queda como comparador/provenance histórico, pero al ser idéntico en todo lo sustantivo, su valor añadido real es nulo salvo como confirmación de que nada se perdió entre versiones. No ha sido necesaria ninguna reconciliación tipo CASO B.

**Ambos ficheros comparten la misma limitación estructural**, heredada de `NUTRILONGX_Motor_Recetas_v1_1.xlsx`: `frozen_specs` declara `nutrient_thresholds: "NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0"` y `clinical_profiles: "NUTRILONGX_CLINICAL_PROFILES_v1.0"` como **referencias por nombre**, no como contenido embebido. Además, cada receta referencia una tercera especificación, `NUTRILONGX_CLINICAL_RULES_v1.0` (en `validation.clinical_rule_version` y en `clinical_profiles.<perfil>.rule_set_version`), que ni siquiera aparece nombrada en `frozen_specs`. Ninguna de las tres — los umbrales nutricionales exactos, la definición de los 14 perfiles clínicos, ni el motor de reglas — está presente como contenido estructurado en v1.6 ni en v1.7. Lo que sí está presente son los **resultados** de aplicar esas reglas (estados de elegibilidad, `reason_codes`, tags EU) por receta.

---

## 2. PROPUESTA DE ESQUEMA DEL MASTER (sin generar el JSON todavía)

Dado lo anterior, el esquema que propongo para `NUTRILONGX_ALIMENTACION_MASTER_v1.json` es:

- **`recipes`** — las 58 recetas, con su estructura ya rica de origen preservada íntegra (incluyendo los sub-bloques versionados `ingredients_structured_v1_2` → `shopping_and_sourcing_v1_6` donde existan) más un envoltorio de provenance/status a nivel de receta. No se colapsa ni resume nada; se conserva el 100% de los campos que ya trae v1.7.
- **`nutritional_rules`** — **sección de solo-referencia**, no de contenido: listará los tres `rule_set` nombrados (`NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0`, `NUTRILONGX_CLINICAL_PROFILES_v1.0`, `NUTRILONGX_CLINICAL_RULES_v1.0`) con su versión y un `status: "REFERENCED_NOT_PROVIDED"`, sin `threshold`/`operator`/`resulting_tag` inventados. La cadena `receta → composición → regla aplicada → tag resultante` solo es reconstruible parcialmente: sí existe `composición → reason_code → eligibility` (embebido en cada receta), pero no `reason_code → umbral numérico exacto` porque ese umbral no se nos ha entregado.
- **`clinical_profile_mapping`** — igualmente de solo-referencia por el mismo motivo: no existe un fichero de definición de perfiles (`included_tags`/`excluded_tags`/`caution_tags`) que copiar; solo existen los 14 nombres de perfil (`frozen_specs.clinical_profiles_list`) y sus resultados por receta. Propongo dejar esta sección con los 14 `profile_id` y un `status: "DEFINITION_NOT_PROVIDED"`, remitiendo a `recipes[].clinical_profiles` para los resultados observados — sin sintetizar yo una definición de perfil que no me ha sido dada (eso sería inferencia clínica nueva, expresamente prohibida).
- **`educational_content`** — vacía. No hay ningún contenido educativo de alimentación en v1.6/v1.7 (0 menciones de patrón mediterráneo como artículo, proteína, fibra, hidratación, ultraprocesados o planificación como piezas de contenido; sí existen como *tags* de receta, que es distinto).
- **`habits_microhabits`** — vacía. Cero menciones de hábito/microhábito en las fuentes de alimentación entregadas. (Nota: si en el futuro se quiere cruzar con contenido divulgativo ya aprobado de otros pilares, ese material vive en `estado_pilares_bienestar.md`/`NUTRILONGX_contenido_pilares_v2_FINAL.json`, que es de Sueño/Estrés/Bienestar emocional, no de Alimentación — no lo he mezclado aquí.)
- **`challenges`** — vacía. Cero menciones de retos en estas fuentes; no se ha convertido ninguna receta en reto, como se pidió explícitamente no hacer.
- **`media`** — vacía. Cero referencias a imágenes, infografías, vídeos o assets en v1.6/v1.7.
- **`gamification_bindings`** — el cruce con `NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json` (`nutrition` + `adherence.nutrition`), con la estructura `{canonical_action_id, binding_type, status, notes}` pedida, a nivel de receta y/o de tag agregando recetas.
- **`provenance`** a nivel de documento — fichero fuente, versión, fecha de canonización, hash o recuento de recetas para poder detectar en el futuro si `v1.7` deja de ser un superconjunto de `v1.6`.

Quedo a la espera de tu confirmación sobre este esquema antes de poblarlo.

---

## 3. INVENTARIO DE RECETAS

- **Total**: 58 recetas en v1.7 (= 58 en v1.6, mismas 58, sin solapamiento parcial que reconciliar). IDs `NLX-001`–`NLX-058`, correlativos, sin huecos, sin duplicados.
- **IDs duplicados**: 0. **Títulos duplicados**: 0.
- **Recetas con estructura completa** (bloques `ingredients_structured_v1_2` → `shopping_and_sourcing_v1_6`, normalización de ingredientes a gramos, `composition_calculation`, `pilot_review_v1_1`): **8** — exactamente `NLX-001` a `NLX-008`, el lote piloto declarado en `pilot_001_008_review`.
- **Recetas con estructura básica únicamente** (solo `ingredients_text`/`preparation_text` libres, sin normalización a gramos ni matching de composición): **50**.
- **Recetas con `RECIPE_STRUCTURE_INCOMPLETE`** (además de básicas, con `ingredients_text`, `preparation_text`, `servings`, `prep_time_min`, `difficulty` y `meal_type` (2 de ellas) directamente ausentes): **7** — `NLX-015`, `NLX-016`, `NLX-018`, `NLX-020`, `NLX-032`, `NLX-045`, `NLX-051`. Coincide exactamente con lo que la propia fuente ya se autoetiqueta en `validation.warnings`, lo cual es una buena señal de consistencia interna del dato.
- **Ingredientes incompletos / cantidades sin unidad**: en las 50 recetas básicas, `ingredients_text` es texto libre sin estructurar — no hay `quantity`/`unit` explícitos por ingrediente (eso solo existe en las 8 piloto, vía `ingredients_structured_v1_2`, y ahí mismo el propio dato marca la mayoría como `COUNT_OR_HOUSEHOLD_WEIGHT_REQUIRED` o `NEEDS_MANUAL_WEIGHT_NORMALIZATION` — es decir, incluso en las 8 recetas piloto, gran parte de los ingredientes con cantidad "al gusto"/"1 unidad" no llegan a gramos explícitos sin la capa de normalización v1.3, que sí existe para las 8).
- **Pasos vacíos**: 7 (las mismas `RECIPE_STRUCTURE_INCOMPLETE`).
- **`servings` ausente**: 7 (idénticas). **`portion_grams` ausente**: 50. **`season` ausente**: 50 (solo las 8 piloto declaran `TODO_AÑO`). **`substitutions` ausente**: 50.
- **Nutrición incompleta**: solo 8/58 recetas (las piloto) tienen los 6 campos "core" (`kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sodium_mg`) presentes; las otras 50 tienen los 10 campos de `nutrition.per_serving` completamente a `null`. De los 4 campos "extendidos" (`saturated_fat_g`, `potassium_mg`, `phosphorus_mg`, `calcium_mg`), **ninguna receta los tiene completos**: `calcium_mg` es `null` en las 58; `saturated_fat_g`/`potassium_mg`/`phosphorus_mg` solo están presentes en 1/58 (`NLX-006`, la única marcada `COMPOSITION_STATUS: COMPLETE` en `pilot_composition_gap_matrix_v1`). El propio fichero es explícito y disciplinado al respecto: `composition_execution_note_v1` declara literalmente que no se han inventado esos tres valores por falta de un dataset BEDCA/USDA local completo.
- **Valores extremos**: sobre las 8 recetas con `kcal` (únicas con dato), el rango es 310–450 kcal/ración — variación razonable, sin outliers evidentes. No se puede evaluar el resto por ausencia de dato (no se han estimado valores para completar el análisis, como se pidió).
- **Alérgenos — inconsistencia de formato detectada**: el campo `allergens` mezcla como mínimo tres formatos distintos entre recetas: listas simples (`"PESCADO"`, `"HUEVOS"`), listas con calificador entre paréntesis (`"SESAMO (tahini)"`, `"GLUTEN (avena convencional — trazas)"`) y strings tipo mini-DSL (`"CONTIENE: PESCADO | Ninguno"`, `"CONTIENE: HUEVO | TRAZAS: GLUTEN (opcional)"`). No es un campo normalizado; cualquier filtro por alérgeno tendría que parsear texto libre heterogéneo. Se documenta, no se normaliza en esta fase (evitaría alterar el dato original sin tu aprobación).
- **Restricciones dietéticas** (`dietary_restrictions`): solo dos flags booleanos, `gluten_free_legacy` y `lactose_free_legacy` — 49/58 y 48/58 `true` respectivamente. Es un campo heredado ("_legacy"); no hay estructura equivalente moderna en estas fuentes.
- **Recetas sin `provenance`**: 0 (las 58 tienen el objeto `provenance`, aunque su contenido varía mucho: las 50 básicas no tienen `source_inspiration` ni `safety_test`, las 8 piloto sí).
- **`safety_test` ausente**: 50/58 (coincide con `SAFETY_TEST_NOT_AVAILABLE` en `warning_counts`).
- **Distribución `meal_type`**: `COMIDA` 39, `ALMUERZO` 9, `DESAYUNO` 5, `CENA` 3, ausente 2. **`objective_legacy`**: `MANTENIMIENTO` 43, ausente 7, `PERDIDA_PESO` 3, `LONGEVIDAD` 2, `GANANCIA_MASA` 2, `MENOPAUSIA` 1. **`difficulty`**: `FACIL` 46, ausente 7, `MEDIA` 5 (ninguna `DIFÍCIL`).

---

## 4. INVENTARIO DE REGLAS/TAGS

**Reglas nutricionales estructuradas: 0 encontradas** — las tres especificaciones referenciadas (`NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0`, `NUTRILONGX_CLINICAL_PROFILES_v1.0`, `NUTRILONGX_CLINICAL_RULES_v1.0`) se citan por nombre y versión en `frozen_specs` y en cada receta, pero ninguna trae su contenido (umbral, operador, nutriente objetivo) en v1.6 ni v1.7. Sí existe, como referencia de contexto (no como regla clínica per se), `composition_policy_v1_0.reference_values` (potasio 3500 mg/día, fósforo 550 mg/día — valores de ingesta adecuada poblacional EFSA, explícitamente aclarado como "no son umbrales clínicos automáticos para ERC").

**Tags públicos — `culinary_and_dietary`** (12 valores, 58 recetas): `MEDITERRANEAN` (50), `GLUTEN_FREE` (49), `LACTOSE_FREE` (48), `EASY` (46), `QUICK` (38), `LEGUME_RICH` (22), `VEGETARIAN` (20), `LEAN_MEAT_BASED` (19), `FISH_OR_SEAFOOD` (18), `WHOLE_GRAIN_OR_HIGH_FIBER_STARCH` (13), `VEGAN` (8), `MEAL_PREP` (3, solo en piloto).

**Tags públicos — `nutrition_claims_eu`** (5 valores, solo presentes en las 8 recetas piloto — las 50 básicas tienen esta lista vacía por falta de datos nutricionales): `HIGH_PROTEIN_EU` (6), `SOURCE_OF_FIBER_EU` (5), `LOW_SODIUM_EU` (4), `SOURCE_OF_PROTEIN_EU` (1), `VERY_LOW_SODIUM_EU` (1).

**`ingredient_and_rule_tags`** (6 valores): `MEDITERRANEAN_PATTERN` (50), `PLANT_FORWARD` (21), `HIGH_PURINE_ANIMAL_SOURCE` (4), `MODERATE_PURINE_LOAD` (3), `RED_MEAT` (2), `ADDED_SUGAR` (1).

**`reason_codes` de elegibilidad clínica**: 42 valores distintos observados sobre 812 pares receta×perfil evaluados. Los más frecuentes son de **ausencia de dato**, no de contenido clínico: `SODIUM_DATA_MISSING` (250), `PHOSPHORUS_DATA_MISSING`/`POTASSIUM_DATA_MISSING`/`RENAL_NUTRIENT_DATA_INSUFFICIENT` (174 cada uno), `SATURATED_FAT_DATA_MISSING` (58), `CARB_OR_FIBER_DATA_MISSING` (50), `PROTEIN_DATA_MISSING` (43). Es decir: la mayoría de los `reason_codes` documentan por qué **no** se pudo evaluar un perfil, no por qué sí.

**Distribución global de elegibilidad** (812 pares receta×perfil): `APTO` 316 (38,9%), `NO_EVALUADO` 315 (38,8%), `PRECAUCION` 181 (22,3%), `NO_APTO` 0. Ningún perfil clínico tiene una sola receta marcada `NO_APTO` en estas 58 recetas.

**Perfiles sin ninguna receta `APTO`** (posible gap de cobertura, no de error): `DYSLIPIDEMIA` (58/58 `NO_EVALUADO`), `CKD_MILD` (58/58 `NO_EVALUADO`), `CKD_MODERATE` (58/58 `PRECAUCION`), `CKD_ADVANCED` (58/58 `PRECAUCION`), `ONCOLOGY` (51 `PRECAUCION` + 7 `NO_EVALUADO`, 0 `APTO`). Los cuatro primeros son consistentes con la ausencia de datos de sodio/potasio/fósforo/grasa saturada explicada arriba, no con un juicio clínico negativo.

**Tags sin regla / reglas sin tag usado**: dado que no existe el fichero de reglas, no puedo comparar "tag definido en la regla" vs "tag usado en receta" de forma fiable — solo puedo confirmar que **todos** los tags observados en recetas (`public_tags`, `ingredient_and_rule_tags`, `reason_codes`) están efectivamente en uso (ninguno aparece definido-pero-sin-uso, porque no hay definición aparte de su uso). Esto es un artefacto de la ausencia de fuente, no una confirmación de coherencia real.

**Contradicciones / tags mutuamente incompatibles**: busqué explícitamente la noción de incompatibilidad, contraindicación o exclusión mutua entre tags en ambas fuentes (`incompat`, `contraindic`, `mutually_exclusive`, `conflicto`) — **cero coincidencias**. Las fuentes no definen ese concepto. Conforme a la instrucción de no inventar contraindicaciones, no reporto ninguna — reporto la ausencia de la noción misma.

**`legacy_clinical_flags`** (6 flags heredados por receta: menopausia, oncología, diabetes, renal, cardiovascular, embarazo): vocabulario de valores observado = `PENDIENTE_REVISION` (283), ausente/`null` (42), `SI` (23). **No aparece ningún `NO` explícito en ninguna receta** — el sistema legacy nunca registró una exclusión clínica dura, solo aprobación o pendiente. Dato a tener en cuenta, no una anomalía per se.

---

## 5. MAPA DE BINDINGS CON ACTIONS CANONICAL

`NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json` (frozen, no alterado) contiene **30 familias `canonical_domain = "nutrition"`** y **7 familias `canonical_domain = "adherence"` + `canonical_subdomain = "nutrition"`** — 37 acciones candidatas en total a las que Alimentación puede enlazar.

Estas 37 acciones son micro-comportamientos diarios genéricos ("Legumbres: 1 ración(es)", "Usa AOVE como grasa principal", "Reduce UPF (0 snacks envasados)", "Batch cooking saludable 2h/sem"…), mientras que las 58 recetas son platos completos concretos. La correspondencia natural entre ambos mundos **no es 1:1** — ninguna receta "es" una acción canónica; como mucho, una receta **apoya** (evidencia/contexto) una o varias acciones si su composición o sus tags son coherentes con ellas. Por eso, para esta fase, no propongo ningún binding `"direct"`/`status: "confirmed"` — solo candidatos `"supports"`/`status: "candidate"`, basados exclusivamente en los tags ya estructurados de cada receta (`ingredient_and_rule_tags` + `public_tags.culinary_and_dietary`), nunca en similitud de texto libre entre título de receta y título de acción.

Metodología propuesta y resultado preliminar de aplicarla (sujeto a tu revisión antes de fijarla en el master):

| Tag de receta | Acciones candidatas (canonical_action_id) | Recetas candidatas |
|---|---|---|
| `MEDITERRANEAN_PATTERN` | `adherence.nutrition.lista_de_la_compra_mediterranea`, `nutrition.mediterranean_pattern.legumbres_veces_sem` | 50 |
| `LEGUME_RICH` | `nutrition.mediterranean_pattern.anade_racion_de_legumbre_en_ensalada`, `...legumbres_racion_es` | 22–23 |
| `WHOLE_GRAIN_OR_HIGH_FIBER_STARCH` | `nutrition.mediterranean_pattern.pan_integral_en_comidas`, `...incluye_cereal_integral_distinto_avena_q`, `adherence.nutrition.compra_integral_pan_arroz_pasta_integral` | 13 |
| `FISH_OR_SEAFOOD` | `nutrition.mediterranean_pattern.pescado_azul_vez_sem` | 18 (⚠️ ver nota) |
| `MEAL_PREP` | `adherence.nutrition.batch_cooking_saludable_h_sem` | 3 |
| `RED_MEAT` | `nutrition.processed_reduction.carne_roja_g` | 2 (⚠️ ver nota) |
| `ADDED_SUGAR` | `nutrition.processed_reduction.reduce_dulces_industriales_a_hoy` | 1 (⚠️ ver nota) |

⚠️ **Nota de valencia invertida**: `RED_MEAT` y `ADDED_SUGAR` son tags que marcan que la receta *contiene* carne roja / azúcar añadido, mientras que las acciones canónicas correspondientes premian *reducir* ese consumo. Vincularlas tal cual como "supports" sería semánticamente incorrecto — lo correcto es un `binding_type` distinto (p. ej. "contextual_opposite" o simplemente no vincular) que decidiremos en la fase de construcción, no ahora. Igualmente, `FISH_OR_SEAFOOD` es más amplio que "pescado azul" (la acción exige específicamente pescado azul/omega-3): el binding real debería filtrarse por ingrediente, no solo por el tag genérico — de ahí que lo marque candidato, no confirmado.

**Resultado preliminar**: 11 de las 37 acciones nutrition/adherence.nutrition tienen al menos una receta candidata; **26 acciones quedan sin ningún candidato** (hidratación, method-of-plate, desayuno con proteína, snacks, varias del patrón mediterráneo como "fruta entera", "verduras", "AOVE", "lácteos naturales" — no porque no existan recetas afines, sino porque mi crosswalk de tags es deliberadamente conservador en esta fase y no he cruzado composición/ingredientes estructurados uno a uno, solo tags de alto nivel). 57 de las 58 recetas tienen al menos un binding candidato; 1 receta queda sin ninguno.

No se ha forzado cobertura al 100% en ningún sentido, tal como se pidió.

---

## 6. CONFLICTS AND GAPS

1. **[ALTA] Umbrales y reglas clínicas no entregados.** `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0`, `NUTRILONGX_CLINICAL_PROFILES_v1.0` y `NUTRILONGX_CLINICAL_RULES_v1.0` se referencian por nombre en las 58 recetas pero su contenido no está en ninguna de las dos fuentes recibidas. Sin ellos, `nutritional_rules` y `clinical_profile_mapping` del master solo pueden ser secciones de referencia (nombre + versión + `DEFINITION_NOT_PROVIDED`), no reglas reconstruidas.
2. **[ALTA] Composición nutricional incompleta en el 86% del catálogo.** 50/58 recetas no tienen ningún macro/micronutriente calculado; de las 8 que sí, solo 1 (`NLX-006`) tiene los 3 nutrientes "difíciles" (grasa saturada, potasio, fósforo) resueltos. Esto limita directamente la fiabilidad de cualquier filtro clínico basado en composición para el 98% de los pares receta×perfil.
3. **[MEDIA] `allergens` no normalizado.** Al menos 3 formatos de texto libre distintos conviven en el mismo campo entre recetas; un filtro de alérgenos fiable requeriría normalizarlo primero (no hecho en esta fase, solo documentado).
4. **[MEDIA] 7 recetas estructuralmente incompletas** (`NLX-015/016/018/020/032/045/051`): sin ingredientes, sin pasos, sin `servings`. Coherente con el propio `warning_counts` de la fuente — no es un hallazgo nuevo, pero condiciona qué puede entrar "activo" en el master.
5. **[MEDIA] Bindings receta↔acción no son 1:1 por naturaleza del dominio.** 26/37 acciones nutrition/adherence.nutrition quedan sin candidato con el crosswalk conservador de tags de esta fase; ampliarlo a nivel de ingrediente individual (cuando exista `ingredients_canonical_v1_6`) podría cubrir más, pero solo está disponible en las 8 recetas piloto.
6. **[BAJA] Valencia invertida en 2 candidatos de binding** (`RED_MEAT`, `ADDED_SUGAR`) — ya señalado arriba, no se resuelve en esta fase, se deja para el diseño del binding real.
7. **[BAJA] `legacy_clinical_flags` nunca registra un "NO" explícito** — solo `SI` o `PENDIENTE_REVISION`. No es un error de los datos, pero limita su utilidad como fuente de exclusión dura.
8. **[INFO] v1.6 no aporta nada que v1.7 no tenga.** Confirmado exhaustivamente; se conserva como comparador de provenance según lo pedido, sin que eso implique trabajo de reconciliación adicional.

---

## 7. RECOMENDACIÓN

**`READY_FOR_ALIMENTACION_MASTER_BUILD`** — con alcance ajustado a lo que las fuentes realmente contienen.

La reconciliación v1.6/v1.7 es trivial y limpia (CASO A, sin pérdida ni conflicto), el inventario de recetas es internamente consistente (la propia fuente se autodocumenta con precisión sobre sus huecos), y el cruce con `actions_catalog` canonical es viable sin forzar nada. Lo que **no** está listo — y no puede estarlo con las fuentes entregadas — es todo lo que depende de `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0` / `CLINICAL_PROFILES_v1.0` / `CLINICAL_RULES_v1.0` como contenido real, y toda la composición nutricional de las 50 recetas no piloto: eso quedará correctamente marcado como referencia/pendiente en el master, no bloqueando su construcción, pero sí limitando lo que el master puede afirmar.

Si apruebas el esquema de la sección 2 y das por buena la metodología de bindings de la sección 5 (o me indicas ajustes), genero `NUTRILONGX_ALIMENTACION_MASTER_v1.json` y `NUTRILONGX_ALIMENTACION_MASTER_BUILD_REPORT_v1.md`.
