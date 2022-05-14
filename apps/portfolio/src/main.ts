import { enableProdMode, importProvidersFrom } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterModule } from '@angular/router'
import { AppComponent } from '@dalenguyen/portfolio/shell/feature'
import * as Sentry from '@sentry/browser'
import { RewriteFrames } from '@sentry/integrations'
import { APP_ROUTES } from './app/app-routing.module'
import { environment } from './environments/environment'

if (environment.production) {
  enableProdMode()
}

Sentry.init({
  dsn: 'https://3151dbdf068e4196907c2a61f2ec9e1b@sentry.io/1766223',
  release: `dalenguyen-me@${environment.gitHash}`,
  integrations: [new RewriteFrames()],
})

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(BrowserAnimationsModule), importProvidersFrom(RouterModule.forRoot(APP_ROUTES))],
}).catch((err) => console.error(err))
