import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'

interface PortfolioItem {
  id: number
  title: string
  description: string
  imageUrl: string
  technologies: { name: string; icon: string }[]
  projectUrl: string
}

@Component({
  selector: 'dalenguyen-portfolio',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="portfolio" class="py-12">
      <div class="max-w-7xl mx-auto px-4">
        <header class="text-center mb-12">
          <h2 class="text-4xl font-bold mb-4 text-gray-800">Project Gallery</h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            I create user-centered digital experiences that blend innovative technology with strategic design, focusing
            on intuitive interfaces that drive engagement and deliver measurable business outcomes.
          </p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <mat-card
            *ngFor="let project of portfolioItems"
            class="h-full flex flex-col overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <img mat-card-image [src]="project.imageUrl" [alt]="project.title" class="h-48 w-full object-cover" />
            <mat-card-content class="flex-grow p-6">
              <h3 class="text-2xl font-semibold my-3 text-gray-800">
                <a
                  [href]="project.projectUrl"
                  target="_blank"
                  class="hover:text-primary transition-colors duration-300 hover:underline"
                >
                  {{ project.title }}
                </a>
              </h3>
              <p class="text-gray-600 mb-6 leading-relaxed">{{ project.description }}</p>
              <div class="mb-4 flex flex-wrap gap-2">
                <div
                  *ngFor="let tech of project.technologies"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                >
                  <mat-icon class="h-4 w-4 mr-1 text-gray-600">{{ tech.icon }}</mat-icon>
                  <span>{{ tech.name }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class PortfolioComponent {
  portfolioItems: PortfolioItem[] = [
    {
      id: 1,
      title: 'Techcater (E-Commerce Platform)',
      description:
        'A WordPress plugin marketplace offering premium extensions on a subscription model with automated license management and seamless updates.',
      imageUrl: 'assets/images/home/techcater.png',
      technologies: [
        { name: 'Angular', icon: 'code' },
        { name: 'Firebase', icon: 'cloud' },
        { name: 'Stripe', icon: 'payments' },
        { name: 'GCP', icon: 'cloud' },
        { name: 'PrimeNG', icon: 'dashboard' },
        { name: 'TailwindCSS', icon: 'style' },
        { name: 'Amplitude', icon: 'analytics' },
      ],
      projectUrl: 'https://techcater.com',
    },
    {
      id: 2,
      title: 'LogiChat (AI Chatbot)',
      description: 'Automate your customer support with the next generation natural language processing technology',
      imageUrl: 'assets/images/home/logichat.png',
      technologies: [
        { name: 'Nx', icon: 'layers' },
        { name: 'Express', icon: 'api' },
        { name: 'Angular', icon: 'code' },
        { name: 'GCP', icon: 'cloud' },
        { name: 'Firebase', icon: 'cloud' },
        { name: 'Stripe', icon: 'payments' },
        { name: 'CloudFlare', icon: 'security' },
        { name: 'OpenAI', icon: 'psychology' },
        { name: 'Resend', icon: 'email' },
      ],
      projectUrl: 'https://logichat.io',
    },
    {
      id: 3,
      title: 'PDFun (Open Source PDF Services)',
      description: 'A collection of open source services for PDF processing, Password removal, PDF AI chat, and more.',
      imageUrl: 'assets/images/home/pdfun.png',
      technologies: [
        { name: 'Nx', icon: 'layers' },
        { name: 'Analog', icon: 'code' },
        { name: 'GCP', icon: 'cloud' },
        { name: 'Firebase', icon: 'cloud' },
        { name: 'OpenAI', icon: 'psychology' },
        { name: 'OpenScript', icon: 'code' },
      ],
      projectUrl: 'https://pdfun.xyz',
    },
  ]
}
