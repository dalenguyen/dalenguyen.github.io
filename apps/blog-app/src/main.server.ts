import { provideContent, withMarkdownRenderer } from '@analogjs/content'
import { withPrismHighlighter } from '@analogjs/content/prism-highlighter'
import { provideFileRouter } from '@analogjs/router'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { enableProdMode } from '@angular/core'
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideServerRendering, renderApplication } from '@angular/platform-server'
import {
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router'
import { AppComponent } from '@dalenguyen/portfolio/shell/feature'
import 'zone.js/node'

if (import.meta.env.PROD) {
  enableProdMode()
}

const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    providers: [
      provideServerRendering(),
      provideAnimations(),
      provideHttpClient(withFetch()),
      provideClientHydration(withEventReplay()),
      provideFileRouter(
        withRouterConfig({ onSameUrlNavigation: 'reload' }),
        withInMemoryScrolling({ anchorScrolling: 'enabled' }),
        withComponentInputBinding(),
        withEnabledBlockingInitialNavigation(),
      ),
      provideContent(withMarkdownRenderer(), withPrismHighlighter()),
    ],
  })

export default async function render(url: string, document: string) {
  const html = await renderApplication(bootstrap, {
    document,
    url,
  })
  return html
}
