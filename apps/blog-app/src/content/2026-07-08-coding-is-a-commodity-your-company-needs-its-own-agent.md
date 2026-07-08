---
title: "Coding Is a Commodity. Your Company Still Needs Its Own Agent."
slug: 2026-07-08-coding-is-a-commodity-your-company-needs-its-own-agent
description: Vibe coding for non-coders is here. For teams that ship software for a living, the question is no longer whether AI writes code — it's what kind of agent your company should own.
categories: ['ai-agents', 'ai-engineering', 'developer-tools', 'agents']
coverImage: https://dalenguyen.me/assets/images/blog/coding-is-a-commodity-your-company-needs-its-own-agent.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-07-08T10:00:00.000Z
author: Dale Nguyen
draft: false
---

Lovable and its cousins got non-coders shipping prototypes in a weekend. That part of the future is already here, and it's not going back. For teams whose job *is* shipping software, the interesting question isn't whether AI can code — it obviously can — but what kind of agent your company should own.

I think the answer is: **a self-improving one**, baked into the way your team already works.

This is a short post because the point is simple. Most of the heavy lifting lives in the case study at the end.

## Coding is a commodity, the same way typing is

Lovable, Bolt, v0, and the rest of the vibe-coding tools all do roughly the same thing: take a prompt, generate a working web app, let the user refine. The product differentiation has already collapsed to **brand and onboarding**, because the underlying capability — "model writes a React component from a sentence" — is the same in all of them.

This is the same pattern that hit every other software tool that hit a price floor: spreadsheets in the 80s, web frameworks in the 2010s, container registries in the late 2010s. The thing stops being scarce, the *judgment around the thing* becomes scarce.

For most consumer use cases, the commodity is fine. A non-coder doesn't need a self-improving harness; they need a button that does what they asked. The vibe-coding tools are correctly optimized for that user.

For a software team, the commodity gets you exactly one thing: a code generator. You still need:

- A way to know what code to generate
- A way to verify it worked
- A way to catch when the agent broke something else
- A way to make sure the same mistake doesn't happen twice

That's the harness. And the harness is the part that's not commoditized.

## What a self-improving agent actually means

A self-improving agent isn't "an agent that learns from feedback" in the OpenAI RLHF sense. It's much smaller than that, and much more useful:

- It runs against **your** codebase, with **your** conventions, on **your** review patterns.
- When it makes a mistake, it **captures the mistake** in a place the next run will see it.
- When it succeeds at something novel, that pattern is **saved** for the next run.
- The next run is **measurably better** than the last, on the kind of work you actually do.

The loop is the whole product. A single LLM call is a feature; the loop that catches its own regressions, ships its own tests, and never makes the same mistake twice is the company.

This is what I meant in [Build a Coding Agent From Scratch — Part 1: The Core](/blog/2026-07-03-build-a-coding-agent-from-scratch): the value isn't the model. The model is interchangeable this month and obsolete next year. The value is the loop you wrap around it.

## A self-improving agent looks like a developer onboarding

The mental model that has worked best for me: **your company's agent is a new engineer onboarding to your codebase.**

Day one, it doesn't know anything. It needs to be told where the tests live, what the deploy looks like, which reviewer to ping. By week two, it has shipped a few PRs and learned the team's idioms. By month two, it knows which patterns your lead engineer prefers, which reviewer pushes back on what, and which kinds of changes always need a regression test.

That's not a metaphor for what an AI agent does. That's literally what's happening when an agent runs in the same PR review loop your team already uses, with the same CI, the same reviewers, the same comments. **Every comment a reviewer leaves is a teaching moment.** Every test that catches a regression is curriculum. Every merged PR is a sample of what "good" looks like in your repo.

The agent that doesn't run in your review loop — that lives in a sandbox with no shared memory, no shared review, no shared context — will plateau on day one.

## What it doesn't look like

A few things that look superficially similar but aren't self-improving:

- **A prompt that gets longer.** Prompts don't compound. A 10,000-token prompt next year is still worse than a 200-token prompt + 50 stored gotchas, because the prompt's contents are noise-to-signal and the gotchas are signal only.
- **A bigger context window.** More context isn't more knowledge. Most of the model failures I see are caused by giving the model *too much* context, not too little.
- **Fine-tuning on your code.** Fine-tuning is a one-time investment that gets stale the week you merge your next PR. A self-improving loop beats a fine-tune on every dimension that matters.
- **A new agent per task.** The point of one agent is that it accumulates knowledge across tasks. Spinning up a fresh agent per request means every run starts at zero.

Nick Nisi's talk on [deleted 95% of his agent skills](/learn/deleted-95-percent-agent-skills) is the best articulation of this I've seen: the durable signal lives in the gotchas, not the documentation. Same logic applies to your company's agent: the thing you want compounding is the *landmines*, not the API docs.

## Case study: today, in production

A [public demo repo](https://github.com/dalenguyen/coding-agent-demo) I keep around to exercise the same agents, end-to-end, on a tiny Node/Express service. Issue #1 was a one-line ask: add a `GET /reverse/:text` endpoint. The whole thing — issue → first attempt → review → correct fix — is captured in [DEMO.md](https://github.com/dalenguyen/coding-agent-demo/blob/main/DEMO.md), and the final landed PR is [dalenguyen/coding-agent-demo#2](https://github.com/dalenguyen/coding-agent-demo/pull/2).

The interesting version of that story isn't the happy path. It's what happened when the happy path didn't happen on the first try.

**Step 1 — The bug.** A `@codemagpieai review` call flagged that a proposed fix was in the wrong file: the agent had hardcoded a new year into the visible footer template when the actually-stale year lived in a settings file two directories up. Reviewer says: "wrong line, wrong layer."

**Step 2 — The first fix attempt.** I commented `@codemagpieai resolve` with the corrected spec: edit the settings file, leave the template alone. The agent did exactly that — in its *workspace*. The push to the PR was rejected because `--force-with-lease` was comparing against a stale `refs/remotes/origin/<branch>` that never refreshed after clone. The agent died silently. No follow-up comment. The user (me) saw only the "👀 On it" ack and waited 18 hours thinking it was working.

**Step 3 — Fix the agent, first pass.** I added a `try/except` around the push: on `PushRejectedError`, post an explanatory comment to the PR and mark the run `failed` before re-raising. Re-deployed. Re-triggered. Now at least the failure was visible — but the comment still said "branch was updated concurrently" when nothing had actually moved. Wrong diagnosis.

**Step 4 — Fix the agent, for real.** I added one line immediately before the push:

```python
# Refresh refs/remotes/origin/<branch> so --force-with-lease
# compares against the live remote SHA, not the clone-time SHA.
subprocess.run(["git", "fetch", "origin", f"{head_ref}:{head_ref}"], check=True)
```

The colon syntax is the load-bearing part: plain `git fetch origin <ref>` writes only to `FETCH_HEAD`, not to the tracking ref that `--force-with-lease` reads. The colon form forces the update. Re-deployed.

**Step 5 — The agent does the right thing.** I closed the original PR and opened a fresh `@codemagpieai create` against the same issue with the corrected spec. The agent (running on the fixed Cloud Run revision) opened a new PR with exactly the right fix: the settings file bumped, the template untouched, **plus a regression test** asserting that the settings file contains no stale value and the template uses the dynamic filter. That test is the part that matters.

Three iterations. Two bug fixes in the agent. One PR with the wrong diagnosis. One PR with the right fix *plus a test that would have caught the original mistake.*

That last bit is the self-improving loop. The agent learned — not in the model-weight sense, in the *your-agent-will-never-do-this-again* sense — that "edit the settings file, not the template" is the right call for this class of bug, and wrote a test so the next run doesn't have to figure it out from scratch.

The public receipt of the resolved version of this loop — issue → create → review → approved — is in the demo repo's [DEMO.md](https://github.com/dalenguyen/coding-agent-demo/blob/main/DEMO.md). The agent added 14 lines of code, 35 lines of test, and zero comments from the reviewer. That's what a single shot looks like once the harness is right.

## What a normal company actually does

If you're a small team and you're wondering whether to build one of these, the answer is yes, but smaller than you think:

- **Start with one workflow that already has a clear failure signal.** Code review is the obvious one. CI is another. Customer support routing is a third. Don't start with "AI for everything."
- **Run the agent in the same loop your humans use.** PR comments, CI checks, Slack threads. The feedback has to land in the same place your team's feedback already lives, or it's not feedback.
- **Capture the gotchas, not the docs.** A markdown file of "don't do X" beats a 10,000-token system prompt. The model already knows how to write code. It doesn't know what your lead engineer will reject in PR review.
- **Ship the regression tests the agent writes.** This is the part most teams skip. If the agent writes a test that catches a class of mistakes, *merge that test*. That's your compounding.
- **Make the agent's mistakes observable.** Silent failures are the enemy. If the agent dies, the user has to know. Every agent I run logs to a Firestore run doc and posts a comment on the PR; this catches the "18 hours thinking it was working" failure mode I hit above.

That's it. The agent's job isn't to be clever. Its job is to be **predictable in a way that compounds.**

## What this isn't

A few things to be clear about:

- **This isn't "AGI is around the corner."** Self-improving in this sense is *narrow* — your agent gets better at *your* workflows, not at coding in general.
- **This isn't "replace your engineers."** The loop above makes your engineers *more leveraged*, not redundant. Reviewer comments teach the agent; the agent's PRs give reviewers more time to review, not less.
- **This isn't a 2027 thing.** Every step of this is shipping today, in production, in repos with five-figure LOC. You don't need to wait.

The vibe-coding tools commoditized the *act* of writing code. That's the easy part. The interesting part — the part your company actually has to own — is the loop around it.

And if you're already shipping that loop: [the most recent structured-output post](/blog/2026-07-07-structured-output-is-untrusted-input) is the closest neighbor; today's case study is the same principle applied to the *plumbing* (git leases, run-doc state) instead of the model output.