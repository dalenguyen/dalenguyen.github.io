import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ChapterLabelComponent } from './chapter-label.component'

/** Chapter 01: who I am, in one line. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-hello',
  imports: [RouterLink, ChapterLabelComponent],
  template: `
    <section id="intro" data-scene="sphere"
      class="relative flex min-h-[calc(100svh-4rem)] items-center">
      <div class="mx-auto max-w-4xl px-6 py-20 text-center">
        <div class="animate-fade-up">
          <dalenguyen-chapter-label number="01" label="Hello" />
        </div>

        <h1
          class="mt-8 text-5xl font-bold tracking-tight text-fg sm:text-7xl animate-fade-up [animation-delay:120ms]"
        >
          I build AI agents
          <span class="block bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">that ship.</span>
        </h1>

        <p class="mx-auto mt-8 max-w-2xl text-lg leading-8 text-fg-muted animate-fade-up [animation-delay:240ms]">
          I'm Dale Nguyen, a software engineer in Toronto. I turn ideas into products where agents do the work - from a
          code reviewer on GitHub to a voice assistant on your wrist.
        </p>

        <div class="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up [animation-delay:360ms]">
          <a
            [routerLink]="'/'"
            fragment="portfolio"
            class="inline-flex items-center gap-2 rounded-lg bg-accent-fill px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-fill/90 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            See what I ship
          </a>
          <a
            [routerLink]="'/'"
            fragment="contact"
            class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-5 py-2.5 text-sm font-semibold text-fg backdrop-blur transition hover:border-accent hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Say hi <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <a
        [routerLink]="'/'"
        fragment="portfolio"
        class="absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-1 text-xs font-medium text-fg-muted transition hover:text-accent motion-safe:animate-bounce"
      >
        Scroll to explore
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </a>
    </section>
  `,
})
export class HelloComponent {}
