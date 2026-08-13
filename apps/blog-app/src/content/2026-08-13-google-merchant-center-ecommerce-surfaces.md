---
title: "Rich Results, Shopping, and AI Mode: What Google Merchant Center Actually Gets You"
slug: 2026-08-13-google-merchant-center-ecommerce-surfaces
description: Which Google surfaces a product feed actually reaches — organic rich results, the Shopping tab, AI Mode — and the report I should have opened first, which said 5 of my 436 pages were indexed.
categories: ['seo', 'ecommerce', 'google-merchant-center', 'google-search']
coverImage: https://dalenguyen.me/assets/images/blog/2026-08-13-google-merchant-center-ecommerce-surfaces.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-08-13T10:00:00.000Z
author: Dale Nguyen
draft: false
---

[Ruby Rose Bloom](https://rubyrosebloom.com) sells one-of-a-kind vintage — a self-hosted storefront, no Shopify, no marketplace underneath it. Search Console's "Merchant opportunities" report told me 3 active products weren't showing up on the Shopping tab, and I went looking for the setting to fix. There wasn't one. What I actually found, three days of digging later, is that "get into Merchant Center" is not one thing — it's several different surfaces, each fed by a different mechanism, and the one everyone talks about (the Shopping tab) turned out to be the least interesting of them.

This post is the question I actually had, answered with screenshots taken today: **I have a storefront. What does getting into Merchant Center buy me, and where do my products actually end up?**

It also has an ending I didn't plan. After three days of feed fields and structured data I opened one Search Console report I'd been ignoring and found that Google had indexed **5 of my 436 pages**. That section is the most useful thing here, and it's the part I'd read first if I were you.

## What Merchant Center actually is

Before the surfaces: Merchant Center is not an ads product by default. There are two lanes.

**Free listings** are unpaid — you register a feed, Google reviews the items, approved items become eligible to appear in Shopping-related placements at no cost per click. This is the lane a small shop should care about first, because it costs nothing beyond the engineering time to feed it correctly.

**Shopping ads** are the paid lane on top — you attach a budget and the same feed becomes the input to a campaign. Ruby Rose Bloom is running free listings only; there is no ad spend anywhere in this post.

<figure>
  <img src="assets/images/blog/2026-08-13-merchant-center-free-listings.png" alt="Merchant Center products list filtered to Free listings, showing approved items, a Click potential column reading 'Available soon', and 0 clicks so far" width="100%" height="auto" />
  <figcaption>Free listings in Merchant Center: approved items, no ad spend, click potential still "available soon" on a three-day-old account.</figcaption>
</figure>

Free listings is the whole story for this shop. Worth saying plainly since most "how to get on Google Shopping" content assumes you're buying ads: you don't have to.

## The surfaces, one by one

"Merchant Center" isn't a single destination. Registering a feed there feeds several different Google surfaces, and each one is driven by a different mechanism. Conflating them is the easiest way to misdiagnose why a product isn't showing up somewhere.

### Organic Search: JSON-LD earns this one, no Merchant Center required

This is the surface that surprised me, because it doesn't need Merchant Center at all. A plain `site:rubyrosebloom.com arcopal teacup` search — ordinary blue-link Google, not the Shopping tab — returns the product page with **price and "In stock" rendered directly in the snippet**, plus a breadcrumb trail (`Shop › drinkware`).

<figure>
  <img src="assets/images/blog/2026-08-13-google-search-product-rich-results.png" alt="Google organic search result for a site:rubyrosebloom.com query showing price and In stock rendered directly in the snippet, plus breadcrumb navigation" width="100%" height="auto" />
  <figcaption>Organic Search, not Shopping: price and availability rendered straight from the page's own Product JSON-LD.</figcaption>
</figure>

That's the Product JSON-LD already on every product page — the same `price`, `availability`, `itemCondition`, `shippingDetails`, `hasMerchantReturnPolicy` block I assumed, at the start of all this, must be broken because the Shopping tab report was complaining. It isn't broken. It's driving a different surface, and it was doing that before the Merchant Center account existed at all. The distinction worth keeping straight: **Product JSON-LD on the page can earn rich results in ordinary Search. Merchant Center product data can earn free listings across Shopping, Search, and Google's AI surfaces.** Two overlapping paths, not two sealed lanes — they feed some of the same places, and either one buys you *eligibility*, never display. The Search Console report that started this whole investigation was only ever describing the first of them.

### Shopping tab and the Shopping Graph: what the feed is for

This is the surface the feed exists to reach — the Shopping tab, and the broader Shopping Graph that other Google surfaces draw from. It's also the surface with the sharpest gap between "submitted" and "found," which the next section covers.

### AI Mode and agentic answers: the same fields, quoted back

This is the surface I didn't expect to have anything to say about, and it turned out to be the most important one.

I asked Google's **AI Mode** *"where can I buy a vintage Arcopal France milk glass teacup set in Canada"* — a generic query, not naming the shop. The answer is a short written recommendation plus a product-card rail on the right: **Etsy Canada, eBay Canada, and Poshmark Canada.** Ruby Rose Bloom, which stocks exactly this kind of item, is absent.

<figure>
  <img src="assets/images/blog/2026-08-13-google-ai-mode-shopping-answer.png" alt="Google AI Mode answer to a query about buying a vintage Arcopal France milk glass teacup set in Canada, recommending Etsy Canada, eBay Canada, and Poshmark Canada with a product card rail" width="100%" height="auto" />
  <figcaption>AI Mode's answer to a generic "where can I buy" query: Etsy, eBay, Poshmark. Not the shop.</figcaption>
</figure>

Then I asked about a specific item the shop actually has listed: *"Paragon Warranted Teacup and Saucer Golden Leaves on Green Celadon 1950s for sale."* AI Mode returned "Current Marketplace Listings" citing Etsy sellers, complete with **price ($75.65, struck through from $89), condition ("very good vintage condition, no chips, cracks, or crazing"), and availability.** The shop's own Paragon listing — CA$144, approved in Merchant Center as of today — was not among the citations.

<figure>
  <img src="assets/images/blog/2026-08-13-google-ai-mode-product-citations.png" alt="Google AI Mode citing current marketplace listings for a specific Paragon teacup and saucer, including price, struck-through original price, and condition detail, sourced from Etsy" width="100%" height="auto" />
  <figcaption>AI Mode citing a competing Etsy listing by price, discount, and condition — the exact fields a product feed standardises.</figcaption>
</figure>

Here's the part worth sitting with. Look at what AI Mode actually quoted back in both cases: price, a discount, condition, availability. Those aren't paragraph-summary impressions pulled from prose — they're discrete, checkable values. **The facts an AI answer reaches for are the same facts a product feed forces you to state exactly: one price, one condition, one availability, identical everywhere they appear.** A shop whose numbers are unambiguous is a shop an answer can lift a fact from without hedging.

But I want to be precise about what this evidence does and doesn't show, because it's thinner than it looks. Google documents no Merchant Center requirement for AI Mode at all — AI Mode cites ordinary web pages routinely, and a shop with no feed is not locked out of being quoted. So this is an observation about *shape*, not a mechanism I can point to in anyone's documentation: the facts those answers reached for were structured facts, and a feed is the artifact that forces you to state them precisely and identically everywhere. Not free, either — a feed is a second place your prices and availability have to stay true, and every consistency contract you sign is one you can breach. Cheap relative to what it buys, is the most I'd claim.

What it isn't is evidence that the feed gets you cited. I have zero AI Mode citations for Ruby Rose Bloom and no timeline on which I expect that to change. Etsy and eBay are winning these answers today on depth, account age, and inventory density that a three-day-old account with 431 items doesn't have, and no amount of clean markup substitutes for that. Whether the work pays off here is an open question I can only answer by watching.

## Approved isn't visible yet

Before the "does it work" question, one honest gap. A Shopping tab search for the exact product title — `"Vintage Arcopal France milk glass teacup set of 3"` — returns Etsy, eBay, and Poshmark listings, not Ruby Rose Bloom's, despite that exact item being **approved** in Merchant Center. A bare `rubyrosebloom` Shopping query returns rose bushes from Home Depot and offers "Did you mean: ruby rose bloom."

Approval is permission to compete for placement, not placement itself. I originally wrote that the lag was "plausibly indexing time, plausibly a cold-start ranking penalty, probably both," and left it there. That was the lazy version. When I went back and actually opened the rest of Search Console, the answer was sitting in the Pages report.

## The real bottleneck was indexing, and it wasn't subtle

**Five pages indexed. Four hundred and thirty-six submitted.**

<figure>
  <img src="assets/images/blog/2026-08-13-search-console-page-indexing.png" alt="Google Search Console Page indexing report showing 5 indexed pages and 60 not indexed, with two reasons listed" width="100%" height="auto" />
  <figcaption>The number that explains everything else: 5 indexed, 60 not. No amount of Merchant Center approval competes with a page Google hasn't indexed.</figcaption>
</figure>

Fifty-nine product pages sat in **"Discovered – currently not indexed"** — Google knew the URLs existed and had decided they weren't worth fetching. One click and three impressions in the performance report is exactly what five indexed pages earns you.

Everything else in Search Console was clean, which is what made this easy to miss: no manual actions, no security issues, HTTPS fine, breadcrumbs valid, sitemap read successfully with all 436 URLs, every product page returning 200 with real server-rendered HTML, a canonical, and complete Product JSON-LD. Every report I'd been checking was green. The one I hadn't opened said the site was effectively invisible.

The cause turned out to be crawl shape, and I found it by curling my own shop page:

```
$ curl -s https://rubyrosebloom.com/shop | grep -oE 'href="/products/[a-z0-9-]+"' | sort -u | wc -l
24
$ curl -s https://rubyrosebloom.com/shop | grep -oE 'href="/shop\?[^"]*"'
href="/shop?before=1786502561613"
```

Twenty-four products, and exactly one way forward: a cursor. I wrote a script to walk the chain. **Eighteen sequential hops to reach all 431 products.** Two things wrong with that, and the second is worse than the first:

1. **Depth.** Products on hop fifteen are invisible in practice to a crawler budgeting a new, low-authority domain.
2. **Instability.** That cursor is an epoch-millisecond timestamp. Sell one item, add one item, and every downstream cursor URL changes. Googlebot doesn't recrawl a stable page 12 — it discovers a brand new URL, forever. That is how a site manufactures its own "Discovered – currently not indexed" pile.

The fix was three server-rendered routes — `/shop/page/:page`, `/shop/:category`, and `/shop/:category/page/:page` — replacing the opaque cursor with offset paging, plus a category nav and a full pager of plain `<a href>` links. The interactive infinite scroll still uses the cursor; the crawler now has stable paths beside it. Categories had been query parameters only (`/shop?category=drinkware` was a 200, `/shop/drinkware` a 404), so they became real paths too.

Measured against the deployed site, breadth-first, following only server-rendered anchors:

| | before | after |
| --- | --- | --- |
| listing links on `/shop` | 1 | 27 |
| **deepest product from `/shop`** | **18 hops** | **2 hops** |
| products reachable | 431 | 431 |
| URLs in `sitemap.xml` | 435 | 475 |

One detail that matters more than it looks: unknown categories and out-of-range pages now return a genuine **404 with `noindex`**, not an empty grid with a 200. A soft 404 is a page Google keeps in its "discovered" pile indefinitely, which is precisely the pit I was trying to climb out of.

There's a cost, and it's fair to name it: offset paging bills a database read per skipped document, so `/shop/page/18` costs roughly 408 reads where the cursor cost 24. That is the price of a URL that means the same thing tomorrow. For this catalogue it's worth paying. At ten thousand products it wouldn't be, and I'd be looking at keyset pagination on a stable sort key instead.

If you take one thing from this post, take this: **I spent three days on structured data and feed fields while the actual problem was that Google had indexed five pages.** The feed work was not wasted — it's a prerequisite, and the disapproval count stayed at zero because of it — but I was optimising the quality of a signal that almost nothing could see. Open the Pages report first.

## What it takes to get in

The mechanics, once you know which surface you're aiming at. Two blockers turned out to matter more than the field-level detail: no policy pages, and no way for structured data to say "there will never be an identifier for this."

**Policy pages, first.** Merchant Center requires a shopper to reach a returns policy and a clearly available way to contact the shop. What it asks for is contact information that's clear and consistent wherever it appears; a form is one accepted way to provide it, and so are an address, a phone number, or a social profile. Ruby Rose Bloom offered none of them. This is a top rejection cause and it's a code fix, not a console setting: `/returns` (shipping, final sale, damaged-in-transit) and `/contact`. This shop went with a form — honeypot, server-side validation, transactional email with `Reply-To` set to the visitor — because I didn't want a mailbox sitting in crawlable HTML, but a published address would have cleared the policy just as well. Both pages linked from the footer on every page and listed in `sitemap.xml`. The feed genuinely could not ship before these did — its own field choices (the shipping rate it advertises) depend on `/returns` existing and agreeing with checkout.

**The feed, second**, at `/feed/google-merchant.xml` — the whole live catalogue as RSS 2.0, built by a pure, unit-tested mapper with the route kept thin. The field discipline that mattered:

```ts
// apps/shop/src/server/view/google-merchant-feed.ts
push('g:condition', 'used');
// There is no GTIN and never will be — every item is second-hand
// and one of a kind. This is the one thing structured data on the
// page itself has no field for.
push('g:identifier_exists', 'no');

// Sale price is an addition, never a replacement: Google draws the
// strike-through from the pair, and a `price` that quietly changes
// to the sale figure reads as a price mismatch against the landing
// page and gets the item disapproved.
push('g:price', money(product.priceCents));
if (product.salePriceCents !== null) push('g:sale_price', money(product.salePriceCents));
```

`identifier_exists` is a Merchant Center feed attribute with no equivalent in page markup: schema.org gives you fields for a GTIN or MPN you *have*, and none for declaring that one will never exist. That gap is a real reason to run a feed on top of JSON-LD that's already earning rich results — not because organic Search demands an identifier (it doesn't), but because feed validation is a different, stricter reviewer.

The snippet above has a bug, and I'm leaving it visible because a reviewer caught it and the catch is the useful part. It sets `no` for the *entire* catalogue. The spec wants it computed per product — `no` only when there's no GTIN and no brand/MPN pair — and 35 of these 431 items were already submitting a `g:brand` while simultaneously declaring that no identifier existed. Contradicting yourself in the same item is not a thing you want a validator to notice on its own schedule.

Fixed since: emit the brand where there is one, fall back to `identifier_exists: no` only where there genuinely isn't. 35 items now submit real matchable brands — Wedgwood, Royal Albert, Waterford, Spode, Georg Jensen — and 396 keep the honest `no`. Worth checking your own feed for this exact contradiction; it produced zero disapprovals for months and was still wrong.

The other field Google asked for, via Search Console's Merchant listings report, was `deliveryTime` inside `offers.shippingDetails` — missing on every item. Adding it is easy. Getting it *right* is a business question dressed as a schema question, because `deliveryTime` is a public promise, not a tag:

```json
"deliveryTime": {
  "@type": "ShippingDeliveryTime",
  "handlingTime": { "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
  "transitTime": { "minValue": 2, "maxValue": 8, "unitCode": "DAY" }
}
```

Handling time is sourced: the returns page already promised a carrier handoff within two business days. Transit time is an estimate — the real number comes from the carrier per destination, long after the feed is built — so it errs wide deliberately, and it lives in one shared constant that both the page markup and the feed's `<g:shipping>` read. Same rule as the shipping rate: one number, one place, or the two drift apart and the mismatch becomes a disapproval.

A few more rules, briefly. I can't prove any single one of them prevented a specific rejection — Merchant Center doesn't itemise the disapprovals you didn't get — but each is a documented way to earn one:

- `google_product_category` is optional and deliberately **omitted** — Google assigns a category from the product's own signals when you leave it out. Two different failures if you don't: an *invalid* taxonomy value can get the item disapproved outright, and a *valid but wrong* one quietly applies that category's requirements instead. Override it when the inferred category is actually wrong, not on principle.
- `g:size` and `g:color` are lifted out of the product's own spec rows, because apparel gets held without them.
- Additional images cap at 10 — an eleventh invalidates the *whole item*, not just the extra photo.
- Products with no photo are skipped entirely; `image_link` is required, so including them could only inflate the error count.
- Sold items leave the feed on their own (they drop out of the query that backs it); items held by a pending checkout stay in as `out_of_stock`.
- The route 404s without `SITE_URL`, same rule as `robots.txt` and `sitemap.xml` — every link in a feed is absolute, and a feed of wrong links is worse than no feed.
- A 1000-item ceiling from `listLive({ limit: 1000 })` — a full-catalogue fetch in one request, because Merchant Center delists anything missing from a fetch, so paginating the feed would silently drop products every refresh. It's a real ceiling and an honest limitation, not a number chosen for looks — the first thing to revisit once the catalogue gets close to it.

Registering it: create the Merchant Center account from the link Search Console itself surfaces (it auto-claims the domain from existing verification), business info, Canada, then the feed URL as a scheduled daily fetch.

<figure>
  <img src="assets/images/blog/2026-08-13-merchant-center-data-source.png" alt="Merchant Center data source row showing a scheduled URL fetch, 431 products, last updated August 13, 2026" width="100%" height="auto" />
  <figcaption>The feed registered as a scheduled daily fetch — 431 products, last pulled today.</figcaption>
</figure>

One rule that cuts across all of it: **any number stated in two places has to agree.** The flat shipping rate in Merchant Center's settings, the `<g:shipping><g:price>` the feed advertises, and what checkout actually charges the shopper — three places, one number. A mismatch disapproves the items it affects, and because a flat rate is a single account-level setting, "the items it affects" is potentially everything. Keep mismatching and the consequences escalate past individual items. It's a bad category of mistake to make repeatedly.

## Two bugs the work surfaced

Neither is about Merchant Center directly — both are the kind of thing you only find building the surrounding pages for real.

**The contact endpoint was an unauthenticated mail relay.** Code review flagged `/api/contact` as having no rate limit — a loop over it is a mail bomb into the shop owner's inbox. Fixed with an in-memory sliding-window limiter, 5 requests/hour keyed on `x-forwarded-for`, checked before the body is even read:

```ts
const limiter = createRateLimiter({ limit: 5, windowMs: 3_600_000 });
...
if (!limiter.allow(callerKey(getRequestHeader(event, 'x-forwarded-for')))) {
  setResponseStatus(event, 429);
  return { error: 'too many messages — please try again later' };
}
```

Two honest limitations, and reviewers found the second one for me.

The counter lives in memory in a single server process. This shop scales to four, and every deploy resets them, so 5/hour is a per-process nominal figure and not a ceiling anyone should quote — the aggregate is more like 20/hour, drifting upward across restarts, spread over instances an attacker doesn't get to choose between. A shared counter in the database would be exact, but it trades a flood of emails for a flood of writes — the wrong trade for a route this size.

The subtler one: a per-IP bucket is only as trustworthy as the header it keys on. This one reads the first entry in `x-forwarded-for`, which is correct *if* the ingress overwrites what the client sent. Plenty of platforms don't — they append the real client address to whatever the caller supplied, which leaves the first entry attacker-controlled and the bucket walkable by rotating a header. Whether that's true of your deployment is a question about your ingress, not your code, and it's worth answering before you call a limiter like this done. I'm answering it for mine.

**The submit button was enabled from first paint.** A classic server-rendering trap, caught only by driving a real browser: the page ships fully formed HTML, including an enabled submit button, before any client-side JavaScript has attached handlers to it. A click landing in that window is accepted by the browser and observed by nothing. Every unit test passed, because unit tests never render server HTML and then wait for a framework to wake up.

The fix was to render the button disabled until the form is both hydrated and valid — and it doubles as how you detect hydration in an e2e test: fill the form and poll until the button enables, instead of filling once and clicking immediately.

```ts
await expect(async () => {
  await page.getByLabel('Your name').fill('Ruby Tester');
  await page.getByLabel('Email', { exact: true }).fill('ruby@example.com');
  await page.getByLabel('Message').fill('Is the fairy lamp still available?');
  await expect(send).toBeEnabled({ timeout: 500 });
}).toPass({ timeout: 15_000 });
```

If your e2e suite fills a form and clicks in the same beat on a server-rendered app, you probably have this bug on some form already and just haven't hit the timing window yet.

## The results

Three days after the feed went live:

<figure>
  <img src="assets/images/blog/2026-08-13-search-console-merchant-listings.png" alt="Search Console Merchant listings report showing 0 invalid and 5 valid items from crawl-based ingestion" width="100%" height="auto" />
  <figcaption>Search Console's crawl-based Merchant listings report — 5 valid, 0 invalid.</figcaption>
</figure>

Search Console's own crawl-based report — the one that started all this — now shows 5 valid items, 0 invalid. Better than the original 3, still tiny, because a crawler working from JSON-LD alone can only find what it happens to walk and can only validate what page markup can express.

<figure>
  <img src="assets/images/blog/2026-08-13-merchant-center-product-status.png" alt="Merchant Center product status breakdown: 22 approved, 0 limited, 0 not approved, 409 under review" width="100%" height="auto" />
  <figcaption>Merchant Center's product status, same day: 22 approved, 0 limited, 0 not approved, 409 under review.</figcaption>
</figure>

The feed itself: 431 products, fetched daily. Merchant Center's breakdown when I took that screenshot: 22 approved, 0 limited, 0 not approved, 409 under review. By the end of the same day it read **410 approved, 0 limited, 0 not approved, 21 under review** — the queue drained in hours, not the weeks I'd braced for, and nothing failed on the way through. So the batch-review reading held up, though I'd still call it an interpretation of two screenshots rather than documented behaviour. The number that matters isn't 22, it's the zero next to "not approved" — with the caveat that it's a zero measured against 22 decided items, and the 409 still in the queue can only move it upward.

Across the surfaces: organic Search rich results, already working, feed-independent. Shopping tab, approved but not yet found for the exact items I checked. AI Mode, zero citations so far, on a feed three days old competing against marketplaces with years of inventory density. The crawl saw 5 items; the feed delivered 431 with nothing marked "not approved" — but that's a statement about correctness, not about traffic, and there is no traffic to report.

And underneath all of it, the number that reframes the rest: **5 pages indexed out of 436.** The catalogue is now two hops deep on stable URLs instead of eighteen deep on cursors that change whenever inventory does, and the sitemap has been resubmitted. Whether that moves the indexing count is a question for next week's Pages report, not this post. Recrawling is not instant and I am not going to pretend I've already seen the result.

## What I won't claim

The account is three days old. There are no Shopping tab clicks, no AI Mode citations, no conversion numbers — nothing that would let me say this drove traffic or revenue, because it hasn't had time to. The crawl fix shipped hours ago and I have no idea yet whether it works; "two hops instead of eighteen" is a measurement of my own site, not of Google's behaviour toward it.

What I can say concretely: 431 items submitted, 410 approved and zero marked "not approved"; a rate limiter that trades precision for cost on a route worth neither, and whose per-IP bucket is only sound if the ingress overwrites the header it keys on; a hydration bug only a real browser would have caught; a 1000-item ceiling that's a named limitation rather than a surprise; a feed that contradicted itself on 35 items for months without a single disapproval; and a real, observed gap between "approved in Merchant Center" and "found on the Shopping tab" that I'm not going to paper over with optimism.

The AI Mode angle is the speculative part of this post, and I want it to stay speculative on the page rather than only in my head: the facts those answers quoted — price, discount, condition, availability — are the same facts a feed makes you pin down, which is a decent reason to have one. It is not evidence that a feed gets you cited, and Google doesn't claim a feed is required for AI Mode either. If you're running your own storefront and Search Console just nudged you about the same thing, do it in this order: **open the Pages report and find out how much of your site Google has actually indexed**, because every other optimisation is downstream of that. Then check for a returns page and a contact page. Then ship the feed. The Shopping tab does require Merchant Center. The Shopping Graph is looser than that — Google builds it from product information across the web, structured data included — so a feed is one way to contribute to it, not the only door. Then wait and watch, honestly, for whether it was enough.
