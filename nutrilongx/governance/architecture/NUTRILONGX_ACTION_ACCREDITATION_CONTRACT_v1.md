# NUTRILONGX — Action Accreditation Contract v1

Estado: `APPROVED` (contrato conceptual). Fecha: 2026-08-19.

Complementa `NUTRILONGX_DOMAIN_INTEGRATION_CONTRACT_v1.md` §2.D/E, §4, §5,
§8. Define la entidad `ACTION_ACCREDITATION_RULE` — la pieza que decide si
una `EXECUTION_EVIDENCE` concreta puede convertirse en un `ACTION_LOG`
válido. **No se construyen aquí las reglas concretas.**

---

## 1. Por qué existe esta capa

`CONTENT_ACTION_BINDING` (contrato principal, §2.C) dice **qué** contenido
está relacionado con **qué** acción canónica. No dice **cuánto**, **cómo**
ni **con qué evidencia** esa relación se considera cumplida. Esa decisión es
responsabilidad exclusiva de `ACTION_ACCREDITATION_RULE`.

Sin esta capa, cualquier evidencia asociada a un binding `supports`
generaría `action_log` automáticamente — violando la regla fundamental de
DVG (contrato principal §3).

---

## 2. Entidad conceptual: `ACTION_ACCREDITATION_RULE`

Campos que debe poder expresar:

```
accreditation_rule_id
canonical_action_id            (referencia exclusiva a NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1)
accepted_evidence_types        (subconjunto de source_type de EXECUTION_EVIDENCE)
required_fields                (qué campos de evidence son obligatorios)
thresholds / conditions
aggregation_window
max_occurrences
deduplication_policy
source_priority
status
provenance
version
```

**No se inventan thresholds.** Si una `canonical_action` ya codifica de
forma suficiente minutos, pasos, frecuencia o cantidad dentro de su propio
`level_variants[]` (p. ej. un `title` como *"Desplázate activo al trabajo
≥20 min"*), la regla de acreditación **referencia ese dato existente**, no
crea uno nuevo.

Si la acción canónica **no** está suficientemente formalizada para derivar
una condición determinista, la regla se marca:

```
status: REQUIRES_ACCREDITATION_RULE_REVIEW
```

en vez de inventar un umbral. Este estado es el resultado esperado y
correcto para la mayoría de acciones `movement.*` hoy — el catálogo
canónico define `base_dvg_hours` y un `title` descriptivo, pero no siempre
un umbral estructurado independiente del texto.

---

## 3. Relación con `CONTENT_ACTION_BINDING`

```
CONTENT_ENTITY --[binding: supports]--> CANONICAL_ACTION
                                              |
                                    (0..N) ACCREDITATION_RULE
                                              |
                        EXECUTION_EVIDENCE --> ¿cumple regla? --> ACTION_LOG
```

Una `CANONICAL_ACTION` puede tener **cero** reglas de acreditación
formalizadas (entonces ningún binding sobre ella puede producir
`action_log` todavía — se queda en `REQUIRES_ACCREDITATION_RULE_REVIEW`),
o una o más reglas que cubren distintos `source_type` de evidencia.

Un binding `contextual_opposite` **nunca** tiene una
`ACTION_ACCREDITATION_RULE` que genere `action_log` positivo — por diseño,
ninguna regla puede convertir evidencia sobre `RED_MEAT`/`ADDED_SUGAR` (o
equivalentes futuros) en cumplimiento acreditado.

---

## 4. Deduplicación (referencia)

`deduplication_policy` de cada regla debe declarar cómo se aplican los
conceptos ya definidos en el contrato principal §8
(`deduplication_key`, `evidence_group`, `time_window`) para esa acción
concreta — no se fija aquí un algoritmo único válido para todas las
acciones, porque una caminata diaria y una comida registrada tienen
ventanas de agregación distintas por naturaleza.

---

## 5. Estado actual — qué NO existe todavía

- **Cero `ACTION_ACCREDITATION_RULE` construidas.** Esta fase define solo la
  entidad y su contrato, no instancias.
- No se ha determinado, acción por acción, cuáles de las 119 familias
  canónicas tienen condición suficiente en su propio catálogo y cuáles
  requieren `REQUIRES_ACCREDITATION_RULE_REVIEW`. Eso es trabajo de una
  fase posterior, no de este contrato.
- No existe todavía ningún conector de evidencia real (wearable, consola,
  registro manual) — ver contrato principal §2.D.

---

## 6. Próximo paso (fuera de esta fase)

Cuando se decida construir reglas de acreditación reales, deben:

1. Recorrer `NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json` acción por acción;
2. clasificar cada una como `DERIVABLE_FROM_CATALOG` o
   `REQUIRES_ACCREDITATION_RULE_REVIEW`;
3. para las derivables, construir la regla citando el campo exacto del
   catálogo del que sale el umbral (nunca un valor inventado);
4. para las no derivables, dejarlas explícitamente pendientes, sin
   bloquear el resto del sistema — una acción sin regla de acreditación
   simplemente no puede acreditar `action_log` todavía, no rompe nada.

No se ejecuta ninguno de estos pasos en esta fase.
