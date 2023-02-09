import { provideContent, withMarkdownRenderer } from '@analogjs/content'
import { provideFileRouter } from '@analogjs/router'
import { provideHttpClient } from '@angular/common/http'
import { enableProdMode } from '@angular/core'
import { provideAnimations } from '@angular/platform-browser/animations'
import { renderApplication } from '@angular/platform-server'
import { withEnabledBlockingInitialNavigation, withInMemoryScrolling, withRouterConfig } from '@angular/router'
import { AppComponent } from '@dalenguyen/portfolio/shell/feature'
import 'zone.js/node'

if (import.meta.env.PROD) {
  enableProdMode()
}

export default async function render(url: string, document: string) {
  const html = await renderApplication(AppComponent, {
    appId: 'analog-app',
    document,
    url,
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

  return html
}
