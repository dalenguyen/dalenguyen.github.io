import type { Plugin } from 'vite'
import { SEASON_STORAGE_KEY, SEASON_WINDOWS } from '../../../../libs/portfolio/shell/ui/src/lib/season/season.data'

/**
 * Injects the seasonal-theme pre-paint script into index.html's <head>.
 *
 * WHY A PLUGIN AND NOT PLAIN INLINE HTML: every public route is prerendered, so
 * a build-time season check would bake October's costume into HTML still being
 * served in December. The season has to be decided in the browser on each page
 * view — the same rail the dark/light script already rides. The plugin exists
 * only so the date windows live in ONE place (`season.data.ts`) instead of
 * being hand-copied into a string of browser JS.
 *
 * Placement matters twice over, and `injectTo: 'head'` (append) satisfies both:
 *   - It must be in <head> and synchronous, so it runs before first paint and
 *     the tokens are already right — no flash of the default theme.
 *   - It must come AFTER <meta name="theme-color">. Do NOT switch this to
 *     'head-prepend': the parser would not have reached that meta tag yet, so
 *     the querySelector below would find nothing and the browser chrome would
 *     silently keep the default colour.
 */
export function seasonPlugin(): Plugin {
  const windows = JSON.stringify(SEASON_WINDOWS)

  // Dependency-free browser JS: this runs as a raw inline <script> before any
  // bundle. Wrapped in try/catch like its dark/light neighbour — a broken
  // season must never take the page down.
  const body = `
;(function () {
  try {
    var windows = ${windows}
    var d = new Date()
    var md = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

    var season = null
    for (var i = 0; i < windows.length; i++) {
      var w = windows[i]
      // A window whose end sorts before its start wraps the year end.
      var hit = w.from <= w.to ? md >= w.from && md <= w.to : md >= w.from || md <= w.to
      if (hit) { season = w; break }
    }

    // The visitor's saved pick from the season selector beats the calendar:
    // 'none' turns seasons off, a season id pins that one, 'auto' (or nothing
    // stored) falls through to the date match above.
    var stored = null
    try {
      stored = localStorage.getItem(${JSON.stringify(SEASON_STORAGE_KEY)})
    } catch (e) {}

    // A ?season= query param beats even that, so a season can be previewed
    // out of calendar order without changing what is saved.
    var forced = new URLSearchParams(window.location.search).get('season') || stored

    if (forced === 'none') {
      season = null
    } else if (forced && forced !== 'auto') {
      season = null
      for (var j = 0; j < windows.length; j++) {
        if (windows[j].id === forced) season = windows[j]
      }
    }

    if (season) {
      document.documentElement.setAttribute('data-season', season.id)
      var meta = document.querySelector('meta[name="theme-color"]')
      if (meta && season.themeColor) meta.setAttribute('content', season.themeColor)
    }
  } catch (e) {}
})()
`

  return {
    name: 'season-theme',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [{ tag: 'script', children: body, injectTo: 'head' }],
    },
  }
}
