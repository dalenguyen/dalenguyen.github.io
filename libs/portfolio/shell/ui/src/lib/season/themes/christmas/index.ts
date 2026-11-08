import { SeasonTheme } from '../../season-decor.component'
import { ChristmasEffectsComponent } from './effects.component'

/**
 * Christmas's entry point. Discovered automatically by the glob in
 * season-decor.component.ts — this file is never imported by name.
 */
const theme: SeasonTheme = {
  effects: ChristmasEffectsComponent,
}

export default theme
