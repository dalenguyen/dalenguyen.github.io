/// <reference types="vitest" />

import analog, { type PrerenderContentFile } from '@analogjs/platform'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
// import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { defineConfig } from 'vite'
// import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: __dirname,
  publicDir: '../../libs/portfolio/shared',
  build: {
    outDir: '../../dist/apps/blog-app/client',
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
    target: ['es2022'],
  },
  resolve: {
    mainFields: ['module'],
  },
  server: {
    fs: {
      allow: ['.', '../../libs/portfolio'],
    },
  },
  plugins: [
    // tsconfigPaths(),
    // viteCommonjs(),
    nxViteTsPaths(),
    analog({
      nitro: {
        preset: 'vercel',
      },
      static: true,
      ssr: false,
      vite: {
        tsconfig: 'apps/blog-app/tsconfig.app.json',
        inlineStylesExtension: 'scss|sass|less',
      },
      prerender: {
        routes: async () => [
          '/',
          '/blog',
          {
            contentDir: 'src/content',
            transform: (file: PrerenderContentFile) => {
              // do not include files marked as draft in frontmatter
              if (file.attributes['draft']) {
                return false
              }
              // use the slug from frontmatter if defined, otherwise use the files basename
              const slug = file.attributes['slug'] || file.name
              return `/blog/${slug}`
            },
          },
        ],
        sitemap: {
          host: 'https://dalenguyen.me/',
        },
      },
      content: {
        prismOptions: {
          additionalLangs: ['diff'],
        },
      },
    }),
  ],
  test: {
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/blog-app',
      provider: 'v8',
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test.ts'],
    include: ['**/*.spec.ts'],
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}))
