import { RouteMeta } from '@analogjs/router'
import { Component } from '@angular/core'

export const routeMeta: RouteMeta = {
  title: `Dale Nguyen Blog - Page not found`,
  meta: [{ name: 'description', content: 'Page not found' }],
}

@Component({
  standalone: true,
  template: `
    <div class="flex min-h-full flex-col bg-white pt-16 pb-12">
      <main class="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center px-6 lg:px-8">
        <div class="flex flex-shrink-0 justify-center">
          <a href="/" class="inline-flex">
            <span class="sr-only">Your Company</span>
            <img class="h-12 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600" alt="" />
          </a>
        </div>
        <div class="py-16">
          <div class="text-center">
            <p class="text-base font-semibold text-indigo-600">404</p>
            <h1 class="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Page not found.</h1>
            <p class="mt-2 text-base text-gray-500">Sorry, we couldn’t find the page you’re looking for.</p>
            <div class="mt-6">
              <a href="#" class="text-base font-medium text-indigo-600 hover:text-indigo-500">
                Go back home
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </main>
      <footer class="mx-auto w-full max-w-7xl flex-shrink-0 px-6 lg:px-8">
        <nav class="flex justify-center space-x-4">
          <a
            href="https://twitter.com/dale_nguyen"
            target="_blank"
            class="flex items-center gap-0.5 text-sm font-medium text-gray-500 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
              />
            </svg>
            Twitter</a
          >
        </nav>
      </footer>
    </div>
  `,
})
export default class PageNotFound {}
