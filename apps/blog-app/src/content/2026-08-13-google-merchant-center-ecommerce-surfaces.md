---
title: "Rich Results, Shopping, and AI Mode: What Google Merchant Center Actually Gets You"
slug: 2026-08-13-google-merchant-center-ecommerce-surfaces
description: A product feed isn't just a Shopping-tab checkbox. Which Google surfaces it actually reaches — organic rich results, the Shopping tab, AI Mode — and which ones it demonstrably doesn't, mapped with screenshots.
categories: ['seo', 'ecommerce', 'google-merchant-center', 'google-search']
coverImage: https://dalenguyen.me/assets/images/blog/2026-08-13-google-merchant-center-ecommerce-surfaces.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-08-13T10:00:00.000Z
author: Dale Nguyen
draft: false
---

[Ruby Rose Bloom](https://rubyrosebloom.com) sells one-of-a-kind vintage — a self-hosted storefront, no Shopify, no marketplace underneath it. Search Console's "Merchant opportunities" report told me 3 active products weren't showing up on the Shopping tab, and I went looking for the setting to fix. There wasn't one. What I actually found, three days of digging later, is that "get into Merchant Center" is not one thing — it's several different surfaces, each fed by a different mechanism, and the one everyone talks about (the Shopping tab) turned out to be the least interesting of them.

This post is the question I actually had, answered with screenshots taken today: **I have a storefront. What does getting into Merchant Center buy me, and where do my products actually end up?**

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

But I want to be precise about what this evidence does and doesn't show, because it's thinner than it looks. Google documents no Merchant Center requirement for AI Mode at all — AI Mode cites ordinary web pages routinely, and a shop with no feed is not locked out of being quoted. So this is an observation about *shape*, not a mechanism I can point to in anyone's documentation: the facts those answers reached for were structured facts, and a feed is the artifact that forces you to state them precisely and identically everywhere. That's cheap to do and it can't hurt.

What it isn't is evidence that the feed gets you cited. I have zero AI Mode citations for Ruby Rose Bloom and no timeline on which I expect that to change. Etsy and eBay are winning these answers today on depth, account age, and inventory density that a three-day-old account with 431 items doesn't have, and no amount of clean markup substitutes for that. Whether the work pays off here is an open question I can only answer by watching.

## Approved isn't visible yet

Before the "does it work" question, one honest gap. A Shopping tab search for the exact product title — `"Vintage Arcopal France milk glass teacup set of 3"` — returns Etsy, eBay, and Poshmark listings, not Ruby Rose Bloom's, despite that exact item being **approved** in Merchant Center today. A bare `rubyrosebloom` Shopping query comes back empty too.

Approval is permission to compete for placement, not placement itself. There's a real lag between "Google's review process signed off on this item" and "this item is actually being surfaced" — plausibly indexing time, plausibly a cold-start ranking penalty against listings with years of click history, probably both. I don't have a number for how long that lag runs; I only have three days of data and it hasn't closed yet. If you ship a feed and check the Shopping tab the same week expecting to see your own products, don't be surprised when you don't.

## What it takes to get in

The mechanics, once you know which surface you're aiming at. Two blockers turned out to matter more than the field-level detail: no policy pages, and no way for structured data to say "there will never be an identifier for this."

**Policy pages, first.** Merchant Center requires a shopper to reach a returns policy and a clearly available way to contact the shop. A form, an email address, a phone number, a social profile — any of them satisfies it; Ruby Rose Bloom published none of them. This is a top rejection cause and it's a code fix, not a console setting: `/returns` (shipping, final sale, damaged-in-transit) and `/contact`. This shop went with a form — honeypot, server-side validation, transactional email with `Reply-To` set to the visitor — because I didn't want a mailbox sitting in crawlable HTML, but a published address would have cleared the policy just as well. Both pages linked from the footer on every page and listed in `sitemap.xml`. The feed genuinely could not ship before these did — its own field choices (the shipping rate it advertises) depend on `/returns` existing and agreeing with checkout.

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

One honest caveat on the snippet above: it sets `no` for the entire catalogue, and the spec wants it computed per product — `no` only when there's no GTIN and no brand/MPN pair. Plenty of these pieces do carry a brand (Arcopal, Paragon), so the per-product version is the correct one and the blanket value is a simplification that has cost nothing yet. Worth fixing before it does.

A few more rules, briefly, because each one is a real disapproval avoided:

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

One rule that cuts across all of it: **any number stated in two places has to agree, or the mismatch is a disapproval.** The flat shipping rate in Merchant Center's settings, the `<g:shipping><g:price>` the feed advertises, and what checkout actually charges the shopper — three places, one number. Drift in any one of them and the whole catalogue starts failing shipping validation at once, not gracefully.

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

The honest limitation: the counter lives in memory on one server instance, and this shop scales to four, so the real ceiling is 20/hour spread across instances an attacker doesn't get to choose between. That's the gap between "nuisance" and "unusable inbox," not between "safe" and "unsafe." A shared counter in the database would be exact, but it trades a flood of emails for a flood of writes — the wrong trade for a route this size.

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

The feed itself: 431 products, fetched daily. Merchant Center's breakdown at capture time: 22 approved, 0 limited, 0 not approved, 409 under review. "Under review" is most of the catalogue, and that's expected — the account is three days old and Google reviews a new feed in batches, not all at once. The number that matters isn't 22, it's the zero next to "not approved" — with the caveat that it's a zero measured against 22 decided items, and the 409 still in the queue can only move it upward.

Across the surfaces: organic Search rich results, already working, feed-independent. Shopping tab, approved but not yet found for the exact items I checked. AI Mode, zero citations so far, on a feed three days old competing against marketplaces with years of inventory density. The crawl saw 5 items; the feed delivered 431 with nothing marked "not approved" so far — but that's a statement about correctness, and about the portion Google has actually ruled on, not about traffic. I don't have traffic to report yet.

## What I won't claim

The account is three days old. There are no Shopping tab clicks, no AI Mode citations, no conversion numbers — nothing that would let me say this drove traffic or revenue, because it hasn't had time to. What I can say concretely: 431 items submitted with zero marked "not approved" at capture time and 409 still under review, a rate limiter that trades precision for cost on a route worth neither, a hydration bug only a real browser would have caught, a 1000-item ceiling that's a named limitation rather than a surprise, and a real, observed gap between "approved in Merchant Center" and "found on the Shopping tab" that I'm not going to paper over with optimism.

The AI Mode angle is the speculative part of this post, and I want it to stay speculative on the page rather than only in my head: the facts those answers quoted — price, discount, condition, availability — are exactly the facts a feed makes you pin down, which is a decent reason to have one. It is not evidence that a feed gets you cited, and Google doesn't claim a feed is required for AI Mode either. If you're running your own storefront and Search Console just nudged you about the same thing: check for a returns page and a contact page before you touch anything structured-data-related, ship the feed because the Shopping tab and the Shopping Graph genuinely can't be reached without one, and then wait and watch, honestly, for whether it was enough.
