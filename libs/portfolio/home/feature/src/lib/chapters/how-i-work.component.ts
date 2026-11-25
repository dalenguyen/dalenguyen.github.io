import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'
import { ChapterLabelComponent } from './chapter-label.component'

/** Chapter 03: principles, in place of a skills list. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-how-i-work',
  imports: [RevealDirective, ChapterLabelComponent],
  template: `
    <section id="about" data-scene="helix" class="flex min-h-screen items-center py-24">
      <div class="mx-auto max-w-6xl px-6">
        <div class="max-w-2xl">
          <dalenguyen-chapter-label number="03" label="How I work" />
          <h2 class="mt-6 text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            Tools change every month. These don't.
          </h2>
        </div>

        <ol class="mt-14 grid gap-6 md:grid-cols-3">
          @for (p of principles; track p.title; let i = $index) {
            <li
              dalReveal
              class="rounded-2xl border border-border bg-surface/70 p-7 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <span class="font-mono text-sm text-accent">0{{ i + 1 }}</span>
              <h3 class="mt-4 text-2xl font-semibold text-fg">{{ p.title }}</h3>
              <p class="mt-3 leading-7 text-fg-muted">{{ p.body }}</p>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
})
export class HowIWorkComponent {
  readonly principles = [
    {
      title: 'Agents do the work',
      body: 'I design systems where AI agents take the repeated steps - review, triage, implementation - so people spend time on the parts that need judgment.',
    },
    {
      title: 'People set direction',
      body: 'Humans own the goal, the taste and the final call. Agents report back with evidence; they do not merge on their own.',
    },
    {
      title: 'Prove it works',
      body: 'Every change gets checked in the real app - tests, screenshots, screencasts - before it ships. "It compiles" is not done.',
    },
  ]
}
