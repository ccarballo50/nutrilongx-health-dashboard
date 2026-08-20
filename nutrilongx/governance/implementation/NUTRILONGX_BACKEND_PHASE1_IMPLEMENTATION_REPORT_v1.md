# NUTRILONGX — Backend Phase 1 Implementation Report v1

Fecha: 2026-08-20. Actualizado 2026-08-20 tras verificación live.
Estado del informe: `ACTIVE` — registra lo realmente implementado, no es
fuente de verdad de contenido (`source_of_truth: false`).

## 0. Estado live (actualización — certificado por CORE CENTRAL)

```yaml
migration_0002:
  status: APPLIED_AND_VERIFIED   # antes: NOT_APPLIED
canonical_import:
  status: APPLIED_AND_VERIFIED   # antes: DRY_RUN_ONLY
mind_migration:
  status: APPLIED_AND_VERIFIED
referential_integrity: PASS
rls_security: PASS
security_advisor_warnings: 0
```

**Nota de autoría de esta actualización**: la aplicación de `0002`, la
ejecución del import canónico (`--apply`, dos veces, para la prueba de
idempotencia), la migración de Mente y el hardening de seguridad se
ejecutaron y verificaron **fuera de este entorno de ejecución de Claude
Code**, directamente contra el proyecto Supabase real
(`muyqbqbyvysgqasllgni`), y fueron certificados por César/CORE CENTRAL. Yo
sigo sin credenciales de Supabase en este entorno — no he ejecutado ninguno
de estos pasos yo mismo, ni los he vuelto a verificar de forma
independiente. Este informe registra la certificación recibida, igual que
ya se hizo con el live audit de la fase anterior (§1).

### Proyecto y estado general

```yaml
project: muyqbqbyvysgqasllgni (nutrilongx-health-dashboard)
status: ACTIVE_HEALTHY
public_tables_before_0002: 6
public_tables_after_0002: 23
standalone_target_tables: 17
legacy_tables_preserved: 6
```

### Migración de Mente — counts live

```yaml
# Origen (legacy, sin modificar)
content_pieces: 27
retos_insignia: 6
videos: 4
video_bloques: 17
infografias: 3
subpilar_mapeo: 24

# Destino
mind_content: 40
mind_orphans: 0
videos_with_embedded_blocks: 4
```

40 = 27 (`content_pieces`) + 6 (`retos_insignia`) + 4 (`videos`, con sus
`video_bloques` embebidos en `data.video_blocks[]`, no como filas propias)
+ 3 (`infografias`). Mapping de pilar (`Sueño→sleep`, `Estrés→stress`,
`Bienestar emocional→conscious_wellbeing`) y de tipo
(`ficha_pilar→pillar_card`, `ficha_subpilar→subpillar_card`,
`retos_insignia→challenge`, `videos→video`, `infografias→infographic`)
validados según certificación recibida. 0 huérfanos
(`mind_content.registry_id → content_registry.id`).

### Canonical import — counts live (`apply_run_1` y `apply_run_2` idénticos)

```yaml
recipes: 58
exercises: 24
exercise_variants: 20
canonical_actions: 119
exercise_safety_rules: 12
nutrition_bindings: 207   # supports: 186, candidate: 18, contextual_opposite: 3
action_accreditation_rules: 0   # correcto y deliberado
idempotency: PASS   # segunda ejecucion de --apply no duplico filas
```

### Invariantes live

```yaml
execution_evidence: 0
action_logs: 0
client_progress: 0
daily_progress: 0
orphan_recipes: 0
orphan_exercises: 0
orphan_variants: 0
orphan_mind: 0
orphan_bindings: 0
```

Confirma en producción real lo que el diseño ya garantizaba: `CONTENT !=
DVG`, `BINDING != DVG`, `EVIDENCE != DVG` — el bootstrap canónico no generó
evidencia, `action_logs`, DVG ni progreso.

### Security hardening live

Supabase Security Advisor detectó inicialmente:

```text
WARN function_search_path_mutable  public.nlx_set_updated_at
WARN extension_in_public           unaccent
```

Corregido live con dos `ALTER` (documentados en Git en
`supabase/migrations/0003_standalone_backend_v1_security_hardening.sql`,
ver §2b):

```sql
alter function public.nlx_set_updated_at() set search_path = pg_catalog;
alter extension unaccent set schema extensions;
```

Resultado tras el hardening: **`WARN: 0`**. Persisten únicamente `INFO
rls_enabled_no_policy` en las 17 tablas standalone — **esperado y
aceptado** en esta fase (RLS habilitado, cero policies nuevas, deny-by-
default para anon/authenticated; Apps Script con service role bypassa
RLS).

### Extensión `http` (temporal, no forma parte de la arquitectura)

Para el import canónico desde los JSON FROZEN de GitHub se usó
temporalmente la extensión PostgreSQL `http` (schema `extensions`),
**eliminada inmediatamente después del import**. No se crea migración para
ella ni se registra como dependencia — no es parte del modelo de datos
aprobado.

---

## 1. Live audit result

Evidencia live aportada externamente por César/CORE CENTRAL (SQL Editor del
proyecto Supabase real, 2026-08-20), tratada como **FROZEN para esta
ejecución** — no se ha vuelto a pedir ni a verificar credencial alguna:

```text
public tables: 6 (content_pieces, infografias, retos_insignia,
                  subpilar_mapeo, video_bloques, videos)
actions_catalog: ABSENT (live)
action_logs: ABSENT (live)
content: ABSENT (live)
content_media: ABSENT (live)
storage buckets: 0
```

Esto resuelve el conflicto histórico registrado en
`governance/audits/NUTRILONGX_SUPABASE_SCHEMA_RECONCILIATION_NOTE_v1.md`
(evidencia 2025 vs. 2026): la lectura de 2026-08-20 confirma que
`actions_catalog`/`action_logs` **no existen live hoy** — no se recrea su
esquema legacy, se construye únicamente el modelo standalone nuevo.

RLS/policies/constraints live de las 6 tablas coinciden con
`supabase/migrations/0001_contenido_pilares.sql` (confirmado por César).

**No he verificado esta evidencia yo mismo** — sigo sin credenciales de
Supabase en este entorno de ejecución. La trato como dato de entrada
autorizado por el CORE CENTRAL, tal como instruido.

## 2. Migración — `APPLIED_AND_VERIFIED` (ver §0)

`supabase/migrations/0002_standalone_backend_v1.sql`

- **Aditiva.** Cero `DROP TABLE`, `TRUNCATE` o `DELETE` sobre tablas legacy
  (verificado por grep — el único match de "TRUNCATE" en el fichero es
  dentro de un comentario).
- `0001_contenido_pilares.sql` no se ha tocado (diff vacío contra `main`).
- Crea las 17 tablas objetivo, extensión `unaccent` (para slugs
  deterministas de Mente), función/trigger genérico `nlx_set_updated_at()`,
  índices, constraints, y activa RLS en las 17 tablas **sin ninguna policy
  nueva** (deny-by-default para anon/authenticated; la service role de
  Apps Script siempre bypassa RLS) — decisión explícita de la sección 15
  del encargo, no un olvido.
- Incluye, al final, la migración no destructiva de las 6 tablas de Mente
  hacia `mind_content` (ver §5).

**Aplicada contra el proyecto Supabase real** (`muyqbqbyvysgqasllgni`),
certificado por CORE CENTRAL — ver §0. `0002` es ahora **inmutable**: no se
edita in situ; cualquier cambio futuro requiere una migración nueva
(`0003+`).

### Validación estática realizada por mí antes del apply (sin Postgres local disponible)

- `sqlparse`: 106 sentencias, 0 desequilibrios de paréntesis.
- Recuento de sentencias por tipo coincide exactamente con el diseño: 17
  `CREATE TABLE`, 20 índices, 1 función, 11 triggers (+ 11 `DROP TRIGGER IF
  EXISTS` previos, idempotentes), 17 `ALTER TABLE ... ENABLE ROW LEVEL
  SECURITY`, 18 `COMMENT ON`, 8 `INSERT` (migración de Mente).
- Nombres de columnas de las 6 tablas legacy usados en la migración de
  Mente verificados uno a uno contra `0001_contenido_pilares.sql` real.
- **No probado por mí contra una instancia Postgres real** (no hay
  `psql`/`docker` disponibles en este entorno) — la aplicación real y su
  verificación se hicieron fuera de este entorno (§0).

## 2b. `0003_standalone_backend_v1_security_hardening.sql`

Documenta en Git, de forma retroactiva, dos `ALTER` **ya aplicados live**
por CORE CENTRAL para resolver los 2 `WARN` del Security Advisor (§0):
`search_path` mutable en `nlx_set_updated_at()` y la extensión `unaccent`
instalada en `public` en vez de `extensions`. **No se ha ejecutado desde
Claude Code contra Supabase** — es documentación/reproducibilidad de un
cambio ya certificado, para evitar drift Git↔Supabase. Supabase registra
live las migraciones `0001_contenido_pilares`,
`standalone_backend_v1` (=`0002`) y `standalone_backend_v1_security_hardening`
(=`0003`), con timestamps `20260815144553`, `20260820003038` y
`20260820003232` respectivamente.

## 3. Canonical import — método

`scripts/nutrilongx/import_standalone_canon.mjs`

- Lee directamente los 4 artefactos FROZEN de `nutrilongx/**/canonical` +
  `nutrilongx/exercise/safety/` (Git sigue siendo la fuente de verdad).
- Dry-run por defecto (mismo patrón que `scripts/seed_contenido_pilares.mjs`
  ya existente en el repo); `--apply` para escribir.
- Upsert por clave canónica/negocio en cada tabla (`canonical_id`,
  `canonical_action_id`, `safety_rule_id`, `(content_type, canonical_id)`,
  `(content_id, canonical_action_id, binding_type)`) — re-ejecutar no
  duplica filas.
- **No genera `execution_evidence`, `action_logs` ni `client_progress`.**
  No genera ninguna `action_accreditation_rule` — la tabla queda vacía tras
  el import, que es el resultado correcto declarado por el propio contrato.

### Dry-run ejecutado en este entorno (sin credenciales, solo lectura de Git)

```text
recipes:                    58   (esperado 58)
content_action_bindings:   207   (58 recetas; 186 supports + 18 candidate + 3 contextual_opposite)
exercises:                   24   (esperado 24)
exercise_variants:           20   (esperado 20)
canonical_actions:          119   (esperado 119)
exercise_safety_rules:       12   (esperado 12)
action_accreditation_rules:   0   (correcto)
```

Todos los counts coinciden exactamente con los artefactos FROZEN reales
(verificado leyendo los JSON, no de memoria). `node --check` confirma
sintaxis válida en ambos scripts nuevos.

**Ejecutado con `--apply` dos veces contra el proyecto real** (fuera de
este entorno, certificado por CORE CENTRAL — ver §0). Los counts live
finales coinciden exactamente con los del dry-run de arriba, y la segunda
ejecución no produjo duplicados (`idempotency: PASS`).

## 4. Mente migration summary

Migración SQL (dentro de `0002`, no un script aparte — origen y destino
viven en la misma base de datos):

| Tabla legacy (`0001`) | Destino `mind_content.content_type` | Regla |
|---|---|---|
| `content_pieces.tipo='ficha_pilar'` | `pillar_card` | 1 fila legacy → 1 fila `mind_content` |
| `content_pieces.tipo='ficha_subpilar'` | `subpillar_card` | 1 fila legacy → 1 fila `mind_content` |
| `retos_insignia` | `challenge` | 1 fila legacy → 1 fila `mind_content` |
| `videos` + `video_bloques` | `video` | 1 fila `videos` → 1 fila `mind_content`; sus N `video_bloques` se embeben ordenados en `data.video_blocks[]` |
| `infografias` | `infographic` | 1 fila legacy → 1 fila `mind_content` |
| `subpilar_mapeo` | — | No genera filas propias; solo resuelve `pillar` + `provenance` para `videos` (su `subpilar` es la única tabla legacy sin `pilar_visible` directo) |

`canonical_id` determinista: `mind.<pillar>.<content_type>.<slug>`, con
`slug` derivado (via `unaccent`+`lower`+regex) del campo de negocio ya
`UNIQUE` de cada tabla origen (`tema`, `nombre`, `titulo`). No se usa UUID
aleatorio como identidad canónica.

`provenance` preservado dentro de `data.legacy_source`: tabla origen, id
original, `pilar_visible` original, timestamps.

**Caso borde documentado, no oculto**: si algún `videos.subpilar` es `NULL`
o no tiene fila correspondiente en `subpilar_mapeo`, ese vídeo se omite de
esta pasada. Live: `videos=4` origen → `videos_with_embedded_blocks=4`
destino (§0) — los 4 vídeos legacy resolvieron pilar correctamente, 0
omitidos.

**Ejecutado contra datos reales y verificado** (§0):
`content_pieces=27, retos_insignia=6, videos=4, infografias=3 → mind_content=40,
mind_orphans=0`.

## 5. Database

- 17 tablas objetivo, exactamente las de
  `NUTRILONGX_STANDALONE_DATA_MODEL_v1.md`. Ninguna tabla 18+ añadida.
- `content_registry` como identidad universal real con FK (no
  polimórfica): `recipes/exercises/exercise_variants/mind_content.registry_id
  → content_registry.id`; `content_action_bindings.content_id`,
  `client_content_assignments.content_id`,
  `execution_evidence.source_content_id → content_registry.id`.
- Constraints de unicidad clave: `clients.external_code`,
  `content_registry(content_type, canonical_id)`, `*.canonical_id` en las 4
  tablas de contenido, `canonical_actions.canonical_action_id`,
  `content_action_bindings(content_id, canonical_action_id, binding_type)`,
  `execution_evidence(client_id, deduplication_key)`,
  `action_logs(client_id, deduplication_key)`,
  `daily_progress(client_id, date, pillar)`.
- `exercise_safety_rules.operational_mode` forzado por `CHECK` a
  `'ADVISORY_ONLY'` — no puede insertarse ningún otro valor mientras ese
  constraint exista.
- RLS habilitado en las 17 tablas, cero policies nuevas (ver §2).
- Índices: los mínimos razonables listados en la sección 27 del encargo,
  todos presentes.

## 6. Limitations

- **Apps Script: `NOT_IMPLEMENTED`** — fuera de scope de esta fase.
- **Yo (Claude Code, este entorno) sigo sin credenciales de Supabase.**
  La aplicación de `0002`, el import `--apply` (×2) y la verificación live
  se ejecutaron fuera de este entorno y se registran aquí por
  certificación de CORE CENTRAL, no por comprobación directa mía — ver
  nota de autoría en §0.
- **Migración de Mente y `verify_standalone_backend.mjs`: certificados
  como ejecutados/PASS por CORE CENTRAL (§0), no verificados de forma
  independiente por mí.**
- Referencias de código legacy a tablas hoy ausentes live (`content`,
  `content_media`, `actions_catalog`, `action_logs`, `users`,
  `achievements`, `user_day`, `badges`, `user_badges`, `tips`,
  `tip_targets_*`, `tip_history`, `notification_subscriptions`/
  `user_subscriptions`) **siguen presentes en el código** — su limpieza
  queda para otra fase, tal como se instruyó.
- Exercise safety rules importadas mantienen su `review_status` real
  (`PENDING_HUMAN_REVIEW` en las 12) — `operational_mode` forzado
  `ADVISORY_ONLY` por diseño de esquema, no por confianza en la revisión.
- No se ha podido validar la migración contra una instancia Postgres real
  (sin `psql`/`docker` en este entorno) — solo validación estática
  (`sqlparse`, recuento de sentencias, revisión manual columna a columna).

## 7. Next state

```text
READY_FOR_APPS_SCRIPT_IMPLEMENTATION
```

No se declara `PRODUCTION_READY`: Apps Script y el flujo E2E completo
(Dashboard → Apps Script → Supabase, acreditación real, motor invocado en
producción) todavía no existen. Backend Phase 1 (schema + import canónico +
migración de Mente) queda `APPLIED_AND_VERIFIED` según certificación de
CORE CENTRAL (§0); Apps Script sigue `NOT_IMPLEMENTED`.
