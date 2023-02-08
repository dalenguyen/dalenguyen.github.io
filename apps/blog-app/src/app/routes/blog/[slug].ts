import { RouteMeta } from '@analogjs/router'
import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { BlogService } from '../../blog/blog.service'

// TODO: meta data update later
export const routeMeta: RouteMeta = {
  title: 'Blog Detail',
  //   meta: postMetaResolver,
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="article$ | async as article">
      <div class="relative overflow-hidden bg-white py-16">
        <div class="hidden lg:absolute lg:inset-y-0 lg:block lg:h-full lg:w-full lg:[overflow-anchor:none]">
          <div class="relative mx-auto h-full max-w-prose text-lg" aria-hidden="true">
            <svg
              class="absolute top-12 left-full translate-x-32 transform"
              width="404"
              height="384"
              fill="none"
              viewBox="0 0 404 384"
            >
              <defs>
                <pattern
                  id="74b3fd99-0a6f-4271-bef2-e80eeafdf357"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="384" fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)" />
            </svg>
            <svg
              class="absolute top-1/2 right-full -translate-y-1/2 -translate-x-32 transform"
              width="404"
              height="384"
              fill="none"
              viewBox="0 0 404 384"
            >
              <defs>
                <pattern
                  id="f210dbf6-a58d-4871-961e-36d5016a0f49"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="384" fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)" />
            </svg>
            <svg
              class="absolute bottom-12 left-full translate-x-32 transform"
              width="404"
              height="384"
              fill="none"
              viewBox="0 0 404 384"
            >
              <defs>
                <pattern
                  id="d3eb07ae-5182-43e6-857d-35c643af9034"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="384" fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)" />
            </svg>
          </div>
        </div>
        <div class="relative px-6 lg:px-8">
          <div class="-mt-6 flex justify-between">
            <a class="font-medium text-blue-500 underline hover:text-blue-700 cursor-pointer" (click)="openBlog()"
              >←
              <!-- -->Back</a
            >
          </div>
          <div class="mx-auto max-w-prose text-lg text-center">
            <h1>
              <span
                class="text-center text-lg font-semibold text-indigo-600"
                *ngFor="let category of article.categories"
                >{{ category.name | titlecase }} &nbsp;</span
              >

              <span
                class="mt-2 block text-center text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl"
                >{{ article.title }}</span
              >
            </h1>
          </div>
          <article class="prose prose-lg prose-indigo mx-auto mt-6 text-gray-500" [innerHTML]="article?.body"></article>
        </div>
      </div>
    </ng-container>
  `,
})
export default class BlogPostComponent {
  private router = inject(Router)
  private blogService = inject(BlogService)
  slug = location.pathname.split('/blog/')[1]
  readonly article$ = this.blogService.getButterArticle(this.slug)

  openBlog() {
    // TODO: super hacky :|
    // need to figure out why blog doesn't load
    this.router.navigate(['blog']).then(() => {
      window.location.reload()
    })
  }
}
