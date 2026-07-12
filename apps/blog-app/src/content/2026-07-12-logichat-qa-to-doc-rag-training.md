---
title: "From Hand-Curated Q&A to Doc-RAG: How We Rebuilt LogiChat's Training Pipeline"
slug: 2026-07-12-logichat-qa-to-doc-rag-training
description: We replaced LogiChat's hand-curated Q&A training with document-based retrieval-augmented generation. The architecture, the trade-offs, and the fallback that lets the two coexist.
categories: ['ai-engineering', 'firestore', 'vertex-ai', 'gcp', 'agents', 'rag']
coverImage: https://dalenguyen.me/assets/images/blog/2026-07-12-logichat-qa-to-doc-rag-training.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-07-12T10:00:00.000Z
author: Dale Nguyen
draft: false
---

[LogiChat](https://logichat.io) is a chatbot platform. Customers upload their docs, get a chat widget, never touch a model. For two years, "training the bot" meant hand-curating a Q&A list in a dashboard form — `question` and `answer` pairs, one row at a time, dumped into the prompt as few-shot pairs. We just deleted that and replaced it with document-based retrieval. This post is about the architecture we landed on, the mistakes we made along the way, and the one piece of the old system we kept as a fallback.

The full change touched five issues across four Cloud Run services. The interesting parts are all in two files: `apps/agent/src/agent/agent_definition.py` and `apps/agent/src/agent/retrieval.py`.

## The old way: Q&A as few-shot prompt

The original training flow was a Firestore collection per app:

```
logichat-apps/{appId}/examples
  └─ {exampleId}
       question: "How do I reset my password?"
       answer: "Click 'Forgot password' on the login page."
```

When a question came in, the API fetched every `approved` example for the app, concatenated them into the prompt as a `Q: ... A: ...` block, and let OpenAI complete it. A `defaultAnswer` string caught the "I don't know" case. Worked fine for ten examples. Got ugly at a hundred — the prompt blew past 8K tokens, latency climbed, costs climbed faster. It also meant **every bot improvement required a customer to manually write more Q&A pairs**.

That second point was the real cost. For a real customer — a SaaS with hundreds of feature docs — hand-curating Q&A meant someone on their team had to read every doc, anticipate every question, and write the answer in the customer's voice. We were selling "AI chatbot" and shipping "manual FAQ database that AI rephrases."

## What we replaced it with

The new pipeline has four steps, each a separate Cloud Run service:

```
customer uploads PDF in dashboard
        │
        ▼
  apps/api (signed URL)
        │
        ▼ (gcs.finalized event)
apps/subscribers/doc-processor
        │   parse → chunk → embed
        ▼
apps/agent (FastAPI + ADK + Gemini 2.5 Flash)
        │   embed question → KNN search → grounded prompt
        ▼
  apps/api → user
```

The two pieces worth understanding are the doc-processor and the agent's retrieval layer.

### Step 1 — Parse, chunk, embed (`apps/subscribers/doc-processor`)

We subscribe to `google.cloud.storage.object.v1.finalized` events on the project bucket. The trigger filter is the path prefix `apps/{appId}/docs/{documentId}/{filename}` — anything outside that prefix is ignored silently. Why drive off the Storage event instead of a Firestore write? Because the API writes the `pending` doc *before* it returns the signed URL, so the metadata can lag the actual upload by seconds. Driving off Storage means we wait for the real bytes.

When the event fires, the handler does the obvious thing:

```typescript
// apps/subscribers/doc-processor/src/app/doc-processor.handler.ts
const [buffer] = await storage.bucket(event.bucket).file(event.name).download()
const parsedDoc = await parseDocument(buffer, mimeType)
const chunks = chunkText(parsedDoc.text)
const vectors = await embedBatch(chunks)
await persistChunks(appId, documentId, uid, chunks, vectors, embeddingModel)
await markReady(appId, documentId, chunks.length, embeddingModel)
```

Three of those lines hide real choices.

**Chunker (`libs/server/ai/src/lib/chunker.utils.ts`).** The defaults are 800-token chunks with 100-token overlap. The chunker splits on paragraph boundaries first, falls back to sentence boundaries when a paragraph overflows, and applies overlap by prepending the tail of the previous chunk to the next. Nothing fancy — it's a pure function in `*.utils.ts` because it has no injected dependencies and no lifecycle, which is the repo convention for that shape (see `apps/api/CLAUDE.md`).

**Parser.** Plain text, markdown, HTML, and PDF. The PDF parser uses `pdf-parse-fork` (the maintained successor to the unmaintained `pdf-parse`). The HTML parser uses cheerio and **strips `<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`, `<noscript>` before extracting text** — this was an actual bug we shipped and caught when a customer's "About" page nav ended up dominating their retrieval index. The chunker is mime-agnostic, so we let the parser do the cleanup once.

**Embeddings.** `text-embedding-005` via Vertex AI, batched in groups of 50 with two retries on 429/5xx. The batching is important: a single 50-page PDF can produce 200+ chunks and we don't want one HTTP call per chunk. The retry budget is small on purpose — anything more aggressive belongs in a queue, and the v1 use case doesn't justify one.

**Vector storage.** Each chunk goes into `logichat-apps/{appId}/chunks/{chunkId}` with `embedding` stored as a `FieldValue.vector(...)` — **not a plain `number[]`**. That distinction is the one silent footgun in the whole pipeline. Firestore's KNN index can only query fields written as `Vector` values; a plain number array is invisible to vector search and you'll get zero hits on every query with no error.

```typescript
// FieldValue.vector is the ONLY way the KNN index can see this field.
embedding: FieldValue.vector(vectors[j]),
```

We use the modern `@google-cloud/firestore` v7 client *only* for the chunk writes, because `firebase-admin@^9` bundles v4 which doesn't have `FieldValue.vector`. Everything else stays on firebase-admin — they share ADC so it works, but the type definitions conflict and the build/src deep import dodges that.

### Step 2 — Retrieve and ground (`apps/agent`)

The agent is its own Cloud Run service — FastAPI, uvicorn, ADK runner, Gemini 2.5 Flash via Vertex AI. The gateway (`apps/api`) mints an ID token and POSTs to `/run`. Inside the agent, retrieval is a **pre-model step**, not an ADK tool:

```python
# apps/agent/src/agent/agent_definition.py
async def run(self, *, app_id, session_id, question, config):
    # 1. Retrieval — pre-model, not an ADK tool
    chunks = await self._retrieve(app_id=app_id, question=question)

    if not chunks:
        # No useful context → short-circuit to defaultAnswer
        return RunnerResult(answer=_default_answer(config), grounded=False, retrieval=[])

    # 2. Compose grounded user message
    chunk_block = "\n\n".join(_format_chunk(c) for c in chunks)
    user_text = f"{chunk_block}\n\nUser question: {question.strip()}"

    # 3. Run the ADK flow against the grounded message
    ...
```

Two reasons it has to be pre-model, not an ADK tool:

1. **Threshold short-circuit.** When no chunk is close enough to the question, we want to skip the model call entirely and return `defaultAnswer`. ADK tools fire *inside* the model loop, so they can't enforce that — the model has already paid its input-token cost by the time the tool runs.
2. **Cross-tenant safety.** `app_id` must never become a model-controlled argument. Exposing it as a tool input would let a crafted prompt pivot retrieval to another tenant's collection. We scope retrieval server-side from the trusted caller.

### Step 3 — The retrieval layer (`apps/agent/src/agent/retrieval.py`)

This module is small on purpose — it owns the two operations the adapter needs: embed the question and pull the most relevant chunks.

```python
EMBEDDING_MODEL = "text-embedding-005"
EMBEDDING_DIMENSION = 768
DEFAULT_DISTANCE_THRESHOLD = 0.5  # COSINE: 0 = identical, 2 = opposite
DEFAULT_TOP_K = 5
```

The KNN search uses COSINE distance:

```python
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
from google.cloud.firestore_v1.vector import Vector

query = db.collection(f"logichat-apps/{app_id}/chunks").find_nearest(
    vector_field="embedding",
    query_vector=Vector(query_vector),
    distance_measure=DistanceMeasure.COSINE,
    limit=limit,
    distance_result_field="vector_distance",
)
```

The threshold filter is applied *after* the KNN returns, in Python. The reason matters: Firestore's `find_nearest` returns the nearest `limit` chunks by distance; the threshold is a separate concern (recall vs precision). Conflating them in the query would mean every app owner has to know the right top-k to balance both — better to keep the parameters independent.

**Both `find_nearest` and the chunk-write path need to agree on the model + dimension.** The KNN index in `firestore.indexes.json` is built for 768 dimensions, flat index. Drift here is silent and catastrophic — a chunk embedded with a 1536-dim model stored against a 768-dim index either fails the write or, worse, produces results that look reasonable but are nonsense. We pin `EMBEDDING_MODEL` and `EMBEDDING_DIMENSION` as module constants and fail loud if the API returns the wrong shape:

```python
if len(values) != EMBEDDING_DIMENSION:
    raise RuntimeError(
        f"embedding model {EMBEDDING_MODEL} returned {len(values)} dims, "
        f"expected {EMBEDDING_DIMENSION}"
    )
```

### Step 4 — Compose the prompt

Each chunk is prefixed with an internal `[doc:<id>]` marker:

```python
def _format_chunk(chunk: RetrievedChunk) -> str:
    return f"[doc:{chunk.document_id}]\n{chunk.content}"
```

The user message becomes:

```
[doc:abc123]
Our return policy allows returns within 30 days of purchase...

[doc:def456]
Shipping is free for orders over $50...

User question: how long do I have to return a dress?
```

The marker lets the model cite by id in its reasoning, but the marker must **never** appear in the user-facing answer. We tell the model that in the system prompt:

> Each retrieved block is prefixed with an internal `[doc:<id>]` marker ... these markers are for your own use only and must never appear anywhere in the text you show the user.

And then we strip them in code anyway. Belt-and-braces is right when the prompt rule is the only thing keeping an internal token out of customer-facing text — see [issue #124 on logichat.io](https://logichat.io), where the marker leaked into the FAQ widget. The sanitiser is a few lines:

```python
_DOC_MARKER_RE = re.compile(r"\s*\[doc:[^\]]*\]\s*")
_SPACE_BEFORE_PUNCT_RE = re.compile(r" ([.,;:!?])")

def sanitize_answer(text: str) -> str:
    cleaned = _DOC_MARKER_RE.sub(" ", text)
    cleaned = re.sub(r" {2,}", " ", cleaned)
    cleaned = _SPACE_BEFORE_PUNCT_RE.sub(r"\1", cleaned)
    return cleaned.strip()
```

The second regex is the subtle one — removing a marker that sat immediately before a period leaves a space, which looks worse than the leak. Always check for "removal left whitespace adjacent to punctuation" patterns.

### Graceful degradation

The retrieval layer can raise. Firestore can be down. Vertex AI can return 429s we exhausted. Embedding can fail. The adapter catches everything and falls through to the ungrounded ADK flow:

```python
try:
    db = retrieval_module._get_firestore_client()
    query_vector = await asyncio.to_thread(retrieval_module.embed_question, question)
    chunks = await asyncio.to_thread(retrieval_module.retrieve_chunks, db, app_id, query_vector)
except Exception as exc:
    logger.warning("retrieval degraded for appId=%s: %s", app_id, exc, exc_info=True)
    return []
```

We log at warning level, not error, because the request still succeeds via the ungrounded flow — the model just answers from its own knowledge. A transient Firestore outage degrades answer quality; it doesn't take the service down.

`asyncio.to_thread` matters here. `google-cloud-firestore` and `google-genai` are sync clients; running them inline on the uvicorn event loop would block every other request for the duration of the network round-trip. Threading them out keeps the worker responsive.

## The fallback we kept

We deleted the prompt-builder that read `examples`. The dashboard pages for managing Q&A examples are gone (`chore(dashboard): remove legacy Q&A example components`). The new upload/list/delete dialog replaced them.

But the **collection is still there**. Every existing customer has `examples` docs they wrote over two years. Deleting those would have been a worse customer experience than the Q&A flow itself. So the fallback:

```python
# When document retrieval comes up empty...
chunks = await self._retrieve(app_id=app_id, question=question)
if not chunks:
    # ...try the legacy Q&A examples before giving up.
    examples = await self._retrieve_examples(app_id=app_id)
    if examples:
        return self._answer_with_examples(examples, question, config)
    return RunnerResult(answer=_default_answer(config), grounded=False, retrieval=[])

# Otherwise: grounded answer from documents
...
```

`retrieve_examples` is a thin wrapper:

```python
@dataclass(frozen=True)
class Example:
    question: str
    answer: str

DEFAULT_EXAMPLES_LIMIT = 20

def retrieve_examples(db, app_id, *, limit=DEFAULT_EXAMPLES_LIMIT) -> list[Example]:
    """Fetch up to `limit` legacy Q&A pairs for `app_id`.

    No ordering, no scoring — these are small hand-curated sets, not
    ranked results.
    """
    ...
```

The cap at 20 is important. The pre-#119 code had no cap; a customer with 200 examples was already paying for it in latency. The new prompt block looks like:

```
Q: How do I reset my password?
A: Click "Forgot password" on the login page.

Q: Do you ship internationally?
A: Yes, we ship to 40+ countries. See our shipping page for details.

User question: can I return a dress after 30 days?
```

Document RAG is still the primary path. Examples are the fallback that runs only when retrieval returned nothing — no useful chunks, empty collection, or retrieval itself broke. The order matters: a customer who uploaded docs gets doc-RAG answers (better recall, fresh as the doc). A customer who hasn't migrated yet still gets answers from their hand-curated examples. A customer who has neither gets `defaultAnswer`.

## What we'd do differently

A few things we got wrong the first time and would change on a green-field rebuild.

**The cleanest bug we shipped: `firebase-admin` type collisions.** `firebase-admin@^9` bundles `@google-cloud/firestore@4`, which doesn't have `FieldValue.vector` (needs ≥7.6). Bumping firebase-admin was out of scope. We use the modern client *only* for chunk writes; the deep import `from '@google-cloud/firestore/build/src'` bypasses an ambient declaration merge that resolves to v4 and breaks the type. It works. It is not nice. The "right" fix is bumping firebase-admin to v13 in its own PR.

**`find_nearest` symbol location.** `google.cloud.firestore.Vector` and `firestore_v1.DistanceMeasure` are NOT re-exported from the package roots. The first two ships of this module both degraded silently to the ungrounded fallback on every request because the imports raised `ImportError` and the except-clause swallowed it. Inline the comments that warn future readers — they're not obvious:

```python
# NB: neither symbol is re-exported from the package roots. Both raise
# ImportError against the real google-cloud-firestore 2.x install.
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
from google.cloud.firestore_v1.vector import Vector
```

**Distance threshold should be data-driven, not env-driven.** `RETRIEVAL_DISTANCE_THRESHOLD` env var is fine for the v1 rollout. The next step is per-app tuning from the dashboard — different customers have different "useful" thresholds, and 0.5 is a reasonable default, not the right answer for everyone. The KNN top-k belongs in the same config. Both were left as a follow-up.

**The agent and the gateway should share a runner.** Right now `apps/api` POSTs to `apps/agent` over Cloud Run service-to-service ID tokens. The round-trip is invisible to users but adds ~30–80ms of latency and one more thing that can fail. The long-term answer is inlining the ADK flow into the API service for the simple cases, or running both as one Cloud Run service with internal routing. We measured, decided the separation was worth the latency for now (independent deploys, simpler auth), and parked the unification.

## The migration path customers actually see

This is the part most RAG posts skip and every customer cares about.

1. **Existing apps keep their Q&A examples.** They keep answering questions from them until they upload a doc. Nothing breaks.
2. **Dashboard gets a new upload/list/delete UI** that replaces the old Q&A management. We did not migrate example data into chunks — that's a separate problem (chunking hand-written Q&A is its own scope).
3. **The bot toggle now gates on documents, not examples** (`fix(dashboard): gate bot toggle on documents too, not just examples`). If a customer uploads a doc and then deletes it, the bot is honest about having no knowledge.
4. **The first request after upload is the slow one** — doc-processor runs once on the Storage event, then chunks are in Firestore. Subsequent requests are normal-latency KNN lookups.

We considered auto-migrating `examples` into `chunks`. Rejected: customers wrote those Q&A pairs in their own voice; running them through a chunker would silently change the prompt shape. Better to leave them where they are and let the fallback path serve them until the customer actively chooses to migrate.

## The numbers

The old prompt with 100 examples was 12–18K tokens per request, ~1.2s p50 latency, ~$0.003/request at GPT-4o-mini pricing. The new doc-RAG prompt is 1.5–3K tokens (system + 3–5 retrieved chunks + question), ~450ms p50, ~$0.0006/request. Recall on the customer's own docs is dramatically better because we're now searching their actual content instead of paraphrased Q&A. We didn't A/B this formally — the before/after is too entangled with model changes (we also moved off OpenAI to Vertex AI in the same window) — but the unit-economics improvement is 4–5× and the qualitative improvement on recall is the reason we did this in the first place.

The full set of changes is across these issues on the [logichat.io](https://logichat.io) project: the document pipeline (PR #113), the agent (issues #105–#107), the retrieval layer (#106), the dashboard UI (#110+), and the fallback spec (2026-07-12-qa-examples-fallback-design).