---
name: newsletter-post
description: This skill should be used to announce a newly published dalenguyen.me blog post to the Resend email newsletter — it composes an on-brand HTML announcement from the post's frontmatter, sends a test to a chosen address first, and only after explicit approval broadcasts to the subscriber audience. Triggers on requests like "email the new post to subscribers", "send the newsletter for this post", "announce this post to the list", "send it to the subscribers", or as the announce step after publishing a new post.
---

# Newsletter Post

## Purpose

Turn a freshly published blog post into an email announcement to the dalenguyen.me
Resend newsletter audience. The flow is deliberately **test first, broadcast second**:
send one preview email, let the human confirm it looks right, then send to the list.

## When to use

Use after a new post is **live** on the production site (Cloud Run — the email links
to the live apex URL). If the post is not yet deployed, deploy it first
(`nx run blog-app:deploy`, see `apps/blog-app/CLAUDE.md`) — the email must not link to
a 404 or reference a cover image that has not shipped.

## Inputs

The post slug (or "the latest post"). If not given, use the newest
`apps/blog-app/src/content/*.md` by date prefix. Read its frontmatter for `title`,
`description`, `slug`, and `coverImage`. The live URL is
`https://dalenguyen.me/blog/<slug>`.

Also confirm a **test recipient address** with the user before sending (do not assume one).

## Workflow

### 1. Gather + verify the post

Read the frontmatter (`title`, `description`, `slug`, `coverImage`). Then verify live,
because a broken cover in an inbox is worse than on a page:

```bash
curl -s -A "Mozilla/5.0" -o /dev/null -w "%{http_code}\n" https://dalenguyen.me/blog/<slug>   # expect 200
curl -s -A "Mozilla/5.0" -o /dev/null -w "%{content_type}\n" <coverImage-url>                 # expect image/*
```

If the cover returns `text/html`, the filename/URL is wrong or not deployed — fix before
emailing (the blog uses date-prefixed image filenames that must match `coverImage`).

### 2. Compose the email

Copy `assets/email-template.html` to a working file (e.g. the scratchpad) and fill the tokens:

| Token | Fill with |
|---|---|
| `{{TITLE}}` | post title |
| `{{DESCRIPTION}}` | 1–2 sentence teaser (trim the frontmatter description) |
| `{{COVER_IMAGE}}` | absolute live coverImage URL |
| `{{URL}}` | `https://dalenguyen.me/blog/<slug>` |
| `{{PREHEADER}}` | one punchy inbox-preview line |
| `{{HIGHLIGHTS}}` | 2–4 `<li>…</li>` items — the most compelling specifics of THIS post (interactive widgets, a striking stat, a real result). Compose from the post content. |

Leave `%%UNSUB%%` untouched — `resend_send.py` fills it per mode. Draft a subject line
and propose it to the user (offer a punchier alternative).

### 3. Preview (recommended)

Render the working HTML to an image so the user sees it without opening an inbox
(headless Chrome screenshot), and/or send it with the file tools.

### 4. Send the TEST (always, before any broadcast)

```bash
python3 scripts/resend_send.py test --to <address> --html <working.html> --subject "<subject>"
```

Report the returned message id and ask the user to check that inbox (including
Promotions/Spam). `resend_send.py` reads `RESEND_API_KEY` from env or fetches it from
Secret Manager automatically — no need to export it.

### 5. GATE — wait for explicit approval

**Do not broadcast until the user explicitly approves after seeing the test.** A broadcast
is an irreversible send to real subscribers. Treat "send it" / "looks good, send" as
approval; if the user only reacts to the test without approving the broadcast, ask.

### 6. Check reach, then broadcast

```bash
python3 scripts/resend_send.py audience                       # report the ACTIVE subscriber count
python3 scripts/resend_send.py broadcast --html <working.html> --subject "<subject>" --name "<short label + date>"
```

`broadcast` creates the broadcast (swapping `%%UNSUB%%` for Resend's managed one-click
unsubscribe tag) and sends it to the whole audience. Unsubscribed contacts are auto-skipped.
Add `--draft` to create without sending if the user wants a final dashboard check.

### 7. Confirm delivery

```bash
python3 scripts/resend_send.py status --broadcast <id>        # queued → sending → sent
```

Report the final `status: sent` + `sent_at`. Open/click analytics appear in the Resend
dashboard, not in the API response.

## Configuration and gotchas

All config (audience id, from address, API-key location) and the non-obvious traps —
notably that `api.resend.com` is behind Cloudflare and **403s (`error code: 1010`) any
default library User-Agent**, and that broadcasts must use the `{{{RESEND_UNSUBSCRIBE_URL}}}`
merge tag — live in `references/resend.md`. Read it before deviating from the script.
