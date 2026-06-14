---
title: "How to Embed Interactive Charts in AnalogJS Markdown Blog Posts"
slug: 2026-06-14-interactive-charts-analogjs-markdown
description: Step-by-step guide to mounting live Angular components into AnalogJS markdown posts — no central registry, co-located manifests, SSR-safe, zero style leaks.
categories: ['analogjs', 'angular', 'markdown', 'frontend', 'tutorial']
coverImage: https://dalenguyen.me/assets/images/blog/interactive-charts-analogjs-markdown.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-06-14T10:00:00.000Z
author: Dale Nguyen
draft: false
---

Static markdown is great for most blog posts. But occasionally you want a reader to *interact* with the content — drag a slider, hover a bar to see the exact value. AnalogJS does not ship that capability out of the box, but the pieces are all there. This post documents the architecture that powers the live charts you see on this blog, and shows you exactly how to add your own.

The two widgets below are live — hover the bars, drag the slider.

<div data-chart="demo-bars">Chart: median render time across three frameworks. Enable JavaScript to view.</div>

<div data-chart="slider-demo">Interactive widget: KV-cache memory estimator — drag the slider to see how memory grows with context length. Enable JavaScript to view.</div>

## The problem: `&lt;script&gt;` tags don't work in markdown

Analog renders markdown via the `&lt;analog-markdown&gt;` component. Raw HTML in the markdown source *does* survive — Analog passes it through Angular's `bypassSecurityTrustHtml` — so a bare `&lt;div&gt;` or `&lt;figure&gt;` will land in the DOM. But inline `&lt;script&gt;` tags never run; even if they did, a script injected into an already-bootstrapped Angular app won't execute.

The solution is to leave an empty **placeholder element** in the markdown and mount a real Angular component into it *after* the markdown has rendered.

## Step 1 — Write a placeholder in the markdown

In your `.md` file, drop an empty `&lt;div&gt;` with a `data-chart` attribute and a plain-text fallback. The fallback is shown when JavaScript is off or before the component mounts:

```html
<div data-chart="speed">Chart: decode speed by prompt length.</div>
```

The value of `data-chart` is your **key**. You can have as many as you like per post; the mounter finds them all with `querySelectorAll('[data-chart]')`.

## Step 2 — Create a co-located manifest

Next to your markdown file `src/content/&lt;slug&gt;.md`, create a folder `src/content/&lt;slug&gt;/` and put a `charts.ts` inside it. Its default export maps every `data-chart` key to an Angular component — and optional `inputs` to pass to it:

```ts
// src/content/my-post/charts.ts
import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { speedConfig } from './benchmark.data'

const manifest: ChartManifest = {
  speed: { component: BarChartComponent, inputs: { config: speedConfig } },
}

export default manifest
```

That is the entire per-post registration. There is no central file to edit.

## Step 3 — Understand the generic mounter

The shared mounter lives at `apps/blog-app/src/app/blog/charts/mount-charts.ts`. The key line is:

```ts
const manifests = import.meta.glob<{ default: ChartManifest }>('/src/content/*/charts.ts')
```

Vite resolves this glob at build time and creates a lazy import for every `charts.ts` it finds under `src/content/`. When `mountInteractiveCharts` is called for a particular slug it loads *only* that post's manifest, finds the `[data-chart]` placeholders in the already-rendered DOM, clears the fallback text, and mounts each component:

```ts
export async function mountInteractiveCharts(
  root: ParentNode,
  envInjector: EnvironmentInjector,
  appRef: ApplicationRef,
  slug: string,
): Promise<ComponentRef<unknown>[]> {
  const loader = manifests[`/src/content/${slug}/charts.ts`]
  if (!loader) return []

  const registry = (await loader()).default ?? {}
  const refs: ComponentRef<unknown>[] = []

  root.querySelectorAll<HTMLElement>('[data-chart]').forEach((host) => {
    if (host.dataset['mounted']) return
    const entry = registry[host.dataset['chart'] ?? '']
    if (!entry) return

    host.innerHTML = '' // drop the no-JS fallback caption
    const ref = createComponent(entry.component, { hostElement: host, environmentInjector: envInjector })
    if (entry.inputs) {
      for (const [key, value] of Object.entries(entry.inputs)) ref.setInput(key, value)
    }
    appRef.attachView(ref.hostView)
    ref.changeDetectorRef.detectChanges()
    host.dataset['mounted'] = 'true'
    refs.push(ref)
  })

  return refs
}
```

`createComponent` with a `hostElement` turns the placeholder div into the component's host node. `setInput` applies any `inputs` from the manifest. `appRef.attachView` registers the view with Angular's change-detection tree. The `data-mounted` flag prevents double-mounting if the effect fires more than once.

## Step 4 — How the route triggers the mounter

The blog post route (`apps/blog-app/src/app/routes/blog/[slug].ts`) drives everything. In `ngAfterViewInit` it sets up an `effect` that watches for the post signal to resolve, then calls `mountCharts`:

```ts
ngAfterViewInit() {
  this.loadGiscusScript()
  effect(() => {
    if (this.post()) {
      setTimeout(() => {
        this.addCopyButtons()
        void this.mountCharts().catch((error) => console.error('Failed to mount charts', error))
      })
    }
  }, { injector: this.injector })
}
```

The `setTimeout` (with no delay) yields to the microtask queue so the markdown has finished rendering into the DOM before the mounter scans for placeholders.

`mountCharts` itself is browser-only and lazy-loads the mounter module on first call:

```ts
private async mountCharts() {
  if (!isPlatformBrowser(this.platformId)) return
  const slug = this.post()?.attributes.slug
  if (!slug || !this.document.querySelector('[data-chart]')) return
  const { mountInteractiveCharts } = await import('../../blog/charts/mount-charts')
  this.destroyMountedCharts()
  this.chartRefs = await mountInteractiveCharts(this.document, this.envInjector, this.appRef, slug)
}
```

`isPlatformBrowser` is the SSR guard. During prerendering the platform is `server`, so `mountCharts` returns immediately and no DOM manipulation happens. This means the post prerenders cleanly with the fallback text visible.

`ngOnDestroy` cleans up so components do not leak across navigations:

```ts
private destroyMountedCharts() {
  for (const ref of this.chartRefs) {
    this.appRef.detachView(ref.hostView)
    ref.destroy()
  }
  this.chartRefs = []
}

ngOnDestroy() {
  this.destroyMountedCharts()
}
```

## The mounting process, step by step

Here is the whole pipeline in one interactive view. Step through it — or hit **Play** — and watch a placeholder turn into a live component:

<div data-chart="mount-flow">Interactive diagram of the six stages that turn a chart placeholder into a mounted Angular component. Enable JavaScript to view.</div>

Fittingly, that diagram is itself one of these mounted components — a bespoke `MountFlowComponent` registered under the `mount-flow` key in this post's `charts.ts`.

## Gotcha 1 — tsconfig must include content TypeScript files

The `charts.ts` and component files you drop under `src/content/` are not part of the default TypeScript program. They are discovered only at runtime via `import.meta.glob`, which Vite resolves — but the TypeScript compiler (used for type-checking and the Nx build) needs to know about them too.

`apps/blog-app/tsconfig.app.json` already has the right `include` entries:

```json
"include": [
  "src/**/*.d.ts",
  "src/app/routes/**/*.ts",
  "src/app/pages/**/*.page.ts",
  "src/app/blog/**/*.ts",
  "src/content/**/*.ts"
]
```

Without `"src/content/**/*.ts"` the compiler treats those files as orphaned, serves them untranspiled, and you get runtime errors like `Missing initializer in const declaration` when the browser tries to parse raw TypeScript.

## Gotcha 2 — write tags as entities in inline code

This bit the live demo while writing this very post. The markdown renderer passes inline-code content through **unescaped**, so a single-backtick span containing a script tag emits a real element into the DOM. The browser treats it as a raw-text element and swallows the rest of the article — the post silently cuts off.

The fix: inside inline code, write angle brackets as HTML entities. Compare what you type in the markdown *source*:

```text
Bad:   `<script>`        becomes a live element, truncates the post
Good:  `&lt;script&gt;`   renders as the visible text <script>, safe
```

Fenced code blocks like this one are highlighted by Prism and escaped automatically, so multi-line examples are safe as-is — this only affects single-backtick spans.

## Gotcha 3 — Shadow DOM isolates chart styles from the article

Chart components use `encapsulation: ViewEncapsulation.ShadowDom`:

```ts
@Component({
  selector: 'blog-bar-chart',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  // …
})
```

The article template applies Tailwind utilities like `text-center` and `text-lg` to its content wrapper. Without shadow DOM those would leak into the chart, centering the bars and resizing the labels. Shadow DOM creates a hard style boundary so the chart's own CSS is the only CSS that applies inside it.

The tradeoff: global Tailwind utilities cannot cross that boundary either, so the chart must self-style. The components use a `#161b22` dark card with `#30363d` borders and `#7c9cff` accent — a palette that works on both light and dark article pages.

## A bespoke per-post component

You are not limited to the shared `BarChartComponent`. Any standalone Angular component works. The `kv-slider.component.ts` file in this post's folder is a self-contained example — no external dependencies, signal-based reactivity. It is the second widget at the top of this post:

```ts
@Component({
  selector: 'blog-demo-slider',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  // template + styles inline…
})
export class DemoSliderComponent {
  readonly ctx = signal(8192)
  readonly ctxLabel = computed(() => fmtCtx(this.ctx()))
  readonly mem = computed(() => fmtMem(BYTES_PER_TOKEN * this.ctx()))
  readonly pct = computed(() => (this.ctx() / MAX_CTX) * 100)
}
```

The `mem` and `pct` computed signals recalculate every time `ctx` changes, so the number and bar reflow on every slider tick — no imperative event handling, no manual DOM writes.

## Does it stay fast?

Yes — and that is the whole point of the SSR-safe, lazy design. The fallback text is what prerenders, the chart code is loaded only in the browser and only on posts that actually use it, and each widget's styles are scoped behind a shadow boundary. So the interactivity costs almost nothing on first paint. Here is this very page on PageSpeed Insights (desktop):

<figure>
  <img src="assets/images/blog/interactive-charts-pagespeed-insights.png" alt="PageSpeed Insights desktop report for this post showing Performance 97, Accessibility 90, Best Practices 100, and SEO 92" width="100%" height="auto" />
  <figcaption>PageSpeed Insights (desktop) for this very page: 97 Performance, 90 Accessibility, 100 Best Practices, 92 SEO — three live widgets and no performance tax.</figcaption>
</figure>

## Adding your own interactive widget — the full recipe

1. In your markdown, write `&lt;div data-chart="my-key"&gt;Fallback text for no-JS readers.&lt;/div&gt;`.
2. Create `src/content/&lt;your-slug&gt;/charts.ts` with a default export mapping `"my-key"` to your component (and any `inputs`).
3. That is it. The `import.meta.glob` in `mount-charts.ts` discovers the new manifest automatically — no shared file needs editing.

If you are reusing the shared `BarChartComponent`, put your data in a co-located `*.data.ts` file that exports a `BarChartConfig`. If you are building something custom, write a standalone component with `ViewEncapsulation.ShadowDom`, drop it in the same folder, and reference it in the manifest.

The architecture keeps each post entirely self-contained. Every chart, every data file, every bespoke component lives next to its markdown. Delete the post folder and everything goes with it.
