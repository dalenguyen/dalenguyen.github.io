import { RouteMeta } from '@analogjs/router'
import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { Router, RouterLink, RouterOutlet } from '@angular/router'
import { BlogService } from '../blog/blog.service'

export const routeMeta: RouteMeta = {
  title: `Dale Nguyen Blog`,
  meta: [{ name: 'description', content: 'Dale Nguyen Blog Posts' }],
}

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="relative bg-gray-50 px-6 pt-16 pb-20 lg:px-8 lg:pt-24 lg:pb-28" *ngIf="showBlogContent">
      <div class="absolute inset-0">
        <div class="h-1/3 bg-white sm:h-2/3"></div>
      </div>
      <div class="relative mx-auto max-w-7xl">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">From the blog</h2>
          <p class="mx-auto mt-3 max-w-2xl text-xl text-gray-500 sm:mt-4">
            Welcome to my blog. Hope that you will find something useful :)
          </p>
        </div>
        <div class="mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3">
          <div class="flex flex-col overflow-hidden rounded-lg shadow-lg" *ngFor="let article of articles$ | async">
            <div class="flex-shrink-0">
              <img class="h-48 w-full object-cover" [src]="article.featured_image" alt="" />
            </div>
            <div class="flex flex-1 flex-col justify-between bg-white p-6">
              <div class="flex-1">
                <p class="text-sm font-medium text-indigo-600">
                  <span class="hover:underline" *ngFor="let category of article.categories"
                    >{{ category.name | titlecase }} &nbsp;</span
                  >
                </p>
                <a (click)="openPost(article.slug)" class="mt-2 block cursor-pointer">
                  <p class="text-xl font-semibold text-gray-900">{{ article.title }}</p>
                  <p class="mt-3 text-base text-gray-500">
                    {{ article.summary }}
                  </p>
                </a>
              </div>
              <div class="mt-6 flex items-center">
                <div class="flex-shrink-0">
                  <span>
                    <span class="sr-only">{{ article.author.first_name }}</span>
                    <img class="h-10 w-10 rounded-full" [src]="article.author.profile_image" alt="" />
                  </span>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">
                    <span class="hover:underline">{{ article.author.first_name }}</span>
                  </p>
                  <div class="flex space-x-1 text-sm text-gray-500">
                    <time [datetime]="article.published">{{ article.published | date: mediumDate }}</time>
                    <!-- <span aria-hidden="true">&middot;</span>
                    <span>6 min read</span> -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <router-outlet></router-outlet>
  `,
})
export default class BlogComponent {
  private router = inject(Router)
  private blogService = inject(BlogService)
  readonly articles$ = this.blogService.getButterArticles()

  // TODO: router-outlet should not show blog content in slug
  // this is a hack :(
  showBlogContent = !location.pathname.includes('/blog/')

  openPost(slug: string) {
    this.showBlogContent = false
    this.router.navigate(['/blog', slug])
  }
}
