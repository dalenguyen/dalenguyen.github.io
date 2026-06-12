---
name: social-media-post
description: Use when asked to create a social media post, LinkedIn post, X thread, or shareable infographic about a technical topic. Generates a single HTML file containing a screenshot-friendly dark-themed infographic at the top plus copy-ready LinkedIn long-form and X thread drafts below — all in one deliverable. Triggers on phrases like "create a LinkedIn post", "make an X thread", "social media post about X", "shareable post for", "infographic post", or "/social-media-post".
---

# Social Media Post

## Purpose

Turn a topic, concept, or explanation into a complete social media deliverable:

1. **A screenshot-friendly HTML infographic** — dark theme, designed to be captured at 980px and posted as an image.
2. **A LinkedIn long-form post** — professional, structured, conversation-starting.
3. **An X / Twitter thread** — numbered, punchy, hook-first.

All three are bundled into a single HTML file with copy buttons next to each post draft.

## When to Use

- "Make me a LinkedIn post about X"
- "Create an X thread explaining Y"
- "Social media post about Z"
- "Shareable infographic for [topic]"
- Follow-up after explaining something: "now turn this into a post"

## Workflow

### Step 1 — Pin down the topic

Confirm the topic if it isn't already clear from context. Then identify:

- **One central pattern, formula, or anatomy** the post will teach
- **3–6 key terms or concepts** that color-code into the visualization
- **2–4 real, concrete examples** the reader will recognize
- **One "aha" insight** — the non-obvious takeaway

If unclear, ask before generating. A weak hook makes a weak post.

### Step 2 — Build the HTML from the template

Copy `assets/template.html` to the user's working directory as `<topic-slug>-post.html`. Replace the `{{PLACEHOLDER}}` markers — they are documented inline in the template.

Critical placeholders:
- `{{TITLE}}` — main headline (≤60 chars)
- `{{SUBTITLE}}` — one-line description
- `{{BADGE}}` — small tag at top ("Cheatsheet", "Quick Guide", "Explainer")
- `{{ANATOMY_*}}` — the central pattern broken into 3–6 color-coded chunks
- `{{LEGEND_*}}` — what each color means
- `{{EXAMPLE_*}}` — concrete real-world cases
- `{{INSIGHT}}` — the key takeaway callout
- `{{FOOTER}}` — short formula or rule-of-thumb (optional)
- `{{LINKEDIN_POST}}` and `{{X_THREAD}}` — the post drafts

### Step 3 — Write the post drafts

Load `references/post-style.md` for tone, structure, and length guidance per platform. Both posts should hit the same key points but in their own register.

### Step 4 — Confirm the signature

The footer signature is hardcoded as `𝕏 @dale_nguyen`. Do not parameterize unless the user explicitly asks to change it.

### Step 5 — Open and deliver

After writing the HTML:
1. Run `open <filename>` to launch it in the browser
2. Use `SendUserFile` to deliver the file
3. Tell the user how to screenshot the infographic card (`Cmd+Shift+4`, then space, click the card) so the post drafts below are excluded from the image

## Design Constraints

- **Width**: 980px max (matches Twitter card and LinkedIn image preview ratios well)
- **Theme**: dark only — better contrast, more modern feel for tech content
- **One file**: everything inline (CSS + JS). No external dependencies.
- **Two regions**: the infographic card (top) is for screenshotting; the post cards (bottom) are for copying. They must visually look separable — the post cards live outside the main card.
- **Copy buttons**: must give visual feedback (✓ Copied) for 1.8 seconds after click.

See `references/design-system.md` for the full CSS variables and color taxonomy.

## Quality Checklist

Before reporting done:

- [ ] All `{{PLACEHOLDER}}` markers have been replaced
- [ ] Infographic chunks fit on one line (use `white-space: nowrap` if needed)
- [ ] 3–6 colors used consistently between formula, legend, and examples
- [ ] LinkedIn post uses plain text only — NO markdown syntax (`**bold**`, `_italic_`, etc)
- [ ] LinkedIn post uses emoji bullets (🔵 🟡 🔴 🟢 🟣) and line breaks for structure
- [ ] LinkedIn post ends with an engagement question
- [ ] X thread has numbered tweets (1/, 2/, etc.) and a strong hook
- [ ] Signature `@dale_nguyen` appears in footer
- [ ] File opens in browser without errors
- [ ] Copy buttons actually work

## Bundled Resources

- `assets/template.html` — the full HTML scaffold with placeholder markers
- `references/post-style.md` — voice, structure, and length guidance per platform
- `references/design-system.md` — CSS variables and color tokens
