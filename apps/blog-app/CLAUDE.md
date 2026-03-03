# Blog App

Angular/Analog SSG blog app deployed to Vercel.

## Stack
- [Analog](https://analogjs.org/) — Angular meta-framework with SSG/SSR
- Vite + Vitest
- Tailwind CSS
- Markdown content in `src/content/`

## Blog Posts
- Files: `src/content/*.md`
- Frontmatter fields: `title`, `slug`, `date`, `draft` (optional)
- Posts with `draft: true` are excluded from build

## Notes
- SSR enabled in production only
- Prerendering via Nitro (Vercel preset)
- Content dir: `src/content/`
- Use the `blog-post-manager` agent to add/update posts
