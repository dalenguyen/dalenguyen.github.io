import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from '@dalenguyen/portfolio/shell/feature'

import { appConfig } from './app/app.config'

// Sentry.init({
//   dsn: 'https://3151dbdf068e4196907c2a61f2ec9e1b@sentry.io/1766223',
//   release: `dalenguyen-me@${'WILL_BE_REPLACE_LATER'}`,
//   integrations: [new RewriteFrames()],
// })

bootstrapApplication(AppComponent, appConfig)
