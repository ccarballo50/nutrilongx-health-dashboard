# NUTRILONGX — STANDALONE DATA MODEL v1

**Status:** `APPROVED`  
**Scope:** NUTRILONGX standalone operational backend  
**Date:** 2026-08-20  
**Implementation target:** Supabase/PostgreSQL  
**Scale target:** approximately ≤100 active clients

---

## 1. Modeling principles

The standalone model follows these principles:

- minimal operational complexity;
- stable UUID operational identities;
- preservation of canonical IDs from Git;
- columns for IDs, relationships, frequent filters, states and timestamps;
- JSONB for rich content, metadata, provenance and extensible structures;
- no unnecessary normalization of Nutrition Master;
- no duplication of canonical business rules;
- append-oriented operational history for evidence, action logs and audit;
- derived progress reconstructible from validated `action_logs`;
- reasonable future migration compatibility with CORE.

---

## 2. Canonical pillar enum

Allowed pillar values:

```text
nutrition
exercise
sleep
stress
conscious_wellbeing
```

`mind` is not a persisted pillar.

---

## 3. Definitive target tables

| # | Table | Responsibility |
|---|---|---|
| 1 | `clients` | Client operational identity |
| 2 | `client_profiles` | Extended/sensitive client profile |
| 3 | `content_registry` | Universal content identity/FK |
| 4 | `recipes` | Nutrition canonical projection |
| 5 | `exercises` | Exercise canonical projection |
| 6 | `exercise_variants` | Exercise variant projection |
| 7 | `mind_content` | Sleep/stress/conscious-wellbeing content |
| 8 | `canonical_actions` | Canonical action families |
| 9 | `content_action_bindings` | Content ↔ canonical action |
| 10 | `exercise_safety_rules` | Exercise safety advisory rules |
| 11 | `action_accreditation_rules` | Evidence accreditation rules |
| 12 | `client_content_assignments` | Assigned content |
| 13 | `execution_evidence` | Evidence of performed activity |
| 14 | `action_logs` | Accredited action ledger |
| 15 | `client_progress` | Current derived projection |
| 16 | `daily_progress` | Daily derived projection |
| 17 | `audit_log` | Sensitive/professional audit trail |

No `weekly_progress` table is created in v1 unless later operational evidence demonstrates a concrete need.

---

## 4. `clients`

Purpose: minimum operational client identity.

```yaml
clients:
  id: uuid PK
  external_code: text UNIQUE NOT NULL
  auth_user_id: uuid nullable UNIQUE
  first_name: text NOT NULL
  last_name: text nullable
  email: text nullable
  phone: text nullable
  status:
    - active
    - paused
    - discharged
    - archived
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

### Notes

- `external_code` is the stable human/business identifier.
- `auth_user_id` is nullable to allow future App/PWA identity without redesign.
- Extended clinical/profile information does not belong in this table.

---

## 5. `client_profiles`

```yaml
client_profiles:
  client_id: uuid PK/FK -> clients.id
  birth_date: date nullable
  sex: text nullable
  clinical_tags: jsonb
  goals: jsonb
  preferences: jsonb
  restrictions: jsonb
  metadata: jsonb
  updated_at: timestamptz NOT NULL
```

### Explicit decision

`current_level` is not stored here.

Gamification level is derived state and belongs in `client_progress`.

---

## 6. `content_registry`

Purpose: solve referential integrity across multiple content tables without fragile polymorphic FKs.

```yaml
content_registry:
  id: uuid PK
  content_type:
    - recipe
    - exercise
    - exercise_variant
    - mind_content
  canonical_id: text NOT NULL
  pillar:
    - nutrition
    - exercise
    - sleep
    - stress
    - conscious_wellbeing
  is_active: boolean NOT NULL
  created_at: timestamptz NOT NULL
```

Constraint:

```text
UNIQUE(content_type, canonical_id)
```

`content_registry` contains identity and classification only.

It is not a rich-content source.

---

## 7. `recipes`

```yaml
recipes:
  id: uuid PK
  registry_id: uuid UNIQUE FK -> content_registry.id
  canonical_id: text UNIQUE NOT NULL
  title: text NOT NULL
  maturity: text nullable
  data: jsonb NOT NULL
  source_version: text NOT NULL
  schema_version: text nullable
  is_published: boolean NOT NULL
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

Requirements:

- import all 58 canonical recipes;
- preserve `canonical_id`;
- preserve the canonical rich record in `data`;
- preserve maturity;
- import does not automatically imply publication;
- missing clinical specifications must not be reconstructed.

---

## 8. `exercises`

```yaml
exercises:
  id: uuid PK
  registry_id: uuid UNIQUE FK -> content_registry.id
  canonical_id: text UNIQUE NOT NULL
  title: text NOT NULL
  domain: text nullable
  data: jsonb NOT NULL
  content_maturity: text nullable
  review_status: text nullable
  source_version: text NOT NULL
  schema_version: text nullable
  is_published: boolean NOT NULL
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

Current canonical integration scope:

- 24 `EXERCISE`.

Exercise must not be declared globally `PRODUCTION_READY` while current safety review remains incomplete.

---

## 9. `exercise_variants`

```yaml
exercise_variants:
  id: uuid PK
  registry_id: uuid UNIQUE FK -> content_registry.id
  canonical_id: text UNIQUE NOT NULL
  exercise_id: uuid FK -> exercises.id
  relationship_type: text nullable
  data: jsonb NOT NULL
  review_status: text nullable
  source_version: text NOT NULL
  schema_version: text nullable
  is_published: boolean NOT NULL
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

Current integration scope:

- 20 `EXERCISE_VARIANT`.

---

## 10. `mind_content`

Target unified operational table for:

- sleep;
- stress;
- conscious wellbeing.

```yaml
mind_content:
  id: uuid PK
  registry_id: uuid UNIQUE FK -> content_registry.id
  canonical_id: text UNIQUE NOT NULL
  pillar:
    - sleep
    - stress
    - conscious_wellbeing
  content_type:
    - pillar_card
    - subpillar_card
    - challenge
    - video
    - infographic
    - other
  title: text NOT NULL
  data: jsonb NOT NULL
  source_version: text NOT NULL
  schema_version: text nullable
  is_published: boolean NOT NULL
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

Existing Mente data is migrated here with provenance retained.

---

## 11. `canonical_actions`

```yaml
canonical_actions:
  id: uuid PK
  canonical_action_id: text UNIQUE NOT NULL
  domain: text NOT NULL
  subdomain: text nullable
  data: jsonb NOT NULL
  source_version: text NOT NULL
  schema_version: text nullable
  is_active: boolean NOT NULL
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

Requirements:

- import exactly the canonical action families from the FROZEN catalog;
- initial expected count: 119 action families;
- preserve `level_variants[]` in `data`;
- do not use legacy action catalog as active source;
- do not reintroduce deprecated legacy level multipliers.

---

## 12. `content_action_bindings`

```yaml
content_action_bindings:
  id: uuid PK
  content_id: uuid FK -> content_registry.id
  canonical_action_id: text FK -> canonical_actions.canonical_action_id
  binding_type:
    - supports
    - candidate
    - contextual_opposite
    - unmapped
    - direct
  status:
    - active
    - inactive
    - review_required
  metadata: jsonb
  provenance: jsonb
  source_version: text NOT NULL
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

Logical uniqueness:

```text
UNIQUE(content_id, canonical_action_id, binding_type)
```

### Invariant

A binding never:

- creates evidence;
- creates action logs;
- accredits actions;
- generates DVG.

---

## 13. `exercise_safety_rules`

```yaml
exercise_safety_rules:
  id: uuid PK
  safety_rule_id: text UNIQUE NOT NULL
  scope_type: text NOT NULL
  scope_selector: jsonb
  clinical_profile: text nullable
  safety_status: text NOT NULL
  rule_data: jsonb NOT NULL
  review_status: text NOT NULL
  operational_mode: text NOT NULL
  source_version: text NOT NULL
  is_active: boolean NOT NULL
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

Initial mandatory operational mode:

```text
ADVISORY_ONLY
```

Current imported rules retain their canonical review status.

No autonomous blocking is permitted before human-review approval.

---

## 14. `action_accreditation_rules`

```yaml
action_accreditation_rules:
  id: uuid PK
  accreditation_rule_id: text UNIQUE NOT NULL
  canonical_action_id: text FK -> canonical_actions.canonical_action_id
  accepted_evidence_types: text[]
  required_fields: jsonb
  conditions: jsonb
  aggregation_window: jsonb
  max_occurrences: integer nullable
  deduplication_policy: jsonb
  source_priority: jsonb
  status:
    - active
    - inactive
    - review_required
  provenance: jsonb
  source_version: text NOT NULL
  schema_version: text nullable
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

### Mandatory rule

No missing threshold may be invented.

If deterministic accreditation cannot be derived from canonical evidence:

```text
status = review_required
```

---

## 15. `client_content_assignments`

```yaml
client_content_assignments:
  id: uuid PK
  client_id: uuid FK -> clients.id
  content_id: uuid FK -> content_registry.id
  pillar:
    - nutrition
    - exercise
    - sleep
    - stress
    - conscious_wellbeing
  assigned_by_type:
    - professional
    - system
  assigned_by: text nullable
  assigned_at: timestamptz NOT NULL
  status:
    - assigned
    - active
    - completed
    - cancelled
  notes: text nullable
  metadata: jsonb
  idempotency_key: text nullable
  created_at: timestamptz NOT NULL
  updated_at: timestamptz NOT NULL
```

Assignments do not generate DVG.

---

## 16. `execution_evidence`

```yaml
execution_evidence:
  id: uuid PK
  client_id: uuid FK -> clients.id

  source_type:
    - manual
    - dashboard
    - app
    - professional
    - apps_script
    - wearable
    - import

  source_content_id: uuid nullable FK -> content_registry.id
  source_entity_type: text nullable
  source_entity_id: text nullable

  pillar:
    - nutrition
    - exercise
    - sleep
    - stress
    - conscious_wellbeing

  occurred_at: timestamptz NOT NULL

  quantity: numeric nullable
  unit: text nullable
  duration_minutes: numeric nullable
  intensity: text nullable

  metadata: jsonb
  provenance: jsonb
  deduplication_key: text NOT NULL
  idempotency_key: text nullable

  created_at: timestamptz NOT NULL
```

### MVP deduplication

Minimum database protection:

```text
UNIQUE(client_id, deduplication_key)
```

`idempotency_key` additionally protects caller retries.

Deduplication keys are generated by Apps Script according to normalized evidence identity.

No complex wearable/event reconciliation is required in MVP.

---

## 17. `action_logs`

`action_logs` is the canonical operational ledger of accredited behavior.

```yaml
action_logs:
  id: uuid PK
  client_id: uuid FK -> clients.id
  canonical_action_id: text FK -> canonical_actions.canonical_action_id
  evidence_id: uuid FK -> execution_evidence.id
  accreditation_rule_id: text nullable
  level_variant: text NOT NULL
  occurred_at: timestamptz NOT NULL
  base_dvg_hours: numeric NOT NULL
  engine_version: text NOT NULL
  calculation_version: text NOT NULL
  deduplication_key: text NOT NULL

  status:
    - validated
    - pending
    - rejected
    - reversed

  provenance: jsonb
  created_at: timestamptz NOT NULL
```

Recommended protection:

```text
UNIQUE(client_id, deduplication_key)
```

### Historical snapshot rule

`base_dvg_hours` is copied from the canonical applicable level variant at calculation/accreditation time for auditability.

It is not independently recalculated by Dashboard or Apps Script business constants.

### Core invariant

Only:

```text
status = validated
```

can enter the gamification engine.

Rejected/reversed records are not physically deleted as a shortcut to history rewriting.

---

## 18. `client_progress`

Derived projection.

```yaml
client_progress:
  client_id: uuid PK/FK -> clients.id
  total_dvg_hours: numeric NOT NULL
  total_dvg_days: numeric NOT NULL
  current_level: text nullable
  streaks: jsonb
  pillar_progress: jsonb
  calculation_trace: jsonb
  calculated_at: timestamptz NOT NULL
  engine_version: text NOT NULL
  calculation_version: text NOT NULL
```

This table is reconstructible.

It is not the source of action history.

---

## 19. `daily_progress`

```yaml
daily_progress:
  id: uuid PK
  client_id: uuid FK -> clients.id
  date: date NOT NULL
  pillar:
    - nutrition
    - exercise
    - sleep
    - stress
    - conscious_wellbeing
  action_count: integer NOT NULL
  base_dvg_hours: numeric NOT NULL
  final_dvg_hours: numeric NOT NULL
  calculation_trace: jsonb
  engine_version: text NOT NULL
  calculation_version: text NOT NULL
  calculated_at: timestamptz NOT NULL
```

Constraint:

```text
UNIQUE(client_id, date, pillar)
```

Weekly multipliers/caps may be represented through canonical engine traces/rebuild operations without introducing `weekly_progress` in v1.

---

## 20. `audit_log`

Append-only audit trail.

```yaml
audit_log:
  id: uuid PK
  request_id: uuid NOT NULL
  actor_type:
    - professional
    - patient
    - service
    - system
  actor_id: text nullable
  action: text NOT NULL
  entity_type: text NOT NULL
  entity_id: text nullable
  before_data: jsonb nullable
  after_data: jsonb nullable
  metadata: jsonb
  created_at: timestamptz NOT NULL
```

Sensitive/professional modifications must be auditable.

---

## 21. RLS / security model

### Service role

```yaml
service_role:
  holder: Apps Script service layer
  browser_exposure: forbidden
  repository_persistence: forbidden
```

### Professional Dashboard

Target path:

```text
Dashboard → Apps Script → Supabase
```

Direct writes from Dashboard to Supabase are forbidden in the target standalone architecture.

### Future patient App/PWA

Future patient-scoped model may use:

```text
clients.auth_user_id
```

to scope:

- own allowed profile subset;
- own assignments;
- own evidence;
- own progress.

Professional/private fields remain protected.

### Anonymous access

Anonymous access must never expose:

- client profiles;
- action logs;
- audit log;
- sensitive evidence;
- derived private progress.

---

## 22. Non-goals

Not represented in this v1 model:

- tenants;
- billing;
- CRM activity ledger;
- n8n event/outbox platform;
- AI memory;
- sessions/programs;
- wearables ingestion subsystem;
- enterprise permissions.

---

## 23. Acceptance invariant

The data model is accepted when it can support:

```text
CREATE CLIENT
↓
CREATE/UPDATE PROFILE
↓
ASSIGN CONTENT
↓
REGISTER EVIDENCE
↓
ACCREDIT ACTION
↓
CREATE VALIDATED ACTION_LOG
↓
CALCULATE DVG
↓
UPDATE DERIVED PROGRESS
↓
READ DASHBOARD DATA
```

without bypassing the frozen integration chain.
