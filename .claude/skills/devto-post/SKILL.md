---
name: devto-post
description: This skill should be used when the user asks to post or publish a blog post to dev.to. It automates opening the dev.to new post editor in Chrome via the chrome-devtools MCP, filling in the title, tags, and content, and saving as a draft for review before publishing.
---

## Purpose

Automate posting a blog post to dev.to using the Chrome DevTools MCP. Opens the new post editor, fills in title, tags, and content, then saves as a draft for the user to review and publish.

## Prerequisites

- The `mcp__chrome-devtools__*` tools must be available
- The user must already be logged into dev.to in Chrome

## Workflow

### Step 1: Read the source post

Read the blog post markdown file to extract:
- `title` — from frontmatter
- `slug` — from frontmatter (used to build the canonical URL)
- `categories` — from frontmatter (map to dev.to tags, max 4)
- `coverImage` — from frontmatter (absolute URL)
- Body content — everything after the closing `---`

Also resolve the **local path of the cover image** for upload. The `publicDir` override means local assets live under `libs/portfolio/shared/`, so map the `coverImage` URL by stripping the host: `https://dalenguyen.me/assets/...` → `libs/portfolio/shared/assets/...`. Upload the `.png` (a `.webp` sibling also exists — dev.to wants the PNG).

### Step 2: Prepare dev.to content

Transform the body before pasting:

- **Images**: Replace `<figure>/<img>` blocks with standard markdown images using **absolute URLs** (e.g. `![alt text](https://dalenguyen.me/assets/images/blog/filename.png)`). The `assets/images/blog/` relative path used in the blog app won't work on dev.to.
- **Frontmatter**: Strip the local frontmatter block entirely — dev.to has its own fields.
- **Everything else**: Keep all markdown as-is (headings, code blocks, lists, links).

### Step 3: Open the dev.to editor

```
mcp__chrome-devtools__new_page  url="https://dev.to/new"
```

Take a snapshot to confirm the page loaded and the user is logged in.

### Step 4: Upload the cover image

Use `mcp__chrome-devtools__upload_file` with the **uid of the "Upload Cover Image" button** (it acts as the file chooser) and the local PNG path resolved in Step 1:

```
mcp__chrome-devtools__upload_file  uid=<Upload Cover Image button uid>  filePath="/abs/path/libs/portfolio/shared/assets/images/blog/<slug-image>.png"
```

After upload, the button row changes to **Change / Generate Image / Cover Video Link / Remove** and a thumbnail appears — take a screenshot to confirm. dev.to re-hosts the image on its own S3 CDN.

### Step 5: Fill in the title

Click the "Post Title" textbox uid from the snapshot and type the title.

### Step 6: Fill in the tags

Dev.to supports up to 4 tags. Confirm each tag by appending a **trailing comma** — do NOT use `Enter` or `press_key`, it does not work and causes tags to concatenate instead of being confirmed separately.

```
click tag combobox textbox
type_text "angular,"    ← comma confirms the tag immediately
type_text "mcp,"
type_text "typescript,"
type_text "vite,"
```

**Do NOT use `press_key Enter`** — it does not trigger tag confirmation and the text accumulates as one long string. The trailing comma is the only reliable way to confirm each tag.

dev.to may alias a tag to a canonical equivalent (e.g. `accessibility` displays as `a11y`) — this is expected, not an error.

### Step 7: Fill in the content

Use `mcp__chrome-devtools__evaluate_script` to inject the prepared content directly into the textarea via a native input setter, then dispatch `input` and `change` events so the editor picks it up:

```js
() => {
  const content = `...prepared post body...`;
  const textarea = document.querySelector('textarea[placeholder="Write your post content here..."]');
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  nativeInputValueSetter.call(textarea, content);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  return 'done - length: ' + content.length;
}
```

Take a screenshot after to verify content appeared in the editor.

### Step 8: Set the canonical URL

Click the **"Advanced Post options"** button (gear, at the bottom of the editor) to open the Advanced Post Options modal. Click the **"Canonical URL"** textbox and type the original post URL:

```
https://dalenguyen.me/blog/<slug>
```

Then click **"Done"** to close the modal. This points search engines at your blog as the original source, avoiding duplicate-content penalties. After saving, the published byline reads "Originally published at dalenguyen.me" — confirmation it took.

### Step 9: Save as draft

Click the **"Save Draft"** button — do NOT click Publish. The user must review the rendered draft before publishing.

Take a final screenshot confirming the draft was saved (dev.to shows an "Unpublished Post" banner after saving).

## Notes

- Always save as draft, never publish directly
- After saving, dev.to redirects to the unpublished post preview — confirm the URL changed away from `/new`
- Tags are confirmed by a trailing comma (e.g. `type_text "ai,"`) — `press_key Enter` does not work and causes tags to concatenate
- The cover image **is** uploaded programmatically via `upload_file` against the "Upload Cover Image" button (Step 4); the local PNG lives under `libs/portfolio/shared/assets/...`
- To re-edit an already-saved draft (e.g. to add the cover or canonical after the fact), navigate directly to `<post-url>/edit` — `navigate_page back` can land on `about:blank` instead of the editor
