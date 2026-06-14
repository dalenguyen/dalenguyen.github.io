import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'

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
  imports: [RevealDirective],
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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          @for (project of portfolioItems; track project.id) {
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
      </div>
    </section>
  `,
})
export class PortfolioComponent {
  portfolioItems: PortfolioItem[] = [
    {
      id: 1,
      title: 'DailyMastery (Learning Platform)',
      description:
        'A comprehensive learning platform designed to help users master new skills through daily practice and structured learning paths. Built with modern web technologies to provide an engaging and effective learning experience.',
      imageUrl: 'assets/images/home/dailymastery.png',
      technologies: [
        { name: 'Next.js', icon: 'code' },
        { name: 'Nx', icon: 'layers' },
        { name: 'Firebase', icon: 'cloud' },
        { name: 'TailwindCSS', icon: 'style' },
        { name: 'GCP', icon: 'cloud' },
      ],
      projectUrl: 'https://dailymastery.io',
    },
    {
      id: 2,
      title: 'TechLeadPilot (Leadership Simulator)',
      description:
        'A leadership simulator that puts you in realistic Tech Lead scenarios before you actually have to face them. Practice soft skills like navigating office politics, motivating team members, and making decisions under pressure.',
      imageUrl: 'assets/images/blog/techleadpilot-simulator.png',
      technologies: [
        { name: 'Angular', icon: 'code' },
        { name: 'Analog.js', icon: 'code' },
        { name: 'Firebase', icon: 'cloud' },
        { name: 'Vertex AI', icon: 'psychology' },
        { name: 'Firestore', icon: 'storage' },
        { name: 'Node.js', icon: 'api' },
      ],
      projectUrl: 'https://techleadpilot.com',
    },
    {
      id: 3,
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
      id: 4,
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
      id: 5,
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
    {
      id: 6,
      title: 'SafePlate (AI Meal Planner)',
      description:
        'Generate personalized meals that avoid allergens and incorporate your favorite ingredients, promoting a healthy lifestyle with our advanced AI technology. Eat safely, live confidently.',
      imageUrl: 'assets/images/home/safeplate.png',
      technologies: [
        { name: 'Ionic', icon: 'phone_iphone' },
        { name: 'Vertex AI', icon: 'psychology' },
        { name: 'GCP', icon: 'cloud' },
        { name: 'NestJS', icon: 'code' },
      ],
      projectUrl: 'https://safeplate.ai',
    },
  ]
}
