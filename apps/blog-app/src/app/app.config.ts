import { provideContent, withMarkdownRenderer } from '@analogjs/content'
import { withPrismHighlighter } from '@analogjs/content/prism-highlighter'
import { provideFileRouter, requestContextInterceptor } from '@analogjs/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { withComponentInputBinding, withInMemoryScrolling, withRouterConfig } from '@angular/router'
import 'prismjs/plugins/diff-highlight/prism-diff-highlight'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFileRouter(
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
      withComponentInputBinding(),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([requestContextInterceptor])),
    provideAnimationsAsync('animations'),
    provideContent(withMarkdownRenderer(), withPrismHighlighter()),
  ],
}
