---
title: "Getting Started with Temporal: Durable Execution, Explained with Real Code"
slug: 2026-07-20-getting-started-with-temporal
description: What durable execution means, why retries and cron jobs alone fall short, and how Temporal's workflows, activities, and workers fix it — walked through with a real, runnable Python demo.
categories: ['temporal', 'durable-execution', 'workflows', 'python', 'distributed-systems']
coverImage: https://dalenguyen.me/assets/images/blog/2026-07-20-getting-started-with-temporal.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-07-20T10:00:00.000Z
author: Dale Nguyen
draft: false
---

> 💡 **What Temporal actually buys you:** your code keeps running correctly — no duplicated side effects, no lost progress — even if the process executing it crashes, gets redeployed, or is killed mid-step. The trick isn't magic. Your workflow's progress lives in a durably-persisted event history on the Temporal Server, not in the memory of whichever worker process happens to be running it.

I put together a minimal demo to see this for myself: a two-step Python "pipeline" workflow using the official [`temporalio`](https://github.com/temporalio/sdk-python) SDK (`temporalio==1.30.0`). This post walks through what durable execution actually means, the handful of concepts you need before anything else makes sense, the real code from that demo, and — the part that made it click for me — what happens when you `kill -9` the worker process in the middle of a run.

## The problem: why "just write the code" breaks down

Imagine the plain version of the demo's pipeline as an ordinary function:

```python
def run_pipeline(data, schema_version, target_path):
    validated = validate_input(data, schema_version)   # step 1
    return write_output(validated, target_path)         # step 2
```

That's fine until the process running it dies between step 1 and step 2 — a deploy rolls, the pod gets rescheduled, the host reboots. Now:

- You don't know whether step 1 already ran.
- Retrying the whole function from the top risks re-running step 1's side effects — a duplicate write, a double-charge, a second email.
- If you add a status column to track "did step 1 finish?" so you can resume correctly, you've started hand-rolling a workflow engine, one column and one crash scenario at a time.
- None of this touches what happens if a step needs to *wait* — for a signal, for three days, for a human to approve something. A process can't block in memory for three days and survive a deploy in the meantime.

That's the durable execution problem: keep a long-running, multi-step process correct and resumable, no matter what happens to the process that's executing it. Cron jobs retry on a schedule, not mid-flight. Queues retry a single message, not a multi-step sequence with state that spans several of them. Temporal is built specifically to fix this, and it does it by moving the source of truth for "where am I" out of the worker process and into a durably-persisted history.

## Core concepts, in the order you'll meet them

| Concept | What it is |
| --- | --- |
| **Workflow** | The orchestration function — "validate, then store." Must be deterministic: no direct network calls, no raw `time.sleep`, nothing that could produce a different decision on replay. |
| **Activity** | The actual work — the network call, the DB write, the sleep. Activities are *not* replayed; they execute once per attempt and their result gets recorded in history. This is the escape hatch for anything non-deterministic or side-effecting. |
| **Worker** | A process you run, on your own infra, that polls a task queue and executes workflow and activity code. Any number of workers can poll the same queue — killing one and starting another is invisible to the workflow. |
| **Task Queue** | A named queue both the worker and the workflow/activity calls agree on (`data-pipeline-queue` in the demo). Just a string. |
| **Temporal Server (Cluster)** | The piece that makes all of this durable. It persists the event history for every workflow execution, matches tasks to available workers, and enforces timers and retries. Locally, this is one command: `temporal server start-dev`. |

## The demo, end to end

Four files, no framework beyond the SDK itself.

### The workflow — `workflows.py`

```python
#!/usr/bin/env python3
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from activities import validate_input, write_output

@workflow.defn
class DataPipelineWorkflow:
    @workflow.run
    async def run(self, input_data: str, schema_version: str, target_path: str) -> dict:
        retry_policy = RetryPolicy(
            maximum_attempts=3,
            initial_interval=timedelta(seconds=1),
        )

        # Step 1: Validate & transform the incoming data
        validation_result = await workflow.execute_activity(
            validate_input,
            args=[input_data, schema_version],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )
        print(f"[PIPELINE] Step 1 — validate_input: {validation_result}")

        # Step 2: Write results to durable storage
        output_result = await workflow.execute_activity(
            write_output,
            args=[validation_result, target_path],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=retry_policy,
        )
        print(f"[PIPELINE] Step 2 — write_output: {output_result}")

        return {
            "status": "completed",
            "step_1_validated": validation_result,
            "step_2_stored": output_result,
        }
```

`@workflow.defn` marks the class as a workflow definition; `@workflow.run` marks its entry point. The `workflow.unsafe.imports_passed_through()` block matters more than it looks: it tells the SDK's sandbox that `activities.py` is only being imported for reference (the function objects, used as identifiers), not executed as workflow code — activity implementations are allowed to do things workflow code is not.

The real durability boundary is each `await workflow.execute_activity(...)` call. It schedules the activity, suspends the workflow — nothing is spinning a thread or blocking on I/O — until the activity finishes, and only then resumes. That suspend point is exactly where a crash is safe to happen.

### The activities — `activities.py`

```python
import asyncio
from temporalio import activity


@activity.defn
async def validate_input(data: str, schema_version: str) -> str:
    # Simulate data validation & transformation
    await asyncio.sleep(1.5)
    return "VALIDATED: 25 records parsed, schema v3 compliant"


@activity.defn
async def write_output(results: str, target_path: str) -> str:
    # Simulate storing results to a data lake
    await asyncio.sleep(0.8)
    print(f"[STORAGE] Writing report to {target_path}")
    return f"Results written to s3://data-lake/reports/{target_path}/batch.parquet"
```

These are just async functions with `@activity.defn`. They can do anything — sleep, call an API, hit a database — because activities are not replayed. Whatever they return becomes part of the durable history, and that's what the workflow sees when it resumes.

### The worker — `worker.py`

```python
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from activities import validate_input, write_output
from workflows import DataPipelineWorkflow


async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="data-pipeline-queue",
        workflows=[DataPipelineWorkflow],
        activities=[validate_input, write_output],
    )

    print("Worker running, Ctrl + C to stop")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

This connects to the local dev server, registers the workflow class and both activity functions against `data-pipeline-queue`, and calls `worker.run()`, which blocks and long-polls the queue for work. Nothing here is specific to this one workflow run — the same worker process would happily execute a hundred concurrent `DataPipelineWorkflow` executions.

### The client — `run.py`

```python
import asyncio
import uuid
from temporalio.client import Client
from workflows import DataPipelineWorkflow


async def main():
    client = await Client.connect("localhost:7233")

    job_id = f"pipeline-batch-{uuid.uuid4().hex[:8]}"

    result = await client.execute_workflow(
        DataPipelineWorkflow,
        args=[
            "raw_data_sample_row_1..raw_data_sample_row_50",
            "schema_v3_final",
            job_id,
        ],
        id=job_id,
        task_queue="data-pipeline-queue",
    )

    print(f"Workflow completed: {result['status']}\n")
    print(f"  Step 1 (validate_input):   {result['step_1_validated']}")
    print(f"  Step 2 (write_output):     {result['step_2_stored']}\n")

if __name__ == "__main__":
    asyncio.run(main())
```

`execute_workflow` blocks — from the caller's point of view — until the workflow finishes and hands back the final dict. That's the same as calling a slow function directly, except this "function call" can survive the process running it being killed, which a normal function call cannot.

## Running it locally

1. **Install the Temporal CLI** (ships a self-contained dev server): `brew install temporal`, or `curl -sSf https://temporal.download/cli.sh | sh`.
2. **Start the dev server**: `temporal server start-dev`. This starts a full Temporal Server (SQLite-backed, no external dependencies) on `localhost:7233`, plus a Web UI on `http://localhost:8233`.
3. **Install the SDK** in the project's virtualenv: `pip install temporalio`.
4. **Terminal 2 — run the worker**: `python worker.py` → prints `Worker running, Ctrl + C to stop` and blocks.
5. **Terminal 3 — start a workflow**: `python run.py` → prints the completed result a couple of seconds later.
6. **Open the Web UI** at `http://localhost:8233`, find the workflow by its id (`pipeline-batch-` followed by a short hex suffix), and open its **Event History** tab. You'll see the exact sequence: `WorkflowExecutionStarted` → `WorkflowTaskScheduled`/`Completed` → `ActivityTaskScheduled`/`Started`/`Completed` for `validate_input`, the same trio for `write_output`, then `WorkflowExecutionCompleted`. Nothing in this list is inferred after the fact — it's the literal record the server used to drive execution.

## What actually happens on a crash

This is the part worth seeing rather than just reading about. Step through it below: it walks the same `DataPipelineWorkflow` run through a `kill -9` on the worker process, right after `validate_input` finishes and before `write_output` starts.

<div data-chart="durable-flow">Interactive walkthrough: a Temporal workflow survives a worker crash by replaying its durably-persisted event history instead of re-running already-completed activities. Enable JavaScript to step through it.</div>

The mechanism, in one sentence: on resume, the SDK replays the recorded event history through your workflow code before executing anything new, and because `ActivityTaskCompleted` for `validate_input` is already in that history, the SDK feeds the recorded result straight back to the `await` instead of re-invoking the activity. Your workflow code doesn't know the difference between "this ran a second ago" and "this ran, the process died, a new process just replayed it" — which is exactly the point. That's also why workflow code has to be deterministic: replay has to make the same decisions from the same history every time, or the whole model falls apart.

## Automatic retries — for free

Look back at the `RetryPolicy` in `workflows.py`:

```python
retry_policy = RetryPolicy(
    maximum_attempts=3,
    initial_interval=timedelta(seconds=1),
)
```

If `validate_input` or `write_output` raises, the SDK retries it — with backoff — up to three attempts, with no `try`/`except` and no backoff loop written by hand. `start_to_close_timeout=timedelta(seconds=30)` is the other half: if an activity hangs past 30 seconds without completing, the server treats the attempt as failed and retries it under the same policy. Compare that to the usual hand-rolled version — a `for attempt in range(3)` loop with a manual `time.sleep(backoff)` scattered through the code that calls the activity, and a fairly common place for bugs (wrong backoff math, retrying non-retryable errors, no timeout at all) to hide.

## Durable timers — the same idea, applied to time

The demo's two activities each call `asyncio.sleep()` to simulate slow work, and that's fine — activities aren't replayed, so an ordinary sleep works exactly like it would in any async Python program. But workflow code is a different story. If a workflow needs to wait three days for something — a signal, a follow-up, a scheduled step — it can't just `await asyncio.sleep(259200)` inside `@workflow.run` and hope a worker process stays alive for three days. Instead, the Python SDK's workflow sandbox routes durable waits through Temporal's own timer, which gets persisted server-side exactly like an activity result.

That means a workflow *can* durably wait three days inside workflow code, and survive any number of worker restarts across those three days: when a worker resumes, it doesn't wait three days all over again — it checks the persisted fire time and, if it's already elapsed, proceeds immediately. This demo doesn't need it (both activities finish in under two seconds combined), but it's the same durability guarantee as the crash-and-resume above, just applied to a timer instead of an activity result.

## When to use Temporal (and when not to)

**Reach for it when:**
- A process has multiple steps with side effects that must not double-fire if something crashes mid-way.
- The process spans minutes, hours, or days, and has to survive deploys, restarts, or scaling events.
- You want retries, backoff, and timeouts as configuration, not code you maintain by hand.
- You want a single place (the Web UI) to see every step, every retry, every input and output, for every run — without wiring up your own logging/tracing for it.

**Skip it when:**
- The whole thing is one stateless request/response with no multi-step orchestration — that's just a normal API call.
- It's a single fire-and-forget job with no need for resumability across a crash — a plain queue is simpler and it's one less system to run.
- Nobody on the team wants to operate a Temporal Server (or pay for Temporal Cloud) for what's genuinely a simple task. The durability is real, but it isn't free — it's a piece of infrastructure you now own.

## Wrap-up

The whole idea reduces to one thing: don't let your workflow's progress live only in the memory of the process running it. Temporal persists that progress as an event history on the server, replays it through your (deterministic) workflow code to resume exactly where it left off, and hands off the side-effecting, non-deterministic parts to activities that get retried and recorded independently. The demo here is deliberately small — one workflow, two activities — but the same model is what lets Temporal-based workflows run for weeks across dozens of deploys without anyone writing a single line of checkpointing code.

If you want to go further than this post: the [Temporal docs](https://docs.temporal.io/) cover signals, queries, child workflows, and heartbeating long-running activities — none of which this demo touches, all of which build on exactly the same event-history model.
