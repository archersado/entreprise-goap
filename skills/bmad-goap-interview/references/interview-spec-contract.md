# InterviewSpec contract

The canonical artifact is one versioned JSON object:

```json
{
  "id": "stable-slug",
  "version": 1,
  "title": "Business-readable title",
  "summary": "Scope summary",
  "objective": "Observable business outcome",
  "actors": [{"id":"role_id","name":"Role name","responsibilities":["..."]}],
  "states": [{"id":"positive_fact","description":"...","observable":true,"evidenceRequired":"..."}],
  "actions": [{
    "id":"action_id",
    "name":"Action name",
    "description":"...",
    "ownerRole":"role_id",
    "preconditions":["positive_fact"],
    "effects":["new_fact"],
    "removes":["stale_fact"],
    "executor":"demo:semantic-action",
    "evidenceType":"evidence_kind",
    "failureHandling":"Human-readable summary",
    "failureModes":[{
      "id":"timeout",
      "trigger":"TIMEOUT",
      "description":"...",
      "effects":["timed_out"],
      "recoveryActionId":"retry_or_escalate",
      "terminal":false,
      "evidenceType":"timeout_record"
    }],
    "noKnownFailureRationale":"",
    "reversibility":"COMPENSATABLE",
    "reverseActionId":"compensate_action",
    "cost":1.0,
    "idempotent":true
  }],
  "goals":[{"id":"goal_id","description":"...","satisfiedBy":["new_fact"],"value":1.0}],
  "policies":[{"id":"policy_id","description":"...","expression":"..."}],
  "assumptions":[],
  "openQuestions":[],
  "confirmedClaims":[],
  "rejectedClaims":[],
  "status":"DRAFT"
}
```

## Semantic rules

- State IDs express positive, observable facts. `NOT`, `!`, and `NOT(...)` syntax is unsupported.
- `observable` is boolean and `evidenceRequired` is mandatory.
- `effects` asserts facts; `removes` retracts facts made stale by the transition.
- Failure triggers are `FAILURE`, `TIMEOUT`, `REJECTION`, `CANCELLATION`, `PARTIAL_SUCCESS`, or `BUSINESS_RULE`.
- A non-terminal failure mode needs a defined `recoveryActionId`.
- `REVERSIBLE` and `COMPENSATABLE` actions need a defined `reverseActionId`; `IRREVERSIBLE` actions must not provide one.
- Use either non-empty `failureModes` or a concrete `noKnownFailureRationale`, never both.
- `CONFIRMED` means the human reviewed the complete current version, not merely that individual answers were accepted.
