import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PortfolioService } from './portfolio.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-portfolio',
  imports: [HttpClientModule, CommonModule, MatIconModule],
  standalone: true,
  providers: [PortfolioService],
  template: `
    <section id="portfolio" class="section">
      <div>
        <header>
          <h2>Project Gallery</h2>
        </header>

        <p>In addition to cutting edge code, I bring a solid background in SEO, Branding and Online Marketing.</p>

        <div class="projects" *ngIf="portfolioService.projects$ | async as projects">
          <div *ngFor="let p of projects" class="project">
            <a href="{{ p.html_url }}" target="_blank">{{ p.name }}</a>
            <p>{{ p.description }}</p>
            <div>
              <span><mat-icon fontSet="fa" fontIcon="fa-code"></mat-icon> {{ p.language }}</span>
              <span><mat-icon fontSet="fa" fontIcon="fa-star"></mat-icon> {{ p.stargazers_count }}</span>
              <span><mat-icon fontSet="fa" fontIcon="fa-code-branch"></mat-icon> {{ p.forks }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./portfolio.component.scss'],
})
export class PortfolioComponent {
  portfolioService = inject(PortfolioService)
}
