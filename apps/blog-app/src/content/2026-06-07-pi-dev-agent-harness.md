---
title: "Pi: The Agent Harness That Gets Out of Your Way"
slug: 2026-06-07-pi-dev-agent-harness
description: Pi (pi.dev) is an explicit, configurable agent harness where every layer is swappable. Here is what that means in practice and why it matters.
categories: ['ai-agents', 'ai-engineering', 'local-ai', 'developer-tools']
coverImage: https://dalenguyen.me/assets/images/blog/pi-dev-agent-harness.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-06-07T10:00:00.000Z
author: Dale Nguyen
draft: false
---

Claude Code is a harness. Cursor is a harness. The difference is that Pi shows you the wiring.

Every AI coding agent you have used is built on the same underlying pattern: a model slot surrounded by a tool registry, context management logic, guardrails, an agent loop, and a verify step. Most agents hide all of that behind a product surface. [Pi](https://pi.dev) does not. It is a harness that treats every one of those layers as a configuration surface you own.

---

## What Every Coding Agent Is (But Won't Tell You)

Before examining Pi specifically, it helps to be precise about what an agent harness actually is.

A **model** is a stateless function: it takes tokens in, returns tokens out. That is all it does. Everything that makes a coding agent useful — remembering your task, deciding which tool to call next, stopping before it destroys your repository, checking whether it actually succeeded — is code that runs *around* the model. That surrounding code is the harness.

A complete agent harness has six layers:

| Layer | What it does |
|---|---|
| **Tool registry** | Defines which tools the agent can call: file read/write, bash, browser, HTTP, etc. |
| **Model slot** | The model API call itself — one swappable component among many |
| **Context management** | Compacts and prunes the context window so the model does not run out of room |
| **Guardrails** | Structural limits: max steps, max messages, allowed tools — enforced as code, not prompts |
| **Agent loop** | The `while true` that drives the agent forward, checking stop conditions after each step |
| **Verify step** | Deterministic checks after the agent reports completion — the harness deciding whether to trust the model's answer |

When you install Claude Code, you are not installing a model. You are installing a harness. The model (Claude Sonnet, Claude Opus) is one slot in that harness. The tool registry (bash, file operations, web fetch), the permission system, the context compaction strategy, and the verification behavior are all harness code that Anthropic wrote and maintains.

Most harnesses make this invisible by design. Opinionated defaults let users get started in minutes without understanding what is happening. Pi takes the opposite position.

---

## The Components of a Harness, With Pi's Implementation

### Tool Registry

Pi ships with the standard coding agent tool set: file read and write, bash execution, and browser access. The registry is not locked — you define what tools are available.

### Model Slot

This is where Pi is most explicit about its design. It supports 15+ model providers, and the active model is determined entirely by `~/.pi/agent/models.json`. There is no single "Pi model." The model slot is just a slot.

### Context Management

Pi handles context window management internally. Like other agents, it compacts older context as conversations grow. This is harness work — the model does not manage its own context window.

### Guardrails

Step limits, message caps, and tool restrictions are configurable. These are structural constraints that the harness enforces regardless of what the model requests.

### Agent Loop

Standard architecture: call model, process tool calls, check stop conditions, repeat.

### Verify Step

Pi does not presume to know what "done" looks like for your task. You define the success criterion for your workflow. This is a deliberate choice: an opinionated verify step would couple the harness to a specific task type.

---

## The Model Layer: models.json

Pi's `models.json` is the clearest expression of its harness-first design philosophy. The file lives at `~/.pi/agent/models.json`, and Pi reloads it every time you open `/model` inside a session — no restart required.

Install Pi:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

Add a provider:

```json
// ~/.pi/agent/models.json
{
  "providers": {
    "ollama_remote": {
      "baseUrl": "http://192.168.2.200:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        {
          "_launch": true,
          "id": "qwen3-coder:30b",
          "contextWindow": 262144
        }
      ]
    }
  }
}
```

Start Pi and list available models:

```bash
pi
# then inside the session:
/model   # lists all providers, hot-reloads models.json each time
```

### The compat Block

The `compat` block exists in Pi's schema but **do not add it to Ollama provider configs** — it will cause errors. It appears to be intended for providers like Codex that have specific quirks around the `developer` role and `reasoning_effort` parameter. For Ollama, leave `compat` out entirely and the harness will use sane defaults.

---

## The Philosophy: Adapt Pi to Your Workflows

Pi's stated design goal is: "Adapt Pi to your workflows, not the other way around."

In practice, this means three things:

**You choose the model.** Swap between Ollama, OpenAI, Anthropic, LM Studio, or any OpenAI-compatible endpoint by editing one JSON file. No reinstallation, no reconfiguration of anything else.

**You define the guardrails.** What tools are available, how many steps the agent can take, what counts as a runaway loop — these are yours to configure for your specific use case.

**You own the verify step.** Pi does not assume what a successful outcome looks like. Your CI pipeline, your linter, your integration test suite — the verify step is whatever makes sense for your task.

### The Tradeoff Against Opinionated Harnesses

Claude Code is an opinionated harness. It enforces Claude models, ships a fixed but extensible tool set, and maintains strong defaults for context management and verification. That is not a weakness. An opinionated harness gets you from zero to productive in minutes because the decisions have been made for you.

Pi trades that fast start for long-term flexibility. You get more control; you also get more responsibility. If the context compaction strategy is not right for your use case, you adjust it. If you need a provider that no opinionated harness supports, you add it. If your verify step requires checking a database state rather than running a test suite, you define that.

The choice between them is not about quality. It is about fit. Ask: does my workflow fit the harness, or does the harness need to fit my workflow?

---

## When Pi's Approach Shines

**Running fully local models.** If you are pointing at an Ollama or LM Studio instance, Pi's provider config is the most direct path. You define the endpoint, the model ID, the context window, and any compatibility shims — and the harness handles the rest.

**Multi-model workflows.** Different task types benefit from different models. Refactoring a large file is different from generating test cases, which is different from reviewing architecture. Pi lets you switch models per session without touching anything else in your setup.

**Compliance and on-premises requirements.** If your organization requires that model requests never leave a specific network boundary, you need a harness that lets you define the endpoint. Pi gives you that directly.

**Understanding what your agent is doing.** The configuration is explicit. There is no magic endpoint selection or hidden provider fallback. If you want to know why your agent is behaving a certain way, you read the JSON file.

### When an Opinionated Harness Is the Better Choice

- You want zero configuration and productive output in under five minutes.
- You are using a single cloud provider and have no reason to swap.
- You want the harness to be maintained, updated, and debugged for you as the underlying APIs change.
- The tool set and model roster of an existing agent already match your needs.

---

## Testing It: Two Local Models, One Harness

The fastest way to see Pi's model layer in action is `--list-models`:

```bash
pi --list-models
```

```
provider  model            context  max-out  thinking  images
ollama    qwen3-coder:30b  256K     16.4K    no        yes
ollama    qwen3.6:35b      256K     16.4K    yes       yes
```

Pi reads `~/.pi/agent/models.json` and surfaces both Ollama models alongside every other configured provider. No restart, no cache to clear.

The examples below use `qwen3.6:35b` because it loads cold — no pre-warming needed. For coding-specific tasks, `qwen3-coder:30b` is the better fit once pre-loaded (see the cold start section below).

### Running a Task

Pi's `--print` flag runs a task non-interactively and exits — useful for testing a model before committing to a full session:

```bash
pi --provider ollama --model "qwen3.6:35b" --print "List the 3 most recent files in apps/blog-app/src/content by filename."
```

The model called the file listing tool, scanned 50 markdown files, and returned the correct result — all running locally, no cloud API involved.

### The Cold Start Problem

Running the same task with `qwen3-coder:30b` cold fails immediately:

```bash
pi --provider ollama --model "qwen3-coder:30b" --print "..."
# Error: Stream ended without finish_reason
```

`Stream ended without finish_reason` means Ollama is still loading the model from disk when Pi's stream parser times out. A 30B model can take 10–30 seconds to load into VRAM. Pi opens the connection and starts waiting for tokens, but none arrive in time.

The fix is to pre-load the model via the Ollama API before running Pi:

```bash
curl http://192.168.2.200:11434/api/generate \
  -d '{"model":"qwen3-coder:30b","keep_alive":-1}'
```

`keep_alive: -1` pins the model in VRAM indefinitely. After that, `qwen3-coder:30b` runs cleanly through Pi with no stream errors. If you are running Ollama locally, you can do the same thing with:

```bash
ollama run qwen3-coder:30b --keepalive -1
```

This is a harness-level lesson: the model slot is only as reliable as the infrastructure behind it. Pi surfaces the failure honestly — `Stream ended without finish_reason` is a precise description of what happened — but resolving it requires understanding one layer below Pi, in Ollama itself.

---

## Three More Harness Lessons

### The System Prompt Is a Harness Layer

The `--system-prompt` flag replaces the default coding assistant prompt entirely. The model does not know what the default was — it only sees what the harness passes:

```bash
pi --provider ollama --model "qwen3.6:35b" \
  --system-prompt "You are a ruthlessly terse code reviewer. Respond in bullet points only. No prose." \
  --print "Review this function: function add(a, b) { return a + b; }"
```

The same model. A completely different agent. The harness owns the persona — not the weights.

### JSON Mode Exposes the Event Stream

`--mode json` switches Pi's output from the human-readable default to a structured event stream:

```
session → agent_start → turn_start → tool_execution_start → tool_execution_end → turn_end → agent_end
```

Every tool call, every model turn, every session boundary is a typed JSON event. The model never sees this structure — it receives tokens and returns tokens. The harness wraps the entire interaction and emits it as a machine-readable stream, which is what makes Pi composable in scripts and pipelines.

### Sessions: The Harness Manages Memory, Not the Model

Models are stateless. They have no memory between calls. Session continuity is entirely a harness concern:

```bash
# First call — save context to a named session
pi --provider ollama --model "qwen3.6:35b" \
  --session-id "harness-demo" \
  --print "Remember: I am testing Pi's session memory for a blog post demo."

# Later call — different process, same session
pi --provider ollama --model "qwen3.6:35b" \
  --session "harness-demo" \
  --print "What did I ask you to remember?"
```

```
You asked me to remember: "Testing Pi's session memory for a blog post demo. Working in test/demo mode."
```

The model did not remember anything. Pi loaded the session file, injected the prior context into the prompt, and the model responded as if it had always known. That is the harness doing its job invisibly.

---

## Key Takeaways

Every AI coding agent is a harness. Pi just makes the harness visible.

The model is one swappable slot, not the agent's identity. When you install Claude Code, you are not choosing a model — you are choosing a harness that happens to have strong opinions about which model fills the slot. Pi separates those two decisions.

The `_launch: true` flag in `models.json` is a small example of harness-level engineering: telling the harness to initialize the model before use, in configuration rather than in agent logic, so it applies to all tasks without touching anything else.

"Adapt Pi to your workflows" is a design philosophy with real tradeoffs. More control and more responsibility are the same coin. If your workflow is standard, an opinionated harness will serve you faster. If your workflow is not — constrained endpoints, unusual tool requirements, specific compliance rules — a configurable harness is the right tool.

The wiring was always there. Pi just leaves it exposed so you can reach it.
