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

"Structured output" sounds like a guarantee. Ask the model for JSON, get JSON, move on. In production it's nothing of the sort — it's a spectrum of near-misses, and the word "structured" quietly does a lot of lying. The payload arrives as a dict, but a mangled one. A field you asked for is a string containing more JSON. The whole thing is wrapped under a key you never defined. Sometimes it's fine for weeks, then a model upgrade breaks a contract nobody thought was fragile.

This is a playbook distilled from real incidents building an LLM-backed code-review worker: three tiers of getting data out of a model, a hardening list for when you *must* parse free text, and the GCP wall you hit when you try to do it the right way. One thread runs through all of it: **recovery layers are band-aids; the durable win is removing the failure class at the source.**

## Part 1 — Getting structured data out of a model

### There are three tiers of "structured output." Always use the strongest one available.

Ranked weakest to strongest:

1. **Parse the model's free text** as JSON — `json.loads` on the response. Brittle.
2. **Forced tool / function call** — the provider forces one tool call and you read its `input`. Structured in *transport*, but **not schema-validated**.
3. **Provider-enforced schema** (strict / constrained decoding) — the provider physically cannot emit a shape that violates the schema. Valid *by construction*.

We climbed this ladder the hard way. Moving from tier 1 to tier 2 stopped us losing whole responses to text-parse errors — but it introduced a *new* class of failure: the provider returns a dict, just a mangled one. Tier 3 removes that class at the source. Each rung eliminates the failure class below it and exposes the next one up:

<div data-chart="tier-ladder">Interactive diagram: the three tiers of structured output. Tier 1 parses free text, tier 2 uses a forced tool call, tier 3 enforces a schema — each removing one class of failure. Enable JavaScript to step through it.</div>

The practical rule: reach for tier 3 first. If it's unavailable — quota, org policy, or the provider doesn't support it — use tier 2 **plus a recovery net** (below) and treat tier 1 as a last resort with a hardened parser. Gate tier 3 behind a flag so you can flip it on the moment it's unblocked, without a code change.

### "Structured" output is untrusted input. Validate it at the boundary.

A forced tool call is not a contract. Every one of these shapes hit production, and each one — unhandled — either crashed the consumer with `string indices must be integers` or silently discarded a complete, correct result:

- it **flattened a nested object into a JSON string**,
- it returned an **array where we expected an object**,
- it **wrapped the entire payload under a single placeholder key**,
- it **dropped optional or trailing fields** entirely,
- it returned a **bare string where we expected an object**.

Pick one and watch what a sanitize pass has to do to make it safe:

<div data-chart="shape-normalizer">Interactive gallery: five real ways a forced tool call gets mangled (flattened-to-string, array-not-object, placeholder-key wrap, dropped fields, bare string), each shown as raw payload versus the sanitized result. Enable JavaScript to explore it.</div>

The lesson: after extraction, run a **sanitize/normalize pass** before any consumer touches the data. Defensively coerce known-recoverable shapes; reject the rest *loudly*. Never assume `result["key"]` exists or has the type you asked for.

### Recovery layers are band-aids. Track which ones the real fix deletes.

Each defensive coercion reacts to one provider quirk. That's fine as a stopgap — but keep a clear line between *band-aids for a failure class* and *structural guards you'll always want*. Our recovery stack grew to seven layers, one per quirk. Three of them exist **only** because output isn't schema-enforced; strict mode makes them dead code. The other four guard refusals, truncation, and total failure — they stay useful regardless of tier.

Flip the switch and watch the band-aids fall away:

<div data-chart="recovery-layers">Interactive widget: seven recovery layers, each labeled band-aid or structural guard. Toggle "strict mode" and the three band-aids become dead code, leaving four structural guards. Enable JavaScript to try it.</div>

Comment each recovery function with *the specific quirk and incident it addresses*, and whether schema enforcement would make it unnecessary. That comment is what lets a future engineer safely delete it.

### Make degradation observable. Never silently drop data.

When output is malformed you have three honest options: **recover** it, **retry**, or **surface** the failure. Silently discarding a malformed item is the one wrong option — it's data loss that looks like success.

We learned this the embarrassing way. A sanitize pass that dropped every non-conforming field once emptied an entire section and rendered a blank result with no error. The failure was invisible until a human noticed the empty output. The fix was to treat "empty after sanitize" as a *parse failure that trips a retry*, not a valid empty result. If a recovery yields nothing usable, raise or retry rather than return the empty husk — and log what you dropped and why:

```python
log.debug("skipping non-dict item %r", item)
```

A drop you can't see is a drop you can't debug.

### Fail-open vs fail-closed is a deliberate decision, not a default.

Decide, explicitly, what a *total* parse failure means for your system. Our last-resort fallback posts a stub with a soft-approve verdict. That's a conscious fail-open choice — don't block humans on our parsing bug — but it means a review that never parsed reads as roughly-approved. If the stakes were higher (a gate that blocks a deploy), fail-open would be the wrong default.

Name the failure semantics in the fallback itself. If fail-open, make the output *visibly degraded* ("could not be parsed") so it's never mistaken for a real result. If fail-closed, make sure something gets alerted.

### A model upgrade is a behavior change. New model, new failure modes.

Swapping model versions can change output *shape* behavior, not just quality. The "wrap everything under a placeholder key" mangle appeared *only* after a minor model-version bump — it had never been seen before. An unrelated upgrade silently broke a downstream contract.

Keep a small fixture of real inputs and assert on output *shape* — keys present, types correct — not just content. Run it against any new model before rollout.

### Use a retry ladder — and escalate to a *different* model.

Structure retries as: cheap/fast model → escalate to a stronger (or just *different*) model → fail-open floor. Escalating to a different model dodges model-specific quirks; retrying the *same* model often reproduces the same mangle. Our placeholder-wrap bug was specific to one model — the retry originally re-asked that same model and got the same garbage back. Escalating to a model that didn't exhibit the quirk fixed it.

Don't retry-in-place blindly. If the failure is model-specific, the second attempt should change the variable that matters — the model.

### A failed call still costs tokens. Record usage before extraction can throw.

Token accounting must happen *before* any parse or validation step that can raise. A refused or malformed response consumed input and output tokens all the same. Recording usage *after* extraction meant parse-failed calls — the expensive, retried ones — went uncounted, undercounting exactly the runs you most want to see in cost analytics. Capture `usage` off the raw response object immediately, before you touch the payload.

## Part 2 — Parsing model text as JSON (when you can't avoid tier 1)

If you must parse free text into JSON, the text *will* contain things `json.loads` rejects. Every item below was a real "the whole response got thrown away" incident. A five-line guard is cheaper than a lost result.

- **Markdown fencing** — strip the triple-backtick `json` … fences models love to wrap the payload in.
- **Raw control characters** — bytes in the `\x00`–`\x1f` range (except tab, newline, CR) make `json.loads` throw. Strip or replace them.
- **Invalid backslash escapes** — models paste regex, YAML, or diff content (`\s`, `\d`, `\.`) straight into string literals unescaped, raising `Invalid \escape`. Repair by doubling backslashes that aren't a valid escape — *only inside string literals*.
- **Truncation** — a response cut off at `max_tokens` isn't malformed data, it's an *incomplete* response. Detect it (`stop_reason`, unbalanced braces) and handle it distinctly: brace-match the first complete object, or close dangling braces as a last resort. And budget `max_tokens` generously — truncation is the single most common cause of "malformed JSON."

## Part 3 — GCP, IAM, and org policy

Getting the model to behave is half the battle. The other half is that the *right* fix — provider-enforced schema — often lives behind a wall of GCP infrastructure. These lessons came from doing that plumbing through Terraform and a plan/apply bot.

### Read the error's *project* carefully — it's often the caller, not the target.

A GCP API error names a project number. That number may be the **resource being acted on**, or the **project the request is billed and quota'd against** — the caller's quota project. They're frequently different.

A `SERVICE_DISABLED` error told us an API "has not been used in project `987654321098`." That number wasn't the target project we were configuring — it was the home project of the CI service account making the request. The API had to be enabled where the *caller* lives, not where the *resource* lives. Resolve every project number in an error before acting:

```bash
gcloud projects list --filter="projectNumber=987654321098"
```

### Predefined roles have deliberate carve-outs. `roles/owner` ≠ "can do anything."

Broad roles intentionally exclude sensitive permissions. `roles/owner` and `roles/editor` do **not** grant the ability to *set* org policies (`orgpolicy.policies.create`, `orgpolicy.policy.set`) — only to *read* them. Governance-sensitive permissions are quarantined into dedicated roles.

We hit an `IAM_PERMISSION_DENIED` on `orgpolicy.policies.create` against a service account that was *already* `roles/owner`. Owner wasn't enough — it needed `roles/orgpolicy.policyAdmin` explicitly. Never assume a role covers a permission; verify:

```bash
gcloud iam roles describe roles/owner \
  --format="value(includedPermissions)" \
  | tr ';' '\n' | grep orgpolicy
```

Grant the *specific* predefined role that contains the permission, at the *narrowest* scope that works: project over folder over org.

### IAM changes propagate asynchronously. Grant-then-use in one apply can race.

Creating an IAM binding and then *using* that permission in the same Terraform apply can fail: the binding and the consuming resource have no dependency edge, and IAM grants take up to ~2 minutes to propagate. Add an explicit `depends_on` from the consuming resource to the binding — and still expect the *first* apply may fail on propagation lag and succeed on a re-apply. That retry is normal for grant-then-use, not a bug.

### Layered errors are progress. Fix one, expect the next.

Infra failures surface one at a time. A `SERVICE_DISABLED` error resolving into an `IAM_PERMISSION_DENIED` means you got *further* — the request now reaches an authorization check it never previously hit. Treat a *changed* error as forward motion, not a new problem. Re-run after each fix and read the new error on its own terms.

### Org policies silently gate features. Check them when a capability "just 400s."

Org policy constraints can block product features org-wide, returning opaque `400 FAILED_PRECONDITION` errors from the API — not an IAM or quota error. This is the punchline of the whole post: **provider-enforced structured output (tier 3) returned a 400** on our project because an org policy didn't list the feature in its allowed set. The fix wasn't code — it was a Terraform-managed org policy change, which itself needed `roles/orgpolicy.policyAdmin`.

When a documented feature 400s with a precondition error and your IAM and quota look fine, suspect an org policy.

### IAM and org policy are infrastructure-as-code. Don't hand-fix with `gcloud`.

In a Terraform shop, service accounts, IAM bindings, and org policies are declared in code and applied through the pipeline. A manual `gcloud` change creates drift the next apply reverts — and hides the real state from everyone reading the repo. Diagnose read-only with `gcloud` freely (fast and safe), but make the *change* in Terraform and let the pipeline apply it.

## The one meta-lesson

Every fix in Part 1 is a recovery layer reacting to a specific quirk, backed by a retry ladder and a fail-open floor. That's the right posture *while* the source fix is blocked — but recovery layers accrete, hide failures, and can silently lose data. The durable win is almost always to **remove the failure class at the source**: schema enforcement, the correct IAM role, the org policy. Know which of your defenses are stopgaps, and delete them the moment the real fix lands.

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
| Org-policy gate | An org policy 400'd provider-enforced structured output |
