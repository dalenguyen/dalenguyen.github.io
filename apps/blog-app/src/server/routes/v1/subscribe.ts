import { defineEventHandler, getMethod, getRequestHeader, H3Event, readBody, setHeader, setResponseStatus } from 'h3'
import { sendWelcomeEmail } from '../../emails/send-welcome'

// POST /api/v1/subscribe
// Shared subscribe endpoint backing both the blog/learn modal and inline
// email capture fields. Accepts `{ email: string, source?: string }` and
// forwards to Resend when RESEND_API_KEY + RESEND_AUDIENCE_ID are configured;
// otherwise returns success in dev so the UI flow can be exercised without
// credentials. Kept dependency-free (no `resend` SDK import here) so the route
// builds without network access and won't crash if the package isn't installed.
//
// Uses POST /audiences/{audience_id}/contacts (audience id in the URL path).
// The flat POST /contacts + body audience_id shape looks accepted (201, a
// contact id) but silently does not persist anything — confirmed live against
// the real API on 2026-07-04, don't revert to it.
//
// CORS: the main site (dalenguyen.me) is a Vercel static SSG build with no
// API routes, so the capture form posts cross-origin to this Cloud Run origin
// (blog-app-185772516206.us-central1.run.app). We allow exactly that origin
// (plus localhost for dev) and echo it back as Access-Control-Allow-Origin.
// Preflight OPTIONS is handled here too — without it the browser blocks the
// real POST before it leaves the page.
//
// Welcome email: every successful signup (Resend-configured OR dev no-op)
// triggers a fire-and-forget transactional send via Resend's /emails endpoint.
// The send is awaited-but-not-thrown: if the welcome email fails the signup
// still resolves as success — the acceptance criterion is "failure to send
// the welcome email does not block or fail the signup itself".
const ALLOWED_ORIGINS = new Set<string>([
  'https://dalenguyen.me',
  'https://www.dalenguyen.me',
  'http://localhost:3000',
  'http://localhost:5173',
])

function applyCors(event: H3Event, origin: string | undefined): void {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    setHeader(event, 'Access-Control-Allow-Origin', origin)
    setHeader(event, 'Vary', 'Origin')
    setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
    setHeader(event, 'Access-Control-Max-Age', '86400')
  }
}

// Forward a successful subscribe to the welcome-email send. Wraps any throw
// from sendWelcomeEmail so a render or Resend failure can't reject the signup
// promise — every path ends with the console line and returns void. The send
// itself is awaited (so the server doesn't exit the request before the
// outbound HTTP call is dispatched) but the result is treated as advisory.
function dispatchWelcome(email: string, source: string): void {
  sendWelcomeEmail({ email, source })
    .then((res) => {
      if (res.ok) {
        console.log(`[welcome-email] sent to ${email} id=${res.id ?? 'unknown'} (source=${source})`)
      } else {
        // Already logged inside sendWelcomeEmail; here just for grep-ability.
        console.log(`[welcome-email] failed (soft) to ${email}: ${res.error ?? 'unknown'} (source=${source})`)
      }
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'unknown'
      console.error(`[welcome-email] unhandled error sending to ${email}: ${msg}`)
    })
}

export default defineEventHandler(async (event) => {
  const origin = getRequestHeader(event, 'origin')
  applyCors(event, origin)

  // Handle CORS preflight up-front — no body read, no upstream call.
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return null
  }

  const body = await readBody<{ email?: unknown; source?: unknown }>(event).catch(() => ({}))

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const source = typeof body?.source === 'string' ? body.source : 'unknown'

  // Basic RFC-5322-ish check. Intentionally lenient — the upstream Resend
  // call (when wired up) is the source of truth for deliverability.
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailValid) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  const apiKey = process.env['RESEND_API_KEY']
  const audienceId = process.env['RESEND_AUDIENCE_ID']

  if (apiKey && audienceId) {
    try {
      const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          unsubscribed: false,
        }),
      })
      if (!res.ok) {
        // Intentionally NOT dispatching the welcome email on a failed
        // audience upsert — we only have confirmed consent after the
        // audience accepted the contact, and we don't want to email
        // addresses we never persisted.
        setResponseStatus(event, 502)
        return { ok: false, error: 'Subscription failed. Please try again later.' }
      }
      dispatchWelcome(email, source)
      return { ok: true, source }
    } catch {
      setResponseStatus(event, 502)
      return { ok: false, error: 'Subscription failed. Please try again later.' }
    }
  }

  // Dev / no-credentials path: accept and log so the UI can be exercised.
  // The welcome-email send itself short-circuits to a logged no-op when
  // RESEND_API_KEY is missing, so dispatching here keeps the dev path
  // symmetrical with the prod path.
  console.log(`[subscribe] (dev) source=${source} email=${email}`)
  dispatchWelcome(email, source)
  return { ok: true, source, dev: true }
})
