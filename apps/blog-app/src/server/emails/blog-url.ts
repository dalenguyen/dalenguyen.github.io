const BLOG_PATH = '/blog'

// Strips any trailing slash from `siteUrl` before joining the blog path so a
// caller-supplied `siteUrl` ending in `/` doesn't produce a doubled slash
// like `https://x.com//blog`.
export function resolveBlogUrl(siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, '')
  return `${base}${BLOG_PATH}`
}
