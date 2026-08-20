# NUTRILONGX — Apps Script Service Layer

Fase 2A: **Foundation + `clients.*` + `content.*`**. Implementa el service/
function layer standalone definido en
`nutrilongx/governance/architecture/NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md`
y autorizado como capa de servicio en
`nutrilongx/governance/decisions/NUTRILONGX_STANDALONE_ARCHITECTURE_DECISION_v1.md`.

```text
Dashboard  →  Apps Script (este código)  →  Supabase (standalone v1)
```

**No incluye** `evidence.*`, `actions.*`, `gamification.*`, `progress.*`,
`safety.*` — eso es una fase posterior. No calcula DVG, no toca gamificación.

---

## 1. Estructura

```text
apps-script/
  appsscript.json          manifiesto del proyecto Apps Script
  src/
    Errors.gs               PURO — jerarquia de errores del contrato
    Response.gs              PURO — envelopes de exito/error
    Validation.gs            PURO — validadores reutilizables
    Config.gs                Google: PropertiesService (Script Properties)
    SupabaseClient.gs        Google: UrlFetchApp -> Supabase PostgREST
    Audit.gs                 escribe audit_log (via SupabaseClient)
    ClientsService.gs        clients.* (fabrica con inyeccion de deps)
    ContentService.gs        content.* (fabrica con inyeccion de deps)
    Router.gs                 PURO — allowlist explicita, sin eval
    Main.gs                   doGet/doPost — unicos entry points reales
  tests/
    lib/load_gs.mjs           carga .gs en un vm de Node para testear
    lib/tiny_test.mjs         runner minimo (sin nueva dependencia npm)
    *.test.mjs                 tests (ver seccion 6)
    run_all.mjs                ejecuta toda la suite
  README.md                   este fichero
```

"PURO" = no llama a ningún servicio de Apps Script (`PropertiesService`,
`UrlFetchApp`, `Utilities`, `ContentService` nativo) — por eso es cargable y
testeable directamente en Node.

## 2. Cómo configurar Script Properties

**Nunca** se commitea un valor real. En el editor de Apps Script:
`Project Settings` → `Script Properties` → añadir:

| Key | Qué es |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase (la misma que `SUPABASE_URL` en Vercel) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase. Máximo privilegio — nunca en logs, nunca en respuestas |
| `DASHBOARD_API_KEY` | Clave compartida que el Dashboard debe enviar para autenticarse (ver sección 4) |

Si falta cualquiera, `getRequiredConfig()` (`Config.gs`) falla de forma
segura (`INTERNAL_ERROR` genérico al cliente; el detalle de qué falta solo
va al log interno de Apps Script — nunca a la respuesta HTTP).

## 3. Cómo desplegar

1. Crear un proyecto Apps Script nuevo (script.google.com) o vincularlo vía
   `clasp` a este directorio `apps-script/`.
2. Copiar/subir `appsscript.json` y todos los `src/*.gs`.
3. Configurar las 3 Script Properties (sección 2).
4. `Deploy` → `New deployment` → tipo **Web app**.
   - `Execute as`: **Me** (el propietario del script) — coincide con
     `"executeAs": "USER_DEPLOYING"` de `appsscript.json`.
   - `Who has access`: **Anyone** — coincide con
     `"access": "ANYONE_ANONYMOUS"`.

     Esto es **necesario, no un descuido de seguridad**: el Dashboard es un
     cliente externo sin cuenta Google, así que Apps Script no puede
     restringir el acceso "a nivel de plataforma" por identidad de Google.
     La autenticación real la hace el propio script leyendo
     `auth.dashboard_key` del cuerpo de cada petición (sección 4) — Apps
     Script solo controla "quién puede invocar el script en absoluto", no
     "qué puede hacer una vez invocado".
5. Copiar la URL `.../exec` resultante — es el endpoint que usará el
   Dashboard.

No hay `clasp push` automatizado en este PR — el despliegue real requiere
credenciales de Google que no están disponibles en el entorno de ejecución
de Claude Code (ver el informe de implementación).

## 4. Contrato HTTP

**Todo** (lecturas incluidas) va por `POST` a la URL `.../exec`, con
`Content-Type: text/plain;charset=utf-8` (no `application/json` — ver
sección 5, limitación de CORS) y este cuerpo:

```json
{
  "function": "clients.create",
  "auth": { "dashboard_key": "..." },
  "payload": { "external_code": "NLX-C-0001", "first_name": "Nombre" }
}
```

Respuesta, siempre HTTP 200 a nivel de transporte (ver sección 5), con
envelope:

```json
{ "ok": true, "data": { "client": { "...": "..." } }, "meta": { "request_id": "...", "timestamp": "...", "schema_version": "NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1" } }
```

o

```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} }, "meta": { "...": "..." } }
```

**El Dashboard debe mirar siempre `body.ok` y `body.error.code`**, nunca el
código HTTP de transporte.

### `doGet`

Solo un health-check estático (`{"ok":true,"data":{"status":"healthy",...}}`),
sin autenticación, sin datos de negocio. Ninguna función del contrato se
invoca por `GET`.

## 5. Limitaciones reales de la plataforma (no inventadas, documentadas)

Estas tres decisiones de diseño existen **porque Apps Script Web Apps no
soportan lo contrario** — no son elecciones arbitrarias:

1. **No hay `e.headers` en `doGet(e)`/`doPost(e)`.** No se puede leer un
   header `X-Admin-Key`. Por eso la autenticación viaja en el cuerpo
   (`auth.dashboard_key`), nunca en un header ni en query string.
2. **No hay `doOptions()`.** Un Web App de Apps Script no puede responder a
   un preflight CORS. Por eso el Dashboard debe enviar el `POST` con
   `Content-Type: text/plain` (no `application/json`): así el navegador lo
   trata como "simple request" y no dispara preflight. El cuerpo sigue
   siendo un JSON válido — Apps Script lo recibe como texto crudo
   (`e.postData.contents`) y este código lo parsea con `JSON.parse`.
3. **`ContentService.createTextOutput` no permite fijar un código HTTP de
   negocio distinto de 200.** Toda ejecución de script correcta responde
   HTTP 200 a nivel de transporte, tenga éxito o error de negocio — de ahí
   que el contrato ya sea "siempre 200 + envelope `ok`".

No se ha intentado simular soporte de CORS/headers que la plataforma no
tiene.

## 6. Tests

```bash
node apps-script/tests/run_all.mjs
```

58/58 PASS en este repositorio (ver
`nutrilongx/governance/implementation/NUTRILONGX_APPS_SCRIPT_PHASE2A_IMPLEMENTATION_REPORT_v1.md`
para el detalle). Cubre:

- `Validation.gs`, `Response.gs`, `Errors.gs`, `Router.gs`: puro, sin fakes.
- `ClientsService.gs`, `ContentService.gs`: con dependencias fake en
  memoria (sin Supabase real) — idempotencia de `clients.create` y
  `content.assign`, rechazo de campos inesperados, rechazo de
  `current_level`, rechazo de alias legacy de pilar (`mind`, `Sueño`...),
  `content.unassign` cancela sin borrar.
- `Main.gs` end-to-end: con `PropertiesService`/`UrlFetchApp`/`Utilities`/
  `ContentService` nativos **stubeados** (no reales) — verifica que todo el
  stack (auth → routing → servicio → cliente Supabase → audit) funciona
  junto, incluida la comprobación de que la service-role key y la
  dashboard key nunca aparecen en el cuerpo de la respuesta.

No hay tests contra un proyecto Apps Script/Supabase real desplegado — eso
requiere credenciales que no están disponibles en este entorno (ver el
informe de implementación, sección "Deployment").

## 7. No usar como proxy genérico

`SupabaseClient.gs` (`sbSelect`/`sbInsert`/`sbUpdate`/`sbUpsert`) es de uso
interno del script. `Router.gs` **nunca** expone estas funciones
directamente al Dashboard — solo las 15 funciones de dominio
(`clients.*`, `content.*`) declaradas explícitamente en
`buildRoutes()`. No se acepta SQL, nombre de tabla, ni filtro arbitrario
desde el Dashboard.
