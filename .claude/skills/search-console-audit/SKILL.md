---
name: search-console-audit
description: Use when asked to check, audit, or improve Google Search Console indexing/SEO for dalenguyen.me — e.g. "check search console", "why aren't my pages indexed", "improve SEO", "audit indexing", or "/search-console-audit". Investigates indexing gaps, finds root causes in the blog-app source, fixes them, deploys, and resubmits the sitemap.
---

## Purpose

End-to-end workflow for diagnosing and fixing Google Search Console indexing
problems for dalenguyen.me (AnalogJS blog-app): read the indexing report,
find root causes in source (not just symptoms), fix, verify against a real
production build, deploy correctly, resubmit the sitemap, and set honest
expectations on timeline. This exists because a prior run found and fixed two
real bugs (sitemap `lastmod` always = build date, no canonical tag ever
emitted) — see "Known gotchas" below before repeating that investigation from
scratch.

## Prerequisites

- `mcp__chrome-devtools__*` tools available, logged into Google as
  `dale@dalenguyen.me` with Search Console access to `sc-domain:dalenguyen.me`
- `gcloud` authenticated as `dale@dalenguyen.me` (only account with access to
  the `dalenguyen-prod` Cloud Run project) if a deploy will be needed

## Workflow

### Step 1: Read the current indexing snapshot

Navigate to `https://search.google.com/search-console?resource_id=sc-domain%3Adalenguyen.me`
(Overview) then `.../search-console/index?resource_id=sc-domain%3Adalenguyen.me`
(Pages). Note the indexed/not-indexed split and the "Why pages aren't indexed"
reason breakdown (404, redirect, noindex, duplicate-canonical,
crawled-not-indexed, soft-404, etc.).

**Note the "Last update" date on the Pages report.** This report is a
**weekly snapshot**, not live data. If you deploy a fix today, this number
will not move today — don't re-check it same-day and conclude the fix
failed.

### Step 2: Drill into the largest reason buckets

Click into each non-zero reason row to see example URLs
(`.../index/drilldown?...&item_key=...`). Distinguish:
- **Legacy/dead content** (e.g. old `wordpress.dalenguyen.me/*` URLs from the
  pre-Analog site) correctly 404ing — nothing to fix, Google will drop these
  on its own over time.
- **Live, current content** stuck in a bad bucket (e.g. real blog posts under
  "Crawled - currently not indexed") — this is the actionable signal.

### Step 3: Spot-check with URL Inspection

Use the "Inspect any URL" combobox (fill + press Enter) on 2-3 affected live
URLs. Look specifically at:
- **User-declared canonical** — "None" here is a real bug, not a Google
  quirk (see gotcha below).
- **Referring sitemaps** — "No referring sitemaps detected" means the page
  isn't reaching Google via the sitemap at all.

### Step 4: Cross-reference against the live site

```bash
curl -s https://dalenguyen.me/sitemap.xml | grep -c '<loc>'
curl -s https://dalenguyen.me/sitemap.xml | grep -c '<lastmod>TODAYS_DATE'  # all-same-date = bug
curl -s https://dalenguyen.me/robots.txt
```
Compare the sitemap's actual URL count against the Sitemaps report's
"Discovered pages" — a big gap plus an old "Last read" date means Google
simply hasn't refetched the file (see Step 8/9), not that the URLs are
missing content.

### Step 5: Find root causes in source, don't just patch symptoms

Relevant files in this repo:
- `apps/blog-app/vite.config.ts` — the AnalogJS `prerender.sitemap` config
  (host, per-route `sitemap` fn) and `prerender.routes` content-route
  transform.
- `apps/blog-app/src/app/blog/resolvers.ts` — `postTitleResolver` /
  `postMetaResolver` (proven pattern: resolvers run before the component
  mounts and their output reliably lands in prerendered SSG HTML).
- `apps/blog-app/src/app/routes/blog/[slug].ts` — `routeMeta` wiring
  (`title`, `meta`, `resolve`).

When implementing a per-route `sitemap` fn or resolver, read the vendored
`@analogjs/vite-plugin-nitro` source
(`node_modules/.pnpm/@analogjs+vite-plugin-nitro@*/.../src/lib/build-sitemap.js`
and `vite-plugin-nitro.js`) to confirm how `routeSitemaps` keys are built —
don't assume the config shape works as documented.

### Step 6: Fix, then verify against a REAL production build

`npx tsc -p apps/blog-app/tsconfig.app.json --noEmit` first. Then build for
real and inspect the actual output — do not trust dev-server behavior for
SSG-only bugs (canonical tags emitted client-side after hydration won't show
up in the prerendered HTML that Google actually fetches):

```bash
npx nx build blog-app --skip-nx-cache   # --skip-nx-cache: Nx will otherwise
                                          # silently replay a stale cached
                                          # dist/ and hide your fix
```

**The real static output for a given post is
`.vercel/output/static/blog/<slug>/index.html`** (Vercel-format static
output — this is what CLAUDE.md calls the primary build, even though it is
NOT what serves the live domain, see Step 8). Grep it directly:

```bash
grep -o '<link rel="canonical"[^>]*>' .vercel/output/static/blog/<slug>/index.html
grep -A1 '<slug><' .vercel/output/static/sitemap.xml   # check lastmod
```

Don't bother checking `dist/apps/blog-app/analog/public/**` or
`dist/apps/blog-app/client/**` for prerendered blog HTML — depending on
which nx build configuration runs, those may not contain the prerendered
pages at all; `.vercel/output/static/` is the reliable one.

Clean up verification artifacts after (`rm -rf dist/apps/blog-app
.vercel/output`) — don't commit them.

### Step 7: Deploy — verify WHICH mechanism actually serves the domain

**Do not assume `git push` deploys the live site.** CLAUDE.md says Vercel is
the default/primary target for `dalenguyen.me`, but verify what's actually
serving it before relying on that:

```bash
curl -sI https://dalenguyen.me/ | grep -i "server\|x-vercel\|x-cloud-trace"
```
- `server: Google Frontend` + `x-cloud-trace-context` → served by **Cloud
  Run**. A plain `git push` does nothing for production; you must run
  `npx nx run blog-app:deploy` (chains `build-server` →
  NITRO_PRESET=node-server build, `build-docker` → Cloud Build image,
  `deploy` → `gcloud run deploy`). This takes several minutes — run it with
  `run_in_background: true` and treat the harness's "completed" notification
  with suspicion; confirm with `ps aux | grep "blog-app:deploy"` before
  trusting it, then check the deploy log for the actual
  "...has been deployed and is serving 100 percent of traffic" line.
- `x-vercel-id` present → actually served by Vercel; a push to the tracked
  branch (check `git rev-parse --abbrev-ref --symbolic-full-name @{u}`)
  should be sufficient, but still verify post-push.

### Step 8: Verify the fix is live in production

```bash
curl -s https://dalenguyen.me/blog/<slug> | grep -o '<link rel="canonical"[^>]*>'
curl -s https://dalenguyen.me/sitemap.xml | grep -A1 '<slug><'
```
Don't proceed to resubmitting the sitemap in GSC until this actually shows
the fix — resubmitting against stale content wastes the gesture.

### Step 9: Resubmit the sitemap in Search Console

Navigate to `.../search-console/sitemaps?resource_id=sc-domain%3Adalenguyen.me`.
**Use the full absolute URL** (`https://dalenguyen.me/sitemap.xml`) in the
"Add a new sitemap" field — a bare relative path (`sitemap.xml`) reliably
triggers an "Invalid sitemap address" dialog on this domain property, even
though relative paths are the documented format. There is no delete option
in the row's overflow menu (only "See page indexing" / "See video page
indexing", both usually disabled) — just resubmit the same URL; Google
treats it as a forced re-fetch. A successful submission shows "Submitted"
and "Last read" both jump to today and "Discovered pages" updates
immediately to match the real sitemap content.

### Step 10: Set expectations

Resubmitting only forces Google to re-fetch the **sitemap file** — it does
not instantly re-crawl or re-index every listed page. Tell the user:
- Sitemap re-fetch: immediate (verified in Step 9).
- Individual page re-crawl + re-index decision: days to a couple of weeks
  per page, and depends on Google's own crawl budget/priority for the site.
- The Pages (indexing) report itself won't reflect any of this until its
  next weekly snapshot — don't re-check it same-day.

## Known gotchas (found the hard way, don't rediscover these)

- **AnalogJS sitemap `host` trailing slash bug**: if `sitemap: { host: '...'
  }` in `vite.config.ts` ends with `/`, `build-sitemap.js`'s
  `checkSlash()` strips the leading slash off the per-route lookup key,
  which never matches how `routeSitemaps` entries are actually keyed (they
  always have a leading slash) — so any per-route `sitemap` fn/config is
  silently ignored and every page falls back to the build-date `lastmod`.
  Fix: no trailing slash on `host`.
- **Component-level `effect()` for canonical tags doesn't reach SSG output**:
  setting `document.head`'s canonical link from an Angular `effect()` inside
  a component (even unconditionally, even in `ngOnInit`) does not reliably
  land in the prerendered static HTML — timing between the reactive flush
  and prerender serialization isn't guaranteed. Use a **route resolver**
  instead (`RouteMeta.resolve`), which runs before the component mounts and
  is the same mechanism `postMetaResolver`/`postTitleResolver` already use
  successfully.
- **`dalenguyen.me` is served by Cloud Run, not Vercel**, despite
  `apps/blog-app/CLAUDE.md` describing Vercel as the default/primary
  target — confirmed via `server: Google Frontend` response header. Always
  verify with `curl -sI` before assuming a push deployed anything.
- **Nx build caching can silently serve a stale `dist/`** even after source
  changes — use `--skip-nx-cache` when verifying a fix, and `rm -rf
  dist/apps/blog-app` first if in doubt.
- **GSC's "Add a new sitemap" field rejects relative paths** with "Invalid
  sitemap address" on this domain property — use the full absolute URL.
- **Chrome DevTools MCP "browser already running" lock error**: if
  `navigate_page`/`list_pages`/`new_page` all fail with "The browser is
  already running for .../chrome-profile", a stray Chrome process (often
  from an earlier session) is holding the singleton profile lock. Find it
  with `ps aux | grep "user-data-dir=.../chrome-devtools-mcp/chrome-profile"`,
  filter for the one main `/Applications/Google Chrome.app/.../Google
  Chrome --allow-pre-commit-input...` process (not the Renderer/Helper
  child processes), `kill <pid>`, then retry — a fresh browser launches
  automatically.
