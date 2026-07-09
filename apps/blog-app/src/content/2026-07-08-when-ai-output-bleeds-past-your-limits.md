---
title: "When AI Output Bleeds Past Your Limits"
slug: 2026-07-08-when-ai-output-bleeds-past-your-limits
description: Setting a length limit on AI output doesn't guarantee it fits where it's going. Why LLM/agent responses still get truncated, split, or dropped — and how to budget the whole pipeline so nothing bleeds.
categories: ['llm', 'ai', 'reliability', 'engineering']
coverImage: https://dalenguyen.me/assets/images/blog/2026-07-08-when-ai-output-bleeds-past-your-limits.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-07-08T10:00:00.000Z
author: Dale Nguyen
draft: false
---

You set a length limit on your model's output. You even enforce it in code — `if len(text) > MAX_CHARS: text = text[:MAX_CHARS]`. Ship it, move on.

Then a support bot posts a long answer and the chat platform splits it into two messages, and the second one — the one with the actual summary — is the one nobody reads. Or a generated record lands in a `VARCHAR(2000)` column, the tail quietly disappears, and it takes an audit to notice. Nothing errored. Nothing logged. The content just isn't there.

A length limit is not a contract that content fits where it's going. It's one control point in a chain of several, and content **bleeds** — silently truncated, split across boundaries, or dropped outright — wherever two links in that chain disagree.

## What "bleed" means

Bleed is content escaping the shape you intended for it. It shows up in a few distinct flavors, and it's worth naming them because they get misdiagnosed as different bugs when they're the same root cause:

| Type | What happens |
|------|--------------|
| **Truncation bleed** | Content past your cap is dropped — usually with no error. |
| **Split bleed** | A downstream platform breaks one payload into several, so content lands somewhere you didn't put it (and readers may only see the first part). |
| **Overflow bleed** | Content exceeds a field, DB column, or UI card and is cut or wraps unexpectedly. |
| **Placement bleed** | Critical content appended *after* variable-length content is the first thing lost when the whole thing gets capped. |

## Why it happens: limits are layered

Here's the part that trips people up: you don't own one limit, you own the middle of three.

```text
[ Model ]            [ Your app ]            [ Destination ]
verbosity +   ──►    format + cap    ──►     chat API / email body /
max-output-tokens    (MAX_CHARS)             DB column / UI card
   limit #1             limit #2                  limit #3
```

You wrote limit #2, so that's the one you think about. But bleed happens wherever any two *adjacent* limits disagree:

- Model (#1) is more verbose than your cap (#2) → **you truncate**.
- Your cap (#2) is higher than the destination (#3) → **the platform truncates or splits for you**.

Here's the trap: raising #2 to stop your own truncation doesn't fix anything — it just relocates the overflow to #3. You've traded a truncation you controlled and could log for a split you don't control and probably won't notice.

## Symptoms

A few generic shapes this takes in practice:

- A support bot posts a long answer to a chat platform whose per-message limit (say, ~4,000 characters) is smaller than your app's cap. The platform auto-splits the answer into two messages, and the second one — carrying your summary or citations — is easy to miss.
- You raise your truncation limit to stop cutting answers short. Now messages exceed the platform limit and get split mid-sentence instead.
- A generated record is written to a `VARCHAR(2000)` column; the tail is silently dropped; nobody notices until an audit.
- The "recommended next steps" you append after the model's prose are exactly what gets cut when the message is capped, because they're last in line.

Notice the pattern: every one of these looks like a different bug (a chat integration issue, a database issue, a UX complaint) but traces back to the same cause — nobody mapped the full chain of limits before shipping.

## Lessons learned

1. **You never own just one limit.** Map every hop from model to eyeball and write down each hop's *real* limit. The smallest one wins, whether you planned around it or not.
2. **Silent truncation is a bug, full stop.** If content can be dropped, that has to be visible (a marker in the output) and observable (a log line, a metric). Silent loss is exactly how half-answers ship looking complete.
3. **Raising a cap moves the problem, it doesn't remove it.** Every cap change needs to be re-checked against the *next* limit downstream, not just the symptom you were staring at.
4. **Critical content must not ride on variable-length content.** If the model's prose can get capped, don't append your must-keep block to the end of it — the block dies with the prose. Give it its own unit.
5. **Constrain the source, don't just clip the output.** Truncation is a last-resort safety net, not a design. The real fix is making the model produce less: concision instructions, structured fields, numbers in data rather than narrated in prose.
6. **Know the destination's real limit, empirically.** Documented limits and effective limits differ — a field might accept 40k characters while the client that renders it splits at 4k. Probe it; don't trust the docs.
7. **Your verification can lie to you.** A green check against the wrong representation or the wrong moment in time is worse than no check at all — it tells you everything's fine while content is quietly missing. More on this below.

## Solution patterns

### 1. Budget the whole pipeline

Set your app's cap **below** the strictest downstream limit, with headroom for anything that expands the payload after you measure it — headers, markdown syntax, HTML-entity encoding, emoji shortcodes:

```python
DEST_LIMIT   = 4000          # the destination's REAL per-unit limit (measured, not doc'd)
HEADROOM     = 250           # header + encoding expansion
APP_CAP      = DEST_LIMIT - HEADROOM
```

The headroom number isn't decorative — it's the gap between what you measured on plain text and what the payload becomes after your app wraps it.

### 2. Isolate critical content into its own unit

Post the must-keep, deterministic content — metrics, totals, citations, IDs — as its own message, section, or field, so truncating the variable prose can never take it down with it:

```python
send(channel, cap(model_prose, APP_CAP))   # variable — may be capped
if metrics:                                # deterministic + critical
    send(channel, render(metrics))         # its OWN unit — never collateral
```

This is the single highest-leverage change in this whole list. It doesn't prevent truncation; it makes truncation harmless.

### 3. Make truncation loud, and keep the full copy

If you're going to cap something, the cap has to announce itself — both to the reader and to your logs:

```python
def cap(text, limit):
    if len(text) <= limit:
        return text
    dropped = len(text) - limit
    log.warning("output truncated: dropped %d chars", dropped)   # observable
    return text[: limit - 1] + "…"                               # visible marker
```

Keep the untruncated version somewhere durable — a log, an object store, a "full report" link — so nothing is *irrecoverably* lost, just harder to reach.

### 4. Constrain generation, not just the output

Cheaper and cleaner than clipping after the fact. Put it in the prompt or system message:

> "Keep the whole answer under ~2,500 characters. Use tight bullets, don't restate the question or narrate your steps, and put figures/IDs in the structured field — not the prose."

Set the model's own max-output-tokens to reflect that budget too, so it plans for brevity instead of getting cut off mid-thought and handing you a truncation to detect after the fact.

### 5. Probe the real downstream limit

Do this once, empirically, instead of trusting the docs: send an oversized test payload and watch what the destination actually does.

```python
send(channel, "X" * 6000)   # then inspect: one message? two? cut at N?
```

Base your cap on the observed behavior. If it splits, know where the split lands. If it truncates, know at what byte count.

### 6. Verify correctly — representation and timing both matter

- Check the destination's **stored representation**, not the form you sent.
- Check **after** the write settles — poll for existence rather than reading on a race.
- Check **all** units when the destination may have split the payload across more than one.

## Verification pitfalls

These produce false negatives — "the content is missing!" when it's actually fine — and they'll send you debugging a bug that doesn't exist:

1. **Encoding mismatch.** You post an emoji `📊`; the platform stores it as the shortcode `:bar_chart:`. Asserting the raw emoji is present fails even though the content made it through untouched.

   ```python
   assert "📊" in fetched            # WRONG — platform re-encoded it
   assert ":bar_chart:" in fetched   # RIGHT — check the stored form
   ```

2. **Read/write race.** You read the destination before the write completed, and it looks empty. Poll until the record exists, then assert.

3. **Wrong unit.** The destination split your payload into N parts; you only fetched the first one and concluded content was lost. Enumerate all parts before asserting anything.

4. **HTML-entity surprises.** Stored or returned text often gets HTML-escaped along the way:

   ```text
   &   ->  &amp;
   <   ->  &lt;
   >   ->  &gt;
   ```

   A string match on the raw characters misses content that's present but encoded.

Rule of thumb: when a verification says content vanished, suspect the *check* first — representation, timing, unit — and only then suspect the code.

## Quick checklist

- [ ] Mapped every hop model → app → destination and recorded each real limit.
- [ ] App cap set below the strictest downstream limit, with headroom.
- [ ] Critical/deterministic content is its own unit, not appended to prose.
- [ ] Truncation is visible (marker) and logged (dropped byte count).
- [ ] Full/untruncated copy preserved somewhere durable.
- [ ] Model is instructed to be concise; max-output-tokens matches the budget.
- [ ] Probed the destination's real limit (split vs. truncate vs. error).
- [ ] Verification checks the stored representation, after write, across all units.

## One-line summary

A length limit is not a contract that content fits — it's one of several limits in a chain. Budget the chain, keep must-keep content separate and loud, make the model brief, and verify against what the destination actually stored.
