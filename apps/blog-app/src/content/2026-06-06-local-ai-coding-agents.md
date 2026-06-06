---
title: Run Coding Agents on Local AI — Zero Cloud, Full Control
slug: 2026-06-06-local-ai-coding-agents
description: A practical guide to replacing cloud AI APIs with a local Ollama server running qwen3-coder:30b — connecting Codex CLI, Claude Code, Cursor, and Pi to your own hardware.
categories: ['ollama', 'local-ai', 'codex-cli', 'claude-code', 'privacy', 'developer-tools']
coverImage: https://dalenguyen.me/assets/images/blog/local-ai-coding-agents.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-06-06T09:00:00.000Z
author: Dale Nguyen
draft: false
---

Coding agents — Codex CLI, Claude Code, Cursor, and Pi — are productivity multipliers. But they all assume you are happy sending your code to someone else's servers. For many of us that is a deal-breaker: proprietary codebases, client NDAs, compliance requirements, or just the principle of owning your own compute.

This guide shows how to swap out every cloud API with a local [Ollama](https://ollama.com) server running **qwen3-coder:30b**. Same tools, same workflows, no data leaving your network.

---

## Why Run AI Locally?

The case is simple:

- **Zero data exfiltration.** Your code never leaves your machine or LAN.
- **No per-token cost.** Run 10,000 completions or 10 — the electricity bill does not care.
- **Works offline.** Airplane mode, restricted network, flaky VPN — irrelevant.
- **No rate limits.** No 429s at 2 am when you are in flow.

The honest tradeoff: frontier models (Claude Opus 4, GPT-5) still outperform local models on complex multi-step reasoning and very large context tasks. For the 80% of day-to-day coding work — autocomplete, refactors, test generation, documentation — a well-chosen local model is more than good enough.

---

## Hardware Requirements

I run this on an **Apple M4 Pro with 48 GB unified memory**. Apple Silicon's unified memory architecture is exceptionally well-suited to LLM inference: the GPU and CPU share the same memory pool, so a 22 GB model fits comfortably alongside a full development environment.

Minimum viable setup:

| RAM | What fits |
|-----|-----------|
| 16 GB | 7–8B parameter models (qwen3:8b, llama3.2:8b) |
| 32 GB | 14–20B models (qwen3:14b, gpt-oss:20b) |
| 48 GB | 30–35B models (qwen3-coder:30b, qwen3.6:35b) |
| 64 GB+ | 70B models (deepseek-r1:70b, llama3.3:70b) |

On Intel/AMD systems with discrete GPUs the math is different: VRAM is the bottleneck, and models that don't fit entirely in VRAM fall back to slow CPU offloading.

---

## Choosing a Model

For 48 GB unified memory, these are the models worth knowing about:

| Model | Size on disk | Active params | Strengths |
|-------|-------------|---------------|-----------|
| **qwen3-coder:30b** | ~22 GB | 3.3B (MoE) | Coding, 256K context, HumanEval SOTA |
| qwen3.6:35b | ~24 GB | Full dense | General reasoning + vision |
| gpt-oss:20b | ~14 GB | Full dense | Function calling, tool use |
| gemma4:27b | ~18 GB | Full dense | Math, structured output |
| deepseek-r1:70b | ~45 GB | Full dense | Chain-of-thought, complex reasoning |

**qwen3-coder:30b** is the default recommendation for coding tasks. It uses a Mixture-of-Experts architecture — only 3.3B parameters are active per token — so inference is fast despite the large parameter count. The 256K context window handles entire codebases without chunking. It beats GPT-4o on HumanEval benchmarks.

Pull it with Ollama:

```bash
ollama pull qwen3-coder:30b
```

---

## Setting Up Ollama as a Network Server

By default Ollama listens on `localhost` only. To reach it from other machines on your LAN (or to let coding tools that open their own network connections reach it), bind to all interfaces:

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

To make this permanent on macOS, edit the Ollama launch agent or set the environment variable in your shell profile before starting Ollama. The server will then be reachable at:

```
http://192.168.2.200:11434
```

Replace `192.168.2.200` with your machine's LAN IP. Verify it is working:

```bash
curl http://192.168.2.200:11434/api/tags | jq '.models[].name'
```

Ollama exposes an OpenAI-compatible `/v1` endpoint, which is what all the tools below use.

---

## Codex CLI

[Codex CLI](https://github.com/openai/codex) is OpenAI's terminal-based coding agent. It supports custom model providers through its TOML configuration.

### Install

```bash
npm install -g @openai/codex
```

### Configuration

Create `~/.codex/config.toml`:

```toml
model = "qwen3-coder:30b"
model_provider = "ollama_remote"
model_context_window = 262144
model_catalog_json = "/Users/me/.codex/model_catalog.json"

[model_providers.ollama_remote]
name = "Ollama Remote"
base_url = "http://192.168.2.200:11434/v1"
env_key = "OLLAMA_API_KEY"
```

A few gotchas discovered the hard way:

- **Provider ID must use underscores**, not hyphens. `ollama-remote` fails with a parse error; `ollama_remote` works.
- **`name` is required** in `[model_providers.*]`. Omitting it throws `provider name must not be empty`.
- **`ollama`, `openai`, and `lmstudio` are reserved** built-in provider IDs and cannot be overridden. Always use a custom name like `ollama_remote`.
- **`model_context_window`** must be set explicitly — Codex won't infer it for unknown models.

Set the API key environment variable (Ollama doesn't require auth, but Codex won't start without it):

```bash
export OLLAMA_API_KEY=ollama
```

### Model Catalog

Without a model catalog, Codex prints `Model metadata for qwen3-coder:30b not found` and falls back to broken defaults. The catalog format requires every field from Codex's bundled schema — a simplified JSON with just a few keys will fail with `missing field` errors.

The cleanest approach: generate the catalog from Codex's own bundled metadata and patch in your model:

```bash
codex debug models --bundled | python3 -c "
import json, sys
d = json.load(sys.stdin)
m = d['models'][0].copy()
m['slug'] = 'qwen3-coder:30b'
m['display_name'] = 'Qwen3-Coder 30B'
m['description'] = 'Coding-specialized MoE model with 256K context.'
m['context_window'] = 262144
m['max_context_window'] = 262144
m['availability_nux'] = None
m['upgrade'] = None
m['supported_reasoning_levels'] = []
m['default_reasoning_level'] = 'low'
m['supports_reasoning_summaries'] = False
m['default_reasoning_summary'] = 'none'
print(json.dumps({'models': [m]}, indent=2))
" > ~/.codex/model_catalog.json
```

The two critical fields are `supported_reasoning_levels: []` and `supports_reasoning_summaries: false`. Without them, Codex sends a `thinking` parameter that Ollama rejects with `does not support thinking`. Note that `qwen3-coder:30b` does support chain-of-thought reasoning — Qwen3 models reason internally via `<think>` tags. Disabling this API parameter just stops Codex from requesting it in an OpenAI-specific format that Ollama doesn't accept.

Verify the catalog loaded correctly:

```bash
OLLAMA_API_KEY=ollama codex debug models | python3 -c "
import json, sys
d = json.load(sys.stdin)
m = [x for x in d['models'] if 'qwen3-coder' in x['slug']][0]
print('slug:', m['slug'], '| context_window:', m['context_window'])
print('reasoning_levels:', m['supported_reasoning_levels'])
"
# slug: qwen3-coder:30b | context_window: 262144
# reasoning_levels: []
```

### Running Codex

```bash
OLLAMA_API_KEY=ollama codex
```

Or add it permanently to `~/.zshrc`:

```bash
export OLLAMA_API_KEY=ollama
```

Then just run `codex` from any project directory.

---

## Claude Code

Claude Code is Anthropic's official CLI agent. It is hardwired to the Anthropic API but accepts a base URL override — which means you can point it at any OpenAI-compatible endpoint, including Ollama.

### Configuration

Set two environment variables before launching Claude Code:

```bash
export ANTHROPIC_BASE_URL=http://192.168.2.200:11434
export ANTHROPIC_API_KEY=ollama
```

Start Claude Code:

```bash
claude
```

At the login prompt, select **"Anthropic Console"** as the login method. Claude Code will use the base URL you provided instead of `api.anthropic.com`.

To make this permanent, add the exports to your shell profile (`~/.zshrc`, `~/.bashrc`):

```bash
# Local AI backend for Claude Code
export ANTHROPIC_BASE_URL=http://192.168.2.200:11434
export ANTHROPIC_API_KEY=ollama
```

Then reload:

```bash
source ~/.zshrc
```

One practical note: Claude Code's system prompts are written for Claude models and include Anthropic-specific formatting expectations. qwen3-coder:30b handles them well, but you may see occasional formatting quirks in responses. They do not affect functionality.

---

## Cursor

Cursor has a similar configuration path. In **Settings → Models → OpenAI API Key**, switch to a custom base URL:

1. Open **Cursor Settings** (`Cmd+,`).
2. Navigate to **Models**.
3. Enable **"Override OpenAI Base URL"**.
4. Enter `http://192.168.2.200:11434/v1`.
5. Enter `ollama` as the API key.
6. Select or type `qwen3-coder:30b` as the model.

---

## Pi (pi.dev)

[Pi](https://pi.dev) is a minimal agent harness built for extensibility — "adapt Pi to your workflows, not the other way around." It supports 15+ providers and custom local endpoints via a `models.json` file that hot-reloads between sessions.

### Install

```bash
npm install -g @pi-ag/coding-agent
```

### Configuration

Add your local Ollama server to `~/.pi/agent/models.json`:

```json
{
  "providers": {
    "ollama_remote": {
      "baseUrl": "http://192.168.2.200:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        {
          "id": "qwen3-coder:30b",
          "contextWindow": 262144,
          "compat": {
            "supportsDeveloperRole": false,
            "supportsReasoningEffort": false
          }
        }
      ]
    }
  }
}
```

The `compat` block is important: Ollama doesn't understand the `developer` role or `reasoning_effort` parameter that Pi sends to reasoning-capable models by default. Setting both to `false` routes around those errors.

### Running Pi

```bash
pi
```

Select the model with `/model` inside the session — it lists all providers including your custom `ollama_remote` entry. The `models.json` file reloads each time you open `/model`, so you can add or swap models without restarting.

---

## Tradeoffs to Know Before Committing

Being honest about the limitations matters more than selling this as a perfect replacement.

**Where qwen3-coder:30b matches or beats cloud models:**
- Single-file refactors and rewrites
- Test generation from existing code
- Documentation and comment generation
- Code review and explaining what code does
- SQL queries, shell scripts, configuration files
- Repetitive boilerplate

**Where frontier models still have an edge:**
- Multi-file architecture changes requiring deep cross-file reasoning
- Tasks requiring the model to hold very large context simultaneously (though 256K helps significantly)
- Novel algorithm design in complex domains
- Catching subtle security vulnerabilities in unfamiliar code patterns

**Operational considerations:**
- First inference after loading the model takes a few seconds. Subsequent calls are fast.
- If your Mac goes to sleep, Ollama suspends. You may want to keep "Prevent computer from sleeping" on while working.
- The Ollama server is unauthenticated by default. Keep it on your LAN only — do not expose port 11434 to the internet.

---

## A Note on Model Selection for Other Tasks

If qwen3-coder:30b is not the right fit for a specific task, here is when to switch:

- **Vision tasks** (screenshots, diagrams in context): use `qwen3.6:35b` — it has multimodal support.
- **Heavy function/tool calling** in agentic workflows: `gpt-oss:20b` has more reliable structured output.
- **Math or formal reasoning**: `gemma4:27b` has strong performance on reasoning benchmarks.
- **Chain-of-thought problems** where you want to see the reasoning trace: `deepseek-r1:70b` (needs 45+ GB free RAM).

Switching models in Ollama is instant — just pull the model and update the `model` field in your config.

---

## Conclusion

Replacing cloud APIs with a local Ollama server is a one-afternoon project that delivers permanent benefits: no cost, no data exposure, no rate limits. The setup is three configuration files and two environment variables.

qwen3-coder:30b is capable enough that you will not miss the cloud for most coding work. When you do need frontier-level reasoning, the cloud is still there — but now it is opt-in, not the default.

The key insight is that your hardware, your code, and your workflow should stay under your control. The tools were always willing to connect to any compatible endpoint. Now you know how to give them one that you own.
