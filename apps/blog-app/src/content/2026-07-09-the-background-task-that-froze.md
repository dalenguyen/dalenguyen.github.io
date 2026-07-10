---
title: "The Background Task That Froze: A Serverless CPU-Throttling Mystery"
slug: 2026-07-09-the-background-task-that-froze
description: "A webhook handler acknowledged instantly, but the job it triggered showed up minutes late — or never. The culprit: CPU throttling on request-billed serverless."
categories: ['gcp', 'serverless', 'python', 'reliability', 'engineering']
coverImage: https://dalenguyen.me/assets/images/blog/2026-07-09-the-background-task-that-froze.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-07-09T10:00:00.000Z
author: Dale Nguyen
draft: false
---

I had a webhook receiver that acknowledged events in well under a second. Fast, clean, exactly what you want from a webhook handler. The problem was what happened *after* the ack: the job that receiving the webhook was supposed to launch showed up about three minutes later. Sometimes it showed up right away. Sometimes it never showed up at all — until something completely unrelated happened to hit the service, at which point the "stuck" job would suddenly, retroactively, complete.

That last detail is what made it a genuine mystery for a while. A job that finishes the instant an unrelated request lands is not behaving like a slow job. It's behaving like something that was *frozen*, waiting for permission to keep running.

## The setup

The receiver did the obvious, well-worn thing: validate the payload, dedupe it, and hand the actual work off so the HTTP response could go out immediately.

```python
@app.post("/webhook")
async def webhook(req):
    ...validate...
    background_tasks.add_task(dispatch_job, payload)
    return JSONResponse(202, ...)
```

FastAPI/Starlette's `BackgroundTasks` is the textbook way to do "ack now, work later." It runs your callback after the response has been sent, without making the caller wait for it. On a normal server, that's a fire-and-forget convenience with no real downside — the process keeps running, the callback runs whenever the event loop gets to it, done.

This wasn't running on a normal server. It was running on Cloud Run, with the platform's default CPU allocation mode, which is **request-based**: the instance only gets meaningful CPU while a request is actually in flight. The moment the response goes out, CPU gets throttled down to something close to zero — and it stays there until the next request arrives.

Which means the code above doesn't say "run this job right after responding." On that platform, it says "run this job whenever the next request happens to show up, if one ever does."

## The symptom, and why it's invisible

Here's the part that made this hard to see in logs: the background task doesn't fail. Nothing is killed, nothing throws, nothing gets logged as an error. The log line right before the network call in `dispatch_job` prints just fine — it runs during the tail end of the request's own CPU window. Then the very next line, the one after the `await` that actually calls out to launch the job, just... doesn't print. Not for a while. Not until CPU comes back.

The event loop isn't crashing. It's simply not being scheduled.

```text
request in ──► handler runs (full CPU)
                 └─ schedules background task
response out ◄── 202 sent
                 └─ CPU throttled to ~0        ← background task freezes HERE,
                                                  usually mid-network-call
...minutes pass...
next request in ──► instance gets CPU again ──► frozen task resumes, completes
```

If the instance happens to scale to zero before any other traffic arrives, the frozen task never gets to finish. The work isn't delayed at that point — it's just gone.

This isn't unique to `BackgroundTasks` either. It's the same failure shape for any post-response work: a bare `asyncio.create_task(...)` fired right before returning, or a "post-ack" queue that classifies and dispatches inside the same process after replying to the caller. Anything scheduled to run *after* the response, on a platform that only grants CPU *during* a request, inherits this problem.

And it's genuinely hard to catch by normal means, because:

- It's fast on busy days and slow-or-lost on quiet ones — the exact opposite of what you'd expect from an overload problem.
- Retry-happy callers (chat platforms, webhook senders that retry on timeout) generate the very traffic that unfreezes the task, which converts "broken" into "occasionally a few minutes slow" — indistinguishable from ordinary network flakiness unless you're looking closely.
- It works perfectly locally and under load testing, because both of those keep the instance saturated with requests, which is precisely the condition under which this bug can't occur.

## Confirming it without a debugger

The cheapest way to confirm CPU starvation as the cause, rather than guess at it, is to inject traffic. If a "stuck" background task completes the instant you curl the service's health endpoint a couple of times, you've proven it — decisively, and without touching a debugger or adding instrumentation. I'd recommend this as step one before reaching for anything heavier.

## The fix: move it onto the request path

The real fix isn't a smarter background task. It's not scheduling the latency-critical part as a background task at all. In this case, the RPC that actually *launches* the job — as opposed to waiting for the job to finish — costs on the order of one second. That's well within most webhook ack budgets (5 seconds or more), so it can just be awaited before responding:

```python
@app.post("/webhook")
async def webhook(req):
    ...validate, dedupe...
    recent[key] = now()          # dedup marker
    try:
        await launch_job(payload)   # ~1s: starts the job, doesn't wait for it
    except Exception:
        recent.pop(key, None)       # let the sender's retry re-dispatch
        raise                       # → 5xx → sender retries
    return JSONResponse(202, ...)
```

Two details here matter as much as the `await` itself:

1. **On failure, roll back the dedup marker before re-raising.** If you don't, your own dedup logic swallows the sender's retry — the sender re-delivers the exact same event, your dedup marker says "already seen," and the job never gets a second chance to launch.
2. **Let the failure surface as a 5xx.** That's what tells the webhook source to actually retry. A 202 that lies about success is worse than an honest error.

I kept a background task only for the one case where the handler itself would legitimately run for minutes — a local-dev mode that executes the worker in-process instead of dispatching it elsewhere. That's a fine use of "run this later"; the RPC-launch path is not.

### When inline genuinely isn't an option

Not every version of this problem can be solved by moving code earlier in the function. If the caller enforces a hard ack deadline (say, 3 seconds) and the pre-dispatch work is inherently slow — an LLM classification step, for instance — there may be no way to fit it inside the request. In that case, change the platform, not the code: switch the service to **instance-based** CPU allocation, so it keeps CPU between requests instead of throttling it to near-zero.

```
gcloud run services update <svc> --no-cpu-throttling   # plus persist in IaC/deploy config
```

That last comment matters. Run this as a one-off CLI command and the very next deploy from your normal pipeline can silently put the service back to request-based billing, because the deploy config never knew the flag existed. Persist it in whatever defines the deploy — Terraform, a service YAML, whatever your IaC actually reads — not as a manual patch applied by hand after the fact. It's also worth reconsidering minimum instance count at the same time, since instance-based billing changes the cost model from per-request to per-instance-time.

### Testing the difference

One trap when you go to write a test for this: most test-client frameworks execute background tasks *before* handing the response back to your assertions. So a happy-path "was `dispatch_job` called?" test passes whether the call is inline or backgrounded — it can't tell the two apart. The assertion that actually distinguishes them is the failure path: trigger a dispatch failure and check that you get a 5xx **and** that the dedup marker got cleared. Only inline dispatch can produce that combination.

## Lessons learned

1. **Post-response code has no CPU guarantee on request-billed serverless.** Treat "after the response" as "whenever the next request arrives, maybe never" — not "a few milliseconds later."
2. **Latency-critical side effects belong on the request path.** A job-launch RPC that only *starts* work is often cheap — in this case, about a second — well within most webhook timeout budgets. Await it, then respond.
3. **Make inline failure retryable end-to-end.** If the inline call throws, roll back any in-memory dedup marker and let the error propagate as a 5xx — the sender's retry then actually re-dispatches instead of being swallowed by your own dedup.
4. **When inline is impossible, change the platform mode, not the code.** Hard ack deadlines plus slow pre-dispatch work can't move onto the request path — switch to instance-based CPU allocation and reconsider minimum instance count. Persist the flag in deploy config, not a one-off CLI update.
5. **Confirm the hypothesis by injecting traffic.** If a "stuck" background task completes the instant you curl the service's health endpoint a few times, you've proven CPU starvation without touching a debugger. Cheap, decisive, non-invasive.
6. **Audit the pattern fleet-wide once found.** The same convenience API tends to get copy-pasted across every receiver in a codebase. One confirmed stall usually means its siblings have it too.

## Pitfalls and false signals

- **The first log line printing does not mean the task ran.** It ran for the last few milliseconds of leftover request CPU, then froze at the first `await`. Don't rule out starvation just because "the task clearly started."
- **"It works in staging" proves nothing here.** Health checks and teammates clicking around provide exactly the wake-up traffic that masks this. Quiet production windows — nights, weekends — are where it actually bites.
- **Don't blame the downstream API.** The frozen call is usually a perfectly healthy RPC; its client-side coroutine simply isn't being scheduled. Latency dashboards on the callee will look completely clean, because the callee never had a problem.
- **Retries hide the bug.** Senders that retry unacked or failed deliveries generate the traffic that unfreezes the task, turning "broken" into "occasionally a few minutes slow" — easy to misfile as ordinary network flakiness.

## Quick checklist

- List every place a handler schedules work to run after the response — framework background tasks, `create_task`, post-ack queues.
- For each one: is the platform CPU-throttled outside of requests? (Cloud Run default: yes.)
- Can the work move inline within the caller's timeout budget? Move it; on failure, roll back dedup markers and return a 5xx.
- If it can't move: flip to instance-based CPU allocation in the deploy config — not a live-only update — and revisit minimum instances.
- Add a failure-path test: dispatch error → 5xx and dedup marker cleared.
- To confirm a suspected stall in prod: watch the logs while sending a few synthetic requests. Instant completion means starvation confirmed.

## One-line summary

On request-billed serverless, "after the response" means "whenever the next request happens to arrive" — so launch anything that matters before you respond, or pay for always-on CPU.
