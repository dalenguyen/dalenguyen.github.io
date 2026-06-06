import { RouteMeta } from '@analogjs/router'
import { Component } from '@angular/core'
import { learnPages } from 'virtual:learn-manifest'

export const routeMeta: RouteMeta = {
  title: 'Learning Resources — Dale Nguyen',
  meta: [{ name: 'description', content: 'Interactive and standalone learning pages' }],
}

@Component({
  standalone: true,
  template: `
    <div class="bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <div class="text-center mb-16">
          <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            <span class="block">Learning Resources</span>
          </h1>
          <p class="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Standalone interactive pages for exploring ideas and concepts.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (page of pages; track page.url) {
            <a
              [href]="page.url"
              class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col p-6 cursor-pointer no-underline"
            >
              @if (page.date) {
                <p class="text-xs text-gray-400 mb-2">{{ page.date }}</p>
              }
              <h3 class="text-xl font-bold text-gray-900 mb-3 hover:text-indigo-600 transition-colors">
                {{ page.title }}
              </h3>
              @if (page.description) {
                <p class="text-gray-600 line-clamp-3">{{ page.description }}</p>
              }
              <span class="mt-auto pt-4 text-indigo-600 text-sm font-medium">Open →</span>
            </a>
          }
        </div>
      </div>
    </div>
  `,
})
export default class LearnComponent {
  readonly pages = [...learnPages].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}
