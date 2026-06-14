/// <reference types="vitest" />

import analog, { type PrerenderContentFile } from '@analogjs/platform'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { PrerenderRoute } from 'nitropack'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import { learnManifestPlugin } from './src/plugins/learn-manifest.plugin'

const learnDir = join(__dirname, '../../libs/portfolio/shared/learn')

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    root: __dirname,
    publicDir: '../../libs/portfolio/shared',
    cacheDir: `../../node_modules/.vite`,
    build: {
      outDir: '../../dist/apps/blog-app/client',
      reportCompressedSize: true,
      target: ['es2020'],
    },
    server: {
      fs: {
        allow: ['.', '../../libs/portfolio'],
      },
    },
    plugins: [
      analog({
        ssr: mode === 'production', // Enable SSR only in production for prerendering
        static: true,
        nitro: {
          preset: 'vercel',
        },
        vite: {
          // tsconfig: 'apps/blog-app/tsconfig.app.json',
          inlineStylesExtension: 'scss|sass|less|css',
        },
        prerender:
          mode === 'production'
            ? {
                routes: async () => [
                  '/',
                  '/blog',
                  '/learn',
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
              }
            : undefined,
        content: {
          // AnalogJS 2.x: the highlighter must be declared here (was app.config-only
          // in 1.x). Without it, contentPlugin skips the markdown frontmatter/content
          // transforms and .md imports fail to parse.
          highlighter: 'prism',
          prismOptions: {
            additionalLangs: [
              'diff',
              'typescript',
              'tsx',
              'json',
              'sql',
              'markdown',
              'yaml',
              'nginx',
              'php',
              'docker',
              'jsx',
              'bash',
              'toml',
              'gitignore',
              'python'
            ],
          },
        },
      }),
      learnManifestPlugin(learnDir),
      nxViteTsPaths(),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  }
})
