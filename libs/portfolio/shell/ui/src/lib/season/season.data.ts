/**
 * Seasonal theme registry — the single source of truth for *when* each season
 * runs and what colour the browser chrome takes while it does.
 *
 * This file has ZERO imports on purpose. It is read from three places:
 *   1. `vite.config.ts` (via `season.plugin.ts`) at build time, to serialize the
 *      windows into the pre-paint inline script in index.html.
 *   2. The Angular `SeasonService` at runtime.
 *   3. Its unit spec.
 * Adding an Angular or node import here breaks (1).
 *
 * To add a season: add a `SeasonId`, add a window below, add the two CSS blocks
 * in `apps/blog-app/src/styles.css`, and copy `themes/_template`.
 */

export type SeasonId = 'halloween' | 'christmas' | 'newyear'

export interface SeasonWindow {
  id: SeasonId
  /** Human-readable name, shown in the season picker. */
  label: string
  /** Emoji shown beside the name in the picker. A native <option> cannot hold
   *  markup, so the icon has to be a character rather than an SVG. */
  icon: string
  /** Inclusive start, `MM-DD`, local time. */
  from: string
  /** Inclusive end, `MM-DD`, local time. May be earlier than `from` to wrap the year. */
  to: string
  /** Value written to `<meta name="theme-color">` while the season is active. */
  themeColor: string
}

/**
 * What the visitor has chosen in the picker: follow the calendar, force one
 * season on, or turn seasons off entirely. Persisted under `SEASON_STORAGE_KEY`.
 */
export type SeasonChoice = 'auto' | 'none' | SeasonId

/** localStorage key holding a `SeasonChoice`. Absent means 'auto'. */
export const SEASON_STORAGE_KEY = 'season'

export const SEASON_WINDOWS: readonly SeasonWindow[] = [
  { id: 'halloween', label: 'Halloween', icon: '🎃', from: '10-01', to: '10-31', themeColor: '#120a06' },
  // Not shipped yet — the folders under themes/ do not exist. Listed here so
  // the shape of a year-wrapping window is obvious when they are added.
  // { id: 'christmas', label: 'Christmas', icon: '🎄', from: '12-18', to: '12-26', themeColor: '#0a1410' },
  // { id: 'newyear', label: 'New Year', icon: '🎆', from: '12-31', to: '01-02', themeColor: '#0b0a16' },
]

/** `MM-DD` for a date, in LOCAL time (the visitor's calendar, not UTC). */
export function monthDay(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

/**
 * True when `md` falls inside the window, inclusive of both ends.
 * A window whose `to` sorts before its `from` wraps the year end, so the test
 * flips from AND to OR (e.g. 12-31 → 01-02 matches 12-31, 01-01 and 01-02).
 */
export function inWindow(md: string, window: SeasonWindow): boolean {
  return window.from <= window.to
    ? md >= window.from && md <= window.to
    : md >= window.from || md <= window.to
}

/**
 * The season active on `date`, or null. Takes the date as an argument (rather
 * than reading the clock) so it is deterministic and testable.
 * First match wins — keep the windows non-overlapping.
 */
export function resolveSeason(date: Date): SeasonId | null {
  const md = monthDay(date)
  return SEASON_WINDOWS.find((w) => inWindow(md, w))?.id ?? null
}
