import { ApplicationConfig, provideZoneChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { provideClientHydration } from '@angular/platform-browser'
import { provideFileRouter, requestContextInterceptor } from '@analogjs/router'
import { provideContent, withMarkdownRenderer } from '@analogjs/content'
import { withPrismHighlighter } from '@analogjs/content/prism-highlighter'
import { provideAnimations } from '@angular/platform-browser/animations'
import {
  withComponentInputBinding,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFileRouter(
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
      withComponentInputBinding(),
    ),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([requestContextInterceptor])),
    provideAnimations(),
    provideContent(withMarkdownRenderer(), withPrismHighlighter()),
  ],
}