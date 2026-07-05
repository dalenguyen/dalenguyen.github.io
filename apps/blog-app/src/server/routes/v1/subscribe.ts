import { randomUUID } from 'node:crypto'
import {
  defineEventHandler,
  getMethod,
  getRequestHeader,
  getRequestIP,
  H3Event,
  readBody,
  setHeader,
  setResponseStatus,
} from 'h3'
import { sendWelcomeEmail } from '../../emails/send-welcome'

// POST /api/v1/subscribe
// Shared subscribe endpoint backing both the blog/learn modal and inline
// email capture fields. Accepts `{ email: string, source?: string }` and
// forwards to Resend when RESEND_API_KEY + RESEND_AUDIENCE_ID are configured.
// In production, missing credentials are a hard error (503) rather than a
// silent dev-fallback success — that fallback previously masked a
// misconfigured secret in production. The dev-fallback path is now scoped
// to NODE_ENV !== 'production' so local development without credentials
// still works.
//
// Kept dependency-free (no `resend` SDK import here) so the route builds
// without network access and won't crash if the package isn't installed.
//
// Uses POST /audiences/{audience_id}/contacts (audience id in the URL path).
// The flat POST /contacts + body audience_id shape looks accepted (201, a
// contact id) but silently does not persist anything — confirmed live against
// the real API on 2026-07-04, don't revert to it.
//
// CORS: the apex `https://dalenguyen.me` is now served by this same Cloud
// Run instance, so the browser's same-origin `POST /api/v1/subscribe` from
// the page never trips a CORS preflight. The allowlist below is kept as a
// safety net for external consumers (the previous absolute-URL workaround
// pointed the modal/inline form at this Cloud Run origin cross-origin, and
// a future proxy / dev tunnel could reintroduce that shape). Preflight
// OPTIONS is handled here too — without it the browser blocks the real
// POST before it leaves the page on any cross-origin consumer.
//
// Welcome email: every successful signup (Resend-configured OR dev no-op)
// triggers a fire-and-forget transactional send via Resend's /emails endpoint.
// The send is awaited-but-not-thrown: if the welcome email fails the signup
// still resolves as success — the acceptance criterion is "failure to send
// the welcome email does not block or fail the signup itself".
//
// Rate limit: an in-memory token bucket keyed by client IP guards against
// scripted signup spam (the original motivation — botters hammering the
// endpoint before it hits Resend). Two buckets per IP: a short window
// (5 req/min) to blunt bursts, and a longer window (50 req/hour) to blunt
// sustained loops. Both refills lazily on the next request after the
// window elapses; there's no scheduler. State is per-process and best-
// effort — the next deploy resets it — which is acceptable here because
// we expect Cloud Armor / WAF rules (separate work, see the issue) to be
// the durable front line, and this is just cheap in-handler first-pass
// filtering. Cloud Run populates `x-forwarded-for` on every request, so
// `getRequestIP({ xForwardedFor: true })` pulls the originating public IP
// directly; the bucket key is "unknown" when no IP can be resolved (which
// collapses all such traffic into one bucket — fine, that's a server
// config bug, not an attack surface).
//
// Logging: every request is tagged with a v4 UUID and logged as
// `[subscribe] reqId=<uuid> ip=<ip> outcome=<...>` so bot bursts can be
// correlated in Cloud Logging without digging through stack traces.
// `outcome` is one of `preflight` (OPTIONS), `bad_email`, `ok`, `ok_dev`,
// `upstream_502`, `missing_credentials`, `rate_limited`, or `internal_error`.
const ALLOWED_ORIGINS = new Set<string>([
  'https://dalenguyen.me',
  'https://www.dalenguyen.me',
  'http://localhost:3000',
  'http://localhost:5173',
])

// Rate-limit knobs. Tuned for "humans typing" not "scripts looping" — a
// real reader never submits more than 2-3 signups/minute even if they
// retype after a typo, so 5/min is a generous ceiling and 50/hr stops a
// single IP from filling the Resend audience overnight.
const RATE_LIMIT_PER_MINUTE = 5
const RATE_LIMIT_PER_HOUR = 50
const RATE_WINDOW_MS = 60 * 1_000
const RATE_LONG_WINDOW_MS = 60 * 60 * 1_000

// IPKeyed bucket — kept intentionally tiny. We store the
// `tokensLeft` + `lastRefillMs` for each window per IP. Two windows
// means two entries per IP. There is no LRU eviction today; an attacker
// rotating IPs could grow this map. If that ever shows up in a memory
// profile, swap to a capped LRU keyed by IP; the surface here is small
// enough that simple is fine for now.
interface RateBucket {
  tokens: number
  lastRefill: number
}
const rateBuckets: {
  perMinute: Map<string, RateBucket>
  perHour: Map<string, RateBucket>
} = {
  perMinute: new Map(),
  perHour: new Map(),
}

// Token-bucket `consume`. Lazily refills proportionally to the time
// elapsed since the last call (no scheduler), clamps to `capacity`,
// returns true if the caller still has tokens, false if exhausted.
function consume(
  buckets: Map<string, RateBucket>,
  key: string,
  capacity: number,
  windowMs: number,
  now: number,
): boolean {
  const existing = buckets.get(key)
  if (!existing) {
    buckets.set(key, { tokens: capacity - 1, lastRefill: now })
    return true
  }
  const elapsed = now - existing.lastRefill
  if (elapsed >= windowMs) {
    // Window rolled over — full top-up.
    existing.tokens = capacity - 1
    existing.lastRefill = now
  } else {
    // Refill proportionally to elapsed/window, then debit one for this
    // request. Partial tokens stay buffered between requests.
    const refilled = Math.floor((elapsed / windowMs) * capacity)
    existing.tokens = Math.min(capacity, existing.tokens + refilled) - 1
    existing.lastRefill = now
  }
  if (existing.tokens < 0) {
    buckets.set(key, existing)
    return false
  }
  buckets.set(key, existing)
  return true
}

function applyCors(event: H3Event, origin: string | undefined): void {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    setHeader(event, 'Access-Control-Allow-Origin', origin)
    setHeader(event, 'Vary', 'Origin')
    setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
    setHeader(event, 'Access-Control-Max-Age', '86400')
  }
}

// True when the runtime is not production. Used to scope the dev-fallback
// success path so a missing RESEND_API_KEY in production fails loudly
// instead of silently pretending the signup succeeded.
function isDevRuntime(): boolean {
  const env = process.env['NODE_ENV']
  return env !== 'production' && env !== 'prod'
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
  const reqId = randomUUID()
  // h3's getRequestIP respects x-forwarded-for and falls back to the
  // socket peer; "unknown" only when neither is present (local dev with
  // no x-forwarded-for header at all).
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  // One structured line per request, emitted at every terminal branch
  // via this helper. Keeps Cloud Logging queries easy to write
  // (`jsonPayload.message:"[subscribe]"` filtered by `outcome=`).
  const log = (outcome: string, extra: Record<string, string> = {}): void => {
    const tail = Object.entries(extra)
      .map(([k, v]) => ` ${k}=${v}`)
      .join('')
    console.log(`[subscribe] reqId=${reqId} ip=${ip} outcome=${outcome}${tail}`)
  }

  const origin = getRequestHeader(event, 'origin')
  applyCors(event, origin)

  // Handle CORS preflight up-front — no body read, no upstream call, no
  // rate limit (OPTIONS itself is the cheap probe the browser sends
  // first; charging tokens for it would penalise retrying subscribers on
  // flaky networks). Logged with outcome=preflight so preflight traffic
  // is still measurable in Cloud Logging if needed.
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    log('preflight')
    return null
  }

  // Rate limit POSTs only. Both buckets have to allow — the minute
  // bucket blunts bursts and the hourly bucket blunts drip attacks
  // that stay under the minute ceiling.
  const now = Date.now()
  if (
    !consume(rateBuckets.perMinute, ip, RATE_LIMIT_PER_MINUTE, RATE_WINDOW_MS, now) ||
    !consume(rateBuckets.perHour, ip, RATE_LIMIT_PER_HOUR, RATE_LONG_WINDOW_MS, now)
  ) {
    setResponseStatus(event, 429)
    // Generic body — same shape as the upstream-502 error so a scanner
    // can't tell the limiter apart from the upstream. No Retry-After
    // header: telling the attacker exactly when to come back is a
    // worse trade than a blind retry.
    log('rate_limited')
    return { ok: false, error: 'Too many requests. Please try again later.' }
  }

  const body = await readBody<{ email?: unknown; source?: unknown }>(event).catch(() => ({}))

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const source = typeof body?.source === 'string' ? body.source : 'unknown'

  // Basic RFC-5322-ish check. Intentionally lenient — the upstream Resend
  // call (when wired up) is the source of truth for deliverability.
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailValid) {
    setResponseStatus(event, 400)
    log('bad_email', { source })
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
        log('upstream_502', { source, status: String(res.status) })
        return { ok: false, error: 'Subscription failed. Please try again later.' }
      }
      dispatchWelcome(email, source)
      log('ok', { source })
      return { ok: true, source }
    } catch (err: unknown) {
      // Network-level failure (DNS, TLS, socket reset) on the Resend hop.
      // Distinct outcome so it doesn't get bucketed with the 502 above.
      const msg = err instanceof Error ? err.message : 'unknown'
      setResponseStatus(event, 502)
      log('upstream_502', { source, error: msg })
      return { ok: false, error: 'Subscription failed. Please try again later.' }
    }
  }

  // Production with missing credentials: fail loudly. Previously this
  // branch returned `{ ok: true, dev: true }`, which silently masked a
  // misconfigured RESEND_API_KEY / RESEND_AUDIENCE_ID on Cloud Run —
  // signups looked like they landed but never reached Resend. Returning
  // 503 makes the misconfiguration visible in logs and to the reader
  // (the form flips to its error state) without leaking internal details.
  if (!isDevRuntime()) {
    const keyState = apiKey ? 'set' : 'missing'
    const audState = audienceId ? 'set' : 'missing'
    console.error(
      `[subscribe] reqId=${reqId} ip=${ip} refusing signup in production: RESEND_API_KEY=${keyState} RESEND_AUDIENCE_ID=${audState} source=${source} email=${email}`,
    )
    setResponseStatus(event, 503)
    return {
      ok: false,
      error: 'Subscription is temporarily unavailable. Please try again later.',
    }
  }

  // Dev / no-credentials path: accept and log so the UI can be exercised
  // without env wiring. The welcome-email send itself short-circuits to a
  // logged no-op when RESEND_API_KEY is missing, so dispatching here keeps
  // the dev path symmetrical with the prod path.
  console.log(`[subscribe] reqId=${reqId} ip=${ip} (dev) source=${source} email=${email}`)
  dispatchWelcome(email, source)
  return { ok: true, source, dev: true }
})
