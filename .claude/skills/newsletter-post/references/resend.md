# Resend newsletter reference (dalenguyen.me)

## Config (defaults baked into `scripts/resend_send.py`)

| Key | Value | Notes |
|---|---|---|
| Audience | `1736935e-03b2-41a8-bfa8-e551ede7854b` (name: "General") | the blog newsletter list |
| From | `Dale Nguyen <hello@news.dalenguyen.me>` | `news.dalenguyen.me` is the verified sending domain |
| API key | Secret Manager secret `RESEND_API_KEY` in project `dalenguyen-prod` | read with account `dale@dalenguyen.me` |
| Site | `https://dalenguyen.me` | used for the site's own unsubscribe URL in test mode |

These are the same env vars the deployed blog uses (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_FROM`), set on the Cloud Run service. The unsubscribe flow itself is handled by the app at `apps/blog-app/src/server/middleware/unsubscribe.ts` (PATCHes the Resend contact to `unsubscribed: true`).

## Fetching the API key (never print it)

```bash
export RESEND_API_KEY=$(gcloud secrets versions access latest \
  --secret=RESEND_API_KEY --project=dalenguyen-prod --account=dale@dalenguyen.me)
```

`resend_send.py` also fetches it automatically via this exact command if `RESEND_API_KEY` is not already in the env, so exporting it is optional.

## Gotchas (each cost real time)

- **Cloudflare blocks default library User-Agents.** `api.resend.com` sits behind Cloudflare; a request with the default `Python-urllib/*` (or any bot-looking) UA returns **HTTP 403 with body `error code: 1010`** — which looks like an auth failure but is a WAF block. `resend_send.py` sends a browser UA on every call. If scripting Resend any other way (curl/fetch from a plain client), set a browser `User-Agent` too.
- **`error code: 1010` ≠ bad key.** Real Resend auth/validation errors are JSON (`{"statusCode":401,...}`). A bare `error code: NNNN` is Cloudflare, not Resend.
- **Broadcasts require an unsubscribe mechanism.** Use Resend's managed merge tag `{{{RESEND_UNSUBSCRIBE_URL}}}` in the broadcast HTML (the script inserts it in `broadcast` mode). It renders a per-recipient one-click unsubscribe and auto-marks the contact unsubscribed. Do NOT hardcode a single unsubscribe URL in a broadcast.
- **Broadcast status is `queued` immediately after send.** It transitions `queued → sending → sent` asynchronously (seconds for a small list). `sent_at` is null until it flips. Poll with `status --broadcast <id>` to confirm.
- **Broadcasts auto-skip unsubscribed contacts.** The audience count includes unsubscribed contacts; the real reach is the "active" count from `audience` mode.
- **Test vs broadcast are different endpoints.** `test` uses `POST /emails` (one transactional message, does not touch audience state). `broadcast` uses `POST /broadcasts` then `POST /broadcasts/{id}/send` (goes to the whole audience, has analytics).

## Resend API endpoints used

| Purpose | Call |
|---|---|
| Single/test email | `POST /emails` `{from,to[],subject,html,headers}` → `{id}` |
| Audience meta | `GET /audiences/{id}` |
| Audience contacts | `GET /audiences/{id}/contacts` → `{data:[{email,unsubscribed}]}` |
| Create broadcast | `POST /broadcasts` `{audience_id,from,subject,name,html}` → `{id}` |
| Send broadcast | `POST /broadcasts/{id}/send` `{}` (or `{scheduled_at}`) |
| Broadcast status | `GET /broadcasts/{id}` → `{status,sent_at,...}` |

Analytics (opens/clicks) for a sent broadcast appear in the Resend dashboard, not returned by the send call.
