# NUTRILONGX — APPS SCRIPT FUNCTION CONTRACT v1

**Status:** `APPROVED`  
**Scope:** Functional service boundary for standalone NUTRILONGX v1  
**Consumer:** Dashboard; future Patient App/PWA  
**Provider:** Google Apps Script  
**Operational store:** Supabase  
**Date:** 2026-08-20

---

## 1. Contract principles

Apps Script is the standalone service/function layer.

All Dashboard operations must be expressed through the functions defined here or through future versioned extensions of this contract.

Apps Script must:

- validate inputs;
- return stable envelopes;
- use stable machine-readable errors;
- enforce idempotency where required;
- write audit records for sensitive operations;
- protect secrets;
- preserve canonical IDs;
- delegate DVG logic to the canonical gamification engine;
- never invent accreditation or safety rules.

---

## 2. Global success envelope

Every successful public operation returns:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO-8601",
    "schema_version": "NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1"
  }
}
```

---

## 3. Global error envelope

```json
{
  "ok": false,
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Human-readable message",
    "details": {}
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO-8601",
    "schema_version": "NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1"
  }
}
```

Dashboard must branch on:

```text
error.code
```

not free-form `message`.

---

## 4. Common error codes

```yaml
VALIDATION_ERROR:
  meaning: invalid request payload

NOT_FOUND:
  meaning: requested entity does not exist

CONFLICT:
  meaning: operation conflicts with current state

DUPLICATE_REQUEST:
  meaning: idempotent request already processed

UNAUTHORIZED:
  meaning: authentication failed

FORBIDDEN:
  meaning: actor lacks operational permission

CANONICAL_REFERENCE_NOT_FOUND:
  meaning: requested canonical ID is unknown

ACCREDITATION_REVIEW_REQUIRED:
  meaning: deterministic accreditation rule is not available

ACCREDITATION_REJECTED:
  meaning: evidence does not satisfy an applicable accreditation rule

SAFETY_ADVISORY:
  meaning: non-blocking safety warning exists

ENGINE_ERROR:
  meaning: canonical gamification calculation failed

DATA_INTEGRITY_ERROR:
  meaning: frozen invariant or referential integrity problem

INTERNAL_ERROR:
  meaning: unexpected service failure
```

---

## 5. Client functions

```text
clients.list(filters?)
clients.get(clientId)
clients.create(payload)
clients.update(clientId, payload)
clients.getProfile(clientId)
clients.updateProfile(clientId, payload)
```

### `clients.create(payload)`

Minimum request:

```json
{
  "external_code": "NLX-C-0001",
  "first_name": "Nombre"
}
```

Optional:

```json
{
  "last_name": "Apellido",
  "email": "user@example.com",
  "phone": "+34...",
  "status": "active"
}
```

Idempotency/business uniqueness:

```text
external_code
```

Repeated attempts using the same `external_code` must not create duplicate clients.

---

## 6. Content functions

```text
content.listRecipes(filters?)
content.getRecipe(canonicalId)

content.listExercises(filters?)
content.getExercise(canonicalId)

content.listMind(pillar, filters?)
content.getMindContent(canonicalId)

content.assign(clientId, contentType, canonicalId, options?)
content.unassign(assignmentId, reason?)
content.listAssignments(clientId, filters?)
```

### Allowed pillar values

```text
nutrition
exercise
sleep
stress
conscious_wellbeing
```

`mind` is invalid as persisted pillar input.

### `content.assign`

Must:

1. resolve `content_registry`;
2. verify client;
3. verify content exists/active;
4. create idempotent assignment;
5. append audit event.

Assignment does not create evidence or DVG.

---

## 7. Evidence functions

```text
evidence.register(payload)
evidence.list(clientId, filters?)
evidence.get(evidenceId)
```

### `evidence.register(payload)`

Example:

```json
{
  "client_id": "uuid",
  "source_type": "dashboard",
  "source_content": {
    "content_type": "recipe",
    "canonical_id": "NLX-001"
  },
  "pillar": "nutrition",
  "occurred_at": "2026-08-20T12:00:00+02:00",
  "quantity": 1,
  "unit": "serving",
  "duration_minutes": null,
  "intensity": null,
  "metadata": {},
  "idempotency_key": "caller-generated-key"
}
```

Allowed `source_type`:

```text
manual
dashboard
app
professional
apps_script
wearable
import
```

### Invariant

`evidence.register()` creates only `EXECUTION_EVIDENCE`.

It must never:

- create DVG directly;
- call the gamification engine directly;
- fabricate a canonical action;
- bypass accreditation.

---

## 8. Action functions

```text
actions.list(filters?)
actions.get(canonicalActionId)
actions.accredit(evidenceId, options?)
actions.listLogs(clientId, filters?)
actions.getLog(actionLogId)
actions.accreditAndCalculate(evidenceId, options?)
```

---

## 9. `actions.accredit`

Mandatory execution sequence:

```text
read evidence
↓
resolve applicable content-action binding where required
↓
resolve canonical action
↓
resolve accreditation rule
↓
validate evidence requirements
↓
deduplicate
↓
create/update ACTION_LOG state
```

Possible outcomes:

### Validated

```json
{
  "status": "validated",
  "action_log_created": true,
  "action_log_id": "uuid"
}
```

### Review required

```json
{
  "status": "pending",
  "reason": "ACCREDITATION_REVIEW_REQUIRED"
}
```

### Rejected

```json
{
  "status": "rejected",
  "reason": "ACCREDITATION_REJECTED"
}
```

No threshold absent from canonical sources may be invented.

`contextual_opposite` can never become positive accredited compliance.

---

## 10. `actions.accreditAndCalculate`

Convenience orchestration function.

It is not a bypass.

Sequence:

```text
actions.accredit
↓
validated ACTION_LOG?
↓ yes
gamification.calculateAction
↓
gamification.recalculateDay
↓
update/rebuild client progress
```

If accreditation is not validated, gamification is not executed.

---

## 11. Gamification functions

```text
gamification.calculateAction(actionLogId)
gamification.recalculateDay(clientId, date)
gamification.rebuildProgress(clientId)
```

### `gamification.calculateAction`

Precondition:

```text
action_logs.status = validated
```

If not:

```text
DATA_INTEGRITY_ERROR
```

or a more specific stable contract error introduced in a later compatible revision.

### Canonical authority

The function must consume the FROZEN canonical gamification engine.

Apps Script must not embed independent values for:

- base DVG;
- calculation order;
- streak multipliers;
- boosters;
- combos;
- daily caps;
- weekly multipliers;
- weekly caps.

---

## 12. Progress functions

```text
progress.get(clientId)
progress.getDaily(clientId, range)
progress.getPillar(clientId, pillar, range)
```

These are read operations over derived projections.

The service may rebuild progress from `action_logs` when explicitly requested or operationally required.

---

## 13. Safety functions

```text
safety.evaluateExercise(clientId, exerciseCanonicalId)
safety.getWarnings(clientId, filters?)
```

Mandatory v1 response semantics:

```json
{
  "mode": "ADVISORY_ONLY",
  "automated_blocking": false,
  "warnings": []
}
```

Safety may advise.

Safety must not autonomously block exercise while current rules remain pending human review.

Safety status must not alter DVG values.

---

## 14. Standard filters

Common filter shape:

```json
{
  "status": [],
  "pillar": [],
  "from": "ISO-8601/date",
  "to": "ISO-8601/date",
  "limit": 50,
  "cursor": null
}
```

Apps Script must not expose arbitrary SQL-like filtering to Dashboard.

---

## 15. Idempotency requirements

Idempotency is mandatory for:

```text
clients.create
content.assign
evidence.register
actions.accredit
gamification.calculateAction
gamification.recalculateDay
gamification.rebuildProgress
```

Recommended keys:

```yaml
clients.create:
  key: external_code

content.assign:
  key: idempotency_key + logical active assignment

evidence.register:
  key:
    - idempotency_key
    - deduplication_key

actions.accredit:
  key: evidence + canonical action + accreditation rule/dedup policy

gamification.calculateAction:
  key: action_log_id + calculation_version

gamification.recalculateDay:
  behavior: deterministic upsert

gamification.rebuildProgress:
  behavior: deterministic rebuild
```

Retrying the same logical operation must not duplicate DVG.

---

## 16. Operational permissions v1

```yaml
professional:
  clients: read_write
  profiles: read_write
  assignments: read_write
  evidence: read_write
  accreditation: execute
  progress: read
  safety: read_evaluate

patient_future:
  own_client: limited_read
  own_assignments: read
  own_evidence: create_read
  own_progress: read
  accreditation: no_direct_control

service:
  canonical_sync: allowed
  rebuild: allowed
  maintenance: allowed
```

Complex RBAC is out of scope.

---

## 17. Audit requirements

At minimum, audit:

- client creation/update;
- profile changes;
- content assignments/unassignments;
- professional evidence registration;
- accreditation results;
- reversed action logs;
- manual rebuilds;
- safety evaluation invoked in professional context;
- canonical sync/import operations.

Each audit event should include the same `request_id` used in the function response when applicable.

---

## 18. Acceptance flow

The contract must support:

```text
clients.create
↓
clients.updateProfile
↓
content.assign
↓
evidence.register
↓
actions.accredit
↓
validated ACTION_LOG
↓
gamification.calculateAction
↓
gamification.recalculateDay / rebuildProgress
↓
progress.get
```

This is the principal standalone backend v1 acceptance flow.
