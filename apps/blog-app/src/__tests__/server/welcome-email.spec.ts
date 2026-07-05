import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { resolveBlogUrl } from '../../server/emails/blog-url.ts'

// Run via `node --import ts-node/esm --test src/__tests__/server/welcome-email.spec.ts`
// (see learn.spec.ts for why these specs skip vitest; blog-url.ts is a plain
// .ts module with no JSX so it can be imported directly, unlike welcome-email.tsx).

describe('resolveBlogUrl', () => {
  it('appends /blog to a site URL with no trailing slash', () => {
    assert.equal(resolveBlogUrl('https://x.com'), 'https://x.com/blog')
  })

  it('strips a trailing slash before appending /blog', () => {
    assert.equal(resolveBlogUrl('https://x.com/'), 'https://x.com/blog')
  })
})
