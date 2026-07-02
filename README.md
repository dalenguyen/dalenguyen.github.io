# Dale Nguyen Portfolio Website

An [Nx](https://nx.dev) monorepo powering [dalenguyen.me](https://dalenguyen.me) —
built with Angular 20, [AnalogJS](https://analogjs.org), and NestJS.

## Live sites

- **Portfolio** — https://dalenguyen.me (hosted on Vercel)
- **Blog** — AnalogJS app served statically on Vercel and as an SSR node-server on Cloud Run

## Tech stack

- **Nx 21** workspace (with Nx Cloud) managed with **pnpm 10**
- **Angular 20** + Angular Material + Tailwind CSS
- **AnalogJS 2** (Vite + Vitest) for the blog
- **NestJS 10** for the API
- **Module Federation** — `portfolio` (host) consumes `resume-remote` (remote)
- Jest / Vitest for tests, Cypress / Playwright for e2e, Storybook for components
- Node `>=20`

## Project structure

```
apps/
  portfolio      Angular Module Federation host — the main site (dalenguyen.me)
  resume-remote  Module Federation remote consumed by portfolio
  blog-app       AnalogJS blog (SSG on Vercel, SSR + API on Cloud Run)
  api-nest       NestJS API (deployed as a Google Cloud Function)
  saas           Angular SaaS app
libs/
  portfolio      Feature/UI/util libraries for the portfolio app
  angular        Shared Angular UI + utilities
  api-nest       NestJS domains / shell / infrastructure / usecases
  openai         OpenAI helper library
  saas-libs      Shared SaaS libraries
  shared         Framework-agnostic shared code (e.g. shared/ui)
```

See [docs/project-structure.md](/docs/project-structure.md) for the library boundary conventions.

## Getting started

```sh
pnpm install
```

## Development server

`npm start` serves the default project (`portfolio`) at `http://localhost:4200/`.

Serve any app directly with Nx:

```sh
nx serve portfolio      # http://localhost:4200 (Module Federation host + resume-remote)
nx serve blog-app       # http://localhost:3000 (AnalogJS)
nx serve saas
nx serve api-nest
```

## Build

```sh
nx build <app>          # e.g. nx build portfolio
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

The `dev` branch is the production branch. Pushing to `dev` deploys both sites to **Vercel**
via its Git integration:

- **Portfolio** → Vercel (dalenguyen.me).
- **Blog** → Vercel (static SSG, default).

Deploy the blog's SSR node-server to Cloud Run manually:

```sh
nx run blog-app:deploy  # build-server → gcloud builds submit → gcloud run deploy
```

See [apps/blog-app/CLAUDE.md](/apps/blog-app/CLAUDE.md) for the blog's dual-deploy details.

> Note: `.github/workflows/ci.yml` still publishes `nx deploy portfolio` to the `master`
> branch for GitHub Pages, but Vercel is the source of truth for dalenguyen.me — the Pages
> path is legacy and unverified.

## Generate a new app / library

```sh
nx generate @nx/angular:app my-app
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
