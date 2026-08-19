# NUTRILONGX — Alimentación Master v1: Build Report

Fecha de generación: 2026-08-18. `CANONICAL v1.0` (actions catalog, engine, legacy mapping) permanece `FROZEN`, no se ha tocado en ningún momento de esta construcción. Sin SQL, sin cambios en Supabase/GitHub/Vercel/código.

**`BUILD_STATUS: VALID_WITH_REFERENCED_NOT_RECOVERED_SPECS`**

---

## A. SOURCES

| Fuente | Rol | Estado |
|---|---|---|
| `NUTRILONGX_RECIPES_MASTER_v1.7_BATCH_AND_COMPOSITION_GAPS.json` | `CANONICAL_BASE` | Usada íntegra — 58 recetas |
| `NUTRILONGX_RECIPES_MASTER_v1.6_RETAIL_AGNOSTIC.json` | `PROVENANCE_COMPARATOR` | No reconciliada de nuevo (ya demostrado en Fase 1 que las 58 recetas son idénticas byte a byte) |
| `NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json` | Motor de bindings de gamificación | `FROZEN_READ_ONLY` — leído, nunca escrito |
| `NUTRILONGX_ALIMENTACION_MASTER_AUDIT_PHASE1_v1.md` | Auditoría de fuentes | Referenciado |
| `NUTRILONGX_ALIMENTACION_FASE1B_PREP_v1.md` | Recovery checklist, maturity, alérgenos, bindings | Referenciado |
| `NUTRILONGX_ALIMENTACION_MASTER_SCHEMA_v1.md` | Esquema y ruleset aprobados | Referenciado, aplicado exactamente |

---

## B. COUNTS

- **Recetas**: 58 in → 58 out.
- **Madurez**: `ACTIVE_READY` 8 (`NLX-001`–`NLX-008`) · `PARTIAL` 43 · `INCOMPLETE` 7 (`NLX-015`, `NLX-016`, `NLX-018`, `NLX-020`, `NLX-032`, `NLX-045`, `NLX-051`).
- **Estado de alérgenos** (`allergens_normalized.status`): `DECLARED` 30 · `NOT_ASSESSED` 23 (las 23 recetas con `allergens_legacy: []`, ninguna reinterpretada como `NONE_DECLARED`) · `NONE_DECLARED` 3 (únicamente las que declaran explícitamente `CONTIENE: Ninguno | TRAZAS: Ninguno` en cualquier capitalización) · `AMBIGUOUS` 2 (`NLX-058` por el token `ACEITE DE OLIVA | Ninguno`, y la receta con la nota condicional `Verificar caldo de verduras...`).
- **Bindings de gamificación por tipo**: `supports` 186 · `candidate` 18 · `contextual_opposite` 3 · `direct` 0. (`unmapped` no se materializa como binding — ver sección E para el conteo de instancias tag→sin-acción).
- **Review flags** (conteo de apariciones, agregando flags heredados de `validation.warnings` + flags de alérgenos): `CLINICAL_VALIDATION_PENDING` 56 · `NUTRITION_VALIDATION_PENDING` 56 · `CORE_NUTRITION_DATA_INCOMPLETE` 50 · `SAFETY_TEST_NOT_AVAILABLE` 50 · `RECIPE_STRUCTURE_INCOMPLETE` 7 · `MULTI_FORMAT_ARRAY` 6 · `AMBIGUOUS_NOT_EU14_ALLERGEN` 1 · `INSTRUCTIONAL_NOTE_NOT_STRUCTURED` 1 · `CANONICAL_NLX005_NOT_GLUTEN_FREE` 1 (flag específico ya presente en la fuente v1.7 para `NLX-005`, preservado tal cual — no generado por esta construcción).

---

## C. CLINICAL RECOVERY STATUS

Las cuatro fuentes siguen sin recuperarse, con el matiz explícito que pediste:

| Spec | Estado | Nota |
|---|---|---|
| `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0` | `REFERENCED_NOT_RECOVERED` | referenced in provenance, not currently recovered |
| `NUTRILONGX_CLINICAL_PROFILES_v1.0` | `REFERENCED_NOT_RECOVERED` | referenced in provenance, not currently recovered |
| `NUTRILONGX_CLINICAL_RULES_v1.0` | `REFERENCED_NOT_RECOVERED` | referenced in provenance, not currently recovered |
| `NUTRILONGX_Motor_Recetas_v1_1.xlsx` | `REFERENCED_NOT_RECOVERED` | referenced in provenance, not currently recovered |

Ninguna se declara inexistente. Si aparecen en el futuro, se incorporarán en una versión posterior mediante auditoría explícita — nunca sobrescribiendo v1 en silencio, tal como se acordó.

---

## D. INFORMATION PRESERVATION

- **Recipe IDs**: los 58 `NLX-001`–`NLX-058` presentes exactamente una vez, sin huecos ni duplicados (QA1, QA2).
- **Campos legacy**: los 21 campos base (`title`, `meal_type`, `objective_legacy`, `prep_time_min`, `difficulty`, `servings`, `portion_grams`, `season`, `ingredients_text`, `preparation_text`, `client_version`, `substitutions`, `nutrition`, `dietary_restrictions`, `public_tags`, `ingredient_and_rule_tags`, `legacy_clinical_flags`, `publication`, `validation`) copiados verbatim en las 58 recetas; los 9 bloques piloto (`ingredients_structured_v1_2` → `historical_internal_audit`) copiados verbatim cuando existían en origen (solo `NLX-001`–`NLX-008`).
- **Nulls**: verificado programáticamente que ningún `null` de `nutrition.per_serving` se convirtió en `0` (QA6) — comparación campo a campo contra la fuente original.
- **`allergens_legacy`**: idéntico byte a byte al array `allergens` original de v1.7 en las 58 recetas (QA9).
- **`observed_legacy_clinical_outputs`**: contenido (`eligibility`, `fit`, `reason_codes`, `rule_set_version`) idéntico al antiguo `clinical_profiles` en las 58 recetas para los 14 perfiles (QA8); solo se añadió el objeto `_meta.is_derived_rule: false` como aclaración, sin tocar ningún valor.
- **`recipe_count_in == recipe_count_out == 58`**, **`information_loss: "NONE_EXPECTED"`** declarado en `provenance` del documento.

---

## E. BINDINGS

**Conteo por tipo**: `supports` 186 · `candidate` 18 · `contextual_opposite` 3 · `direct` 0.

**Acciones canónicas cubiertas**: 11 de las 37 acciones `nutrition` + `adherence.nutrition` del catálogo frozen tienen al menos un binding (mismo resultado que el crosswalk preliminar de Fase 1, ahora materializado en el master con los tipos ya reclasificados).

**Acciones canónicas NO cubiertas** (26): principalmente en `nutrition.mediterranean_pattern.*` (AOVE, frutos secos, semillas, fruta entera, verduras, verduras de hoja, lácteos naturales), `nutrition.meal_planning.*` (desayuno, plato-método, planificación semanal, cocina en casa, registro fotográfico), `nutrition.processed_reduction.*` (agua fuera de casa, embutido→hummus, postre saludable, carne procesada, UPF, salsa casera, refresco→agua, snack de fruta), `nutrition.hydration.agua_l_dia`, y 4 de `adherence.nutrition` (paseo postcomida, fruta visible, recordatorio de agua, snack saludable). No se ha forzado ningún candidato adicional para cubrirlas — coherente con "no forzar cobertura 100%".

**Tags de receta sin ninguna acción relacionada** (`unmapped`, 306 instancias tag×receta): `MEDITERRANEAN` (50), `GLUTEN_FREE` (49), `LACTOSE_FREE` (48), `EASY` (46), `QUICK` (38), `PLANT_FORWARD` (21), `VEGETARIAN` (20), `LEAN_MEAT_BASED` (19), `VEGAN` (8), `HIGH_PURINE_ANIMAL_SOURCE` (4), `MODERATE_PURINE_LOAD` (3) — son tags culinarios/de dificultad o de perfil clínico sin correspondencia en el catálogo de acciones de gamificación, no un error de mapeo.

`RED_MEAT` (2 recetas) y `ADDED_SUGAR` (1 receta) generan exclusivamente bindings `contextual_opposite` hacia sus acciones de reducción correspondientes — verificado que ninguno de los dos aparece jamás como `supports` (QA11).

---

## F. QA — resultado de las 20 validaciones obligatorias

| # | Validación | Resultado |
|---|---|---|
| 1 | Exactamente 58 recetas | ✅ PASS |
| 2 | `NLX-001`..`NLX-058` todos y solo una vez | ✅ PASS |
| 3 | 8 `ACTIVE_READY` | ✅ PASS |
| 4 | 43 `PARTIAL` | ✅ PASS |
| 5 | 7 `INCOMPLETE`, IDs exactos | ✅ PASS |
| 6 | Ningún null nutricional convertido a 0 | ✅ PASS |
| 7 | Tags legacy preservados en las 58 | ✅ PASS |
| 8 | Clinical outputs legacy preservados en las 58 | ✅ PASS |
| 9 | `allergens_legacy` idéntico a la fuente | ✅ PASS |
| 10 | Ninguna lista vacía de alérgenos como `NONE_DECLARED` | ✅ PASS |
| 11 | Ningún `contextual_opposite` como recomendación positiva / como `supports` | ✅ PASS |
| 12 | Ningún binding genera DVG | ✅ PASS |
| 13 | `direct` con count = 0 | ✅ PASS |
| 14 | Las 4 specs siguen `REFERENCED_NOT_RECOVERED` | ✅ PASS |
| 15 | `nutritional_rules_reference.rules` vacío | ✅ PASS |
| 16 | Ningún perfil clínico con definición inventada | ✅ PASS |
| 17 | `educational_content`/`habits_microhabits`/`challenges`/`media` vacíos | ✅ PASS |
| 18 | Provenance suficiente para reproducir cada transformación | ✅ PASS |
| 19 | `recipe_count_in == recipe_count_out == 58` | ✅ PASS |
| 20 | `information_loss == NONE` | ✅ PASS |

**20/20 validaciones superadas. Build declarado válido.**

---

## Resumen final

```
BUILD_STATUS: VALID_WITH_REFERENCED_NOT_RECOVERED_SPECS
```

`NUTRILONGX_ALIMENTACION_MASTER_v1.json` queda construido sobre las 58 recetas de `v1.7` (base canónica), con `v1.6` documentado exclusivamente como comparador de provenance, aplicando exactamente `MATURITY_RULESET_v1.0`, `ALLERGEN_RULESET_v1.0` y `BINDING_SEMANTICS_v1.0` tal como se congelaron en la Fase 1B, sin reconstruir ninguna regla clínica, sin estimar ningún nutriente ausente, y sin generar contenido para las secciones sin fuente. `CANONICAL v1.0` permanece intacto.
