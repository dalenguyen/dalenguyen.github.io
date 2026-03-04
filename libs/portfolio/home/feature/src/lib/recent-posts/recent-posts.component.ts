import { injectContentFiles } from '@analogjs/content'
import { DatePipe, TitleCasePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'

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
  imports: [DatePipe, TitleCasePipe, RouterLink],
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
          @for (post of recentPosts; track post.attributes.slug) {
          <div
            class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
          >
            <div class="relative h-44 overflow-hidden">
              <img
                [src]="post.attributes.coverImage"
                [alt]="post.attributes.title"
                class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              @if (post.attributes.categories.length > 0) {
              <div class="absolute top-0 right-0 mt-3 mr-3">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {{ post.attributes.categories[0] | titlecase }}
                </span>
              </div>
              }
            </div>
            <div class="p-5 flex-grow">
              <div class="flex items-center text-sm text-gray-500 mb-2">
                <time [attr.datetime]="post.attributes.published">
                  {{ post.attributes.published | date: 'mediumDate' }}
                </time>
              </div>
              <a [routerLink]="['/blog', post.attributes.slug]" class="block cursor-pointer">
                <h3
                  class="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition-colors line-clamp-2"
                >
                  {{ post.attributes.title }}
                </h3>
                <p class="text-gray-600 mb-3 text-sm line-clamp-2">
                  {{ post.attributes.description }}
                </p>
              </a>
            </div>
            <div class="px-5 pb-5 pt-2 border-t border-gray-100 mt-auto">
              <div class="flex items-center">
                <img
                  [src]="post.attributes.profileImage"
                  [alt]="'Photo of ' + post.attributes.author"
                  class="h-7 w-7 rounded-full"
                />
                <span class="ml-2 text-xs font-medium text-gray-700">{{ post.attributes.author }}</span>
                <a
                  [routerLink]="['/blog', post.attributes.slug]"
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
  readonly recentPosts = injectContentFiles<PostAttributes>(
    (f) => f.filename.includes('/src/content') && !f.attributes['draft'],
  )
    .sort((a, b) => b.attributes.published.localeCompare(a.attributes.published))
    .slice(0, 3)
}
