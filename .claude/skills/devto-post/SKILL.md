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
- `categories` — from frontmatter (map to dev.to tags, max 4)
- `coverImage` — from frontmatter (absolute URL)
- Body content — everything after the closing `---`

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

### Step 4: Fill in the title

Click the "Post Title" textbox uid from the snapshot and type the title.

### Step 5: Fill in the tags

Dev.to supports up to 4 tags. Enter each tag **one at a time** — type a tag, then press `Enter` to confirm it, then type the next:

```
click tag combobox textbox
type_text "angular"   ← first tag, no comma
press_key Enter        ← confirm tag
type_text "mcp"       ← second tag
press_key Enter
type_text "typescript"
press_key Enter
type_text "vite"
press_key Enter
```

**Do NOT type tags as a comma-separated string in one go.** Each tag must be typed and confirmed individually with `Enter`.

### Step 6: Fill in the content

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

### Step 7: Save as draft

Click the **"Save Draft"** button — do NOT click Publish. The user must review the rendered draft before publishing.

Take a final screenshot confirming the draft was saved (dev.to shows an "Unpublished Post" banner after saving).

## Notes

- Always save as draft, never publish directly
- After saving, dev.to redirects to the unpublished post preview — confirm the URL changed away from `/new`
- If the tag dropdown shows suggestions after typing, pressing `Enter` selects the first match; this is expected
- The cover image is not set programmatically — inform the user they can upload it manually from the draft editor if needed
