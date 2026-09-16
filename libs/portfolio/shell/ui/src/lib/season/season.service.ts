import { afterNextRender, Injectable, signal } from '@angular/core'
import { resolveSeason, SEASON_STORAGE_KEY, SEASON_WINDOWS, SeasonChoice, SeasonId } from './season.data'

/**
 * Owns the active season and the visitor's choice of it.
 *
 * On first paint the season is already decided: the inline script injected by
 * `season.plugin.ts` runs before the stylesheet, reads the same localStorage
 * key and the same window table, and writes `data-season` on `<html>`. This
 * service reads that back and takes over for later changes, so there is never
 * a flash of the wrong theme.
 *
 * Both signals start at their SSR values (`null` / `'auto'`) so the server
 * render and the client's first (hydration) render agree — the same discipline
 * ThemeToggleComponent uses for dark/light.
 */
@Injectable({ providedIn: 'root' })
export class SeasonService {
  /** The season actually showing, or null. */
  readonly season = signal<SeasonId | null>(null)

  /** What the visitor picked: follow the calendar, pin one, or turn them off. */
  readonly choice = signal<SeasonChoice>('auto')

  /** Everything the picker offers. Data-driven, so a new season shows up free. */
  readonly options = SEASON_WINDOWS.map((w) => ({ id: w.id, label: w.label, icon: w.icon }))

  constructor() {
    afterNextRender(() => {
      this.season.set((document.documentElement.dataset['season'] as SeasonId) || null)
      this.choice.set(this.read())
    })
  }

  /** Apply and persist a choice. Takes effect immediately, no reload. */
  select(choice: SeasonChoice): void {
    this.choice.set(choice)
    try {
      localStorage.setItem(SEASON_STORAGE_KEY, choice)
    } catch (e) {
      /* private mode / storage disabled — the choice still applies for this page */
    }
    this.apply(choice === 'auto' ? resolveSeason(new Date()) : choice === 'none' ? null : choice)
  }

  private apply(id: SeasonId | null): void {
    this.season.set(id)

    const root = document.documentElement
    if (id) root.setAttribute('data-season', id)
    else root.removeAttribute('data-season')

    // Keep the browser chrome in step with the page.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const color = SEASON_WINDOWS.find((w) => w.id === id)?.themeColor
      meta.setAttribute('content', color ?? (root.classList.contains('light') ? '#ffffff' : '#0a0b10'))
    }
  }

  private read(): SeasonChoice {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(SEASON_STORAGE_KEY)
    } catch (e) {
      /* storage disabled — fall back to following the calendar */
    }
    if (stored === 'none' || stored === 'auto') return stored
    return SEASON_WINDOWS.some((w) => w.id === stored) ? (stored as SeasonId) : 'auto'
  }
}
