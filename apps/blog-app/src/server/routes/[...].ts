import { defineEventHandler, sendNoContent } from 'h3'

// Catch-all 404 for any /api/* path that didn't match a concrete route
// file under src/server/routes/. Nitro's default behaviour for an
// unmatched route is to render a styled HTML error page; that's exactly
// the "got a response, this endpoint might exist" signal env/secret
// scanners feed on. We override the default with a flat `404` and an
// empty body, byte-for-byte identical to the production response from
// /api/v1/hello (see ./v1/hello.ts). A single shape across every
// unknown path denies the scanner a positive signal it can latch onto.
//
// This handler intentionally does NOT log. The Cloud Run access log
// already records the URL and status; emitting a per-request console
// line for every bot probe would just amplify the log-volume problem
// this whole change exists to dampen.
//
// Note: this only intercepts requests routed through Nitro. Prerendered
// static files (robots.txt, assets/*) and Angular SSR routes still flow
// through their own handlers; bot probes that hit those return their
// usual responses and aren't part of the /api/* surface this addresses.
// Updating the static 404 (e.g. /random-path-that-isnt-an-Angular-route)
// is out of scope — see the issue's "Out of scope" section.
export default defineEventHandler((event) => {
  return sendNoContent(event, 404)
})
