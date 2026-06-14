import { RouteMeta } from '@analogjs/router'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

export const routeMeta: RouteMeta = {
  title: `Dale Nguyen Blog - Page not found`,
  meta: [{ name: 'description', content: 'Page not found' }],
}

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-full flex-col bg-bg pt-16 pb-12">
      <main class="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center px-6 lg:px-8">
        <div class="flex flex-shrink-0 justify-center">
          <a routerLink="/" class="inline-flex">
            <span class="sr-only">Dale Nguyen — home</span>
            <img class="h-12 w-12 rounded-full ring-1 ring-border" src="/assets/images/dale-nguyen-avatar.webp" alt="Dale Nguyen" />
          </a>
        </div>
        <div class="py-16 text-center">
          <p class="text-base font-semibold text-accent">404</p>
          <h1 class="mt-2 text-4xl font-bold tracking-tight text-fg sm:text-5xl">Page not found.</h1>
          <p class="mt-4 text-base text-fg-muted">Sorry, we couldn’t find the page you’re looking for.</p>
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              routerLink="/"
              class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Go back home
            </a>
            <a
              routerLink="/blog"
              class="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-2 hover:border-accent"
            >
              Read the blog <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  `,
})
export default class PageNotFound {}
