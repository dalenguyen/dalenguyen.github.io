import { SeasonTheme } from '../../season-decor.component'
import { WinterEffectsComponent } from './effects.component'

/**
 * Winter's entry point. Discovered automatically by the glob in
 * season-decor.component.ts — this file is never imported by name.
 */
const theme: SeasonTheme = {
  effects: WinterEffectsComponent,
}

export default theme
