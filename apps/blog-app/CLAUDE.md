# Blog App

Angular/Analog blog app. Deploys two ways from one codebase:
- **Vercel** (default, `dalenguyen.me`): static SSG — every route prerendered.
- **Cloud Run** (`dalenguyen-prod`): Nitro `node-server` — prerendered routes
  served as static HTML, everything else SSR'd on demand, API routes live.

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

Cloud Run (project `dalenguyen-prod`, region `us-central1`, account `dale@dalenguyen.me`):

```
nx run blog-app:deploy        # build-server → gcloud builds submit → gcloud run deploy
```

Targets: `build-server` (node-server build), `build-docker` (stage `analog/` into
`.cloudrun/` + Cloud Build), `deploy` (Cloud Run). Image: nginx-free `node:22-slim`
running `analog/server/index.mjs`. Service URL:
`https://blog-app-185772516206.us-central1.run.app`.

## Static vs SSR per route

Both deployments share `prerender.routes` in `vite.config.ts` as the selector:
- **Static** — add the path to `prerender.routes` (it's prerendered at build time).
- **SSR** — leave it out; on Cloud Run it renders per request (on Vercel SSG it
  would 404, so keep the Vercel route set complete).

API routes: `src/server/routes/**` → served under `/api` (e.g. `/api/v1/hello`).
SSR/API only run on the Cloud Run node-server build, not the static Vercel build.

## Notes
- SSR enabled in production only
- Content dir: `src/content/`
- Use the `blog-post-manager` agent to add/update posts
