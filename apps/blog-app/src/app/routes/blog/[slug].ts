import { injectContent, injectContentFiles, MarkdownComponent } from '@analogjs/content'
import { RouteMeta } from '@analogjs/router'
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common'
import {
  AfterViewInit,
  ApplicationRef,
  Component,
  ComponentRef,
  computed,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  OnDestroy,
  PLATFORM_ID,
  runInInjectionContext,
  viewChild,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { readingTimes } from 'virtual:reading-time-manifest'
import { PostAttributes } from '../../blog/models'
import { postMetaResolver, postTitleResolver } from '../../blog/resolvers'

export const routeMeta: RouteMeta = {
  title: postTitleResolver,
  meta: postMetaResolver,
}

@Component({
  standalone: true,
  imports: [CommonModule, MarkdownComponent, RouterLink],
  template: `
      <div class="relative mx-auto max-w-3xl px-6 lg:px-8">
        <nav class="flex py-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <a routerLink="/" class="inline-flex items-center text-sm font-medium text-fg-muted hover:text-accent transition-colors">
                <svg class="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                Home
              </a>
            </li>
            <li>
              <div class="flex items-center">
                <svg class="w-3 h-3 text-fg-muted mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                </svg>
                <a routerLink="/blog" class="ml-1 text-sm font-medium text-fg-muted hover:text-accent md:ml-2 transition-colors">Blog</a>
              </div>
            </li>
            <li aria-current="page" *ngIf="post()as post">
              <div class="flex items-center">
                <svg class="w-3 h-3 text-fg-muted mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span class="ml-1 text-sm font-medium text-fg md:ml-2 truncate whitespace-nowrap overflow-hidden max-w-[120px] sm:max-w-[180px] md:max-w-[240px]">{{ post.attributes.title }}</span>
              </div>
            </li>
          </ol>
        </nav>
        <div class="mx-auto max-w-prose text-lg text-center mt-8">

          <ng-container *ngIf="post() as post">

            <!-- Feature image display (LCP). Serve a WebP variant when the cover
                 is a local PNG; the PNG stays the fallback and the og:image. -->
            <div class="mb-8 rounded-2xl overflow-hidden shadow-lg ring-1 ring-border">
              <picture>
                @if (coverWebp()) {
                  <source type="image/webp" [srcset]="coverWebp()" />
                }
                <img
                  [src]="post.attributes.coverImage"
                  [alt]="post.attributes.title"
                  fetchpriority="high"
                  decoding="async"
                  class="w-full h-auto object-cover max-h-[400px]"
                />
              </picture>
            </div>

            <h1 class="text-fg">{{ post.attributes.title }}</h1>

            <!-- Categories display -->
            <div class="flex flex-wrap justify-center gap-2 mb-6">
              @for (category of post.attributes.categories; track category) {
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-600/15 text-accent ring-1 ring-border">
                  {{ category | titlecase }}
                </span>
              }
            </div>

            <!-- Author and publication date -->
            <div class="flex items-center justify-center mb-8">
              <div class="flex items-center">
                <img
                  [src]="post.attributes.profileImage"
                  [alt]="'Photo of ' + post.attributes.author"
                  class="w-10 h-10 rounded-full ring-2 ring-border mr-3"
                />
                <div class="text-left">
                  <div class="font-medium text-fg">
                    {{ post.attributes.author }}
                  </div>
                  <div class="text-sm text-fg-muted flex items-center gap-3">
                    <span class="inline-flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <time [attr.datetime]="post.attributes.published">
                        {{ post.attributes.published | date: 'longDate' }}
                      </time>
                    </span>
                    @if (readingMinutes(); as mins) {
                      <span class="inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ mins }} min read
                      </span>
                    }
                  </div>
                </div>
              </div>
            </div>

            @if (series()) {
            <div class="text-center mb-8 border border-border rounded-xl bg-surface p-4">
              <h3 class="text-xl font-bold text-fg mb-2">{{ series()!.name }} ({{ series()!.count }} Part Series)</h3>
              <div class="text-left mx-auto max-w-md text-base">
                @for (post of series()!.posts; track post.slug; let i = $index) {
                  <div class="my-2">
                      <span class="mr-2 font-medium bg-indigo-600/15 text-accent px-2 py-1 rounded-full">{{ i + 1 }}</span>
                      @if (post.isCurrent) {
                        <span class="font-semibold text-accent">{{ post.displayTitle }}</span>
                      } @else {
                        <a [routerLink]="['/blog', post.slug]" class="text-accent hover:underline underline-offset-2">
                          <span>{{ post.displayTitle }}</span>
                        </a>
                      }
                  </div>
                }
              </div>
            </div>
          }

            <analog-markdown [content]="post.content" />

            <!-- Share row. Renders after the markdown body and before the
                 comments section. Each anchor carries the post slug/title in
                 data-* attrs; the full share URL (which needs the page origin)
                 is wired up by attachShareButtons() in the browser, so this
                 markup is SSG/prerender-safe (no window/navigator access at
                 build or render time). The static hrefs are sensible fallbacks
                 if JS is disabled. -->
            <div
              class="share-row not-prose mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-2 sm:gap-3"
              [attr.data-slug]="post.attributes.slug"
              [attr.data-title]="post.attributes.title"
            >
              <span class="text-sm text-fg-muted mr-1 sm:mr-2 self-center">Share</span>

              <a
                href="https://twitter.com/intent/tweet?text={{ post.attributes.title }}"
                target="_blank"
                rel="noopener noreferrer"
                data-share="x"
                aria-label="Share on X"
                class="share-btn inline-flex items-center justify-center h-9 w-9 rounded-full bg-surface-2 text-fg-muted ring-1 ring-border hover:text-accent hover:ring-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2H21.5l-7.51 8.58L23 22h-6.79l-5.32-6.49L4.8 22H1.54l8.03-9.17L1 2h6.91l4.81 5.95L18.244 2zm-1.19 18h1.88L7.04 4H5.06l11.994 16z"/>
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/sharing/share-offsite/"
                target="_blank"
                rel="noopener noreferrer"
                data-share="linkedin"
                aria-label="Share on LinkedIn"
                class="share-btn inline-flex items-center justify-center h-9 w-9 rounded-full bg-surface-2 text-fg-muted ring-1 ring-border hover:text-accent hover:ring-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 11-.01-4.14 2.07 2.07 0 01.01 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z"/>
                </svg>
              </a>

              <a
                href="https://www.reddit.com/submit?title={{ post.attributes.title }}"
                target="_blank"
                rel="noopener noreferrer"
                data-share="reddit"
                aria-label="Share on Reddit"
                class="share-btn inline-flex items-center justify-center h-9 w-9 rounded-full bg-surface-2 text-fg-muted ring-1 ring-border hover:text-accent hover:ring-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.01 4.74a1.41 1.41 0 011.4 1.41c0 .78-.63 1.41-1.4 1.41-.78 0-1.41-.63-1.41-1.41 0-.78.63-1.41 1.41-1.41zM12 5.07c2.86 0 5.31 1.81 6.24 4.34 1.07-.32 2.18.21 2.62 1.23.45 1.04.07 2.26-.89 2.85.01.16.02.32.02.48 0 3.42-3.57 6.19-7.99 6.19s-7.99-2.77-7.99-6.19c0-.16.01-.32.02-.48-.96-.59-1.34-1.81-.89-2.85.44-1.02 1.55-1.55 2.62-1.23.93-2.53 3.38-4.34 6.24-4.34zm-3.13 6.36c-.62 0-1.13.5-1.13 1.13 0 .62.5 1.13 1.13 1.13.62 0 1.13-.5 1.13-1.13 0-.63-.5-1.13-1.13-1.13zm6.26 0c-.62 0-1.13.5-1.13 1.13 0 .62.5 1.13 1.13 1.13.62 0 1.13-.5 1.13-1.13 0-.63-.5-1.13-1.13-1.13zm-3.13 3.65c-.88 0-1.71-.29-2.36-.78-.21-.16-.51-.11-.66.1-.16.21-.11.51.1.66.8.6 1.83.97 2.92.97s2.12-.37 2.92-.97c.21-.16.26-.45.1-.66-.16-.21-.45-.26-.66-.1-.65.49-1.48.78-2.36.78z"/>
                </svg>
              </a>

              <a
                href="https://news.ycombinator.com/submitlink"
                target="_blank"
                rel="noopener noreferrer"
                data-share="hn"
                aria-label="Share on Hacker News"
                class="share-btn inline-flex items-center justify-center h-9 w-9 rounded-full bg-surface-2 text-fg-muted ring-1 ring-border hover:text-accent hover:ring-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M0 0v24h24V0H0zm12.34 17.05h-1.45v-5.36l-2.5 5.36h-1.17l-2.5-5.36v5.36H3.34v-7.4h1.78l2.69 5.78 2.69-5.78h1.78l.06 7.4zm5.6-2.5h-1.45v2.5h-1.45v-2.5h-1.45v-1.45h1.45v-1.45h1.45v1.45h1.45v1.45z"/>
                </svg>
              </a>

              <button
                type="button"
                data-share="copy"
                aria-label="Copy link"
                class="share-btn inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-surface-2 text-fg-muted ring-1 ring-border hover:text-accent hover:ring-accent transition-colors text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 015.656 5.656l-3 3a4 4 0 01-5.656-5.656m-3.656-3.656a4 4 0 00-5.656 5.656l3 3a4 4 0 005.656-5.656" />
                </svg>
                <span class="share-copy-label">Copy link</span>
              </button>
            </div>
          </ng-container>


        </div>
      </div>

      <!-- Comments section -->
      <div class="mx-auto max-w-prose mt-12 mb-12">
        <div #giscusContainer class="giscus-container"></div>
      </div>
  `,
})
export default class BlogPostComponent implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT)
  private readonly injector = inject(Injector)
  private readonly envInjector = inject(EnvironmentInjector)
  private readonly appRef = inject(ApplicationRef)
  private readonly platformId = inject(PLATFORM_ID)
  private chartRefs: ComponentRef<unknown>[] = []
  private giscusObserver?: IntersectionObserver
  readonly post = toSignal(injectContent<PostAttributes>())

  // Estimated reading time (minutes) from the build-time manifest.
  readonly readingMinutes = computed(() => readingTimes[this.post()?.attributes.slug ?? ''] ?? 0)

  // WebP srcset for the cover image, but only for local blog PNGs (which have a
  // generated .webp sibling). External covers (e.g. ButterCMS) and covers that
  // are already .webp fall through to the plain <img>. The path is made
  // root-relative so the <source> loads from whatever origin serves the page
  // (preview or prod) — an absolute prod URL would 404 on preview builds, and a
  // <source> does not fall back to the <img> on a load error.
  readonly coverWebp = computed(() => {
    const url = this.post()?.attributes.coverImage
    const match = url?.match(/\/assets\/images\/blog\/[A-Za-z0-9_.-]+\.png$/)
    return match ? match[0].replace(/\.png$/, '.webp') : null
  })

  readonly series = computed(() => {
    const series = this.post()?.attributes.series

    if (!series) {
      return null
    }

    const allPosts = runInInjectionContext(this.injector, () => {
      return injectContentFiles<PostAttributes>((contentFile) => contentFile.filename.includes('/src/content'))
    })

    const seriesPosts = allPosts
      .filter((post) => post.attributes.series === series)
      // Sort by published date (oldest first for sequential reading)
      .sort((a, b) => a.attributes.published.localeCompare(b.attributes.published))
      .map((post) => {
        // Get only the part after the dash in the title
        const titleParts = post.attributes.title.split(' - ')
        const displayTitle = titleParts.length > 1 ? titleParts[1].trim() : post.attributes.title

        return {
          ...post,
          displayTitle,
        }
      })

    return {
      name: series,
      count: seriesPosts.length,
      posts: seriesPosts.map((post) => ({
        title: post.attributes.title,
        displayTitle: post.displayTitle,
        slug: post.attributes.slug,
        isCurrent: post.attributes.slug === this.post()?.attributes.slug,
      })),
    }
  })

  // Using viewChild with signal-based approach
  giscusContainer = viewChild<ElementRef>('giscusContainer')

  ngAfterViewInit() {
    this.lazyLoadGiscus()
    effect(() => {
      if (this.post()) {
        setTimeout(() => {
          this.addCopyButtons()
          this.attachShareButtons()
          void this.mountCharts().catch((error) => console.error('Failed to mount charts', error))
        })
      }
    }, { injector: this.injector })
  }

  ngOnDestroy() {
    this.giscusObserver?.disconnect()
    this.giscusObserver = undefined
    this.destroyMountedCharts()
  }

  // Mount interactive Angular chart components into any `<div data-chart="…">`
  // placeholders in the rendered markdown. Lazy-loaded so only posts that use
  // charts pull the chart code in. Browser-only.
  private async mountCharts() {
    if (!isPlatformBrowser(this.platformId)) return
    const slug = this.post()?.attributes.slug
    if (!slug || !this.document.querySelector('[data-chart]')) return
    const { mountInteractiveCharts } = await import('../../blog/charts/mount-charts')
    this.destroyMountedCharts()
    this.chartRefs = await mountInteractiveCharts(this.document, this.envInjector, this.appRef, slug)
  }

  // Detach and destroy any charts mounted by a previous render so their views
  // don't leak on the ApplicationRef across navigations.
  private destroyMountedCharts() {
    for (const ref of this.chartRefs) {
      this.appRef.detachView(ref.hostView)
      ref.destroy()
    }
    this.chartRefs = []
  }

  private addCopyButtons() {
    if (!isPlatformBrowser(this.platformId)) return
    const doc = this.document
    doc.querySelectorAll('pre').forEach((pre) => {
      const wrapper = doc.createElement('div')
      wrapper.style.cssText = 'position:relative'
      pre.parentNode!.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)

      const btn = doc.createElement('button')
      btn.textContent = 'Copy'
      btn.style.cssText =
        'position:absolute;top:0.5rem;right:0.5rem;padding:0.25rem 0.6rem;font-size:0.75rem;background:rgb(var(--surface-2));color:rgb(var(--fg-muted));border:1px solid rgb(var(--border));border-radius:6px;cursor:pointer;opacity:0.85'
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code')?.innerText ?? pre.innerText
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = 'Copied!'
          setTimeout(() => (btn.textContent = 'Copy'), 2000)
        })
      })
      wrapper.appendChild(btn)
    })
  }

  // Wire up the share row at the end of the post. The anchor/button markup is
  // rendered statically (SSG-safe) with the slug/title in data-* attrs; here in
  // the browser we read them and rewrite each share target with a full
  // canonical URL (origin + /blog/<slug>). This keeps window/navigator access
  // out of prerender, matching the `isPlatformBrowser` guard pattern used by
  // addCopyButtons/lazyLoadGiscus above.
  private attachShareButtons() {
    if (!isPlatformBrowser(this.platformId)) return
    const doc = this.document
    const row = doc.querySelector<HTMLElement>('.share-row')
    if (!row) return
    const slug = row.dataset['slug']
    const title = row.dataset['title'] ?? ''
    if (!slug) return

    const url = `${window.location.origin}/blog/${slug}`
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)

    // Each entry: data-share attr -> absolute share-intent URL built with the
    // canonical post URL. `url=` is set where the intent accepts it; `text`/
    // `title` is set where the intent expects the headline.
    const intents: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      hn: `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`,
    }

    Object.entries(intents).forEach(([key, href]) => {
      const el = row.querySelector<HTMLAnchorElement>(`[data-share="${key}"]`)
      if (el) el.href = href
    })

    const copyBtn = row.querySelector<HTMLButtonElement>('[data-share="copy"]')
    if (copyBtn) {
      const label = copyBtn.querySelector<HTMLSpanElement>('.share-copy-label')
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(url).then(
          () => {
            if (label) {
              const original = label.textContent ?? 'Copy link'
              label.textContent = 'Copied!'
              setTimeout(() => (label.textContent = original), 2000)
            }
          },
          () => {
            // Fallback for environments without clipboard write permission:
            // select-and-copy the canonical URL into a hidden textarea.
            const ta = doc.createElement('textarea')
            ta.value = url
            ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
            doc.body.appendChild(ta)
            ta.select()
            try {
              doc.execCommand('copy')
              if (label) {
                const original = label.textContent ?? 'Copy link'
                label.textContent = 'Copied!'
                setTimeout(() => (label.textContent = original), 2000)
              }
            } finally {
              doc.body.removeChild(ta)
            }
          },
        )
      })
    }
  }

  // Defer the giscus comments embed until the reader scrolls near it. Giscus
  // pulls in a third-party script + iframe; loading it eagerly added blocking
  // work to first load. An IntersectionObserver loads it just-in-time, so it
  // costs nothing for readers who never reach the comments (and during audits).
  private lazyLoadGiscus() {
    if (!isPlatformBrowser(this.platformId)) return
    const container = this.giscusContainer()?.nativeElement
    if (!container) {
      console.error('Giscus container not found')
      return
    }

    if (!('IntersectionObserver' in window)) {
      this.injectGiscus(container)
      return
    }

    this.giscusObserver = new IntersectionObserver(
      (entries, obs) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          obs.disconnect()
          this.giscusObserver = undefined
          this.injectGiscus(container)
        }
      },
      { rootMargin: '600px 0px' },
    )
    this.giscusObserver.observe(container)
  }

  private injectGiscus(container: HTMLElement) {
    const script = this.document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', 'dalenguyen/dalenguyen.github.io')
    script.setAttribute('data-repo-id', 'MDEwOlJlcG9zaXRvcnkyMDM2MzkxOTc=')
    script.setAttribute('data-category', 'Announcements')
    script.setAttribute('data-category-id', 'DIC_kwDODCNJnc4CoEkP')
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', 'transparent_dark')
    script.setAttribute('data-lang', 'en')
    script.setAttribute('data-loading', 'lazy')
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    // Add the script to the giscus container
    container.appendChild(script)
  }
}