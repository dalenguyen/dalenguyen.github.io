import { ChangeDetectionStrategy, Component, ErrorHandler, inject, Injectable, signal } from '@angular/core'
import { RouterLink, RouterModule } from '@angular/router'
import { FooterComponent, NavService, ThemeToggleComponent } from '@dalenguyen/portfolio/shell/ui'

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  // Sentry is lazy-loaded so the SDK stays out of the initial bundle; it is only
  // fetched if an error actually fires.
  handleError(error: { originalError?: unknown }) {
    void import('@sentry/browser').then((Sentry) => {
      Sentry.captureException(error.originalError ?? error)
    })
    console.error(error)
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-root',
  imports: [RouterModule, RouterLink, FooterComponent, ThemeToggleComponent],
  providers: [{ provide: ErrorHandler, useClass: SentryErrorHandler }],
  template: `
  <div class="flex flex-col min-h-screen">
    <!-- Header Navigation -->
    <header class="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 gap-4">
          <!-- Logo and Brand -->
          <a routerLink="/" class="flex items-center gap-2.5 shrink-0 group">
            <img class="h-8 w-8 rounded-full ring-1 ring-border transition group-hover:ring-accent" src="/assets/images/dale-nguyen-avatar.webp" alt="Dale Nguyen" />
            <span class="hidden sm:block text-sm font-semibold tracking-tight text-fg">Dale Nguyen</span>
          </a>

          <!-- Desktop Navigation -->
          <nav class="hidden lg:flex items-center gap-1">
            @for (item of navItems; track item) {
              <a
                [id]="item.id + '-link'"
                [routerLink]="item.route"
                [fragment]="item.fragment"
                [class.text-fg]="isActive(item.id)"
                [class.bg-surface-2]="isActive(item.id)"
                [class.text-fg-muted]="!isActive(item.id)"
                class="px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-2 hover:text-fg transition-colors duration-150 flex items-center gap-1.5"
                (click)="setActive(item.id)"
                >
                <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.svg" />
                </svg>
                {{ item.label }}
              </a>
            }
          </nav>

          <!-- Right side: theme toggle + mobile menu button -->
          <div class="flex items-center gap-2">
            <dalenguyen-theme-toggle />
            <button
              type="button"
              class="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-fg-muted hover:text-fg hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              (click)="toggleMobileMenu()"
              [attr.aria-expanded]="isMobileMenuOpen()"
              aria-label="Toggle mobile menu"
              >
              @if (!isMobileMenuOpen()) {
                <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              }
              @if (isMobileMenuOpen()) {
                <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            </button>
          </div>

        </div>
      </div>

      <!-- Mobile menu, show/hide based on menu state -->
      @if (isMobileMenuOpen()) {
        <div class="lg:hidden border-t border-border bg-bg/95 backdrop-blur-md">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            @for (item of navItems; track item) {
              <a
                [id]="item.id + '-mobile-link'"
                [routerLink]="item.route"
                [fragment]="item.fragment"
                [class.bg-surface-2]="isActive(item.id)"
                [class.text-fg]="isActive(item.id)"
                [class.text-fg-muted]="!isActive(item.id)"
                class="px-3 py-2 rounded-lg text-base font-medium hover:bg-surface-2 hover:text-fg transition-colors duration-150 flex items-center gap-2"
                (click)="setActive(item.id); toggleMobileMenu()"
                >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.svg" />
                </svg>
                {{ item.label }}
              </a>
            }
          </div>
        </div>
      }
    </header>

    <!-- Main content with flex-grow to push footer down -->
    <main class="flex-grow flex flex-col h-full">
      <router-outlet />
    </main>

    <!-- Footer rendered directly (lightweight) so it stays in the SSR HTML and
         avoids a placeholder→footer layout shift. The component renders its own
         <footer> landmark, so there is no wrapper here (avoids nested landmarks). -->
    <dalenguyen-footer/>
  </div>
  `,
})
export class AppComponent {
  protected readonly navService = inject(NavService)

  // Use signals for reactive state
  isMobileMenuOpen = signal(false)
  activeEl = signal('intro')

  // Navigation items with their inline-SVG icon paths (Heroicons outline),
  // routes and fragments. Inline SVG replaces Angular Material's <mat-icon> so
  // the shell no longer pulls in @angular/material or the Material Icons web font.
  navItems = [
    {
      id: 'blog',
      label: 'Thoughts',
      route: '/blog',
      fragment: '',
      svg: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
    },
    {
      id: 'learn',
      label: 'Learning',
      route: '/learn',
      fragment: '',
      svg: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25',
    },
    {
      id: 'portfolio',
      label: 'Digital Portfolio',
      route: '/projects',
      fragment: '',
      svg: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    },
    {
      id: 'bucket-list',
      label: 'Bucket List',
      route: '/bucket-list',
      fragment: '',
      svg: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      id: 'about',
      label: 'Biography',
      route: '/',
      fragment: 'about',
      svg: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      id: 'contact',
      label: 'Contact',
      route: '/',
      fragment: 'contact',
      svg: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
    },
  ]

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value)
  }

  setActive(id: string): void {
    this.activeEl.set(id)

    // For items with fragments, we need to handle scrolling after navigation
    const item = this.navItems.find((item) => item.id === id)
    if (item && item.fragment) {
      // Pass the fragment ID to the NavService to handle scrolling
      this.navService.target.next(item.fragment)
    }
  }

  isActive(id: string): boolean {
    return this.activeEl() === id
  }
}
