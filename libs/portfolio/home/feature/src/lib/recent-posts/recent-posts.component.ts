import { injectContentFiles } from '@analogjs/content'
import { DatePipe, TitleCasePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'

interface PostAttributes {
  title: string
  slug: string
  description: string
  coverImage: string
  categories: string[]
  published: string
  profileImage: string
  author: string
  draft?: boolean
}

@Component({
  selector: 'dalenguyen-recent-posts',
  standalone: true,
  imports: [DatePipe, TitleCasePipe, RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-bg py-16 sm:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Latest From The Blog</h2>
          <p class="mt-3 max-w-2xl mx-auto text-lg text-fg-muted">Explore my recent thoughts, tutorials and insights</p>
          <div class="mt-4">
            <a routerLink="/blog" class="text-accent hover:underline underline-offset-4 font-medium transition-colors">
              View all posts →
            </a>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (post of recentPosts; track post.attributes.slug) {
          <article
            dalReveal
            class="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-glow"
          >
            <div class="relative h-44 overflow-hidden">
              <img
                [src]="post.attributes.coverImage"
                [alt]="post.attributes.title"
                loading="lazy"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              @if (post.attributes.categories.length > 0) {
              <div class="absolute top-3 right-3">
                <span
                  class="inline-flex items-center rounded-full bg-bg/70 px-2.5 py-0.5 text-xs font-medium text-fg backdrop-blur ring-1 ring-border"
                >
                  {{ post.attributes.categories[0] | titlecase }}
                </span>
              </div>
              }
            </div>
            <div class="p-5 flex-grow">
              <div class="flex items-center text-sm text-fg-muted mb-2">
                <time [attr.datetime]="post.attributes.published">
                  {{ post.attributes.published | date: 'mediumDate' }}
                </time>
              </div>
              <h3 class="text-lg font-semibold text-fg mb-2 line-clamp-2 transition-colors group-hover:text-accent">
                <a [routerLink]="['/blog', post.attributes.slug]" class="after:absolute after:inset-0">
                  {{ post.attributes.title }}
                </a>
              </h3>
              <p class="text-fg-muted mb-3 text-sm line-clamp-2">
                {{ post.attributes.description }}
              </p>
            </div>
            <div class="px-5 pb-5 pt-2 border-t border-border mt-auto">
              <div class="flex items-center">
                <img
                  [src]="post.attributes.profileImage"
                  [alt]="'Photo of ' + post.attributes.author"
                  class="h-7 w-7 rounded-full ring-1 ring-border"
                />
                <span class="ml-2 text-xs font-medium text-fg-muted">{{ post.attributes.author }}</span>
                <span class="ml-auto text-accent text-xs font-medium">Read →</span>
              </div>
            </div>
          </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class RecentPostsComponent {
  readonly recentPosts = injectContentFiles<PostAttributes>(
    (f) => f.filename.includes('/src/content') && !f.attributes['draft'],
  )
    .sort((a, b) => b.attributes.published.localeCompare(a.attributes.published))
    .slice(0, 3)
}
