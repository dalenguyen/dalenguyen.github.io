# Dale Nguyen Portfolio Website

An [Nx](https://nx.dev) monorepo powering [dalenguyen.me](https://dalenguyen.me) —
built with [AnalogJS](https://analogjs.org) (Angular 20) and NestJS.

## Live sites

- **Main site** — https://dalenguyen.me (blog-app on Vercel): home, blog, resume, learn, bucket list
- **Blog SSR** — the same app runs as a Nitro node-server on Cloud Run for on-demand SSR + API routes

## Tech stack

- **Nx 21** workspace (with Nx Cloud) managed with **pnpm 10**
- **AnalogJS 2** (Vite + Vitest) — the main site/blog, Angular 20 + Angular Material + Tailwind CSS
- **NestJS 10** for the API
- Blog content authored as **static markdown** in `apps/blog-app/src/content/`
- Node `>=20`

## Project structure

```
apps/
  blog-app    AnalogJS — the main site (dalenguyen.me): home, blog (static md),
              resume, learn, bucket list. SSG on Vercel + SSR/API on Cloud Run.
  api-nest    NestJS API (deployed as a Google Cloud Function)
  saas        Angular SaaS app
libs/
  portfolio   home / shell / resume / shared UI libraries (consumed by blog-app)
  angular     Shared Angular UI + utilities
  api-nest    NestJS domains / shell / infrastructure / usecases
  openai      OpenAI helper library
  saas-libs   Shared SaaS libraries
  shared      Framework-agnostic shared code (e.g. shared/ui)
```

See [docs/project-structure.md](/docs/project-structure.md) for the library boundary conventions.

## Getting started

```sh
pnpm install
```

## Development server

`npm start` serves the default project (`blog-app`).

```sh
nx serve blog-app       # http://localhost:3000 (AnalogJS — the main site)
nx serve api-nest
nx serve saas
```

## Build

```sh
nx build <app>          # e.g. nx build blog-app
```

## Test & lint

```sh
nx test <project>       # unit tests (Jest / Vitest)
nx lint <project>
nx e2e <app>-e2e        # Cypress / Playwright
nx storybook <project>  # Storybook
```

Use `nx affected -t build|test|lint` to run only what changed against `origin/dev`.

## Deployment

The `dev` branch is the production branch. Pushing to `dev` deploys to **Vercel**
via its Git integration (static SSG — every route prerendered), serving `dalenguyen.me`.

Deploy the blog's SSR node-server to Cloud Run manually:

```sh
nx run blog-app:deploy  # build-server → gcloud builds submit → gcloud run deploy
```

See [apps/blog-app/CLAUDE.md](/apps/blog-app/CLAUDE.md) for the dual-deploy (Vercel SSG + Cloud Run SSR) details.

## Blog posts

Posts are markdown files in `apps/blog-app/src/content/`. Frontmatter fields: `title`,
`slug`, `date`, `draft` (optional). A route is prerendered only if its path is listed in
`prerender.routes` in `apps/blog-app/vite.config.ts` — posts are added there automatically
from the content directory.

## Generate a new app / library

```sh
nx generate @nx/angular:library my-lib --buildable --publishable
nx generate @nx/nest:app my-api

# NestJS building blocks
nx g @nx/nest:module path/module-name
nx g @nx/nest:service path/service-name

# Publishable npm package
nx generate @nx/node:library name --importPath @dalenguyen/name --publishable
```

## Contribution

Contributions are welcome. Please read the
[contribution guideline](https://github.com/dalenguyen/dalenguyen.github.io/blob/dev/CONTRIBUTING.md).
