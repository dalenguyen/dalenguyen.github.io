# Blog App

Angular/Analog blog app. One codebase, two build targets — but only Cloud Run
serves the public site:
- **Cloud Run** (`dalenguyen-prod`) — **production: this is what serves
  `dalenguyen.me`.** Nitro `node-server`: prerendered routes served as static HTML,
  everything else SSR'd on demand, API routes live. Ship it with
  `nx run blog-app:deploy` (see Deployment). Once `.github/workflows/deploy.yml`
  has its WIF secrets configured (see Deployment), merging to `dev` with changes
  under `apps/blog-app/**` or `libs/portfolio/shared/**` triggers this
  automatically — otherwise you still must run the Cloud Run deploy by hand.
- **Vercel** (project `analogjs-blog`) — **preview only.** Every PR gets a preview
  deploy (`analogjs-blog-git-<branch>-…vercel.app`) for verification; static SSG,
  every route prerendered. It is NOT the public apex.

## Stack
- [Analog](https://analogjs.org/) — Angular meta-framework with SSG/SSR
- Vite + Vitest
- Tailwind CSS
- Markdown content in `src/content/`

## Blog Posts
- Files: `src/content/*.md`
- Frontmatter fields: `title`, `slug`, `date`, `draft` (optional)
- Posts with `draft: true` are excluded from build

## Deployment

Build preset is switched by the `NITRO_PRESET` env var in `vite.config.ts`:
- unset → `vercel` preset + `static: true` (SSG) → `.vercel/output/`
- `node-server` → Nitro Node server + `static: false` (SSR) → `dist/apps/blog-app/analog/`

Cloud Run (project `dalenguyen-prod`, region `us-central1`):

```
nx run blog-app:deploy        # build-server → gcloud builds submit → gcloud run deploy
```

Deploy identity: the nx targets pass `--account ${GCLOUD_ACCOUNT:-dale@dalenguyen.me}`.
`dale@dalenguyen.me` is the default because it's the only account with access to
`dalenguyen-prod` (the usual active account, `dale.nguyen@noibu.com`, does not). In CI or
any other environment, set `GCLOUD_ACCOUNT` to the authenticated (service) account that
has `roles/run.admin` + `roles/cloudbuild.builds.editor` + `roles/artifactregistry.writer`
+ `roles/iam.serviceAccountUser` + `roles/storage.admin` (project-scoped — `builds submit`
checks bucket existence via a project-scoped `storage.buckets.list`, so a bucket-scoped
grant isn't enough) + `roles/viewer` (`builds submit` needs it to stream build logs back
to the CLI; without it the command fails even after the build itself succeeds) on the
project.

Targets: `build-server` (node-server build), `build-docker` (stage `analog/` into
`.cloudrun/` + Cloud Build), `deploy` (Cloud Run). Image: nginx-free `node:22-slim`
running `analog/server/index.mjs`. Service URL:
`https://blog-app-185772516206.us-central1.run.app`.

### CI (Workload Identity Federation)

`.github/workflows/deploy.yml` runs `nx run blog-app:deploy` in CI on push to
`dev` (scoped to `apps/blog-app/**` and `libs/portfolio/shared/**`), using
[Workload Identity Federation](https://github.com/google-github-actions/auth)
instead of a stored key: `google-github-actions/auth@v2` mints short-lived
credentials for a `github-deploy` service account, and the workflow sets
`GCLOUD_ACCOUNT` on the deploy step to that service account so `gcloud` doesn't
fall back to `dale@dalenguyen.me`.

This requires a one-time GCP setup (IAM service account, workload identity pool
+ provider, `WIF_PROVIDER`/`WIF_SERVICE_ACCOUNT` repo secrets) that only
dale@dalenguyen.me can run — exact commands are in the workflow file's header
comment. Until that setup is done, the job fails harmlessly at the auth step;
it doesn't block merges, it just means blog-app still needs a manual
`nx run blog-app:deploy` after merging.

Confirmed working end-to-end on 2026-08-30 (`blog-app-00041-vs8`, 100% traffic).

## Static vs SSR per route

Both deployments share `prerender.routes` in `vite.config.ts` as the selector:
- **Static** — add the path to `prerender.routes` (it's prerendered at build time).
- **SSR** — leave it out; on Cloud Run it renders per request (on Vercel SSG it
  would 404, so keep the Vercel route set complete).

API routes: `src/server/routes/**` → served under `/api` (e.g. `/api/v1/subscribe`).
SSR/API only run on the Cloud Run node-server build, not the static Vercel build.
Unmatched `/api/*` paths fall through to `src/server/routes/[...].ts`.

## Seasonal themes

The site can put on a costume for a date range (Halloween ships today; the
system is built so Christmas/New Year are folder-only additions). Code lives in
`libs/portfolio/shell/ui/src/lib/season/`.

**Why it is resolved in the browser, not at build time.** Every public route is
prerendered, so a build-time date check would bake October's costume into HTML
still being served in December. `src/plugins/season.plugin.ts` injects a
pre-paint inline script into `<head>` that reads the date on each page view and
sets `data-season` on `<html>` — the same rail the dark/light script rides, so
the tokens are correct at first paint with no flash. Nothing is written during
SSR, so prerendered HTML stays season-neutral and hydration never mismatches.

**Two independent axes.** `.light` (dark/light) and `data-season` are separate
attributes on `<html>`, so every season has both a dark and a light variant.

**The picker.** `SeasonSelectComponent` sits beside the dark/light toggle and
stores a `SeasonChoice` under the `season` localStorage key: `auto` (default —
follow the calendar), a season id (pin it on), or `none` (off). Precedence is
`?season=` query param > stored choice > calendar. The inline script reads the
same key, so a pinned season is already applied at first paint.

### Adding a season

1. Add a `SeasonId` + `SEASON_WINDOWS` entry in `season.data.ts` (the single
   source of truth — the Vite plugin serializes it into the inline script).
2. Add TWO blocks to `src/styles.css`, after `.light`:
   `[data-season='x']` and `.light[data-season='x']`.
3. Copy `season/themes/_template/` to `season/themes/x/`. The glob in
   `season-decor.component.ts` discovers it; there is no registry to edit.

Full checklist in `season/themes/_template/README.md`.

### Three traps

- **Specificity.** `[data-season='x']` has the SAME specificity as `.light`, so
  the seasonal blocks only win by coming after it in the file. A token declared
  only in the bare block leaks into light mode and wrecks it. Declare every
  token twice.
- **tsconfig include.** Season theme folders are reached only via
  `import.meta.glob`, which is invisible to TypeScript's static graph. They must
  stay in `tsconfig.app.json`'s `include` or they ship as untranspiled TS and
  fail at runtime with `SyntaxError: Missing initializer in const declaration`.
  Same trap as `src/content/**/*.ts` for interactive posts.
- **Reduced motion.** An effects layer must not mount at all under
  `prefers-reduced-motion: reduce` — skip it, do not merely slow it down.

### Verifying

`?season=halloween` forces a season on out of calendar order; `?season=none`
forces it off, without touching the stored choice. Check both light and dark,
and confirm the effects layer does not mount under `prefers-reduced-motion`.

## Notes
- SSR enabled in production only
- Content dir: `src/content/`
- Use the `blog-post-manager` agent to add/update posts

## Reviewing / resolving PRs

**Verify changes against the Vercel preview URL, not the apex.** Every PR pushes a
preview deployment; Vercel posts the link on the PR thread. Use that URL to drive
the change end-to-end (open the route, click the affected UI, watch for console
errors, etc.) before resolving review comments.

Don't read prod logs (`gcloud logging --project=...`) or hit
`https://dalenguyen.me` to verify a PR — those reflect the last **merged**
state, not the diff under review. Apex (`dalenguyen.me`) is served from Cloud
Run and may also 404 on routes that the Vercel preview renders correctly
(this repo's static-only `/learn/<slug>` pages are a known example — see
issue #211 / PR #212).

## Verifying a Cloud Run deploy (after merging to `dev`)

After `nx run blog-app:deploy` finishes, verify the new revision is serving
traffic correctly. **Hit `https://dalenguyen.me` (the apex via Cloudflare),
not `https://blog-app-185772516206.us-central1.run.app` directly.** The direct
service URL can return 404 from a separate routing layer even when the apex
serves the page correctly — a real hit to the apex is the source of truth.

Quick check after deploy:

```bash
# 200 + 77 KB = post is live
curl -s -A "Mozilla/5.0" -o /dev/null -w "%{http_code} bytes=%{size_download}\n" \
  https://dalenguyen.me/blog/<new-post-slug>

# Or for any other prerendered route
curl -s -A "Mozilla/5.0" -o /dev/null -w "%{http_code} bytes=%{size_download}\n" \
  https://dalenguyen.me/<route>
```

If the apex is 200 but a `gcloud run services describe` shows the new revision
isn't getting traffic, also check the service's traffic split:

```bash
gcloud run services describe blog-app --region=us-central1 --project=dalenguyen-prod \
  --format="value(status.traffic)"
```

(Lesson learned the hard way on 2026-07-08: the deploy of PR #221 succeeded,
Cloud Run served the new revision, real users got 200 — but `curl` against the
direct service URL returned 404, which made it look like the deploy was broken.
It wasn't. The apex is the only thing users see.)

PR comment bot to resolve: `@codemagpieai[bot]`. Skill: `/resolve-pr`.
