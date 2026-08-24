import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const externalPackages = ['clsx', 'react', 'react-dom']

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    sourcemap: true,
    rollupOptions: {
      external: (id) =>
        externalPackages.some(
          (packageName) =>
            id === packageName || id.startsWith(`${packageName}/`),
        ),
    },
  },
})
