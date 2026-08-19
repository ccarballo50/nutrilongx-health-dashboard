# NUTRILONGX — Alimentación, Fase 1B: Recovery Checklist, Maturity Model, Allergen Proposal, Binding Semantics, Build Plan

Fecha: 2026-08-18. Continuación de `NUTRILONGX_ALIMENTACION_MASTER_AUDIT_PHASE1_v1.md` (aprobado). Ningún artefacto `CANONICAL v1.0` tocado. No se genera `NUTRILONGX_ALIMENTACION_MASTER_v1.json` en este documento. No se ha hecho investigación clínica externa ni se ha reconstruido ninguna regla a partir de los outputs de las recetas — donde falta información, se deja marcada como ausente.

---

## A. FASE 1B RECOVERY CHECKLIST

Documentos que necesito, por orden de impacto en el master. Si alguno no existe o no se puede recuperar, dímelo explícitamente para cada uno — lo trataré como "confirmado ausente" (distinto de "todavía no buscado") y pasaré a la rama B del plan de la sección E.

**Prioridad 1 — bloquean `nutritional_rules` y `clinical_profile_mapping`:**
1. `NUTRILONGX_NUTRIENT_THRESHOLDS_v1.0` — el fichero de umbrales en sí (nutriente objetivo, operador, valor de corte, unidad, tag resultante). Es el más citado (en `frozen_specs` y en `validation.nutrient_threshold_version` de las 58 recetas) y el que más valor añade: sin él no puedo verificar si p. ej. `LOW_SODIUM_EU` en `NLX-001` (280 mg/ración) es matemáticamente correcto o solo una etiqueta heredada.
2. `NUTRILONGX_CLINICAL_PROFILES_v1.0` — la definición de los 14 perfiles (`HTA`, `DM2`, `DYSLIPIDEMIA`, `OBESITY`, `HF`, `HYPERURICEMIA_GOUT`, `CKD_MILD/MODERATE/ADVANCED`, `MENOPAUSE`, `PREGNANCY`, `OLDER_ADULT`, `ONCOLOGY`, `IMMUNOSUPPRESSION`): qué tags/nutrientes incluye, excluye o pone en precaución cada uno. Hoy solo tengo la lista de nombres y los resultados ya aplicados por receta, no la definición.
3. `NUTRILONGX_CLINICAL_RULES_v1.0` — el motor de reglas que combina umbrales + perfiles y produce `eligibility`/`fit`/`reason_codes`. Referenciado en cada receta (`rule_set_version`) pero no declarado siquiera en `frozen_specs` — posible indicio de que es un documento separado de los dos anteriores, o una versión previa fusionada con ellos. Necesito confirmar cuál de las dos.

**Prioridad 2 — enriquecen sin bloquear:**
4. Matriz/tabla de los 14 perfiles clínicos en formato tabular (si existe como Excel/CSV separado del JSON de reglas) — útil como provenance cruzada aunque ya tengamos el JSON de reglas.
5. Diccionario de tags — la lista canónica y definición de cada tag usado (`public_tags.culinary_and_dietary`, `nutrition_claims_eu`, `ingredient_and_rule_tags`, `reason_codes`), con su criterio de asignación. Hoy solo tengo el vocabulario *observado* (lo que aparece usado), no una definición autorizada de qué significa cada uno ni si hay tags definidos-pero-nunca-usados.
6. JSON maestro previo de recetas con todos sus tags, si existe una versión anterior a v1.6 con más cobertura de composición (p. ej. si en algún momento se calcularon `saturated_fat_g`/`potassium_mg`/`phosphorus_mg` para más de la receta `NLX-006` y esos valores se perdieron en la consolidación a v1.6/v1.7).
7. `NUTRILONGX_Motor_Recetas_v1_1.xlsx` — el Excel origen declarado en `generated_from` de ambos JSON. Si lo tienes, permitiría confirmar si hay hojas de reglas/perfiles/tags en el propio libro (como pasó con `NUTRILONGX_creditos_v3.xlsx` y sus hojas `Engine_*` en la canonización de gamificación) que no llegaron al JSON exportado.

**Prioridad 3 — contexto/provenance, no bloqueante:**
8. Cualquier documento intermedio (notas de trabajo, actas de validación, correos o docs de decisión) que explique por qué solo 8 de 58 recetas llegaron a composición completa y solo 1 (`NLX-006`) a los tres nutrientes difíciles — ayudaría a fechar y justificar el estado `PENDING_EXACT_DATABASE_JOIN` que declara la propia fuente.

Para cada documento que me proporciones, aplicaré exactamente el proceso que pides: nombre exacto, versión, status, estructura, nº de reglas/perfiles/tags/thresholds, provenance, y coherencia contra los `reason_codes` y resultados ya presentes en las 58 recetas — sin cambiar ninguna regla ni completar huecos por conocimiento clínico propio.

---

## B. MATURITY MODEL

Este eje es ortogonal a `eligibility` (`APTO`/`APTO_CON_AJUSTE`/`PRECAUCION`/`NO_APTO`/`NO_EVALUADO`), que mide seguridad/idoneidad clínica por perfil. El eje de madurez mide **si la receta, como registro de datos, tiene lo mínimo para funcionar en la app** — son preguntas distintas y una receta `INCOMPLETE` no implica nada sobre si sería `APTO` o `NO_APTO` para un perfil, simplemente no lo sabemos ni podemos mostrarla bien.

### Criterios propuestos (objetivos, verificables campo a campo, sin juicio subjetivo)

**`INCOMPLETE`** — falta al menos uno de los tres elementos esenciales:
`ingredients_text` vacío/ausente, **o** `preparation_text` vacío/ausente, **o** `servings` es `null`.
→ La receta no se puede mostrar ni preparar tal cual; no es publicable en ningún nivel.

**`ACTIVE_READY`** — cumple TODOS estos requisitos simultáneamente:
1. No cumple ningún criterio de `INCOMPLETE` (tiene ingredientes, pasos y servings).
2. `nutrition.per_serving` tiene los 6 campos "core" completos (`kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sodium_mg`) — en la práctica, `nutrition.data_complete_core_v1 == true`, que es el flag que la propia fuente ya calcula con este mismo criterio.
3. Tiene objeto `clinical_profiles` poblado para los 14 perfiles (estructuralmente, aunque el resultado individual sea `NO_EVALUADO` en alguno).
→ Suficientemente estructurada para uso funcional (mostrar receta, calcular DVG/crédito nutricional si aplica, mostrar macros al cliente) **con los datos existentes**. Deliberadamente NO exijo aquí `saturated_fat_g`/`potassium_mg`/`phosphorus_mg` completos ni `master_v1_status == OK_CLIENTE_LEVEL_B`, porque eso bloquearía prácticamente todo el catálogo (solo 1 receta tiene los 3 nutrientes difíciles, solo 2 tienen validación de copy nivel B) y esos son requisitos de *pulido*, no de *funcionalidad mínima*. Si prefieres un listón más alto, dímelo y reclasifico.

**`PARTIAL`** — todo lo que no es `INCOMPLETE` ni `ACTIVE_READY`: tiene ingredientes/pasos/servings, pero le falta nutrición core completa (`data_complete_core_v1 == false`).
→ Utilizable como receta/contenido (se puede mostrar el texto, las instrucciones, los tags culinarios) pero no para nada que dependa de macros, alérgenos estructurados finos o elegibilidad clínica fiable.

### Clasificación resultante sobre las 58 recetas (aplicando estos criterios, sin excepciones manuales)

| Madurez | Nº recetas | IDs |
|---|---|---|
| `ACTIVE_READY` | **8** | `NLX-001` a `NLX-008` (el lote piloto) |
| `PARTIAL` | **43** | resto de recetas con estructura básica completa (`NLX-009`–`014`, `017`, `019`, `021`–`031`, `033`–`044`, `046`–`050`, `052`–`058`) |
| `INCOMPLETE` | **7** | `NLX-015`, `NLX-016`, `NLX-018`, `NLX-020`, `NLX-032`, `NLX-045`, `NLX-051` |

Total 8+43+7 = 58, sin solapamientos ni huecos. Nota: el 100% de `ACTIVE_READY` coincide exactamente con el lote piloto declarado en la propia fuente (`pilot_001_008_review.scope`), lo cual es una buena señal de que el criterio propuesto no está inventando una frontera arbitraria, sino recuperando una que ya existía implícitamente en los datos.

---

## C. ALLERGEN NORMALIZATION PROPOSAL (sin modificar datos)

### Vocabulario detectado
45 apariciones de alérgeno en 35/58 recetas (23 recetas tienen la lista vacía — ver más abajo); 23 strings distintos. Se agrupan en al menos **5 formatos heterogéneos** conviviendo en el mismo campo:

| Formato | Ejemplos | Nº apariciones |
|---|---|---|
| Nombre simple (mayúsculas, sin más) | `HUEVOS`, `LACTEOS`, `PESCADO`, `SESAMO` | 4 |
| Nombre + calificador entre paréntesis | `SESAMO (tahini)`, `SOJA (tamari)`, `FRUTOS_CASCARA (almendras)`, `GLUTEN (avena convencional — trazas)`, `LACTEOS (ghee — trazas si se usa)`, `APIO (trazas posibles en caldo)`, `APIO (trazas posibles)`, `APIO (alcaparras — trazas posibles)` | 8 |
| DSL `CONTIENE: X` (sin segundo campo) | `CONTIENE: PESCADO` | 1 |
| DSL `CONTIENE: X \| Ninguno` | `CONTIENE: PESCADO \| Ninguno`, `CONTIENE: HUEVO \| Ninguno`, `CONTIENE: SOJA \| Ninguno`, `CONTIENE: SULFITOS (en tomate triturado) \| Ninguno`, `CRUSTÁCEOS \| Ninguno` | 6 |
| DSL `CONTIENE: X \| TRAZAS: Y` | `CONTIENE: HUEVO \| TRAZAS: GLUTEN (opcional)` | 1 |
| DSL "todo negativo", con inconsistencia de mayúsculas | `CONTIENE: Ninguno \| TRAZAS: Ninguno` **vs** `CONTIENE: NINGUNO \| TRAZAS: NINGUNO` | 2 |
| Instrucción/nota, no un alérgeno en sí | `Verificar caldo de verduras (puede contener APIO)` | 1 |
| Caso anómalo — no es un alérgeno EU-14 | `ACEITE DE OLIVA \| Ninguno` (en `NLX-058`, conviviendo en el mismo array con `CONTIENE: PESCADO`) | 1 |

23/58 recetas tienen `allergens: []` (lista vacía) — **y las 23 son no-piloto**; ninguna de las 8 `ACTIVE_READY` tiene lista vacía. Esto es ambiguo por diseño: no puedo distinguir, sin una regla explícita, si vacío significa "confirmado sin alérgenos" o "todavía no evaluado" — son semánticamente muy distintas para un uso de seguridad alimentaria.

### Reglas de parsing propuestas (propuesta, no ejecutada)
1. Detectar y separar el patrón `CONTIENE: <A> | TRAZAS: <B>` → dos listas: `contains` y `traces`.
2. Detectar el patrón `CONTIENE: <A>` sin segundo campo → `contains = [A]`, `traces = []` (sin inventar que "no hay trazas"; queda `traces: null` = no declarado, distinto de `traces: []` = declarado y vacío).
3. Detectar el patrón `<A> | Ninguno` sin prefijo `CONTIENE:` (p. ej. `CRUSTÁCEOS | Ninguno`) → tratar como equivalente al caso 2 solo si `A` es un alérgeno EU-14 reconocido; si no (caso `ACEITE DE OLIVA`), NO normalizar automáticamente — marcar `AMBIGUOUS_NOT_EU14_ALLERGEN` y dejarlo para revisión manual.
4. Nombres simples o con paréntesis (`SESAMO (tahini)`, `APIO (trazas posibles)`) → extraer el nombre base como alérgeno y mover el contenido del paréntesis a un campo `qualifier` de texto libre, **sin** decidir automáticamente si el paréntesis implica "traza" o "contiene" (ambos aparecen redactados de forma distinta: "trazas posibles" vs "tamari" que es simplemente el ingrediente concreto que lo contiene) — regla de traza solo se aplicaría si el qualifier contiene literalmente la palabra "traza"/"trazas".
5. `Ninguno`/`NINGUNO` (2 variantes de mayúsculas) → normalizar a un único valor booleano/enum, p. ej. `NONE_DECLARED`.
6. Texto tipo instrucción (`Verificar caldo de verduras (puede contener APIO)`) → **no** convertir automáticamente en un alérgeno estructurado; es una instrucción condicional al ingrediente elegido, no una declaración. Marcar `INSTRUCTIONAL_NOTE_NOT_STRUCTURED`.
7. Lista vacía (`[]`) → **no** normalizar como `NONE_DECLARED` (eso sería inventar una afirmación de seguridad que la fuente no hizo explícitamente para esas 23 recetas). Debe mapear a `NOT_ASSESSED`, distinto de `NONE_DECLARED` (regla 5) — son casos con vocabulario final distinto aunque ambos "parezcan" cero alérgenos.

### Casos ambiguos identificados (no resueltos, para tu decisión)
- `ACEITE DE OLIVA | Ninguno` en `NLX-058`: no es un alérgeno EU-14; podría ser un error de origen (una fila de proceso interno que se coló en el array) o una convención que desconozco. No lo reinterpreto.
- Lista vacía (23 recetas) — ambigüedad `NOT_ASSESSED` vs `NONE_DECLARED` ya señalada arriba; es la de mayor impacto porque afecta al 40% del catálogo.
- Paréntesis que mezclan tres tipos de información distinta en el mismo texto libre: el ingrediente causante (`tahini`, `tamari`), el nivel de certeza (`trazas posibles`), y condicionalidad de receta (`si se usa`, en `LACTEOS (ghee — trazas si se usa)`) — separarlos con una regla determinista no siempre es posible sin revisión caso a caso.
- `CONTIENE: HUEVO | TRAZAS: GLUTEN (opcional)` — el único caso con ambos campos poblados Y un calificador `(opcional)` sobre las trazas; no está claro si "opcional" cualifica al huevo, al gluten, o a la aparición de la traza en sí.

### Pérdida potencial de información
Si se normaliza directamente al enum EU-14 sin conservar el texto original, se pierde: el matiz de certeza ("trazas posibles" vs "contiene"), el ingrediente causante concreto entre paréntesis, y las notas condicionales ("si se usa", "opcional"). Por eso propongo — y no ejecuto todavía — el modelo `allergens_legacy` (verbatim, intacto) + `allergens_normalized` (estructurado, con `contains[]`, `traces[]`, `qualifier` libre y `status: NOT_ASSESSED | NONE_DECLARED | DECLARED`) en el futuro master, nunca sustituyendo el original.

---

## D. BINDING SEMANTICS v1

Cuatro tipos, mutuamente excluyentes por par (receta o tag) × (acción canónica):

**`supports`** — la receta/tag aporta evidencia estructural positiva y coherente con lo que la acción canónica premia. Se usa cuando el tag de origen (`ingredient_and_rule_tags` o `public_tags.culinary_and_dietary`) describe directamente el mismo comportamiento que la acción recompensa (p. ej. `MEDITERRANEAN_PATTERN` → `adherence.nutrition.lista_de_la_compra_mediterranea`). No implica que la receta *sea* la acción, solo que su consumo/preparación es coherente con completarla.

**`candidate`** — hay una relación plausible pero que requiere un dato más fino del que hoy disponemos de forma estructurada para confirmarla sin ambigüedad (p. ej. `FISH_OR_SEAFOOD` es más amplio que "pescado azul": la receta podría ser pescado blanco, y la acción exige omega-3/pescado azul específicamente). Se promueve a `supports` solo cuando aparezca el dato estructurado que falta (en este caso, identificación de especie/tipo de pescado); hasta entonces se queda en `candidate` y no debe tratarse como confirmado en ningún cálculo de cobertura.

**`contextual_opposite`** — el tag de la receta describe la presencia de algo que la acción canónica premia *reducir* o *evitar*, no adoptar (p. ej. `RED_MEAT` frente a `nutrition.processed_reduction.carne_roja_g`, o `ADDED_SUGAR` frente a `...reduce_dulces_industriales_a_hoy`). Nunca debe generar un `supports`: asociarlas directamente invertiría el sentido de la acción. Propuesto como tipo semántico candidato en este documento — **no lo incorporo al canon de bindings hasta que apruebes explícitamente su uso**, tal como pediste.

**`unmapped`** — no existe ninguna acción canónica nutrition/adherence.nutrition razonablemente relacionada con el tag/receta (p. ej. tags puramente de dificultad/tiempo como `EASY`/`QUICK`, o claims EU sin acción equivalente en el catálogo como `HIGH_PROTEIN_EU`). Es el estado por defecto — no se fuerza a `candidate` solo por rellenar cobertura.

Reglas de uso: `direct` (asociación receta=acción sin intermediación) sigue existiendo como tipo en el esquema pedido originalmente, pero **no se usa en esta fase** — ninguna de las 58 recetas ofrece hoy evidencia estructural inequívoca de que completarla equivalga 1:1 a una acción del motor de gamificación (las recetas son platos, las acciones son comportamientos diarios genéricos). Si en el futuro una acción se redefiniera como "prepara esta receta concreta", ahí sí aplicaría `direct` — no es el caso actual.

---

## E. UPDATED BUILD PLAN

**Si recuperamos las tres especificaciones clínicas** (`NUTRIENT_THRESHOLDS`, `CLINICAL_PROFILES`, `CLINICAL_RULES`):
- `nutritional_rules` pasa de ser una sección de solo-referencia a contener las reglas reales (`rule_id`, `threshold`, `operator`, `target_nutrient`, `resulting_tag`), permitiendo reconstruir de verdad `receta → composición → regla aplicada → tag resultante` para cada uno de los `reason_codes` ya observados.
- `clinical_profile_mapping` pasa de "14 nombres sin definición" a los 14 perfiles con `included_tags`/`excluded_tags`/`caution_tags` reales — y puedo entonces auditar si los resultados YA presentes en las 58 recetas (eligibility/fit/reason_codes) son coherentes con esas reglas recién recuperadas o si hay discrepancias que reportar (sin corregirlas por mi cuenta).
- Puede abrir nuevos `review_flags` si encuentro incoherencias entre la regla recuperada y el resultado ya aplicado en una receta — eso sería un hallazgo de auditoría de Fase 1B, no una corrección silenciosa.
- No cambia el modelo de madurez (`ACTIVE_READY`/`PARTIAL`/`INCOMPLETE`), que depende de estructura y nutrición core, no de las reglas clínicas.

**Si definitivamente no aparecen** (confirmas que no se pueden recuperar):
- `nutritional_rules` y `clinical_profile_mapping` quedan en el master como secciones de solo-referencia permanentes: `{name, version, status: "DEFINITION_NOT_PROVIDED", note}`, y así se documenta explícitamente en `NUTRILONGX_ALIMENTACION_MASTER_BUILD_REPORT_v1.md` como limitación conocida y aceptada, no como omisión accidental.
- Los datos de `recipes[].clinical_profiles` (eligibility/fit/reason_codes por receta) se conservan íntegros igualmente — son observaciones ya existentes en la fuente, no dependen de que yo tenga la regla para preservarlas.
- El master queda perfectamente construible y usable para lo que sí tenemos: catálogo de recetas con su madurez, tags, alérgenos legacy+normalizados (si apruebas la propuesta C), y bindings de gamificación — solo con la salvedad clínica marcada con claridad en cada punto donde aplica.

En ambos casos, `COMPOSITION_UNKNOWN` seguirá siendo un estado explícito y distinto de `0` para las 50 recetas sin composición calculada — eso no depende de recuperar las specs clínicas, depende de recuperar el join con BEDCA/USDA (fuera del alcance de esta fase, ya documentado en `composition_execution_note_v1` de la propia fuente).

---

Quedo a la espera de: (1) los documentos que puedas aportar de la checklist A, o confirmación de que no existen; (2) tu visto bueno o ajuste al listón de `ACTIVE_READY` propuesto en B; (3) tu decisión sobre incorporar o no `contextual_opposite` al canon de bindings. No genero el master ni toco `CANONICAL v1.0` hasta entonces.
