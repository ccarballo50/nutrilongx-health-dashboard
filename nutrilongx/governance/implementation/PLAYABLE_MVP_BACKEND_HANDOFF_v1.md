# NUTRILONGX — Playable MVP Backend Handoff v1

Fecha: 2026-08-21. Dirigido al equipo/chat que integra el Dashboard.
**No contiene implementación frontend** — solo describe lo que el backend
ya expone en real, para que el consumo sea responsabilidad del Dashboard.

Web App real: mismo Apps Script desplegado desde Fase 2A (deployment
`AKfycby9cVKk08omodh4DDXJIX7yzNFLwTPmmWu8I1y4z_C61ek8aI5axlalFiV1oGE6CjBt-w`,
versión de script 8, deployment @9). URL exacta y `DASHBOARD_API_KEY` ya
configuradas en Script Properties — no se repiten aquí (nunca se filtran
secretos a un documento).

---

## 1. Transporte (sin cambios desde Fase 2A)

- **Siempre POST**, incluidas las lecturas. Nunca GET para funciones de
  negocio.
- `Content-Type: text/plain` (evita el preflight CORS — Apps Script no
  implementa `doOptions()`).
- Cuerpo JSON: `{ "function": "<nombre>", "auth": { "dashboard_key":
  "<clave>" }, "payload": { ... } }`.
- Respuesta **siempre HTTP 200** a nivel de transporte — el resultado real
  va en `body.ok`/`body.error.code`, nunca en el status HTTP.
- La respuesta real llega tras un redirect 302 a una URL
  `script.googleusercontent.com` de un solo uso — seguirlo como GET
  (comportamiento por defecto de la mayoría de clientes HTTP), nunca
  forzar POST a través del redirect.

## 2. Flujo "marcar hecho" (lo que el Dashboard necesita para el MVP jugable)

```text
1. evidence.register   -- el cliente/profesional registra que hizo algo
2. actions.accreditAndCalculate  -- UNA llamada: acredita + calcula DVG + progreso
3. progress.get / progress.getDaily / progress.getPillar  -- leer el resultado
```

**Usar `actions.accreditAndCalculate`, no `actions.accredit` +
`gamification.calculateAction` por separado**, salvo que el Dashboard
necesite inspeccionar el resultado de la acreditación antes de decidir si
calcular (`actions.accredit` sigue disponible suelto para ese caso).

### 2.1. `evidence.register`

```json
{
  "function": "evidence.register",
  "auth": { "dashboard_key": "..." },
  "payload": {
    "client_id": "uuid",
    "source_type": "dashboard",
    "occurred_at": "2026-08-21T12:00:00Z",
    "pillar": "exercise",
    "duration_minutes": 20,

    "source_entity_type": "canonical_action",
    "source_entity_id": "movement.cardio.caminata_vigorosa_min"
  }
}
```

Dos formas de decir "de qué es evidencia" — **mutuamente excluyentes**,
usar solo una:

- **Contenido asignado** (recetas hoy): `source_content: {content_type:
  "recipe", canonical_id: "NLX-007"}` — el `pillar` se deriva
  server-side, no hace falta enviarlo.
- **Acción canónica directa** (necesario para exercise/sleep/stress/
  conscious_wellbeing hoy, ya que no hay contenido asignado a esas
  acciones todavía): `source_entity_type: "canonical_action"` +
  `source_entity_id: "<canonical_action_id>"` — `pillar` es obligatorio
  explícito en este caso.

**Los 11 `canonical_action_id` con regla de acreditación activa hoy**
(única lista con la que `accreditAndCalculate` puede llegar a
`validated`):

| canonical_action_id | pilar | condición para `validated` |
|---|---|---|
| `adherence.nutrition.batch_cooking_saludable_h_sem` | nutrition | vía `source_content` (receta `NLX-007`), `duration_minutes >= 120` |
| `nutrition.hydration.agua_l_dia` | nutrition | `quantity >= 2.5` |
| `nutrition.mediterranean_pattern.fruta_entera_pieza_s` | nutrition | `quantity >= 1` |
| `movement.cardio.caminata_vigorosa_min` | exercise | `duration_minutes >= 18` |
| `movement.mobility.yoga_fluido_min` | exercise | `duration_minutes >= 11` |
| `mind.sleep.cierre_digital_min_antes_de_dormir` | sleep | `duration_minutes >= 60` |
| `mind.sleep.tiempo_en_cama_h` | sleep | `420 <= duration_minutes <= 540` |
| `mind.stress.musica_relajante_min` | stress | `duration_minutes >= 10` |
| `mind.stress.respiracion_durante_min` | stress | `duration_minutes >= 3` |
| `mind.emotional_wellbeing.meditacion_mindfulness_min` | conscious_wellbeing | `duration_minutes >= 15` |
| `mind.emotional_wellbeing.mindful_walk_min_sin_movil` | conscious_wellbeing | `duration_minutes >= 10` |

Cualquier otro `canonical_action_id` (de las 119 familias del catálogo)
puede registrarse como evidencia, pero `accreditAndCalculate` devolverá
`status: "pending", reason: "ACCREDITATION_REVIEW_REQUIRED"` — **no es un
error**, significa que esa acción todavía no tiene regla de acreditación
MVP. El Dashboard debe tratar `pending` como "en revisión", nunca como
fallo.

### 2.2. `actions.accreditAndCalculate`

```json
{ "function": "actions.accreditAndCalculate", "auth": {...}, "payload": { "evidence_id": "uuid" } }
```

Tres desenlaces posibles en `data.accredit.status`:

- **`"validated"`**: `data.gamification.event_dvg_hours` tiene el DVG
  ganado por ese evento; `data.daily_progress` tiene el resumen del día
  ya actualizado. **DVG y progreso ya están persistidos** — no hace falta
  llamar a nada más.
- **`"rejected"`**: la acción tiene regla pero la evidencia no cumplió la
  condición (p. ej. duración insuficiente). `data.gamification: null`.
  Mostrar al usuario por qué no contó (usar el mensaje/condición de la
  tabla de arriba).
- **`"pending"`** (`reason: "ACCREDITATION_REVIEW_REQUIRED"`): sin regla
  MVP para esa acción todavía. `data.gamification: null`. No es un error
  del usuario.

## 3. Leer DVG / progreso

### 3.1. `progress.get` — resumen total del cliente

```json
{ "function": "progress.get", "auth": {...}, "payload": { "client_id": "uuid" } }
```

```json
{
  "client_id": "uuid",
  "total_dvg_hours": 3.5,
  "total_dvg_days": 0.15,
  "current_level": null,
  "by_pillar": { "nutrition": 2.5, "exercise": 0, "sleep": 0, "stress": 1, "conscious_wellbeing": 0 },
  "updated_at": "2026-08-21T11:13:40.146Z"
}
```

Un cliente sin ninguna acción validada todavía devuelve este mismo shape
con todo en 0 — **nunca un error**. `current_level` es siempre `null` por
ahora (el canon no define todavía cómo derivarlo de forma inequívoca) —
**no mostrar un nivel inventado**, mostrar DVG sin nivel hasta que exista
esa regla.

### 3.2. `progress.getDaily` — histórico diario

```json
{ "function": "progress.getDaily", "auth": {...}, "payload": { "client_id": "uuid", "from": "2026-08-01", "to": "2026-08-21", "limit": 50 } }
```

Devuelve `{ daily_progress: [...], count }`, una fila por (día, pilar).
`from`/`to` en formato `YYYY-MM-DD`, opcionales.

### 3.3. `progress.getPillar` — histórico por pilar

```json
{ "function": "progress.getPillar", "auth": {...}, "payload": { "client_id": "uuid", "pillar": "exercise", "from": "...", "to": "..." } }
```

`pillar` debe ser uno de `nutrition`/`exercise`/`sleep`/`stress`/
`conscious_wellbeing`. **`"mind"` se rechaza explícitamente** (alias
legacy, no un pilar real) con `VALIDATION_ERROR`.

## 4. Códigos de error relevantes para este flujo

| code | cuándo aparece | qué mostrar |
|---|---|---|
| `UNAUTHORIZED` | `dashboard_key` ausente/incorrecta | error de configuración, no de usuario |
| `VALIDATION_ERROR` | payload inválido (campo desconocido, pilar mal escrito, fecha mal formada) | error de formulario |
| `NOT_FOUND` | `evidence_id`/`action_log_id` no existe | recurso no encontrado |
| `CANONICAL_REFERENCE_NOT_FOUND` | `source_entity_id`/`source_content.canonical_id` no existe o inactivo | acción/contenido no reconocido |
| `DATA_INTEGRITY_ERROR` | intento de calcular gamificación sobre un `action_log` no `validated`, o inconsistencia de catálogo | error interno, no debería ocurrir desde un flujo normal del Dashboard — reportar, no reintentar en bucle |

## 5. Funciones administrativas (no forman parte del flujo "marcar hecho")

- `gamification.calculateAction`/`gamification.recalculateDay`: úsalas
  solo si necesitas recalcular manualmente (p. ej. una herramienta interna
  de soporte) — `accreditAndCalculate` ya las invoca automáticamente en
  el flujo normal.
- `gamification.rebuildProgress(client_id)`: reconstruye TODO el
  progreso de un cliente desde cero a partir del ledger real —
  herramienta de reparación/auditoría, no parte del flujo de usuario
  final.
- `actions.list/get`, `actions.listLogs/getLog`: exploración/depuración
  del catálogo y del ledger — no necesarias para "marcar hecho" ni para
  la pantalla de progreso.

## 6. Lo que el Dashboard NO debe asumir

- Que las 119 familias de acciones canónicas tienen regla de acreditación
  — solo las 11 de la tabla §2.1 la tienen hoy.
- Que existe un sistema de niveles/badges/streaks visibles — el backend
  calcula el streak internamente para el DVG, pero no expone un formato
  de display para él todavía.
- Que `total_dvg_hours` cambia de inmediato tras `evidence.register` sin
  llamar a `accreditAndCalculate` — `evidence.register` por sí solo
  **nunca** genera DVG.
