import { provideContent, withMarkdownRenderer } from '@analogjs/content'
import { provideFileRouter } from '@analogjs/router'
import { provideHttpClient } from '@angular/common/http'
import { bootstrapApplication } from '@angular/platform-browser'
import { withEnabledBlockingInitialNavigation, withInMemoryScrolling, withRouterConfig } from '@angular/router'
import 'zone.js'

import { AppComponent } from './app/app.component'

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideFileRouter(
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
      withEnabledBlockingInitialNavigation(),
    ),
    provideContent(withMarkdownRenderer()),
  ],
})
