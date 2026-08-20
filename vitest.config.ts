import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { resolve } from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

const createBrowserConfig = () => ({
  enabled: true,
  headless: true,
  provider: playwright({}),
  instances: [{ browser: 'chromium' as const }],
})

const decodeStorybookTestPath = {
  name: 'matthew-ui:decode-storybook-test-path',
  enforce: 'post' as const,
  transform(code: string, id: string) {
    if (!id.includes('.stories.')) {
      return
    }

    const encodedPathCheck =
      'const _isRunningFromThisFile = convertToFilePath(import.meta.url).includes('
    const decodedPathCheck =
      'const _isRunningFromThisFile = decodeURIComponent(convertToFilePath(import.meta.url)).includes('

    if (code.includes(encodedPathCheck)) {
      return code.replace(encodedPathCheck, decodedPathCheck)
    }
  },
}

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          optimizeDeps: {
            include: ['vitest-browser-react'],
          },
          test: {
            name: 'unit',
            include: ['src/**/*.test.{ts,tsx}'],
            browser: createBrowserConfig(),
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: resolve(import.meta.dirname, '.storybook'),
              storybookScript: 'npm run storybook',
            }),
            // Storybook 10.5 只解码 URL 中的空格，中文项目路径需要在比较前完整解码。
            decodeStorybookTestPath,
          ],
          // 浏览器环境必须在测试开始前完成这些 CommonJS 依赖的 ESM 转换。
          optimizeDeps: {
            include: ['aria-query', 'lz-string', 'pretty-format'],
          },
          test: {
            name: 'storybook',
            browser: createBrowserConfig(),
          },
        },
      ],
    },
  }),
)
