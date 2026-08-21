# NUTRILONGX — Apps Script Phase 2B Evidence Implementation Report v1

Fecha: 2026-08-21.
Estado del informe: `ACTIVE` — registra lo realmente implementado y
verificado en real, no es fuente de verdad de contenido
(`source_of_truth: false`).

Alcance: `evidence.register`, `evidence.list`, `evidence.get`, siguiendo
`nutrilongx/governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md`
sección 7. **No** incluye `actions.*`, `gamification.*`, `progress.*`,
`safety.*` — confirmado por grep sobre `apps-script/src/`, cero
referencias a DVG/streaks/boosters/motor de gamificación fuera de
comentarios que documentan explícitamente su ausencia.

---

## 1. Invariante de la fase

```yaml
evidence_register_creates:
  execution_evidence: true
  action_log: false
  dvg: false
  progress: false
```

`evidence.register()` crea exclusivamente una fila en `execution_evidence`.
Nunca llama al motor de gamificación, nunca fabrica una acción canónica,
nunca calcula `base_dvg_hours` ni ningún derivado (streaks, boosters,
combos, multiplicadores de nivel), nunca salta la acreditación.

## 2. Funciones y DTOs

### `evidence.register(payload)`

```json
{
  "client_id": "uuid",
  "source_type": "dashboard",
  "source_content": { "content_type": "recipe", "canonical_id": "NLX-001" },
  "pillar": "nutrition",
  "occurred_at": "2026-08-20T12:00:00+02:00",
  "quantity": 1,
  "unit": "serving",
  "duration_minutes": null,
  "intensity": null,
  "metadata": {},
  "idempotency_key": "caller-generated-key"
}
```

`source_content` y `pillar` son ambos opcionales, pero mutuamente
condicionados (sección 6):

- **Con `source_content`**: el `pillar` se resuelve SIEMPRE server-side
  desde `content_registry.pillar` — nunca se confía en el `payload.pillar`.
  Si el payload declara un `pillar` distinto del derivado, `VALIDATION_ERROR`
  explícito (nunca se corrige en silencio).
- **Sin `source_content`** (evidencia independiente, encargo sección 12):
  `pillar` es obligatorio y explícito en el payload. No se inventa ninguna
  asociación de contenido.

Respuesta:

```json
{ "ok": true, "data": { "evidence": { "...": "..." }, "idempotent": false }, "meta": { "...": "..." } }
```

### `evidence.list(payload: { client_id, pillar?, source_type?, from?, to?, limit?, cursor? })`

Filtros permitidos (allowlist estricta vía `rejectUnknownKeys` — no se
acepta ningún filtro SQL arbitrario): `pillar`, `source_type`, `from`,
`to`, `limit`, `cursor`. Devuelve resumen (`id, client_id, pillar,
source_type, source_content_id, occurred_at, quantity, unit,
duration_minutes, intensity, metadata, created_at`) — no expande el
contenido canónico completo.

### `evidence.get(payload: { evidence_id })`

`NOT_FOUND` si no existe. Nunca devuelve la respuesta cruda de PostgREST.

## 3. Deduplicación en dos capas

```yaml
idempotency_key:
  protects: transport/retry duplication
  origin: caller-generated, opaco para el servidor
  scope: por client_id + idempotency_key exacto

deduplication_key:
  protects: logical evidence duplication
  origin: construida server-side, determinista — el payload NUNCA puede
    enviar este campo directamente (no está en el allowlist de
    evidence.register)
  formula: >
    [source_type, source_content_id||'none',
     occurred_at normalizado a minuto (sin segundos/ms),
     quantity||'null', unit||'null', duration_minutes||'null'].join('|')
  scope: constraint real en BD, unique(client_id, deduplication_key)
    (supabase/migrations/0002_standalone_backend_v1.sql linea 357)
```

Ambas capas coexisten y se comprueban en orden: primero `idempotency_key`
(si viene), luego `deduplication_key` siempre. Dos peticiones con
`idempotency_key` distintas pero identidad lógica idéntica se deduplican
igualmente por `deduplication_key` — verificado en real (sección 8, punto
3). Normalización a minuto es deliberadamente simple (MVP, encargo sección
13) — no es un algoritmo de reconciliación de wearables.

## 4. Audit

`evidence.register` audita con `action=evidence.register`,
`entity_type=execution_evidence`, `entity_id=<evidence.id>`,
`before_data=null`, `after_data=<fila insertada>`. Un retry idempotente
(por `idempotency_key` o por `deduplication_key`) hace *early return*
antes de la escritura de audit — no genera un segundo evento (encargo
sección 22), pero el logging técnico por `request_id` sigue existiendo vía
`console.log`/`console.error` en `Main.gs` para toda petición,
independientemente del resultado. `evidence.list`/`evidence.get` no
auditan (lecturas, encargo sección 21).

## 5. Arquitectura y limitaciones documentadas

`apps-script/src/EvidenceService.gs` (nuevo) sigue el mismo patrón de
fábrica con inyección de dependencias que `ClientsService.gs`/
`ContentService.gs`: `createEvidenceService({ sbSelect, sbInsert,
writeAudit })`.

**Duplicación deliberada, no reutilización**: `fetchClientById()` y
`resolveActiveRegistryEntry()` están reimplementadas dentro de
`EvidenceService.gs` en vez de importarse desde `ClientsService.gs`/
`ContentService.gs`. Motivo: ambos archivos son de Fase 2A, ya desplegados
y verificados en real — modificarlos (aunque fuera solo para exportar un
helper) habría requerido reabrir su propia superficie de riesgo sin
necesidad. El coste es ~15 líneas de lógica duplicada; el beneficio es que
Fase 2A queda completamente intacta (verificado: `git diff` no toca
`ClientsService.gs` ni `ContentService.gs`).

**Cambios aditivos en archivos de Fase 2A** (inevitables, mínimos):
- `Validation.gs`: + `NLX_EVIDENCE_SOURCE_TYPES`, `requireIsoDateTime()`,
  `optionalNumeric()` — mismo patrón que los validadores ya existentes.
- `Router.gs`: + 3 rutas (`evidence.register/list/get`) en `buildRoutes()`,
  ahora con firma `buildRoutes(clientsService, contentService,
  evidenceService)`.
- `Main.gs`: + construcción de `evidenceService` en
  `nlxBuildRealServices()`.

**Columnas de `execution_evidence` no utilizadas en esta fase**:
`source_entity_type`/`source_entity_id` existen en el esquema pero el
contrato de payload de Fase 2B (sección 6 del encargo) no las contempla —
quedan `null` en todas las filas. No se ha inventado un uso para ellas.

## 6. Tests locales

`node apps-script/tests/run_all.mjs` → **79/79 PASS** (58 de Fase 2A
intactos + 21 nuevos: 18 en `evidence_service.test.mjs` + 3 añadidos a
`main_integration.test.mjs`).

Dos archivos de test de Fase 2A necesitaron un ajuste **mínimo y
mecánico** para seguir pasando tras el cambio de firma de `buildRoutes()`
y de `nlxBuildRealServices()` — no por ningún cambio de comportamiento de
Fase 2A:
- `router.test.mjs`: el test "expone exactamente las 15 funciones" pasa a
  18 (15 + 3), con un `evidenceService` fake añadido a la llamada.
- `main_integration.test.mjs`: `loadGsFiles([...])` no cargaba
  `EvidenceService.gs`, y `Main.gs` ya lo referencia — sin este ajuste,
  cualquier `doPost` real habría fallado con `ReferenceError`.

Casos cubiertos en `evidence_service.test.mjs`: registro válido con
contenido (pillar derivado, audit), cliente inexistente (`NOT_FOUND`, sin
creación implícita), UUID inválido, `source_type` inválido, `occurred_at`
no ISO-8601, pillar inválido (enum y alias legacy `mind`), pillar
incompatible con el contenido (`VALIDATION_ERROR`, nunca corrección
silenciosa), contenido inexistente/inactivo
(`CANONICAL_REFERENCE_NOT_FOUND`), evidencia sin contenido con pillar
explícito, evidencia sin contenido y sin pillar (`VALIDATION_ERROR`),
idempotencia por `idempotency_key`, deduplicación lógica sin reutilizar la
key de transporte, no-deduplicación cuando la fecha realmente difiere,
campos desconocidos rechazados, `evidence.list` con los 4 filtros,
`evidence.get` (encontrado y `NOT_FOUND`).

## 7. Deployment

- **Método**: `clasp push` (12 archivos: `appsscript.json` + 11 `.gs` de
  `src/`) seguido de `clasp version` + `clasp deploy --deploymentId
  <existente>` — **actualiza el Web App ya desplegado en Fase 2A**, no se
  crea un segundo proyecto ni un segundo deployment.
- **Proyecto**: `NUTRILONGX Standalone Backend v1 - Phase 2A` (mismo
  `scriptId` que Fase 2A).
- **Deployment ID**: `AKfycby9cVKk08omodh4DDXJIX7yzNFLwTPmmWu8I1y4z_C61ek8aI5axlalFiV1oGE6CjBt-w`
  (sin cambios respecto a Fase 2A — mismo Web App URL).
- **Versión de script**: 2 (etiqueta "Phase 2B — evidence.register/list/get").
- **Versión de deployment**: @3 (actualización del deployment existente).

## 8. Resultado de la verificación live

Fixture reutilizado de Fase 2A: cliente `NLX-TEST-2A-001`
(`2fe63c8f-e042-458c-8101-f652aa9b7b99`), `status=archived` — sin crear
cliente nuevo, tal como permite el encargo sección 28.

| # | Prueba | Resultado |
|---|---|---|
| 1 | `evidence.register` con contenido real (`NLX-001`), `idempotency_key` | PASS — `pillar="nutrition"` derivado server-side, `source_content_id` resuelto vía `content_registry` |
| 2 | Retry con el mismo `idempotency_key` | PASS — mismo `evidence.id`, `idempotent:true`, sin fila nueva |
| 3 | Retry con `idempotency_key` **distinta**, misma identidad lógica | PASS — mismo `evidence.id`, `idempotent:true` — la `deduplication_key` server-side deduplica independientemente del transporte |
| 4 | `pillar` declarado incompatible con el `pillar` del contenido | PASS — `VALIDATION_ERROR`, `details.derived_from_content` explícito, nunca corregido en silencio |
| 5 | `source_content.canonical_id` inexistente | PASS — `CANONICAL_REFERENCE_NOT_FOUND` |
| 6 | Evidencia sin `source_content`, `pillar` explícito (`sleep`) | PASS — creada, `source_content_id:null` |
| 7 | `evidence.list` sin filtros | PASS — `count:2`, ambas evidencias del fixture |
| 8 | `evidence.list` filtrado por `pillar=sleep` | PASS — `count:1` |
| 9 | `evidence.get` por id real | PASS — datos correctos |
| 10 | `evidence.get` por id inexistente | PASS — `NOT_FOUND` |
| 11 | `audit_log` para `evidence.register` | PASS — **exactamente 2 filas** (las 2 evidencias genuinamente nuevas; los 2 retries idempotentes no generaron auditoría duplicada) |
| 12 | Correlación `request_id` | PASS — `audit_log.request_id` idéntico a `meta.request_id` en ambas peticiones verificadas |
| 13 | Ausencia de secretos en `audit_log` | PASS — 0 filas sospechosas (barrido SQL) |
| 14 | Invariantes (`action_logs`/`client_progress`/`daily_progress`) | PASS — los 3 en 0, idénticos al baseline pre-prueba; `execution_evidence` sube de 0 a 2 (permitido, encargo sección 33) |
| 15 | Sin cálculo de DVG | PASS — ninguna fila de `execution_evidence` ni `action_logs` contiene `base_dvg_hours` ni campos derivados |
| 16 | Security Advisor | PASS — 17/17 tablas standalone en `INFO rls_enabled_no_policy`, **0 `WARN`**, sin cambios respecto a Fase 2A |

**16/16 puntos de verificación live PASS.**

## 9. Seguridad

Reutiliza integramente la autenticación de Fase 2A
(`auth.dashboard_key` en el cuerpo, nunca query string) — verificado en
real: `evidence.register` sin key válida devuelve `UNAUTHORIZED`, mismo
comportamiento que `clients.*`/`content.*`. No se ha creado ningún
endpoint ni mecanismo de auth alternativo. `RLS` sin relajar — 0 policies
nuevas, Security Advisor sin cambios.

## 10. Limitaciones

- `source_entity_type`/`source_entity_id` no utilizadas (sección 5).
- La normalización de `deduplication_key` a granularidad de minuto es
  deliberadamente simple — dos eventos reales del mismo tipo en el mismo
  minuto exacto para el mismo cliente se deduplicarían aunque fueran
  eventos distintos. Aceptado como límite de un MVP (encargo sección 13);
  no es una regla de negocio revisada clínicamente.
- `evidence.list` no valida que el `client_id` exista (a diferencia de
  `evidence.register`/`evidence.get`) — un `client_id` desconocido
  simplemente devuelve `count:0`, consistente con semántica REST de
  listado, pero distinto de `clients.getProfile` (que sí lo exige). No es
  un error, es una decisión de diseño no explicitada en el encargo.
- Igual que en Fase 2A: sin RBAC real más allá de la clave única
  (`dashboard_key`), sin paginación por cursor real (`cursor` se acepta en
  el payload pero no se implementa lógica de continuación — mismo límite
  ya documentado en el informe de Fase 2A).

## 11. Siguiente estado

```text
READY_FOR_ACTION_ACCREDITATION_IMPLEMENTATION
```

No `READY_FOR_GAMIFICATION` — falta `ACTION_ACCREDITATION` → `ACTION_LOG`
antes de que exista ningún dato válido para que el motor de gamificación
procese.
