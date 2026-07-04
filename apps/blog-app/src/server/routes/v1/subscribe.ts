import { defineEventHandler, getMethod, getRequestHeader, H3Event, readBody, setHeader, setResponseStatus } from 'h3'

// POST /api/v1/subscribe
// Shared subscribe endpoint backing both the blog/learn modal and inline
// email capture fields. Accepts `{ email: string, source?: string }` and
// forwards to Resend when RESEND_API_KEY + RESEND_AUDIENCE_ID are configured;
// otherwise returns success in dev so the UI flow can be exercised without
// credentials. Kept dependency-free (no `resend` SDK import here) so the route
// builds without network access and won't crash if the package isn't installed
// yet — once the Resend integration lands, swap the dev branch for a real
// fetch to https://api.resend.com/contacts.
//
// CORS: the main site (dalenguyen.me) is a Vercel static SSG build with no
// API routes, so the capture form posts cross-origin to this Cloud Run origin
// (blog-app-185772516206.us-central1.run.app). We allow exactly that origin
// (plus localhost for dev) and echo it back as Access-Control-Allow-Origin.
// Preflight OPTIONS is handled here too — without it the browser blocks the
// real POST before it leaves the page.
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
      const res = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          audience_id: audienceId,
          unsubscribed: false,
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        setResponseStatus(event, 502)
        return { ok: false, error: 'Subscription failed. Please try again later.' }
      }
      return { ok: true, source }
    } catch {
      setResponseStatus(event, 502)
      return { ok: false, error: 'Subscription failed. Please try again later.' }
    }
  }

  // Dev / no-credentials path: accept and log so the UI can be exercised.
  console.log(`[subscribe] (dev) source=${source} email=${email}`)
  return { ok: true, source, dev: true }
})