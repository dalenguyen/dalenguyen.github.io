---
title: "Structured Output Is Untrusted Input: Lessons From Shipping LLM Features on GCP"
slug: 2026-07-07-structured-output-is-untrusted-input
description: A field-tested playbook for getting machine-readable output from LLMs — three tiers of structured output, treating model output as untrusted input, the recovery layers you'll delete, and the GCP org-policy wall behind the real fix.
categories: ['llm', 'ai', 'gcp', 'reliability', 'engineering']
coverImage: https://dalenguyen.me/assets/images/blog/structured-output-is-untrusted-input.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-07-07T10:00:00.000Z
author: Dale Nguyen
draft: false
---

"Structured output" sounds like a guarantee: ask for JSON, get JSON. In production it's a spectrum of near-misses — the payload arrives as a dict, but a mangled one; a field you asked for is a string containing more JSON; the whole thing is wrapped under a key you never defined.

This is a playbook from shipping an LLM-backed code-review worker: getting data out of a model, hardening a JSON parser, and the GCP wall behind the real fix. One thread runs through all of it: **recovery layers are band-aids; the durable win is removing the failure class at the source.**

## Part 1 — Getting structured data out of a model

### Three tiers of structured output. Use the strongest one available.

Ranked weakest to strongest:

1. **Parse the free text** — `json.loads` on the response. Brittle.
2. **Forced tool / function call** — read the tool's `input`. Structured in *transport*, but not schema-validated.
3. **Provider-enforced schema** (strict / constrained decoding) — physically cannot emit a shape that violates the schema. Valid *by construction*.

Each rung removes the failure class below it and exposes the next one up:

<div data-chart="tier-ladder">Interactive diagram: the three tiers of structured output. Tier 1 parses free text, tier 2 uses a forced tool call, tier 3 enforces a schema — each removing one class of failure. Enable JavaScript to step through it.</div>

Reach for tier 3 first. If it's blocked (quota, org policy, provider support), use tier 2 plus a recovery net and gate tier 3 behind a flag.

### "Structured" output is untrusted input.

A forced tool call is not a contract. Every one of these shapes hit production, and each — unhandled — either crashed the consumer with `string indices must be integers` or discarded a correct result:

- flattened a nested object into a JSON string,
- returned an array where we expected an object,
- wrapped the entire payload under a single placeholder key,
- dropped fields,
- returned a bare string where we expected an object.

<div data-chart="shape-normalizer">Interactive gallery: five real ways a forced tool call gets mangled (flattened-to-string, array-not-object, placeholder-key wrap, dropped fields, bare string), each shown as raw payload versus the sanitized result. Enable JavaScript to explore it.</div>

Run a sanitize/normalize pass before any consumer touches the data. Never assume `result["key"]` exists or has the type you asked for.

### Recovery layers are band-aids. Track which ones the real fix deletes.

Our recovery stack grew to seven layers. Three exist **only** because output isn't schema-enforced — strict mode makes them dead code. The other four guard refusals, truncation, and total failure regardless of tier.

<div data-chart="recovery-layers">Interactive widget: seven recovery layers, each labeled band-aid or structural guard. Toggle "strict mode" and the three band-aids become dead code, leaving four structural guards. Enable JavaScript to try it.</div>

### Never silently drop data.

When output is malformed you can **recover**, **retry**, or **surface** it. Silently discarding a malformed item is data loss that looks like success. A sanitize pass that dropped every non-conforming field once emptied a whole section and rendered a blank result with no error. Treat "empty after sanitize" as a parse failure that retries — and log what you dropped:

```python
log.debug("skipping non-dict item %r", item)
```

### Fail-open vs fail-closed is a deliberate decision.

Decide what a *total* parse failure means. Our fallback posts a soft-approve stub — a conscious fail-open choice so a parsing bug never blocks humans. For a gate that blocks a deploy, fail-open would be wrong. Make a fail-open result visibly degraded ("could not be parsed") so it's never mistaken for a real one.

### A model upgrade is a behavior change.

Swapping model versions can change output *shape*, not just quality. The "wrap everything under a placeholder key" mangle appeared only after a minor version bump. Keep a fixture that asserts on output shape — keys present, types correct — and run it before any rollout.

### Retry ladder — escalate to a different model.

Cheap model → a different (or stronger) model → fail-open floor. Retrying the *same* model reproduces model-specific mangles; the placeholder-wrap bug only cleared when the retry escalated to a model that didn't have it.

### Record token usage before extraction can throw.

A refused or malformed response still costs input + output tokens. Capture `usage` off the raw response immediately — otherwise the expensive, retried calls go uncounted.

## Part 2 — Parsing model text as JSON (when you can't avoid tier 1)

If you must parse free text, it will contain things `json.loads` rejects:

- **Markdown fencing** — strip the triple-backtick `json` fences models wrap the payload in.
- **Control characters** — `\x00`–`\x1f` (except tab, newline, CR) make `json.loads` throw. Strip them.
- **Invalid backslash escapes** — `\s`, `\d`, `\.` from pasted regex or diff content raise `Invalid \escape`. Double backslashes that aren't a valid escape, *only inside string literals*.
- **Truncation** — a response cut off at `max_tokens` is *incomplete*, not malformed. Detect it (`stop_reason`, unbalanced braces) and budget `max_tokens` generously.

## Part 3 — GCP, IAM, and org policy

The right fix — provider-enforced schema — often lives behind a wall of GCP infrastructure.

### Read the error's project — it's often the caller, not the target.

A GCP API error names a project number that may be the resource, or the caller's quota project. A `SERVICE_DISABLED` error said an API "has not been used in project `123456789012`" — that was the CI service account's home project, not the target we were configuring. Resolve every number before acting:

```bash
gcloud projects list --filter="projectNumber=123456789012"
```

### `roles/owner` ≠ "can do anything."

Broad roles exclude sensitive permissions. `roles/owner` and `roles/editor` can't *set* org policies (`orgpolicy.policies.create`) — only read them. We hit `IAM_PERMISSION_DENIED` on an account that was already owner; it needed `roles/orgpolicy.policyAdmin`. Verify:

```bash
gcloud iam roles describe roles/owner \
  --format="value(includedPermissions)" | tr ';' '\n' | grep orgpolicy
```

### IAM changes propagate asynchronously.

Granting a permission and immediately using it can race — IAM grants take up to ~2 minutes to propagate. Expect the first call right after a grant to fail on propagation lag and pass on a retry; that's normal, not a bug.

### Layered errors are progress.

A `SERVICE_DISABLED` error resolving into `IAM_PERMISSION_DENIED` means you got *further* — the request now reaches an auth check it never previously hit. Re-run after each fix and read the new error on its own terms.

### An organization policy silently gates model access.

On Vertex AI, one organization policy — [`vertexai.allowedModels`](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/control-model-access) — controls which Model Garden models a project may call. When the model you rely on isn't allowed, the API doesn't return an IAM or quota error; it returns an opaque `400 FAILED_PRECONDITION`. That's exactly how tier-3 structured output failed for us: the partner model we called for schema-enforced output wasn't allowed by the policy.

It's a list constraint with three modes — allow all, deny all, or a custom allow/deny list. A *custom allow* policy implicitly denies every model you don't name, so a project that lists only a few models will 400 on any other.

**Before** — the model isn't in the allow-list, so the call is blocked:

```text
POST .../publishers/anthropic/models/MODEL_NAME:rawPredict
→ 400 FAILED_PRECONDITION   # blocked by vertexai.allowedModels
```

**After** — add the model (or the whole publisher) to the allowed values:

```yaml
# policy.yaml
name: projects/PROJECT_ID/policies/vertexai.allowedModels
spec:
  rules:
  - values:
      allowedValues:
      - publishers/anthropic                     # all Anthropic models
      - publishers/anthropic/models/MODEL_NAME   # or one specific model
```

```bash
# inspect the current policy, then apply the new one
gcloud org-policies describe vertexai.allowedModels --project=PROJECT_ID
gcloud org-policies set-policy policy.yaml   # needs orgpolicy.policyAdmin
```

The same tier-3 call now returns a schema-valid completion. The fix lived in the org policy, not the code.

## The one meta-lesson

Recovery layers are the right posture *while* the source fix is blocked — but they accrete, hide failures, and lose data. The durable win is to **remove the failure class at the source**: schema enforcement, the correct IAM role, the org policy. Know which of your defenses are stopgaps, and delete them the moment the real fix lands.

## The incident gallery

Every lesson here traces back to something that actually broke:

| Lesson | What actually happened |
|--------|------------------------|
| Three tiers | Migrated text-parse → forced tool → strict, one failure class at a time |
| Flatten-to-string | A whole nested object arrived serialized as a JSON string |
| Array-not-object | The payload came back as a list of single-key objects |
| Placeholder-key wrap | Everything nested under a literal `$PARAMETER_NAME` key |
| Bare-string field | A field expected to be an object returned as a plain string |
| Silent drop | A sanitize pass dropped every field and rendered a blank section |
| Upgrade = new failure | The wrapper mangle first appeared after a model-version bump |
| Escalate model | Retrying the *same* model reproduced the same mangle |
| Invalid escapes | `\s` / `\d` from diff content broke `json.loads` |
| Control chars | Raw `\x00`–`\x1f` bytes in the response text |
| Caller-project | "API not used in project N" pointed at the *caller's* project |
| Owner carve-out | `roles/owner` lacked `orgpolicy.policies.create` |
| Org-policy gate | The `vertexai.allowedModels` policy 400'd provider-enforced structured output |
