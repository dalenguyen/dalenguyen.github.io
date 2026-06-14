import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'

interface Book {
  title: string
  description: string
  imageUrl: string
  year: string
  author: string
  amazonUrl: string
}

@Component({
  selector: 'dalenguyen-publication',
  standalone: true,
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="publication" class="py-16 sm:py-20 bg-bg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-fg">Publications</h2>
          <p class="mt-3 text-lg text-fg-muted max-w-2xl mx-auto">
            Sharing knowledge and expertise through technical writing and publications.
          </p>
        </header>

        <div class="max-w-4xl mx-auto" dalReveal>
          <a
            [href]="book.amazonUrl"
            rel="noopener follow"
            target="_blank"
            class="group block overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:border-accent hover:shadow-glow"
          >
            <div class="flex flex-col md:flex-row">
              <div class="flex items-center justify-center bg-surface-2 p-6 md:w-1/3">
                <img [src]="book.imageUrl" alt="Book cover" class="h-56 w-auto object-contain rounded shadow-lg" loading="lazy" />
              </div>
              <div class="flex flex-col justify-between p-6 md:w-2/3">
                <div>
                  <h3 class="text-xl font-semibold text-fg transition-colors duration-300 group-hover:text-accent">
                    {{ book.title }}
                  </h3>
                  <p class="mt-3 text-fg-muted">{{ book.description }}</p>
                </div>
                <div class="mt-5 flex items-center justify-between text-sm text-fg-muted">
                  <span>{{ book.year }} · {{ book.author }}</span>
                  <span class="inline-flex items-center gap-1 text-accent">
                    View on Amazon
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  `,
})
export class PublicationComponent {
  book: Book = {
    title:
      'Next-Level UI Development with PrimeNG: Master the Versatile Angular Component Library to Build Stunning Angular Applications',
    description:
      'Unlock the full potential of PrimeNG and jumpstart your Angular development with essential tools and techniques for web application development',
    imageUrl: 'assets/images/primeng-book.jpg',
    year: '2024',
    author: 'Dale Nguyen',
    amazonUrl: 'https://www.amazon.com/dp/1803249811',
  }
}
