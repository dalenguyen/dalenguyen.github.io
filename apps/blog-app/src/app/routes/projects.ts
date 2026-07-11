import { RouteMeta } from '@analogjs/router'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { PORTFOLIO_ITEMS, ProjectGridComponent } from '@dalenguyen/portfolio/home/feature'

export const routeMeta: RouteMeta = {
  title: 'Projects | Dale Nguyen',
  meta: [
    {
      name: 'description',
      content:
        'Projects by Dale Nguyen — AI agents, developer tools, and web products, from a watchOS voice assistant to a GitHub coding agent.',
    },
    { property: 'og:title', content: 'Projects | Dale Nguyen' },
    {
      property: 'og:description',
      content: 'A gallery of projects Dale Nguyen has built — AI agents, developer tools, and web products.',
    },
    { property: 'og:url', content: 'https://dalenguyen.me/projects' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://dalenguyen.me/assets/images/dale-nguyen-avatar.webp' },
  ],
}

@Component({
  standalone: true,
  imports: [ProjectGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen bg-bg py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <header class="text-center mb-12">
          <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-fg">Projects</h1>
          <p class="mt-3 text-lg text-fg-muted max-w-2xl mx-auto">
            A gallery of things I've built — AI agents, developer tools, and web products.
          </p>
        </header>

        <dalenguyen-project-grid [items]="projects" />
      </div>
    </section>
  `,
})
export default class ProjectsPageComponent {
  projects = PORTFOLIO_ITEMS
}
