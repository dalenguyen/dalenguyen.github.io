import { InjectionToken } from '@angular/core'
import { Reloadable } from './widget-content'

// Token will hold the value of Reloadable components
export const RELOADABLE_CONTENT = new InjectionToken<Reloadable>('ReloadableContent')
