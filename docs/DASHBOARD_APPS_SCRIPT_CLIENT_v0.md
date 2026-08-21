# Dashboard — Cliente del contrato Apps Script (v0)

**Estado**: `IMPLEMENTED`, sin consumidores todavía (ninguna pantalla usa
esto — PR-01 es solo la capa base).
**Rol de este repo en esta pieza**: Dashboard como **consumidor** del
contrato Apps Script. No construye backend, no modifica Apps Script, no
toca Supabase.
**Fuente de verdad del contrato**:
`nutrilongx/governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md`.

---

## 1. Patrón: Browser → Vercel API (proxy) → Apps Script

```text
Componente/página (browser)
        │  fetch('/api/apps-script', { function, payload })
        ▼
src/services/appsScriptContract.ts :: callContract()
        │  POST same-origin, sin secretos
        ▼
api/apps-script.ts  (Vercel Edge Function, server-side)
        │  añade auth.dashboard_key desde process.env
        │  POST a APPS_SCRIPT_WEB_APP_URL
        ▼
Web App de Apps Script (Phase 2A/2B, LIVE_VERIFIED)
        │  HTTP 302 → Location (script.googleusercontent.com/macros/echo?...)
        ▼
api/apps-script.ts sigue el redirect manualmente con un segundo GET
        │  devuelve el envelope {ok,data,meta} / {ok,error,meta} tal cual
        ▼
Componente/página recibe `data` o captura `ContractError`
```

El navegador **nunca** ve `DASHBOARD_API_KEY` ni la URL real del Web App
de Apps Script — solo llama a su propio origen (`/api/apps-script`).

### Por qué el proxy sigue el redirect manualmente

Los Web Apps de Apps Script responden a `doPost` con un `HTTP 302` cuyo
`Location` apunta a un endpoint **GET-only** (`script.googleusercontent.com/macros/echo?...`).
Esto se verificó en vivo durante Phase 2A/2B. `api/apps-script.ts` hace
la primera petición con `redirect: 'manual'`, y si recibe un `3xx` hace
una segunda petición `GET` explícita al `Location` — el mismo patrón
validado manualmente con `curl` en las pruebas live de Phase 2A/2B.

---

## 2. Variables de entorno requeridas

Configurar en Vercel (Project Settings → Environment Variables),
**sin** prefijo `VITE_` (eso las expondría en el bundle del navegador):

| Variable | Dónde se lee | Contenido |
|---|---|---|
| `APPS_SCRIPT_WEB_APP_URL` | `api/apps-script.ts` (server-side) | URL `.../exec` del Web App desplegado |
| `DASHBOARD_API_KEY` | `api/apps-script.ts` (server-side) | Misma clave configurada como Script Property `DASHBOARD_API_KEY` en Apps Script |

Ninguna de las dos debe existir con prefijo `VITE_` en ningún fichero de
este repo. Si `api/apps-script.ts` no encuentra alguna de las dos,
responde `500 INTERNAL_ERROR` con un mensaje genérico ("Apps Script
proxy is not configured"), sin indicar cuál falta ni su valor.

---

## 3. Funciones permitidas (allowlist v0)

Enforced en **dos capas** (autoridad real: el servidor; el tipo del
cliente es solo para autocompletar/errores en compilación):

- Servidor: `ALLOWED_FUNCTIONS` en `api/apps-script.ts`.
- Cliente: `APPS_SCRIPT_ALLOWED_FUNCTIONS`/`ContractFunctionName` en
  `src/services/appsScriptContract.ts`.

```text
clients.list
clients.get
clients.create
clients.update
clients.getProfile
clients.updateProfile

content.listRecipes
content.getRecipe
content.listExercises
content.getExercise
content.listMind
content.getMindContent
content.assign
content.unassign
content.listAssignments
```

Cualquier otro nombre de función recibe `404` +
`{ok:false, error:{code:"NOT_FOUND", ...}}` desde el proxy, sin llegar
nunca a Apps Script.

### Explícitamente no disponibles (bloqueadas por diseño en esta capa)

```text
evidence.*
actions.*
gamification.*
progress.*
safety.*
```

**Nota de estado backend** (2026-08-21): `evidence.register`/`evidence.list`/
`evidence.get` ya están `APPLIED_AND_VERIFIED` en el backend real (Phase
2B, ver `nutrilongx/registry/NUTRILONGX_PROJECT_STATE_v1.md`), pero se
excluyen deliberadamente de esta allowlist por alcance explícito de este
PR (PR-01). Añadirlas es un PR de proxy trivial (una línea en cada
allowlist) — no requiere ningún cambio de arquitectura. `actions.*`/
`gamification.*`/`progress.*`/`safety.*` siguen sin existir en el
backend (`next_gate: READY_FOR_ACTION_ACCREDITATION_IMPLEMENTATION`).

---

## 4. Envelope de respuesta

Success:

```json
{ "ok": true, "data": { "...": "..." }, "meta": { "request_id": "uuid", "timestamp": "ISO-8601", "schema_version": "..." } }
```

Error:

```json
{ "ok": false, "error": { "code": "STABLE_CODE", "message": "...", "details": {} }, "meta": { "request_id": "uuid", "timestamp": "ISO-8601", "schema_version": "..." } }
```

`callContract<T>()` (`src/services/appsScriptContract.ts`) resuelve con
`data: T` en éxito, o lanza `ContractError` (con `.code`/`.details`/`.requestId`)
tanto para errores de negocio (`ok:false`) como para fallos de transporte
del propio proxy (JSON inválido, red caída, proxy sin configurar). El
consumidor debe ramificar siempre sobre `error.code`, nunca sobre texto
libre de `message`.

---

## 5. DTOs provisionales

`src/services/appsScriptDtos.ts` define `ClientListItem`, `ClientDetail`,
`ClientProfile`, `ContentItem`, `AssignmentItem` — todos marcados
`DASHBOARD_PROVISIONAL_DTO`: laxos, extensibles (`[extra: string]: unknown`),
sin pretender ser el esquema definitivo de Supabase. No usar como
sustituto de la documentación real del contrato.

---

## 6. Qué es y qué no es esto

- **Es**: la capa mínima para que el Dashboard pueda, en un PR futuro,
  construir pantallas reales (listado de clientes, ficha de cliente,
  asignación de contenido, bibliotecas por catálogo canónico) sin hablar
  con Supabase directamente ni con secretos en el navegador.
- **No es**: una pantalla, una migración de `services/*.ts` legacy, ni un
  cambio en `ContentCard.markDone`/`Stats`/`AppContext`/localStorage. Esos
  siguen intactos (`FROZEN_PROVISIONAL_INTERNAL_TOOL`, ver auditoría
  previa) hasta que se decida explícitamente migrarlos.
- **No implementa** `evidence.*`/`actions.*`/`gamification.*`/
  `progress.*`/`safety.*` — quedan bloqueadas en esta capa hasta que un
  encargo explícito lo pida.

---

## 7. Siguiente PR recomendado

Pantalla nueva de **listado de clientes** (`clients.list`), aislada, sin
tocar ninguna pantalla legacy — primer consumidor real de esta capa.
