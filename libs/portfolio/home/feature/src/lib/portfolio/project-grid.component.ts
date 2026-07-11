import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'
import { PortfolioItem } from './projects.data'

@Component({
  selector: 'dalenguyen-project-grid',
  standalone: true,
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      @for (project of items; track project.id) {
        <div
          dalReveal
          class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-glow"
        >
          <div class="relative h-48 overflow-hidden">
            <img
              [src]="project.imageUrl"
              [alt]="project.title"
              loading="lazy"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent"></div>
          </div>
          <div class="flex flex-grow flex-col p-6">
            <h3 class="text-xl font-semibold text-fg">
              <a
                [href]="project.projectUrl"
                target="_blank"
                rel="noopener"
                class="transition-colors duration-300 after:absolute after:inset-0 hover:text-accent"
              >
                {{ project.title }}
              </a>
            </h3>
            <p class="mt-2 flex-grow leading-relaxed text-fg-muted">{{ project.description }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              @for (tech of project.technologies; track tech.name) {
                <span class="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                  {{ tech.name }}
                </span>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProjectGridComponent {
  @Input({ required: true }) items: PortfolioItem[] = []
}
