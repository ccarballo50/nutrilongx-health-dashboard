# NUTRILONGX — Playable MVP UI Implementation Report v1

Fecha: 2026-08-21.
Estado del informe: `ACTIVE` — registra lo realmente implementado y
verificado, no es fuente de verdad de contenido (`source_of_truth:
false`).

Alcance: primer MVP jugable visible — pantalla "HOY" con flujo completo
`evidence.register → actions.accreditAndCalculate → progress.get`,
consumiendo exclusivamente el backend Apps Script real vía el proxy
server-side ya existente. **No** implementa achievements, badges,
leaderboard, social, gráficas avanzadas, IA, notificaciones, wearables,
safety completo ni las 108 reglas de acreditación restantes.

---

## 1. Hallazgo inicial — infraestructura ya existente

Antes de construir nada se auditó el repo (§0 del encargo) y se encontró
que una sesión previa (PR-01..04, `docs/DASHBOARD_APPS_SCRIPT_CLIENT_v0.md`)
ya había construido:

- `api/apps-script.ts`: proxy server-side (Vercel Edge Function) que
  añade `dashboard_key` desde `process.env` y sigue manualmente el
  patrón `POST → 302 → GET` de los Web Apps de Apps Script.
- `src/services/appsScriptContract.ts`: `callContract()` + `ContractError`,
  único punto de entrada del frontend.
- `src/services/appsScriptClientsApi.ts`/`appsScriptContentApi.ts`/
  `appsScriptDtos.ts`: wrappers tipados para `clients.*`/`content.*`.
- 3 pantallas reales ya construidas sobre esta capa: `ClientsList.tsx`,
  `ClientDetail.tsx`, `ContentCatalog.tsx`.

**Esto resuelve por completo el "GATE CRÍTICO DE SEGURIDAD" (encargo
§16/§17) sin trabajo adicional**: el navegador nunca ha conocido
`DASHBOARD_API_KEY` — vive únicamente en variables de entorno
server-side de Vercel (`APPS_SCRIPT_WEB_APP_URL`/`DASHBOARD_API_KEY`, sin
prefijo `VITE_`), leídas solo por `api/apps-script.ts`. Verificado con
grep: ningún fichero nuevo de esta fase referencia esas variables ni el
secreto. **No se declara `BLOCKED_BY_BROWSER_AUTH_BOUNDARY`** — el
bridge seguro ya existe y sigue la arquitectura aprobada.

Esta fase por tanto **extiende** esa capa existente en vez de construir
una nueva, evitando duplicar arquitectura.

## 2. Cambios en la capa de integración

- `api/apps-script.ts` / `src/services/appsScriptContract.ts`:
  allowlist ampliada con exactamente `evidence.register`,
  `actions.accreditAndCalculate`, `progress.get/getDaily/getPillar` — las
  únicas funciones que el flujo "marcar hecho" necesita.
  `gamification.*` (administrativo), `safety.*` (no implementado) y
  `actions.accredit` suelto (ya orquestado dentro de
  `accreditAndCalculate`) siguen fuera.
- `src/services/appsScriptDtos.ts`: + `EvidenceItem`, `AccreditResult`,
  `GamificationResult`, `DailyProgressSummary`,
  `AccreditAndCalculateResult`, `ProgressSummary`, `DailyProgressItem`
  (mismo patrón `DASHBOARD_PROVISIONAL_DTO` laxo ya establecido).
- Nuevos wrappers: `appsScriptEvidenceApi.ts` (`evidence.register`),
  `appsScriptActionsApi.ts` (`actions.accreditAndCalculate`, la única
  función de `actions.*`/`gamification.*` que el Dashboard invoca),
  `appsScriptProgressApi.ts` (`progress.get/getDaily/getPillar`).
- `src/services/mvpAccreditedActions.ts` (nuevo): espejo literal de la
  tabla de 11 acciones acreditables de
  `PLAYABLE_MVP_BACKEND_HANDOFF_v1.md` §2.1 — único origen de qué acción
  usa `source_content` (solo `batch_cooking`, vía `NLX-007`) vs
  `source_entity_type`/`source_entity_id` (las otras 10). No se ha
  reproducido lógica de resolución de reglas: es una tabla de datos
  citada, no una reimplementación de `actions.accredit`.
  `docs/DASHBOARD_APPS_SCRIPT_CLIENT_v0.md` actualizado para reflejar el
  estado real.

## 3. Por qué "HOY" no deriva el botón HECHO de las asignaciones reales

`client_content_assignments` (vía `content.listAssignments`, ya
consumido por `ClientDetail.tsx`) solo expone `content_id` (UUID
operacional) — no `content_type`/`canonical_id` resueltos, y
`content_action_bindings` real hoy solo cubre `recipe`/`nutrition` (ver
`NUTRILONGX_MVP_GAMIFICATION_IMPLEMENTATION_REPORT_v1.md` §2). No existe
ninguna función que resuelva de forma fiable "esta asignación corresponde
a esta de las 11 acciones acreditables". Intentar esa correspondencia en
el frontend habría significado reproducir lógica de resolución de
bindings — explícitamente prohibido (encargo §3: "no reproducir reglas de
acreditación").

**Decisión**: "HOY" presenta directamente las 11 acciones acreditables
(agrupadas por pilar, vía `mvpAccreditedActions.ts`) como la superficie
accionable con `[✓ HECHO]`. El bloque de "Asignaciones actuales" (ya
construido en `ClientDetail.tsx`) sigue disponible por enlace, sin
duplicarlo ni fingir que cada asignación genera DVG — exactamente lo que
pide el encargo §6 ("la UI no debe asumir que cada assignment genera
DVG").

## 4. Pantalla "HOY" (`pages/admin/ClientToday.tsx`)

Ruta: `/admin/clients/:clientId/today`, enlazada desde `ClientDetail.tsx`
("Ver HOY — marcar actividades y DVG").

- Cabecera "Hola, [Nombre]" (`clients.get`).
- 5 secciones por pilar (🥗 Alimentación / 🏃 Ejercicio / 😴 Sueño / 🧘
  Estrés / 🌱 Bienestar consciente), cada una con las acciones
  acreditables de ese pilar.
- Cada acción: input numérico pre-rellenado con el umbral exacto del
  handoff (editable), botón `✓ HECHO`.
- Bloque "Vida ganada": `total_dvg_hours` + desglose por pilar
  (`progress.get`), refrescado automáticamente tras cualquier `HECHO`
  que resuelva `validated`.

### Flujo "marcar hecho" (encargo §7)

```text
1. evidence.register (source_content si batch_cooking, si no source_entity_type/id)
2. si registro correcto → actions.accreditAndCalculate
3. status=validated → feedback "+ X h de vida ganada", refresca progress.get
   status=pending    → "Actividad registrada. Pendiente de validación."
   status=rejected   → "La actividad se ha registrado, pero no cumple los criterios de acreditación."
   error de transporte/negocio → mensaje genérico según error.code (nunca error.message crudo)
```

**Nota de precisión sobre el encargo §9**: `ACCREDITATION_REVIEW_REQUIRED`
y `ACCREDITATION_REJECTED` no son valores de `error.code` en el backend
real — son `data.accredit.reason` dentro de un envelope `ok:true` (el
propio backend los trata como resultado de negocio, no como fallo). El
frontend los interpreta correctamente en la rama de éxito
(`outcome.accredit.status`), no en el `catch`. Documentado aquí para que
quede explícito, no es una desviación del contrato — es cómo el backend
ya se comportaba, verificado en las fases anteriores.

### Idempotencia UI (encargo §8)

- Botón deshabilitado mientras la petición está en vuelo (estado
  `submitting` por tarjeta, no global — otras acciones siguen operables).
- `idempotency_key` determinista: `dashboard-{clientId}-
  {canonical_action_id}-{YYYY-MM-DD}` — un doble click o un reintento tras
  refrescar la página el mismo día nunca crea una segunda evidencia
  (reutiliza el mecanismo de dedup ya construido en
  `evidence.register`), y el tope diario de `max_occurrences=1` del
  backend protege igualmente la acreditación.

## 5. No level inventado (encargo §5)

`ProgressSummary.current_level` se muestra tal cual llega
(`null` hoy siempre) o se omite por completo si es `null` (`{progress.current_level
&& ...}`). Ningún componente calcula ni renderiza un nivel — verificado
por grep: las únicas apariciones de `Bronce`/`Plata`/`Oro` en el código
nuevo son dentro de un comentario explicando esta misma decisión, nunca
en lógica de render.

## 6. Legacy (encargo §15)

No se ha tocado `services/*.ts` legacy, `AppContext`, `localStorage` ni
`ContentCard.markDone`. Conviven sin conflicto — el flujo MVP nuevo vive
enteramente en `pages/admin/ClientToday.tsx` + los wrappers nuevos,
aislado del árbol de rutas mobile-first existente.

## 7. Tests

El repo no tiene framework de tests de componentes (`vitest`/`jest`) —
ninguna de las 3 pantallas admin previas (PR-01..04) lo tiene tampoco. No
se ha introducido uno nuevo en esta fase (fuera de alcance no pedido
explícitamente). Verificación aplicada:

1. **`npx tsc --noEmit`**: 0 errores nuevos — los 7 preexistentes (páginas
   legacy `Challenges.tsx`/`Mind.tsx`/`Nutrition.tsx`/`Routines.tsx`/
   `AdminTipsManager.tsx`, `api/actions/by-level.ts`, `types.ts`) no
   tocados por esta fase, confirmados idénticos antes/después.
2. **`npm run build`**: build de producción correcto (Vite), sin
   advertencias nuevas.
3. **`node apps-script/tests/run_all.mjs`**: **154/154 PASS** — el backend
   no se ha tocado en esta fase, regresión completa intacta.
4. **`scripts/nutrilongx/smoke_test_dashboard_proxy.mjs`** (nuevo): smoke
   test de integración real — importa y ejecuta directamente el handler
   real de `api/apps-script.ts` (no una reimplementación) contra el Web
   App de Apps Script real. Cubre la lista del encargo §19: load clients,
   select client, zero progress, progress refresh, mark done validated,
   duplicate click (idempotencia), mark done pending, API error (función
   fuera de la allowlist del proxy), auth inválida. **27/27 PASS** contra
   el backend real, cliente fixture `NLX-TEST-2A-001` — ningún paciente
   real usado.

Responsive básico no verificado automáticamente (no hay entorno de
navegador en esta sesión) — el layout reutiliza `max-w-xl mx-auto` +
Tailwind ya usado en las 3 pantallas admin previas, mismo patrón, mismo
riesgo que ellas.

## 8. Resultado de la verificación (real, vía smoke test + Security Advisor)

| # | Prueba | Resultado |
|---|---|---|
| 1 | `clients.list`/`clients.get` a través del proxy real | PASS |
| 2 | `progress.get` sobre cliente sin progreso (UUID válido, nunca visto) | PASS — estado cero, `ok:true`, nunca `NOT_FOUND` |
| 3 | `progress.get` sobre el fixture real | PASS — `total_dvg_hours` numérico, 5 pilares presentes |
| 4 | Flujo completo validated (`evidence.register` + `accreditAndCalculate`) | PASS — `status=validated`, `event_dvg_hours` numérico, `daily_progress.total_dvg_hours>0` |
| 5 | Doble click (mismo `evidence_id`, 2 llamadas seguidas) | PASS — segunda `idempotent:true`, mismo `action_log_id` |
| 6 | Flujo pending (acción real de las 119 sin regla MVP) | PASS — `status=pending`, `gamification:null`, `daily_progress:null` |
| 7 | Función fuera de la allowlist del proxy (`gamification.calculateAction`) | PASS — `HTTP 404` + `NOT_FOUND`, nunca llega a Apps Script |
| 8 | `dashboard_key` inválida | PASS — `UNAUTHORIZED` |
| 9 | Security Advisor | PASS — 17/17 `INFO`, **0 `WARN`**, sin cambios |

**9/9 bloques de verificación PASS** (27 aserciones individuales en el
smoke test).

## 9. Seguridad

- `direct_supabase_reads_added`: **NO** — cero imports de
  `@supabase/supabase-js` en el código nuevo (verificado por grep).
- `browser_secret_exposed`: **NO** — verificado por grep, solo
  `api/apps-script.ts` (server-side) referencia `DASHBOARD_API_KEY`/
  `APPS_SCRIPT_WEB_APP_URL`.
- `dashboard_api_key_in_bundle`: **NO** — nunca con prefijo `VITE_`, nunca
  en `import.meta.env` en ningún fichero nuevo.
- `secrets_committed`: **NO** — secret scan sobre el diff antes de
  commit, sin hallazgos. La clave real usada para el smoke test se leyó
  de un fichero local fuera del repo, nunca impresa/logueada.
- RLS sin relajar, sin políticas nuevas.

## 10. Limitaciones

- Sin tests de componentes automatizados (no hay framework en el repo,
  no introducido en esta fase — ver §7).
- El bloque "Asignaciones actuales" de `ClientDetail.tsx` sigue siendo
  informativo, no accionable — coherente con el alcance actual del
  backend (§3).
- `progress.getDaily`/`progress.getPillar` están implementados en la
  capa de servicio (`appsScriptProgressApi.ts`) pero **no** tienen
  todavía una pantalla propia — "HOY" solo usa `progress.get`. Construir
  un histórico visual es trabajo de una fase posterior explícita (fuera
  del happy path §11 del encargo).
- Responsive no verificado en navegador real (sin entorno gráfico en esta
  sesión) — mismo riesgo que las 3 pantallas admin previas.

## 11. Siguiente estado

```text
PLAYABLE_MVP_READY_FOR_PILOT
```

Un profesional puede: abrir el Dashboard → seleccionar un cliente de
prueba → ver "HOY" → marcar una actividad como hecha → recibir feedback
inmediato → ver el DVG actualizado — todo sobre el backend real, sin
Supabase console, sin editor de Apps Script, sin CLI, sin intervención
técnica. Verificado extremo a extremo vía el smoke test de integración
real (§7-8).
