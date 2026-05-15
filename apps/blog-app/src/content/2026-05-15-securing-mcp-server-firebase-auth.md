---
title: "Securing Your MCP Server with Firebase Auth: A Production Walkthrough"
slug: 2026-05-15-securing-mcp-server-firebase-auth
description: A production walkthrough of securing a Python MCP server with Firebase Authentication, covering dual token types, OAuth 2.0 flow, ContextVar isolation, and Workload Identity.
categories: ['firebase', 'mcp', 'authentication', 'python', 'oauth']
coverImage: https://dalenguyen.me/assets/images/blog/can-tax-auth.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-05-15T00:00:00.000Z
author: Dale Nguyen
---

Model Context Protocol (MCP) servers let AI assistants interact with real user data. That means auth isn't optional — it's the difference between a useful tool and a data breach. This post walks through exactly how [Can Tax Pro](https://cantax.fyi) secures its Python MCP server with Firebase Authentication, supporting both Firebase ID tokens (for direct access) and a custom OAuth 2.0 flow (for third-party clients like Claude.ai).

---

## Architecture Overview

The system has three moving parts:

```
Browser / Claude.ai Client
       │
       │  Authorization: Bearer <token>
       ▼
  MCP Server (Python/FastMCP on Cloud Run)
       │
       │  Firebase Admin SDK
       ▼
  Firestore (data isolated by userId)
```

<figure>
  <img src="assets/images/blog/can-tax-mcp.gif" alt="Can Tax Pro MCP authentication flow demonstration" width="100%" height="auto" />
  <figcaption>Can Tax Pro MCP authentication flow demonstration</figcaption>
</figure>

The MCP server accepts **two token types**:

1. **Firebase ID tokens** — issued by Firebase Authentication, verified cryptographically
2. **Custom OAuth tokens** (`ctpo_*`) — issued by the web app's OAuth server, stored as hashes in Firestore

The web app itself acts as the OAuth authorization server for third-party integrations.

---

## Step 1: Initialize Firebase Admin SDK

The server initializes Firebase Admin once at startup, with environment-aware credential resolution:

```python
# main.py
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore

if not firebase_admin._apps:
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    project_id = os.environ.get("FIREBASE_PROJECT_ID")
    if sa_json:
        cred = credentials.Certificate(json.loads(sa_json))
        firebase_admin.initialize_app(cred, {"projectId": project_id})
    else:
        firebase_admin.initialize_app(options={"projectId": project_id})
```

**Locally**: set `FIREBASE_SERVICE_ACCOUNT` to your service account JSON.
**On Cloud Run**: omit it entirely — the SDK picks up Application Default Credentials (ADC) automatically via Workload Identity.

This means no secrets in production. Your Cloud Run service account just needs the `Firebase Admin SDK Administrator Service Agent` IAM role.

---

## Step 2: Token Resolution

Two resolver functions handle each token type:

### OAuth Tokens (`ctpo_*`)

Custom tokens are never stored in plaintext. The server hashes them with SHA-256 and looks up the hash in Firestore:

```python
def resolve_oauth_token(bearer_token: str) -> str:
    token_hash = hashlib.sha256(bearer_token.encode()).hexdigest()
    doc = db.collection("oauthTokens").document(token_hash).get()
    if not doc.exists:
        raise ValueError("Invalid or revoked OAuth token")
    data = doc.to_dict()
    expires_at = data.get("expiresAt")
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise ValueError("OAuth token expired")
    return data["userId"]
```

The Firestore document stores `userId`, `expiresAt`, `clientId`, and a `refreshTokenHash`. Revocation is instant — delete the document and the token stops working on the next request.

### Firebase ID Tokens

Firebase handles the hard part:

```python
def resolve_id_token(id_token: str) -> str:
    decoded = firebase_auth.verify_id_token(id_token)
    return decoded["uid"]
```

`verify_id_token` checks the signature against Google's public keys and validates claims (expiry, issuer, audience). It caches the public keys locally so it doesn't make a network call on every request.

---

## Step 3: The Auth Middleware

A Starlette `BaseHTTPMiddleware` wraps every request. It tries the OAuth path first, then falls back to Firebase ID tokens:

```python
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip auth for public endpoints
        if request.url.path in _PUBLIC_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                status_code=401,
                headers={"WWW-Authenticate": 'Bearer realm="tax-mcp"'},
            )

        token = auth_header.removeprefix("Bearer ").strip()
        token_set = _user_id_var.set("")

        try:
            # Try OAuth token first
            if token.startswith("ctpo_"):
                user_id = resolve_oauth_token(token)
            else:
                user_id = resolve_id_token(token)
            _user_id_var.set(user_id)
            return await call_next(request)
        except Exception as e:
            return Response(
                status_code=401,
                content=str(e),
                headers={"WWW-Authenticate": 'Bearer realm="tax-mcp"'},
            )
        finally:
            _user_id_var.reset(token_set)
```

Public paths (`/health`, `/.well-known/oauth-protected-resource`) bypass auth — necessary for health checks and OAuth discovery.

---

## Step 4: Thread-Safe User Context

Tools shouldn't take a `user_id` parameter — that would pollute every signature and make testing awkward. Instead, use a `ContextVar` to propagate identity through the async call stack:

```python
# _context.py
from contextvars import ContextVar

_user_id_var: ContextVar[str] = ContextVar("user_id")

def get_user_id() -> str:
    try:
        return _user_id_var.get()
    except LookupError:
        raise RuntimeError("User context not set — request did not pass through auth middleware.")
```

Every tool calls `get_user_id()` to scope its Firestore queries:

```python
# tools/income.py
from .._context import get_user_id

@mcp.tool()
def list_income(tax_year_id: str) -> list[dict]:
    docs = (
        db.collection("users")
          .document(get_user_id())
          .collection("taxYears")
          .document(tax_year_id)
          .collection("incomeEntries")
          .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]
```

`ContextVar` is async-safe — each concurrent request gets its own context, so there's no cross-contamination between users even under high concurrency.

The middleware resets the var in a `finally` block, which is critical: without cleanup, the context leaks to the next request on a reused coroutine.

---

## Step 5: The OAuth 2.0 Server (Web App Side)

For third-party clients (Claude.ai, etc.), the web app implements an OAuth 2.0 authorization server. Here's the flow:

```
1. Client → GET /oauth/authorize?client_id=...&code_challenge=...
2. User logs in (Firebase Auth)
3. Server → redirect with authorization_code
4. Client → POST /oauth/token with code + code_verifier
5. Server → { access_token: "ctpo_...", refresh_token: "ctpr_..." }
```

**Token generation** (TypeScript, server-side):

```typescript
// server/routes/oauth/token.post.ts
import { createHash, randomBytes } from "crypto";

const accessToken = "ctpo_" + randomBytes(32).toString("hex");
const tokenHash = createHash("sha256").update(accessToken).digest("hex");

await db.collection("oauthTokens").doc(tokenHash).set({
  userId: session.userId,
  clientId: session.clientId,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  createdAt: new Date(),
});

return { access_token: accessToken, token_type: "bearer", expires_in: 3600 };
```

The `ctpo_` prefix lets the MCP server route to the right resolver without trying Firebase first. Only the hash ever touches the database.

**PKCE** (Proof Key for Code Exchange) protects the authorization code flow. The client sends a `code_challenge` (SHA-256 of a random `code_verifier`) in step 1, then proves ownership by sending the raw `code_verifier` in step 4. The server hashes it and compares:

```typescript
const verifierHash = createHash("sha256")
  .update(body.code_verifier)
  .digest("base64url");

if (verifierHash !== session.codeChallenge) {
  throw createError({ statusCode: 400, message: "Invalid code_verifier" });
}
```

---

## Step 6: Client-Side (Browser)

The Angular/Analog web app attaches Firebase ID tokens to outbound API requests via an HTTP interceptor:

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  return from(auth.currentUser?.getIdToken() ?? Promise.resolve(null)).pipe(
    switchMap((token) => {
      if (!token) return next(req);
      return next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      }));
    }),
  );
};
```

`getIdToken()` auto-refreshes the token when it's close to expiry, so you never send a stale JWT.

---

## Step 7: Firestore Security Rules

The MCP server uses the **Admin SDK**, which bypasses all Firestore security rules. The `get_user_id()` context is your authorization layer. But rules provide defense-in-depth for direct client SDK access:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /oauthTokens/{tokenId} {
      allow read, write: if false; // Server-only
    }
  }
}
```

OAuth token documents are locked to server-only access. Users can never read or write them directly.

---

## Step 8: OAuth Discovery Endpoint

Well-behaved OAuth clients (including Claude.ai) auto-discover server capabilities. Expose the RFC 9728 metadata endpoint:

```python
@app.get("/.well-known/oauth-protected-resource")
async def oauth_protected_resource():
    return JSONResponse({
        "resource": "https://your-mcp-server.run.app",
        "authorization_servers": ["https://your-web-app.com"],
        "bearer_methods_supported": ["header"],
    })
```

This tells clients where to find the authorization server and how to present tokens. It's a public endpoint (no auth required) — make sure it's in `_PUBLIC_PATHS`.

---

## Step 9: Local Testing

Don't rely on a real Firebase project for unit tests. Seed a test token directly:

```python
# test_auth.py
import hashlib
from firebase_admin import firestore
from datetime import datetime, timezone, timedelta

TEST_TOKEN = "ctpo_localtest_" + "a" * 48
TEST_TOKEN_HASH = hashlib.sha256(TEST_TOKEN.encode()).hexdigest()

def seed_test_token(db, user_id: str):
    db.collection("oauthTokens").document(TEST_TOKEN_HASH).set({
        "userId": user_id,
        "clientId": "test-client",
        "expiresAt": datetime.now(timezone.utc) + timedelta(hours=1),
    })

def cleanup(db):
    db.collection("oauthTokens").document(TEST_TOKEN_HASH).delete()
```

Then test the three critical paths: no token → 401, invalid token → 401, valid token → 200.

---

## Security Properties

| Property | How it's achieved |
|---|---|
| Token confidentiality | Only SHA-256 hashes stored; raw tokens never persist |
| Revocation | Delete Firestore doc; effective immediately |
| Expiry | Enforced server-side on every request |
| Multi-user isolation | `ContextVar` scopes every Firestore query to `userId` |
| No key management in prod | Cloud Run Workload Identity + ADC |
| Code injection protection | PKCE on OAuth code exchange |
| Defense in depth | Firestore rules lock down client SDK access |

---

## Summary

Securing an MCP server with Firebase Auth comes down to four things:

1. **Middleware** that validates tokens before any tool runs
2. **ContextVar** to propagate user identity without polluting tool signatures
3. **Hash-only storage** for custom OAuth tokens
4. **Workload Identity** to eliminate service account key management in production

The dual-token design (Firebase ID tokens for direct use, custom OAuth tokens for third-party clients) keeps the server flexible while maintaining a single, auditable auth path. Every request either has a valid, unexpired token mapping to a real user, or it gets a 401.
