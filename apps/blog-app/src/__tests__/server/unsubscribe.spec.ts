import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildContactUrl,
  buildUnsubscribeHtml,
  isValidEmail,
  markContactUnsubscribed,
} from '../../server/routes/unsubscribe.ts'

// Run via `node --import ts-node/esm --test src/__tests__/server/unsubscribe.spec.ts`
// Pure Node logic, no Angular/JSX/Nitro runtime involved (see learn.spec.ts
// for the rationale about skipping vitest here).

const ORIGINAL_FETCH = globalThis.fetch
const ORIGINAL_API_KEY = process.env['RESEND_API_KEY']
const ORIGINAL_AUDIENCE = process.env['RESEND_AUDIENCE_ID']
const ORIGINAL_NODE_ENV = process.env['NODE_ENV']

describe('isValidEmail', () => {
  it('accepts a typical address', () => {
    assert.equal(isValidEmail('foo@example.com'), true)
  })

  it('accepts addresses with subdomains and plus-tags', () => {
    assert.equal(isValidEmail('a.b+tag@mail.example.co.uk'), true)
  })

  it('rejects empty / missing input', () => {
    assert.equal(isValidEmail(''), false)
    assert.equal(isValidEmail('   '), false)
  })

  it('rejects obviously malformed addresses', () => {
    assert.equal(isValidEmail('not-an-email'), false)
    assert.equal(isValidEmail('foo@'), false)
    assert.equal(isValidEmail('@example.com'), false)
    assert.equal(isValidEmail('foo@example'), false)
  })

  it('never throws on weird unicode', () => {
    assert.doesNotThrow(() => isValidEmail('💾@example.com'))
  })
})

describe('buildContactUrl', () => {
  beforeEach(() => {
    process.env['RESEND_AUDIENCE_ID'] = 'aud_123'
  })
  afterEach(() => {
    if (ORIGINAL_AUDIENCE === undefined) delete process.env['RESEND_AUDIENCE_ID']
    else process.env['RESEND_AUDIENCE_ID'] = ORIGINAL_AUDIENCE
  })

  it('uses the contacts-by-email endpoint with the audience id', () => {
    const url = buildContactUrl('foo@example.com')
    assert.equal(url, 'https://api.resend.com/audiences/aud_123/contacts/foo@example.com')
  })

  it('encodes the email for safe URL transport', () => {
    const url = buildContactUrl('a+b@example.com')
    assert.equal(url, 'https://api.resend.com/audiences/aud_123/contacts/a%2Bb@example.com')
  })
})

describe('markContactUnsubscribed', () => {
  beforeEach(() => {
    process.env['RESEND_API_KEY'] = 're_test_xxx'
    process.env['RESEND_AUDIENCE_ID'] = 'aud_xyz'
    // Force production behaviour for these tests so we exercise the real
    // 503 path on missing creds; the dev-fallback is what masked the
    // original subscribe bug.
    process.env['NODE_ENV'] = 'production'
  })
  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH
    if (ORIGINAL_API_KEY === undefined) delete process.env['RESEND_API_KEY']
    else process.env['RESEND_API_KEY'] = ORIGINAL_API_KEY
    if (ORIGINAL_AUDIENCE === undefined) delete process.env['RESEND_AUDIENCE_ID']
    else process.env['RESEND_AUDIENCE_ID'] = ORIGINAL_AUDIENCE
    if (ORIGINAL_NODE_ENV === undefined) delete process.env['NODE_ENV']
    else process.env['NODE_ENV'] = ORIGINAL_NODE_ENV
  })

  it('returns invalid_email for malformed input', async () => {
    const result = await markContactUnsubscribed('not-an-email')
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'invalid_email')
  })

  it('returns missing_credentials in production when env vars are unset', async () => {
    delete process.env['RESEND_API_KEY']
    delete process.env['RESEND_AUDIENCE_ID']
    const result = await markContactUnsubscribed('foo@example.com')
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'missing_credentials')
  })

  it('returns ok when Resend accepts the PATCH', async () => {
    let observedUrl: string | undefined
    let observedInit: RequestInit | undefined
    globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
      observedUrl = String(url)
      observedInit = init
      return new Response(JSON.stringify({ id: 'contact_1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch

    const result = await markContactUnsubscribed('foo@example.com')
    assert.equal(result.ok, true)
    assert.equal(result.reason, 'ok')
    assert.equal(observedUrl, 'https://api.resend.com/audiences/aud_xyz/contacts/foo@example.com')
    assert.equal(observedInit?.method, 'PATCH')
    const headers = observedInit?.headers as Record<string, string> | undefined
    assert.equal(headers?.['Authorization'], 'Bearer re_test_xxx')
    assert.equal(headers?.['Content-Type'], 'application/json')
    const body = JSON.parse(String(observedInit?.body))
    assert.equal(body.unsubscribed, true)
  })

  it('returns upstream_error when Resend answers non-2xx', async () => {
    globalThis.fetch = (async () =>
      new Response('boom', { status: 404, statusText: 'Not Found' })) as typeof fetch
    const result = await markContactUnsubscribed('foo@example.com')
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'upstream_error')
    assert.equal(result.status, 404)
  })

  it('returns upstream_error when fetch itself throws (network failure)', async () => {
    globalThis.fetch = (async () => {
      throw new Error('socket reset')
    }) as typeof fetch
    const result = await markContactUnsubscribed('foo@example.com')
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'upstream_error')
  })

  it('dev runtime with no credentials returns dev_skipped (parallel to subscribe.ts)', async () => {
    delete process.env['RESEND_API_KEY']
    delete process.env['RESEND_AUDIENCE_ID']
    process.env['NODE_ENV'] = 'development'
    let called = false
    globalThis.fetch = (async () => {
      called = true
      return new Response('{}', { status: 200 })
    }) as typeof fetch
    const result = await markContactUnsubscribed('foo@example.com')
    assert.equal(result.ok, true)
    assert.equal(result.reason, 'dev_skipped')
    assert.equal(called, false, 'dev path must not actually call Resend')
  })
})

describe('buildUnsubscribeHtml', () => {
  it('emits the masked email in the success state', () => {
    const html = buildUnsubscribeHtml({ kind: 'success', email: 'foo@example.com' })
    assert.match(html, /Unsubscribed/)
    assert.match(html, /f\*\*\*@example\.com/)
    assert.doesNotMatch(html, /foo@example\.com/)
  })

  it('emits an explicit error state for invalid_email', () => {
    const html = buildUnsubscribeHtml({ kind: 'error', reason: 'invalid_email' })
    assert.match(html, /missing or invalid email/i)
  })

  it('emits an explicit error state for missing_credentials', () => {
    const html = buildUnsubscribeHtml({ kind: 'error', reason: 'missing_credentials' })
    assert.match(html, /temporarily unavailable/i)
  })

  it('emits an explicit error state for upstream_error', () => {
    const html = buildUnsubscribeHtml({ kind: 'error', reason: 'upstream_error' })
    assert.match(html, /try again/i)
  })

  it('renders valid HTML with the same dark palette as the blog', () => {
    const html = buildUnsubscribeHtml({ kind: 'success', email: 'foo@example.com' })
    assert.match(html, /<!doctype html>|<html/i)
    assert.match(html, /text\/html/)
  })
})
