import { injectContent, injectContentFiles, MarkdownComponent } from '@analogjs/content'
import { RouteMeta } from '@analogjs/router'
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common'
import {
  AfterViewInit,
  ApplicationRef,
  Component,
  computed,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  PLATFORM_ID,
  runInInjectionContext,
  viewChild,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
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
      <div class="relative px-6 lg:px-8">
        <nav class="flex py-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <a routerLink="/" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                <svg class="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                Home
              </a>
            </li>
            <li>
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                </svg>
                <a routerLink="/blog" class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">Blog</a>
              </div>
            </li>
            <li aria-current="page" *ngIf="post()as post">
              <div class="flex items-center">
                <svg class="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2 truncate whitespace-nowrap overflow-hidden max-w-[120px] sm:max-w-[180px] md:max-w-[240px]">{{ post.attributes.title }}</span>
              </div>
            </li>
          </ol>
        </nav>
        <div class="mx-auto max-w-prose text-lg text-center mt-8">

          <ng-container *ngIf="post() as post">

            <!-- Feature image display -->
            <div class="mb-8 rounded-lg overflow-hidden shadow-lg">
              <img
                [src]="post.attributes.coverImage"
                [alt]="post.attributes.title"
                class="w-full h-auto object-cover max-h-[400px]"
              />
            </div>

            <h1>{{ post.attributes.title }}</h1>

            <!-- Categories display -->
            <div class="flex flex-wrap justify-center gap-2 mb-6">
              @for (category of post.attributes.categories; track category) {
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  {{ category | titlecase }}
                </span>
              }
            </div>

            <!-- Author and publication date -->
            <div class="flex items-center justify-center mb-8">
              <div class="flex items-center">
                <img
                  [src]="post.attributes.profileImage"
                  [alt]="'Photo of ' + post.attributes.author.firstName"
                  class="w-10 h-10 rounded-full border-2 border-gray-200 mr-3"
                />
                <div class="text-left">
                  <div class="font-medium text-gray-900">
                    {{ post.attributes.author.firstName }} {{ post.attributes.author.lastName }}
                  </div>
                  <div class="text-sm text-gray-500 flex items-center">
                    <span class="mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <time [attr.datetime]="post.attributes.published">
                      {{ post.attributes.published | date: 'longDate' }}
                    </time>
                  </div>
                </div>
              </div>
            </div>

            @if (series()) {
            <div class="text-center mb-8 border rounded-lg p-4">
              <h3 class="text-xl font-bold text-gray-700 mb-2">{{ series()!.name }} ({{ series()!.count }} Part Series)</h3>
              <div class="text-left mx-auto max-w-md text-base">
                @for (post of series()!.posts; track post.slug; let i = $index) {
                  <div class="my-2">
                      <span class="mr-2 font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{{ i + 1 }}</span>
                      @if (post.isCurrent) {
                        <span class="font-semibold text-indigo-700">{{ post.displayTitle }}</span>
                      } @else {
                        <a [routerLink]="['/blog', post.slug]" class="text-indigo-600 hover:text-indigo-800 hover:underline">
                          <span>{{ post.displayTitle }}</span>
                        </a>
                      }
                  </div>
                }
              </div>
            </div>
          }

            <analog-markdown [content]="post.content" />
          </ng-container>


        </div>
      </div>

      <!-- Comments section -->
      <div class="mx-auto max-w-prose mt-12 mb-12">
        <div #giscusContainer class="giscus-container"></div>
      </div>
  `,
})
export default class BlogPostComponent implements AfterViewInit {
  private readonly document = inject(DOCUMENT)
  private readonly injector = inject(Injector)
  private readonly envInjector = inject(EnvironmentInjector)
  private readonly appRef = inject(ApplicationRef)
  private readonly platformId = inject(PLATFORM_ID)
  readonly post = toSignal(injectContent<PostAttributes>())

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
    this.loadGiscusScript()
    effect(() => {
      if (this.post()) {
        setTimeout(() => {
          this.addCopyButtons()
          this.mountCharts()
        })
      }
    }, { injector: this.injector })
  }

  // Mount interactive Angular chart components into any `<div data-chart="…">`
  // placeholders in the rendered markdown. Lazy-loaded so only posts that use
  // charts pull the chart code in. Browser-only.
  private async mountCharts() {
    if (!isPlatformBrowser(this.platformId)) return
    const slug = this.post()?.attributes.slug
    if (!slug || !this.document.querySelector('[data-chart]')) return
    const { mountInteractiveCharts } = await import('../../blog/charts/mount-charts')
    mountInteractiveCharts(this.document, this.envInjector, this.appRef, slug)
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
        'position:absolute;top:0.5rem;right:0.5rem;padding:0.2rem 0.5rem;font-size:0.75rem;background:#e0e0e0;border:none;border-radius:3px;cursor:pointer;opacity:0.7'
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

  private loadGiscusScript() {
    // Get the element reference from the signal
    const container = this.giscusContainer()?.nativeElement

    if (!container) {
      console.error('Giscus container not found')
      return
    }

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
