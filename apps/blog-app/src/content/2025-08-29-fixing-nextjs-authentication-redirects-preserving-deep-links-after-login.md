---
title: Fixing Next.js Authentication Redirects - Preserving Deep Links After Login
slug: 2025-08-29-fixing-nextjs-authentication-redirects-preserving-deep-links-after-login
description: Learn how to preserve deep links and user intent in Next.js authentication flows. This comprehensive guide shows how to fix broken redirect behavior where users lose their intended destination after login, ensuring seamless user experiences in protected routes.
categories: ['nextjs', 'authentication', 'middleware', 'firebase', 'tutorial', 'ux']
coverImage: https://dalenguyen.me/assets/images/blog/dailymastery-email.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-08-29T15:17:31.359Z
author: Dale Nguyen
---

## The Problem

In our learning platform [DailyMastery](https://dailymastery.io), we send personalized lesson emails to users with direct links to specific lessons, like:

```md
https://dailymastery.io/dashboard/lessons/sample-lesson-detail
```

However, we discovered a frustrating user experience issue: when users clicked these lesson links from their emails, they would be redirected to login (which is correct for unauthenticated users), but after successful authentication, instead of landing on the specific lesson page, they would end up on the generic dashboard.

This broke the seamless experience we wanted to provide - users had to manually navigate to find their intended lesson after logging in.

<figure>
  <img src="assets/images/blog/dailymastery-lesson-redirect.gif" alt="DailyMastery correct redirect example" width="100%" height="auto" />
  <figcaption>DailyMastery correct redirect example</figcaption>
</figure>

## Understanding the Authentication Flow

Let's break down what was happening:

### The Original (Broken) Flow:

1. **User clicks lesson link**: `https://dailymastery.io/dashboard/lessons/sample-lesson-detail`
2. **Middleware intercepts**: Detects no authentication token
3. **Redirect to login**: `https://dailymastery.io/login` (❌ **Original URL lost!**)
4. **User authenticates**: Successfully logs in with Google
5. **Post-login redirect**: Goes to default `/dashboard` (❌ **Not the intended lesson**)

### The Root Cause

Our Next.js middleware was correctly protecting routes but wasn't preserving the original destination URL when redirecting unauthenticated users to the login page.

Here's the problematic middleware code:

```typescript
// ❌ BEFORE: Lost the original URL
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('firebase-token')?.value

    if (!token) {
      // This loses the original URL!
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}
```

## The Solution: Preserving Deep Links

The fix required two components working together:

### 1. Enhanced Middleware (Capturing the Original URL)

We modified the middleware to capture the full original URL and pass it as a query parameter:

```typescript
// ✅ AFTER: Preserves the original URL
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const cookieToken = request.cookies.get('firebase-token')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const token = cookieToken || headerToken

    if (!token) {
      // 🎯 Key fix: Preserve original URL with query params
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}
```

**Key improvements:**

- `request.nextUrl.pathname` captures the path (`/dashboard/lessons/sample-lesson-detail`)
- `request.nextUrl.search` captures any query parameters
- Combined as `redirect` parameter in the login URL

### 2. Smart Login Page (Reading and Using the Redirect)

Our login page was already set up to handle redirects, but let's look at the key parts:

```typescript
// login/page.tsx
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!loading && user) {
      // 🎯 Check for redirect parameter first, fallback to dashboard
      const redirectUrl = searchParams.get('redirect')
      router.push(redirectUrl || '/dashboard')
    }
  }, [user, loading, router, searchParams])

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      // Store auth token
      document.cookie = `firebase-token=${idToken}; path=/; max-age=86400; secure; samesite=strict`

      // 🎯 Redirect to original destination after login
      const redirectUrl = searchParams.get('redirect')
      router.push(redirectUrl || '/dashboard')
    } catch (error) {
      setError(error.message)
    }
  }
}
```

## The Fixed Flow

Now the authentication flow works perfectly:

### The New (Working) Flow:

1. **User clicks lesson link**: `https://dailymastery.io/dashboard/lessons/sample-lesson-detail`
2. **Middleware intercepts**: Detects no authentication token
3. **Smart redirect**: `https://dailymastery.io/login?redirect=/dashboard/lessons/sample-lesson-detail` (✅ **URL preserved!**)
4. **User authenticates**: Successfully logs in with Google
5. **Post-login redirect**: Goes to the original lesson URL (✅ **Perfect user experience!**)

## Testing the Fix

To test this, you can:

1. **Create a protected route**: Any URL under `/dashboard/*`
2. **Visit while logged out**: The middleware will redirect you
3. **Check the URL**: Should be `/login?redirect=/dashboard/your-original-path`
4. **Complete authentication**: Should redirect back to your original destination

## Key Takeaways

### 1. Middleware Should Preserve Context

When redirecting users for authentication, always preserve where they were trying to go:

```typescript
// Bad: Loses context
return NextResponse.redirect(new URL('/login', request.url))

// Good: Preserves user intent
const loginUrl = new URL('/login', request.url)
loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
return NextResponse.redirect(loginUrl)
```

### 2. Login Pages Should Check for Redirects

Your authentication success handler should always check for intended destinations:

```typescript
// Bad: Always goes to same place
router.push('/dashboard')

// Good: Respects user's original intent
const redirectUrl = searchParams.get('redirect')
router.push(redirectUrl || '/dashboard')
```

### 3. Handle Edge Cases

Consider various scenarios:

- Query parameters in original URLs
- Relative vs absolute URLs
- Security validation of redirect URLs (prevent open redirects)
- Fallback behaviors when redirects fail

## Security Considerations

When implementing redirect preservation, be mindful of **open redirect vulnerabilities**. In our case, we're safe because:

1. We only redirect within our own domain
2. The middleware controls what URLs get set as redirects
3. We validate that redirects start with `/dashboard` (our protected routes)

For additional security, you could add validation:

```typescript
const validateRedirectUrl = (url: string): boolean => {
  // Only allow internal redirects to specific paths
  return url.startsWith('/dashboard') || url.startsWith('/profile')
}

// In login handler:
const redirectUrl = searchParams.get('redirect')
const safeRedirectUrl = redirectUrl && validateRedirectUrl(redirectUrl) ? redirectUrl : '/dashboard'
router.push(safeRedirectUrl)
```

## Conclusion

This seemingly small fix dramatically improved our user experience. Users clicking lesson links in emails now seamlessly land on their intended lessons after authentication, rather than getting lost on a generic dashboard.

The solution demonstrates how proper state preservation in authentication flows is crucial for maintaining user intent and creating smooth, professional web applications.

---

**Technologies used**: Next.js 15, TypeScript, Firebase Auth, Next.js Middleware
