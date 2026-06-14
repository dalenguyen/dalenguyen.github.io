# Dark-first modern redesign — dalenguyen.me

Date: 2026-06-14
Branch: `feat/dark-mode-redesign`

## Goal

Redesign the whole site (AnalogJS app at `apps/blog-app` + shared `libs/portfolio`)
with a modern, minimal aesthetic, motion/data visualization, and full responsiveness.
**Dark mode is the default**, with a light toggle. All text must meet WCAG AA contrast
in both themes.

## Decisions (confirmed with user)

- **Theme:** dark default + light toggle, choice remembered in `localStorage`.
- **Aesthetic:** modern minimal + accent glow (Vercel/Linear feel). Anchor accent to the
  existing learn-page indigo `#5e6ad2`.
- **Viz:** all three — (1) polish & motion, (2) reading data viz, (3) better code/diagrams.
- **Depth:** full overhaul of every routed surface.
- **Scope add-ons (approved):** replace Angular Material cards; add reading time +
  posts/year chart + category filters on `/blog`; contrast pass on standalone learn HTML.

## Theme architecture

Semantic design tokens via CSS variables, switched by a class on `<html>`:

- `styles.css`: `:root { ...dark... }` and `.light { ...overrides... }`.
- `tailwind.config.cjs`: map semantic colors (`bg`, `surface`, `surface-2`, `border`,
  `fg`, `fg-muted`, `accent`, `accent-fg`) to the CSS vars.
- Components use semantic classes (`bg-surface`, `text-fg`, `text-fg-muted`, `border-border`,
  `text-accent`) → contrast tuned in one place.
- Default `<html>` = dark (no class). Toggle adds `.light`. Inline script in `index.html`
  applies the saved theme before first paint (no flash, SSR-safe).

## Color tokens

Dark (default): page `#0a0b10` · surface `#14161d` · elevated `#1c1f2a` · border `#262b36` ·
text `#e6edf3` · muted `#9aa7b5` · link/accent-text `#818cf8` · accent fill `#5e6ad2` ·
gradient indigo `#6366f1` → cyan `#22d3ee`.

Light: page `#ffffff` · surface `#ffffff` · border `#e5e7eb` · text `#111827` ·
muted `#4b5563` · link/accent `#4f46e5`.

## Per-surface plan

- Shell (`app.component.ts`, `footer.component.ts`): glassy sticky header + theme toggle; new footer.
- Home: intro, publication, portfolio (de-Material), recent-posts, biography, contact.
- `/blog`: dark cards, featured post, reading time, posts-per-year `BarChartComponent`, category filters.
- `/blog/[slug]`: dark markdown + Prism, restyled copy buttons, reading time header.
- `/learn`: dark cards.
- bucket-list: dark + progress viz.
- 404: re-theme + remove leftover tailwindui/"Your Company" boilerplate.
- about.md / contact.md: minor re-theme.
- Standalone learn HTML: contrast/accent pass only (already dark).

## Motion

Hero gradient glow, scroll-reveal (IntersectionObserver), hover lifts, smooth theme
transition — all gated behind `prefers-reduced-motion`.

## Out of scope

Resume component (not routed in this app).

## Verification

`nx build blog-app` passes → serve → walk every route in both themes → Lighthouse/axe
accessibility audit on home + a post → verify token contrast ratios.
