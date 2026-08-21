# NUTRILONGX — Apps Script Phase 2C Action Accreditation Implementation Report v1

Fecha: 2026-08-21.
Estado del informe: `ACTIVE` — registra lo realmente implementado y
verificado en real, no es fuente de verdad de contenido
(`source_of_truth: false`).

Alcance: `actions.list`, `actions.get`, `actions.accredit`,
`actions.listLogs`, `actions.getLog`, siguiendo
`nutrilongx/governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md`
sección 8/11 y `NUTRILONGX_ACTION_ACCREDITATION_CONTRACT_v1.md`. **No**
incluye `actions.accreditAndCalculate`, `gamification.*`, `progress.*`,
`safety.*` — confirmado por grep sobre `apps-script/src/`, cero
referencias a DVG/streaks/boosters/motor de gamificación fuera de
comentarios que documentan explícitamente su ausencia, y confirmado en
real (§8, prueba de router).

---

## 1. Invariante de la fase

```yaml
action_accreditation_rules: 0
automatic_validation:
  status: NOT_AVAILABLE
  reason: NO_CANONICAL_ACCREDITATION_RULES
action_log_creation:
  validated: 0
  pending: 0
  rejected: 0
review_required_flow:
  status: APPLIED_AND_VERIFIED
```

`action_accreditation_rules` no determina `level_variant`; por tanto no
existe base canónica suficiente para materializar un `ACTION_LOG` con los
campos NOT NULL actuales sin inventar datos. Se opta correctamente por
`ACCREDITATION_REVIEW_REQUIRED` sin insertar filas.

Esto **no es un error técnico** ni un bloqueo de esquema: es el resultado
explícitamente sancionado por
`NUTRILONGX_ACTION_ACCREDITATION_CONTRACT_v1.md` §5 ("Outcome A") para el
estado actual del canon (0 reglas de acreditación activas). `actions.gs`
nunca inventa un `level_variant`, un `base_dvg_hours` ni ningún otro campo
`NOT NULL` de `action_logs` — cuando no hay una única acción canónica
resuelta con una regla de acreditación real, la respuesta es siempre
`{status: "pending", reason: "ACCREDITATION_REVIEW_REQUIRED"}`, sin
escritura en `action_logs`.

## 2. Funciones y DTOs

### `actions.list(payload: { domain?, subdomain?, is_active?, limit?, cursor? })`

Allowlist estricta vía `rejectUnknownKeys` — `offset` **no** es un campo
válido (paginación real es `limit`/`cursor`, verificado en real: `offset`
devuelve `VALIDATION_ERROR` con `allowed_fields` explícito). `limit` tiene
un tope server-side de 100 aunque se pida un valor mayor (verificado en
real, §8 punto 2).

### `actions.get(payload: { canonical_action_id })`

Resuelve por `canonical_action_id` (string canónico, no UUID operacional)
— `CANONICAL_REFERENCE_NOT_FOUND` si no existe.

### `actions.accredit(payload: { evidence_id })`

```json
{ "evidence_id": "uuid" }
```

Lógica (sin cambios respecto a lo implementado/testeado localmente):

1. `evidence_id` debe existir en `execution_evidence`; si no,
   `NOT_FOUND`.
2. Si la evidencia no tiene `source_content_id` (evidencia independiente,
   Fase 2B sección 12): `review_required` con `candidate_actions: []`,
   `reason: "Evidence has no source_content_id..."`.
3. Si tiene `source_content_id`: se resuelven los bindings activos
   (`content_action_bindings` con `status=active`) y se filtran a los
   `binding_type` candidatos (`supports`, `candidate`, `direct` —
   `contextual_opposite`/`unmapped` explícitamente excluidos, nunca
   pueden acreditar positivamente).
   - **0 candidatos**: `review_required`, `candidate_actions: []`.
   - **>1 candidatos**: `review_required`, `candidate_actions` lista
     completa (no se desambigua automáticamente — Fase 2C no elige por el
     profesional).
   - **Exactamente 1 candidato**: se comprueba si existe una regla de
     acreditación activa (`action_accreditation_rules`) para esa acción —
     hoy siempre 0, así que el flag `has_accreditation_rule` es
     puramente informativo. **En todos los casos, incluido este, la
     respuesta es `review_required`** — nunca se inserta en
     `action_logs`, con o sin regla, porque el esquema real de
     `action_logs` no tiene forma de resolver `level_variant` de forma no
     inventada (§1).
4. Se audita siempre (`action=actions.accredit`,
   `entity_type=execution_evidence`, `entity_id=<evidence_id>`,
   metadata con `result_status`, `reason`, `candidate_count`,
   `canonical_action_ids`), independientemente del resultado.

### `actions.listLogs` / `actions.getLog`

Lecturas puras sobre `action_logs` (`action_log_id` es el campo real, no
`id`, verificado en real §8 punto 15). Con `action_accreditation_rules=0`
y ningún `actions.accredit` insertando nunca, `action_logs` permanece
vacía — `actions.listLogs` devuelve `{ok:true, data:{action_logs:[],
count:0}}` (colección vacía, **no** un error), `actions.getLog` con un
`action_log_id` inexistente devuelve `NOT_FOUND` sin necesidad de crear
ningún fixture artificial.

## 3. Arquitectura y limitaciones documentadas

`apps-script/src/ActionsService.gs` (nuevo) sigue el mismo patrón de
fábrica con inyección de dependencias que `EvidenceService.gs`:
`createActionsService({ sbSelect, sbInsert, writeAudit })`. `sbInsert` se
inyecta por consistencia de firma con el resto de servicios, pero
**nunca se invoca contra `action_logs`** en esta fase — verificado por
grep (`sbInsert` solo referenciado en la firma de `deps`, ninguna llamada
real en el cuerpo del archivo) y confirmado en real (§8, invariante).

**Cambios aditivos en archivos de Fase 2A/2B** (inevitables, mínimos):
- `Validation.gs`: + `NLX_BINDING_TYPES`, `NLX_BINDING_STATUSES`,
  `NLX_ACCREDITATION_RULE_STATUSES`, `NLX_ACTION_LOG_STATUSES` — mismo
  patrón que los enums ya existentes.
- `Router.gs`: + 5 rutas (`actions.list/get/accredit/listLogs/getLog`) en
  `buildRoutes()`, ahora con firma `buildRoutes(clientsService,
  contentService, evidenceService, actionsService)`.
- `Main.gs`: + construcción de `actionsService` en
  `nlxBuildRealServices()`.

**No implementado deliberadamente** (fuera de alcance del encargo):
`actions.accreditAndCalculate`, `gamification.calculateAction`,
`gamification.*`, `progress.*`, `safety.*` — el router los rechaza con
`NOT_FOUND`, exactamente igual que cualquier otro nombre de función no
declarado en el allowlist (verificado en real, §8 punto 4).

## 4. Tests locales

`node apps-script/tests/run_all.mjs` → **103/103 PASS** (79 de Fase
2A+2B intactos + 24 nuevos: 22 en `actions_service.test.mjs` + 2 añadidos
a `main_integration.test.mjs`).

Dos archivos de test de fases anteriores necesitaron un ajuste **mínimo y
mecánico** para seguir pasando tras el cambio de firma de `buildRoutes()`
y de `nlxBuildRealServices()` — no por ningún cambio de comportamiento
previo:
- `router.test.mjs`: el test "expone exactamente las N funciones" pasa a
  23 (18 + 5), con un `actionsService` fake añadido a la llamada.
- `main_integration.test.mjs`: `loadGsFiles([...])` no cargaba
  `ActionsService.gs`, y `Main.gs` ya lo referencia — sin este ajuste,
  cualquier `doPost` real habría fallado con `ReferenceError`.

Casos cubiertos en `actions_service.test.mjs`: `actions.list` con/sin
filtros y campos desconocidos rechazados; `actions.get` encontrado y
`CANONICAL_REFERENCE_NOT_FOUND`; `actions.accredit` con evidencia
inexistente (`NOT_FOUND`), sin `source_content_id`, con 0/1/>1 bindings
candidatos, exclusión explícita de `contextual_opposite`/`unmapped`,
presencia/ausencia de regla de acreditación (informativa, nunca cambia el
resultado a `validated`/`rejected`), auditoría siempre escrita;
`actions.listLogs` con filtros y vacío; `actions.getLog` encontrado y
`NOT_FOUND`.

## 5. Deployment

- **Método**: `clasp push` seguido de `clasp version` + `clasp deploy
  --deploymentId <existente>` — **actualiza el Web App ya desplegado en
  Fase 2A/2B**, no se crea un segundo proyecto ni un segundo deployment.
- **Proyecto**: `NUTRILONGX Standalone Backend v1 - Phase 2A` (mismo
  `scriptId` que fases anteriores).
- **Deployment ID**: `AKfycby9cVKk08omodh4DDXJIX7yzNFLwTPmmWu8I1y4z_C61ek8aI5axlalFiV1oGE6CjBt-w`
  (sin cambios respecto a fases anteriores — mismo Web App URL).
- **Versión de script**: 5 ("Phase 2C - actions.accredit review-required").
- **Versión de deployment**: @5 (actualización del deployment existente,
  confirmada en real vía `clasp deployments`).

## 6. Resultado de la verificación live

Fixtures reutilizados de Fase 2B, sin crear ningún fixture nuevo
(evidencia sección 7 del encargo):
- `b15191be-1261-44b2-93fc-9291677340db` (evidencia de nutrición, con
  `source_content_id` real resuelto a `NLX-001`).
- `10b0f992-f8ce-48c5-a90e-1389c3fe04f1` (evidencia de sueño, sin
  `source_content_id`).

| # | Prueba | Resultado |
|---|---|---|
| 1 | Baseline live pre-prueba | PASS — `action_logs=0, client_progress=0, daily_progress=0, action_accreditation_rules=0, canonical_actions=119`, idéntico al esperado |
| 2 | Auth negativa (sin key / key inválida) | PASS — `UNAUTHORIZED` en ambos casos |
| 3 | Auth positiva (`actions.list` con key real) | PASS |
| 4 | Router: `__proto__`/`constructor`/`toString` | PASS — `NOT_FOUND` en los 3 |
| 5 | Router: `actions.accreditAndCalculate` (nombre prohibido) | PASS — `NOT_FOUND` |
| 6 | Router: `gamification.calculateAction` (nombre prohibido) | PASS — `NOT_FOUND` |
| 7 | `actions.list` sin filtros | PASS — paginación por defecto `count=50` (de 119 reales, **no** una discrepancia de canon, mismo patrón ya documentado para `recipes` 50-de-58) |
| 8 | `actions.list` con `limit=119` | PASS — tope server-side real de **100** (`count=100`), no 119 — documentado como límite real de la implementación, no un bug |
| 9 | `actions.list` con `offset` | PASS — `VALIDATION_ERROR`, `allowed_fields` no incluye `offset` (paginación real es `limit`/`cursor`) |
| 10 | `actions.get` con `canonical_action_id` real | PASS — datos correctos |
| 11 | `actions.get` con `canonical_action_id` inexistente | PASS — `CANONICAL_REFERENCE_NOT_FOUND` |
| 12 | `actions.accredit` sobre evidencia con contenido y **5 bindings `supports` activos reales** | PASS — `{status:"pending", reason:"ACCREDITATION_REVIEW_REQUIRED", candidate_actions: [5 elementos], action_log_created:false}` — camino de múltiples candidatos ejercitado con datos reales, sin fabricar nada |
| 13 | `actions.accredit` sobre evidencia sin contenido | PASS — `{status:"pending", reason:"ACCREDITATION_REVIEW_REQUIRED", candidate_actions: [], action_log_created:false}` |
| 14 | Semántica de `binding_type` (`contextual_opposite`/`unmapped` nunca acreditan) | Verificado **solo localmente** (tests con fakes, exhaustivo). El canon real no tiene actualmente ningún binding `contextual_opposite`/`unmapped` para el contenido de los fixtures disponibles — no se ha insertado un binding sintético en producción para forzar este camino en vivo (habría sido una mutación de canon no autorizada) |
| 15 | `action_logs` sigue en 0 tras `actions.accredit` (x2) | PASS — verificado vía Supabase de solo lectura, sin cambios respecto al baseline |
| 16 | Ausencia de valores DVG/`level_variant` inventados | PASS — 0 filas en `action_logs`, ninguna llamada `sbInsert` ejecutada contra esa tabla |
| 17 | `audit_log` + correlación `request_id` para `actions.accredit` | PASS — **2/2** `request_id` de las respuestas HTTP correlacionan exactamente con sus filas en `audit_log` (`entity_id=evidence_id`, metadata con `result_status`/`candidate_count`/`canonical_action_ids` coherente) |
| 18 | `actions.listLogs` con `action_logs` vacía | PASS — `{ok:true, data:{action_logs:[], count:0}}`, **no** un error |
| 19 | `actions.getLog` con `action_log_id` fabricado | PASS — `NOT_FOUND`, sin crear ningún `action_log` artificial |
| 20 | Invariantes finales | PASS — `action_logs/client_progress/daily_progress` en 0, idénticos al baseline pre-prueba |
| 21 | Security Advisor | PASS — 17/17 tablas standalone en `INFO rls_enabled_no_policy`, **0 `WARN`**, sin cambios respecto a fases anteriores |

**21/21 puntos de verificación live PASS.**

## 7. Seguridad

Reutiliza íntegramente la autenticación de fases anteriores
(`auth.dashboard_key` en el cuerpo, nunca query string) — verificado en
real: `actions.*` sin key válida devuelve `UNAUTHORIZED`, mismo
comportamiento que `clients.*`/`content.*`/`evidence.*`. No se ha creado
ningún endpoint ni mecanismo de auth alternativo. `RLS` sin relajar — 0
policies nuevas, Security Advisor sin cambios. `DASHBOARD_API_KEY` leída
únicamente desde el fichero temporal local indicado por César, nunca
impresa, logueada, copiada al repo ni incluida en ningún commit/PR;
fichero borrado y su ausencia verificada dos veces al finalizar las
pruebas; secret scan sobre el diff antes de commitear, sin hallazgos
(única coincidencia: un valor fake de fixture de test,
`"fake-service-role-key"`, preexistente e inofensivo).

## 8. Limitaciones

- El camino `contextual_opposite`/`unmapped` de `binding_type` está
  verificado exhaustivamente en local (tests con fakes) pero no contra un
  binding real en producción, porque el canon actual no tiene ninguno
  para el contenido de los fixtures disponibles (§6, punto 14). No se
  considera un riesgo: la exclusión está codificada como una constante
  (`ACTIONS_CANDIDATE_BINDING_TYPES`), no como una condición dinámica
  dependiente de datos.
- `has_accreditation_rule` es informativo únicamente — con
  `action_accreditation_rules=0` nunca es `true` en real hoy; su efecto
  sobre el resultado (ninguno, siempre `review_required`) solo puede
  verificarse en real cuando exista al menos una regla activa.
- Mismos límites ya documentados en fases anteriores: sin RBAC real más
  allá de la clave única, sin paginación por cursor real (`cursor` se
  acepta pero no se implementa lógica de continuación), `limit` tiene un
  tope server-side de 100.

## 9. Siguiente estado

```text
MVP_ACCREDITATION_RULES_REQUIRED
```

**No** `READY_FOR_GAMIFICATION_IMPLEMENTATION`. El siguiente paso no es
construir el motor de gamificación completo ni las 119 reglas de
acreditación de golpe: alineado con la estrategia de producto
`NUTRILONGX_PLAYABLE_MVP`, CORE CENTRAL debe seleccionar primero un
subconjunto mínimo de acciones canónicas con reglas de acreditación
explícitas y versionadas (`action_accreditation_rules`) antes de que
`actions.accredit` pueda producir su primer `ACTION_LOG` real — sin ese
subconjunto, no existe base canónica suficiente para resolver
`level_variant` sin inventar datos (§1).
