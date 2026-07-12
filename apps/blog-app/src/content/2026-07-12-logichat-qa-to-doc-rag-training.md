---
title: "Building a Document-RAG Agent on GCP's Agent Development Kit (ADK)"
slug: 2026-07-12-logichat-qa-to-doc-rag-training
description: How LogiChat rebuilt its bot-training pipeline on Google ADK + Vertex AI + Firestore — the architecture, the pre-model retrieval pattern, and the Q&A fallback that keeps customers whole during the migration.
categories: ['ai-engineering', 'agents', 'gcp', 'vertex-ai', 'firestore', 'rag', 'adk']
coverImage: https://dalenguyen.me/assets/images/blog/2026-07-12-logichat-qa-to-doc-rag-training.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-07-12T10:00:00.000Z
author: Dale Nguyen
draft: false
---

[LogiChat](https://logichat.io) is a chatbot platform. Customers upload their docs, get a chat widget, never touch a model. For two years, "training the bot" meant hand-curating a Q&A list in a dashboard form — `question` and `answer` pairs, one row at a time, dumped into the prompt as few-shot pairs. We just deleted that and rebuilt the whole pipeline on **[Google's Agent Development Kit (ADK)](https://google.github.io/adk-docs/)**, with **Vertex AI** for the model, **Firestore** for vector storage, and **Cloud Run** for everything else.

This post is a tour of what that looks like in production. It's not a "hello world" agent demo — it's the architecture we landed on after five issues, four Cloud Run services, and the one design choice that turned out to matter more than anything else: **retrieval as a pre-model step, not an ADK tool.**

## The stack, end to end

The whole system is five services on GCP. Three of them are new:

```
customer uploads PDF in dashboard
        │
        ▼
  apps/api (Express · Cloud Run)
        │   POST /v1/documents → signed URL
        ▼
  Google Cloud Storage
        │   gcs.finalized event
        ▼
apps/subscribers/doc-processor (Node · Cloud Run)
        │   parse → chunk → embed
        ▼
  Firestore  (logichat-apps/{appId}/chunks + KNN index)
        ▲
        │   vector search
        │
apps/api (gateway)
        │   POST /v1/agent-run, mints ID token
        ▼
apps/agent (Python · FastAPI + ADK + Vertex AI · Cloud Run)
        │   Agent (gemini-2.5-flash) via google-adk
        ▼
  apps/api → user
```

Two pieces are different from a textbook RAG stack:

1. The **gateway** (`apps/api`, Express) is a separate service that mints Cloud Run ID tokens to call the agent. The agent is not publicly reachable.
2. The **retrieval layer** sits *before* the ADK Runner, not inside it as an ADK tool.

Both are deliberate. Both are what this post is really about.

## Why ADK

We picked [Google's Agent Development Kit](https://github.com/google/adk-python) over LangGraph, CrewAI, and a hand-rolled loop for one reason: **the agent service runs entirely on GCP, and ADK is the only one of those that was built for Vertex AI from the ground up.** The Python SDK ships a `google.adk.agents.Agent` and a `google.adk.runners.InMemoryRunner` that route through `google-genai`, which already speaks Vertex AI when `GOOGLE_GENAI_USE_VERTEXAI=TRUE`. No LangChain adapter, no provider shim, no surprise model name drift between staging and prod.

Concretely, our `apps/agent` is a 53-line `pyproject.toml` Python 3.12 service:

```toml
[project]
name = "logichat-agent"
version = "0.1.0"
description = "LogiChat ADK agent service (Python) — Gemini 2.5 Flash via Vertex AI."
requires-python = ">=3.12"

dependencies = [
    "fastapi>=0.115",
    "pydantic>=2.7",
    "uvicorn>=0.30",
    # google-adk is the Agent Development Kit Python SDK. Pinned loosely
    # because ADK's API is still moving; follow-up issues will exercise
    # the real Runner (sessions / tools / streaming).
    "google-adk>=0.1.0",
    # google-genai comes with ADK, but we import google.genai.types
    # directly in the runner adapter, so declare it explicitly.
    "google-genai>=1.0",
    # google-cloud-firestore is the client we use for the per-app chunk
    # vector search. Required by retrieval.py — added in #106.
    "google-cloud-firestore>=2.20",
]
```

Five runtime deps. FastAPI for the HTTP surface, Pydantic for the wire contract, uvicorn for the Cloud Run entrypoint, `google-adk` for the agent, `google-genai` for the typed message parts, `google-cloud-firestore` for the KNN search. ADC works for all of it — no API keys anywhere.

## The agent service, top to bottom

`apps/agent` is split into four files, each with one job:

| File | Job |
| --- | --- |
| `src/agent/main.py` | uvicorn entrypoint; binds `$PORT` (Cloud Run injects) |
| `src/agent/agent_definition.py` | Builds the ADK `Agent` + `InMemoryRunner`, wraps in `RunnerProtocol` |
| `src/agent/retrieval.py` | Firestore `find_nearest` + `text-embedding-005` via Vertex AI |
| `src/agent/api/app.py` | FastAPI factory: `POST /run`, `GET /healthz` |

The `main.py` is six lines of orchestration:

```python
# apps/agent/src/agent/main.py
def main() -> None:
    runner = build_agent()           # builds the ADK-backed adapter
    app = create_app(runner=runner)  # wires the runner into FastAPI
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
```

`build_agent()` is where ADK gets wired up. Here's the whole thing:

```python
# apps/agent/src/agent/agent_definition.py
MODEL_ID = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = (
    "You are LogiChat's support assistant. Answer the user's question using "
    "ONLY the context retrieved from the company's knowledge base. If the "
    "retrieved context does not contain the answer, say you don't know and "
    "suggest the user rephrase or contact a human. Never invent facts, "
    "product names, or policies that are not present in the retrieved "
    "context. Each retrieved block is prefixed with an internal "
    "[doc:<id>] marker so you can tell sources apart while reasoning — "
    "these markers are for your own use only and must never appear "
    "anywhere in the text you show the user."
)

def build_agent() -> RunnerProtocol:
    _require_env("GOOGLE_GENAI_USE_VERTEXAI")  # TRUE → route via Vertex AI
    _require_env("GOOGLE_CLOUD_PROJECT")       # logichat-dev / logichat-prod
    _require_env("GOOGLE_CLOUD_LOCATION")      # us-central1

    # Inline import: lets the unit tests run without google-adk installed.
    from google.adk.agents import Agent
    from google.adk.runners import InMemoryRunner

    root_agent = Agent(
        name="logichat_faq_agent",
        model=MODEL_ID,
        instruction=SYSTEM_INSTRUCTION,
        # tools=[firestore_retrieval_tool]  ← intentionally NOT an ADK tool
    )
    runner = InMemoryRunner(agent=root_agent)
    return _AdkRunnerAdapter(runner)
```

The env vars are validated at startup so a misconfigured deploy fails the first request — not the first deploy. The model id is **pinned in code** so a stray env var override can't silently swap in a different family. The region and project still come from env so staging and prod can diverge without a rebuild.

## The `RunnerProtocol` seam

The `google.adk.runners.InMemoryRunner` exposes more surface than our HTTP layer needs — sessions, event streams, function calls. We wrap it in a protocol so the route handler is stable while the upstream SDK moves:

```python
# apps/agent/src/agent/api/dependencies.py
class RunnerProtocol(Protocol):
    async def run(
        self,
        *,
        app_id: str,
        session_id: str,
        question: str,
        config: dict[str, Any],
    ) -> RunnerResult: ...
```

`_AdkRunnerAdapter` implements that protocol and forwards to the real ADK runner. The HTTP layer only knows about `RunnerProtocol` — it never imports `google.adk`. The reason this matters: **the ADK Python SDK's API is still in motion.** Wrapping it lets us swap implementations later (sessions, eval harness, streaming) without touching `app.py`.

The adapter runs retrieval *before* the ADK Runner call. This is the design choice worth understanding.

## Retrieval as a pre-model step, not an ADK tool

This is the single most important architectural decision in the whole system, and it's the one most ADK tutorials get wrong.

The "obvious" pattern in ADK is to expose retrieval as a tool:

```python
# What we did NOT do.
firestore_retrieval_tool = FunctionTool(firestore_retrieval)

root_agent = Agent(
    name="logichat_faq_agent",
    model="gemini-2.5-flash",
    instruction=...,
    tools=[firestore_retrieval_tool],  # model invokes at its discretion
)
```

We evaluated this in issue #106 and rejected it. Two reasons:

1. **Threshold short-circuit.** When no chunk is close enough to the question, we want to skip the model call entirely and return `defaultAnswer`. ADK tools fire *inside* the model loop — by the time the tool runs, you've already paid the input-token cost. A tool-based design cannot enforce a "no useful context" short-circuit because the model has to decide to invoke the tool first.

2. **Cross-tenant safety.** `app_id` must never become a model-controlled argument. Exposing it as a tool input would let a crafted prompt pivot retrieval to another tenant's collection. We scope retrieval server-side from the trusted caller (`config` / `RunnerProtocol.run`'s `app_id`), not from the model.

So retrieval lives in the adapter, *before* the ADK runner is invoked:

```python
# apps/agent/src/agent/agent_definition.py
async def run(self, *, app_id, session_id, question, config):
    # 1. Retrieval — pre-model, NOT an ADK tool
    chunks = await self._retrieve(app_id=app_id, question=question)

    if not chunks:
        # No useful context → short-circuit to defaultAnswer.
        # Also covers the case where retrieval raised: _retrieve returns
        # an empty list and a flag on failure.
        return RunnerResult(answer=_default_answer(config), grounded=False, retrieval=[])

    # 2. Compose the grounded user message
    chunk_block = "\n\n".join(_format_chunk(c) for c in chunks)
    user_text = f"{chunk_block}\n\nUser question: {question.strip()}"

    # 3. Run the ADK flow against the grounded message
    runner = self._adk_runner
    user_id = app_id  # one ADK user per LogiChat app
    session = await runner.session_service.get_session(
        app_name=runner.app_name, user_id=user_id, session_id=session_id
    )
    if session is None:
        await runner.session_service.create_session(
            app_name=runner.app_name, user_id=user_id, session_id=session_id
        )

    message = types.Content(role="user", parts=[types.Part(text=user_text)])
    final_text = ""
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=message
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = "".join(part.text or "" for part in event.content.parts)

    return RunnerResult(
        answer=sanitize_answer(final_text),
        grounded=True,
        retrieval=[
            RetrievalHit(
                chunk_id=c.chunk_id, document_id=c.document_id, distance=c.distance
            )
            for c in chunks
        ],
    )
```

Three things worth pointing out:

- **`asyncio.to_thread`** wraps the sync `google-cloud-firestore` and `google-genai` calls so a slow Firestore round-trip doesn't block the uvicorn event loop. ADK itself is async-native; the retrieval layer is the only sync part of the request path.
- **Graceful degradation**: `_retrieve` swallows exceptions, logs a warning, returns `[]`. The request still succeeds via the ungrounded ADK flow. A transient Firestore outage degrades answer quality; it doesn't take the service down.
- **`RunnerResult` carries `grounded` + `retrieval`** alongside `answer`. The gateway logs retrieval metadata on the conversation doc so we can evaluate retrieval quality offline (issue #111). The original ADK Runner contract only returns text; we extended it through our adapter.

## The retrieval layer

`apps/agent/src/agent/retrieval.py` is small on purpose — it owns the two operations the adapter needs: embed the question, pull the most relevant chunks. Nothing else in the agent service touches Firestore or the embedding API directly.

```python
EMBEDDING_MODEL = "text-embedding-005"
EMBEDDING_DIMENSION = 768
DEFAULT_DISTANCE_THRESHOLD = 0.5  # COSINE: 0 = identical, 2 = opposite
DEFAULT_TOP_K = 5
```

The KNN search uses COSINE distance:

```python
# NB: neither symbol is re-exported from the package roots. Both
# raise ImportError against the real google-cloud-firestore 2.x
# install. Don't "fix" this to the package root — it'll silently
# fall through to the ungrounded fallback on every request.
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

The threshold is applied in Python, after KNN returns. The reason: `find_nearest` returns the nearest `limit` chunks by distance; the threshold is a separate concern (recall vs precision). Conflating them in the query means every app owner has to know the right top-k to balance both. Better to keep the parameters independent.

**Both write path and read path must agree on dimension.** The KNN index in `firestore.indexes.json` is built for 768 dimensions, flat index:

```json
{
  "collectionGroup": "chunks",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "embedding",
      "vectorConfig": {
        "dimension": 768,
        "flat": {}
      }
    }
  ]
}
```

Drift here is silent and catastrophic — a chunk embedded with a 1536-dim model stored against a 768-dim index either fails the write or, worse, produces results that look reasonable but are nonsense. We pin `EMBEDDING_MODEL` and `EMBEDDING_DIMENSION` as module constants and fail loud if the API returns the wrong shape:

```python
if len(values) != EMBEDDING_DIMENSION:
    raise RuntimeError(
        f"embedding model {EMBEDDING_MODEL} returned {len(values)} dims, "
        f"expected {EMBEDDING_DIMENSION}"
    )
```

## The doc-processor — where the chunks come from

The agent's job is to answer questions. The doc-processor's job is to make sure there *are* chunks to answer from.

`apps/subscribers/doc-processor` is a Cloud Run service subscribed to `google.cloud.storage.object.v1.finalized` events on the project bucket. Trigger filter is the path prefix `apps/{appId}/docs/{documentId}/{filename}` — anything outside that prefix is ignored silently. Why drive off the Storage event instead of a Firestore write? Because the API writes the `pending` doc *before* it returns the signed URL, so the metadata can lag the actual upload by seconds. Driving off Storage means we wait for the real bytes.

When the event fires:

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

**Chunker (`libs/server/ai/src/lib/chunker.utils.ts`).** 800-token chunks with 100-token overlap. Splits on paragraph boundaries first, falls back to sentence boundaries when a paragraph overflows, and applies overlap by prepending the tail of the previous chunk to the next. Pure function in `*.utils.ts` — no injected dependencies, no lifecycle, that's the repo convention.

**Parser.** Plain text, markdown, HTML, and PDF. The HTML parser uses cheerio and **strips `&lt;script&gt;`, `&lt;style&gt;`, `&lt;nav&gt;`, `&lt;header&gt;`, `&lt;footer&gt;`, `&lt;noscript&gt;` before extracting text** — this was an actual bug we shipped and caught when a customer's "About" page nav ended up dominating their retrieval index.

**Embeddings.** `text-embedding-005` via Vertex AI, batched in groups of 50 with two retries on 429/5xx. A single 50-page PDF can produce 200+ chunks; we don't want one HTTP call per chunk.

**Vector storage.** Each chunk goes into `logichat-apps/{appId}/chunks/{chunkId}` with `embedding` stored as `FieldValue.vector(...)` — **not a plain `number[]`**. Firestore's KNN index can only query fields written as `Vector` values; a plain number array is invisible to vector search and you'll get zero hits on every query with no error:

```typescript
// FieldValue.vector is the ONLY way the KNN index can see this field.
embedding: FieldValue.vector(vectors[j]),
```

We use the modern `@google-cloud/firestore` v7 client *only* for chunk writes, because `firebase-admin@^9` bundles v4 which doesn't have `FieldValue.vector`. Everything else stays on firebase-admin — they share ADC so it works, but the type definitions conflict and the build/src deep import dodges that.

## The prompt: grounded chunks with `[doc:<id>]` markers

Each retrieved chunk is prefixed with an internal `[doc:<id>]` marker:

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

## Cloud Run + service-to-service ID tokens

The gateway and the agent are two Cloud Run services. The gateway calls the agent with a Google-signed ID token:

```typescript
// libs/server/ai/src/lib/agent.service.ts
const { agentUrl } = getAgentConfig()
const client = isPlainHttpUrl(agentUrl)
  ? plainHttpClient
  : await authFactory().getIdTokenClient(agentUrl)

const response = await client.request({
  url: `${agentUrl}/run`,
  method: 'POST',
  data: { appId, sessionId, question, config },
})
```

The agent service is deployed with `--no-allow-unauthenticated`, so the only way to reach it is with a valid ID token minted by a service account in the same project. `google-auth-library`'s `GoogleAuth#getIdTokenClient(agentUrl)` handles token refresh and attaches `Authorization: Bearer ...` on every request, so we don't manage tokens ourselves.

The deploy target:

```bash
gcloud run deploy logichat-agent-run \
  --image us-central1-docker.pkg.dev/${PROJECT_ID}/logichat/agent \
  --region us-central1 \
  --platform managed \
  --no-allow-unauthenticated \
  --port 8080 \
  --service-account ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --update-env-vars \
    GOOGLE_GENAI_USE_VERTEXAI=TRUE,\
    GOOGLE_CLOUD_PROJECT=${PROJECT_ID},\
    GOOGLE_CLOUD_LOCATION=us-central1,\
    VERTEX_CHAT_MODEL=gemini-2.5-flash
```

One Cloud Run service, one service account (the default Compute Engine SA), three env vars that route through Vertex AI. The agent service account needs `roles/aiplatform.user` on the project — same binding covers chat and embeddings, no second role required.

## The fallback we kept

We deleted the prompt-builder that read `examples`. The dashboard pages for managing Q&A examples are gone. The new upload/list/delete dialog replaced them.

But the **collection is still there.** Every existing customer has `examples` docs they wrote over two years. Deleting those would have been a worse customer experience than the Q&A flow itself. So the fallback:

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

Document RAG is still the primary path. Examples are the fallback that runs only when retrieval returned nothing — no useful chunks, empty collection, or retrieval itself broke. A customer who uploaded docs gets doc-RAG answers (better recall, fresh as the doc). A customer who hasn't migrated yet still gets answers from their hand-curated examples. A customer who has neither gets `defaultAnswer`.

## What we'd do differently

A few things we got wrong the first time and would change on a green-field rebuild.

**The `firebase-admin` v4 / modern `firestore` v7 split is ugly.** Bumping `firebase-admin` to v13 is the right fix; it's a separate PR's worth of type churn. The `FieldValue.vector` workaround works but it makes the doc-processor code look weirder than it should.

**`find_nearest` symbol location.** `google.cloud.firestore.Vector` and `firestore_v1.DistanceMeasure` are NOT re-exported from the package roots. The first two ships of this module both degraded silently to the ungrounded fallback on every request because the imports raised `ImportError` and the except-clause swallowed it. Inline the comment that warns future readers — it's not obvious.

**Threshold and top-k should be data-driven, not env-driven.** `RETRIEVAL_DISTANCE_THRESHOLD` is fine for v1. The next step is per-app tuning from the dashboard — different customers have different "useful" thresholds, and 0.5 is a reasonable default, not the right answer for everyone. The KNN top-k belongs in the same config.

**Agent and gateway should share a runner.** Right now `apps/api` POSTs to `apps/agent` over Cloud Run service-to-service ID tokens. The round-trip is invisible to users but adds ~30–80ms of latency and one more thing that can fail. The long-term answer is inlining the ADK flow into the API service for the simple cases, or running both as one Cloud Run service with internal routing. We measured, decided the separation was worth the latency for now (independent deploys, simpler auth), and parked the unification.

## The numbers

The old prompt with 100 examples was 12–18K tokens per request, ~1.2s p50 latency, ~$0.003/request at GPT-4o-mini pricing. The new doc-RAG prompt is 1.5–3K tokens (system + 3–5 retrieved chunks + question), ~450ms p50, ~$0.0006/request. Recall on the customer's own docs is dramatically better because we're now searching their actual content instead of paraphrased Q&A. We didn't A/B this formally — the before/after is too entangled with model changes (we also moved off OpenAI to Vertex AI in the same window) — but the unit-economics improvement is 4–5× and the qualitative improvement on recall is the reason we did this in the first place.

The full set of changes is across these issues on the [logichat.io](https://logichat.io) project: the document pipeline (PR #113), the agent (issues #105–#107), the retrieval layer (#106), the dashboard UI (#110+), and the fallback spec (2026-07-12-qa-examples-fallback-design).

## TL;DR for someone building this on ADK today

1. **Pin your model id in code.** Don't let env vars silently swap model families.
2. **Do retrieval pre-model.** The "obvious" ADK-tool pattern breaks threshold short-circuit and exposes `app_id` to model-controlled arguments.
3. **Validate Vertex AI env vars at startup**, not on first request. `build_agent()` should fail fast on misconfiguration.
4. **Wrap the `InMemoryRunner` in your own protocol.** ADK's surface is bigger than your HTTP layer needs and the SDK is still moving.
5. **Use `FieldValue.vector`** for Firestore embeddings. Plain arrays are invisible to KNN.
6. **Dimension-pin everything.** Embedding model, KNN index, and your runtime check must all agree on `EMBEDDING_DIMENSION`.
7. **Run sync Firestore / genai calls in `asyncio.to_thread`.** Don't block the uvicorn event loop on a slow round-trip.
8. **Strip internal provenance markers in code**, not just in the prompt. Prompt rules leak; regexes don't.
9. **Keep an escape hatch for legacy data.** Customers will not thank you for deleting their work.