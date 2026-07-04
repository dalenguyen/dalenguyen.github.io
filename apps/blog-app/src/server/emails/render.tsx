import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Render a react-email-style React component to the (html, text) tuple the
// Resend /emails endpoint accepts. `react-dom/server` ships with React 18 and
// is already a transitive dep of this app, so we deliberately do NOT take a
// hard dependency on @react-email/render — the same dependency-free pattern
// used by the subscribe API route (see apps/blog-app/src/server/routes/v1/subscribe.ts):
// keeps the build network-access-free and means the route still works even if
// the package isn't installed. `renderToStaticMarkup` is exactly what
// `@react-email/render` calls under the hood.

// Strip the leading XML/doctype processing so we can hand the markup to Resend
// as a body. Resend accepts either `html` or both `html` + `text`; we send both
// because many clients (Outlook desktop, Mail.app rules) prefer the plaintext
// part.
function dropDoctype(html: string): string {
  const i = html.indexOf('<html')
  return i === -1 ? html : html.slice(i)
}

// Crude but reliable plaintext extractor: strip all tags, collapse runs of
// whitespace, decode the entities we actually emit. Resend will accept either
// `text` or `text/plain` interchangeably.
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export interface RenderedEmail {
  html: string
  text: string
}

export function renderEmail(element: React.ReactElement): RenderedEmail {
  const raw = renderToStaticMarkup(element)
  const html = dropDoctype(raw)
  const text = htmlToPlainText(raw)
  return { html, text }
}
