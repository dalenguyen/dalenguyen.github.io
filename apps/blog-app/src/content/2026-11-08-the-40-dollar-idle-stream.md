---
title: "The $40 Idle Stream"
slug: 2026-11-08-the-40-dollar-idle-stream
description: A Model Context Protocol server on Cloud Run quietly billed 1.64 million instance-seconds in a month while serving 22,000 requests. Finding the cause took an hour. Discovering that my fix had not caused the savings took two days longer.
categories: ['cloud-run', 'mcp', 'postmortem', 'cost']
coverImage: https://dalenguyen.me/assets/images/blog/the-40-dollar-idle-stream.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-11-08T10:00:00.000Z
author: Dale Nguyen
draft: false
---

A Model Context Protocol server on Cloud Run quietly billed 1.64 million
instance-seconds in a month while serving 22,000 requests. Finding the cause
took an hour. Discovering that my fix had not caused the savings took two days
longer.

The bill on `cantax-fyi` looked wrong. Two Cloud Run services, both
scale-to-zero, no minimum instances, no cron jobs, a database doing seventeen
thousand reads a month. Storage across the whole project was about a gigabyte.
Nothing in that shape should cost forty dollars.

Cloud Run bills in **instance-seconds**: the wall-clock time an instance spends
alive and assigned to your requests, multiplied by the CPU and memory you
reserved. For a 1 vCPU, 512 MiB container that works out to about `$0.0000253`
per second. It is a rounding error until something keeps an instance alive that
shouldn't be.

The first query split the bill by service and the answer arrived immediately.

| Service | Billable instance-seconds (30 d) | Requests |
| --- | --- | --- |
| `tax-mcp` | **1,557,164** | 22,513 |
| `can-tax-pro-web` | 4,889 | 21,272 |

The MCP server was 318 times more expensive than the web application, on
comparable request counts. Whatever was happening, it was not traffic volume.

## Sixty-nine seconds per request

Dividing told the story before any log did. 1,557,164 instance-seconds across
22,513 requests is **69 seconds of billed instance time for every request
received**. An MCP tool call should take tens of milliseconds. So the request
count and the billed time were describing different things, and the latency
distribution confirmed it:

| Percentile | Latency |
| --- | --- |
| p50 | 309.6 s |
| p95 | 323.4 s |
| p99 | 324.6 s |

The service's configured request timeout was **300 seconds**. A median sitting
just past the timeout means the typical request was not slow — it was being
**killed**.

Half of all requests ran to the timeout and died there. The logs separated
cleanly into two populations:

- `POST /mcp` — the actual tool calls. 30 to 200 milliseconds. Entirely healthy.
- `GET /mcp` — hundreds per day, every one of them exactly `301.002` seconds,
  status 200, user agent `claude-code`.

That `GET` is the server-sent events stream of the MCP streamable-HTTP
transport: the channel a server uses to push messages to a client without being
asked. The client opens it and holds it.

And this server has nothing to push. It was constructed like this:

```python
mcp = FastMCP(
    "can-tax-pro",
    stateless_http=True,
    json_response=True,
)
...
_mcp_app = mcp.streamable_http_app()
```

`stateless_http=True` means no session is retained between requests, so there is
no context a server-initiated message could belong to. `json_response=True`
means tool results come back in the POST response body. Every byte the client
needs already arrives over POST — yet `streamable_http_app()` still answers a
GET by opening a stream.

So the loop was: client opens the SSE stream. The stream carries nothing,
because in stateless mode it structurally cannot. Cloud Run cuts the request at
300 seconds. The client treats that as a dropped connection and immediately
reconnects. Repeat forever.

An instance is billed for the entire time it is handling a request, and an open
SSE stream is an open request. The arithmetic is exact:

> 86,400 seconds in a day ÷ 301 seconds per stream = **287 reconnects**. At 287
> reconnects a day, one instance never gets to shut down. One instance pinned
> around the clock costs **$2.18 a day**, or $65 a month — for a service doing
> nothing.

<div data-chart="idle-loop">Simulation: over 15 minutes, one client opens the GET stream three times. Each stream carries nothing and Cloud Run cuts it at 300 seconds, so the instance is billed for all 900 seconds while three tool calls do about half a second of real work. With the fix, each GET gets a 405 in about 3 ms and only the tool calls bill. Enable JavaScript to play it.</div>

On 20 September the logs show 285 long-held streams and the meter recorded
86,020 instance-seconds. The predicted number was 86,400. The idle stream was
not *part* of the bill; it *was* the bill.

## The fix

The MCP specification anticipates exactly this case: a server that does not
offer an SSE stream at its endpoint **must** return `405 Method Not Allowed`.
This server does not offer one in any meaningful sense, so it should say so
rather than opening a stream it can never use.

```python
class App:
    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        if scope["type"] == "http" and path == "/health":
            await _health(scope, receive, send)
        elif scope["type"] == "http" and path == "/.well-known/oauth-protected-resource":
            await _oauth_protected_resource(scope, receive, send)
        elif scope["type"] == "http" and scope.get("method") == "GET" \
                and path.rstrip("/") == "/mcp":
            # The stateless transport has no server-initiated messages to
            # send, so the SSE stream a GET opens here stays empty until
            # Cloud Run cuts the request at 300s — and every one of those
            # seconds is billed. The spec lets a server with no stream
            # to offer say 405.
            await JSONResponse({"error": "method_not_allowed"},
                               status_code=405)(scope, receive, send)
        else:
            await _mcp_app(scope, receive, send)
```

Eight lines, ahead of the transport. The POST path — which does all the real
work — is untouched.

Five tests cover it: the GET is rejected with and without a trailing slash,
`/health` and the OAuth discovery document still answer, and a POST still
reaches the transport rather than being swallowed by the new branch. Importing
the module behind patched Firebase credentials keeps them offline. Seventy-seven
tests pass. It shipped on 3 October at 01:37 UTC.

Then I checked the meter, saw three seconds in the last hour against a baseline
of roughly 2,160, and reported a 1,100-fold improvement.

## Part two: the number was right, the story was wrong

Two days later, looking at a daily time series for the first time rather than a
30-day total, the shape of the month appeared — and it did not match what I had
claimed.

<div data-chart="daily-series">Chart: billable instance-seconds per day for tax-mcp, Sep 1 – Oct 4. Most September days sit near 86,400 (one instance pinned 24/7); Sep 10–15 and Sep 17–18 were quiet at a few hundred. The series falls to 1,309 on Oct 1 and 53 on Oct 2 — before the fix shipped on Oct 3 (57) and Oct 4 (70). Enable JavaScript to compare the 30-day aggregate with the daily series.</div>

The cost collapsed on **1 October**. By 2 October the service was down to 53
instance-seconds a day — before my fix existed. I had shipped into a problem
that had already stopped happening, measured the aftermath, and credited myself
with it.

The log counts settle it beyond argument:

| Day | Streams > 100 s | `claude-code` GETs | Instance-seconds |
| --- | --- | --- | --- |
| Sep 28 | 1,000+ | — | 87,188 |
| Sep 29 | 1,000+ | 970 | 79,220 |
| Sep 30 | 506 | 506 | 62,737 |
| Oct 01 | 7 | 10 | 1,309 |
| Oct 02 | 0 | 0 | 53 |
| Oct 03 · fix | 0 | 0 | 57 |
| Oct 04 | 0 | 0 | 70 |

No deploy happened on 1 October — revision `00042`, from 21 September, was
serving traffic until the fix landed on the 3rd. The streams stopped
client-side, on their own.

The clients simply stopped opening the stream. Across 29 and 30 September the
GETs came from `claude-code/2.1.237` and `2.1.283`; from 2 October the only GETs
in the logs are scanner bots and my own `curl` checks. Whether that was a
client-side change in behaviour or just a change in how the service was being
used, the server was identical throughout.

### Why the aggregate hid it

My first query asked for one number over thirty days: `ALIGN_SUM` with a
2,592,000-second alignment period. That returns a single point. A single point
cannot show you that the behaviour it summarises stopped two days before you
looked.

And the month was never steady. Nine of September's thirty days were already
quiet — Sep 10 through 15 ran at a couple of hundred instance-seconds. The
monthly mean of 53,756 per day described no actual day: the real days were
either ~78,000 or ~850, depending on whether a session was connected. Averaging
across that bimodal distribution produced a baseline that existed nowhere, and I
then compared a post-fix reading against it.

> **The error, generalised.** A 30-day aggregate is a fine way to find a cost
> problem and a terrible way to prove you fixed one. It averages over any regime
> change inside the window — including one that happened while you were writing
> the patch. The daily series costs one extra query and is the *first* thing to
> plot, not the last.

The second mistake compounded the first: I verified at 01:40 on a Saturday, in a
window with no real traffic at all. Zero `claude-code` GETs in that hour is what
a working fix looks like, and it is also what an unused service looks like. I
could not distinguish them, and I reported the flattering reading as though I
could.

## Cost, before and after

1 vCPU + 512 MiB, at $0.0000253 per instance-second:

| Period | Instance-seconds | Per day | Cost |
| --- | --- | --- | --- |
| September, session days (21 d) | 1,633,929 | 77,806 | $1.96/day |
| September, quiet days (9 d) | 7,687 | 856 | $0.022/day |
| September, whole month | 1,641,616 | 53,756 | **$41.45** |
| Oct 2–4, after the cliff | 180 | 60 | $0.0015/day |
| Projected forward, 30 days | 1,800 | 60 | **$0.05** |

**$41.45 → about $0.05 a month**, a factor of roughly 830. The September invoice
still carries the full charge; the saving shows up in October.

<div data-chart="cost-calc">Calculator: every hour a client holds the stream open costs one hour of billed instance time, about $0.09. A client connected 21.5 hours a day costs about $59 a month; one that never disconnects, about $66. With the 405 fix, the bill stays at the floor of real tool calls, about $0.05 a month. Enable JavaScript to try it.</div>

The honest attribution: that drop is not mine. It happened on 1 October for
reasons on the client side. What the fix does is make the floor permanent — if
any client starts opening that stream again, it now gets a 405 in three
milliseconds instead of pinning an instance for five minutes. It is insurance
against a $65-a-month failure mode, bought for eight lines. That is worth
having. It is not a saving I can claim.

### The tradeoff nobody chose

There is a real regression hiding in the good news. The perpetual streams kept
an instance warm around the clock, so the first MCP call of any session was
instant. Now the service genuinely scales to zero, and cold starts are back:
three consecutive tool calls against the live server measured 2.3 s, 9.4 s, and
0.23 s. Mean container startup is about 7.1 seconds.

That latency was always being paid for — at $65 a month, through a bug, without
anyone deciding to buy it. If it becomes annoying the answer is to cut Python
startup time, where `firebase_admin` initialisation and tool-module imports run
at module scope. The answer is *not* `min-instances=1`, which would restore the
warmth and the entire original bill.

## What I'd take from this

- **Divide the bill by the request count.** Sixty-nine seconds per request
  pointed at the mechanism before a single log line was read. Cost per unit of
  work is the fastest diagnostic in a metered system.
- **A median past the timeout means killed, not slow.** p50 of 309.6 s against a
  300 s limit is not a performance problem to tune; it is a structural one.
- **Plot the daily series before attributing anything.** One extra query would
  have shown me the cliff on day one and saved me from a claim I had to retract.
- **Verify with real traffic, not a convenient window.** A quiet Saturday night
  cannot distinguish a working fix from an idle service.
- **Separate "the mechanism was real" from "my patch fixed it."** Both can be
  true independently, and here only the first one was.

The bug was real, the diagnosis was correct, and the patch is right on the
merits. I just also need to say that the graph went down on its own, two days
early, and I took the credit for it before checking.

---

Cloud Run · Python MCP server · `cantax-fyi`, us-central1. Figures from Cloud
Monitoring (`run.googleapis.com/container/billable_instance_time`,
`request_latencies`) and Cloud Logging, 31 Aug – 4 Oct 2026. Pricing is
us-central1 list rate for request-based billing.
