---
name: medium-post
description: This skill should be used when the user asks to post or publish a blog post to Medium. It automates opening the Medium new story editor via CloakBrowser (stealth Chromium), filling in title and content, uploading inline images, and saving as a draft for review before publishing.
---

## Purpose

Automate posting a blog post to Medium using CloakBrowser (stealth Playwright). Opens the new story editor, fills in title and body content, uploads inline images from local files, then saves as a draft for the user to review and publish.

## Prerequisites

- `cloakbrowser` Python package installed (`pip3 install cloakbrowser --break-system-packages`)
- CloakBrowser launches a separate Chromium binary — it has **no access** to your regular Chrome session. Use `launch_persistent_context("~/.cloakbrowser/medium-profile")` so the session is saved locally. First run requires a manual login; all subsequent runs reuse the saved session automatically.
- Local image files (e.g. `libs/portfolio/shared/assets/images/blog/*.png`) available on disk

## Workflow

### Step 1: Read the source post

Read the blog post markdown file to extract:
- `title` — from frontmatter
- `categories` — from frontmatter (map to Medium topics, max 5)
- `coverImage` — from frontmatter (absolute URL or local path)
- Body content — everything after the closing `---`

### Step 2: Prepare Medium content

Transform the body before injecting:

- **Strip frontmatter**: Remove the entire `---...---` block.
- **Figure/img blocks**: Replace `<figure>/<img>` HTML blocks with a placeholder marker like `[IMAGE: filename.png]` — images must be uploaded directly to Medium's editor (external URLs are not embedded as uploads). Note the line number where each image should appear.
- **Everything else**: Keep all markdown text as-is. Medium's paste handler accepts plain text and preserves paragraphs and headings when pasted.

### Step 3: Open Medium via CloakBrowser

Write and run a Python script using CloakBrowser to drive the browser:

```python
from cloakbrowser import launch_persistent_context
import os, time

# Session persists across runs — log in once, reused forever
PROFILE_DIR = os.path.expanduser("~/.cloakbrowser/medium-profile")
os.makedirs(PROFILE_DIR, exist_ok=True)

context = launch_persistent_context(PROFILE_DIR, headless=False)
page = context.new_page()
page.goto('https://medium.com/new-story')
time.sleep(3)  # wait for editor to load
```

Run this script in the background (append `&`) so the browser stays open while you interact with it — or drive the full flow in a single script.

### Step 4: Set the title

Click the title area and type the title. Medium's title field is a contenteditable `h1`:

```python
title_el = page.locator('h1[data-testid="storyTitle"], div[data-slate-node] h1').first
title_el.click()
page.keyboard.type(title)
```

### Step 5: Inject the body content

Click into the body area (below the title), then paste the prepared text using the clipboard approach so Medium's editor processes it correctly:

```python
import pyperclip  # or use page.evaluate with DataTransfer

body_area = page.locator('div[data-slate-editor]').first
body_area.click()
page.keyboard.press('End')

# Inject via clipboard paste
page.evaluate(f"""
() => {{
  const content = {json.dumps(prepared_body)};
  const dt = new DataTransfer();
  dt.setData('text/plain', content);
  document.activeElement.dispatchEvent(
    new ClipboardEvent('paste', {{ clipboardData: dt, bubbles: true, cancelable: true }})
  );
}}
""")
time.sleep(1)
```

Take a screenshot after to verify content appeared.

### Step 6: Upload inline images

For each `[IMAGE: filename.png]` placeholder in the injected content:

1. In the editor, find the placeholder text and select/delete it so the cursor is on an empty line.
2. Click the **"+"** button that appears to the left of the empty line.
3. Click the **camera/image icon** in the popup toolbar.
4. A hidden `<input type="file">` appears — use `upload_file` to supply the local image path:

```python
# Click + button
page.locator('button[aria-label="Add an image, video, embed, or story"]').click()
# Click image upload icon
page.locator('button[aria-label="Add an image"]').click()
# Upload the file
file_input = page.locator('input[type="file"]')
file_input.set_input_files('/abs/path/to/libs/portfolio/shared/assets/images/blog/zo-hermes-telegram-demo.png')
time.sleep(2)  # wait for upload
```

Add a caption if needed by clicking below the image and typing.

**Cover image**: Medium lets you set a cover image from the publish panel (see Step 8). You can also upload it inline as the first element of the story and it will be promoted automatically.

### Step 7: Add topics (tags)

Topics are set in the publish panel, not the editor. Skip for now — the user can add them manually in the draft review step. Document the categories from the frontmatter so the user knows which topics to add:

- Blog post categories → Medium topics (1–5 allowed)
- Example: `['ai', 'productivity', 'automation']` → "Artificial Intelligence", "Productivity", "Automation"

### Step 8: Save as draft

Do **not** click Publish. Instead, leave the story as-is — Medium auto-saves drafts continuously. To confirm it saved:

```python
# Check for the "Draft" indicator in the top bar
time.sleep(2)
print('Story saved as draft. Check Medium for the draft.')
```

Alternatively click the **"…"** menu → **"Save draft"** if auto-save hasn't triggered.

Take a final screenshot confirming the story content and that the URL is `/p/<id>/edit` (not a published URL).

## Full example script

See `reference/medium_post.py` for the complete working script. Inline summary:

```python
from cloakbrowser import launch
import time, json

TITLE = "Building a Personal Assistant in Zo Computer and Adding Hermes as a Second Assistant"
BODY = """...(prepared body text with [IMAGE: zo-hermes-telegram-demo.png] placeholder)..."""
IMAGE_PATH = "/Users/dalenguyen/projects/github/dalenguyen.github.io/libs/portfolio/shared/assets/images/blog/zo-hermes-telegram-demo.png"

browser = launch(headless=False)
page = browser.new_page()
page.goto('https://medium.com/new-story')
time.sleep(4)

# Title
page.locator('h1[data-testid="storyTitle"]').first.click()
page.keyboard.type(TITLE)
time.sleep(0.5)

# Body
page.keyboard.press('Enter')
page.evaluate(f"""() => {{
  const dt = new DataTransfer();
  dt.setData('text/plain', {json.dumps(BODY)});
  document.activeElement.dispatchEvent(
    new ClipboardEvent('paste', {{ clipboardData: dt, bubbles: true, cancelable: true }})
  );
}}""")
time.sleep(2)

# Keep open for review
time.sleep(600)
browser.close()
```

## Notes

- Always save as draft, never publish directly
- Medium auto-saves; there is no explicit "Save Draft" button — just leaving the editor is enough
- The cover image can be set from the publish panel ("Publish" button → story preview → "Add a cover image")
- If Medium shows a login wall after navigating to `/new-story`, the user needs to log in manually — pause the script with `input('Log in then press Enter...')` and continue
- CloakBrowser passes Medium's bot detection, so no CAPTCHA or rate-limiting should occur
