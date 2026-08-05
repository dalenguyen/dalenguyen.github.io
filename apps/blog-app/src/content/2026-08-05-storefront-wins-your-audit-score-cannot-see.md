---
title: "The Storefront Wins Your Audit Score Can't See"
slug: 2026-08-05-storefront-wins-your-audit-score-cannot-see
description: An ecommerce site can score 100 on SEO and accessibility, report a sub-second LCP, and still waste hundreds of kilobytes on every visit and compete with itself in search. Here's where the biggest wins actually hide — in the headers, status codes, and platform defaults nobody grades.
categories: ['web-performance', 'seo', 'ecommerce', 'frontend', 'core-web-vitals']
coverImage: https://dalenguyen.me/assets/images/blog/2026-08-05-storefront-wins-your-audit-score-cannot-see.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-08-05T09:00:00.000Z
author: Dale Nguyen
draft: false
---

*A general engineering note on why an ecommerce site can score 100 on SEO and accessibility, report a sub-second LCP, and still waste hundreds of kilobytes on every visit and compete with itself in search. Examples are generic — adapt them to your stack.*

## TL;DR

Page-score audits grade **the rendered page, on one URL, over a fast link**. The largest and cheapest ecommerce wins live in three places those audits barely look:

1. **Response headers** — compression and caching. Not part of the SEO or best-practices score; at most a soft "insight" you have to go read.
2. **Status codes across the URL space** — soft 404s and facet duplication. An audit only loads the URLs you hand it, and a wrong-but-200 response looks identical to success.
3. **Defaults you never chose** — an object store's cache policy, an SSR runtime's lack of compression, an SDK that eagerly loads a third-party script.

Verify on the wire (`curl -I`, explicitly negotiating encoding), not by score. And when a fix lives in the write path, **everything already written keeps the old behavior until you backfill** — the backfill is part of the fix, not a follow-up.

## What it is

A storefront that looks healthy by every dashboard it has, while leaking on every request. The blind spots are systematic, not random:

| Blind spot | Why the score stays green |
|---|---|
| No `Content-Encoding` (nothing compressed) | Not an SEO/best-practices audit at all — surfaces only as "wasted bytes" inside a trace insight |
| No `Cache-Control` on fingerprinted assets | Same: an insight, not a scored failure. `ETag` alone still costs a round trip per asset per visit |
| Catalog images uncacheable | Served from a different origin; not graded as your page's problem |
| Missing `rel=canonical` | Reported **"not applicable"** rather than failed — absence is silence, not a penalty |
| Facet URLs duplicating a listing | The audit never requested `?color=red&sort=price` |
| Soft 404 (200 + empty app shell) | The audit only loads URLs you give it, and this one returned 200 |
| Flattering lab timings | Measured unthrottled on a local link; a new site has no field data to contradict it |
| Third-party SDK on every page | Shows up as a vague cookie/best-practices ding, never naming the cause |

Step through those blind spots below. The green score on the left never moves — only the probe on the wire changes:

<div data-chart="blind-spots">Interactive stepper: for each audit blind spot, what the score grades vs. what a probe on the wire actually finds, and why the score stays green. Enable JavaScript to view.</div>

## Why it happens (root cause)

An audit is a **single rendered DOM plus a fast page load**. Ecommerce cost is mostly *not* in the DOM:

```text
             what a page audit actually grades
        ┌──────────────────────────────────────┐
        │  DOM · a11y tree · meta tags         │
        │  one URL · unthrottled network       │
        └──────────────────────────────────────┘

             where the money actually is
   Content-Encoding ·  Cache-Control  ·  HTTP status codes
   the other 10,000 catalog URLs  ·  SDK network defaults
   repeat-visit behavior  ·  the write path for existing data
```

Three structural reasons the gap persists:

- **Transport is invisible to a renderer.** A 500 KB bundle and a 130 KB bundle produce the *identical* DOM. Only the bytes differ, and only under a real network does that become time.
- **A catalog is a URL space, not a page.** Facets, sorts, and pagination multiply one template into thousands of near-duplicate URLs. Sampling one of them tells you nothing about the other 9,999.
- **Defaults are invisible because nobody wrote them.** You grep for the bug and find nothing, because the expensive decision was made by a platform default you never typed.

## Symptoms (generic examples)

- A storefront's client bundle goes out at **~500 KB uncompressed**; brotli would make it **~130 KB**. Nothing in the app is misconfigured — the SSR runtime just ships static files as-is and there's no CDN in front of it.
- Product photos in a managed object store can ship with a weak default — say `private, max-age=0`, or no `Cache-Control` at all (exact value varies by provider). A 40-thumbnail category page then **refetches every image on every visit**, and no edge can hold any of them.
- Fingerprinted asset URLs (content-hashed, never rewritten) carry only `ETag` and `Last-Modified`, so a repeat visitor still pays a revalidation round trip per file.
- `/shoes?color=red&sort=price` returns 200 with the **same `&lt;title&gt;`** as `/shoes`, and no canonical — so every facet combination is a crawlable near-duplicate competing with the listing it came from.
- `/robots-old.txt`, `/anything`, `/a/b/c` all return **200 with the empty app shell**. Crawlers spend budget on them and may index them as homepage duplicates.
- A reusable product-card component hardcodes `loading="lazy"`, including on the card that **is** the largest contentful element — so the hero image isn't even discovered until layout runs.
- An auth SDK's default popup/redirect resolver pulls a third-party script and sets third-party cookies **on every page**, for visitors who never sign in.

That first bullet — the compression gap on a single bundle — is the biggest cheap win, and the one no page score reports:

<div data-chart="compression">Chart: transfer size of a 500 KB JS bundle uncompressed vs. gzip vs. brotli. Enable JavaScript to view.</div>

## A real snapshot: green where it's easy, slow where it sells

None of this is hypothetical. Here is the same battery of checks run against a live storefront — [Ruby Rose Bloom](https://rubyrosebloom.com), an Angular/AnalogJS app SSR'd on a managed Google runtime — captured with PageSpeed Insights and `curl` on the same afternoon. Two pages went under the lens: the [home page](https://rubyrosebloom.com) and a representative [product page](https://rubyrosebloom.com/products/vintage-takahashi-san-francisco-city-cat-mug). The scores look great, until you put the **product** page next to the **home** page, and mobile next to desktop:

| | Home · mobile | Home · desktop | Product · mobile | Product · desktop |
|---|---|---|---|---|
| Performance | 93 | 100 | **76** | 98 |
| Accessibility | 100 | 100 | 100 | 100 |
| Best Practices | 100 | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 | 100 |
| LCP | 2.9 s | 0.6 s | **5.9 s** | 1.1 s |

Same product URL: **98 on desktop, 76 on mobile** — a 22-point swing that lives entirely in the throttling. Neither page has field (CrUX) data yet, so nothing from real users contradicts the flattering desktop number. Lesson #4, in the wild.

Toggle between the score and the LCP that drives it — the gap is the whole point:

<div data-chart="snapshot">Chart: Lighthouse Performance score and LCP for the home and product pages, mobile vs. desktop. Enable JavaScript to view.</div>

The wire shows where the mobile time goes — and, just as usefully, where it *doesn't*. Almost everything the audit *would* grade is already handled:

```bash
# Static bundle: already doing everything right.
$ curl -sSI -H 'Accept-Encoding: br' https://rubyrosebloom.com/assets/index-*.js
content-encoding: br
cache-control: public, max-age=31536000, immutable      # 128 KB, brotli, immutable ✓

# Catalog images (Firebase Storage): write-path fix + backfill already shipped.
$ curl -sSI 'https://firebasestorage.googleapis.com/…/photo-1_1600.webp'
cache-control: public, max-age=31536000, immutable      # ✓

# SSR HTML, though, ships raw — identical bytes with or without br:
$ curl -sS -H 'Accept-Encoding: br, gzip' https://rubyrosebloom.com/products/… | wc -c
16427
$ curl -sS -H 'Accept-Encoding: identity'  https://rubyrosebloom.com/products/… | wc -c
16427                                                   # no content-encoding at all
```

And the LCP element is already prioritized — this is *not* the blanket-lazy-load anti-pattern:

```html
<img fetchpriority="high" src="…/photo-1_1600.webp" ...>   <!-- eager, high priority ✓ -->
```

So what is left on a page scoring 76/100 on mobile? Precisely the two costs a page score can't see:

- The hero is a **1600 px, ~143 KB webp** handed to a ~400 px mobile viewport with no responsive `srcset`, fetched from a **cross-origin** image bucket that pays its own DNS and TLS. Prioritized and cached — and still the heaviest single byte on a throttled-4G LCP path.
- The **HTML document is uncompressed**. Tiny in absolute terms (~16 KB → ~5 KB with brotli) and, exactly as the essay warns, an order of magnitude below the static win — which is why it never becomes a scored failure, only a diagnostic you have to go read.

Green on every surface that is easy to grade; the real mobile cost sits in a cross-origin hero image and a raw document — visible only when you throttle on purpose and read the wire.

## Lessons learned

1. **Grade the transport, not the page.** One `curl -I` answers questions no score will. Check `Content-Encoding`, `Cache-Control`, and the status code before you read any number out of a lab tool.
2. **"Not applicable" is not a pass.** Audits distinguish *failed* from *didn't run*, and the second is rendered as silence. A missing canonical, a missing structured-data block, a missing header — all score as nothing at all. Read the list of audits that didn't apply; that's your backlog.
3. **A green score is a lower bound on your problems, never an upper bound.** It means "nothing I checked was broken," which is a much weaker claim than it looks.
4. **Lab timings flatter you, and they flatter you most when you have no field data.** An unthrottled local trace on a fast machine is close to a best case. Throttle deliberately, or treat the number as unusable — a brand-new site has no real-user data precisely when you're deciding what to fix.
5. **The most expensive line of code is one you never wrote.** Enumerate the defaults on every boundary: object-store cache policy, SSR compression, CDN presence, SDK eager initialization, framework catch-all routing. Each is a decision someone made for you, optimized for their generality, not your bill.
6. **A write-path fix does not fix what's already written.** Setting the right metadata on upload helps *future* uploads only. If ~1,000 objects already exist, the change isn't done until they're backfilled — and the backfill needs a dry run, idempotency, and a verification pass against the live URL.
7. **Catalogs multiply URLs, so canonicalize by default.** Any listing that takes facets needs a canonical that strips the query string. Do it once at the layout level rather than per page, so a new route can't forget.
8. **Unmatched paths must fail loudly.** SPA and SSR catch-alls answer 200 with a shell unless told otherwise. That's the single easiest way to bleed crawl budget, and status-code-only monitoring won't see it.
9. **Lazy-load everything except the element that is the LCP.** Blanket `loading="lazy"` inside a shared card component is an anti-pattern; make priority a parameter and set it on the first row.
10. **Don't invent structured-data fields to satisfy a validator.** A rich-results checker will happily tell you `review` and `aggregateRating` are missing. Fabricating them violates search-engine policy. Fill the fields you legitimately have — brand/identifier, shipping, return policy — and leave the rest absent.
11. **"Not indexed" and "not indexable" are different diagnoses.** An empty search console on a new property means *no data yet*, not *something is blocking you*. Use the live-inspection tool, which works with zero history, before hunting for a technical block.

## Solutions / patterns

### 1. Probe the wire before you theorize

Compression must be **negotiated**, so ask for it explicitly:

```bash
# Does it compress? (must send the header — see pitfalls)
curl -sSI -H 'Accept-Encoding: br, gzip' https://example.test/assets/app.js \
  | grep -iE 'content-encoding|content-length|cache-control'

# What would compression buy? Compare against the raw bytes.
curl -sS https://example.test/assets/app.js -o /tmp/a.js
wc -c < /tmp/a.js; brotli -q 11 -c /tmp/a.js | wc -c

# Do unknown paths actually fail?
for p in /nope /a/b/c /old.txt; do
  curl -sS -o /dev/null -w "$p -> %{http_code}\n" "https://example.test$p"
done
```

### 2. Budget the byte path

Pre-compress static output at build time and mark fingerprinted URLs immutable:

```js
// build/server config
compressStaticAssets: { brotli: true, gzip: true },
routeRules: {
  // content-hashed filenames never change contents → hold them forever
  '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
}
```

Dynamic HTML is a separate problem: many SSR runtimes don't compress responses at all, so that usually means putting a CDN in front rather than a config flag. Size the win first — it's often an order of magnitude smaller than the static win.

### 3. Set data-layer cache headers at write time, then backfill

The object store's default is `private, max-age=0`: every visit re-downloads every image, and no edge can hold any of them. Drag the visit count and watch what that default costs a returning shopper against an `immutable` policy:

<div data-chart="cache-cost">Interactive calculator: bytes re-downloaded across repeat visits under a private, max-age=0 default vs. an immutable cache policy. Enable JavaScript to view.</div>

```js
// write path: every new object gets the policy
await store.upload(path, bytes, {
  contentType: 'image/webp',
  cacheControl: 'public, max-age=31536000, immutable',  // default would be private, max-age=0
});
```

```js
// one-off backfill for what already exists — dry-run first, idempotent, re-runnable
for (const obj of await store.list({ prefix: 'products/' })) {
  if (obj.cacheControl === POLICY) { skipped++; continue; }
  if (!dryRun) await obj.setMetadata({ cacheControl: POLICY });   // metadata only: bytes and URLs unchanged
  updated++;
}
log(`${total} objects — ${updated} updated, ${skipped} already correct`);
```

Then verify **on the live URL**, not in the script's own output, and re-run to confirm it reports zero changes.

One caveat that makes `immutable` safe: it only belongs on URLs that change when the bytes change. Fingerprinted asset filenames get this for free; for catalog media, put the version in the path (`…/photo-1_v2.webp`, or a content hash) so a re-upload is a *new* URL. If you overwrite an image at the same path, `immutable` will happily serve the stale bytes for a year — there use a shorter `max-age` with revalidation instead.

### 4. Canonicalize once, centrally — and suppress it on error pages

```js
// in the root layout, server-side only (crawlers read the served HTML)
if (isServer) {
  const path = request.url.split(/[?#]/)[0];       // drop facets, sorts, tracking params
  addLink({ rel: 'canonical', href: SITE_ORIGIN + normalizeTrailingSlash(path) });
}
```

A page you're returning as 404 or `noindex` must **not** carry a self-canonical — that tells a crawler "this is the authoritative version of a page that doesn't exist." If canonicals are emitted centrally, error routes have to remove theirs.

### 5. Give the catch-all a real status code

```js
// wildcard route
meta: [{ name: 'robots', content: 'noindex' }],
onRender() {
  if (serverResponse) serverResponse.statusCode = 404;
}
```

### 6. Make LCP priority a parameter, not a constant

```html
<!-- shared card: caller decides, default stays lazy -->
<img [loading]="priority ? 'eager' : 'lazy'"
     [fetchpriority]="priority ? 'high' : null" ...>
```

```html
<!-- grid: only the first row is above the fold -->
<card *for="item, i of items" [priority]="i < 4" />
```

### 7. Defer third-party SDK side effects to the interaction that needs them

Many SDKs do expensive setup at handle-creation time because the default constructor wires in every optional capability. Construct explicitly, then pass the capability at the call site:

```js
// eager: pulls a third-party script + cookies on every page load
const client = createClient(app);

// lazy: nothing third-party until someone actually initiates the flow
const client = createClientWithout(app, { optionalResolvers: false });
async function onSignInClick() {
  return startPopupFlow(client, provider, popupResolver);  // capability passed here
}
```

Keep that import **static**. A dynamic import inside a click handler spends the browser's user-gesture window on a network fetch and gets the popup blocked — trading one bug for another.

## Pitfalls / false signals

1. **`curl -I` without `Accept-Encoding` proves nothing about compression.** Many clients omit it by default, the server answers uncompressed, and you conclude compression is broken. Send the header explicitly, then send `Accept-Encoding: identity` to confirm negotiation works both ways.
2. **An unthrottled lab run is a best case, not a measurement.** Sub-second LCP on a local connection is entirely compatible with a half-megabyte bundle that takes seconds on real mobile.
3. **A 200 is not success.** A soft 404 returns 200 with your shell. Any check that only looks at status codes will pass it — assert on the title or a body marker too.
4. **Dev and staging can't reproduce header behavior.** Without the production CDN, server, and object store, `Cache-Control` and `Content-Encoding` differ. Verify against a production-like build, and prefer the live origin.
5. **Fixing the write path feels like finishing.** The code review looks complete, tests pass, and every existing row still has the old value. Ask "what does this change do to data that already exists?" before calling it done.
6. **A validator's "missing optional field" is not a to-do list.** Some of those fields you must not fabricate.
7. **An empty analytics console invites a phantom diagnosis.** Zero impressions on a new property looks like a catastrophic technical block; usually it means the sitemap was never submitted and nothing has been crawled yet. Confirm indexability with a live fetch before "fixing" anything.

## Quick checklist

- [ ] `curl -I` with **and** without `Accept-Encoding` — is anything compressed?
- [ ] Measured raw vs. brotli size for the largest script and stylesheet.
- [ ] Fingerprinted assets carry `Cache-Control: immutable`, not just `ETag`.
- [ ] Catalog images/media have a public, long `Cache-Control` — checked on the live URL, not just in the upload code.
- [ ] Existing objects/rows **backfilled**, verified live, and the job is idempotent.
- [ ] Every route emits a canonical; facet/sort/tracking params stripped.
- [ ] Error and `noindex` pages emit **no** self-canonical.
- [ ] Unmatched paths return a real 404 (checked with a nonsense URL, body *and* status).
- [ ] The LCP element is not lazy-loaded; the first row opts into priority.
- [ ] Listed the audits that reported "not applicable" and triaged them.
- [ ] Lab numbers re-taken with throttling before anyone celebrates.
- [ ] Enumerated third-party requests on a page an anonymous visitor sees.
- [ ] Structured data fills only fields you can honestly populate.

## One-line summary

> A perfect audit score means nothing you were graded on was broken — and the biggest storefront wins are in the headers, status codes, and platform defaults nobody grades, plus the data you already wrote before you fixed the write path.
