---
title: "Ollama vs MLX on Apple Silicon: Benchmarking Qwen3.6-35B and the Truth About TurboQuant"
slug: 2026-06-13-ollama-vs-mlx-apple-silicon-turboquant
description: One model run two ways on an M4 Pro, with live charts. Is MLX faster than Ollama? Does TurboQuant's "5x less memory" claim hold up? The answer hides in the model's architecture.
categories: ['local-ai', 'mlx', 'ollama', 'apple-silicon', 'llm', 'quantization']
coverImage: https://dalenguyen.me/assets/images/blog/ollama-vs-mlx-apple-silicon-turboquant.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-06-13T10:00:00.000Z
author: Dale Nguyen
draft: false
---

A claim has been making the rounds: that TurboQuant KV-cache quantization lets you run 32B-class models on a Mac with **~5× less memory**, with community MLX ports reporting a 4.9× reduction at ~98% of FP16 decode speed.

I had `qwen3.6:35b` sitting in Ollama on my M4 Pro, so I ran one model — in its 4-bit form — two different ways, on prompts of four lengths, to test it. Three questions: Is plain **MLX faster than Ollama**? Does **TurboQuant** deliver on a real workload? And where does "5× less memory" actually apply? The third answer turned out to be the most interesting — because the model I tested is exactly the kind where TurboQuant *doesn't* matter much, and knowing why will save you from chasing the wrong optimization.

Everything below is live: hover the bars, drag the slider, hover the layers.

## The setup

Same model, same 4-bit size, same computer, same questions. The only things that change are the program running the model (the "runtime") and how its short-term memory is stored.

> **Quick vocab — in plain English**
>
> **Weight** — one of the millions of numbers a model learned. **Token** — a chunk of text, about ¾ of a word. **KV cache** — the model's short-term memory of the tokens it has seen so far; it grows the longer your prompt gets. **Prefill** — reading your prompt before it starts answering. **Decode** — writing the answer one token at a time ("decode speed" = how fast it types).

|  | 🦙 Ollama 0.30.7 | ⚡ MLX (mlx-lm 0.31.3) |
|---|---|---|
| Model | `qwen3.6:35b` (Q4_K_M GGUF) | `mlx-community/Qwen3.6-35B-A3B-4bit` |
| Size on disk | 23 GB | 20.4 GB |
| Runtime | llama.cpp-based server, Metal | Apple's MLX, Metal |
| Vibe | The easy button — downloads, loads, and caches for you | Hands-on — you load and run it yourself |

Hardware: MacBook Pro, **Apple M4 Pro**, 14-core CPU / 20-core GPU, **48 GB** unified memory, macOS 26.5.

> **What the model actually is.** **Qwen3.6-35B** has 36 billion weights, but it's a "mixture of experts": for each token it only uses about **3 billion** of them. That's why a model this big can still feel fast. But the detail that decides the whole TurboQuant story is one level deeper — in how its *attention* works.

## Concept 1 — "hybrid" attention

A model is built from stacked **layers**. This model's 40 layers follow a repeating pattern: **3 "light" layers, then 1 "full" layer**. Only the full layers keep a growing short-term memory (the KV cache). The light ones get by with a tiny fixed-size memory.

<div data-chart="layers">Interactive diagram — enable JavaScript to view. 10 of the 40 layers use full attention and carry a growing KV cache; the other 30 use a small fixed state.</div>

> **Why this matters.** A normal ("dense") 32B model keeps the KV cache in **every** layer. This model keeps it in only a quarter of them — and even those store very little. **So the model is already small on the exact thing TurboQuant tries to shrink.** Remember that — it's the punchline.

## Concept 2 — the KV cache, and why its size depends on the model's design

Every token the model reads leaves a little "Key" and "Value" note behind in each full layer. They pile up. How much memory that takes is just multiplication — drag the slider and watch it grow.

<div data-chart="kv-calculator">Interactive calculator — enable JavaScript to view. At 32K tokens the hybrid model spends ~0.65 GB on KV; a dense 32B would spend ~8.4 GB.</div>

> **Read this off the calculator.** At a huge 256K context, the hybrid model's KV cache is about **5 GB** — the dense model's is **64 GB**, which won't even fit on a 48 GB Mac. **That gap is the architecture's doing, not quantization's.** TurboQuant's job is to shrink the *dense* bar — exactly the case the hybrid model avoids.

## Concept 3 — what TurboQuant does

[TurboQuant](https://arxiv.org/abs/2504.19874) (a 2025 paper by Zandieh, Daliri, Hadian & Mirrokni) is **not** about shrinking the weights — the model stays the same size. It shrinks the **KV cache** on the fly, as new tokens come in, in three steps:

1. **Spin** — rotate each memory note in a random but reversible way, spreading its numbers into a neat, predictable (Beta) distribution.
2. **Squeeze** — now that the numbers are predictable, round them to ~3 bits with surprisingly little error.
3. **Fix-up** — a tiny extra step corrects the error in the part the model's attention actually leans on. No calibration data needed.

The community MLX port ([rachittshah/mlx-turboquant](https://github.com/rachittshah/mlx-turboquant)) makes it a one-line swap. This is the entire integration:

```python
from mlx_lm import load, stream_generate
from mlx_lm.models.cache import make_prompt_cache, KVCache
from mlx_turboquant.cache import TurboQuantKVCache

model, tokenizer = load("./model")
cache = make_prompt_cache(model)
for i, c in enumerate(cache):
    if isinstance(c, KVCache):                      # only the 10 full-attention layers
        cache[i] = TurboQuantKVCache(bits=3, head_dim=256)
for resp in stream_generate(model, tokenizer, prompt, prompt_cache=cache, max_tokens=256):
    print(resp.text, end="")
```

## The headline result — MLX is the faster runtime

Same model, same prompts. MLX writes answers faster than Ollama at every prompt length. Switch the metric and hover the bars for exact numbers.

<div data-chart="speed">Interactive chart — enable JavaScript to view. MLX leads Ollama at every prompt length (≈80 vs 53 tok/s decode on short prompts).</div>

> **MLX wins.** It writes **45–51% faster** (80 vs 53 tok/s on a short prompt), using about 1 GB less memory. For one-off questions, it feels noticeably snappier.

> **Ollama's comeback.** Send a prompt that starts the same as the last one, and Ollama reuses its earlier reading instead of re-reading it — 32,000 tokens in 60 milliseconds. Plus model downloads "just work." That 50% gap disappears whenever prompts repeat.

## Shrinking the KV cache on the 35B — the surprise

Now stay inside MLX and compare three ways of storing that short-term memory at a long 32,000-token prompt: full-size (fp16), a built-in 4-bit version, and TurboQuant's 3-bit. Watch both what you save and what it costs.

<div data-chart="variant">Interactive chart — enable JavaScript to view. Quantizing the KV cache saves ~0.5 GB but slows decode from 58 to 7.5 tok/s with the Python port.</div>

> **Two surprises at once.** **(a)** Shrinking the KV cache saves only about half a gigabyte here — next to a 19.5 GB model. It was never the thing eating your memory. **(b)** And it isn't free: the built-in 4-bit version actually *slows things down* (58 → 45 tok/s). The simple TurboQuant version drops all the way to **7.5 tok/s** — ~8× slower — because it unpacks the memory on every single token.

## The control test — where TurboQuant *does* pay off

To prove the point, I ran the same three options on a **dense** model (Llama-3.2-1B) — one that keeps KV memory in *every* layer, so it actually has a lot to shrink. This is where TurboQuant is supposed to shine.

<div data-chart="control">Interactive chart — enable JavaScript to view. On a dense model the cache shrinks ~4× (1.07 GB → 0.27 GB) and fused 4-bit even speeds decode up.</div>

> **Shrinking confirmed.** **1.07 GB → 0.27 GB** — about 4× smaller, matching the paper. And here the built-in 4-bit version *speeds the model up* (86 → 99 tok/s): on this kind of model, a smaller memory is faster to read. Same trick, opposite result from the big model.

> **Quality breaks at 3-bit.** At 3-bit, the little model stopped summarizing and just **repeated the input word-for-word**. The "Key" half of the memory falls apart below 4 bits — which is why good tools keep keys at 8-bit and only squeeze the "Value" half. The big model didn't care (only a quarter of its layers were squeezed).

## What to remember

1. **For raw speed on Apple Silicon, MLX wins — by a lot.** ~80 vs ~53 tok/s decode, holding at every context length, in slightly less memory.
2. **For zero-hassle everyday use, Ollama is still the default.** It remembers repeated prompts and downloads are painless. The speed gap vanishes whenever prompts repeat.
3. **Check how a model is built before optimizing its memory.** This model's design already shrank its KV memory ~8–13× vs a normal model. "5× less memory" is real — but for dense long-context models, not this one. Read `layer_types` first.
4. **Shrinking the KV cache isn't free — and can backfire.** Built-in 4-bit sped up the small dense model (+16%) but slowed the big one (−22%). Simple do-it-yourself versions are 4–12× slower. And the "Key" half breaks below 4-bit — keep it at 8.
5. **48 GB fits only one big model at a time.** A leftover Ollama copy ate the memory and crashed every MLX run. If you test both, shut one down before starting the other.

---

*Built from real runs on an M4 Pro. TurboQuant ports tested: [rachittshah/mlx-turboquant](https://github.com/rachittshah/mlx-turboquant) (Python, used here) and [arozanov/turboquant-mlx](https://github.com/arozanov/turboquant-mlx) (fused Metal kernels + K8/V4 mixed precision — the production path).*
