import { injectContentFiles } from '@analogjs/content'
import { RouteMeta } from '@analogjs/router'
import { DatePipe, TitleCasePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'
import { readingTimes } from 'virtual:reading-time-manifest'
import { PostAttributes } from '../../blog/models'

export const routeMeta: RouteMeta = {
  title: `Dale Nguyen Blog`,
  meta: [{ name: 'description', content: 'Dale Nguyen Blog Posts' }],
}

interface YearBar {
  year: string
  count: number
  pct: number
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TitleCasePipe, RouterLink, RevealDirective],
  template: `
    <div class="bg-bg py-16 px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold tracking-tight text-fg sm:text-5xl md:text-6xl">
            Insights &amp; Ideas
            <span class="mt-2 block bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
              From the Blog
            </span>
          </h1>
          <p class="mt-4 max-w-2xl mx-auto text-lg text-fg-muted">
            Welcome to my collection of thoughts, ideas, and discoveries. Hope you find something inspiring!
          </p>
        </div>

        <!-- Posts-per-year visualization -->
        <div class="mx-auto mb-12 max-w-2xl rounded-2xl border border-border bg-surface p-6">
          <div class="mb-5 flex items-baseline justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-fg-muted">Posts by year</h2>
            <span class="text-sm text-fg-muted">{{ allPosts.length }} posts total</span>
          </div>
          <div class="flex items-end gap-2 sm:gap-4">
            @for (y of postsByYear; track y.year) {
              <div class="flex flex-1 flex-col items-center">
                <span class="mb-1 text-xs font-semibold text-fg">{{ y.count }}</span>
                <div class="flex h-28 w-full items-end">
                  <div
                    class="w-full rounded-t-md bg-gradient-to-t from-accent-fill to-accent transition-[height] duration-500"
                    [style.height.%]="y.pct"
                    [title]="y.count + ' posts in ' + y.year"
                  ></div>
                </div>
                <span class="mt-2 text-xs text-fg-muted">{{ y.year }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Category filters -->
        <div class="mb-12 flex flex-wrap justify-center gap-2">
          <button type="button" [class]="chipClass(null)" [attr.aria-pressed]="selectedCategory() === null" (click)="select(null)">
            All <span class="opacity-70">{{ allPosts.length }}</span>
          </button>
          @for (c of categories; track c.name) {
            <button type="button" [class]="chipClass(c.name)" [attr.aria-pressed]="selectedCategory() === c.name" (click)="select(c.name)">
              {{ c.name | titlecase }} <span class="opacity-70">{{ c.count }}</span>
            </button>
          }
        </div>

        <!-- Featured Article -->
        @if (featured(); as post) {
          <div class="mb-14">
            <article class="group relative overflow-hidden rounded-3xl border border-border bg-surface shadow-xl transition-shadow duration-300 hover:shadow-glow">
              <div class="relative h-[360px] sm:h-[440px]">
                <img
                  [src]="post.attributes.coverImage"
                  [alt]="post.attributes.title"
                  class="h-full w-full object-cover brightness-[0.55]"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div class="mb-3 flex flex-wrap items-center gap-2">
                    @for (category of post.attributes.categories; track category) {
                      <span class="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                        {{ category | titlecase }}
                      </span>
                    }
                    <span class="text-sm font-medium text-white/90">{{ post.attributes.published | date: 'mediumDate' }}</span>
                    @if (readingTime(post.attributes.slug); as mins) {
                      <span class="text-sm text-white/70">· {{ mins }} min read</span>
                    }
                  </div>
                  <h2 class="mb-3 text-2xl font-bold text-white sm:text-3xl">{{ post.attributes.title }}</h2>
                  <p class="mb-5 max-w-3xl text-base text-white/85 line-clamp-2 sm:text-lg">{{ post.attributes.description }}</p>
                  <div class="flex items-center gap-3">
                    <img [src]="post.attributes.profileImage" [alt]="post.attributes.author" class="h-9 w-9 rounded-full ring-2 ring-white/30" />
                    <span class="text-sm font-medium text-white">{{ post.attributes.author }}</span>
                    <a
                      routerLink="/blog/{{ post.attributes.slug }}"
                      class="ml-auto rounded-lg bg-white px-5 py-2 text-sm font-semibold text-gray-900 transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Read Article
                    </a>
                  </div>
                </div>
              </div>
            </article>
          </div>
        }

        <!-- Article Grid -->
        @if (rest().length) {
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            @for (post of rest(); track post.attributes.slug) {
              <article
                dalReveal
                class="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-glow"
              >
                <div class="relative h-48 overflow-hidden">
                  <img
                    [src]="post.attributes.coverImage"
                    alt=""
                    loading="lazy"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  @if (post.attributes.categories.length) {
                    <div class="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
                      @for (category of post.attributes.categories.slice(0, 2); track category) {
                        <span class="inline-flex items-center rounded-full bg-bg/70 px-2.5 py-0.5 text-xs font-medium text-fg ring-1 ring-border backdrop-blur">
                          {{ category | titlecase }}
                        </span>
                      }
                    </div>
                  }
                </div>
                <div class="flex flex-grow flex-col p-6">
                  <div class="mb-2 flex items-center gap-2 text-sm text-fg-muted">
                    <time [attr.datetime]="post.attributes.published">{{ post.attributes.published | date: 'mediumDate' }}</time>
                    @if (readingTime(post.attributes.slug); as mins) {
                      <span aria-hidden="true">·</span>
                      <span>{{ mins }} min read</span>
                    }
                  </div>
                  <h3 class="mb-3 text-xl font-bold text-fg transition-colors group-hover:text-accent">
                    <a routerLink="/blog/{{ post.attributes.slug }}" class="after:absolute after:inset-0">
                      {{ post.attributes.title }}
                    </a>
                  </h3>
                  <p class="mb-4 line-clamp-3 text-fg-muted">{{ post.attributes.description }}</p>
                  <div class="mt-auto flex items-center border-t border-border pt-4">
                    <img [src]="post.attributes.profileImage" alt="" class="h-8 w-8 rounded-full ring-1 ring-border" />
                    <span class="ml-2 text-sm font-medium text-fg-muted">{{ post.attributes.author }}</span>
                    <span class="ml-auto text-sm font-medium text-accent">Read More →</span>
                  </div>
                </div>
              </article>
            }
          </div>
        } @else if (!featured()) {
          <p class="text-center text-fg-muted">No posts in this category yet.</p>
        }
      </div>
    </div>
  `,
})
export default class BlogComponent {
  readonly allPosts = injectContentFiles<PostAttributes>(
    (contentFile) => contentFile.filename.includes('/src/content') && !contentFile.attributes.draft,
  ).sort((a, b) => b.attributes.published.localeCompare(a.attributes.published))

  readonly selectedCategory = signal<string | null>(null)

  readonly filteredPosts = computed(() => {
    const cat = this.selectedCategory()
    if (!cat) return this.allPosts
    return this.allPosts.filter((p) => p.attributes.categories?.includes(cat))
  })

  readonly featured = computed(() => this.filteredPosts()[0] ?? null)
  readonly rest = computed(() => this.filteredPosts().slice(1))

  // Top categories by post count for the filter chips.
  readonly categories = (() => {
    const counts = new Map<string, number>()
    for (const post of this.allPosts) {
      for (const category of post.attributes.categories ?? []) {
        counts.set(category, (counts.get(category) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 12)
  })()

  // Posts grouped by publication year, oldest to newest, scaled to the busiest year.
  readonly postsByYear: YearBar[] = (() => {
    const counts = new Map<string, number>()
    for (const post of this.allPosts) {
      const year = post.attributes.published.slice(0, 4)
      counts.set(year, (counts.get(year) ?? 0) + 1)
    }
    const max = Math.max(1, ...counts.values())
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, count]) => ({ year, count, pct: Math.round((count / max) * 100) }))
  })()

  readingTime(slug: string): number {
    return readingTimes[slug] ?? 0
  }

  select(category: string | null): void {
    this.selectedCategory.set(category)
  }

  chipClass(name: string | null): string {
    const base = 'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer'
    return this.selectedCategory() === name
      ? `${base} border-transparent bg-indigo-600 text-white`
      : `${base} border-border text-fg-muted hover:bg-surface-2 hover:text-fg`
  }
}
