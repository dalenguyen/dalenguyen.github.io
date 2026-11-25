import { ChangeDetectionStrategy, Component, input } from '@angular/core'

/** Small "02 / What I ship" label at the top of each home page chapter. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-chapter-label',
  template: `
    <p class="inline-flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent">
      <span>{{ number() }}</span>
      <span aria-hidden="true" class="h-px w-8 bg-accent/60"></span>
      <span>{{ label() }}</span>
    </p>
  `,
})
export class ChapterLabelComponent {
  readonly number = input.required<string>()
  readonly label = input.required<string>()
}
