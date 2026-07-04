import { renderEmail } from './render'
import { WelcomeEmail } from './welcome-email'

// Server-side wrapper that renders the welcome email and POSTs it to Resend's
// transactional `/emails` endpoint. Triggered from the subscribe API route
// right after a contact is added to the audience.
//
// The Resend /emails endpoint accepts:
//
//   POST https://api.resend.com/emails
//   Authorization: Bearer <RESEND_API_KEY>
//   Content-Type: application/json
//
//   {
//     "from": "Name <addr@domain>",
//     "to":   ["reader@example.com"],
//     "subject": "...",
//     "html": "...",   // optional
//     "text": "..."    // optional
//   }
//
// We explicitly do NOT throw from this function on a Resend failure: signup
// success must be the caller's contract (acceptance criterion: "failure to
// send the welcome email does not block or fail the signup itself"). We log
// instead so the failure is recoverable from the server logs.
//
// Kept dependency-free (no `resend` SDK import) — same pattern the subscribe
// route uses, so the build stays network-access-free.

const RESEND_EMAILS_URL = 'https://api.resend.com/emails'

export interface SendWelcomeOptions {
  email: string
  firstName?: string
  source?: string
}

export interface SendWelcomeResult {
  ok: boolean
  // Resend id when the call succeeded; undefined on failure.
  id?: string
  // Sanitised error description when the call failed; undefined on success.
  error?: string
}

export async function sendWelcomeEmail({
  email,
  firstName,
  source: _source,
}: SendWelcomeOptions): Promise<SendWelcomeResult> {
  const apiKey = process.env['RESEND_API_KEY']
  // Without credentials we can't deliver — but we also can't let the absence
  // of credentials crash a happy signup. Return a soft failure so the caller
  // can treat this as a no-op.
  if (!apiKey) {
    console.log(`[welcome-email] (dev) skipped send to ${email} — RESEND_API_KEY missing`)
    return { ok: false, error: 'RESEND_API_KEY missing' }
  }

  // Sender identity. Defaults to a sensible identity and can be overridden
  // per-deploy via the RESEND_FROM env var (e.g. "Dale Nguyen <hello@dalenguyen.me>").
  const from = process.env['RESEND_FROM'] ?? 'Dale Nguyen <hello@dalenguyen.me>'
  const subject = 'Welcome — thanks for subscribing!'

  let rendered: { html: string; text: string }
  try {
    rendered = renderEmail(WelcomeEmail({ email, firstName }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown render error'
    console.error(`[welcome-email] render failed for ${email}: ${msg}`)
    return { ok: false, error: msg }
  }

  try {
    const res = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html: rendered.html,
        text: rendered.text,
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(
        `[welcome-email] resend rejected send to ${email}: status=${res.status} body=${detail.slice(0, 200)}`,
      )
      return { ok: false, error: `resend status ${res.status}` }
    }
    const body = (await res.json().catch(() => null)) as { id?: string } | null
    return { ok: true, ...(body?.id ? { id: body.id } : {}) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown fetch error'
    console.error(`[welcome-email] fetch failed for ${email}: ${msg}`)
    return { ok: false, error: msg }
  }
}
