import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'
import { ChapterLabelComponent } from './chapter-label.component'
import { DemoKind, ProductDemoComponent } from './product-demo.component'

interface Product {
  name: string
  kind: string
  problem: string
  answer: string
  url: string
  /** Particle shape behind this product, see ../scene/shapes. */
  scene: string
  /** Animated demo beside the text. */
  demo: DemoKind
}

/** Chapter 02: the products, one full screen each. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-ship',
  imports: [RouterLink, RevealDirective, ChapterLabelComponent, ProductDemoComponent],
  template: `
    <div id="portfolio">
      @for (product of products; track product.name; let i = $index; let even = $even) {
        <!-- The particle shape (data-scene-side, see ../scene) glows behind
             the animated demo on the other half of the screen. -->
        <section
          [attr.data-scene]="product.scene"
          [attr.data-scene-side]="even ? 'right' : 'left'"
          class="flex min-h-screen items-center py-20"
        >
          <div class="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
            <div dalReveal class="md:row-start-1" [class.md:col-start-2]="!even">
              <dalenguyen-chapter-label number="02" [label]="'What I ship · ' + (i + 1) + '/' + products.length" />
              <p class="mt-6 text-sm font-medium text-fg-muted">{{ product.kind }}</p>
              <h2 class="mt-2 text-5xl font-bold tracking-tight text-fg sm:text-6xl">{{ product.name }}</h2>
              <p class="mt-6 text-xl font-medium text-fg">{{ product.problem }}</p>
              <p class="mt-3 text-lg leading-8 text-fg-muted">{{ product.answer }}</p>
              <a
                [href]="product.url"
                target="_blank"
                rel="noopener"
                class="mt-8 inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-5 py-2.5 font-semibold text-fg backdrop-blur transition hover:border-accent hover:text-accent"
              >
                Visit {{ product.url.replace('https://', '') }} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <dalenguyen-product-demo dalReveal class="md:row-start-1" [class.md:col-start-1]="!even" [kind]="product.demo" />
          </div>
        </section>
      }
      <p class="pb-16 text-center">
        <a routerLink="/projects" class="font-medium text-accent underline-offset-4 hover:underline">
          More things I built →
        </a>
      </p>
    </div>
  `,
})
export class ShipComponent {
  readonly products: Product[] = [
    {
      name: 'Xoài',
      kind: 'Voice assistant for Apple Watch',
      problem: 'Small questions get lost because your hands are full.',
      answer:
        'Tap your watch, ask out loud, and Xoài speaks back a live, web-grounded answer. Hands-free and eyes-free.',
      url: 'https://heyxoai.com',
      scene: 'wave',
      demo: 'xoai',
    },
    {
      name: 'CodeMagpie',
      kind: 'AI coding agent for GitHub',
      problem: 'Pull requests wait for a reviewer who is busy.',
      answer:
        'Mention it on a PR and it reviews, writes code and resolves feedback. Reviewer, implementer and resolver agents share one model-agnostic backend.',
      url: 'https://codemagpie.com',
      scene: 'lattice',
      demo: 'codemagpie',
    },
    {
      name: 'LogiChat',
      kind: 'AI chatbot for customer support',
      problem: 'Support teams answer the same question again and again.',
      answer: 'LogiChat answers your customers in natural language, day and night, so your team can do the hard cases.',
      url: 'https://logichat.io',
      scene: 'ripples',
      demo: 'logichat',
    },
  ]
}
