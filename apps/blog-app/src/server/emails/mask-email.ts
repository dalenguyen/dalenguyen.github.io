// Tiny shared helper: mask an email address so it can be safely written
// to logs / error messages without leaking the local-part. Kept as its
// own module so multiple routes (subscribe.ts, unsubscribe.ts) agree on
// the exact masking shape — and so the unit tests can import it
// directly without pulling in a h3-touching route file.
//
// Output:
//   foo@example.com  -> f***@example.com
//   (no `@`)        -> ***

export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  return at > 0 ? `${email[0]}***@${email.slice(at + 1)}` : '***'
}
