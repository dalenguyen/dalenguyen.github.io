import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RevealDirective } from '@dalenguyen/portfolio/shell/ui'
import { ChapterLabelComponent } from './chapter-label.component'

/** Chapter 05: what I'm exploring right now. Edit `updated` and `items` often. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-now',
  imports: [RevealDirective, ChapterLabelComponent],
  template: `
    <section data-scene="galaxy" class="flex min-h-screen items-center py-24">
      <div class="mx-auto w-full max-w-3xl px-6">
        <dalenguyen-chapter-label number="05" label="Now" />
        <h2 class="mt-6 text-4xl font-bold tracking-tight text-fg sm:text-5xl">What I'm exploring</h2>
        <p class="mt-3 font-mono text-xs text-fg-muted">Updated {{ updated }}</p>

        <ul class="mt-12 space-y-4">
          @for (item of items; track item) {
            <li
              dalReveal
              class="flex items-start gap-4 rounded-xl border border-border bg-surface/70 p-5 backdrop-blur"
            >
              <span class="relative mt-2 flex h-2.5 w-2.5 shrink-0">
                <span class="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping"></span>
                <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent"></span>
              </span>
              <span class="text-lg text-fg">{{ item }}</span>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class NowComponent {
  readonly updated = 'November 2026'
  readonly items = [
    'Making CodeMagpie work with any model, not only one provider.',
    'Giving browser agents real tools with WebMCP and Claude Code.',
    'Proving UI changes with screenshots and screencasts before they ship.',
  ]
}
