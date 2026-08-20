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

## 12. Intento de deploy real (2026-08-20, sesión posterior)

A diferencia de la redacción original de este informe, esta sesión **sí
tuvo** acceso real: `clasp` autenticado (`nutrilongx@gmail.com`) y acceso
Supabase de solo administración vía MCP (proyecto real, no simulado). Se
intentó completar el deploy real. Resultado: **parcialmente completado**,
bloqueado por dos límites reales de la plataforma que requieren un paso
interactivo en navegador — no por falta de acceso Google en general.

### Lo que sí se completó y es real

1. **Proyecto Apps Script creado** vía `clasp create-script`:
   `NUTRILONGX Standalone Backend v1`, `scriptId` real (ver
   `apps-script/.clasp.json`, local, **no commiteado** — sección 53 del
   encargo, contiene únicamente el `scriptId`, sin OAuth tokens).
   - *Nota de limpieza*: un primer intento con `rootDir` mal configurado
     creó un segundo proyecto huérfano y vacío que no pudo eliminarse por
     API (`clasp delete-script` devolvió `The user has not granted the app
     ... write access` — límite de scope OAuth, no relacionado con
     Supabase). Ese proyecto huérfano no tiene código ni deployment; queda
     pendiente de borrado manual desde script.google.com si se desea.
2. **Los 11 ficheros reales subidos** (`appsscript.json` + 10 `.gs` de
   `apps-script/src/`) vía `clasp push`, verificado con
   `clasp show-file-status` antes de subir (para no arrastrar
   `tests/`/`README.md`, que Apps Script no necesita).
3. **`appsscript.json` restaurado** tras que `clasp create-script`
   sobrescribiera el manifiesto real (Europe/Madrid, `oauthScopes`,
   `webapp.executeAs`/`access`) con el manifiesto por defecto de Google —
   detectado y corregido con `git checkout HEAD --` antes de continuar
   (verificado `git diff main` vacío tras la corrección).
4. **Deployment de Web App creado** vía `clasp create-deployment`:
   versión `@1`, descripción `"NUTRILONGX Standalone Backend v1 - Phase
   2A"`. Deployment ID real registrado localmente (no commiteado, mismo
   criterio que el `scriptId` — sección 47/53 del encargo: no persistir el
   identificador de deployment en Git, solo documentar aquí que existe).
5. **Verificación Supabase live vía MCP** (sin pasar por Apps Script):
   - `list_projects` confirma `muyqbqbyvysgqasllgni` /
     `nutrilongx-health-dashboard` / `ACTIVE_HEALTHY` / `eu-central-1` —
     coincide con la documentación previa. **Target project match: PASS**
     (sección 8 del encargo).
   - `get_advisors(type=security)`: **17/17 tablas standalone con
     `rls_enabled_no_policy` a nivel `INFO`, 0 `WARN`** — coincide
     exactamente con lo certificado en Fase 1.
   - Counts baseline vía `execute_sql` (antes de cualquier prueba):
     `recipes=58, exercises=24, exercise_variants=20, canonical_actions=119,
     exercise_safety_rules=12, content_action_bindings=207, mind_content=40`
     (coincide exactamente con el canon); `clients=0, client_profiles=0,
     client_content_assignments=0, execution_evidence=0, action_logs=0,
     client_progress=0, daily_progress=0, audit_log=0` — sin ningún fixture
     de test previo, estado limpio confirmado.

### Los dos bloqueos reales de plataforma (no de credenciales)

1. **Script Properties no configurables sin un toggle interactivo previo.**
   `clasp run-function` (el único mecanismo no interactivo para invocar
   código y fijar `PropertiesService` de forma remota) requiere que la
   "Google Apps Script API" esté habilitada a nivel de cuenta — un
   interruptor exclusivo de la UI web en
   `script.google.com/home/usersettings`, sin equivalente de API/CLI.
   Se probó una función temporal (`ZZ_TempSetup.gs`, nunca commiteada,
   subida y retirada en la misma sesión — verificado con `clasp push -f`
   mostrando de nuevo exactamente los 11 ficheros reales tras retirarla) y
   `clasp run-function` devolvió: *"Unable to run script function. Please
   make sure you have permission to run the script function."* — el error
   exacto que documenta este límite, no un fallo de autenticación general
   (el `clasp show-authorized-user` sigue confirmando sesión válida).
2. **El Web App recién desplegado devuelve `HTTP 403`** incluso a
   `doGet` (que no requiere ninguna Script Property). Cabeceras de
   respuesta (`Server: ESF`, página HTML de Google, no JSON) indican el
   comportamiento conocido de Apps Script: un Web App público
   (`access: ANYONE_ANONYMOUS`) recién publicado por primera vez requiere
   que el propietario lo abra **una vez en un navegador real** y complete
   la pantalla de autorización/publicación antes de que sirva tráfico
   anónimo — no hay forma de completar ese paso vía API/CLI.

Ninguno de los dos bloqueos es un problema del código de Fase 2A (que
sigue siendo el mismo, 58/58 tests locales PASS, sin cambios en esta
sesión) ni requiere modificar `apps-script/src/**`. Son, ambos,
formalidades de cuenta/consentimiento de Google que solo un humano con
acceso a un navegador puede completar una vez.

### Por qué no se generó/fijó un valor real de `SUPABASE_SERVICE_ROLE_KEY`

Incluso si el bloqueo (1) no existiera, esta sesión **no dispone de
ninguna vía** para obtener el valor real de `SUPABASE_SERVICE_ROLE_KEY`:
las herramientas Supabase disponibles exponen deliberadamente solo
`get_publishable_keys` (anon/publishable), nunca el service role; las
herramientas Vercel disponibles no exponen lectura de variables de entorno
ya configuradas. Esto es una frontera de seguridad correcta que **no se ha
intentado rodear** — ni pidiendo el valor por chat (prohibido
explícitamente por el encargo), ni mediante ninguna vía indirecta.

## 13. Limitations (vigentes tras el intento de deploy)

- **Google Apps Script API** no habilitada a nivel de cuenta — bloquea
  cualquier configuración remota de Script Properties sin paso interactivo
  en navegador.
- **Web App público** requiere una visita única del propietario en
  navegador antes de servir tráfico anónimo — bloquea toda verificación
  HTTP funcional (`doGet` incluido).
- **`SUPABASE_SERVICE_ROLE_KEY`** no obtenible por ninguna herramienta
  disponible — bloquearía igualmente las pruebas `clients.*`/`content.*`
  aunque los dos puntos anteriores se resolvieran.
- Ningún test se ha ejecutado contra el Web App real ni contra Supabase
  real a través de Apps Script — todos los 58 tests siguen siendo
  locales/con fakes (sección 9).
- El resto de limitaciones ya documentadas (sin RBAC real, sin paginación
  por cursor real, sin resumen de variants en `listExercises`) siguen
  vigentes sin cambios.

## 14. Deployment status

```yaml
apps_script_deployed: true          # proyecto + código + deployment de Web App reales existen
live_verified: false                # el Web App no sirve trafico (HTTP 403, paso interactivo pendiente)
script_properties_configured: false # bloqueado por el toggle de API a nivel de cuenta
```

## 15. Next state

```text
APPS_SCRIPT_2A_IMPLEMENTED_PENDING_DEPLOY
```

No cambia respecto a la versión anterior de este informe. `apps_script_deployed`
pasa a `true` porque ahora existe, verificablemente, un proyecto Apps
Script real con el código de Fase 2A desplegado como Web App — pero
`live_verified` se mantiene en `false` porque ese Web App todavía no sirve
tráfico, y no se ha ejecutado ni una sola prueba HTTP contra él. No se
declara `READY_FOR_EVIDENCE_IMPLEMENTATION`: sería falsificar una
verificación que no ha ocurrido.

### Los 2 pasos manuales exactos que faltan (ambos requieren navegador)

1. Con la cuenta `nutrilongx@gmail.com` (o la que sea propietaria del
   script), abrir `script.google.com/home/usersettings` y habilitar
   "Google Apps Script API".
2. Abrir la URL del Web App desplegado (`https://script.google.com/macros/s/<deploymentId>/exec`
   — `<deploymentId>` disponible localmente vía `clasp list-deployments`,
   no commiteado en este informe por la sección 47 del encargo) una vez en
   el navegador con esa misma cuenta, y completar cualquier pantalla de
   autorización/publicación que aparezca.

### Proceso recomendado tras completar esos 2 pasos

3. Configurar las 3 Script Properties reales (`SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DASHBOARD_API_KEY`) — vía la UI de Apps
   Script directamente, o vía `clasp run-function` una vez habilitada la
   API del paso 1.
4. Probar `doGet` (health-check) y luego `doPost` con `clients.create`
   usando el fixture `NLX-TEST-2A-001` (nunca un cliente real).
5. Repetir el mismo `doPost` una segunda vez y confirmar que no se duplica
   (idempotencia real, no solo con fakes).
6. Confirmar en Supabase (vía MCP o SQL directo) que `execution_evidence`,
   `action_logs`, `client_progress`, `daily_progress` siguen en 0 tras las
   pruebas.
7. Solo entonces, actualizar el estado a
   `READY_FOR_EVIDENCE_IMPLEMENTATION`.
