# Design System

The infographic uses a dark theme designed for screenshot-then-post workflows. Card width is fixed at 980px max to map cleanly to both LinkedIn image previews and X card aspect ratios.

## CSS Variables

```css
:root {
  --bg: #0a0a12;
  --surface: #14141e;
  --surface2: #1c1c2a;
  --border: #2a2a3c;
  --accent: #6b7ce0;       /* primary brand color — blue-purple */
  --green: #4ade80;        /* active/positive */
  --amber: #fbbf24;        /* version/highlight */
  --red: #f87171;          /* total/warning */
  --purple: #a78bfa;       /* variant/aux */
  --text: #f0f0f8;
  --muted: #8a8aa8;
}
```

## Color Roles

Each concept type maps to a consistent color across the infographic, legend, and examples. Pick the role that fits the concept, not the color you like best.

| Role | Color | Use For |
|------|-------|---------|
| Primary identity | accent (`#6b7ce0`) | Family / category / origin |
| Generation | amber (`#fbbf24`) | Version / age / iteration |
| Total / magnitude | red (`#f87171`) | Total count, big number, memory budget |
| Active / live | green (`#4ade80`) | Active subset, working number, speed budget |
| Variant / modifier | purple (`#a78bfa`) | Suffixes, modes, fine-tuning |

For topics that don't fit this taxonomy, repurpose the roles but stay consistent within the same post.

## Typography

- Headings: system font stack, weight 700-800
- Body: system font stack, weight 400
- Code/tokens: `'SF Mono', 'JetBrains Mono', Monaco, monospace`

## Layout Rules

- **Card max-width**: 980px (sweet spot for screenshot → post)
- **Card padding**: 48px 56px
- **Section spacing**: 36–40px
- **Border radius**: 24px (card), 16px (inner blocks), 8px (chunks/buttons)

## Component Tokens

- **Chunks** (the color-coded name parts): `padding: 5px 10px; border-radius: 8px;` with `white-space: nowrap` to prevent line breaks
- **Examples grid**: `grid-template-columns: 1fr 1fr; gap: 16px`
- **Key insight card**: gradient background `linear-gradient(135deg, rgba(107,124,224,0.1), rgba(74,222,128,0.06))`

## Signature

Always include in footer:

```html
<div class="signature">
  <span class="signature-icon">𝕏</span>
  <span class="signature-handle">@dale_nguyen</span>
</div>
```
