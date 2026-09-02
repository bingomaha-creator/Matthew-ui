import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const scenario = process.env.MATTHEW_UI_SCENARIO

if (!scenario) {
  throw new Error('MATTHEW_UI_SCENARIO is required')
}

export default defineConfig({
  build: {
    cssCodeSplit: true,
    emptyOutDir: true,
    lib: {
      entry: resolve('vite-fixtures', `${scenario}.tsx`),
      formats: ['es'],
      fileName: () => 'bundle.js',
      cssFileName: 'bundle',
    },
    minify: false,
    outDir: resolve('vite-dist', scenario),
  },
})
