import { HttpClient } from '@angular/common/http'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { map } from 'rxjs/operators'

interface DevToArticle {
  title: string
  slug: string
  description: string
  cover_image: string | null
  tag_list: string[]
  published_at: string
  url: string
  user: { name: string; profile_image: string }
}

interface PostAttributes {
  title: string
  slug: string
  description: string
  coverImage: string
  categories: string[]
  published: string
  profileImage: string
  author: string
  url: string
}

@Component({
  selector: 'dalenguyen-recent-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-white py-12">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            <span class="block">Latest From The Blog</span>
          </h2>
          <p class="mt-3 max-w-2xl mx-auto text-lg text-gray-500">Explore my recent thoughts, tutorials and insights</p>
          <div class="mt-4">
            <a routerLink="/blog" class="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              View all posts →
            </a>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (post of recentPosts(); track post.slug) {
          <div
            class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
          >
            <div class="relative h-44 overflow-hidden">
              <img
                [src]="post.coverImage"
                [alt]="post.title"
                class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              @if (post.categories.length > 0) {
              <div class="absolute top-0 right-0 mt-3 mr-3">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {{ post.categories[0] | titlecase }}
                </span>
              </div>
              }
            </div>
            <div class="p-5 flex-grow">
              <div class="flex items-center text-sm text-gray-500 mb-2">
                <time [attr.datetime]="post.published">
                  {{ post.published | date: 'mediumDate' }}
                </time>
              </div>
              <a [href]="post.url" target="_blank" rel="noopener" class="block cursor-pointer">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition-colors line-clamp-2"
                >
                  {{ post.title }}
                </h3>
                <p class="text-gray-600 mb-3 text-sm line-clamp-2">
                  {{ post.description }}
                </p>
              </a>
            </div>
            <div class="px-5 pb-5 pt-2 border-t border-gray-100 mt-auto">
              <div class="flex items-center">
                <img
                  [src]="post.profileImage"
                  [alt]="'Photo of ' + post.author"
                  class="h-7 w-7 rounded-full"
                />
                <span class="ml-2 text-xs font-medium text-gray-700">{{ post.author }}</span>
                <a
                  [href]="post.url"
                  target="_blank"
                  rel="noopener"
                  class="ml-auto text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors cursor-pointer"
                >
                  Read →
                </a>
              </div>
            </div>
          </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class RecentPostsComponent {
  private http = inject(HttpClient)

  readonly recentPosts = toSignal(
    this.http
      .get<DevToArticle[]>('https://dev.to/api/articles?username=dalenguyen&per_page=3')
      .pipe(
        map((articles) =>
          articles.map(
            (a): PostAttributes => ({
              title: a.title,
              slug: a.slug,
              description: a.description,
              coverImage: a.cover_image ?? '',
              categories: a.tag_list,
              published: a.published_at,
              profileImage: a.user.profile_image,
              author: a.user.name,
              url: a.url,
            }),
          ),
        ),
      ),
    { initialValue: [] as PostAttributes[] },
  )
}
