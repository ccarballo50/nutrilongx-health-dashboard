# NUTRILONGX — Ejercicio: Provenance Schema Amendment v1 (propuesta, no aplicada)

Fecha: 2026-08-19. Propuesta de gobernanza para normalizar `provenance_trace` a una estructura reutilizable N→1, resolviendo la disparidad ad hoc entre `original_candidate_number` (singular, 43 de los 44 objetos de `LIBRARY_PILOT_v1.1`) y `original_candidate_numbers`/`deprecated_exercise_ids` (plural, el objeto fusionado `exercise.cardiorespiratory.caminata`). **Esta es una propuesta de schema amendment (candidata a `MASTER_SCHEMA_v1.3`). No se ha reescrito `NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json` — permanece `FROZEN` tal como se instruyó.**

---

## A. PROBLEMA

`LIBRARY_PILOT_v1.1` tiene hoy dos formas de `provenance_trace` coexistiendo:

1. **Forma singular** (43 objetos): `{original_candidate_number: int|null, candidate_name: string, transformation_notes: string}`.
2. **Forma plural ad hoc** (1 objeto, el fusionado): `{original_candidate_numbers: [int, int], candidate_names: [string, string], transformation_notes: string, deprecated_exercise_ids: [string, string], deprecation_reason: string}`.

Mantener ambas formas indefinidamente obliga a cualquier consumidor (QA, futuras herramientas, humanos revisores) a manejar dos esquemas distintos para el mismo concepto, y no escala si ocurre una segunda fusión (o una fusión 3→1, o un split 1→N en el futuro).

---

## B. ESTRUCTURA PROPUESTA

```json
{
  "provenance": {
    "source_candidates": [
      {
        "original_candidate_number": 1,
        "candidate_name": "caminata_ritmo_moderado",
        "legacy_or_previous_id": "exercise.cardiorespiratory.caminata_ritmo_moderado"
      },
      {
        "original_candidate_number": 2,
        "candidate_name": "caminata_vigorosa",
        "legacy_or_previous_id": "exercise.cardiorespiratory.caminata_vigorosa"
      }
    ],
    "transformation_type": "MERGE",
    "transformation_notes": "Fusionado en Fase 3A.2 (Library Canonicalization v1.1)... [texto sin cambios respecto al actual]",
    "deprecated_ids": [
      "exercise.cardiorespiratory.caminata_ritmo_moderado",
      "exercise.cardiorespiratory.caminata_vigorosa"
    ],
    "deprecation_reason": "MERGED_INTO_exercise.cardiorespiratory.caminata_INTENSITY_ONLY_DUPLICATE_IDENTITY"
  }
}
```

### B.1 Reglas de la estructura normalizada

- **Una entidad normal (nunca fusionada/dividida) tiene exactamente 1 `source_candidate`.** `legacy_or_previous_id` es `null` cuando el `exercise_id`/`variant_id` actual nunca cambió (es decir, coincide con su propio ID desde el origen) — solo se puebla cuando hubo un ID anterior distinto del actual.
- **Una fusión N→1 tiene N `source_candidates`**, uno por candidata original, cada uno con su propio `legacy_or_previous_id` (el `exercise_id` que tenía antes de la fusión, si alguna vez existió como objeto independiente).
- **`transformation_type`** ∈ `{ORIGINAL, MERGE, SPLIT, RENAME}` — nuevo campo explícito que documenta qué operación produjo el objeto actual. `ORIGINAL` para los 43 objetos sin transformación; `MERGE` para el caso actual; `SPLIT`/`RENAME` reservados para el futuro (ninguna instancia hoy).
- **`deprecated_ids` y `deprecation_reason`** se conservan solo cuando `transformation_type != ORIGINAL` — no se pueblan con valores vacíos/null forzados en objetos `ORIGINAL`, se omiten limpiamente (consistente con la disciplina ya aplicada al resto del esquema: no forzar campos irrelevantes).
- **Ningún dato se pierde**: todo lo que hoy vive en la forma plural ad hoc (`original_candidate_numbers`, `candidate_names`, `deprecated_exercise_ids`, `deprecation_reason`) tiene un lugar exacto en la estructura nueva.

---

## C. MAPPING BACKWARDS-COMPATIBLE

| Campo actual (v1.1, forma singular — 43 objetos) | Campo nuevo propuesto |
|---|---|
| `original_candidate_number: N` | `source_candidates: [{original_candidate_number: N, candidate_name: ..., legacy_or_previous_id: null}]` |
| `candidate_name: "x"` | `source_candidates[0].candidate_name: "x"` |
| `transformation_notes: "..."` | `transformation_notes: "..."` (sin cambio, se mueve a nivel del objeto `provenance`) |
| *(implícito, sin campo hoy)* | `transformation_type: "ORIGINAL"` |

| Campo actual (v1.1, forma plural ad hoc — 1 objeto: `exercise.cardiorespiratory.caminata`) | Campo nuevo propuesto |
|---|---|
| `original_candidate_numbers: [1, 2]` | `source_candidates: [{original_candidate_number: 1, ...}, {original_candidate_number: 2, ...}]` |
| `candidate_names: ["caminata_ritmo_moderado", "caminata_vigorosa"]` | `source_candidates[i].candidate_name` respectivamente |
| `deprecated_exercise_ids: [id1, id2]` | `deprecated_ids: [id1, id2]` (renombrado, mismo contenido) + `source_candidates[i].legacy_or_previous_id` poblado con el ID correspondiente a cada candidata |
| `deprecation_reason: "..."` | `deprecation_reason: "..."` (sin cambio) |
| `transformation_notes: "..."` | `transformation_notes: "..."` (sin cambio) |
| *(implícito)* | `transformation_type: "MERGE"` |

**Verificación de completitud**: se aplicó este mapping mentalmente a los 44 objetos de `LIBRARY_PILOT_v1.1` — los 43 objetos `ORIGINAL` producen 1 `source_candidate` cada uno (trivial, sin pérdida), el objeto fusionado produce 2 `source_candidates` con toda la información de `original_candidate_numbers`/`candidate_names`/`deprecated_exercise_ids` preservada exactamente. Ningún campo actual queda sin destino en la estructura nueva.

---

## D. CUÁNDO SE APLICARÍA

**No en esta ronda.** Esta propuesta queda pendiente de aprobación explícita de César. Si se aprueba, la ruta recomendada es:

1. Incorporar la estructura a `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.3.md` (amendment formal, sección de provenance).
2. Aplicarla en la **próxima** construcción real de biblioteca (`LIBRARY_v1.2` o el Master final), migrando los 44 objetos de `v1.1` en ese momento — no reescribiendo `v1.1` retroactivamente (`v1.1` queda como snapshot histórico congelado, tal como ya se declaró `FROZEN`).
3. Los `safety_rule` construidos en esta misma ronda (Fase 3B) **ya usan** un campo `provenance_trace` propio y más simple (`research_source_document`, `research_gap_reference`, `gap_resolution_status`) — distinto por diseño del `provenance` de identidad de `EXERCISE`, porque documenta procedencia de *evidencia científica*, no de *fusión/deprecación de candidatas de catálogo*. No se propone unificar ambos conceptos: son trazabilidades de naturaleza distinta (identidad de contenido vs. procedencia de evidencia).

---

## E. STATUS

```
PROPOSED_NOT_APPLIED
```

Pendiente de aprobación de César. `LIBRARY_PILOT_v1.1.json` no se ha modificado.
