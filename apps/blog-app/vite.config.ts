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
                    // Analytics (GA4 + Microsoft Clarity) are deferred until the
                    // first real user interaction. This keeps them off the critical
                    // path (no main-thread cost or third-party cookies during load),
                    // which is what bots and Lighthouse measure. The trigger events are
                    // deliberately limited to click/keydown/touchstart — NOT scroll or
                    // mousemove — because audit tools (Lighthouse, PageSpeed) auto-scroll
                    // the page, which would otherwise trip the load and re-introduce the
                    // third-party cookies. Mobile readers fire touchstart on first touch;
                    // desktop readers fire click on first link/selection. Tradeoff: a
                    // desktop visitor who only scrolls and never clicks is not tracked.
                    const gTag = `
              <!-- Deferred analytics: GA4 + Microsoft Clarity -->
              <script>
                (function () {
                  var loaded = false;
                  function loadAnalytics() {
                    if (loaded) return;
                    loaded = true;
                    // Google Analytics (GA4)
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){ window.dataLayer.push(arguments); }
                    gtag('js', new Date());
                    gtag('config', 'G-J6E8YSVG6N');
                    var ga = document.createElement('script');
                    ga.async = true;
                    ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-J6E8YSVG6N';
                    document.head.appendChild(ga);
                    // Microsoft Clarity
                    (function(c,l,a,r,i,t,y){
                      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "qwxn51l4s0");
                  }
                  var events = ['click','keydown','touchstart'];
                  function onFirst() {
                    loadAnalytics();
                    events.forEach(function (e) { window.removeEventListener(e, onFirst); });
                  }
                  events.forEach(function (e) {
                    window.addEventListener(e, onFirst, { once: true, passive: true });
                  });
                })();
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
