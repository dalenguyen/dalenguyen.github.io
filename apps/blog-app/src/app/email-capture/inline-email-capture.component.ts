import { CommonModule } from '@angular/common'
import { Component, Input, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EmailCaptureService } from './email-capture.service'

// Inline email capture field rendered above the share row on blog/learn
// pages. Self-contained — owns its own input state and reads submission
// feedback from the shared EmailCaptureService so multiple instances on the
// same page don't trip over each other.
//
// Visual design matches the surrounding share-row buttons (same border /
// surface tokens, same hover affordances) so it reads as part of the post
// footer instead of a bolt-on widget. Tailwind utility classes are used
// throughout to match the rest of apps/blog-app/src/app/routes.
@Component({
  selector: 'blog-inline-email-capture',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section
      class="mt-10 pt-6 border-t border-border"
      aria-label="Subscribe for updates"
      data-email-capture-source="inline"
    >
      <div class="rounded-2xl border border-border bg-surface p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="sm:max-w-sm">
            <h3 class="text-lg font-semibold text-fg">{{ heading }}</h3>
            @if (subheading) {
              <p class="mt-1 text-sm text-fg-muted">{{ subheading }}</p>
            }
          </div>

          @if (status() === 'success') {
            <p
              class="inline-flex items-center gap-2 text-sm font-medium text-accent"
              role="status"
              aria-live="polite"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <span>Thanks — you're subscribed.</span>
            </p>
          } @else {
            <form
              class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
              [attr.aria-busy]="status() === 'submitting' ? 'true' : null"
              (ngSubmit)="onSubmit()"
            >
              <label class="sr-only" [attr.for]="inputId">Email address</label>
              <input
                [id]="inputId"
                name="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                required
                [disabled]="status() === 'submitting'"
                [(ngModel)]="email"
                placeholder="you@example.com"
                class="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm text-fg placeholder:text-fg-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60 sm:w-72"
              />
              <button
                type="submit"
                [disabled]="status() === 'submitting'"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:opacity-60"
              >
                {{ status() === 'submitting' ? 'Subscribing…' : ctaLabel }}
              </button>
            </form>
          }
        </div>

        @if (status() === 'error' && errorMessage(); as msg) {
          <p
            class="mt-3 text-sm text-red-400"
            role="alert"
            aria-live="assertive"
          >
            {{ msg }}
          </p>
        }
      </div>
    </section>
  `,
})
export class InlineEmailCaptureComponent {
  private readonly service = inject(EmailCaptureService)

  /** Optional override for the section heading. Defaults to a value that
   *  reads naturally on both blog post and learn pages. */
  @Input() heading = 'Get new posts in your inbox'
  /** Optional supporting copy under the heading. */
  @Input() subheading = 'No spam — just new posts and learning pages when they ship.'
  /** Submit button label. */
  @Input() ctaLabel = 'Subscribe'
  /** Source tag sent to the subscribe API — useful for analytics later. */
  @Input() source = 'inline'

  // Stable per-instance id so multiple inline fields on a page (e.g. a blog
  // post embedded inside a learn page) don't clash on the label `for` attr.
  readonly inputId = `inline-email-${Math.random().toString(36).slice(2, 9)}`

  email = ''
  readonly status = this.service.status
  readonly errorMessage = this.service.errorMessage

  async onSubmit() {
    await this.service.submit(this.email, this.source)
    if (this.status() === 'success') {
      this.email = ''
    }
  }
}