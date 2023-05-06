import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from '@dalenguyen/portfolio/shell/feature'
import * as Sentry from '@sentry/browser'
import { RewriteFrames } from '@sentry/integrations'
import { appConfig } from './app/app.config'
import { environment } from './environments/environment'

Sentry.init({
  dsn: 'https://3151dbdf068e4196907c2a61f2ec9e1b@sentry.io/1766223',
  release: `dalenguyen-me@${environment.gitHash}`,
  integrations: [new RewriteFrames()],
})

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err))
