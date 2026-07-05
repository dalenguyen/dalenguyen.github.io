import { defineEventHandler, sendNoContent } from 'h3'

// Catch-all 404 for any /api/v1/* path that didn't match a concrete route
// file (e.g. /api/v1/env, /api/v1/config — the shapes env/secret scanners
// probe for). Returns a uniform 404 for every unknown path in this
// namespace, denying scanners a positive "this endpoint might exist"
// signal to differentiate real routes from guesses.
//
// Scoped to server/routes/v1/[...].ts, NOT server/routes/[...].ts. A
// top-level catch-all collides with Analog's own SSR "page not found"
// handler: both register in Nitro's router as the literal pattern `/**`,
// and Nitro's router keeps one handler per exact pattern — Analog's SSR
// catch-all is appended after user routes, so it silently wins, and a
// root-level catch-all here never fires (confirmed empirically: it
// returned 200 with the Angular not-found page instead of a 404, for
// every unmatched path). Nesting under v1/ makes our pattern `/v1/**`,
// which doesn't collide.
//
// The response body is NOT a literal empty body despite calling
// sendNoContent(event, 404) below — Analog's sitemap/XML support installs
// a GET-request self-proxy middleware that re-fetches every GET through
// Nitro's internal ofetch-based $fetch, which throws on any >=400 status
// and replaces the response with Nitro's own generic error JSON
// ({error, url, statusCode, statusMessage, message}). Confirmed via a
// local server run — sendNoContent's own res.end() happens on an inner
// sub-request the outer $fetch call discards. This is a Nitro/Analog
// framework internal, not something fixable from route code (would need a
// Nitro-level fix, e.g. a custom error handler or routeRules override).
// The resulting body is still uniform across every unmatched path under
// /v1/**, so the scanner-facing goal (no differentiating signal) holds —
// just not with a literally empty body.
//
// Known gap: this only covers /api/v1/**, the actual route namespace.
// A probe at /api/foo (outside v1) or a bare /.env still falls through to
// Angular's SSR catch-all with a 200 — same underlying limitation as
// issue #211 (Nitro/Analog's SSR fallback doesn't 404 unmatched paths).
export default defineEventHandler((event) => {
  return sendNoContent(event, 404)
})
