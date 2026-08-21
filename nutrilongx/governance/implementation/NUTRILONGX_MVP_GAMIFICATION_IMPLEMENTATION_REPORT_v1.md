# NUTRILONGX — MVP Gamification Implementation Report v1

Fecha: 2026-08-21.
Estado del informe: `ACTIVE` — registra lo realmente implementado y
verificado en real, no es fuente de verdad de contenido
(`source_of_truth: false`).

Alcance: `gamification.calculateAction/recalculateDay/rebuildProgress`,
`progress.get/getDaily/getPillar`, `actions.accreditAndCalculate`
(`GamificationService.gs`, `ProgressService.gs`, extensión de
`ActionsService.gs`). **No** implementa `safety.*` ni las 108 reglas de
acreditación restantes — confirmado por grep y en real.

---

## 1. Objetivo y resultado

Hacer visible por primera vez DVG y progreso real:
`validated ACTION_LOG → gamification.calculateAction →
gamification.recalculateDay → client_progress/daily_progress →
progress.get/getDaily/getPillar`. **Conseguido y verificado en real**:
primer DVG real del sistema (1.0h), primer `daily_progress`/
`client_progress` reales, orquestación completa
(`actions.accreditAndCalculate`) probada de extremo a extremo en un solo
call real.

## 2. Clasificación de mecanismos del motor canónico (encargo sección 9)

Fuente: `NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json`. Clasificación
completa documentada también en la cabecera de `GamificationService.gs`.

### A — necesarios e IMPLEMENTADOS

| Mecanismo | Implementación |
|---|---|
| `base_dvg` (step 1) | Snapshot de `action_logs.base_dvg_hours`, re-verificado contra `canonical_actions.data.level_variants` en cada cálculo — nunca recalculado desde una heurística. |
| `streaks.daily` (step 2) | Fórmula canónica exacta `min(1+k·s, 1+cap)` (k=0.02, cap=0.2). `s` derivado en real de días consecutivos previos con ≥1 `action_log` `validated` del mismo `canonical_actions.domain` para ese cliente (ventana acotada de 14 días). Para todo fixture MVP actual (eventos aislados, primera vez) resuelve `s=0` → multiplicador=1.0 — verificado en real y con test dedicado de streak=2 días (multiplicador=1.04). |
| `daily_caps` (parte de step 5) | Techo diario por dominio legacy + techo global, con reducción **proporcional** si se supera — única interpretación determinista de aplicar un techo a una suma ya calculada. Mapa dominio→clave de cap tomado literalmente de `legacy_pillar` en el catálogo canónico. Verificado con test dedicado (3 acciones de 1.5h en dominio `mind`, cap 4.0 → reducción proporcional exacta a 4.0). |

### B — no disparado por ningún fixture MVP actual, NO implementado en código

- `boosters."Weekend Warrior"`: exige ≥90 min de actividad de movimiento el mismo día; ninguna de las 11 reglas MVP produce por sí sola más de ~20 min por evento, y no hay composición de varios eventos implementada.

### C — requiere datos/condiciones inexistentes, o semántica ambigua sobre el modelo actual

- `boosters."Coach Check"/"Social Buddy"/"Recovery Perfect"`: ningún campo de `execution_evidence`/`action_logs` captura `coach_verified`/`community_challenge_participation`/condiciones cruzadas sueño+alcohol+rutina.
- `combos.*` (4): conceptos no definidos por ningún artefacto canónico leído (`sleep_goal_achieved`, `diet_day_level`), o estructuralmente imposibles con las 11 reglas MVP (`Cardio + Fuerza` sin ninguna regla `movement.strength`; `All 4 pilares` sin composición multi-acción).
- `weekly_multipliers` (4) y `weekly_cap`: **confirmación canónica directa** — el propio esquema real (`supabase/migrations/0002_standalone_backend_v1.sql`, comentario de `daily_progress`) declara explícitamente *"weekly_progress NO se crea en v1 — multiplicadores/caps semanales se representan via calculation_trace/rebuild sin tabla dedicada"*.
- `diminishing_returns`: los umbrales (`minutes_per_day`/`actions_per_day`) operan sobre una acumulación continua; el modelo de acreditación MVP otorga un `base_dvg_hours` **fijo por evento discreto** ya acreditado — aplicar el mecanismo exigiría decidir qué fracción de qué evento se recorta, decisión no resuelta por ningún artefacto canónico. No se inventa. Además, estructuralmente lejos de los umbrales (180 min/día movement, 6-8 acciones/día) con `max_occurrences=1/día` en las 11 reglas MVP.

`legacy_deprecated.level_multiplier`: **excluido** por decisión de gobernanza (DECISION_1) — nunca se aplica, verificado con test dedicado.

`simplified_parallel_engine: NO` — lo implementado (A) sigue la fórmula canónica exacta sobre datos reales; lo no implementado (B/C) queda documentado, no sustituido.

## 3. `gamification.calculateAction(action_log_id)`

1. Carga `action_log`; si `status != validated` → `DATA_INTEGRITY_ERROR` (nunca DVG desde `pending`/`rejected`).
2. Re-verifica consistencia: `level_variant` debe existir en `canonical_actions.data.level_variants` y su `base_dvg_hours` debe coincidir exactamente con el snapshot — cualquier deriva → `DATA_INTEGRITY_ERROR`, **nunca se recalcula retroactivamente**.
3. Idempotencia: si `action_logs.provenance.gamification.calculation_version` ya coincide con la versión actual, devuelve el resultado cacheado sin recomputar ni reescribir.
4. Calcula `event_dvg_hours = base_dvg_hours × streak_multiplier` y persiste en `action_logs.provenance.gamification` (lectura-fusión-escritura del jsonb existente — nunca se toca `base_dvg_hours`/`engine_version`/`calculation_version` de nivel superior, que siguen describiendo la *acreditación*, no la gamificación).
5. `engine_version="NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.0.0"` (compuesto literal de `schema`+`version` del JSON canónico) / `calculation_version="MVP_GAMIFICATION_MINIMAL_v1"` — nunca `"mvp"`/`"simple"`/`"v0"` como sustituto arbitrario.

## 4. `gamification.recalculateDay(client_id, date)`

Deriva exclusivamente desde `action_logs` `validated` de ese cliente/día (nunca desde `daily_progress` previo). Agrupa por `canonical_actions.domain` para aplicar el cap diario (reducción proporcional si se supera), y por `execution_evidence.pillar` (fuente ya validada en `evidence.register`, **no inventada**) para escribir las filas de `daily_progress` — un `domain` puede abarcar varios pilares del dashboard (`mind` → sleep/stress/conscious_wellbeing); la reducción del cap de dominio se aplica proporcionalmente a cada evento antes de agrupar por pilar. Cap global (10.0/día) aplicado sobre la suma ya capada por dominio, con una segunda reducción proporcional si procede. `upsert` determinista (`on_conflict: client_id,date,pillar`). Reconstruye `client_progress` desde **todo** `daily_progress` del cliente (nunca desde el `client_progress` previo).

**Corrección de precisión durante el desarrollo**: la primera implementación redondeaba cada contribución individual antes de sumar, introduciendo deriva de punto flotante (3.9999 en vez de 4.0 exactos en el test del cap). Corregido: la suma se hace sin redondear paso a paso, redondeando únicamente el total final por pilar — detectado y corregido por el propio test suite antes del despliegue.

## 5. `gamification.rebuildProgress(client_id)`

Ignora las proyecciones actuales como autoridad — lee **todos** los `action_logs` `validated` del cliente, deriva las fechas distintas involucradas, y llama a `recalculateDay` para cada una (mismo núcleo reutilizado, nunca duplicado). Verificado en real y en test local: tras corromper manualmente `client_progress`/`daily_progress` con valores falsos, `rebuildProgress` los reconstruye al resultado real, ignorando por completo el valor corrupto.

## 6. `progress.get/getDaily/getPillar`

Lecturas puras. `progress.get` para un cliente sin ninguna acción validada todavía devuelve un **estado cero explícito** (`total_dvg_hours:0, by_pillar: todos 0`), nunca `NOT_FOUND` — no tener progreso aún es un estado legítimo, no un error. `progress.getPillar` reutiliza `requirePillar()` (ya existente desde Fase 2A), que ya rechazaba el alias legacy `'mind'` — verificado en real, cero código nuevo necesario para ese requisito.

## 7. `actions.accreditAndCalculate`

Orquestación exacta: `actions.accredit → validated? → gamification.calculateAction → gamification.recalculateDay`. Si `accredit` resuelve `pending`/`rejected`, gamificación **nunca** se invoca — verificado con test dedicado y en real (evidencia sin binding → `review_required`, `gamification:null`, `daily_progress:null`, cero filas nuevas en ninguna tabla de proyección).

## 8. Tests locales

`node apps-script/tests/run_all.mjs` → **154/154 PASS** (118 previos
intactos + 36 nuevos: 18 en `gamification_service.test.mjs` + 11 en
`progress_service.test.mjs` + 3 `accreditAndCalculate` en
`actions_service.test.mjs` + 4 en `main_integration.test.mjs`).

Checklist del encargo (sección 22) cubierto íntegramente: `calculateAction`
validated/pending-rejected-guard/snapshot-consistency/idempotencia/streak
real (0 y 2 días)/exclusión del `level_multiplier` legacy;
`recalculateDay` (vacío/normal/cap con reducción proporcional/upsert
determinista/fecha inválida); `rebuildProgress` (multi-día/ignora
proyecciones corruptas/validación); `progress.get/getDaily/getPillar`
(estado cero/proyección real/filtros/`mind` rechazado);
`accreditAndCalculate` (validated/pending/rejected → gamificación nunca
llamada en los dos últimos).

## 9. Deployment

- **Método**: `clasp push` (15 archivos) + `clasp version` + `clasp
  deploy --deploymentId <existente>` — mismo Web App, mismo proyecto.
- **Versión de script**: 8 ("MVP Gamification Minimal v1 -
  calculateAction/recalculateDay/rebuildProgress/progress").
- **Versión de deployment**: @9.

## 10. Resultado de la verificación live

Fixture reutilizado: los 3 `action_logs` reales creados en la ronda live
del MVP Accreditation Pack v1 (2 `validated`, 1 `rejected`), cliente
`NLX-TEST-2A-001` (`2fe63c8f-e042-458c-8101-f652aa9b7b99`), más 1
evidencia nueva registrada vía el flujo MVP real para probar
`accreditAndCalculate` de extremo a extremo — sin usar ningún paciente
real.

| # | Prueba | Resultado |
|---|---|---|
| 1 | Baseline pre-prueba | PASS — `client_progress=0, daily_progress=0` |
| 2 | `gamification.calculateAction` sobre `validated` (`mind.stress.musica_relajante_min`) | PASS — **primer DVG real del sistema**: `event_dvg_hours=1.0`, `streak_days=0`, `multiplier=1` |
| 3 | Repetición del mismo `action_log_id` | PASS — `idempotent=true`, mismo resultado exacto |
| 4 | `calculateAction` sobre el `action_log` `rejected` existente | PASS — `DATA_INTEGRITY_ERROR`, **sin DVG** |
| 5 | `calculateAction` sobre el segundo `validated` (`adherence.nutrition.batch_cooking...`) | PASS — `event_dvg_hours=0.8` |
| 6 | `gamification.recalculateDay` (cliente, `2026-08-21`) | PASS — `pillars:[stress,nutrition]`, `total_dvg_hours=1.8`, `action_logs_processed=2` |
| 7 | `progress.get` | PASS — `total_dvg_hours=1.8`, `by_pillar:{nutrition:0.8, stress:1, resto:0}`, `current_level:null` (canon no lo resuelve, no inventado) |
| 8 | `progress.getDaily` | PASS — 2 filas, coinciden exactamente con el ledger |
| 9 | `progress.getPillar` (`stress`) | PASS — 1 fila |
| 10 | `progress.getPillar` (`mind`) | PASS — `VALIDATION_ERROR`, alias legacy rechazado |
| 11 | Repetición de `recalculateDay` | PASS — mismo `total_dvg_hours=1.8`, **sin fila duplicada** (`daily_progress` sigue en 2 filas) |
| 12 | `gamification.rebuildProgress` | PASS — resultado equivalente (`total_dvg_hours=1.8`), **sin duplicar** (`client_progress` sigue en 1 fila) |
| 13 | `actions.accreditAndCalculate` extremo a extremo (evidencia nueva, `fruta_entera_pieza_s`) | PASS — `accredit.status=validated` → `gamification.event_dvg_hours=1.7` → `daily_progress.total_dvg_hours=3.5` (0.8+1.7+1.0), **un solo call real** |
| 14 | Security Advisor | PASS — 17/17 `INFO`, **0 `WARN`**, sin cambios |
| 15 | Regresión local final | PASS — 154/154 |

**15/15 puntos de verificación live PASS.**

## 11. Seguridad

`DASHBOARD_API_KEY` leída únicamente del fichero temporal local, nunca
impresa/logueada/persistida/commiteada; fichero borrado y verificado dos
veces al finalizar; secret scan sobre el diff antes de commit. `RLS` sin
relajar, sin políticas nuevas. Auditoría: `gamification.calculateAction`
(solo en la primera llamada real, no en retries idempotentes),
`gamification.recalculateDay`, `gamification.rebuildProgress` — todas
correlacionadas por `request_id`, verificadas contra `audit_log` real.

## 12. Limitaciones

- Igual que en fases anteriores: cobertura parcial (11 de 119 reglas de
  acreditación) — `gamification` solo procesa lo que `actions.accredit`
  puede validar hoy.
- `current_level` permanece siempre `null` — el canon no define una
  derivación inequívoca desde progreso acumulado; no se inventa un
  sistema de niveles.
- Mecanismos B/C (§2) no ejercitados en real — verificados exhaustivamente
  en local con fixtures sintéticos (streak de 2 días, cap superado), no
  contra datos de producción, para no fabricar historia artificial en el
  cliente de test real.
- `client_progress.streaks` (columna jsonb existente) se deja `{}` — no
  se ha definido un formato de exposición de streaks para el MVP; el
  streak SÍ se calcula y aplica correctamente en cada evento, solo no se
  cachea de vuelta en esa columna (evita inventar un formato de display
  no pedido).

## 13. Siguiente estado

```text
READY_FOR_PLAYABLE_MVP_UI_INTEGRATION
```

Con cliente + contenido + evidence + validated action_log + DVG +
progress, todos reales y verificados en vivo, el backend del MVP jugable
está completo. **No** se amplía más el backend automáticamente — ni
`safety.*`, ni gamificación completa (boosters/combos/semanal), ni las
108 reglas de acreditación restantes. El siguiente paso es la integración
del Dashboard (ver `PLAYABLE_MVP_BACKEND_HANDOFF_v1.md`), no más
construcción de backend.
