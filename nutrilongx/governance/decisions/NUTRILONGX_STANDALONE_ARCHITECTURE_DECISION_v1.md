# NUTRILONGX — STANDALONE ARCHITECTURE DECISION v1

**Status:** `APPROVED`  
**Scope:** NUTRILONGX standalone backend v1  
**Approved by:** CORE CENTRAL / César  
**Date:** 2026-08-20  
**Implementation:** Authorized only after canonical persistence of this specification set.

---

## 1. Decision

NUTRILONGX v1 is developed as an independent vertical standalone system.

The operational architecture is:

```text
Git canonical artifacts
        ↓ controlled import/sync
Supabase
        ↓
Google Apps Script
        ↓
Dashboard
        ↓ future
Patient App/PWA
```

No additional backend layer is introduced in v1 unless explicitly approved later by CORE CENTRAL.

---

## 2. Responsibility boundaries

### Git

Git is the canonical, versioned source for:

- canonical content;
- canonical actions;
- gamification engine;
- canonical safety rules;
- provenance;
- schemas;
- governance decisions.

Git does not contain operational client state.

### Supabase

Supabase is the operational database for:

- clients;
- client profiles;
- operational projections of canonical content;
- canonical action projections;
- content-action bindings;
- exercise safety-rule projections;
- action accreditation rules;
- assignments;
- execution evidence;
- action logs;
- derived progress;
- audit trail.

Canonical artifacts imported into Supabase are operational projections. They do not become an independent competing source of truth.

### Google Apps Script

Google Apps Script is the standalone service/function layer for NUTRILONGX v1.

Responsibilities:

- request validation;
- authorization of operational/professional functions;
- orchestration;
- Supabase reads/writes;
- idempotency coordination;
- accreditation workflow;
- gamification-engine invocation;
- audit-log generation;
- stable response envelopes;
- exposure of a stable contract to Dashboard and future App/PWA.

Apps Script must not redefine:

- canonical action catalog;
- DVG values;
- calculation order;
- boosters;
- streak rules;
- combos;
- caps;
- exercise safety rules.

### Dashboard

Dashboard is a client of the Apps Script function contract.

Dashboard may:

- request reads;
- request writes;
- display content;
- assign content;
- register evidence;
- request accreditation;
- inspect warnings;
- read progress.

Dashboard must not:

- calculate DVG independently;
- write directly to `action_logs`;
- redefine canonical rules;
- duplicate clinical/safety logic;
- use Supabase service-role credentials.

### Patient App/PWA

The future patient App/PWA will consume the same functional boundary with patient-scoped authorization.

---

## 3. Canonical pillar vocabulary

The five canonical product pillars are:

```yaml
pillars:
  - nutrition
  - exercise
  - sleep
  - stress
  - conscious_wellbeing
```

UI grouping:

```yaml
ui_grouping:
  mind:
    - sleep
    - stress
    - conscious_wellbeing
```

`mind` / `MENTE` is an interface grouping only.

It must never replace the three underlying pillars in:

- persistence;
- statistics;
- content;
- gamification;
- assignments;
- evidence;
- reporting.

Gamification is transversal and is not a sixth pillar.

---

## 4. Mandatory integration chain

The frozen conceptual flow is:

```text
CONTENT
↓
CONTENT_ACTION_BINDING
↓
EXECUTION_EVIDENCE
↓
ACTION_ACCREDITATION
↓
ACTION_LOG
↓
GAMIFICATION_ENGINE
↓
DERIVED_PROGRESS
```

Mandatory invariants:

1. Content does not generate DVG.
2. A binding does not generate DVG.
3. Evidence alone does not generate DVG.
4. Only a validated `ACTION_LOG` can enter the gamification engine.
5. Progress is derived state.
6. `action_logs` remains the primary reconstructible historical source for gamification progress.

---

## 5. Content referential-integrity decision

The standalone model introduces:

```text
content_registry
```

Purpose:

Provide one universal operational identity for heterogeneous content while preserving real PostgreSQL foreign-key integrity.

It is not a content master and does not duplicate rich content.

Conceptual shape:

```yaml
content_registry:
  id: uuid
  content_type:
    - recipe
    - exercise
    - exercise_variant
    - mind_content
  canonical_id: text
  pillar:
    - nutrition
    - exercise
    - sleep
    - stress
    - conscious_wellbeing
  is_active: boolean
  created_at: timestamptz
```

Constraint:

```text
UNIQUE(content_type, canonical_id)
```

Concrete content tables reference `content_registry.id`.

The following operational tables also reference `content_registry.id`:

- `content_action_bindings`;
- `client_content_assignments`;
- `execution_evidence` when evidence is linked to content.

This avoids fragile polymorphic foreign keys.

### Approved consequence

The standalone backend v1 contains **17 target tables**, not 16.

---

## 6. Mind-content migration decision

The six existing tables created by migration `0001_contenido_pilares.sql` are not deleted during the initial standalone deployment.

Their data is migrated into the new canonical operational model:

```text
content_pieces
retos_insignia
videos
video_bloques
infografias
subpilar_mapeo
        ↓
mind_content
```

The target representation uses first-class pillars:

- `sleep`;
- `stress`;
- `conscious_wellbeing`.

Legacy tables remain available during transition until:

1. migration counts are validated;
2. provenance is preserved;
3. Dashboard is switched to Apps Script;
4. operational acceptance tests pass.

Only a later explicit cleanup decision may remove legacy structures.

---

## 7. Apps Script as service boundary

For NUTRILONGX standalone v1:

```text
Dashboard → Apps Script → Supabase
```

becomes the target operational path.

Therefore current patterns based on:

- direct browser → Supabase reads;
- Vercel API routes as functional backend;

are treated as transitional legacy paths.

They may remain during migration but are not the target architecture.

---

## 8. Security decision

### Secrets

Never persist in Git:

- `SUPABASE_SERVICE_ROLE_KEY`;
- passwords;
- access tokens;
- API secrets;
- `.env` content.

Apps Script secrets must be stored using the secure Apps Script environment/property mechanism approved for deployment.

### Service role

The service-role key:

- may be used only server-side/service-side;
- must never be exposed to Dashboard/browser;
- must never be returned in logs/errors;
- must never be stored in client-side code.

### RLS

Standalone does not mean no RLS.

Minimum RLS must distinguish:

- professional/dashboard operations mediated by Apps Script;
- future patient/App access;
- service-role execution.

Client-sensitive tables must not be anonymously readable.

---

## 9. Clinical safety decision

Current exercise safety rules are operationally:

```yaml
mode: ADVISORY_ONLY
automated_blocking: false
```

While their human review is pending:

- they may generate warnings/advisories;
- they may not act as autonomous clinical blocking rules;
- they may not automatically reject assignments or exercise execution;
- they may not modify DVG.

Nutrition clinical automation must not invent or reconstruct missing clinical specifications.

---

## 10. Accreditation decision

No threshold or accreditation condition absent from the canonical artifacts may be invented.

`ACTION_ACCREDITATION_RULE` supports at minimum:

```text
ACTIVE
INACTIVE
REVIEW_REQUIRED
```

If deterministic accreditation cannot be derived from canonical information, the correct operational result is:

```text
REVIEW_REQUIRED
```

not an inferred threshold.

---

## 11. Scope exclusions

NUTRILONGX standalone v1 does not implement:

- multi-tenancy;
- generic CORE SaaS;
- billing;
- generic CRM;
- enterprise RBAC;
- ABAC;
- enterprise event bus;
- n8n orchestration platform;
- wearables;
- session/program engine;
- generic AI memory.

These exclusions are deliberate and do not block future migration to CORE.

---

## 12. Approval

The following three architecture decisions are frozen for standalone backend v1:

1. Add `content_registry`, resulting in 17 target tables.
2. Migrate the six legacy Mente tables into `mind_content` without destructive removal during initial deployment.
3. Make Apps Script the standalone service/function boundary and progressively retire direct browser→Supabase and legacy Vercel API functional paths after validated cutover.

**Status:** `APPROVED`
