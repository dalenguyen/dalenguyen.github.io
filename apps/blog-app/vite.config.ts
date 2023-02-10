/// <reference types="vitest" />

import analog from '@analogjs/platform'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: '../../libs/portfolio/shared',
  build: {
    target: ['es2022'],
  },
  resolve: {
    mainFields: ['module'],
  },
  // optimizeDeps: {
  //   esbuildOptions: {
  //     plugins: [esbuildCommonjs(['front-matter', 'reflect-metadata'])],
  //   },
  // },
  plugins: [
    tsconfigPaths(),
    viteCommonjs(),
    analog({
      static: true,
      // ssr: true,
      // ssrBuildDir: '../../dist/apps/blog-app/ssr',
      // entryServer: 'apps/blog-app/src/main.server.ts',
      vite: {
        tsconfig: 'apps/blog-app/tsconfig.app.json',
        inlineStylesExtension: 'scss|sass|less',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test.ts'],
    include: ['**/*.spec.ts'],
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}))
