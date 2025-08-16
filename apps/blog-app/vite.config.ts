/// <reference types="vitest" />

import analog, { type PrerenderContentFile } from '@analogjs/platform'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { PrerenderRoute } from 'nitropack'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: __dirname,
  publicDir: '../../libs/portfolio/shared',
  build: {
    // outDir: '../../dist/apps/blog-app/client',
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
    nxViteTsPaths(),
    analog({
      nitro: {
        preset: 'vercel',
      },
      static: true,
      ssr: true,
      vite: {
        tsconfig: 'apps/blog-app/tsconfig.app.json',
        inlineStylesExtension: 'scss|sass|less|css',
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
        postRenderingHooks: [
          async (route: PrerenderRoute) => {
            const gTag = `
              <!-- Google tag (gtag.js) -->
              <script async src="https://www.googletagmanager.com/gtag/js?id=G-J6E8YSVG6N"></script>
              <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', 'G-J6E8YSVG6N');
              </script>

              <!-- Clarity -->
              <script type="text/javascript">
                  (function(c,l,a,r,i,t,y){
                      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                  })(window, document, "clarity", "script", "qwxn51l4s0");
              </script>
            `
            route.contents = route.contents?.concat(gTag)
          },
        ],
        sitemap: {
          host: 'https://dalenguyen.me/',
        },
      },
      content: {
        prismOptions: {
          additionalLangs: ['diff', 'sql', 'markdown', 'yaml', 'cron', 'nginx', 'php'],
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
