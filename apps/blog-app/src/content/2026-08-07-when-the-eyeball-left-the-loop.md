---
title: "When the Eyeball Left the Loop"
slug: 2026-08-07-when-the-eyeball-left-the-loop
description: Delegating frontend work to a coding agent quietly removes the one verification step nobody ever wrote down — the human glance. Here's why code review can't recover it, and how your job shifts from writing the styling to measuring the render.
categories: ['ai-agents', 'frontend', 'css', 'verification', 'developer-workflow']
coverImage: https://dalenguyen.me/assets/images/blog/when-the-eyeball-left-the-loop.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-08-07T00:00:00.000Z
author: Dale Nguyen
draft: false
---

*A note on how delegating frontend work to coding agents quietly removes the one
verification step nobody wrote down — and why the human's job moves from writing the
styling to measuring the render. Examples are generic; adapt them to your stack.*

## TL;DR

Agents made producing a plausible-looking styling change almost free. They did not
make **knowing whether it's right** any cheaper. So the bottleneck moved, and if your
process doesn't move with it, you ship unverified work with a green pipeline
attached.

The specific trap: for backend logic, "compiles + tests pass" is a decent proxy for
correctness. For styling it never was — a human always glanced at the result before
merging, and that glance was so cheap and so continuous that nobody ever wrote it
into the process. Hand implementation to an agent and the glance disappears without
anything failing. Nothing goes red. The change is simply wrong.

Reinstate it deliberately, as a **named stage with numbers in it**: measure what
the browser actually computed — resolved styles and rendered pixels — against every
state the design defines (the *state matrix*: idle, hover, selected, disabled).
Then turn that stage into a reusable asset so it's cheap enough to actually run,
and so the agent can eventually run it for you.

## What actually changed

The old loop had an invisible verification step baked into implementation. You never
"verified" — you *iterated by eye* until it looked right, and correctness arrived as
a side effect of authoring. Delegate authoring and that glance disappears silently:
every remaining signal stays green while the change is wrong. The working flow puts
the step back, explicitly and with real measurements. Step through the three stages:

<div data-chart="loop">Diagram: the verification step moving from an implicit, continuous human glance (old loop) to nothing at all (naive delegation) to a named, numeric VERIFY stage (working loop). Enable JavaScript for the interactive walkthrough.</div>

The shift in one line: **you stopped being the author and became the instrument.**

## Why code review can't cover the gap

Between what an agent writes and what a user sees are layers that only exist at
runtime:

<div data-chart="layers">Diagram: the pipeline from intent ("borderless") to authored code (variant="ghost" plus the shared component's base classes) to resolved style (the cascade deciding among conflicting declarations) to composited pixels (alpha-blended over whatever ancestor is behind it). The agent reasons at the intent layer and CI checks the authored code, but nothing checks the resolved style or the composited pixels. Enable JavaScript to view.</div>

Three concrete ways those unchecked layers bite:

- A shared component applies its own base classes unconditionally. Your prop says
  "borderless"; the component still adds a border unless you also pass the opt-out
  flag it happens to expose. Both are true at once, and the component wins.
- Utility classes for mutually exclusive states compete on CSS **specificity**, not
  on your intent. A hover-prefixed class outranks a plain one, so the "selected"
  style you added can silently lose that contest and never appear on screen.
- A design value may be **translucent**, so the same declaration renders as different
  pixels over different backgrounds. No solid token can be right in both places.

None of that is visible in anything CI inspects. Unit and component tests
don't help either: they assert on structure and class strings, while the properties
that failed are *emergent* — a computed border width, a blended color. A test
asserting the right variant was passed will stay green forever while the element
renders a border.

## The underlying principle: trust follows observability

This generalizes past frontend work, and it's the part worth keeping:

> **Delegate to an agent exactly as far as it can observe the consequences of its
> own work. Take the job back at that boundary.**

An agent working in a repo observes: does it compile, do types check, do tests pass,
do the tokens exist. Inside that boundary, trust it — it is genuinely good there, and
second-guessing it is wasted effort. Outside it, the agent isn't being careless; it
is *structurally unable to know*. Expecting diligence to fix that is a category
error.

So the question for any delegated task stops being "is the agent good enough?" and
becomes **"what can it observe, and what did I leave unobserved?"** Whatever's in the
second half is now your job — or your next harness.

## Lessons / philosophy

1. **A green pipeline means *valid*, not *correct*.** For visual work those two are
   nearly unrelated. Write that distinction into your definition of done, or the
   green check will keep standing in for a judgment nobody actually made.
2. **The cheapest step to lose is the one nobody wrote down.** Audit your old
   workflow for implicit verification that rode along with authoring. It didn't
   survive delegation. This is the general failure mode; styling is just where it
   shows first.
3. **Reviewing agent-written styling code is low-yield.** You'll conclude it's
   plausible, which you already knew. Only the running artifact carries new
   information. Spend the attention there instead.
4. **Specifications stop being absorbed and must be extracted.** A human
   implementing glances at the whole design and internalizes hover, selected, and
   disabled states without being told. An agent takes the ticket's words literally.
   If the ticket says "borderless" and the design also encodes four other states,
   pull the **state matrix** yourself — it's now an input you have to supply.
5. **Measure; don't eyeball.** Once verification is deliberate, make it numeric. A
   1px border and a color that's off by 3/255 are both easy to miss by eye and
   decisive to a measurement. Eyeballing was acceptable when it was continuous; as a
   single end-of-process gate it's too weak.
6. **A named variant is a bundle, not a knob.** Swapping one to fix a single property
   silently changes every other property it owns. This is the most common way a
   "targeted" agent fix causes collateral drift.
7. **Prefer adding to shared code over changing it.** Adding a variant
   affects nobody; changing an existing one restyles every existing caller. Under
   agent authorship — where blast radius is easy to under-estimate and small diffs
   reach deep — bias hard toward additive.
8. **Reuse the close-enough existing token instead of inventing a new color.** An
   existing semantic token already carries correct values for every theme; a freshly
   minted hex value forces you to invent values for themes and states the design
   never specified. Quantify the difference and let a human judge "imperceptible" —
   that beats "exact but under-specified."
9. **Stating what you did *not* verify is part of the deliverable.** Agents report
   success eagerly. The discipline that makes verification trustworthy is naming the
   gaps: the state you had to construct, the wiring you couldn't exercise. An
   unqualified pass is less useful than a qualified one.
10. **Branches are multi-writer now.** Humans and agents push to the same branch
    concurrently. Assume someone moved it while you worked, push with
    `git push --force-with-lease`, and when the lease refuses, rebase onto their
    work rather than overriding it.

## Approaches that work

**Interrogate the artifact, not the source.** Ask the running page what it actually
computed for the properties in the acceptance criterion — in DevTools that's one
line, e.g. `getComputedStyle(el).borderWidth`. It takes seconds and it is the single
highest-value check available: in the real case behind this post, that one query
would have returned a 1px border on a change whose whole purpose was removing it.

**Get the state matrix before you start.** Idle, hover, selected, selected+hover,
disabled. A design export shows one state over one background; matching that one
state while breaking three others is the easy failure. Most design tools expose the
named tokens and per-state values directly (Figma's inspect panel, for example) —
read those instead of eyedropping a screenshot.

**Diff the whole property set on any variant swap.** A variant named for your intent
does not implement only your intent. Lay out the properties it declares and the
silent drift becomes impossible to miss. Below, a shared button is switched from
`solid` to `ghost` to drop its border — toggle between what code review reads and
what the render actually shows:

<div data-chart="drift">Interactive matrix: swapping a shared button from the "solid" to the "ghost" variant to remove its border silently changes five other properties (background, text color, hover, shadow, focus ring). Enable JavaScript to compare the code diff against the measured render.</div>

**Detect translucency with two samples, then solve for it.** If a value renders as
two different colors over two different backgrounds, it's an overlay with alpha. Two
samples are enough to recover both the color and the opacity:

```text
composite = a·C + (1-a)·background        (per channel)

  ⇒  (1-a) = (composite₁ - composite₂) / (background₁ - background₂)
  ⇒      C = (composite₁ - (1-a)·background₁) / a
```

Set a translucent overlay and two backgrounds below, watch it paint two different
pixels, then watch the formula recover the color and opacity from just those two
samples:

<div data-chart="solver">Interactive solver: a single translucent overlay painted over two different backgrounds produces two different pixels; the alpha-compositing formula recovers the overlay's color and opacity from just those two samples, wobble and all. Enable JavaScript to try it.</div>

Expect the recovered opacity to wobble a little between channels — 8-bit rounding
and antialiasing make exact recovery the exception. Snap to the nearest sensible
value; but if channels disagree *badly*, the thing isn't a single flat overlay and
your model is wrong. Then check the recovered color against your token list: a match
confirms the reading, and a near-match tells you which existing token to reuse and
what reusing it costs.

**Resolve exclusive states in code, not in the cascade.** Compute one class from an
explicit precedence order — selected beats hover beats idle — rather than stacking
conditional classes and hoping the intended one wins. This converts a specificity bet into a pure function with one
test per branch — and it's the rare case where the fix genuinely does belong in the
code rather than the verification.

**Turn the verification into an asset.** The measurements are the same every ticket.
Write them down as a runbook or an executable skill. Two payoffs: it becomes cheap
enough that you actually run it, and it becomes something you can **hand back to the
agent** — at which point the loop closes as *agent implements → agent verifies
against your harness → you adjudicate*. The harness is how your judgment gets
encoded once and applied repeatedly, which is the real endgame of the shift.

## Pitfalls / false signals

Several of these produce false negatives — they claim something is missing when it
isn't — and send you debugging a non-bug.

- **A pruned utility class reads as transparent.** Probing a class the build stripped
  (because nothing referenced it) returns a transparent or empty value, making a real
  token look nonexistent. Cross-check against the theme config or design tokens
  before concluding a token is missing; only classes something actually uses are
  reliable to probe this way.
- **Hovering a child also hovers its ancestor.** Measure a child's hover fill and
  you're compositing over the ancestor's *hover* background, not its resting one.
  Know which background you're measuring against or you'll attribute the delta to
  the wrong element.
- **The agent's own summary is not evidence.** In the real case behind this post, the
  change claimed it was "maintaining subtle hover/active effects" — the hover effect
  was precisely what it destroyed. Treat self-reported behavior as a hypothesis.
- **One design export is not the spec.** It's one state, over one background, at one
  moment.
- **A stale branch invalidates local verification.** Months behind trunk, it may not
  build against current dependencies, and what you measured isn't what merges.
  Rebase onto trunk first.
- **Formatter hooks inflate small diffs.** If a file wasn't already formatter-clean,
  editing it reformats unrelated lines. Check whether the base was clean; if it
  wasn't, that noise is pre-existing debt, not your change.

> Rule of thumb: when a measurement says a value is missing, suspect the
> *measurement* first — pruned class, wrong ancestor, wrong state — then the code.

## Quick checklist

For any agent-authored visual change:

- [ ] Pulled the **full state matrix** from the design, not a single exported state.
- [ ] Read the shared component's own class assembly — does it add something that
      contradicts the prop being passed? Is there an opt-out?
- [ ] Checked how existing call sites use this variant; noted any idiomatic pairing
      the new diff is missing.
- [ ] Listed every property the old and new variant declare — no silent drift.
- [ ] **Measured** the rendered result against the spec, property by property,
      instead of reading code or eyeballing a screenshot.
- [ ] For translucent values: sampled over two backgrounds and solved, rather than
      eyedropping one instance.
- [ ] Quantified each remaining delta rather than claiming an exact match.
- [ ] Triggered the state that regressed (hover, selected, disabled — not just
      idle); flagged any state you could only simulate.
- [ ] Wrote down what you did **not** verify.
- [ ] Rebased onto current trunk before measuring; pushed with `--force-with-lease`.
- [ ] Captured the repeatable parts as a harness the agent can run next time.

## One-line summary

> Agents made writing the change free and left verifying it exactly as expensive as
> before — so stop reviewing what they wrote, start measuring what it renders, and
> build the harness that lets you hand even that back.
