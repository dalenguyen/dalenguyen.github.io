import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common'
import {
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EmailCaptureService } from './email-capture.service'

// Modal that prompts the reader for their email on blog post and learn
// pages. Browser-only: it never renders during SSR/SSG so the prerendered
// HTML stays clean of client-only widgets. Closing the modal (via the X
// button, the backdrop click, or the Escape key) persists a flag in
// localStorage so it never reopens for the same browser.
//
// The submit button calls the shared EmailCaptureService, which writes the
// status signal that both this modal and InlineEmailCaptureComponent read
// from — so swapping one component for another doesn't change the feedback
// the reader sees.
@Component({
  selector: 'blog-email-capture-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (service.modalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-capture-modal-title"
      >
        <!-- Backdrop. Clicking it dismisses the modal and persists the
             "don't show again" flag, exactly like the X button does. -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          (click)="dismiss()"
          aria-hidden="true"
        ></div>

        <div
          #panel
          class="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl ring-1 ring-border"
        >
          <button
            type="button"
            (click)="dismiss()"
            aria-label="Close subscribe dialog"
            class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>

          <h2 id="email-capture-modal-title" class="text-xl font-bold text-fg">
            {{ heading }}
          </h2>
          @if (subheading) {
            <p class="mt-2 text-sm text-fg-muted">{{ subheading }}</p>
          }

          @if (service.status() === 'success') {
            <div
              class="mt-5 rounded-xl border border-border bg-surface-2 p-4 text-sm text-fg"
              role="status"
              aria-live="polite"
            >
              <p class="inline-flex items-center gap-2 font-medium text-accent">
                <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                <span>Thanks — you're subscribed.</span>
              </p>
              <p class="mt-2 text-fg-muted">You can close this dialog now.</p>
            </div>
            <button
              type="button"
              (click)="dismiss()"
              class="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Close
            </button>
          } @else {
            <form
              class="mt-5 flex flex-col gap-3"
              (ngSubmit)="onSubmit()"
              [attr.aria-busy]="service.status() === 'submitting' ? 'true' : null"
            >
              <label class="sr-only" for="email-capture-modal-input">Email address</label>
              <input
                #emailInput
                id="email-capture-modal-input"
                name="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                required
                [disabled]="service.status() === 'submitting'"
                [(ngModel)]="email"
                placeholder="you@example.com"
                class="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg placeholder:text-fg-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
              />
              <button
                type="submit"
                [disabled]="service.status() === 'submitting'"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:opacity-60"
              >
                {{ service.status() === 'submitting' ? 'Subscribing…' : ctaLabel }}
              </button>
            </form>

            @if (service.status() === 'error' && service.errorMessage(); as msg) {
              <p
                class="mt-3 text-sm text-red-400"
                role="alert"
                aria-live="assertive"
              >
                {{ msg }}
              </p>
            }

            <p class="mt-3 text-xs text-fg-muted">
              We'll only email you when there's something new. Unsubscribe any time.
            </p>
          }
        </div>
      </div>
    }
  `,
})
export class EmailCaptureModalComponent {
  readonly service = inject(EmailCaptureService)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly document = inject(DOCUMENT)
  private readonly elementRef = inject(ElementRef<HTMLElement>)

  @ViewChild('emailInput') emailInput?: ElementRef<HTMLInputElement>

  heading = 'Stay in the loop?'
  subheading = 'Drop your email and I will send new posts and learning pages your way.'
  ctaLabel = 'Subscribe'
  source = 'modal'

  email = ''

  // Escape closes the modal — common dialog UX. Bound on the host so it works
  // regardless of where focus sits inside the modal.
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.service.modalOpen()) {
      this.dismiss()
    }
  }

  async onSubmit() {
    await this.service.submit(this.email, this.source)
    if (this.service.status() === 'success') {
      this.email = ''
    }
  }

  dismiss() {
    this.email = ''
    this.service.dismissModal()
  }

  // When the modal mounts in the browser, focus the email input. Helps
  // keyboard / screen-reader users start typing immediately. Browser-only —
  // the modal template only renders after modalOpen() flips true on the
  // client.
  ngAfterViewChecked() {
    if (!isPlatformBrowser(this.platformId)) return
    if (this.service.modalOpen() && this.emailInput?.nativeElement) {
      // Only steal focus if focus isn't already inside this component, so
      // repeated change-detection passes don't yank focus mid-typing.
      const active = this.document.activeElement
      if (active && this.elementRef.nativeElement.contains(active)) return
      this.emailInput.nativeElement.focus()
    }
  }
}