import { SeasonTheme } from '../../season-decor.component'
import { AutumnEffectsComponent } from './effects.component'

/**
 * Autumn's entry point. Discovered automatically by the glob in
 * season-decor.component.ts — this file is never imported by name.
 */
const theme: SeasonTheme = {
  effects: AutumnEffectsComponent,
}

export default theme
