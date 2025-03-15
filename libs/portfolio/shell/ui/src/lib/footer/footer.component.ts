import { ChangeDetectionStrategy, Component, VERSION } from '@angular/core'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-footer',
  template: `
    <footer
      class="border-t border-slate-900/5 mx-auto w-full max-w-container px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-center"
    >
      <div class=" w-full">
        <p class="text-center text-sm leading-6 text-slate-500">
          Dale Nguyen © {{ currentYear }} - By using Angular {{ angularVersion }} &
          <a href="https://analogjs.org/" target="_blank" rel="noopener">Analogjs</a>
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
