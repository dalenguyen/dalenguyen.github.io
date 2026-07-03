---
title: "Build a Coding Agent From Scratch — Part 1: The Core"
slug: 2026-07-03-build-a-coding-agent-from-scratch
description: A coding agent is a loop around one primitive — a tool call. Build the whole core from scratch in Python, running on a local Ollama model or NVIDIA's free NIM tier, with no Anthropic key required.
categories: ['agents', 'llm', 'python', 'developer-tools', 'ollama']
coverImage: https://dalenguyen.me/assets/images/blog/build-a-coding-agent-from-scratch.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-07-03T00:00:00.000Z
author: Dale Nguyen
draft: false
---

Reach for an agent SDK and the one idea worth understanding disappears behind a
`query()` call. So this post builds the core of a coding agent from scratch — the part
that reads files, writes code, and runs tests on its own — with no SDK and no framework.
Everything here runs on a **local Ollama model or NVIDIA's free NIM tier**, so you can
follow along without an Anthropic key or a bill. The full code is in the
[coding-agent-demo repo](https://github.com/dalenguyen/coding-agent-demo).

This is Part 1: the local core. Part 2 takes it online.

## A coding agent is a loop around one primitive

Strip away the tooling and a coding agent is astonishingly small:

1. Send the model a task and a list of tools it may call.
2. If it asks to call a tool, run the tool and hand back the result.
3. Repeat until it stops asking and replies with plain text.

That's it. The "intelligence" is the model's; the program around it just runs the tools
the model requests and keeps the conversation going. Everything else — budgets, safety
checks, multiple providers — is judgment layered on top of that loop. So before the loop,
the one thing to understand is step 1's *primitive*: the tool call.

## The primitive: a tool call is just a structured field

`basics.py` exists to make one thing familiar before it matters: **a tool call is
nothing more than a structured field in the model's reply, and the model decides whether
to fill it in.** It fires three single requests — no loop, no guardrails — and prints
what comes back. Step through them:

<div data-chart="primitive">Step-through: the three basics.py requests and the raw response shape each returns. Enable JavaScript to view.</div>

You describe a tool as plain JSON — a name, a description, and a JSON-schema for its
arguments:

```python
READ_FILE_TOOL = [{
    "type": "function",
    "function": {
        "name": "read_file",
        "description": "Read a file from the repo",
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
}]
```

Hand that to the model and ask it something file-related, and the reply changes shape:
`content` comes back empty and `tool_calls` holds one entry — the tool name plus the
arguments the model chose.

```python
response = ollama.chat(model=MODEL, tools=READ_FILE_TOOL, messages=[
    {"role": "user", "content": "Read notes.txt with the read_file tool."},
])
# response.message.content    -> None
# response.message.tool_calls -> [read_file(path="notes.txt")]
```

Two things are worth internalizing here. First, availability is not usage — in request
two the tool is offered and the model still answers in plain text, because the question
didn't need it. Second, the model never *runs* anything; it only *asks*. Actually reading
the file is your job. Which is exactly what the loop is for.

## The loop: turn responses into actions

`agent.py` wraps that primitive in a loop. This is the entire "brain" — ask the model,
run whatever tool calls it returns, append the results to the conversation, and go again.
When the model replies with plain text instead of a tool call, it's done:

```python
messages = [
    {"role": "system", "content": SYSTEM_PROMPT},
    {"role": "user", "content": task},
]

for turn in range(MAX_TOOL_ROUNDS):
    tool_calls, content = backend.step(messages)

    if not tool_calls:
        return content                      # model replied in prose → finished

    for call in tool_calls:
        result = run_tool(repo_root, call["name"], call["arguments"])
        backend.append_tool_result(messages, call, result)
```

`messages` is the whole memory of the run: the system prompt and task go in first, then
every tool call and its result get appended, so each new request carries everything the
model has already seen and done. The system prompt does one important job — it tells the
model to *make real changes*, not describe them:

```python
SYSTEM_PROMPT = (
    "You are a senior engineer implementing a task in the repo at the given path. "
    "You MUST make real changes with write_file - never just describe them. Use "
    "read_file to inspect, write_file to create/modify, run_command to verify. "
    "When finished, reply with a short summary and no further tool calls."
)
```

## The three tools (and keeping them inside the repo)

The demo gives the model three tools — `read_file`, `write_file`, and `run_command` —
and every call from every model funnels through one function. `run_tool` is the *only*
place in the program that touches the filesystem or spawns a shell, which makes it the
natural spot for safety checks. Two matter most:

```python
def run_tool(repo_root, name, args):
    if name in ("read_file", "write_file"):
        target = (repo_root / args["path"]).resolve()
        # resolve() collapses "..", then this check keeps the path inside the repo.
        # Without it the model could read_file("../../.ssh/id_rsa").
        if not target.is_relative_to(repo_root):
            return f"Error: path escapes repo root: {args['path']!r}"
        # …read or write…

    if name == "run_command":
        r = sp.run(["/bin/sh", "-c", args["command"]], cwd=repo_root,
                   capture_output=True, text=True,
                   timeout=120)              # a hung command can't block the loop
        return r.stdout + r.stderr
```

Notice `run_tool` returns an `"Error: …"` string instead of raising. That's deliberate:
the model sees the error as a normal tool result and can react to it — fix the path, try
another command — instead of the whole program crashing on one bad call.

## Guardrails: don't trust "I'm done"

A raw loop over a local model has two failure modes, and the demo guards both. Step
through them:

<div data-chart="loop">Step-through: the agentic loop plus the round-budget nudge and the pytest self-check. Enable JavaScript to view.</div>

**It can spin forever, or spin doing nothing.** `MAX_TOOL_ROUNDS` caps the run. And past
the halfway point, if the model still hasn't written a single file, a nudge is injected
telling it to stop exploring and act — cheap insurance against a run that reads its way
through the whole budget and produces nothing.

**It can lie about being finished.** A weaker model will happily say "done" with a broken
test. So when the model signals it's done, the loop doesn't just believe it: it finds any
test files the model touched, reruns them, and if they fail, feeds the failure straight
back into the conversation and loops again (capped by `MAX_SELFCHECK_ROUNDS` so a
permanently broken test can't loop forever):

```python
if not tool_calls:                              # model thinks it's done
    if write_count > 0 and selfcheck_rounds < MAX_SELFCHECK_ROUNDS:
        test_files = changed_test_files(repo_root)
        if test_files:
            passed, output = run_pytest(repo_root, test_files)
            if not passed:
                selfcheck_rounds += 1
                messages.append({"role": "user", "content":
                    f"Self-check: the tests you wrote are FAILING. "
                    f"Fix them before finishing.\n\n{output}"})
                continue                        # back into the loop
    return content
```

This self-check is the single biggest difference between a demo that looks like it works
and one that actually does.

## One loop, two model backends

Here's the payoff of owning the loop: the model is a swappable part. The demo runs the
*same* loop against two very different providers — a local Ollama model and NVIDIA's
OpenAI-compatible NIM tier — by hiding each behind a tiny adapter with two methods,
`step()` and `append_tool_result()`. The loop never knows which one it's talking to.

They differ in the fiddly details, which is exactly why the adapter earns its place:

```python
# Ollama: arguments already come back as a dict; results match by tool name.
messages.append({"role": "tool", "content": result, "name": call["name"]})

# NVIDIA (OpenAI-style): arguments arrive as a JSON *string* you must parse,
# and results match by an explicit tool_call_id.
messages.append({"role": "tool", "tool_call_id": call["id"], "content": result})
```

One caveat the repo learned the hard way: not every model returns proper structured
`tool_calls`. Some just echo the tool-call JSON as plain text, and a couple of NVIDIA's
larger models simply hung. If a model can't reliably produce that `tool_calls` field, no
amount of loop is going to save it — which brings the whole thing back to the primitive we
started with.

## What's next

You now have a complete coding agent core: a primitive (the tool call), a loop that turns
the model's requests into real edits, guardrails that keep it honest, and a backend seam
that makes the model swappable. It runs entirely on your machine.

In **Part 2**, this same core goes online — reachable from GitHub, wrapped in a webhook
and a job queue so runs survive and stay rate-limited, and pointed at a hosted model. The
loop barely changes; everything around it does. That's the interesting part, and it's
next.
