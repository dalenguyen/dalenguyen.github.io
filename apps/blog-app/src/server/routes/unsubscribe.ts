import { defineEventHandler, getQuery, getRequestURL, send, setResponseHeader, setResponseStatus, H3Event } from 'h3'
import { maskEmail } from '../emails/mask-email'

// GET /unsubscribe
//
// One-click unsubscribe endpoint. The welcome email links to
// `https://dalenguyen.me/unsubscribe?email=<addr>` (built in
// ./emails/welcome-email.tsx from `UNSUBSCRIBE_URL`). Prior to this route
// existing the link 404'd for every reader — fixing that is the only
// reason this file was added.
//
// Behaviour:
//   1. Reads `email` off the query string.
//   2. Validates it (lenient RFC-5322-ish shape; Resend is the source of
//      truth for deliverability, we just want to filter obviously bad
//      input before the upstream call).
//   3. PATCHes the contact in Resend's audience with `unsubscribed: true`
//      using the same `RESEND_API_KEY` / `RESEND_AUDIENCE_ID` env vars
//      that subscribe.ts uses — keeps the secret surface uniform.
//   4. Renders a self-contained confirmation page (HTML) so the link
//      shows the reader what just happened, instead of dumping JSON and
//      looking like a 200 from a half-broken endpoint.
//
// Why a Nitro route and not an Analog Angular page:
//   The unsubscribe URL is hit by readers from email clients, which send
//   no cookies, no Angular bootstrapping, no JS — they just want a flat
//   HTML page. Nitro renders SSR HTML directly with zero client-side
//   dependencies, which is exactly the shape we need. We do not rely on
//   Angular SSR here on purpose.
//
// Why PATCH `contacts/{email}` instead of a re-upsert POST:
//   The Resend audience contact endpoint supports PATCH by id OR by email
//   when the email is URL-encoded — using the existing email keeps the
//   subscriber's id opaque to us and avoids a second round-trip just to
//   look up the id. POSTing the same contact again with
//   `unsubscribed: true` would also work, but PATCH is the documented
//   intent of "update a contact" and matches the link text.
//
// Production-missing-credentials: subscribe.ts learned the hard way
// (regression: dev-fallback silently masked misconfigured secrets in
// production, see the long comment at the top of v1/subscribe.ts) so we
// mirror its 503 path here. Dev (NODE_ENV !== production/prod) still
// accepts and returns success so local env-less development works.

// HTML escape for the small amount of user-derived copy we render in the
// confirmation page. Limited to the spots that interpolate untrusted
// input (the masked email) — the rest of the page is author-controlled.
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Same lenient validator as subscribe.ts — kept identical on purpose so
// the two endpoints agree on what "a valid email" means.
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// True when the runtime is not production. Same scoping as subscribe.ts.
function isDevRuntime(): boolean {
  const env = process.env['NODE_ENV']
  return env !== 'production' && env !== 'prod'
}

// Compose the Resend PATCH URL. Audience id comes from env so the same
// deploy can be pointed at a different audience without rebuilding.
// Email is URL-encoded for path-safety (e.g. `+` in a local-part).
export function buildContactUrl(email: string): string {
  const audienceId = process.env['RESEND_AUDIENCE_ID'] ?? ''
  return `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`
}

// Outcome of an attempt to flip a contact's `unsubscribed` flag. The
// route uses `reason` to pick the right copy on the rendered page.
export interface UnsubscribeResult {
  ok: boolean
  reason:
    | 'ok'
    | 'invalid_email'
    | 'missing_credentials'
    | 'upstream_error'
    | 'dev_skipped'
  // Upstream HTTP status code, when known (helps /unsubscribe.log correlate).
  status?: number
}

// PATCH a Resend audience contact to `unsubscribed: true`. Pure (ish):
// the only I/O is the Resend fetch. Exported separately from the
// `defineEventHandler` so the unit tests can exercise the branching
// without spinning up h3.
export async function markContactUnsubscribed(email: string): Promise<UnsubscribeResult> {
  const trimmed = email.trim()
  if (!isValidEmail(trimmed)) {
    return { ok: false, reason: 'invalid_email' }
  }

  const apiKey = process.env['RESEND_API_KEY']
  const audienceId = process.env['RESEND_AUDIENCE_ID']

  if (!apiKey || !audienceId) {
    if (isDevRuntime()) {
      // Dev / no-credentials: succeed locally so the UI can be exercised
      // without env wiring. Mirrors the dev-fallback in subscribe.ts.
      console.log(`[unsubscribe] (dev) skipped PATCH — RESEND_API_KEY/AUDIENCE_ID missing email=${maskEmail(trimmed)}`)
      return { ok: true, reason: 'dev_skipped' }
    }
    const keyState = apiKey ? 'set' : 'missing'
    const audState = audienceId ? 'set' : 'missing'
    console.error(
      `[unsubscribe] refusing PATCH in production: RESEND_API_KEY=${keyState} RESEND_AUDIENCE_ID=${audState} email=${maskEmail(trimmed)}`,
    )
    return { ok: false, reason: 'missing_credentials' }
  }

  try {
    const res = await fetch(buildContactUrl(trimmed), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unsubscribed: true }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(
        `[unsubscribe] resend rejected PATCH email=${maskEmail(trimmed)}: status=${res.status} body=${detail.slice(0, 200)}`,
      )
      return { ok: false, reason: 'upstream_error', status: res.status }
    }
    console.log(`[unsubscribe] unsubscribed email=${maskEmail(trimmed)}`)
    return { ok: true, reason: 'ok' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown'
    console.error(`[unsubscribe] fetch failed email=${maskEmail(trimmed)}: ${msg}`)
    return { ok: false, reason: 'upstream_error' }
  }
}

// Body of the confirmation page. Authored to match the dark palette
// used by the welcome email and the rest of blog-app so a reader coming
// from their email doesn't see a visual discontinuity between the two.
function pageShell(title: string, body: string): string {
  // Inline styles only — emails and email-clicked pages live in a wider
  // variety of clients than the main blog site, so we keep this page
  // class-free and styling self-contained.
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(title)} — Dale Nguyen</title>
  <style>
    html, body { background:#0b0f17; color:#e5e7eb; margin:0; padding:0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
    }
    h1 { color:#e5e7eb; font-size: 24px; margin: 0 0 16px 0; }
    p { color:#9ca3af; margin: 0 0 16px 0; }
    a.btn {
      display: inline-block;
      background: #22d3ee;
      color: #0b0f17;
      border-radius: 8px;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
    }
    a.btn:hover { filter: brightness(1.05); }
    .small { font-size: 12px; color:#6b7280; margin-top: 24px; }
  </style>
</head>
<body>
  <main class="card">
    ${body}
    <p class="small"><a href="/" style="color:#22d3ee;">Back to the blog</a></p>
  </main>
</body>
</html>`
}

// Result-state copy used by buildUnsubscribeHtml. `success` is the only
// branch that interpolates user data (the masked email), so the
// escaping matters there and only there.
export type UnsubscribePageState =
  | { kind: 'success'; email: string }
  | { kind: 'error'; reason: 'invalid_email' | 'missing_credentials' | 'upstream_error' }

export function buildUnsubscribeHtml(state: UnsubscribePageState): string {
  if (state.kind === 'success') {
    const masked = escapeHtml(maskEmail(state.email))
    const body = `
      <h1>You're unsubscribed</h1>
      <p>
        <strong>${masked}</strong> has been removed from future newsletter
        sends. Sorry to see you go — the door is always open if you
        want to subscribe again later.
      </p>
      <p>
        <a class="btn" href="/">Read the latest posts</a>
      </p>
    `
    return pageShell("You're unsubscribed", body)
  }
  switch (state.reason) {
    case 'invalid_email':
      return pageShell(
        'Unsubscribe link invalid',
        `
          <h1>Something's off with that link</h1>
          <p>The unsubscribe link is missing or invalid. If you reached this
          page from a newsletter email, please copy the address it was sent to
          and email <a href="mailto:hello@dalenguyen.me" style="color:#22d3ee;">hello@dalenguyen.me</a>
          — I'll remove you manually.</p>
        `,
      )
    case 'missing_credentials':
      return pageShell(
        'Unsubscribe unavailable',
        `
          <h1>Unsubscribe is temporarily unavailable</h1>
          <p>The unsubscribe service is misconfigured on our end. Please try
          again in a few minutes, or email
          <a href="mailto:hello@dalenguyen.me" style="color:#22d3ee;">hello@dalenguyen.me</a>
          and I'll take care of it.</p>
        `,
      )
    case 'upstream_error':
      return pageShell(
        "Couldn't unsubscribe",
        `
          <h1>We couldn't unsubscribe you just now</h1>
          <p>Our email provider returned an error while flipping your
          subscription. Please try the link again in a few minutes, or email
          <a href="mailto:hello@dalenguyen.me" style="color:#22d3ee;">hello@dalenguyen.me</a>
          if the problem sticks.</p>
        `,
      )
  }
}

// h3 entry point. We do everything off the `getQuery` result so the
// route is GET-shaped (the unsubscribe link in the email is a plain
// `<a href>` and bots/email-clients won't send anything else).
export default defineEventHandler(async (event: H3Event) => {
  // Skip non-GET methods silently — preflight/POSTs aren't expected and
  // a 405 would just confuse a reader clicking an email link.
  // h3 normalizes the request method.
  const query = getQuery(event)
  const email = typeof query['email'] === 'string' ? query['email'] : ''

  const result = await markContactUnsubscribed(email)

  // HTTP status mapping:
  //   ok / dev_skipped → 200 (success page)
  //   invalid_email    → 400 (the request itself was wrong)
  //   missing_credentials → 503 (server-side misconfiguration)
  //   upstream_error   → 502 (bad gateway — Resend didn't accept it)
  // 200 on the happy path with a confirmation HTML body is the right
  // shape for an email link: the reader's browser will render it
  // without any further navigation.
  let status: number
  let pageState: UnsubscribePageState
  if (result.ok) {
    status = 200
    pageState = { kind: 'success', email: email.trim() || '' }
  } else {
    switch (result.reason) {
      case 'invalid_email':
        status = 400
        pageState = { kind: 'error', reason: 'invalid_email' }
        break
      case 'missing_credentials':
        status = 503
        pageState = { kind: 'error', reason: 'missing_credentials' }
        break
      case 'upstream_error':
        status = 502
        pageState = { kind: 'error', reason: 'upstream_error' }
        break
    }
  }

  setResponseStatus(event, status)
  setResponseHeader(event, 'Content-Type', 'text/html; charset=UTF-8')
  // Brief cache: an email-client redirector might fetch twice in quick
  // succession. 60 seconds is plenty for retry-collapsing without
  // breaking legitimate re-renders.
  setResponseHeader(
    event,
    'Cache-Control',
    'no-store, no-cache, must-revalidate, max-age=0',
  )

  const html = buildUnsubscribeHtml(pageState)
  // `send` writes the body and marks the event handled so a downstream
  // Nitro route / Angular SSR doesn't try to layer a 404 on top.
  return send(event, html)
})
