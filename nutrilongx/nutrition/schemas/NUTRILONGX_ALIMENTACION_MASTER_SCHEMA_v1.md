# NUTRILONGX — Alimentación Master: Esquema Final v1, Ruleset de Normalización, Recovery Status y Build Readiness

Fecha: 2026-08-18. Fase 1B aprobada con las decisiones de tu mensaje. Este documento entrega exclusivamente A–D. **No se genera `NUTRILONGX_ALIMENTACION_MASTER_v1.json` en este turno.** `CANONICAL v1.0` sigue `FROZEN`, sin tocar. Sin SQL, sin cambios en Supabase/GitHub/Vercel/código.

---

## A. FINAL MASTER SCHEMA v1

Esquema estructural completo (no datos poblados). Comentarios `//` indican origen: `[VERBATIM]` = copiado sin alterar de v1.7, `[NEW]` = campo añadido por la canonización de Alimentación, `[REF]` = referencia externa, nunca contenido inventado.

```jsonc
{
  "schema": "NUTRILONGX_ALIMENTACION_MASTER",
  "version": "1.0.0",
  "generated_at": "<fecha ISO>",                         // [NEW]
  "status": "BUILD_STATUS_PLACEHOLDER",                    // [NEW] p.ej. "ACTIVE_WITH_REFERENCED_NOT_RECOVERED_SPECS"

  "source_lineage": {                                       // [NEW]
    "recipes_canonical_source": {
      "file": "NUTRILONGX_RECIPES_MASTER_v1.7_BATCH_AND_COMPOSITION_GAPS.json",
      "role": "CANONICAL_BASE",
      "recipe_count": 58
    },
    "recipes_comparator_source": {
      "file": "NUTRILONGX_RECIPES_MASTER_v1.6_RETAIL_AGNOSTIC.json",
      "role": "PROVENANCE_COMPARATOR",
      "diff_result": "IDENTICAL_RECIPES_ADDITIVE_TOPLEVEL_ONLY"
    },
    "generated_from_workbook": "NUTRILONGX_Motor_Recetas_v1_1.xlsx",  // [REF] no recuperado
    "actions_catalog_canonical_reference": {
      "file": "NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json",
      "status": "FROZEN_READ_ONLY",
      "used_for": "gamification_bindings only, never modified"
    },
    "audit_reports_referenced": [
      "NUTRILONGX_ALIMENTACION_MASTER_AUDIT_PHASE1_v1.md",
      "NUTRILONGX_ALIMENTACION_FASE1B_PREP_v1.md",
      "NUTRILONGX_ALIMENTACION_MASTER_SCHEMA_v1.md"
    ]
  },

  "governance_decisions_applied": [                         // [NEW] una entrada por decisión de Fase 1 + 1B
    "PHASE1: v1.7 = base canonica de recetas; v1.6 = comparador de provenance sin contenido propio.",
    "PHASE1B_D1: maturity model congelado (ACTIVE_READY/PARTIAL/INCOMPLETE), eje independiente de eligibility clinica.",
    "PHASE1B_D2: allergens_legacy + allergens_normalized; lista vacia legacy => NOT_ASSESSED, nunca NONE_DECLARED.",
    "PHASE1B_D3: binding_semantics v1 congelado incluyendo contextual_opposite como tipo canonico.",
    "PHASE1B_D4: specs clinicas en estado REFERENCED_NOT_RECOVERED (no DEFINITION_NOT_PROVIDED_FINAL).",
    "PHASE1B_D5: prohibido reconstruir regla desde outputs; outputs preservados como observed_legacy_clinical_outputs.",
    "PHASE1B_D6: COMPOSITION_UNKNOWN != 0 en todos los calculos; ningun null convertido a 0 o estimado."
  ],

  "specs_recovery_status": {                                 // [NEW] ver seccion C para el detalle narrativo
    "NUTRILONGX_NUTRIENT_THRESHOLDS_v1_0": { "status": "REFERENCED_NOT_RECOVERED", "referenced_by_recipe_count": 58, "first_seen_in": "frozen_specs + validation.nutrient_threshold_version" },
    "NUTRILONGX_CLINICAL_PROFILES_v1_0":   { "status": "REFERENCED_NOT_RECOVERED", "referenced_by_recipe_count": 58, "first_seen_in": "frozen_specs + validation.clinical_profiles_version" },
    "NUTRILONGX_CLINICAL_RULES_v1_0":      { "status": "REFERENCED_NOT_RECOVERED", "referenced_by_recipe_count": 58, "first_seen_in": "recipes[].clinical_profiles.<profile>.rule_set_version (NO declarada en frozen_specs)" },
    "NUTRILONGX_Motor_Recetas_v1_1_xlsx":  { "status": "REFERENCED_NOT_RECOVERED", "referenced_by_recipe_count": 58, "first_seen_in": "generated_from" }
  },

  "recipes": [                                               // [VERBATIM + NEW envelope] 58 entradas
    {
      // --- Campos legacy, preservados exactamente como en v1.7 ---
      "recipe_id": "NLX-001",                                 // [VERBATIM]
      "recipe_version": "1.1",                                // [VERBATIM]
      "title": "...", "meal_type": "...", "objective_legacy": "...",
      "prep_time_min": null, "difficulty": "...", "servings": null,
      "portion_grams": null, "season": null,
      "ingredients_text": "...", "preparation_text": "...",
      "client_version": "...", "substitutions": null,
      "nutrition": {                                           // [VERBATIM]
        "per_serving": { "kcal": null, "...": null },
        "derived": {},
        "data_complete_core_v1": false,
        "composition_status_note": "COMPOSITION_UNKNOWN"        // [NEW] explicito, nunca 0 ni estimado
      },
      "dietary_restrictions": { "gluten_free_legacy": null, "lactose_free_legacy": null },  // [VERBATIM]
      "public_tags": { "culinary_and_dietary": [], "nutrition_claims_eu": [] },             // [VERBATIM]
      "ingredient_and_rule_tags": [],                          // [VERBATIM]
      "publication": { "...": "..." },                         // [VERBATIM]
      "validation": { "...": "..." },                          // [VERBATIM]
      "legacy_clinical_flags": { "...": "..." },                // [VERBATIM] — 6 flags heredados pre-v1.1

      // --- Bloques piloto v1.2-v1.6, presentes SOLO en NLX-001..008, preservados tal cual si existen ---
      "ingredients_structured_v1_2": [ "..." ],                 // [VERBATIM, opcional]
      "composition_calculation": { "...": "..." },              // [VERBATIM, opcional]
      "ingredients_normalized_v1_3": [ "..." ],                 // [VERBATIM, opcional]
      "ingredient_normalization_review": { "...": "..." },      // [VERBATIM, opcional]
      "composition_matching_v1_4": { "...": "..." },            // [VERBATIM, opcional]
      "ingredients_canonical_v1_6": [ "..." ],                  // [VERBATIM, opcional]
      "shopping_and_sourcing_v1_6": { "...": "..." },           // [VERBATIM, opcional]
      "pilot_review_v1_1": { "...": "..." },                    // [VERBATIM, opcional]
      "historical_internal_audit": { "...": "..." },            // [VERBATIM, opcional, solo 5 recetas]

      // --- Nuevos bloques de la canonizacion de Alimentacion ---
      "recipe_maturity": {                                      // [NEW]
        "status": "ACTIVE_READY | PARTIAL | INCOMPLETE",
        "criteria_met": {
          "has_ingredients": true, "has_preparation": true, "has_servings": true,
          "core_nutrition_complete": true, "clinical_profiles_structurally_complete": true
        },
        "ruleset_version": "MATURITY_RULESET_v1.0",
        "evaluated_at": "<fecha ISO>"
      },

      "allergens_legacy": [ "CONTIENE: PESCADO | Ninguno" ],    // [NEW envelope, VERBATIM content] copia intacta de recipes[].allergens original
      "allergens_normalized": {                                 // [NEW]
        "contains": [ { "allergen": "PESCADO", "raw_source": "CONTIENE: PESCADO | Ninguno" } ],
        "traces": [],
        "qualifiers": [],
        "status": "DECLARED | NONE_DECLARED | NOT_ASSESSED | AMBIGUOUS",
        "review_flags": []
      },

      "observed_legacy_clinical_outputs": {                     // [NEW envelope, VERBATIM content = antiguo "clinical_profiles"]
        "HTA": { "eligibility": "...", "fit": "...", "reason_codes": [], "rule_set_version": "NUTRILONGX_CLINICAL_RULES_v1.0" },
        "...": "... (14 perfiles)",
        "_meta": {
          "is_derived_rule": false,                             // [NEW] flag explicito: esto es un OUTPUT observado, no una regla
          "note": "Preservado tal cual de la fuente legacy. NO reconstruido ni verificado contra el motor de reglas original (no recuperado)."
        }
      },

      "provenance": {                                            // [VERBATIM] + [NEW] campos de canonizacion
        "source_workbook": "...", "source_sheet": "...", "source_inspiration": null,
        "source_internal_url": null, "last_review": "...", "safety_test": null, "correction_ids": [],
        "canonization": {                                        // [NEW]
          "canonized_at": "<fecha ISO>",
          "canonized_from": ["NUTRILONGX_RECIPES_MASTER_v1.7_BATCH_AND_COMPOSITION_GAPS.json"],
          "transformations_applied": ["recipe_maturity classification", "allergens_normalized derivation", "gamification_bindings crosswalk"]
        }
      },

      "gamification_bindings": [                                 // [NEW]
        {
          "canonical_action_id": "adherence.nutrition.lista_de_la_compra_mediterranea",
          "canonical_catalog_version": "NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1 (FROZEN)",
          "binding_type": "supports | candidate | contextual_opposite | unmapped | direct",
          "status": "confirmed | candidate | unmapped",
          "evidence_tag": "MEDITERRANEAN_PATTERN",
          "notes": null
        }
      ]
    }
  ],

  "nutritional_rules_reference": {                              // [REF] solo referencia, sin contenido inventado
    "rule_set_name": "NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0",
    "related_rule_engine": "NUTRILONGX_CLINICAL_RULES_v1.0",
    "status": "REFERENCED_NOT_RECOVERED",
    "rules": [],                                                 // vacio a proposito — no inventar thresholds
    "known_reference_values_context_only": {                     // [VERBATIM, de composition_policy_v1_0, NO son umbrales clinicos]
      "potassium_healthy_adult_ai_mg_day": 3500,
      "phosphorus_healthy_adult_ai_mg_day": 550,
      "note": "Valores de ingesta adecuada poblacional EFSA citados en composition_policy_v1_0. Explicitamente NO son umbrales clinicos automaticos (ej. para ERC)."
    },
    "note": "Contenido real no recuperado. No reconstruido desde reason_codes observados (prohibido por Decision 5)."
  },

  "clinical_profiles_reference": {                               // [REF]
    "profiles": [
      { "profile_id": "HTA", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "DM2", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "DYSLIPIDEMIA", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "OBESITY", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "HF", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "HYPERURICEMIA_GOUT", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "CKD_MILD", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "CKD_MODERATE", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "CKD_ADVANCED", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "MENOPAUSE", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "PREGNANCY", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "OLDER_ADULT", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "ONCOLOGY", "status": "REFERENCED_NOT_RECOVERED" },
      { "profile_id": "IMMUNOSUPPRESSION", "status": "REFERENCED_NOT_RECOVERED" }
    ],
    "included_tags": null, "excluded_tags": null, "caution_tags": null,  // explicitamente null, nunca sintetizados
    "version_reference": "NUTRILONGX_CLINICAL_PROFILES_v1.0",
    "note": "Solo se listan los 14 nombres (frozen_specs.clinical_profiles_list). Definicion real no recuperada. Ver recipes[].observed_legacy_clinical_outputs para resultados ya aplicados por receta."
  },

  "binding_semantics_reference": {                               // [NEW] glosario formal, ver seccion B.3
    "version": "BINDING_SEMANTICS_v1.0",
    "types": ["supports", "candidate", "contextual_opposite", "unmapped", "direct"],
    "direct_usage_note": "Reservado. No usado en ninguna de las 58 recetas actuales."
  },

  "review_flags_registry": {                                     // [NEW] glosario de codigos usados inline en recipes[]
    "RECIPE_STRUCTURE_INCOMPLETE": "Faltan ingredientes, pasos o servings (heredado de v1.7).",
    "CORE_NUTRITION_DATA_INCOMPLETE": "Nutricion core sin completar (heredado de v1.7).",
    "AMBIGUOUS_NOT_EU14_ALLERGEN": "Token en allergens_legacy que no corresponde a un alergeno EU-14 reconocido (ej. ACEITE DE OLIVA).",
    "INSTRUCTIONAL_NOTE_NOT_STRUCTURED": "Texto en allergens_legacy que es una instruccion condicional, no una declaracion de alergeno.",
    "MULTI_FORMAT_ARRAY": "El array allergens_legacy mezcla mas de un formato en la misma receta (ej. NLX-058).",
    "BINDING_VALENCE_INVERTED": "Tag de receta describe presencia de algo que la accion premia reducir (ver contextual_opposite)."
  },

  "educational_content": { "status": "NO_SOURCE_PROVIDED", "items": [] },  // [NEW] vacio, sin fuente
  "habits_microhabits":  { "status": "NO_SOURCE_PROVIDED", "items": [] },  // [NEW] vacio, sin fuente
  "challenges":          { "status": "NO_SOURCE_PROVIDED", "items": [] },  // [NEW] vacio, sin fuente
  "media":               { "status": "NO_SOURCE_PROVIDED", "items": [] }, // [NEW] vacio, sin fuente

  "disclaimer": "Los DVG y creditos educativos asociados a estas recetas, cuando existan via gamification_bindings, son creditos educativos inspirados en evidencia poblacional y no predicen individualmente la esperanza de vida. Las etiquetas de elegibilidad clinica (observed_legacy_clinical_outputs) son metadatos de personalizacion/seguridad internos, no un diagnostico ni una recomendacion medica individual.",

  "provenance": {                                                 // [NEW] provenance de documento completo
    "generated_at": "<fecha ISO>",
    "generator": "auditoria manual asistida — ver audit_reports_referenced",
    "recipe_count_in": 58,
    "recipe_count_out": 58,
    "information_loss": "NONE_EXPECTED — todo campo legacy se preserva verbatim; los campos NEW son aditivos"
  }
}
```

---

## B. NORMALIZATION RULESET

### B.1 — Reglas de `recipe_maturity` (congeladas, Decisión 1)

```
INCOMPLETE   si  ingredients_text vacío/nulo  O  preparation_text vacío/nulo  O  servings == null
ACTIVE_READY si  NOT INCOMPLETE
             Y  nutrition.data_complete_core_v1 == true
             Y  observed_legacy_clinical_outputs poblado para los 14 profile_id (estructuralmente)
PARTIAL      si  NOT INCOMPLETE  Y  NOT ACTIVE_READY   (caso restante)
```
Evaluación puramente estructural, sin excepción manual. Resultado congelado sobre las 58 recetas actuales: 8 `ACTIVE_READY` (`NLX-001`–`008`), 43 `PARTIAL`, 7 `INCOMPLETE` (`NLX-015/016/018/020/032/045/051`). Si una futura actualización de fuente cambia algún campo de entrada, la clasificación se recalcula con esta misma fórmula, nunca a mano.

### B.2 — Reglas de `allergens_normalized` (congeladas, Decisión 2)

Aplicadas sobre `allergens_legacy` (nunca sobre datos re-derivados), en este orden:

1. `allergens_legacy == []` → `status = NOT_ASSESSED`, `contains = []`, `traces = []`. Nunca `NONE_DECLARED`.
2. Cada string se prueba contra los patrones, en orden, deteniéndose en el primer match:
   a. `^CONTIENE:\s*(.+?)\s*\|\s*TRAZAS:\s*(.+)$` → `contains += parse_list(g1)`, `traces += parse_list(g2)`.
   b. `^CONTIENE:\s*(.+?)\s*\|\s*(.+)$` → `contains += parse_list(g1)`; si `g2` normaliza a "ninguno" → no se añade nada a `traces` (queda sin declarar, no se asume `[]` con significado); si `g2` no es "ninguno" ni reconocible → `review_flags += ["AMBIGUOUS"]` y se conserva el string íntegro sin parsear en un campo `unparsed`.
   c. `^CONTIENE:\s*(.+)$` (sin pipe) → `contains += parse_list(g1)`, `traces` no declarado.
   d. `^([A-ZÁÉÍÓÚÑ_]+)\s*\|\s*(.+)$` (nombre suelto + pipe, sin prefijo `CONTIENE:`) → si `g1` ∈ vocabulario EU-14 reconocido, tratar como (c); si `g1` NO ∈ EU-14 (p. ej. `ACEITE DE OLIVA`) → NO normalizar, `status = AMBIGUOUS`, `review_flags += ["AMBIGUOUS_NOT_EU14_ALLERGEN"]`, se conserva íntegro en `allergens_legacy` sin generar entrada en `contains`.
   e. Nombre simple, con o sin paréntesis (`SESAMO`, `SESAMO (tahini)`, `APIO (trazas posibles)`) → extraer nombre base a `contains`; el contenido del paréntesis pasa literal a `qualifiers` (nunca se descarta); si el paréntesis contiene la subcadena "traza" → además se referencia en `traces` apuntando al mismo alérgeno con el qualifier asociado, pero el string original permanece intacto en `qualifiers`.
   f. Texto que no matchea ningún patrón anterior y tiene forma de instrucción condicional (contiene verbos como "verificar", "puede contener", o no está en mayúsculas como los demás) → NO se convierte en `contains`; se guarda literal en un campo `conditional_notes[]`, con `review_flags += ["INSTRUCTIONAL_NOTE_NOT_STRUCTURED"]`.
3. `NINGUNO`/`Ninguno` (cualquier capitalización) en posición de "contiene" y de "trazas" simultáneamente (`CONTIENE: Ninguno | TRAZAS: Ninguno`) → `status = NONE_DECLARED`, `contains = []`, `traces = []`. Este es el ÚNICO camino hacia `NONE_DECLARED` — nunca se llega ahí desde una lista vacía (regla 1).
4. Si el array original mezcla más de un formato en la misma receta (caso `NLX-058`) → se procesan todas las entradas independientemente y se añade `review_flags += ["MULTI_FORMAT_ARRAY"]` a nivel de receta.
5. `status` final por receta: `AMBIGUOUS` si algún elemento cayó en 2b/2d; si no, `NONE_DECLARED` si aplica 3; si no, `NOT_ASSESSED` si aplica 1; si no, `DECLARED`.

`allergens_legacy` nunca se reescribe ni se elimina ningún string original — `allergens_normalized` es siempre un campo derivado adicional.

### B.3 — Reglas de `binding_semantics` (congeladas, Decisión 3)

| binding_type | Cuándo se asigna | Genera DVG | Se muestra como recomendación positiva |
|---|---|---|---|
| `supports` | El `evidence_tag` de la receta (`ingredient_and_rule_tags` o `public_tags.culinary_and_dietary`) describe directamente el mismo comportamiento que la acción canónica premia, sin ambigüedad de alcance. | No (nunca, en ningún tipo — el DVG lo genera `action_logs` sobre la acción real, no el binding) | Sí, como explicación/navegación |
| `candidate` | Relación plausible pero el tag es más amplio que la acción, o falta un dato estructurado más fino para confirmar sin ambigüedad (ej. `FISH_OR_SEAFOOD` vs. pescado azul específico). | No | No — no se considera binding confirmado |
| `contextual_opposite` | La receta contiene/representa precisamente lo que la acción premia reducir o evitar (ej. `RED_MEAT` → acción de reducir carne roja; `ADDED_SUGAR` → acción de reducir azúcar añadido). | No | No — nunca como recomendación positiva; reservado para advertencia contextual o sugerencia de sustitución futura |
| `unmapped` | No existe ninguna acción `nutrition`/`adherence.nutrition` razonablemente relacionada. | No | No aplica |
| `direct` | Reservado. Requeriría que una acción canónica se redefiniera como "prepara esta receta concreta" — no ocurre en las 58 recetas actuales. | No usado | No usado |

Crosswalk tag→acción (el mismo de la Fase 1, con los tipos ya reclasificados tras esta aprobación):

| Tag | canonical_action_id | binding_type |
|---|---|---|
| `MEDITERRANEAN_PATTERN` | `adherence.nutrition.lista_de_la_compra_mediterranea`, `nutrition.mediterranean_pattern.legumbres_veces_sem` | `supports` |
| `LEGUME_RICH` | `nutrition.mediterranean_pattern.anade_racion_de_legumbre_en_ensalada`, `...legumbres_racion_es` | `supports` |
| `WHOLE_GRAIN_OR_HIGH_FIBER_STARCH` | `nutrition.mediterranean_pattern.pan_integral_en_comidas`, `...incluye_cereal_integral_distinto_avena_q`, `adherence.nutrition.compra_integral_pan_arroz_pasta_integral` | `supports` |
| `MEAL_PREP` | `adherence.nutrition.batch_cooking_saludable_h_sem` | `supports` |
| `FISH_OR_SEAFOOD` | `nutrition.mediterranean_pattern.pescado_azul_vez_sem` | `candidate` (requiere identificación estructurada de especie/omega-3 para pasar a `supports`) |
| `RED_MEAT` | `nutrition.processed_reduction.carne_roja_g` | `contextual_opposite` |
| `ADDED_SUGAR` | `nutrition.processed_reduction.reduce_dulces_industriales_a_hoy` | `contextual_opposite` |
| resto de tags (`EASY`, `QUICK`, `HIGH_PROTEIN_EU`, `LOW_SODIUM_EU`, …) | — | `unmapped` |

### B.4 — Reglas de `provenance` (congeladas, Decisión 5 + práctica ya usada en CANONICAL v1.0)

1. Todo campo `[VERBATIM]` conserva su valor original sin transformación; su provenance es implícita (viene del documento fuente citado en `source_lineage`).
2. Todo campo `[NEW]` (madurez, alérgenos normalizados, bindings) lleva su propio `ruleset_version`/`canonical_catalog_version` para poder reproducir el cálculo exacto que lo generó.
3. `observed_legacy_clinical_outputs[].{_meta.is_derived_rule}` se fija siempre en `false` — ningún resultado clínico de receta se trata jamás como si fuera la regla que lo produjo (Decisión 5).
4. Ninguna transformación puede perder un `recipe_id`, `legacy_id`, o string original de `allergens_legacy` — mismo principio de cero pérdida de información aplicado en `CANONICAL v1.0`.
5. Cualquier campo cuyo valor de origen sea `null` se mantiene `null` explícito (o el estado dedicado `NOT_ASSESSED`/`COMPOSITION_UNKNOWN`); nunca se sustituye por `0`, cadena vacía con significado distinto, ni valor estimado (Decisión 6).

---

## C. RECOVERY STATUS

| Spec | Estado | Detalle |
|---|---|---|
| `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0` | **`referenced_not_recovered`** | No se ha recibido ningún fichero nuevo desde la Fase 1B. Sigue citada 58 veces por nombre/versión, sin contenido. |
| `NUTRILONGX_CLINICAL_PROFILES_v1.0` | **`referenced_not_recovered`** | Igual. Solo tenemos los 14 nombres de `frozen_specs.clinical_profiles_list`, no su definición. |
| `NUTRILONGX_CLINICAL_RULES_v1.0` | **`referenced_not_recovered`** | Igual, con el matiz ya señalado en Fase 1B: no aparece declarada en `frozen_specs`, solo en `recipes[].clinical_profiles.*.rule_set_version` y `validation.clinical_rule_version` — sigue sin aclararse si es un documento independiente o una fusión de los otros dos. |
| `NUTRILONGX_Motor_Recetas_v1_1.xlsx` | **`referenced_not_recovered`** | No recibido. Sigue siendo el candidato más prometedor por precedente (en la canonización de gamificación, las reglas del motor vivían en hojas de Excel no exportadas al JSON). |

Ningún caso es `contradictory` (no hay dos fuentes en conflicto, porque no hay una segunda fuente) ni `superseded` (no hay una versión más nueva que reemplace a estas). No se declara ninguna como definitivamente inexistente — quedan abiertas para la sección "RECOVERY FINAL" si aportas nuevos documentos.

---

## D. BUILD READINESS

**`READY_FOR_MASTER_BUILD_WITH_REFERENCED_NOT_RECOVERED_SPECS`**

El esquema de la sección A y el ruleset de la sección B son suficientes para construir `NUTRILONGX_ALIMENTACION_MASTER_v1.json` de forma completa y honesta sobre lo que sí tenemos (58 recetas con su madurez, alérgenos legacy+normalizados, tags, bindings de gamificación con semántica de 5 tipos, y las tres specs clínicas correctamente marcadas `referenced_not_recovered` en vez de mal etiquetadas como definitivamente ausentes). No hay ningún conflicto de severidad alta pendiente de decisión humana en este esquema.

Conforme a tu instrucción explícita, **no genero el artefacto en este turno**: queda preparado y a la espera de que confirmes si aportas nuevos documentos de la checklist (Excel origen, thresholds, reglas, matriz de perfiles, diccionario de tags) para una última auditoría de recovery, o si prefieres que proceda directamente a construir con el estado `REFERENCED_NOT_RECOVERED` tal como está.
