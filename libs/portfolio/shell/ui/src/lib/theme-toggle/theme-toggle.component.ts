import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core'

/**
 * Dark/light theme toggle. Dark is the default; an explicit choice is persisted
 * to localStorage and applied as a `.light` class on <html> (an inline script in
 * index.html applies it before first paint to avoid a flash).
 *
 * The signal starts `false` (dark) so the server render and the client's first
 * (hydration) render agree; `afterNextRender` then syncs it to the real state.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-theme-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      (click)="toggle()"
      [attr.aria-label]="isLight() ? 'Switch to dark theme' : 'Switch to light theme'"
      title="Toggle theme"
      class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      @if (isLight()) {
        <!-- moon — click to switch to dark -->
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      } @else {
        <!-- sun — click to switch to light -->
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      }
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly isLight = signal(false)

  constructor() {
    afterNextRender(() => {
      this.isLight.set(document.documentElement.classList.contains('light'))
    })
  }

  toggle(): void {
    const next = !this.isLight()
    this.isLight.set(next)

    const root = document.documentElement
    root.classList.toggle('light', next)
    root.style.colorScheme = next ? 'light' : 'dark'
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark')
    } catch (e) {
      /* private mode / storage disabled — non-fatal */
    }
  }
}
