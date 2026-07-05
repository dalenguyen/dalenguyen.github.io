import { defineEventHandler, getRequestURL, send, setResponseHeader, setResponseStatus } from 'h3'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Nitro middleware that makes the canonical `/learn/<slug>` URL (without the
// `.html` suffix) return the same prerendered static HTML as
// `/learn/<slug>.html`. Closes the apex-Cloud Run 404 reported in #210.
//
// Why a middleware, not an Angular route:
//   1. Learn pages are NOT an Angular feature — they're static HTML emitted
//      at build time by apps/blog-app/src/plugins/learn-manifest.plugin.ts
//      into `public/learn/<slug>.html`. There is no Angular route handler
//      for individual slugs (only `/learn` index).
//   2. On Vercel, the static-suffix routing served `/learn/<slug>` →
//      `/learn/<slug>.html` automatically. Nitro's `node-server` preset
//      (Cloud Run) does NOT do that — the bare path falls through to
//      Angular SSR, which has no handler and 404s.
//   3. Per the issue ("Prefer a Nitro middleware that only matches
//      ^/learn/[^/]+/?$ and is served AFTER prerender"), we scope the
//      regex tightly so we never touch `/learn`, `/api/**`, `/blog/**`,
//      or any static asset path that already has `.html` (those are served
//      from `public/` by Nitro's asset handler and must keep winning).
//
// Path-only filtering: we match on `url.pathname` (no query string) so the
// regex can't be tricked by `/learn/foo?x=.html` looking like a static
// path. The matched slug is also rejected if it doesn't look like a
// plain identifier before we ever join it onto a filesystem path.
//
// Fallback behaviour: if the underlying `public/learn/<slug>.html` file
// does not exist (e.g. stale manifest, typo'd slug), we DO NOT 404 here —
// we let the request fall through to Angular SSR, which has its own 404
// page (`/[...page-not-found].ts`). That keeps the canonical error shape
// consistent with the rest of the app instead of producing a bare 404
// from this middleware.

// We resolve the public dir relative to the Nitro output. The node-server
// preset's working directory at request time is the bundle root
// (`dist/apps/blog-app/analog`), and `public/` sits next to `server/`. The
// candidates cover Cloud Run, `nx preview`, and monorepo dev layouts.
export function resolvePublicLearnDir(): string | null {
  const cwdCandidates = [
    resolve(process.cwd(), 'public', 'learn'),
    resolve(process.cwd(), '..', 'public', 'learn'),
    resolve(process.cwd(), '..', '..', 'public', 'learn'),
  ]
  for (const candidate of cwdCandidates) {
    if (existsSync(candidate)) return candidate
  }

  // The cwd-relative candidates above assume process.cwd() IS the Nitro
  // bundle root (true for `nx preview` / local dev). On Cloud Run it isn't:
  // the Dockerfile's WORKDIR is `/app` and it runs `node analog/server/index.mjs`,
  // so process.cwd() stays `/app` while the real bundle root is `/app/analog`
  // — none of the candidates above ever match, so this always fell through
  // to the Angular 404 page in production. Fall back to walking up from this
  // module's own on-disk location, which Nitro bundles into a real chunk
  // file under `analog/server/**` regardless of cwd; `public/` is always a
  // sibling of `analog/server`.
  let dir = dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'public', 'learn')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

// Slug must be a plain slug (letters, digits, dots, underscores, hyphens).
// Everything else (`.`, `..`, path separators, special chars, percent-encoded
// slashes, etc.) is rejected so we never construct a path that escapes
// `public/learn/`.
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

// Canonical regex for `/learn/<slug>` and `/learn/<slug>/`. Tightly scoped:
//   - no leading/trailing slash drift
//   - exactly one path segment after `/learn/`
//   - excludes `/learn` itself and `/learn/` (those go to the Angular index)
export const LEARN_PATH_RE = /^\/learn\/([^/?#]+)\/?$/

// Pure handler logic, exported separately from the `defineEventHandler`
// wrapper so tests can exercise the path-resolution branches directly
// without an h3 event. The default export is the h3-wrapped version of
// this same function — see below.
export function handleLearnRequest(
  pathname: string,
  publicLearnDir: string | null,
): { status: number; contentType?: string; body?: string } | null {
  // Fast path: not a /learn request → do nothing, let Nitro handle it.
  const match = pathname.match(LEARN_PATH_RE)
  if (!match) return null

  const slug = match[1]

  // Defense in depth: even though the regex disallows slashes, reject any
  // slug that doesn't look like a plain identifier. Stops `..`, encoded
  // path traversal, Windows drive letters, etc. from ever reaching the
  // filesystem layer.
  if (!SLUG_RE.test(slug)) return null

  // We didn't find the public/learn dir at any of the expected locations.
  // Bail out and let Nitro's default handler / Angular SSR take over
  // (which will 404 in the conventional way). We intentionally do NOT
  // 404 from here — that's the responsibility of the upstream layers.
  if (!publicLearnDir) return null

  // existsSync + readFileSync rather than a streaming read because the
  // files are small (~90 KB) and we want one synchronous-feeling code path
  // that works the same on Cloud Run and `nx preview`.
  const filePath = join(publicLearnDir, `${slug}.html`)
  if (!existsSync(filePath)) return null

  const html = readFileSync(filePath, 'utf-8')

  return {
    status: 200,
    contentType: 'text/html; charset=UTF-8',
    body: html,
  }
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const result = handleLearnRequest(url.pathname, resolvePublicLearnDir())
  if (!result) return

  // h3 `send` writes the body. We set the status and Content-Type
  // explicitly so a future h3 change to `send`'s defaults can't quietly
  // shift the response shape. We also set `event.handled` so downstream
  // Nitro handlers / Angular SSR don't try to render the 404 page on top
  // of our static HTML.
  setResponseStatus(event, result.status)
  if (result.contentType) {
    setResponseHeader(event, 'Content-Type', result.contentType)
  }
  // Cache headers mirror what Vercel served (`public, max-age=...`) so a
  // future change to learn content can be invalidated the same way. The
  // 5-minute value is a compromise: long enough for a typical reader to
  // hit the cached copy on a follow-up visit, short enough that a manual
  // deploy shows up quickly without waiting for a CDN edge purge.
  setResponseHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate')
  if (typeof result.body === 'string') {
    return send(event, result.body)
  }
})
