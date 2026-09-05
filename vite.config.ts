import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const externalPackages = ['clsx', 'react', 'react-dom']

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        button: resolve(
          import.meta.dirname,
          'src/components/Button/index.ts',
        ),
        menu: resolve(import.meta.dirname, 'src/components/Menu/index.ts'),
        'auto-complete': resolve(
          import.meta.dirname,
          'src/components/AutoComplete/index.ts',
        ),
        thinking: resolve(
          import.meta.dirname,
          'src/components/Thinking/index.ts',
        ),
        'tool-call': resolve(
          import.meta.dirname,
          'src/components/ToolCall/index.ts',
        ),
        theme: resolve(import.meta.dirname, 'src/theme/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const extension = format === 'es' ? 'js' : 'cjs'

        return entryName === 'index'
          ? `index.${extension}`
          : `${entryName}/index.${extension}`
      },
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
