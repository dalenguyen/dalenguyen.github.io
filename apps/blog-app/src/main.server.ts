import { provideContent, withMarkdownRenderer } from '@analogjs/content'
import { provideFileRouter } from '@analogjs/router'
import { provideHttpClient } from '@angular/common/http'
import { enableProdMode } from '@angular/core'
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { renderApplication } from '@angular/platform-server'
import { withEnabledBlockingInitialNavigation, withInMemoryScrolling, withRouterConfig } from '@angular/router'
import { AppComponent } from '@dalenguyen/portfolio/shell/feature'
import 'zone.js/node'

if (import.meta.env.PROD) {
  enableProdMode()
}

const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    providers: [
      provideAnimations(),
      provideHttpClient(),
      provideClientHydration(),
      provideFileRouter(
        withRouterConfig({ onSameUrlNavigation: 'reload' }),
        withInMemoryScrolling({ anchorScrolling: 'enabled' }),
        withEnabledBlockingInitialNavigation(),
      ),
      provideContent(withMarkdownRenderer()),
    ],
  })

export default async function render(url: string, document: string) {
  const html = await renderApplication(bootstrap, {
    document,
    url,
  })
  return html
}
