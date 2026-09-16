import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { SeasonChoice } from './season.data'
import { SeasonService } from './season.service'

/**
 * Season picker, sitting beside the dark/light toggle.
 *
 * A native <select> rather than a custom menu: it is keyboard- and
 * screen-reader-correct for free, and it stays usable as more seasons are
 * added. The options come from the season registry, so shipping a new season
 * adds its entry here without touching this file.
 *
 * "Auto" is the default and means "follow the calendar" — Halloween appears on
 * its own through October. The picker is for visitors who want it early, or
 * not at all.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-season-select',
  standalone: true,
  template: `
    <label class="relative inline-flex">
      <span class="sr-only">Seasonal theme</span>
      <select
        [value]="seasons.choice()"
        (change)="pick($event)"
        title="Seasonal theme"
        class="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-transparent pl-8 pr-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <option value="auto">🗓️ Auto</option>
        @for (o of seasons.options; track o.id) {
          <option [value]="o.id">{{ o.icon }} {{ o.label }}</option>
        }
        <option value="none">🚫 Off</option>
      </select>

      <!-- sparkles — marks the control as the "seasonal" one -->
      <svg
        class="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.6"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
        />
      </svg>
    </label>
  `,
  styles: `
    /* The arrow is dropped with appearance-none above; keep the control compact. */
    select option {
      color: initial;
    }
  `,
})
export class SeasonSelectComponent {
  protected readonly seasons = inject(SeasonService)

  protected pick(event: Event): void {
    this.seasons.select((event.target as HTMLSelectElement).value as SeasonChoice)
  }
}
