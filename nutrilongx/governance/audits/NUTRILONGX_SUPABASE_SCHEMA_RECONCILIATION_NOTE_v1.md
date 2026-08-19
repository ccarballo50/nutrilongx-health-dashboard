# NUTRILONGX — Reconciliación de evidencia de esquema Supabase (v1)

Estado: `CONFLICT_REGISTERED — NOT_SILENTLY_RESOLVED`
Generado: 2026-08-19, fase de consolidación documental.

## El hallazgo

Esta auditoría encontró **dos evidencias de esquema real de Supabase que no
coinciden entre sí**, y siguiendo la regla de gobernanza de esta fase
("si dos documentos parecen incompatibles, no elijas silenciosamente, registra
el conflicto"), se documentan aquí ambas sin que yo decida cuál prevalece.

### Evidencia A — `Supabase Snippet Untitled query.csv`
- Origen: `documentos nuevos/` (entregado directamente por César en esta fase)
- Fecha de fichero: **2026-08-18 19:06**
- Contenido: listado `table_schema, table_name` de *todo* el proyecto
  (`auth`, `public`, `realtime`, `storage`, `supabase_migrations`, `vault`)
- En `public` aparecen **exactamente 6 tablas**: `content_pieces`,
  `infografias`, `retos_insignia`, `subpilar_mapeo`, `video_bloques`,
  `videos`. No aparecen `actions_catalog` ni `action_logs`.

### Evidencia B — 3 ficheros en `SQL editor/Supabase Snippet Schema Inspection for Actions Catalog and Logs*.csv`
- Origen: carpeta hermana fuera del repo,
  `C:\Users\CESAR CC\Desktop\Cesar\inteligencia artificial\NutrilongX\SQL editor\`
- Fechas de fichero: **2025-08-20** (los tres, con horas distintas el mismo día)
- Contenido: columnas de `action_logs` (`id`, `user_external_id`, `action_id`,
  `level`, `pillar`, `base_hours`, `qty`, `coach_verified`, `community`,
  `created_at`, `external_id`) y una constraint `action_logs_action_id_fkey`
  que referencia `actions_catalog(id)`.
- Esto implica que, en algún momento, **`actions_catalog` y `action_logs`
  existieron con estructura real** en algún proyecto Supabase.

## Lectura más probable (no confirmada)

Las fechas difieren en **casi exactamente un año** (2025-08-20 vs.
2026-08-18) y la Evidencia B coincide en el tiempo con la generación de
`NUTRILONGX_creditos_v3.xlsx` (fechado 2025-08-21) y los scripts
`excel_to_json_upsert*.py` de esa misma carpeta — es decir, con la fase de
prototipo de 2025 descrita en las auditorías previas de este proyecto.

La lectura más probable es que `actions_catalog`/`action_logs` existieron
en un proyecto o fase de Supabase de 2025 (o se probaron ahí) y que, para
el snapshot más reciente (Evidencia A, un día antes de esta consolidación),
ya no están en el `public` del proyecto actual `muyqbqbyvysgqasllgni`.

**Esto es una inferencia razonable, no una confirmación.** No se ha
ejecutado ninguna consulta nueva contra Supabase para esta fase (prohibido
por el encargo). No se afirma en ningún registro de este knowledge base que
`actions_catalog`/`action_logs` existan o no existan en el Supabase real de
hoy — solo se documentan las dos evidencias encontradas y su fecha.

## Qué NO se concluye de aquí

- No se concluye que el motor de gamificación canónico deba o no
  desplegarse sobre tablas nuevas.
- No se concluye que las tablas antiguas deban recrearse.
- No se modifica ninguna migración ni se toca Supabase.

## Próximo paso (requiere César o una consulta read-only nueva)

Una única consulta de solo lectura (`select table_schema, table_name from
information_schema.tables where table_schema='public'`) contra el proyecto
real, ejecutada *ahora*, resolvería la duda de forma definitiva. No se ha
ejecutado en esta fase porque está fuera de alcance ("NO SQL", "NO
Supabase").
