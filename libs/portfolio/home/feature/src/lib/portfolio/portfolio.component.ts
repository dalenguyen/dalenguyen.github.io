import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ProjectGridComponent } from './project-grid.component'
import { PORTFOLIO_ITEMS, PortfolioItem } from './projects.data'

@Component({
  selector: 'dalenguyen-portfolio',
  standalone: true,
  imports: [ProjectGridComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="portfolio" class="py-16 sm:py-20 bg-surface/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Project Gallery</h2>
          <p class="mt-3 text-lg text-fg-muted max-w-2xl mx-auto">
            I create user-centered digital experiences that blend innovative technology with strategic design, focusing
            on intuitive interfaces that drive engagement and deliver measurable business outcomes.
          </p>
        </header>

        <dalenguyen-project-grid [items]="featured" />

        <div class="mt-12 text-center">
          <a
            routerLink="/projects"
            class="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-fg transition duration-300 hover:border-accent hover:text-accent hover:shadow-glow"
          >
            View all projects
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  `,
})
export class PortfolioComponent {
  featured: PortfolioItem[] = PORTFOLIO_ITEMS.filter((p) => p.featured)
}
