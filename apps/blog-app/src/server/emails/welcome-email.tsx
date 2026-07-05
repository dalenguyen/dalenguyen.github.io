/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react'

import { resolveBlogUrl } from './blog-url'

// Pragma comments above force esbuild's classic JSX transform to
// React.createElement/React.Fragment for this file. Nitro's build otherwise
// defaults JSX to the `h` pragma (a Vue/Nuxt-ecosystem convention) since
// nothing in this repo configures a jsxFactory — confirmed live 2026-07-04:
// without this, every element in this file compiled to a bare `h(...)` call
// with no `h` in scope, so rendering threw "h is not defined" at runtime
// (not caught by the build — esbuild doesn't verify the factory identifier
// exists until the code actually runs).

// Welcome email sent to a reader right after a successful subscribe via the
// email capture form. Renders to an HTML email body via
// `react-dom/server` `renderToStaticMarkup` (see ./render.tsx).
//
// Built as a react-email style template: a plain React component that
// returns a self-contained email-safe HTML document. We deliberately avoid
// pulling in `@react-email/components` (not installed and the dependency-free
// pattern is intentional — see apps/blog-app/src/server/routes/v1/subscribe.ts)
// and instead use semantic HTML with inline styles, which is the only safe
// way to render email bodies (external CSS and most <style> blocks are
// stripped or ignored by a large fraction of mail clients: Gmail, Outlook,
// Yahoo, Apple Mail all behave differently).
//
// All copy lives here so designers / copy editors don't need to touch the
// subscribe handler. The handlers in the API route pass the recipient email
// through as a prop so we can personalise without re-rendering the whole
// document.

export interface WelcomeEmailProps {
  email: string
  // Optional override of the sender display name shown in the email body
  // (the transactional "from" used by the API route is configured separately
  // via RESEND_FROM env var). Defaults to a sensible value.
  authorName?: string
  // Optional site URL the email links to. Falls back to the production site.
  siteUrl?: string
  // Optional recipient first-name placeholder for future personalisation. Kept
  // as a prop (rather than parsed from the email) so we can plug a real name
  // capture into the form later without changing this template.
  firstName?: string
}

const DEFAULT_AUTHOR = 'Dale Nguyen'
const DEFAULT_SITE_URL = 'https://dalenguyen.me'
const UNSUBSCRIBE_URL = 'https://dalenguyen.me/unsubscribe'

// Email-safe palette. Mirrors the dark-mode palette used on the blog so the
// welcome email doesn't visually clash with the website the reader just
// subscribed from.
const colors = {
  background: '#0b0f17',
  surface: '#111827',
  surfaceAlt: '#1f2937',
  border: '#1f2937',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  accent: '#22d3ee',
  accentText: '#0b0f17',
} as const

// Tiny style-helper. We could use @react-email/components' <Section>/<Text>
// primitives but those ship CSS-in-JS and class-based styling that doesn't
// always survive mail-client sanitisation, so plain inline styles are safer.
function container(children: React.ReactNode): React.ReactElement {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      width="100%"
      style={{
        backgroundColor: colors.background,
        margin: 0,
        padding: 0,
        width: '100%',
      }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ padding: '32px 16px' }}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              width={600}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                maxWidth: 600,
                width: '100%',
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: '32px' }}>{children}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function WelcomeEmail({
  email,
  authorName = DEFAULT_AUTHOR,
  siteUrl = DEFAULT_SITE_URL,
  firstName,
}: WelcomeEmailProps): React.ReactElement {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi there,'
  const unsubscribeHref = `${UNSUBSCRIBE_URL}?email=${encodeURIComponent(email)}`
  const blogUrl = resolveBlogUrl(siteUrl)

  // Use an explicit Fragment rather than the JSX `<>...</>` shorthand so the
  // children passed to `container` are unambiguously a ReactElement (and the
  // signature stays portable across TS configs that don't enable the
  // shorthand).
  const body: React.ReactElement = (
    <React.Fragment>
      <p
        style={{
          color: colors.text,
          fontSize: 22,
          fontWeight: 700,
          margin: '0 0 8px 0',
        }}
      >
        Welcome aboard
      </p>
      <p
        style={{
          color: colors.textMuted,
          fontSize: 14,
          margin: '0 0 24px 0',
        }}
      >
        {greeting} thanks for subscribing to new posts from {authorName}. I
        will only email you when there is something new worth your time.
      </p>

      <p style={{ color: colors.text, margin: '0 0 16px 0' }}>
        Every couple of weeks I share what I am working on — deep dives on
        AI agents, the occasional RAG rebuild, side-project write-ups,
        and the lessons I wish someone had told me sooner.
      </p>

      <p style={{ color: colors.text, margin: '0 0 24px 0' }}>
        To make sure these land in your inbox (and not in Promotions or
        Spam), please reply to this email or add my sending address to
        your contacts.
      </p>

      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        style={{ margin: '0 0 24px 0' }}
      >
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: colors.accent,
                borderRadius: 8,
              }}
            >
              <a
                href={blogUrl}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: 8,
                  color: colors.accentText,
                  display: 'inline-block',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '12px 20px',
                  textDecoration: 'none',
                }}
              >
                Read the latest posts
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <hr
        style={{
          border: 'none',
          borderTop: `1px solid ${colors.border}`,
          margin: '24px 0',
        }}
      />

      <p
        style={{
          color: colors.textMuted,
          fontSize: 12,
          margin: '0 0 8px 0',
        }}
      >
        You are getting this because you just signed up at {siteUrl}. I
        will never share your email with anyone else.
      </p>
      <p
        style={{
          color: colors.textMuted,
          fontSize: 12,
          margin: 0,
        }}
      >
        Changed your mind?{' '}
        <a
          href={unsubscribeHref}
          style={{ color: colors.accent, textDecoration: 'underline' }}
        >
          Unsubscribe
        </a>
        .
      </p>
    </React.Fragment>
  )

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>Welcome to {authorName}&apos;s newsletter</title>
      </head>
      <body
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          fontSize: 16,
          lineHeight: 1.6,
          margin: 0,
          padding: 0,
        }}
      >
        {container(body)}
      </body>
    </html>
  )
}

export default WelcomeEmail
