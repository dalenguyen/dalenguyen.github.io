import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'

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
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="publication" class="py-12 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4">
        <header class="text-center mb-12">
          <h2 class="text-4xl font-bold mb-4 text-gray-800">Publications</h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Sharing knowledge and expertise through technical writing and publications.
          </p>
        </header>

        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <a [href]="book.amazonUrl" rel="noopener follow" target="_blank" class="flex flex-col md:flex-row">
              <div class="md:w-1/3 flex justify-center items-center bg-gray-50">
                <img [src]="book.imageUrl" alt="Book cover" class="object-contain h-full" loading="lazy" />
              </div>
              <div class="md:w-2/3 p-6 flex flex-col justify-between">
                <div>
                  <h4
                    class="text-xl font-semibold mb-3 text-gray-800 hover:text-primary transition-colors duration-300"
                  >
                    {{ book.title }}
                  </h4>
                  <p class="text-gray-600 mb-4">{{ book.description }}</p>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center text-sm text-gray-500">
                    <span>{{ book.year }}</span>
                    <span class="mx-2">·</span>
                    <span>{{ book.author }}</span>
                  </div>
                  <div class="flex items-center">
                    <mat-icon class="text-gray-600">open_in_new</mat-icon>
                  </div>
                </div>
              </div>
            </a>
          </div>
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
