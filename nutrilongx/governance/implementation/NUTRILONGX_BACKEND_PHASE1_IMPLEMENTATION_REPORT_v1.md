# NUTRILONGX — Backend Phase 1 Implementation Report v1

Fecha: 2026-08-20.
Estado del informe: `ACTIVE` — registra lo realmente implementado en esta
ejecución, no es fuente de verdad de contenido (`source_of_truth: false`).

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

## 2. Migración creada (NO aplicada live)

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

**No se ha aplicado contra ningún proyecto Supabase real** — sigo sin
credenciales en este entorno. El fichero queda listo para revisión y
aplicación manual (SQL Editor o `supabase db push`) por quien sí tenga
acceso.

### Validación estática realizada (sin Postgres local disponible)

- `sqlparse`: 106 sentencias, 0 desequilibrios de paréntesis.
- Recuento de sentencias por tipo coincide exactamente con el diseño: 17
  `CREATE TABLE`, 20 índices, 1 función, 11 triggers (+ 11 `DROP TRIGGER IF
  EXISTS` previos, idempotentes), 17 `ALTER TABLE ... ENABLE ROW LEVEL
  SECURITY`, 18 `COMMENT ON`, 8 `INSERT` (migración de Mente).
- Nombres de columnas de las 6 tablas legacy usados en la migración de
  Mente verificados uno a uno contra `0001_contenido_pilares.sql` real.
- **No probado contra una instancia Postgres real** (no hay `psql`/`docker`
  disponibles en este entorno). Recomendación explícita: ejecutar primero
  en un branch/proyecto Supabase de staging antes de aplicar a producción.

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

**No ejecutado con `--apply`** — requiere credenciales que no están
disponibles aquí.

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
esta pasada (no se le fuerza un pilar arbitrario) y queda pendiente de una
migración manual/posterior. No puedo saber si este caso existe hoy en los
datos reales sin acceso live — el count exacto de vídeos afectados (si los
hay) se conocerá al ejecutar `verify_standalone_backend.mjs` contra el
proyecto real.

**No ejecutado contra datos reales** — depende de que `0002` se aplique
primero.

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
- **Migración `0002`: escrita, no aplicada live.** Requiere credenciales
  que no están disponibles en este entorno de ejecución.
- **Import canónico: dry-run verificado, no ejecutado con `--apply`.**
- **Migración de Mente: SQL escrito y revisado línea a línea contra
  `0001`, no ejecutado contra datos reales.**
- **Tests de idempotencia/integridad referencial/no-duplicación
  (`verify_standalone_backend.mjs`): escritos, sintaxis validada, no
  ejecutados contra un proyecto real** (requieren las mismas credenciales).
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
IMPLEMENTATION_READY_FOR_SUPABASE_APPLY
```

No se declara `READY_FOR_APPS_SCRIPT_IMPLEMENTATION` porque la migración no
se ha aplicado ni verificado contra el proyecto real — declararlo sería
falsificar `APPLIED`, cosa que el propio encargo prohíbe explícitamente.

### Proceso seguro recomendado para aplicar (no ejecutado aquí)

1. Revisar `supabase/migrations/0002_standalone_backend_v1.sql` (idealmente
   contra un proyecto Supabase de staging primero).
2. Aplicar la migración (SQL Editor o `supabase db push`, quien tenga
   acceso).
3. `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/nutrilongx/import_standalone_canon.mjs`
   (dry-run) para confirmar de nuevo los counts contra el proyecto real.
4. `... --apply` para escribir de verdad.
5. Repetir el paso 4 una segunda vez, sin cambios de canon en Git de por
   medio, y confirmar que los counts no cambian (test de idempotencia).
6. `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/nutrilongx/verify_standalone_backend.mjs`
   para la verificación de integridad referencial/invariantes.
7. Solo entonces, actualizar el estado a
   `READY_FOR_APPS_SCRIPT_IMPLEMENTATION`.
