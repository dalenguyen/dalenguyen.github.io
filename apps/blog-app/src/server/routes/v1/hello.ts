import { defineEventHandler, sendNoContent } from 'h3'

// GET /api/v1/hello
// Smoke-test endpoint kept around for local development convenience. In
// production it is intentionally disabled — it has no real value to a
// public caller, and the previous behaviour (`{ message: 'Hello World' }`)
// was a perfect target for the env/secret scrapers hitting Cloud Run logs
// (404-vs-200 is exactly the signal those scanners use to discover routes).
// Gating on NODE_ENV (rather than removing the file) keeps `nx serve` and
// any local smoke test working without branching the build. The Nitro
// `node-server` preset boots with NODE_ENV=production in Cloud Run.
export default defineEventHandler((event) => {
  if (process.env['NODE_ENV'] === 'production') {
    // Empty body — byte-for-byte identical to the catch-all route at
    // src/server/routes/[...].ts and to every other unknown /api/* path.
    return sendNoContent(event, 404)
  }

  return { message: 'Hello World' }
})
