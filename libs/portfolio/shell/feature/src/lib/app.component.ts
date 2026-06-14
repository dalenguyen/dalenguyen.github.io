import { ChangeDetectionStrategy, Component, ErrorHandler, inject, Injectable, signal } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { RouterLink, RouterModule } from '@angular/router'
import { FooterComponent, NavService } from '@dalenguyen/portfolio/shell/ui'
import * as Sentry from '@sentry/browser'

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  handleError(error: { originalError: string }) {
    Sentry.captureException(error.originalError || error)
    console.error(error)
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-root',
  imports: [MatIconModule, RouterModule, RouterLink, FooterComponent],
  providers: [{ provide: ErrorHandler, useClass: SentryErrorHandler }],
  template: `
  <div class="flex flex-col min-h-screen">
    <!-- Header Navigation -->
    <header class="bg-slate-800 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center">
              <a routerLink="/" class="flex items-center">
                <img class="h-8 w-8 rounded-full" src="/assets/images/dale-nguyen-avatar.webp" alt="Dale Nguyen" />
              </a>
            </div>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center space-x-4">
            @for (item of navItems; track item) {
              <a
                [id]="item.id + '-link'"
                [routerLink]="item.route"
                [fragment]="item.fragment"
                [class.text-white]="isActive(item.id)"
                [class.text-slate-300]="!isActive(item.id)"
                class="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 hover:text-white transition duration-150 ease-in-out flex items-center"
                (click)="setActive(item.id)"
                >
                <mat-icon class="w-5 h-5 mr-1 text-current">{{ item.icon }}</mat-icon>
                {{ item.label }}
              </a>
            }
          </nav>

          <!-- Mobile menu button -->
          <div class="flex md:hidden items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              (click)="toggleMobileMenu()"
              [attr.aria-expanded]="isMobileMenuOpen()"
              aria-label="Toggle mobile menu"
              >
              <!-- Icon when menu is closed -->
              @if (!isMobileMenuOpen()) {
                <mat-icon class="block h-6 w-6" aria-hidden="true">menu</mat-icon>
              }
              <!-- Icon when menu is open -->
              @if (isMobileMenuOpen()) {
                <mat-icon class="block h-6 w-6" aria-hidden="true">close</mat-icon>
              }
            </button>
          </div>

        </div>
      </div>

      <!-- Mobile menu, show/hide based on menu state -->
      @if (isMobileMenuOpen()) {
        <div class="md:hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            @for (item of navItems; track item) {
              <a
                [id]="item.id + '-mobile-link'"
                [routerLink]="item.route"
                [fragment]="item.fragment"
                [class.bg-slate-900]="isActive(item.id)"
                [class.text-white]="isActive(item.id)"
                [class.text-slate-300]="!isActive(item.id)"
                class="px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 hover:text-white transition duration-150 ease-in-out flex items-center"
                (click)="setActive(item.id); toggleMobileMenu()"
                >
                <mat-icon class="w-5 h-5 mr-2 text-current">{{ item.icon }}</mat-icon>
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

    <!-- Footer - Using @defer to load after main content -->
    <footer>
      @defer (on immediate) {
      <dalenguyen-footer/>
      } @placeholder {
      <!-- Empty placeholder with same height to prevent layout shift -->
      <div class="h-20 mx-auto w-full max-w-container px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div class="border-t border-slate-900/5 w-full">
          <p class="text-center text-sm leading-6 text-slate-500">
            Dale Nguyen © 2025 - By using Angular 20
          </p>
        </div>
      </div>
    }
  </footer>
  </div>
  `,
})
export class AppComponent {
  protected readonly navService = inject(NavService)

  // Use signals for reactive state
  isMobileMenuOpen = signal(false)
  activeEl = signal('intro')

  // Navigation items with their icons, routes and fragments
  navItems = [
    {
      id: 'blog',
      label: 'Thoughts',
      route: '/blog',
      fragment: '',
      icon: 'edit',
    },
    {
      id: 'learn',
      label: 'Learning',
      route: '/learn',
      fragment: '',
      icon: 'menu_book',
    },
    {
      id: 'portfolio',
      label: 'Digital Portfolio',
      route: '/',
      fragment: 'portfolio',
      icon: 'grid_view',
    },
    {
      id: 'bucket-list',
      label: 'Bucket List',
      route: '/bucket-list',
      fragment: '',
      icon: 'checklist',
    },
    {
      id: 'about',
      label: 'Biography',
      route: '/',
      fragment: 'about',
      icon: 'person',
    },
    {
      id: 'contact',
      label: 'Contact',
      route: '/',
      fragment: 'contact',
      icon: 'email',
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
