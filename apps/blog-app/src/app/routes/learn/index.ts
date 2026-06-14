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
    <div class="bg-bg py-16 px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold tracking-tight text-fg sm:text-5xl">Learning Resources</h1>
          <p class="mt-4 max-w-2xl mx-auto text-lg text-fg-muted">
            Standalone interactive pages for exploring ideas and concepts.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (page of pages; track page.url) {
            <a
              [href]="page.url"
              class="group relative flex flex-col rounded-2xl border border-border bg-surface p-6 no-underline transition duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-glow"
            >
              @if (page.date) {
                <p class="mb-2 text-xs font-medium text-fg-muted">{{ page.date }}</p>
              }
              <h3 class="mb-3 text-xl font-bold text-fg transition-colors group-hover:text-accent">
                {{ page.title }}
              </h3>
              @if (page.description) {
                <p class="line-clamp-3 text-fg-muted">{{ page.description }}</p>
              }
              <span class="mt-auto pt-4 text-sm font-medium text-accent">Open →</span>
            </a>
          }
        </div>
      </div>
    </div>
  `,
})
export default class LearnComponent {
  readonly pages = [...learnPages].sort((a, b) => {
    const dateComp = (b.date ?? '').localeCompare(a.date ?? '')
    if (dateComp !== 0) return dateComp
    return (b.timestamp ?? '').localeCompare(a.timestamp ?? '')
  })
}
