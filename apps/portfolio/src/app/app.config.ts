import { ApplicationConfig, importProvidersFrom } from '@angular/core'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { APP_ROUTES } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [importProvidersFrom(BrowserAnimationsModule), provideRouter(APP_ROUTES)],
}
