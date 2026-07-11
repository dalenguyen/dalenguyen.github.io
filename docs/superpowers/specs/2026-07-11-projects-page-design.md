# Projects Page + Featured Home Section — Design

**Date:** 2026-07-11
**Status:** Approved, ready for implementation plan

## Problem

The home page (`/`) renders a "Project Gallery" section (`PortfolioComponent`)
that lists **all** projects (currently 6) inline. There is no dedicated projects
page, and two current products — **Xoài** and **CodeMagpie** — are missing.

Goals:

1. Add a dedicated `/projects` page that lists **all** projects.
2. Show only **3 featured** projects on the home page:
   `heyxoai.com`, `codemagpie.com`, `logichat.io`.
3. Add the two missing projects (Xoài, CodeMagpie) with real detail and images.

## Decisions (confirmed with user)

- **Images:** screenshot the live sites (`heyxoai.com`, `codemagpie.com`) rather
  than generate branded art — matches the existing product-screenshot cards.
- **Nav & home wiring:** home shows 3 featured + a "View all projects →" link;
  the "Digital Portfolio" nav item routes to `/projects` (instead of scrolling to
  the home section).
- **Project set:** the `/projects` page lists all 8 (the 6 existing + Xoài +
  CodeMagpie).

## Architecture

Single source of truth for project data, consumed by two views (home = featured
subset, `/projects` = all), rendered through one shared grid component.

```
projects.data.ts  ──►  ProjectGridComponent  ──►  PortfolioComponent (home, featured 3)
(PortfolioItem[])                             └─►  projects.ts route  (/projects, all 8)
```

### 1. Shared data — `projects.data.ts`

New file `libs/portfolio/home/feature/src/lib/portfolio/projects.data.ts`.
Move the `PortfolioItem` interface and the items array out of
`portfolio.component.ts` into this file. Add a `featured?: boolean` field to the
interface.

`PortfolioItem` shape (unchanged except the new flag):

```ts
interface PortfolioItem {
  id: number
  title: string
  description: string
  imageUrl: string
  technologies: { name: string; icon: string }[]
  projectUrl: string
  featured?: boolean
}
```

> Note: `technologies[].icon` is vestigial — the card template only renders
> `{{ tech.name }}` as a pill. Keep the field for consistency with existing
> entries; icon values need not be meaningful.

Export a single `PORTFOLIO_ITEMS: PortfolioItem[]` constant, ordered
featured-first:

1. **Xoài** (`featured: true`)
2. **CodeMagpie** (`featured: true`)
3. **LogiChat** (`featured: true`) — existing entry, add the flag
4. DailyMastery
5. TechLeadPilot
6. Techcater
7. PDFun
8. SafePlate

New entries:

**Xoài**
- title: `Xoài (Voice Assistant for Apple Watch)`
- description: `Your second brain on your wrist. Tap your Apple Watch, ask out loud, and Xoài speaks back a live, web-grounded answer — hands-free, eyes-free. A native watchOS assistant that captures the small questions you'd otherwise let go.`
- imageUrl: `assets/images/home/xoai.png`
- technologies: watchOS, SwiftUI, Gemini, Google Search, Sign in with Apple
- projectUrl: `https://heyxoai.com`

**CodeMagpie**
- title: `CodeMagpie (AI Coding Agent)`
- description: `A GitHub App that writes code and reviews PRs when you @mention it. Reviewer, implementer, and resolver agents share one model-agnostic backend built on the Claude Agent SDK.`
- imageUrl: `assets/images/home/codemagpie.png`
- technologies: Claude Agent SDK, GitHub App, TypeScript, Node.js, Model-agnostic LLM
- projectUrl: `https://codemagpie.com`

### 2. `ProjectGridComponent`

New component `libs/portfolio/home/feature/src/lib/portfolio/project-grid.component.ts`.

- selector: `dalenguyen-project-grid`
- `@Input({ required: true }) items: PortfolioItem[]`
- Template: the **existing** card-grid markup from `portfolio.component.ts`
  (the `<div class="grid ...">` block and its `@for (project of ...)` card),
  moved verbatim, iterating over `items` instead of `portfolioItems`.
- Imports `RevealDirective` (used by the cards today).
- `ChangeDetectionStrategy.OnPush`, standalone.

### 3. `PortfolioComponent` (home section) — modified

- Keeps the `<section id="portfolio">` wrapper and its "Project Gallery" header.
- Body becomes `<dalenguyen-project-grid [items]="featured" />`.
- `featured = PORTFOLIO_ITEMS.filter((p) => p.featured)`.
- Adds a "View all projects →" link below the grid, routing to `/projects`
  (Angular `routerLink="/projects"`; import `RouterLink`).
- Drops the now-removed `portfolioItems` array and `PortfolioItem` interface
  (moved to `projects.data.ts`).

### 4. `/projects` route

New file `apps/blog-app/src/app/routes/projects.ts`, following the `resume.ts`
route pattern:

- `routeMeta`: title `Projects | Dale Nguyen`, a description, and OG tags
  (`og:title`, `og:description`, `og:url` = `https://dalenguyen.me/projects`).
- Standalone component that imports `ProjectGridComponent`, renders a page header
  ("Projects" + short subtitle) and `<dalenguyen-project-grid [items]="projects" />`.
- `projects = PORTFOLIO_ITEMS` (all 8).

### 5. Public API export

`libs/portfolio/home/feature/src/index.ts` currently exports only
`home.component`. Add exports for `ProjectGridComponent` and the project data
(`PORTFOLIO_ITEMS`, `PortfolioItem`) so the app route can import them via
`@dalenguyen/portfolio/home/feature`.

### 6. Nav — `nav.component.html`

The "Digital Portfolio" `<li>`:

- `(click)="scroll('portfolio')"` → `(click)="navigateTo('projects')"`
- `[ngClass]="isActive('portfolio')"` → `[ngClass]="isActive('projects')"`
- Label text ("Digital Portfolio") and icon unchanged.

`navigateTo` / `isActive` already exist in `nav.component.ts`; no TS change
needed. The `#portfolio` section id stays on the home page (harmless; the "View
all" link and home section still work).

### 7. Prerender

Add `'/projects'` to the `prerender.routes` array in
`apps/blog-app/vite.config.ts` (alongside `/`, `/blog`, `/learn`,
`/bucket-list`, `/resume`). Required so the static Vercel build serves it (an
omitted route 404s on Vercel).

### 8. Images

Screenshot the hero sections of the two live sites and save as PNG under
`libs/portfolio/shared/assets/images/home/` (served at `/assets/images/home/…`
via `publicDir: '../../libs/portfolio/shared'`):

- `xoai.png` ← `https://heyxoai.com`
- `codemagpie.png` ← `https://codemagpie.com`

Match the aspect/size sensibility of existing home images (cards crop to a
`h-48` band via `object-cover`, so a landscape hero screenshot works well).

## Testing / Verification

- `portfolio.component.spec.ts` currently only asserts creation. Keep it green;
  add a minimal spec for `ProjectGridComponent` (creates with an `items` input).
- Run the blog-app build to confirm the new route prerenders and the lib
  compiles.
- Open a PR and verify the **Vercel preview** (not the apex) per
  `apps/blog-app/CLAUDE.md`:
  - `/` shows exactly 3 featured cards + a working "View all projects →" link.
  - `/projects` shows all 8 cards; Xoài and CodeMagpie images render.
  - "Digital Portfolio" nav item routes to `/projects`.
  - No console errors.

## Out of scope

- No redesign of the card visuals or the home layout beyond the featured/all
  split and the "View all" link.
- No pruning of existing projects (all 6 retained per user decision).
- No new Nx lib — the projects page reuses the existing
  `@dalenguyen/portfolio/home/feature` lib.

## Files touched

| File | Change |
| --- | --- |
| `libs/.../portfolio/projects.data.ts` | **new** — interface + `PORTFOLIO_ITEMS` (8) |
| `libs/.../portfolio/project-grid.component.ts` | **new** — reusable grid |
| `libs/.../portfolio/portfolio.component.ts` | featured subset + "View all" link |
| `libs/.../home/feature/src/index.ts` | export grid + data |
| `libs/.../portfolio/project-grid.component.spec.ts` | **new** — minimal spec |
| `apps/blog-app/src/app/routes/projects.ts` | **new** — `/projects` page |
| `apps/blog-app/vite.config.ts` | add `/projects` to prerender routes |
| `libs/.../shell/ui/src/lib/nav/nav.component.html` | nav item → `/projects` |
| `libs/portfolio/shared/assets/images/home/xoai.png` | **new** — screenshot |
| `libs/portfolio/shared/assets/images/home/codemagpie.png` | **new** — screenshot |
