---
name: medium-post
description: This skill should be used when the user asks to post or publish a blog post to Medium. It automates opening the Medium new story editor via CloakBrowser (stealth Chromium), filling in title and content from the rendered blog URL, and saving as a draft for review before publishing.
---

## Purpose

Automate posting a blog post to Medium using CloakBrowser (stealth Playwright). Fetches rendered HTML from the live blog URL, pastes it as rich text into Medium's editor (preserving headings, bold, links, code, and cover image with caption), then saves as a draft.

## Prerequisites

- `cloakbrowser` Python package installed (`pip3 install cloakbrowser --break-system-packages`)
- Session profile: `~/.cloakbrowser/medium-profile` — first run requires manual login, all subsequent runs reuse the saved session
- Blog post must be **live** at `https://dalenguyen.me/blog/<slug>`

## Why rendered HTML, not markdown

Medium does not render markdown. Pasting raw markdown produces unformatted plain text. Copying the rendered blog HTML gives `<p>`, `<h2>`, `<a>`, `<strong>`, `<code>`, `<pre>` that Medium converts correctly to its own format.

## Workflow

### Step 1: Read frontmatter from the markdown file

Extract:
- `title` — for Medium's title field and image caption
- `slug` — construct blog URL: `https://dalenguyen.me/blog/<slug>`
- `coverImage` — absolute URL for the cover image
- `categories` — tell the user which Medium topics to add after saving (max 5)

### Step 2: Write and run the Python script

Write a single synchronous script (not background). Template:

```python
from cloakbrowser import launch_persistent_context
import os, time, json

PROFILE_DIR = os.path.expanduser("~/.cloakbrowser/medium-profile")
os.makedirs(PROFILE_DIR, exist_ok=True)

SLUG    = "<slug>"
TITLE   = "<title>"
COVER   = "<coverImage URL>"
TOPICS  = ["Topic1", "Topic2"]   # mapped from categories

context = launch_persistent_context(PROFILE_DIR, headless=False)

# Grant clipboard permissions before any navigation
context.grant_permissions(['clipboard-read', 'clipboard-write'])

# ── Fetch rendered HTML from live blog ──────────────────────────────────────
blog = context.new_page()
blog.goto(f'https://dalenguyen.me/blog/{SLUG}')
blog.wait_for_load_state('networkidle', timeout=20000)

html_body = blog.evaluate("""() => {
  var el = document.querySelector('analog-markdown .analog-markdown');
  if (!el) el = document.querySelector('analog-markdown');
  if (!el) return null;
  var clone = el.cloneNode(true);

  // Strip syntax-highlight spans — keep code text only
  var spans = clone.querySelectorAll('pre span[class]');
  for (var i = 0; i < spans.length; i++) {
    spans[i].replaceWith(document.createTextNode(spans[i].textContent));
  }

  // Make relative body image URLs absolute — Medium silently DROPS relative
  // srcs (e.g. assets/images/blog/x.png) and only imports absolute ones.
  var bodyImgs = clone.querySelectorAll('img');
  for (var i = 0; i < bodyImgs.length; i++) {
    var src = bodyImgs[i].getAttribute('src') || '';
    if (src && !/^https?:\\/\\//.test(src)) {
      bodyImgs[i].setAttribute('src', 'https://dalenguyen.me/' + src.replace(/^\\//, ''));
    }
  }

  // Remove heading IDs (not needed on Medium)
  var hs = clone.querySelectorAll('h1,h2,h3,h4,h5,h6');
  for (var i = 0; i < hs.length; i++) hs[i].removeAttribute('id');

  // Collapse whitespace between tags — prevents Medium creating blank lines
  return clone.innerHTML.replace(/>\\s+</g, '><').trim();
}""")
blog.close()

# Cover image + caption at top, then body
full_html = f'<figure><img src="{COVER}"><figcaption>{TITLE}</figcaption></figure>' + html_body

# ── Open Medium editor ───────────────────────────────────────────────────────
page = context.new_page()
context.grant_permissions(['clipboard-read', 'clipboard-write'])
page.goto('https://medium.com/new-story')
page.wait_for_load_state('domcontentloaded', timeout=30000)
time.sleep(3)

if '/new-story' not in page.url:
    print("Please log in to Medium in the browser window...")
    page.wait_for_url('**/new-story**', timeout=120000)

# ── Write HTML to clipboard via clipboard API ────────────────────────────────
# DataTransfer + ClipboardEvent does NOT work in Medium's editor (May 2026).
# Must use navigator.clipboard.write() + real Meta+v keystroke.
result = page.evaluate(f"""async () => {{
  try {{
    var html = {json.dumps(full_html)};
    var blob = new Blob([html], {{ type: 'text/html' }});
    var item = new ClipboardItem({{ 'text/html': blob }});
    await navigator.clipboard.write([item]);
    return 'ok - len: ' + html.length;
  }} catch(e) {{
    return 'error: ' + e.message;
  }}
}}""")
print(f"Clipboard: {result}")
time.sleep(0.5)

# ── Set title ────────────────────────────────────────────────────────────────
# Medium uses plain contenteditable divs — data-testid/h1 selectors broken (May 2026)
title_el = page.locator('div[contenteditable="true"]').first
title_el.wait_for(timeout=10000)
title_el.click()
page.keyboard.type(TITLE)
time.sleep(0.5)
page.keyboard.press('Enter')
time.sleep(1)

# ── Paste — cursor is already in body after Enter, no re-focus needed ────────
page.keyboard.press('Meta+v')
time.sleep(5)

print(f"Draft URL: {page.url}")
print(f"Topics to add manually: {', '.join(TOPICS)}")
time.sleep(30)
context.browser.close()
```

### Step 3: Confirm and report to user

After the script runs, **verify by re-opening the draft — do not trust the printed URL.** The script reads `page.url` a few seconds after paste, and Medium often still shows `/new-story` then (it redirects to `/p/<id>/edit` only after the first auto-save). A `/new-story` print is NOT proof of failure.

To verify, open `https://medium.com/me/stories/drafts`, find the draft by title, then open `https://medium.com/p/<id>/edit` and count content in the `article`:
- **Images** = 1 (cover) + every in-body image. If you only see 1, the body images were dropped — check that Fix 1 (absolute URLs) ran.
- Headings, code blocks, paragraphs, and char count are non-zero and the body runs intro-to-conclusion.

Then report to the user:
- The real draft URL (`/p/<id>/edit`)
- The topics to add manually from the publish panel
- The **canonical link** to set (publish panel → "Advanced settings → Customize canonical link"): `https://dalenguyen.me/blog/<slug>` — points SEO at the original blog post
- That **tables won't render** on Medium (see Notes) if the post has any
- Remind them to click Publish after reviewing

If you created a corrected replacement draft, **delete the flawed one** so the user can't publish it by mistake: on the drafts page each row has a hover-hidden "Toggle actions menu" button — click it via JS (`el.click()`, not `page.click`, which fails on the hidden element), choose "Delete story", then click "Delete" in the confirmation dialog (scope the query to `[role="dialog"]` so you don't hit a stray button). Create the replacement first, then delete — Medium draft deletion is permanent.

## Notes

- **Always save as draft** — do not click Publish
- Medium auto-saves continuously; no explicit save button needed
- **Topics** must be added manually from the publish panel (click "Publish" → add topics)
- **Tables** in the blog post will not render in Medium (Medium doesn't support tables) — leave as-is, or tell the user to paste table data as screenshots
- **Relative image URLs are silently dropped.** Blog body images often use relative srcs (`assets/images/blog/x.png`); Medium only imports absolute (`https://…`) URLs. Step 2's extraction rewrites them — without it, only the cover (already absolute) survives and before/after screenshots vanish. Always confirm the final image count matches expectations
- The `<figure><figcaption>` pattern is the correct way to embed cover image + caption in one paste — `<img><br>` causes the following text to be misinterpreted as the caption
- CloakBrowser passes Medium's bot detection reliably
- **`DataTransfer` + `ClipboardEvent` does NOT work** in Medium's editor — the paste event fires but Medium ignores it. Use `navigator.clipboard.write()` with `ClipboardItem` + a real `Meta+v` keystroke instead
- After pressing Enter at the end of the title, the cursor is already in the body area — no JS re-focus is needed before `Meta+v`
- Use `domcontentloaded` (not `networkidle`) for the Medium editor page — Medium never reaches networkidle
