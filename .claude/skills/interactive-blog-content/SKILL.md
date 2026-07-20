---
name: interactive-blog-content
description: >-
  This skill should be used when adding interactive elements — charts, sliders,
  step-through diagrams, or any custom Angular widget — to a markdown blog post in
  apps/blog-app (the AnalogJS blog on dalenguyen.me). It documents the placeholder +
  co-located manifest + glob auto-discovery + dynamic-mount architecture, the reusable
  BarChartComponent, and the non-obvious gotchas (escaping inline tags, ShadowDom,
  SSR-safety) needed to ship a working interactive post.
---

# Interactive Blog Content

## Overview

Markdown posts in `apps/blog-app/src/content/*.md` are rendered by `<analog-markdown>`.
Raw HTML survives (it is passed through `bypassSecurityTrustHtml`) but inline `<script>`
never runs, so interactivity is achieved by **mounting real Angular components into
placeholder elements after the markdown renders**.

The mechanism is already built and shared — do not reinvent it. Each post stays
self-contained: a `<slug>.md` plus an adjacent `<slug>/` folder holding its components,
data, and a `charts.ts` manifest. A glob auto-discovers manifests, so **no central file
is ever edited** when adding a new interactive post.

## When to use

Use this skill whenever a blog post in `apps/blog-app` needs something the reader can
interact with: live charts, a slider/calculator, a toggle, an animated or step-through
diagram, or any bespoke widget. For static posts (text, images, code blocks only), this
skill is unnecessary.

## The three-step recipe

1. **Placeholder** — in the `.md`, drop an empty div with a `data-chart` key and a
   plain-text fallback (shown with no JS / before mount):
   ```html
   <div data-chart="speed">Chart: decode speed by prompt length. Enable JavaScript to view.</div>
   ```

2. **Manifest** — in the co-located folder `src/content/<slug>/`, create `charts.ts` whose
   default export maps each `data-chart` key to a component (and optional `inputs`):
   ```ts
   import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
   import { ChartManifest } from '../../app/blog/charts/mount-charts'
   import { speedConfig } from './speed.data'
   import { MyWidgetComponent } from './my-widget.component'

   const manifest: ChartManifest = {
     speed: { component: BarChartComponent, inputs: { config: speedConfig } },
     'my-key': { component: MyWidgetComponent },
   }
   export default manifest
   ```

3. **Done** — `mount-charts.ts` discovers the manifest via
   `import.meta.glob('/src/content/*/charts.ts')`; the `[slug]` route mounts the components
   after render. Nothing else to wire.

## Two paths for the component

- **Reuse the shared chart** — for bar charts, reuse
  `src/app/blog/charts/bar-chart.component.ts` and only author data: a co-located
  `*.data.ts` exporting a `BarChartConfig` (type in `src/app/blog/charts/chart.types.ts`).
  Supports single-series and grouped series, an optional metric toggle, and tooltips.
- **Bespoke component** — for anything else, write a standalone Angular component in the
  post folder. See `references/component-templates.md` for a ready-to-adapt ShadowDom,
  signal-based skeleton.

## Gotchas (read before authoring — each has bitten this codebase)

- **Escape raw tags in INLINE code.** The markdown renderer emits inline-code content
  *unescaped*, so a single-backtick `` `<script>` `` becomes a live element that swallows
  the rest of the article (the post silently cuts off at that point). Inside single-backtick
  spans write entities: `` `&lt;script&gt;` `` , `` `&lt;div&gt;` `` , `` `&lt;slug&gt;` ``.
  Fenced code blocks (```` ``` ````) are Prism-escaped and safe as-is — use them for
  multi-line examples and to demonstrate tags.
- **Style isolation = ShadowDom.** Bespoke components must use
  `encapsulation: ViewEncapsulation.ShadowDom` so the light article CSS (and inherited
  `text-center`/`text-lg`) cannot leak in. Tradeoff: global Tailwind utilities cannot cross
  the shadow boundary, so components **self-style** with the dark "figure card" palette
  (bg `#161b22`, border `#30363d`, accent `#7c9cff`, text `#e6edf3`, muted `#9aa7b5`,
  darker `#0b0f16`).
- **tsconfig include.** `apps/blog-app/tsconfig.app.json` already includes
  `src/content/**/*.ts` and `src/app/blog/**/*.ts`. These are required because
  `import.meta.glob` is not statically resolvable; do not remove them, or content `.ts`
  files are served untranspiled (`Missing initializer in const declaration`).
- **SSR-safe.** Mounting is browser-only; during prerender the fallback text is what ships
  (good for SEO / no-JS). Do not access `window`/`document` at construction time.
- **Clean up side effects.** Any component using `setInterval`/`setTimeout`/listeners must
  clear them in `ngOnDestroy` — the route detaches and destroys mounted views on navigation.
- **Multi-chip rows (steppers, tab bars) must fit the ~660px content column.** A horizontal
  row of N labeled "chips" wraps two ugly ways at blog width: labels break mid-phrase when chips
  are forced to equal width with `flex: 1 1 0` (flex-basis `0` ignores the label), or a lone chip
  drops to a second row when the chips' natural total exceeds the column and each is allowed to
  grow. Author chips to size to their content and keep labels on one line — `flex: 1 1 auto;
  min-width: 0` on the chip, `white-space: nowrap` on the label — and keep the per-chip footprint
  small (compact padding, gap, and any number badge) so all N fit one row at ~660px. It still
  wraps as whole chips on true mobile. See the stepper block in `references/component-templates.md`.

## Canonical examples in the repo

The post `apps/blog-app/src/content/2026-06-14-interactive-charts-analogjs-markdown/` is the
living reference and contains three patterns to copy from:
- `demo.data.ts` — reusing the shared `BarChartComponent` (data only).
- `kv-slider.component.ts` — a bespoke single-output slider (signals + computed).
- `mount-flow.component.ts` — a bespoke step-through diagram (clickable stepper, Play/Prev/Next,
  interval cleaned up in `ngOnDestroy`).

Shared engine: `src/app/blog/charts/` (`bar-chart.component.ts`, `chart.types.ts`,
`mount-charts.ts`). The route that mounts: `src/app/routes/blog/[slug].ts`.

## Verify before finishing

1. Production build: `npx nx build blog-app` must exit 0 and the post must prerender to
   `.vercel/output/static/blog/<slug>/index.html`.
2. Browser check (Chrome MCP): serve `npx nx serve blog-app`, open
   `http://localhost:<port>/blog/<slug>` (reload with cache ignored), confirm each widget
   mounts, is interactive, AND that content **after** every widget still renders (catches the
   inline-tag truncation gotcha).
   - **Check layout at the real content width (~640–720px), not a wide 900px+ viewport** — a
     wide window lets chip/stepper rows fit and hides mid-label wrapping. "Mounts and is
     clickable" is NOT enough; a stepper can be fully functional and still visually ragged.
   - ShadowDom hides a widget's internals from a plain `document.querySelector`. To measure
     chips, find the host (`[...document.querySelectorAll('*')].find(e => e.shadowRoot?.querySelector('.stepper'))`)
     and inspect `host.shadowRoot`; confirm each chip is one row (`labelEl.scrollHeight` ≈ one
     line) and the stepper is a single row at that width.
   - Prefer verifying on the PR's **Vercel preview** (clean build) over a long-lived local dev
     server, which can serve a stale glob for brand-new content files.

See `references/component-templates.md` for copy-paste skeletons.
