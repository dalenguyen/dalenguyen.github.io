import { CommonModule, isPlatformBrowser } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ErrorHandler,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core'
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
  imports: [MatIconModule, RouterModule, RouterLink, FooterComponent, CommonModule],
  providers: [{ provide: ErrorHandler, useClass: SentryErrorHandler }],
  template: `
  <div class="min-h-screen flex flex-col">
    <!-- Header Navigation -->
    <header class="bg-slate-800 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center">
              <a routerLink="/" class="flex items-center">
                <img class="h-8 w-8 rounded-full" src="/assets/images/dale-nguyen-avatar.jpeg" alt="Dale Nguyen" />
              </a>
            </div>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center space-x-4">
            <a
              *ngFor="let item of navItems"
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
          </nav>

          <!-- Mobile menu button - Only rendered on client -->
          <div class="flex md:hidden items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              (click)="toggleMobileMenu()"
              aria-label="Toggle mobile menu"
            >
              <span class="sr-only">Open main menu</span>
              <!-- Icon when menu is closed -->
              <mat-icon *ngIf="!isMobileMenuOpen()" class="block h-6 w-6">menu</mat-icon>
              <!-- Icon when menu is open -->
              <mat-icon *ngIf="isMobileMenuOpen()" class="block h-6 w-6">close</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu, show/hide based on menu state -->
      <div class="md:hidden" *ngIf="isMobileMenuOpen()">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <a
            *ngFor="let item of navItems"
            [id]="item.id + '-mobile-link'"
            [routerLink]="item.route"
            [fragment]="item.fragment"
            [class.bg-slate-900]="isActive(item.id)"
            [class.text-white]="isActive(item.id)"
            [class.text-slate-300]="!isActive(item.id)"
            class="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 hover:text-white transition duration-150 ease-in-out flex items-center"
            (click)="setActive(item.id); toggleMobileMenu()"
          >
            <mat-icon class="w-5 h-5 mr-2 text-current">{{ item.icon }}</mat-icon>
            {{ item.label }}
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow">
      <router-outlet />
    </main>

    <!-- Footer -->
    <dalenguyen-footer/>
  </div>
  `,
  styles: [
    `
      :host ::ng-deep html {
        scroll-behavior: smooth;
      }
    `,
  ],
})
export class AppComponent {
  protected readonly navService = inject(NavService)
  private readonly cdf = inject(ChangeDetectorRef)
  private readonly platformId = inject(PLATFORM_ID)
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
    // Toggle the menu regardless of environment, but only trigger change detection in browser
    this.isMobileMenuOpen.update((value) => !value)

    // Only trigger change detection if in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.cdf.detectChanges()
    }
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
