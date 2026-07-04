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
  OnInit,
  PLATFORM_ID,
  runInInjectionContext,
  signal,
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

            <!-- Share row. Sits between the article body and the comments section
                 so a reader who just finished the post is invited to share.
                 The action URLs (X, LinkedIn, Reddit, HN) are computed lazily
                 in click handlers, so the SSG/prerender output doesn't depend
                 on window — only the runtime click does. -->
            <div class="mt-10 pt-6 border-t border-border" aria-label="Share this post">
              <div class="flex flex-wrap items-center justify-center gap-3">
                <span class="text-sm font-medium text-fg-muted mr-1">Share</span>

                <a
                  [href]="shareUrl('x')"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="trackShare($event, 'x')"
                  class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-fg-muted no-underline cursor-pointer transition hover:text-accent hover:border-accent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
                  aria-label="Share on X"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M18.244 2H21l-6.52 7.453L22 22h-6.797l-5.32-6.957L3.8 22H1l7.02-8.025L1.5 2h6.957l4.81 6.36L18.244 2Zm-2.39 18.4h1.884L7.236 3.5H5.215L15.854 20.4Z"/>
                  </svg>
                  <span>X</span>
                </a>

                <a
                  [href]="shareUrl('linkedin')"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="trackShare($event, 'linkedin')"
                  class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-fg-muted no-underline cursor-pointer transition hover:text-accent hover:border-accent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
                  aria-label="Share on LinkedIn"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21h-4V9Z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>

                <a
                  [href]="shareUrl('reddit')"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="trackShare($event, 'reddit')"
                  class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-fg-muted no-underline cursor-pointer transition hover:text-accent hover:border-accent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
                  aria-label="Share on Reddit"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M22 12.07a2.2 2.2 0 0 0-3.73-1.57c-1.4-.95-3.27-1.55-5.32-1.62l1.02-4.8 3.33.7a1.55 1.55 0 1 0 .16-1.04l-3.74-.79a.5.5 0 0 0-.59.38l-1.14 5.36c-2.08.06-3.97.66-5.39 1.62A2.2 2.2 0 1 0 4.2 14.5c-.04.22-.06.45-.06.69 0 3.1 3.52 5.6 7.86 5.6 4.34 0 7.86-2.5 7.86-5.6 0-.24-.02-.47-.06-.7A2.2 2.2 0 0 0 22 12.07Zm-13.4 2.43a1.55 1.55 0 1 1 3.1 0 1.55 1.55 0 0 1-3.1 0Zm7.76 3.66c-.95.95-2.78 1.02-3.36 1.02s-2.41-.07-3.36-1.02a.43.43 0 0 1 .6-.6c.56.55 1.75.76 2.76.76s2.2-.2 2.76-.76a.43.43 0 0 1 .6.6Zm-.26-2.11a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1Z"/>
                  </svg>
                  <span>Reddit</span>
                </a>

                <a
                  [href]="shareUrl('hn')"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="trackShare($event, 'hn')"
                  class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-fg-muted no-underline cursor-pointer transition hover:text-accent hover:border-accent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
                  aria-label="Share on Hacker News"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M3 3h18v18H3V3Zm10.2 12.4 3.05-4.93h-1.86l-1.66 2.97-1.57-2.97h-1.94l3.05 4.93v3.38h.93v-3.38Zm-5.95-6.84h-1.07l4.36 6.53v3.69h.93v-3.69l4.36-6.53h-1.07l-3.75 5.77-3.76-5.77Z"/>
                  </svg>
                  <span>Hacker News</span>
                </a>

                <button
                  type="button"
                  (click)="copyShareLink()"
                  class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-fg-muted no-underline cursor-pointer transition hover:text-accent hover:border-accent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
                  [attr.aria-label]="copyLabel() === 'Copied!' ? 'Link copied to clipboard' : 'Copy link to clipboard'"
                >
                  @if (copyLabel() === 'Copied!') {
                    <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  } @else {
                    <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/>
                      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>
                    </svg>
                  }
                  <span>{{ copyLabel() }}</span>
                </button>
              </div>
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
export default class BlogPostComponent implements AfterViewInit, OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT)
  private readonly injector = inject(Injector)
  private readonly envInjector = inject(EnvironmentInjector)
  private readonly appRef = inject(ApplicationRef)
  private readonly platformId = inject(PLATFORM_ID)
  private chartRefs: ComponentRef<unknown>[] = []
  private giscusObserver?: IntersectionObserver
  readonly post = toSignal(injectContent<PostAttributes>())

  // Canonical URL of the post. Empty during SSR/SSG — set in ngOnInit on the
  // browser using window.location.origin so prerendered HTML never touches a
  // client-only API. Share buttons compute their share intent URLs at click
  // time against this value, so SSG output is unaffected.
  readonly canonicalUrl = signal('')
  readonly copyLabel = signal('Copy link')

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

  // Build a share-intent URL for the given network. During SSR/SSG the
  // canonical URL is empty (set in ngOnInit on the browser), so the returned
  // href falls back to a network root — Angular keeps the bound href live
  // and patches it on hydration. Click handlers also compute the URL
  // imperatively so the intent URL is correct even if a click fires before
  // the binding refreshes.
  shareUrl(network: 'x' | 'linkedin' | 'reddit' | 'hn'): string {
    const url = this.canonicalUrl()
    const title = this.post()?.attributes.title ?? ''
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    switch (network) {
      case 'x':
        return url ? `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` : 'https://twitter.com/'
      case 'linkedin':
        return url ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` : 'https://www.linkedin.com/'
      case 'reddit':
        return url ? `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}` : 'https://www.reddit.com/'
      case 'hn':
        return url ? `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}` : 'https://news.ycombinator.com/'
    }
  }

  // Click handler for the intent <a>s. We always recompute the URL ourselves
  // and open it in a new tab via window.open so we don't depend on the bound
  // href being up-to-date (the bound href is a placeholder until ngOnInit
  // runs in the browser).
  trackShare(event: MouseEvent, network: 'x' | 'linkedin' | 'reddit' | 'hn') {
    event.preventDefault()
    if (!isPlatformBrowser(this.platformId)) return
    const url = this.shareUrl(network)
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Copy the canonical post URL to the clipboard. Same UX as the existing
  // code-block copy button: label flips to "Copied!" for ~2s. Browser-only.
  async copyShareLink() {
    if (!isPlatformBrowser(this.platformId)) return
    const url = this.canonicalUrl() || window.location.href
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for browsers without async clipboard API.
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      this.copyLabel.set('Copied!')
      setTimeout(() => this.copyLabel.set('Copy link'), 2000)
    } catch (err) {
      console.error('Failed to copy share link', err)
    }
  }

  // Using viewChild with signal-based approach
  giscusContainer = viewChild<ElementRef>('giscusContainer')

  ngOnInit() {
    // Set the canonical URL on the browser. We use the current origin so the
    // share intents point at whatever domain the reader is on — preview or
    // prod. Skipping this on the server keeps the SSG output free of
    // client-only state.
    if (isPlatformBrowser(this.platformId)) {
      const slug = this.post()?.attributes.slug
      if (slug) {
        this.canonicalUrl.set(`${window.location.origin}/blog/${slug}`)
      } else {
        this.canonicalUrl.set(window.location.href)
      }
    }
  }

  ngAfterViewInit() {
    this.lazyLoadGiscus()
    effect(() => {
      if (this.post()) {
        setTimeout(() => {
          this.addCopyButtons()
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
