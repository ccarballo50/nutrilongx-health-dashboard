# Dashboard — Cliente del contrato Apps Script (v0)

**Estado**: `IMPLEMENTED`, con consumidores reales desde PLAYABLE MVP UI
INTEGRATION (2026-08-21): `pages/admin/ClientsList.tsx`,
`ClientDetail.tsx`, `ContentCatalog.tsx` (PR-01..04, solo lectura) y
`pages/admin/ClientToday.tsx` (flujo "marcar hecho" completo:
`evidence.register` → `actions.accreditAndCalculate` → `progress.get`).
**Rol de este repo en esta pieza**: Dashboard como **consumidor** del
contrato Apps Script. No construye backend, no modifica Apps Script, no
toca Supabase.
**Fuente de verdad del contrato**:
`nutrilongx/governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md`
y, para el flujo "marcar hecho",
`nutrilongx/governance/implementation/PLAYABLE_MVP_BACKEND_HANDOFF_v1.md`.

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

## 3. Funciones permitidas (allowlist, actualizada — PLAYABLE MVP UI INTEGRATION)

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

evidence.register

actions.accreditAndCalculate

progress.get
progress.getDaily
progress.getPillar
```

Cualquier otro nombre de función recibe `404` +
`{ok:false, error:{code:"NOT_FOUND", ...}}` desde el proxy, sin llegar
nunca a Apps Script.

### Explícitamente no disponibles (bloqueadas por diseño en esta capa)

```text
evidence.list
evidence.get
actions.list
actions.get
actions.accredit          (suelto -- el Dashboard usa accreditAndCalculate)
actions.listLogs
actions.getLog
gamification.*             (administrativo/reparación, no flujo de usuario)
safety.*                   (no implementado en backend todavía)
```

**Historial**: PR-01 (2026-08-20) dejó `evidence.*`/`actions.*`/
`gamification.*`/`progress.*`/`safety.*` fuera por alcance explícito,
aunque `evidence.register` ya estaba `APPLIED_AND_VERIFIED` en el
backend. **PLAYABLE MVP UI INTEGRATION** (2026-08-21) añadió exactamente
`evidence.register`, `actions.accreditAndCalculate` y `progress.get/
getDaily/getPillar` — las únicas funciones que el flujo "marcar hecho"
necesita (ver
`nutrilongx/governance/implementation/PLAYABLE_MVP_BACKEND_HANDOFF_v1.md`).
`actions.accreditAndCalculate` ya orquesta `accredit → calculateAction →
recalculateDay` en una sola llamada server-side, por eso ni
`actions.accredit` suelto ni `gamification.*` se añaden a esta capa.

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
`ClientProfile`, `ContentItem`, `AssignmentItem`, y (desde PLAYABLE MVP UI
INTEGRATION) `EvidenceItem`, `AccreditResult`, `GamificationResult`,
`DailyProgressSummary`, `AccreditAndCalculateResult`, `ProgressSummary`,
`DailyProgressItem` — todos marcados `DASHBOARD_PROVISIONAL_DTO`: laxos,
extensibles (`[extra: string]: unknown`), sin pretender ser el esquema
definitivo de Supabase. No usar como sustituto de la documentación real
del contrato. `src/services/mvpAccreditedActions.ts` espeja, literal, la
tabla de las 11 acciones acreditables de
`PLAYABLE_MVP_BACKEND_HANDOFF_v1.md` §2.1 — es la única fuente de qué
acción usa `source_content` vs `source_entity_type`/`source_entity_id`.

---

## 6. Qué es y qué no es esto

- **Es**: la capa que permite al Dashboard construir pantallas reales
  (listado de clientes, ficha de cliente, bibliotecas por catálogo
  canónico, y desde PLAYABLE MVP UI INTEGRATION el flujo completo "marcar
  hecho" con DVG/progreso real) sin hablar con Supabase directamente ni
  con secretos en el navegador.
- **No es**: una migración de `services/*.ts` legacy, ni un cambio en
  `ContentCard.markDone`/`Stats`/`AppContext`/localStorage. Esos siguen
  intactos (`FROZEN_PROVISIONAL_INTERNAL_TOOL`, ver auditoría previa)
  hasta que se decida explícitamente migrarlos — pueden convivir con el
  nuevo adaptador durante la transición.
- **No implementa** `evidence.list/get`, `actions.list/get/accredit/
  listLogs/getLog`, `gamification.*`, `safety.*` — ver sección 3 para el
  detalle de qué queda fuera y por qué.
- El Dashboard **nunca** calcula DVG ni reproduce reglas de acreditación
  — solo interpreta `data.accredit.status` (`validated`/`pending`/
  `rejected`) devuelto por `actions.accreditAndCalculate`.

---

## 7. Consumidores reales

| Pantalla | Funciones que consume |
|---|---|
| `pages/admin/ClientsList.tsx` | `clients.list` |
| `pages/admin/ClientDetail.tsx` | `clients.get`, `clients.getProfile`, `content.listAssignments` |
| `pages/admin/ContentCatalog.tsx` | `content.listRecipes/listExercises/listMind` |
| `pages/admin/ClientToday.tsx` | `clients.get`, `evidence.register`, `actions.accreditAndCalculate`, `progress.get` |

Smoke test de integración real (proxy real contra Apps Script real, sin
framework de componentes en el repo):
`scripts/nutrilongx/smoke_test_dashboard_proxy.mjs`.
