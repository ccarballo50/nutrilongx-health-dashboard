# NUTRILONGX — Apps Script Phase 2A Implementation Report v1

Fecha: 2026-08-20.
Estado del informe: `ACTIVE` — registra lo realmente implementado, no es
fuente de verdad de contenido (`source_of_truth: false`).

Alcance: `FOUNDATION` + `clients.*` + `content.*`, siguiendo
`nutrilongx/governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md`.
**No** incluye `evidence.*`, `actions.*`, `gamification.*`, `progress.*`,
`safety.*` — confirmado por grep, cero referencias a DVG/gamificación/
safety rules en `apps-script/src/`.

---

## 1. Arquitectura

```text
Dashboard → Apps Script (doPost) → Router (allowlist) → Servicio de dominio
          → SupabaseClient (UrlFetchApp/PostgREST) → Supabase standalone v1
```

Capas, con `apps-script/src/*.gs`:

| Fichero | Depende de Apps Script | Rol |
|---|---|---|
| `Errors.gs` | No (puro) | Jerarquía de errores del contrato (9 códigos) |
| `Response.gs` | No (puro) | Envelopes de éxito/error |
| `Validation.gs` | No (puro) | Validadores reutilizables, allowlists de pilares/tipos/estados |
| `Config.gs` | Sí (`PropertiesService`) | Lectura de Script Properties |
| `SupabaseClient.gs` | Sí (`UrlFetchApp`) | Cliente REST mínimo contra PostgREST |
| `Audit.gs` | Indirecta (usa `SupabaseClient`) | `writeAudit()` con inyección de dependencia |
| `ClientsService.gs` | No directa (fábrica con DI) | `clients.*` |
| `ContentService.gs` | No directa (fábrica con DI) | `content.*` |
| `Router.gs` | No (puro) | Allowlist explícita, sin `eval`/dispatch dinámico |
| `Main.gs` | Sí (`doGet`/`doPost`, `Utilities`, `ContentService` nativo) | Único punto de entrada real |

`ClientsService.gs`/`ContentService.gs` son fábricas (`createClientsService(deps)`,
`createContentService(deps)`) — reciben `sbSelect/sbInsert/sbUpdate/sbUpsert/writeAudit`
por inyección de dependencias. En producción (`Main.gs`) se inyectan las
funciones reales; en tests se inyectan fakes en memoria. Esto es lo que
hace testeable esta lógica de negocio fuera del runtime de Google.

## 2. Routing / allowlist

`Router.gs` — `buildRoutes()` construye un objeto de datos explícito con
las 15 funciones de Fase 2A. `routeRequest()` usa
`Object.prototype.hasOwnProperty.call(routes, functionName)` (nunca `in`,
que sí encontraría `constructor`/`toString` heredados) y nunca `eval`/
`this[name]()`. Verificado por test: nombres tipo `__proto__`,
`constructor`, `toString`, `hasOwnProperty` se rechazan como `NOT_FOUND`,
no se ejecutan.

## 3. Contrato HTTP

Todas las funciones (lecturas incluidas) van por `POST`, cuerpo
`{ function, auth: { dashboard_key }, payload }`. `doGet` es solo un
health-check estático sin auth. Documentadas explícitamente en
`apps-script/README.md` §5 tres limitaciones reales de la plataforma que
obligan a este diseño (no decisiones arbitrarias):

1. Apps Script Web Apps no exponen `e.headers` en `doGet`/`doPost` → la
   autenticación viaja en el cuerpo, no en un header `X-Admin-Key` (que no
   se puede leer) ni en query string (prohibido explícitamente en el
   encargo).
2. No hay `doOptions()` → el `Content-Type` debe ser `text/plain` para
   evitar preflight CORS que Apps Script no puede responder.
3. `ContentService.createTextOutput` no permite fijar un código HTTP de
   negocio propio → toda respuesta es HTTP 200 de transporte; el contrato
   ya está diseñado para que el cliente mire siempre `body.ok`, no el
   status HTTP.

## 4. Auth de Dashboard (Fase 2A)

`DASHBOARD_API_KEY` en Script Properties, enviada como
`body.auth.dashboard_key`. Comparación estricta; si falta o no coincide:
`UNAUTHORIZED`, sin revelar si la key existía o cuál era el valor esperado.
Todavía no hay RBAC — actor inicial fijo `professional` (no se inventa un
usuario real).

## 5. Secrets

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DASHBOARD_API_KEY` — leídos
exclusivamente vía `PropertiesService.getScriptProperties()`
(`Config.gs`), nunca hardcodeados. Si falta cualquiera,
`getRequiredConfig()` lanza `INTERNAL_ERROR` genérico al cliente; el
detalle de qué falta solo va al log interno (`console.error`), nunca a la
respuesta HTTP. Verificado en el test de integración: el cuerpo de
respuesta nunca contiene el valor de la service-role key ni de la
dashboard key.

## 6. Cliente Supabase

`SupabaseClient.gs` — `sbSelect/sbInsert/sbUpdate/sbUpsert` sobre
PostgREST vía `UrlFetchApp`. Headers `apikey`/`Authorization: Bearer` con
la service-role key, nunca devueltos. `mapSupabaseError()` traduce
`409`/`23505` → `CONFLICT`, `400`/`422` → `VALIDATION_ERROR`, `404` →
`NOT_FOUND`, cualquier otro → `INTERNAL_ERROR` — nunca se propaga el
cuerpo crudo de PostgREST al cliente (solo al log interno). No expone un
proxy genérico: `Router.gs` nunca enruta estas funciones directamente.

## 7. Funciones implementadas

### `clients.*`

- `clients.list(filters?)` — `status` opcional, paginación estándar.
- `clients.get(clientId)` — `NOT_FOUND` si no existe.
- `clients.create(payload)` — allowlist estricta de campos
  (`external_code, first_name, last_name, email, phone, status`), rechaza
  campos inesperados. **Idempotente** por `external_code`: mismo código +
  misma identidad lógica (`first_name` igual) → devuelve el existente sin
  duplicar; mismo código + datos distintos → `CONFLICT`, sin sobrescribir
  silenciosamente.
- `clients.update(clientId, payload)` — solo
  `first_name/last_name/email/phone/status` actualizables; `id`,
  `external_code`, `auth_user_id`, `created_at` protegidos (cualquier otro
  campo en el patch → `VALIDATION_ERROR`, no se ignora en silencio).
- `clients.getProfile(clientId)` — verifica que el cliente existe;
  `{ profile: null }` (no error) si aún no hay fila de perfil.
- `clients.updateProfile(clientId, payload)` — **rechaza explícitamente
  `current_level`** (`VALIDATION_ERROR`, es estado derivado de
  `client_progress`) antes de aceptar cualquier otro campo; verifica que
  el cliente existe antes del upsert por `client_id`.

### `content.*`

- `content.listRecipes/getRecipe`, `content.listExercises/getExercise`,
  `content.listMind/getMindContent` — lectura sobre
  `recipes/exercises/mind_content`. `getX` devuelve
  `CANONICAL_REFERENCE_NOT_FOUND` (no `500`) si el `canonical_id` no
  existe. `listMind` exige `pillar ∈ {sleep, stress, conscious_wellbeing}`
  y **rechaza explícitamente** `mind`, `MENTE`, `MEN`, `Sueño`, `Estrés`,
  `Bienestar emocional` como valor de pilar persistido/API.
- `content.assign(payload)` — resuelve siempre vía `content_registry`
  (nunca un switch directo a IDs de `recipes`/`exercises` desde el
  Dashboard); `pillar` se deriva **server-side** de
  `content_registry.pillar`, nunca se acepta del payload; verifica cliente
  y contenido activo; **idempotente** en dos niveles: por
  `options.idempotency_key` si se aporta, o si no, devolviendo la
  asignación activa existente (`assigned`/`active`) para el mismo
  `client_id + content_id` en vez de duplicar.
- `content.unassign(assignmentId, reason?)` — `status = 'cancelled'`, no
  `DELETE` físico; idempotente (repetir sobre una ya cancelada no es
  error).
- `content.listAssignments(clientId, filters?)` — filtra por
  `status`/`pillar`, paginación estándar.

## 8. Auditoría

`writeAudit()` (`Audit.gs`) llamado desde `clients.create`,
`clients.update`, `clients.updateProfile`, `content.assign`,
`content.unassign`. Si el insert en `audit_log` falla tras una operación
de negocio ya aplicada, se lanza `DATA_INTEGRITY_ERROR` (no se oculta el
problema, no se finge atomicidad que PostgREST no ofrece entre requests
HTTP separados — documentado explícitamente en el código).

## 9. Tests

`node apps-script/tests/run_all.mjs` → **58/58 PASS**.

| Suite | Cobertura | Resultado |
|---|---|---|
| `Validation.gs` | 19 tests puros | PASS |
| `Response.gs + Errors.gs` | 6 tests puros | PASS |
| `Router.gs` | 5 tests puros (incluye rechazo de `__proto__`/`constructor`) | PASS |
| `ClientsService.gs` (fake deps) | 10 tests — idempotencia, conflicto, campos rechazados, `current_level` | PASS |
| `ContentService.gs` (fake deps) | 11 tests — resolución vía registry, pillar derivado server-side, idempotencia doble vía, cancelación no destructiva | PASS |
| `Main.gs` end-to-end (Google/Supabase stubeados) | 7 tests — auth, routing, flujo completo, no fuga de secretos | PASS |

**Diseño de test**: los `.gs` son JavaScript plano (sin `import`/`export`)
cargado en `vm.createContext` de Node (`tests/lib/load_gs.mjs`); los
ficheros que dependen de servicios reales de Apps Script
(`PropertiesService`, `UrlFetchApp`, `Utilities`, `ContentService` nativo)
se testean con esos 4 servicios stubeados en memoria, no reales. No se ha
añadido ninguna dependencia npm nueva (runner minimo propio en
`tests/lib/tiny_test.mjs`).

**Bugs reales encontrados y corregidos durante el desarrollo de los
tests** (evidencia de que los tests aportaron valor, no solo cobertura
nominal): una `ReferenceError: qsEq is not defined` por no cargar
`SupabaseClient.gs` en el sandbox de test de `ClientsService`/
`ContentService`; varios fixtures de test usaban IDs no-UUID (`"c1"`) que
`requireUuid()` correctamente rechazaba; una comparación `assert/strict`
que fallaba por cruce de *realm* de V8 entre el `vm.createContext` y el
proceso Node principal (corregido usando `node:assert` no estricto,
documentado en `tests/lib/tiny_test.mjs`).

### Invariante de gamificación (Fase 2A no debe tocarla)

No es un test runtime (no hay base de datos real contra la que medir antes/
después) sino una **garantía estructural verificada por inspección**: cero
referencias a `execution_evidence`, `action_logs`, `client_progress`,
`daily_progress`, `gamification`, `dvg`, `safety_rule`,
`calculation_order` o `streak` en todo `apps-script/src/` (confirmado por
grep). Ningún camino de código de Fase 2A puede escribir en esas tablas.

## 10. Security

```yaml
service_role_committed: false
dashboard_key_committed: false
secrets_in_logs: false          # logs solo contienen function/request_id/duration/code
arbitrary_sql_proxy: false      # SupabaseClient.gs nunca se enruta directamente
eval_or_dynamic_dispatch: false # grep confirma 0 usos reales (solo mencionado en un comentario)
unauthenticated_writes: false   # doPost exige auth.dashboard_key antes de rutear
```

Único hallazgo del escaneo de secretos: dos literales `"fake-service-role-key"`
/ `"fake-dashboard-key"` en `tests/main_integration.test.mjs` — valores de
prueba explícitamente falsos usados para stubear `PropertiesService` en el
test, no credenciales reales.

## 11. No modificado

- `supabase/migrations/0001_contenido_pilares.sql`,
  `0002_standalone_backend_v1.sql`,
  `0003_standalone_backend_v1_security_hardening.sql`: sin cambios (no se
  ha creado `0004`; Fase 2A funciona con el schema actual).
- Los 5 artefactos FROZEN (Actions Catalog, Gamification Engine,
  Alimentación Master, Exercise Library, Safety Rules) y los contratos
  cross-domain: sin cambios.
- `api/*`, `services/*` (frontend/backend legacy de Vercel), Dashboard: sin
  tocar — el cutover es una fase posterior.

## 12. Limitations

- **No desplegado.** No hay proyecto Apps Script real creado ni URL
  `.../exec` — Claude Code no dispone de credenciales de Google en este
  entorno. El código está completo y testeado localmente (sección 9), no
  contra el runtime real de Apps Script ni contra Supabase real.
- Ningún test se ha ejecutado contra el Supabase real de producción —
  todos los tests usan fakes/stubs en memoria.
- No hay RBAC real: actor de auditoría fijo `professional`.
- No hay paginación por cursor real (solo `limit`, `cursor` se acepta y se
  valida como string pero no se usa todavía para paginación keyset — v1
  simple, para ≤100 clientes, documentado como decisión deliberada de no
  sobrearquitecturar).
- `content.listExercises`/`listRecipes`/`listMind` no incluyen resumen de
  `exercise_variants` (explícitamente fuera de alcance de Fase 2A).

## 13. Deployment status

```yaml
apps_script_deployed: false
live_verified: false
```

## 14. Next state

```text
APPS_SCRIPT_2A_IMPLEMENTED_PENDING_DEPLOY
```

No se declara `READY_FOR_EVIDENCE_IMPLEMENTATION` porque el código no se ha
desplegado ni verificado contra Apps Script/Supabase reales — declararlo
sería falsificar un despliegue que no ha ocurrido, tal como el propio
encargo prohíbe explícitamente (mismo principio ya aplicado en las fases
anteriores de este proyecto).

### Proceso recomendado para desplegar y pasar a `READY_FOR_EVIDENCE_IMPLEMENTATION`

1. Crear el proyecto Apps Script y desplegarlo como Web App (ver
   `apps-script/README.md` §3).
2. Configurar las 3 Script Properties con los valores reales.
3. Probar `doGet` desde el navegador (health-check).
4. Probar `doPost` con `clients.create` usando un fixture de test
   claramente identificable (`NLX-TEST-2A-001`, nunca un cliente real).
5. Repetir el mismo `doPost` una segunda vez y confirmar que no se duplica
   (test de idempotencia real, no solo con fakes).
6. Confirmar en Supabase que `execution_evidence`, `action_logs`,
   `client_progress`, `daily_progress` siguen en 0 tras las pruebas.
7. Solo entonces, actualizar el estado a
   `READY_FOR_EVIDENCE_IMPLEMENTATION`.
