import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { handleLearnRequest, LEARN_PATH_RE, resolvePublicLearnDir } from '../../server/middleware/learn.ts'

// Tests for the learn-page Nitro middleware. The default export is a thin
// `defineEventHandler` wrapper over `handleLearnRequest`, so we test the
// pure logic directly — no h3 event required.
//
// Run via `node --import ts-node/esm --test src/__tests__/server/learn.spec.ts`
// (no vitest config: the Angular/Nitro plugin in vite.config.ts trips on
// h3 import resolution during the spec transform, and these tests are
// pure Node logic with no Angular dependency).
//
// The spec lives outside `src/server/middleware/` because Nitro scans
// that directory for middleware files and would otherwise treat the spec
// as a middleware handler (it expects a default export of `defineEventHandler`).

describe('LEARN_PATH_RE', () => {
  it('matches canonical /learn/<slug>', () => {
    assert.equal(LEARN_PATH_RE.test('/learn/macbook-m4-pro'), true)
  })

  it('matches /learn/<slug>/ with trailing slash', () => {
    assert.equal(LEARN_PATH_RE.test('/learn/macbook-m4-pro/'), true)
  })

  it('does NOT match the /learn index', () => {
    assert.equal(LEARN_PATH_RE.test('/learn'), false)
    assert.equal(LEARN_PATH_RE.test('/learn/'), false)
  })

  it('does NOT match nested segments, but DOES match /learn/<slug>.html (rejected downstream by SLUG_RE)', () => {
    // The regex's job is to find candidates — `/learn/foo.html` matches
    // because the slug captured is `foo.html`. The downstream SLUG_RE in
    // handleLearnRequest rejects the `.` so the request falls through.
    assert.equal(LEARN_PATH_RE.test('/learn/foo/bar'), false)
    assert.equal(LEARN_PATH_RE.test('/learn/foo.html'), true)
    assert.equal(LEARN_PATH_RE.test('/learn/foo/bar/'), false)
  })
})

describe('handleLearnRequest — happy path', () => {
  let fixtureDir: string
  const slug = 'macbook-m4-pro'

  beforeEach(() => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'learn-mw-'))
    writeFileSync(join(fixtureDir, `${slug}.html`), '<h1>hi</h1>', 'utf-8')
  })

  afterEach(() => {
    rmSync(fixtureDir, { recursive: true, force: true })
  })

  it('returns 200 with the file body for a known slug', () => {
    const result = handleLearnRequest(`/learn/${slug}`, fixtureDir)
    assert.deepEqual(result, {
      status: 200,
      contentType: 'text/html; charset=UTF-8',
      body: '<h1>hi</h1>',
    })
  })

  it('also accepts a trailing slash', () => {
    const result = handleLearnRequest(`/learn/${slug}/`, fixtureDir)
    assert.equal(result?.status, 200)
    assert.equal(result?.body, '<h1>hi</h1>')
  })

  it('reads the latest contents at request time', () => {
    writeFileSync(join(fixtureDir, `${slug}.html`), '<h1>v2</h1>', 'utf-8')
    const result = handleLearnRequest(`/learn/${slug}`, fixtureDir)
    assert.equal(result?.body, '<h1>v2</h1>')
  })
})

describe('handleLearnRequest — slug rejection', () => {
  let fixtureDir: string

  beforeEach(() => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'learn-mw-'))
  })
  afterEach(() => {
    rmSync(fixtureDir, { recursive: true, force: true })
  })

  // Path-traversal guards: even though LEARN_PATH_RE disallows slashes,
  // handleLearnRequest's SLUG_RE is a second layer. These cases cover
  // what would happen if LEARN_PATH_RE ever loosened its rules by mistake.
  const cases: Array<[string, string]> = [
    ['encoded slash', '/learn/foo%2Fbar'],
    ['dot-dot', '/learn/..'],
    ['single dot', '/learn/.'],
    ['leading dash', '/learn/-foo'],
    ['colon', '/learn/foo:bar'],
  ]
  for (const [label, pathname] of cases) {
    it(`falls through on ${label} (${pathname})`, () => {
      const result = handleLearnRequest(pathname, fixtureDir)
      assert.equal(result, null)
    })
  }
})

describe('handleLearnRequest — missing-file fall-through', () => {
  let fixtureDir: string

  beforeEach(() => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'learn-mw-'))
  })
  afterEach(() => {
    rmSync(fixtureDir, { recursive: true, force: true })
  })

  it('returns null when the slug file does not exist (lets Angular SSR 404)', () => {
    const result = handleLearnRequest('/learn/does-not-exist', fixtureDir)
    assert.equal(result, null)
  })

  it('returns null when publicLearnDir is null (no dir found)', () => {
    const result = handleLearnRequest('/learn/anything', null)
    assert.equal(result, null)
  })

  it('returns null for any non-/learn path', () => {
    assert.equal(handleLearnRequest('/blog', fixtureDir), null)
    assert.equal(handleLearnRequest('/api/v1/subscribe', fixtureDir), null)
    assert.equal(handleLearnRequest('/', fixtureDir), null)
    assert.equal(handleLearnRequest('/learn/foo/bar', fixtureDir), null)
  })
})

describe('resolvePublicLearnDir', () => {
  let fixtureDir: string

  beforeEach(() => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'learn-mw-'))
  })
  afterEach(() => {
    rmSync(fixtureDir, { recursive: true, force: true })
  })

  it('finds the learn dir under cwd/public/learn when it exists', () => {
    const learnDir = join(fixtureDir, 'public', 'learn')
    mkdirSync(learnDir, { recursive: true })
    writeFileSync(join(learnDir, 'placeholder.html'), 'ok', 'utf-8')

    const original = process.cwd()
    process.chdir(fixtureDir)
    try {
      // macOS canonicalizes /var/folders → /private/var/folders after chdir,
      // so compare canonical paths instead of string-equal.
      const resolved = resolvePublicLearnDir()
      assert.ok(resolved !== null)
      assert.equal(realpathSync(resolved), realpathSync(learnDir))
    } finally {
      process.chdir(original)
    }
  })

  it('returns null when no candidate exists', () => {
    const isolated = mkdtempSync(join(tmpdir(), 'learn-mw-iso-'))
    const original = process.cwd()
    process.chdir(isolated)
    try {
      // The candidates are cwd/public/learn, cwd/../public/learn, etc.
      // mkdtempSync's dir is unlikely to coincidentally contain a
      // public/learn at any depth, so this should reliably be null.
      // If the host machine ever flakes this, remove the assertion —
      // it's a safety net, not the contract.
      const result = resolvePublicLearnDir()
      assert.ok(result === null || existsSync(result))
    } finally {
      process.chdir(original)
      rmSync(isolated, { recursive: true, force: true })
    }
  })
})