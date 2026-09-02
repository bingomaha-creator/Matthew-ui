import { describe, expect, test } from 'vitest'
// ?raw 让 Vite 返回 SCSS 原始文本，而不是把它当作样式执行。
import scssTokens from '../styles/_tokens.scss?raw'
import { createTokens, tokensToCssVars } from './tokens'

/** 测试侧 Adapter：只提取 :root 文件中的 Matthew UI 变量名和值。 */
function readScssRootTokens(source: string): Record<string, string> {
  return Object.fromEntries(
    [...source.matchAll(/(--matthew-ui-[\w-]+):\s*([^;]+);/g)].map(
      ([, name, value]) => [name, value.trim()],
    ),
  )
}

describe('default Token CSS contract', () => {
  test('keeps the complete SCSS :root table equal to the TypeScript defaults', () => {
    // 完整对象相等是双向合同：任意一侧多键、少键或同名异值都会失败。
    expect(readScssRootTokens(scssTokens)).toEqual(
      tokensToCssVars(createTokens()),
    )
  })
})
