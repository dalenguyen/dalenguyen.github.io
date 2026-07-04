import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'

// localStorage key used to persist "this browser has already dismissed the
// modal" — once set, we never re-open the modal for the same reader.
// Versioned (`v1`) so a future schema change can invalidate it without a
// migration step.
const DISMISS_KEY = 'email-capture.dismissed.v1'

export type EmailSubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface EmailSubmitResult {
  ok: boolean
  error?: string
}

// Shared service backing both the modal and the inline email field on
// blog/learn pages. Owns:
//   - whether the modal should be visible (browser-only, localStorage-backed)
//   - the per-form submission state (`status` + `errorMessage`) so the modal
//     and inline field can render independent feedback without each component
//     duplicating HttpClient plumbing.
//
// Kept as a single root-provided service so subscribers anywhere in the app
// share the same dismissal flag — closing the modal on a blog post also
// suppresses it on a subsequent learn page visit.
@Injectable({ providedIn: 'root' })
export class EmailCaptureService {
  private readonly http = inject(HttpClient)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly document = inject(DOCUMENT)

  // Modal visibility. Default false so SSR/SSG never paints the modal; the
  // browser-side init in `maybeShowModal()` flips this to true only when the
  // dismissal flag is absent.
  readonly modalOpen = signal(false)
  readonly status = signal<EmailSubmitStatus>('idle')
  readonly errorMessage = signal<string | null>(null)

  // Returns true when the browser has not yet dismissed the modal. Safe to
  // call during SSR — falls through to `false` on the server.
  private hasDismissed(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true
    try {
      return this.document.defaultView?.localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      // Storage can throw in privacy modes / sandboxed iframes — treat as
      // "dismissed" so the modal doesn't pop up repeatedly when we can't
      // remember the choice.
      return true
    }
  }

  // Open the modal unless the reader has already dismissed it in a previous
  // visit. Called from the blog/learn pages' ngOnInit. Idempotent.
  maybeShowModal(): void {
    if (!isPlatformBrowser(this.platformId)) return
    if (this.hasDismissed()) return
    // Defer one frame so the modal renders after the route's content, not
    // before it — avoids an empty-content flash when the route is lazy.
    Promise.resolve().then(() => this.modalOpen.set(true))
  }

  // Close the modal and persist the dismissal. The flag is what makes the
  // acceptance criterion hold: "never reopens after being closed once".
  dismissModal(): void {
    this.modalOpen.set(false)
    this.resetStatus()
    if (!isPlatformBrowser(this.platformId)) return
    try {
      this.document.defaultView?.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore — see hasDismissed().
    }
  }

  // Reset submission state. Called when the modal opens/closes so a previous
  // error doesn't bleed into the next interaction.
  resetStatus(): void {
    this.status.set('idle')
    this.errorMessage.set(null)
  }

  // POST to /api/v1/subscribe. Returns the parsed result so callers can layer
  // on extra behavior (e.g. close-on-success for the modal) without re-reading
  // signals they just wrote.
  async submit(email: string, source: string): Promise<EmailSubmitResult> {
    const trimmed = email.trim()
    if (!trimmed) {
      this.status.set('error')
      this.errorMessage.set('Please enter your email address.')
      return { ok: false, error: this.errorMessage() ?? undefined }
    }
    this.status.set('submitting')
    this.errorMessage.set(null)
    try {
      const res = await firstValueFrom(
        this.http.post<{ ok: boolean; error?: string }>('/api/v1/subscribe', {
          email: trimmed,
          source,
        }),
      )
      if (res?.ok) {
        this.status.set('success')
        return { ok: true }
      }
      this.status.set('error')
      this.errorMessage.set(res?.error ?? 'Something went wrong. Please try again.')
      return { ok: false, error: this.errorMessage() ?? undefined }
    } catch (err: unknown) {
      this.status.set('error')
      // h3 error responses land here as `{ ok: false, error, statusCode }`.
      const apiErr = (err as { error?: { error?: string } })?.error?.error
      this.errorMessage.set(apiErr ?? 'Something went wrong. Please try again.')
      return { ok: false, error: this.errorMessage() ?? undefined }
    }
  }
}