const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind')
const { join } = require('path')
const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'), ...createGlobPatternsForDependencies(__dirname)],
  theme: {
    extend: {
      // Semantic, theme-aware colors backed by CSS variables (see styles.css).
      // RGB channel triplets + <alpha-value> so opacity utilities (bg-surface/70)
      // keep working. Added via `extend` so the default Tailwind palette stays
      // available during the migration.
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-fill': 'rgb(var(--accent-fill) / <alpha-value>)',
        'accent-fg': 'rgb(var(--accent-fg) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent-fill) / 0.35), 0 8px 30px -8px rgb(var(--accent-fill) / 0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-pan': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'gradient-pan': 'gradient-pan 12s ease infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // `light:` variant for the rare case a token can't express the difference
    // (e.g. shadows that should only appear in light mode).
    plugin(function ({ addVariant }) {
      addVariant('light', '.light &')
    }),
  ],
}
