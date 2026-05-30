---
title: "Local-first: a Model on Your Own Machine, Zero Cloud"
slug: 2026-05-30-local-first-a-model-on-your-own-machine-zero-cloud
description: Run a local LLM behind an OpenAI-compatible endpoint on hardware you already own, call it from the OpenAI SDK, and understand the stateless contract that underpins every AI API.
categories: ['ai', 'llm', 'local-ai', 'ollama', 'python', 'open-source']
series: Portway - Local-first AI
coverImage: https://dalenguyen.me/assets/images/blog/local-first-a-model-on-your-own-machine-zero-cloud.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-05-30T00:00:00.000Z
author: Dale Nguyen
---

This is the concrete, runnable walkthrough for Post 1 of the [Portway series](https://github.com/dalenguyen/portway). The goal: stand up a single model behind an OpenAI-compatible endpoint on hardware you already own, call it from the official OpenAI SDK, and internalize the stateless contract. Everything here runs locally for $0.

## What this post covers

- A `demo.py` script with two blocks:
  1. **Round-trip** — one chat call via the OpenAI SDK, printing the content and the `usage` object.
  2. **Stateless proof** — the same final question sent as a 1-turn message and as the last turn of a 5-turn fabricated history; both `prompt_tokens` values are printed alongside an explanation of the delta.

## Engine choice on this machine

Apple Silicon Mac, 48 GB unified memory, **Ollama** already installed. The demo uses Ollama's OpenAI-compatible endpoint at `http://localhost:11434/v1` and the `gpt-oss:20b` model (~14 GB).

> The wider Portway series uses `llama.cpp` on Mac (Ollama is called out as problematic for Qwen3.5 in Post 2). For Post 1 — one model, prove the contract — Ollama is fine and already on the box.

## Model options by available RAM

The demo script works with any Ollama-served model — just substitute the model name in `demo.py`. The table below covers machines from 9 GB unified memory upward.

| Model | Pull command | Approx size | Min RAM | Notes |
|---|---|---|---|---|
| `llama3.2:3b` | `ollama pull llama3.2:3b` | ~2 GB | 8 GB | Fastest; good for testing the contract |
| `gemma3:4b` | `ollama pull gemma3:4b` | ~3 GB | 8 GB | Google; solid instruction-following |
| `mistral:7b` | `ollama pull mistral:7b` | ~4.1 GB | 8 GB | Classic 7B baseline |
| `llama3.1:8b` | `ollama pull llama3.1:8b` | ~4.7 GB | 9 GB | Best quality under 10 GB |
| `qwen2.5:7b` | `ollama pull qwen2.5:7b` | ~4.4 GB | 9 GB | Strong at instruction + reasoning |
| `gpt-oss:20b` | `ollama pull gpt-oss:20b` | ~14 GB | 24 GB | Used in this post's sample output |

On a 9 GB machine, replace `gpt-oss:20b` in `demo.py` with `llama3.1:8b` or `qwen2.5:7b` — the contract demonstration is identical.

## Prerequisites

- [Ollama](https://ollama.com) running locally (`curl -s http://localhost:11434/api/tags` should return JSON)
- [uv](https://docs.astral.sh/uv/) installed (`uv --version`)
- The model pulled. This post uses `gpt-oss:20b` (requires ~24 GB RAM); see [Model options by available RAM](#model-options-by-available-ram) for lighter alternatives on 9 GB+ machines.

```bash
ollama pull llama3.2:3b
```

## Run it

From the repo root:

```bash
uv sync                                  # creates .venv at root, installs deps
uv run --project 1-local-first python 1-local-first/demo.py
```

## Sample output

A real run on this machine (M4-class Mac, 48 GB, `gpt-oss:20b` via Ollama). Numbers will differ with smaller models — `prompt_tokens` for the same input stays deterministic regardless of model:

```
============================================================
Block 1 — round-trip via OpenAI SDK against localhost
============================================================
content: Toronto, Vancouver, Montreal.
usage:   CompletionUsage(completion_tokens=43, prompt_tokens=72, total_tokens=115, ...)

============================================================
Block 2 — same final question, 1-turn vs 5-turn history
============================================================
1-turn response: The capital of Canada is **Ottawa**.
5-turn response: The capital of Canada is **Ottawa**, located in the province of Ontario.

1-turn prompt_tokens: 75
5-turn prompt_tokens: 139
delta:                64

Why the delta exists: the server holds NO conversation state between
requests. The 5-turn call's prompt_tokens is higher only because the
client re-sent the full history in the request body. Each call is
evaluated from scratch — history is the client's responsibility.
```

`completion_tokens` and the response text will vary run-to-run (sampling is non-deterministic at default temperature). `prompt_tokens` for the same input is deterministic — 75 and 139 should reproduce.

Notice how the 5-turn response picks up the road-trip context ("located in the province of Ontario") while the 1-turn answer riffs on the bare "Driving." in its prompt — same model, different framing in the client-supplied messages.

## The stateless contract, explained

This is the most important concept in the series. Every request to an LLM API — local or cloud — is evaluated from scratch. The server has no memory of previous turns. When you send a multi-turn conversation, **you** are the one re-sending the full history in the request body. The model sees it all at once.

The server's only "memory" between requests is the **prefix cache** (a compute optimisation that avoids re-evaluating tokens it has seen before), never conversation state. The cache is invisible to you — from the API contract's perspective, each call is stateless.

Understanding this is the foundation for everything that follows in the series:

- Why conversation management belongs in the client, not the server
- Why context windows matter for cost and latency
- Why streaming `usage` requires an explicit opt-in (`stream_options.include_usage`)

## Definition of done

- OpenAI SDK round-trips against `localhost` — Block 1 prints a real `content` and a `usage` object.
- Can explain why 5 turns vs 1 turn changes `prompt_tokens` while the server remembers nothing — Block 2 prints both numbers and the one-paragraph explanation.

## Things worth noting now

**Context size eats RAM/VRAM.** Ollama's default context window is conservative for most models; raising it (e.g. `ollama run llama3.2:3b` → `/set parameter num_ctx 32768`) costs unified memory. It was not changed for this post.

**gpt-oss emits a reasoning channel** (Harmony format). The engine applies the template; you still get a normal `message.content`. The reasoning channel will be segregated at the gateway in Post 3.

**No streaming yet.** Post 5 covers the streaming `usage` trap — you must opt in via `stream_options.include_usage`, otherwise `usage` is `null` in streamed responses.

## What's next

Post 2 moves from a single model to running multiple models simultaneously and routing requests between them — the first step toward a real local gateway.

The full series and all demo code live in the [Portway repository](https://github.com/dalenguyen/portway).
