---
name: interactive-learning-html
description: Use when asked to turn an article, blog post, documentation page, or URL into an interactive HTML learning experience. Triggers on phrases like "make this interactive", "turn this into a learning page", "interactive breakdown of", "teach me X interactively".
---

# Interactive Learning HTML

## Overview

Convert a static article or URL into a self-contained single-file HTML learning experience: dark theme, progress tracking, collapsible sections, live demos, and quizzes.

**Use Claude Opus 4.7** (`claude-opus-4-7`) for this task — the HTML generation requires sustained reasoning over large content.

## Project Integration

Files live at: `libs/portfolio/shared/learn/<kebab-slug>.html`

The `learnManifestPlugin` (vite) auto-injects the site nav bar at `<body>` at build/dev time — **do not include a nav in the HTML file itself**. The plugin reads `<title>`, `<meta name="description">`, `<meta name="date">`, and `<meta name="timestamp">` to populate the `/learn` index page. The index **sorts by date descending, then timestamp descending** as a tiebreaker — missing both pushes the page to the bottom. Always set both.

Verify in dev server at: `http://localhost:3000/learn/<filename>.html` (blog-app runs on port 3000)

## Workflow

1. **Fetch** the URL with WebFetch — never write HTML before reading the source
2. **Map** content to sections (one major concept per section)
3. **Pick a demo** for each concept — see `references/demo-patterns.md`
4. **Write** the single HTML file to `libs/portfolio/shared/learn/<slug>.html` (CSS + JS inline, zero external dependencies)
5. **Open** `/learn/<filename>.html` in the dev server to verify before reporting done

## Page Structure

```
hero          — title, subtitle, hero-label (topic · CURRENT_YEAR — the year the page is written, not the source article's year), progress bar (X / N sections)
section[N]    — collapsible card per concept
  ├─ tabs     — for multi-facet concepts
  ├─ demo     — live interactive simulation
  └─ quiz     — one question with instant feedback
completion    — shown when all sections opened
```

## Critical Rule: Tooltips

Sections use `overflow: hidden` (needed for border-radius). Any `position: absolute` tooltip inside will be clipped.

**Always use `position: fixed` + JS positioning for tooltips.**
See `references/tooltip-pattern.md` for the full implementation.

## References

- `references/css-design-system.md` — CSS variables, component styles (section, tabs, callout, chips, quiz, progress)
- `references/tooltip-pattern.md` — overflow-safe tooltip with smart right/left/below fallback
- `references/demo-patterns.md` — race bars, optimistic update, component tree, quiz, progress tracking

## Source Reference Footer

Every page must end with a source attribution block just before `</body>`:

```html
<div style="max-width:920px;margin:0 auto 48px;padding:0 24px;">
  <div style="border-top:1px solid #2e2e3e;padding-top:20px;display:flex;align-items:center;gap:8px;font-size:13px;color:#7a7a99;">
    <span>Learning Reference</span>
    <span>·</span>
    <a href="SOURCE_URL" target="_blank" rel="noopener"
       style="color:#5e6ad2;text-decoration:none;font-weight:500;">Source Title</a>
  </div>
</div>
```

## Delivery Checklist

- [ ] WebFetch called on source URL
- [ ] File saved to `libs/portfolio/shared/learn/<slug>.html`
- [ ] `<title>`, `<meta name="description">`, `<meta name="date" content="YYYY-MM-DD">`, and `<meta name="timestamp" content="YYYY-MM-DDTHH:MM:SS">` set in `<head>` — all required; index sorts by date then timestamp descending
- [ ] No `<nav>` in the file — plugin injects it automatically
- [ ] Tooltips use `position: fixed` + `initTooltips()` JS
- [ ] Each section has a live demo
- [ ] Each section ends with a quiz question
- [ ] Progress bar and completion banner wired up
- [ ] Source reference footer added before `</body>`
- [ ] No external CDN links — fully self-contained
- [ ] Opened at `/learn/<filename>.html` in dev server to verify
