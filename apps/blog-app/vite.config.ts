/// <reference types="vitest" />

import analog from '@analogjs/platform'
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
