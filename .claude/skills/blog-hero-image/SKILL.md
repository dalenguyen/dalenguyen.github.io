---
name: blog-hero-image
description: Use when generating a hero/cover image for a new blog post on dalenguyen.me. Triggers on "generate hero image", "create cover image", "blog hero", or when a new post needs a coverImage asset.
---

# Blog Hero Image Generator

## Overview

Generates a 1200×630 PNG hero image using Python Pillow. Dark terminal-aesthetic design with a left text column and right terminal-window panel. Output goes to `libs/portfolio/shared/assets/images/blog/<slug>.png`.

## Design System

| Token | Value | Purpose |
|-------|-------|---------|
| Canvas | 1200×630 px | Standard OG/blog cover |
| BG | `#0d1117` | GitHub dark background |
| Panel | `#161b22` | Terminal window fill |
| Border | `#30363d` | Subtle panel border |
| Green | `#4ade80` | Primary accent (titles, badges) |
| Blue | `#60a5fa` | Secondary glow |
| Orange | `#fb923c` | Warning / no-cloud badge |
| FG Hi | `#f0f6fc` | Main title text |
| FG Mid | `#8b949e` | Subtitle, tags |
| FG Dim | `#6e7681` | Comments, author |
| Code Blue | `#79c0ff` | Variable names |
| Code Str | `#a8d8a8` | String literals |
| Font (UI) | `/System/Library/Fonts/SFNS.ttf` | Titles, subtitle, tags |
| Font (Mono) | `/System/Library/Fonts/SFNSMono.ttf` | Code, badges |

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ grid overlay (40px, rgba green)                             │
│                                                             │
│  [Series badge]        ┌──────────────────────────────────┐ │
│  Title line 1          │ ● ● ●  filename.py               │ │
│  Title line 2 (green)  │                                  │ │
│  Title line 3          │  # comment                       │ │
│                        │  client = OpenAI(...)            │ │
│  Subtitle text         │  ...                             │ │
│                        │  ✓ 100% local · $0.00/token      │ │
│  [tag] [tag] [tag]     └──────────────────────────────────┘ │
│                        ┌── no-cloud badge (orange) ────────┐ │
│                        └───────────────────────────────────┘ │
│─────────────────────────────────────────────────────────────│
│ D  Dale Nguyen                            dalenguyen.me     │
└─────────────────────────────────────────────────────────────┘
```

- Left column: x=80, width≈560
- Right column (terminal): x=690, width=430
- Author row: bottom 62px

## Quick Reference

```python
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
img = Image.new('RGB', (W, H), hex_to_rgb('#0d1117'))
d   = ImageDraw.Draw(img, 'RGBA')

# Load fonts
f_title = ImageFont.truetype('/System/Library/Fonts/SFNS.ttf', 62)
f_sub   = ImageFont.truetype('/System/Library/Fonts/SFNS.ttf', 17)
f_code  = ImageFont.truetype('/System/Library/Fonts/SFNSMono.ttf', 12)
f_badge = ImageFont.truetype('/System/Library/Fonts/SFNSMono.ttf', 13)

# Save
img.save('libs/portfolio/shared/assets/images/blog/<slug>.png', 'PNG')
```

## Adapting Per Post

Swap these three things for each new post:

1. **Series badge text** — `'● PORTWAY SERIES  · POST N'`
2. **Title lines** — three lines, middle one in GREEN accent
3. **Code block lines** — 12–14 lines representing the post's key snippet
4. **Tags** — match the post's `categories` frontmatter
5. **No-cloud badge text** — one-liner summarising the post's value prop

## Output Path

```
libs/portfolio/shared/assets/images/blog/<slug>.png
```

`coverImage` frontmatter: `https://dalenguyen.me/assets/images/blog/<slug>.png`

## Glow Orbs (depth effect)

Draw concentric ellipses with decreasing alpha to fake radial gradients:

```python
def glow_orb(draw, cx, cy, r, color_rgb, steps=40, max_alpha=30):
    for i in range(steps, 0, -1):
        t = i / steps
        a = int(max_alpha * (1 - t)**1.5)
        rr = int(r * t)
        draw.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], fill=(*color_rgb, a))

glow_orb(d, 1050, -60, 480, GREEN, max_alpha=25)   # top-right green
glow_orb(d, -80, 700, 380, BLUE,  max_alpha=18)    # bottom-left blue
```

## Terminal Window Structure

```python
# Outer rounded rect (panel)
d.rounded_rectangle([TX, TY, TX+TW, TY+panel_h], radius=10,
                    fill=PANEL, outline=BORDER)
# Title bar
d.rounded_rectangle([TX, TY, TX+TW, TY+38], radius=10, fill=(33,38,45,255))
d.rectangle([TX, TY+20, TX+TW, TY+38], fill=(33,38,45,255))
d.line([(TX, TY+38), (TX+TW, TY+38)], fill=BORDER)
# Traffic lights
for i, c in enumerate([DOT_RED, DOT_YEL, DOT_GRN]):
    cx = TX + 18 + i*22
    d.ellipse([cx-6, TY+13, cx+6, TY+25], fill=c)
```

## Series Consistency

For a post series, keep all posts visually consistent:
- Same color palette and fonts
- Same layout proportions
- Vary only: series badge post number, title, code snippet, tags, badge tagline
- Series name stays identical in the badge across all posts
