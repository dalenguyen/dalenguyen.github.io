import { ChangeDetectionStrategy, Component, VERSION } from '@angular/core'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-footer',
  template: `
    <footer class="border-t border-border bg-bg">
      <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm leading-6 text-fg-muted">
          Dale Nguyen © {{ currentYear }}
        </p>
        <p class="text-xs leading-6 text-fg-muted">
          Built with Angular {{ angularVersion }} &amp;
          <a
            href="https://analogjs.org/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent underline underline-offset-2"
            >Analog</a
          >
        </p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  // Pre-calculate values to prevent hydration mismatches and layout shifts
  readonly currentYear = new Date().getFullYear()
  readonly angularVersion = VERSION.major
}
