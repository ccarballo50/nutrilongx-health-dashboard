# NUTRILONGX — BACKEND IMPLEMENTATION PLAN v1

**Status:** `APPROVED`  
**Scope:** Immediate implementation sequence after canonical spec persistence  
**Date:** 2026-08-20

---

## 1. Goal

Implement the minimum standalone backend required for real-client operation while preserving the frozen canonical contracts.

Principal acceptance flow:

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
UPDATE CLIENT_PROGRESS
↓
READ DASHBOARD DATA
```

---

## 2. Phase 0 — Canonical persistence

Before implementation:

1. persist the five standalone v1 specifications in Git;
2. update the appropriate registries/indexes;
3. verify no higher-level FROZEN contract is contradicted;
4. commit through normal repository workflow.

No implementation should precede canonical persistence.

---

## 3. Phase 1 — Read-only preflight

Claude Code must:

1. read current `main`;
2. inspect `supabase/migrations/`;
3. inspect Supabase references in services/API/frontend;
4. inspect legacy Mente implementation;
5. inspect canonical registry;
6. perform live Supabase schema inspection read-only when environment permits;
7. report unexpected conflicts.

Never print secrets.

---

## 4. Phase 2 — Additive standalone schema

Create the new standalone migration implementing the approved 17-table model.

Requirements:

- no legacy DROP;
- FK constraints;
- uniqueness/idempotency constraints;
- timestamps;
- required indexes;
- RLS;
- audit support;
- canonical IDs preserved.

---

## 5. Phase 3 — Canonical import/sync

Populate operational projections from Git canonical artifacts.

Expected initial scope:

```text
58 recipes
24 exercises
20 exercise variants
119 canonical action families
12 exercise safety rules
nutrition content-action bindings
```

Rules:

- preserve source version;
- preserve schema/provenance;
- do not use legacy artifacts as active source;
- safety stays `ADVISORY_ONLY`;
- do not manufacture accreditation rules.

Exercise bindings are not invented if no approved source exists.

---

## 6. Phase 4 — Migrate Mente content

Transform existing legacy data into `mind_content`.

Map explicitly to:

```text
sleep
stress
conscious_wellbeing
```

Preserve:

- original source table/id where possible in provenance;
- rich text;
- challenge/video/infographic structure;
- publication status;
- references.

Validate counts before cutover.

---

## 7. Phase 5 — Apps Script service layer

Implement:

```text
clients.*
content.*
evidence.*
actions.*
gamification.*
progress.*
safety.*
```

Mandatory capabilities:

- validation;
- stable envelopes;
- machine-readable errors;
- secret protection;
- audit logging;
- idempotency;
- advisory safety;
- canonical rule consumption.

---

## 8. Phase 6 — Gamification integration

Implement the frozen engine without changing its economics.

Verify:

```text
CONTENT != DVG
BINDING != DVG
EVIDENCE != DVG
validated ACTION_LOG -> GAMIFICATION_ENGINE
```

No legacy level multiplier may be reintroduced over already-valued canonical level variants.

---

## 9. Phase 7 — Acceptance and anti-duplication tests

Mandatory tests:

```text
create client -> PASS
update profile -> PASS
assign content -> PASS
register evidence -> PASS
accredit derivable action -> PASS
create validated action_log -> PASS
calculate DVG -> PASS
update progress -> PASS
read progress -> PASS
```

Negative/invariant tests:

```text
repeat evidence request -> no duplicate DVG
repeat accreditation -> no duplicate action_log
repeat calculation -> no duplicate DVG
contextual_opposite -> no positive accreditation
review_required -> no invented threshold
non-validated action_log -> engine refuses
safety warning -> advisory only
```

---

## 10. Phase 8 — Dashboard cutover

Dashboard moves to:

```text
Dashboard -> Apps Script -> Supabase
```

Remove functional dependence on:

- localStorage/mock state;
- direct browser writes to Supabase;
- legacy Vercel APIs for migrated functionality.

Legacy paths may remain temporarily until verified unused.

---

## 11. Git workflow

When implementation is within approved scope and:

- QA PASS;
- security PASS;
- tests PASS;
- repository checks PASS;

Claude Code may execute:

```text
branch
→ implement
→ test
→ commit
→ push
→ PR
→ checks
→ merge
```

Stop only for:

- real architecture conflict;
- secret/credential problem;
- unsafe destructive migration;
- failed tests/checks;
- unexpected live-schema conflict.

---

## 12. Completion criterion

Backend implementation reaches v1 acceptance when the full principal flow works against real Supabase state through Apps Script with no duplicate DVG and with auditability preserved.

**Next state after canonical persistence:** `READY_FOR_STANDALONE_BACKEND_IMPLEMENTATION`
