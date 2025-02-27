import { RouteMeta } from '@analogjs/router'
import { CommonModule } from '@angular/common'
import { Component, inject, signal } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { BlogService } from '../blog/blog.service'

export const routeMeta: RouteMeta = {
  title: `Dale Nguyen Blog`,
  meta: [{ name: 'description', content: 'Dale Nguyen Blog Posts' }],
}

@Component({
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    @if (showBlogContent()) {
    <div class="bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <!-- Header Section -->
        <div class="text-center mb-16">
          <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span class="block">Insights & Ideas</span>
            <span class="block text-indigo-600 mt-2">From the Blog</span>
          </h1>
          <p class="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Welcome to my collection of thoughts, ideas, and discoveries. Hope you find something inspiring!
          </p>
        </div>

        <!-- Featured Article (First Article) -->
        @if ((articles$ | async)?.length) {
        <div class="mb-16">
          @for (article of articles$ | async; track article.slug; let i = $index) { @if (i === 0) {
          <div
            class="relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-indigo-100"
          >
            <!-- Darker overlay with increased opacity for better contrast with white text -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-800/80 to-gray-900/60 opacity-90"
            ></div>
            <!-- Darkened and blurred image for better text readability -->
            <img
              [src]="article.featured_image"
              [alt]="article.title"
              class="w-full h-[500px] object-cover filter blur-[2px] brightness-[0.7] contrast-[1.1]"
            />
            <!-- Content container with enhanced text visibility -->
            <div class="absolute bottom-0 left-0 right-0 p-8">
              <div class="flex flex-wrap items-center gap-2 mb-4">
                @for (category of article.categories; track category.name) {
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-600 text-white"
                >
                  {{ category.name | titlecase }}
                </span>
                }
                <span class="text-sm text-white font-medium">{{ article.published | date: 'mediumDate' }}</span>
              </div>
              <h2 class="text-3xl font-bold mb-3 text-white drop-shadow-sm">{{ article.title }}</h2>
              <p class="text-lg mb-6 text-white font-medium drop-shadow-sm">{{ article.summary }}</p>
              <div class="flex items-center">
                <img
                  [src]="article.author.profile_image"
                  [alt]="'Photo of ' + article.author.first_name"
                  class="h-10 w-10 rounded-full mr-3 border-2 border-white"
                />
                <div>
                  <p class="font-medium text-white">{{ article.author.first_name }}</p>
                </div>
                <button
                  (click)="openPost(article.slug)"
                  class="ml-auto bg-white text-indigo-700 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:outline-none"
                >
                  Read Article
                </button>
              </div>
            </div>
          </div>
          } }
        </div>
        }

        <!-- Article Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (article of articles$ | async; track article.slug; let i = $index) { @if (i !== 0) {
          <div
            class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            <div class="relative h-48 overflow-hidden">
              <img
                [src]="article.featured_image"
                alt=""
                class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute top-0 right-0 mt-4">
                @for (category of article.categories; track category.name) {
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2"
                >
                  {{ category.name | titlecase }}
                </span>
                }
              </div>
            </div>
            <div class="p-6 flex-grow">
              <div class="flex items-center text-sm text-gray-500 mb-2">
                <time [attr.datetime]="article.published">{{ article.published | date: 'mediumDate' }}</time>
              </div>
              <a (click)="openPost(article.slug)" class="block cursor-pointer">
                <h3 class="text-xl font-bold text-gray-900 mb-3 hover:text-indigo-600 transition-colors">
                  {{ article.title }}
                </h3>
                <p class="text-gray-600 mb-4 line-clamp-3">{{ article.summary }}</p>
              </a>
            </div>
            <div class="px-6 pb-6 pt-2 border-t border-gray-100 mt-auto">
              <div class="flex items-center">
                <img [src]="article.author.profile_image" alt="" class="h-8 w-8 rounded-full" />
                <span class="ml-2 text-sm font-medium text-gray-700">{{ article.author.first_name }}</span>
                <button
                  (click)="openPost(article.slug)"
                  class="ml-auto text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                >
                  Read More →
                </button>
              </div>
            </div>
          </div>
          } }
        </div>
      </div>
    </div>
    }

    <router-outlet></router-outlet>
  `,
})
export default class BlogComponent {
  private readonly router = inject(Router)
  private readonly blogService = inject(BlogService)
  readonly articles$ = this.blogService.getButterArticles()

  // TODO: router-outlet should not show blog content in slug
  // this is a hack :(
  showBlogContent = signal(!location.pathname.includes('/blog/'))

  openPost(slug: string) {
    this.showBlogContent.set(false)
    this.router.navigate(['/blog', slug])
  }
}
