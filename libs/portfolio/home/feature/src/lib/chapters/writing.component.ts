import { injectContentFiles } from '@analogjs/content'
import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'
import { ChapterLabelComponent } from './chapter-label.component'

interface PostAttributes {
  title: string
  slug: string
  description: string
  published: string
  draft?: boolean
}

/** Chapter 04: latest blog posts and the book. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-writing',
  imports: [DatePipe, RouterLink, RevealDirective, ChapterLabelComponent],
  template: `
    <section id="publication" data-scene="book" class="flex min-h-screen items-center py-24">
      <div class="mx-auto w-full max-w-6xl px-6">
        <dalenguyen-chapter-label number="04" label="Writing" />
        <h2 class="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          I write down what I learn, since 2012.
        </h2>

        <div class="mt-14 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <ul class="divide-y divide-border border-y border-border">
            @for (post of posts; track post.attributes.slug) {
              <li dalReveal>
                <a
                  [routerLink]="['/blog', post.attributes.slug]"
                  class="group flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <time
                    class="shrink-0 font-mono text-xs text-fg-muted sm:w-28"
                    [attr.datetime]="post.attributes.published"
                  >
                    {{ post.attributes.published | date: 'MMM d, y' }}
                  </time>
                  <span>
                    <span class="block text-xl font-semibold text-fg transition-colors group-hover:text-accent">
                      {{ post.attributes.title }}
                    </span>
                    <span class="mt-1 block text-fg-muted line-clamp-2">{{ post.attributes.description }}</span>
                  </span>
                </a>
              </li>
            }
            <li class="py-6">
              <a routerLink="/blog" class="font-medium text-accent underline-offset-4 hover:underline">
                Read all posts →
              </a>
            </li>
          </ul>

          <a
            dalReveal
            href="https://www.amazon.com/dp/1803249811"
            target="_blank"
            rel="noopener follow"
            class="group flex flex-col items-center self-start rounded-2xl border border-border bg-surface/70 p-6 text-center backdrop-blur transition hover:border-accent hover:shadow-glow"
          >
            <img
              src="assets/images/primeng-book.jpg"
              alt="Cover of Next-Level UI Development with PrimeNG"
              loading="lazy"
              class="h-56 w-auto rounded shadow-lg transition duration-500 group-hover:-rotate-2 group-hover:scale-105"
            />
            <p class="mt-5 text-xs font-medium uppercase tracking-widest text-fg-muted">The book · 2024</p>
            <p class="mt-2 font-semibold text-fg">Next-Level UI Development with PrimeNG</p>
            <span class="mt-3 text-sm text-accent">View on Amazon ↗</span>
          </a>
        </div>
      </div>
    </section>
  `,
})
export class WritingComponent {
  readonly posts = injectContentFiles<PostAttributes>(
    (f) => f.filename.includes('src/content') && !f.attributes['draft'],
  )
    .sort((a, b) => b.attributes.published.localeCompare(a.attributes.published))
    .slice(0, 4)
}
