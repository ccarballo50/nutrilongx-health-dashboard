# NUTRILONGX — Console / API Boundary v1

Estado: `APPROVED` (contrato conceptual). Fecha: 2026-08-19.

Complementa `NUTRILONGX_DOMAIN_INTEGRATION_CONTRACT_v1.md` §11–12. Existe un
flujo de trabajo paralelo desarrollando una consola/dashboard administrativo
que invoca funciones vía Apps Script. Este documento fija la frontera entre
esa consola y las fuentes canónicas — **sin implementar Apps Script ni la
API aquí**.

---

## 1. Regla de frontera (no negociable)

| La consola SÍ puede | La consola NO puede |
|---|---|
| Solicitar operaciones a una capa de funciones/API que lea/escriba sobre las fuentes canónicas | Contener el motor canónico (`calculation_order`, streaks, boosters, combos, caps) |
| Leer catálogo de acciones, contenido, progreso | Redefinir o recalcular `base_dvg_hours` por su cuenta |
| Registrar evidencia | Duplicar `safety_rules` (reimplementar `condition_trigger`/`recommendation_adaptation`) |
| Solicitar acreditación de acción | Escribir `action_log` directamente sin pasar por evidencia + regla de acreditación |
| Inspeccionar avisos de seguridad | Declarar `safety_status`/`clinical_profile_id` propios, fuera de `NUTRILONGX_EJERCICIO_SAFETY_RULES_v1` |

Apps Script es **cliente** de la capa de funciones/API, nunca **autoridad**
sobre contenido, motor o seguridad.

---

## 2. Operaciones que la consola podrá solicitar (futuro)

- create/update content
- publish/unpublish content
- create bindings (`content_entity → canonical_action`)
- approve/reject content
- register evidence
- request action accreditation
- read progress
- review flags
- assign prescriptions (cuando exista `PRESCRIPTION`, hoy `NOT_BUILT`)
- inspect safety warnings

Ninguna de estas operaciones se implementa en esta fase.

---

## 3. Catálogo conceptual de funciones (namespacing, no endpoints finales)

```
content.*        — create/update/publish/unpublish/approve/reject content
bindings.*        — create/list bindings
evidence.*        — register evidence
actions.*         — request accreditation, read canonical action catalog
gamification.*    — invocar el motor (solo vía action_log), leer calculation_trace
progress.*         — leer progreso derivado, solicitar rebuild_progress
safety.*           — inspeccionar avisos / evaluar contexto de seguridad
admin.*            — operaciones administrativas generales
```

## 4. API contract conceptual (referencia, mismo que el contrato principal §12)

```
GET  /api/canonical/actions
GET  /api/content/recipes
GET  /api/content/exercises

POST /api/evidence
POST /api/actions/accredit
GET  /api/progress
GET  /api/safety/evaluate

POST /api/admin/...
```

No se fija tecnología, framework ni SQL. El objetivo exclusivo de este
documento es delimitar responsabilidades entre consola/Apps Script y las
fuentes canónicas, para que un desarrollo paralelo de la consola no
reimplemente accidentalmente el motor, el catálogo o las reglas de
seguridad.

---

## 5. Consecuencia práctica para el equipo de consola

Cualquier función Apps Script que necesite un valor de DVG, un nivel, una
regla de seguridad o un resultado de acreditación debe **solicitarlo** a la
capa de funciones/API — nunca copiarlo a una hoja de cálculo o script como
segunda fuente de verdad. Si la consola necesita cachear datos por
rendimiento, ese caché debe declararse explícitamente como derivado,
siguiendo la misma regla de `NUTRILONGX_SOURCE_OF_TRUTH_MATRIX_v1.md` §
"Regla de resolución de conflicto".
