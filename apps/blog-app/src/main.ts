import { provideContent, withMarkdownRenderer } from '@analogjs/content'
import { provideFileRouter } from '@analogjs/router'
import { provideHttpClient } from '@angular/common/http'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { withEnabledBlockingInitialNavigation, withInMemoryScrolling, withRouterConfig } from '@angular/router'
import { AppComponent } from '@dalenguyen/portfolio/shell/feature'
import 'zone.js'

// Sentry.init({
//   dsn: 'https://3151dbdf068e4196907c2a61f2ec9e1b@sentry.io/1766223',
//   release: `dalenguyen-me@${'WILL_BE_REPLACE_LATER'}`,
//   integrations: [new RewriteFrames()],
// })

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    provideFileRouter(
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
      withEnabledBlockingInitialNavigation(),
    ),
    provideContent(withMarkdownRenderer()),
  ],
})
