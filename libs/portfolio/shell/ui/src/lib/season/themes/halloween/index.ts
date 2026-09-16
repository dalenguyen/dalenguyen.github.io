import { SeasonTheme } from '../../season-decor.component'
import { HalloweenEffectsComponent } from './effects.component'

/**
 * Halloween's entry point. Discovered automatically by the glob in
 * season-decor.component.ts — this file is never imported by name.
 */
const theme: SeasonTheme = {
  effects: HalloweenEffectsComponent,
}

export default theme
