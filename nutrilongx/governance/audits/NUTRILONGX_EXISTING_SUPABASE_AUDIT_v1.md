# NUTRILONGX — EXISTING SUPABASE AUDIT v1

**Status:** `APPROVED`  
**Scope:** Existing repository implementation and Supabase-facing legacy structures  
**Date:** 2026-08-20  
**Mode:** Read-only audit; no destructive action authorized

---

## 1. Audit objective

Determine which existing Supabase/database-facing elements should be:

- `KEEP`;
- `ADAPT`;
- `MIGRATE`;
- `DEPRECATE`.

This document does not authorize deletion.

---

## 2. Verified migration inventory

Current repository migration directory contains:

```text
supabase/migrations/0001_contenido_pilares.sql
```

No other repository migration is assumed unless discovered after this canonical snapshot.

Before implementation, Claude Code must re-check `main`.

---

## 3. Current recorded public-schema evidence

The most recent recorded schema evidence in project governance identified these six `public` tables:

```text
content_pieces
infografias
retos_insignia
subpilar_mapeo
video_bloques
videos
```

Historical 2025 evidence indicates that `actions_catalog` and `action_logs` existed in an earlier environment or phase.

The conflict must not be silently resolved.

### Implementation preflight requirement

Before creating the standalone migration, perform a new read-only live-schema inspection if credentials/environment permit.

If live state differs materially from expected state:

```text
STOP destructive assumptions
REGISTER difference
ADAPT migration plan additively
```

Never recreate, overwrite or delete unknown tables blindly.

---

## 4. Classification of migration `0001_contenido_pilares.sql`

| Existing element | Classification | Target |
|---|---|---|
| `subpilar_mapeo` | `MIGRATE` | canonical pillar/subdomain information in new content model |
| `content_pieces` | `MIGRATE` | `mind_content` |
| `retos_insignia` | `MIGRATE` | `mind_content` with `content_type=challenge` |
| `videos` | `MIGRATE` | `mind_content` with `content_type=video` |
| `video_bloques` | `MIGRATE` | `mind_content.data.video_blocks[]` |
| `infografias` | `MIGRATE` | `mind_content` with `content_type=infographic` |

`MIGRATE` does not mean DROP.

---

## 5. Migration strategy for Mente legacy data

Sequence:

```text
preserve existing tables
↓
create new standalone schema additively
↓
transform/copy data into mind_content
↓
preserve provenance
↓
validate row/object counts
↓
validate pillar mapping
↓
switch Dashboard reads to Apps Script
↓
run acceptance tests
↓
only then mark old paths deprecated
```

Legacy structures remain until a later explicit cleanup decision.

---

## 6. Why legacy Mente model is not permanent

Migration `0001_contenido_pilares.sql` modeled:

```text
backend pillar MEN
```

with UI-visible subdivisions:

- Sueño;
- Estrés;
- Bienestar emocional.

The current canonical product model instead requires first-class data pillars:

```text
sleep
stress
conscious_wellbeing
```

Therefore the existing structures are valuable operational source data but not the permanent target domain model.

---

## 7. Existing `/api/pilares/mente` path

Existing behavior:

- reads legacy Mente tables;
- uses service-role Supabase access;
- exposes approved content.

Classification:

```yaml
api_pilares_mente:
  classification: ADAPT_THEN_DEPRECATE
  target: Apps Script content.listMind()
```

No immediate deletion.

---

## 8. Existing direct browser → Supabase reads

Existing frontend code attempts direct Supabase reads for Mente before falling back to an API endpoint.

Classification:

```yaml
direct_browser_supabase_reads:
  classification: DEPRECATE
  target: Dashboard -> Apps Script -> Supabase
```

Reason:

The approved standalone architecture defines Apps Script as the functional boundary.

---

## 9. Existing generic content API

Existing `api/content/create.ts` writes to legacy concepts:

```text
content
content_media
```

and allows a direct `dvg` field on content.

That behavior conflicts with the frozen integration invariant:

```text
CONTENT != DVG
```

Classification:

```yaml
api_content_create:
  classification: DEPRECATE

legacy_content_table:
  classification: DO_NOT_ASSUME_EXISTS
  action: inspect live schema before any change

legacy_content_media_table:
  classification: DO_NOT_ASSUME_EXISTS
  action: inspect live schema before any change
```

No table may be dropped based solely on source-code references.

---

## 10. Historical `actions_catalog` / `action_logs`

Historical evidence exists.

Current existence is not assumed.

Classification:

```yaml
historical_actions_catalog:
  classification: LEGACY_REFERENCE_ONLY
  canonical_replacement: NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1

historical_action_logs:
  classification: DO_NOT_REUSE_SCHEMA_BLINDLY
  target: new standalone action_logs contract
```

If live inspection finds historical tables, Claude Code must:

1. inspect columns/constraints/data;
2. compare with new standalone schema;
3. avoid destructive overwrite;
4. propose an additive migration/reconciliation path within the approved architecture.

---

## 11. Existing service-role secret pattern

Existing backend code reads Supabase credentials from environment variables.

Conceptual classification:

```yaml
server_side_secret_storage:
  classification: KEEP

vercel_specific_implementation:
  classification: MIGRATE
  target: secure Apps Script configuration
```

Never copy secrets into source code.

---

## 12. Existing RLS

Migration 0001 enables RLS and allows public read of approved content.

Classification:

```yaml
rls_principle:
  classification: KEEP

legacy_public_content_policies:
  classification: ADAPT

client_sensitive_tables:
  classification: NEW_RESTRICTIVE_POLICIES_REQUIRED
```

The standalone target does not require anonymous access to client operational data.

---

## 13. Final audit table

| Area | Decision |
|---|---|
| Existing Mente data | KEEP DATA / MIGRATE MODEL |
| Legacy Mente tables | MIGRATE, no initial DROP |
| Direct frontend→Supabase | DEPRECATE after cutover |
| Vercel functional API | DEPRECATE after Apps Script cutover |
| Server-side secret principle | KEEP |
| Legacy content+DVG model | DEPRECATE |
| Historical gamification tables | INSPECT, never assume |
| RLS principle | KEEP + ADAPT |
| Canonical Git artifacts | KEEP as source of truth |

---

## 14. Implementation preflight gate

Implementation may proceed only if Claude Code:

- re-reads `main`;
- inspects actual migration files;
- inspects all current Supabase references;
- performs live read-only schema inspection when possible;
- reports any unexpected conflict before destructive action.

Additive changes are preferred.

No destructive migration is authorized by this audit.
