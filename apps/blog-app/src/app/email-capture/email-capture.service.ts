import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'

// localStorage key used to persist "this browser has already dismissed the
// modal" — once set, we never re-open the modal for the same reader.
// Versioned (`v1`) so a future schema change can invalidate it without a
// migration step.
const DISMISS_KEY = 'email-capture.dismissed.v1'

// How long, in milliseconds, to wait after `maybeShowModal()` is called
// before actually opening the modal. The previous behavior was a single
// microtask (`Promise.resolve().then`), which fired essentially immediately
// after route activation. A few-second delay lets the reader land on the
// page and start reading before being interrupted — empirically, prompts
// that interrupt the first scroll get dismissed at a much higher rate.
const MODAL_DELAY_MS = 4000

// Relative `/api/v1/subscribe` endpoint. The apex `https://dalenguyen.me`
// is now served by the same Cloud Run instance that hosts this Angular
// app, so the subscribe request is same-origin and avoids CORS / cookie /
// future-proxy surprises. `www.dalenguyen.me` (still Vercel static) has no
// `/api` route — a subscribe attempt from there will 404, but the modal /
// inline field are wired in `routes/blog/[slug].ts` and only enabled when
// `?newsletter=false` is absent, so phasing Vercel out removes that host
// from the request path entirely. The learn plugin's `EMAIL_CAPTURE_JS`
// uses the same relative URL for parity.
//
// REGRESSION NOTE: do NOT reintroduce an absolute Cloud Run URL here —
// the same-origin relative path is intentional now that the apex IS Cloud
// Run, and an absolute URL would make the request cross-origin again,
// re-introducing the CORS allowlist dependency.
const SUBSCRIBE_ENDPOINT = '/api/v1/subscribe'

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

  // Pending timer for the delayed modal-open. Tracked so back-to-back calls
  // to `maybeShowModal()` (e.g. SPA navigations between blog posts before
  // the first timer fires) don't stack timers and open the modal twice, and
  // so we don't keep a reference around after it fires.
  private modalOpenTimer: ReturnType<typeof setTimeout> | null = null

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

  // Persist the dismissal flag in localStorage. Browser-only; silently
  // swallows storage errors so the modal UX still works in privacy modes
  // and sandboxed iframes where localStorage throws on write.
  private persistDismissal(): void {
    if (!isPlatformBrowser(this.platformId)) return
    try {
      this.document.defaultView?.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore — see hasDismissed().
    }
  }

  // Open the modal unless the reader has already dismissed it in a previous
  // visit. Called from the blog/learn pages' ngOnInit. Idempotent: if a
  // delayed open is already scheduled, this call replaces it with a fresh
  // timer rather than stacking another one.
  maybeShowModal(): void {
    if (!isPlatformBrowser(this.platformId)) return
    if (this.modalOpen()) return
    if (this.modalOpenTimer !== null) return
    if (this.hasDismissed()) return
    // Defer opening the modal by a few seconds so the reader has a chance
    // to start reading the post before being interrupted. Re-checks
    // `hasDismissed()` when the timer fires so a successful inline submit
    // during the delay window still suppresses the modal.
    this.modalOpenTimer = setTimeout(() => {
      this.modalOpenTimer = null
      if (this.hasDismissed()) return
      this.modalOpen.set(true)
    }, MODAL_DELAY_MS)
  }

  // Close the modal and persist the dismissal. The flag is what makes the
  // acceptance criterion hold: "never reopens after being closed once".
  dismissModal(): void {
    // Cancel a pending delayed open so the modal doesn't pop up after the
    // reader has already dismissed it on this visit (e.g. X → navigate).
    if (this.modalOpenTimer !== null) {
      clearTimeout(this.modalOpenTimer)
      this.modalOpenTimer = null
    }
    this.modalOpen.set(false)
    this.resetStatus()
    this.persistDismissal()
  }

  // Reset submission state. Called when the modal opens/closes so a previous
  // error doesn't bleed into the next interaction.
  resetStatus(): void {
    this.status.set('idle')
    this.errorMessage.set(null)
  }

  // POST to the same-origin subscribe endpoint. Returns the parsed result so
  // callers can layer on extra behavior (e.g. close-on-success for the
  // modal) without re-reading signals they just wrote.
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
        this.http.post<{ ok: boolean; error?: string }>(SUBSCRIBE_ENDPOINT, {
          email: trimmed,
          source,
        }),
      )
      if (res?.ok) {
        this.status.set('success')
        // Persist the dismissal flag so the modal never reopens for this
        // browser, regardless of which form (modal or inline) the reader
        // used to subscribe. Also cancels any pending delayed open so a
        // successful inline submit while the modal is mid-delay doesn't
        // get followed by a pop-up a moment later.
        if (this.modalOpenTimer !== null) {
          clearTimeout(this.modalOpenTimer)
          this.modalOpenTimer = null
        }
        this.persistDismissal()
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