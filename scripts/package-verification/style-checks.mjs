import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

export { checkMenuBrowserStyles } from './menu-style-checks.mjs'
export { checkAutoCompleteBrowserStyles } from './auto-complete-style-checks.mjs'
export { checkThinkingBrowserStyles } from './thinking-style-checks.mjs'
export { checkToolCallBrowserStyles } from './tool-call-style-checks.mjs'

/**
 * 样式验收使用真实 Chromium，HTML 来自消费端安装的组件。
 * 默认场景不挂 Provider；可选定制场景另验 Provider → CSS 的完整链路。
 * 每种引入方式使用隔离页面，避免上一页的 :root 变量让缺失 Token 假通过。
 */
export async function checkBrowserStyles({ packageRoot, markup, configuredMarkup }) {
  const browser = await chromium.launch({ headless: true })
  const modes = {
    'on-demand': ['dist/tokens.css', 'dist/button/style.css'],
    full: ['dist/styles.css'],
  }
  // 固定设计合同，而不是从待测 Token 代码重新计算 expected：
  // 两套 CSS 即使一起出错，也不能仅凭“相等”通过验收。根字号固定为 16px。
  const expected = {
    color: 'rgb(15, 23, 42)',
    backgroundColor: 'rgb(255, 255, 255)',
    borderTopColor: 'rgb(203, 213, 225)',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderRadius: '8px',
    minHeight: '40px',
    height: '40px',
    rootText: '#0f172a',
    rootSurface: '#ffffff',
    rootBorder: '#cbd5e1',
    rootRadius: '0.5rem',
  }
  const results = {}
  try {
    for (const [mode, files] of Object.entries(modes)) {
      // 验收静止默认态，避免刚加载 CSS 时读取到 UA 样式过渡的中间帧。
      const page = await browser.newPage({ reducedMotion: 'reduce' })
      try {
        await page.setContent('<!doctype html><html><head><style>html{font-size:16px}</style></head><body>' + markup + '</body></html>')
        for (const file of files) {
          const content = await readFile(join(packageRoot, file), 'utf8')
          await page.addStyleTag({ content: content || '\n' })
        }
        const button = page.getByRole('button', { name: 'Save', exact: true })
        assert.equal(await button.count(), 1, mode + ' must render one Button')
        assert.ok(await button.isVisible(), mode + ' Button must be visible')
        results[mode] = await button.evaluate((element) => {
          const computed = getComputedStyle(element)
          const root = getComputedStyle(document.documentElement)
          const token = (name) => root.getPropertyValue('--matthew-ui-' + name).trim()
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            borderTopColor: computed.borderTopColor,
            borderTopWidth: computed.borderTopWidth,
            borderTopStyle: computed.borderTopStyle,
            borderRadius: computed.borderRadius,
            minHeight: computed.minHeight,
            height: computed.height,
            rootText: token('color-text'),
            rootSurface: token('color-surface'),
            rootBorder: token('color-border'),
            rootRadius: token('radius-md'),
          }
        })
        assert.deepEqual(results[mode], expected, mode + ' CSS must preserve default Button styles and root Tokens')
        if (configuredMarkup) {
          // 只替换 body，保留本轮已加载的 CSS；两种引入方式仍使用独立页面。
          await page.locator('body').evaluate((body, html) => { body.innerHTML = html }, configuredMarkup)
          await checkConfiguredStyles(page, mode)
        }
      } finally {
        await page.close()
      }
    }
    assert.deepEqual(results.full, results['on-demand'], 'full and on-demand Button styles must match')
  } finally {
    await browser.close()
  }
}

async function checkConfiguredStyles(page, mode) {
  // 与 fixture 的配置独立写出固定合同值，防止两个 CSS 入口一起出错却互相佐证。
  const expected = {
    backgroundColor: 'rgb(22, 101, 52)', color: 'rgb(255, 255, 255)',
    borderTopColor: 'rgb(22, 101, 52)', borderRadius: '20px',
    minHeight: '48px', height: '48px', fontSize: '16px',
    paddingBlock: '10px', paddingInline: '24px',
  }
  for (const [role, name] of [['button', 'Custom save'], ['link', 'Custom docs']]) {
    await page.mouse.move(0, 0)
    const control = page.getByRole(role, { name, exact: true })
    assert.ok(await control.isVisible(), mode + ' configured ' + role + ' must be visible')
    const actual = await control.evaluate((element, keys) => {
      const computed = getComputedStyle(element)
      return Object.fromEntries(keys.map((key) => [key, computed[key]]))
    }, Object.keys(expected))
    assert.deepEqual(actual, expected, mode + ' configured ' + role + ' default styles')
    // Playwright 的真实指针触发 CSS 伪类，不用合成事件冒充 :hover / :active。
    await control.hover()
    assert.equal(await control.evaluate((element) => getComputedStyle(element).backgroundColor),
      'rgb(20, 83, 45)', mode + ' configured ' + role + ' hover')
    await page.mouse.down()
    try {
      assert.deepEqual(await control.evaluate((element) => ({
        active: element.matches(':active'),
        background: getComputedStyle(element).backgroundColor,
      })), { active: true, background: 'rgb(5, 46, 22)' }, mode + ' configured ' + role + ' active')
    } finally {
      await page.mouse.up()
    }
  }
  const outside = page.getByRole('button', { name: 'Outside', exact: true })
  assert.equal(await outside.evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgb(255, 255, 255)', mode + ' configured scope must not leak outside Provider')
}

// CSS 内容与 source map 的原有检查顺序、断言和失败汇总保持不变。
export async function checkStyles({
  packedRoot, projectRoot, packageFiles, temporaryDirectory, check,
}) {
  await check('packed tokens.css exactly matches the public default Token API', async () => {
    const css = await readFile(join(packedRoot, 'dist/tokens.css'), 'utf8')
    const themeModule = await import(
      pathToFileURL(join(projectRoot, 'dist/theme/index.js')).href
    )
    const expectedVariables = themeModule.tokensToCssVars(
      themeModule.createTokens(themeModule.lightTheme),
    )
    const rootBlocks = [...css.matchAll(/:root\s*\{([^}]*)\}/g)]
    const actualVariables = Object.fromEntries(
      [...(rootBlocks[0]?.[1] ?? '').matchAll(
        /(--matthew-ui-[a-z0-9-]+)\s*:\s*([^;]+)(?:;|$)/g,
      )].map((match) => [match[1], match[2].trim()]),
    )

    assert.equal(rootBlocks.length, 1)
    assert.equal(Object.keys(actualVariables).length, 23)
    assert.deepEqual(actualVariables, expectedVariables)
    assert.doesNotMatch(css, /@import/)
    assert.doesNotMatch(
      css,
      /\.matthew-(?:button|menu|auto-complete|thinking|tool-call)/,
    )
    assert.match(css, /sourceMappingURL=tokens\.css\.map/)
  })
  await check('packed component CSS entries contain only their own style boundary', async () => {
    const componentStyles = [
      {
        path: 'dist/button/style.css',
        marker: '.matthew-button',
        forbiddenMarkers: ['.matthew-menu', '.matthew-auto-complete'],
      },
      {
        path: 'dist/menu/style.css',
        marker: '.matthew-menu',
        forbiddenMarkers: ['.matthew-button', '.matthew-auto-complete'],
      },
      {
        path: 'dist/auto-complete/style.css',
        marker: '.matthew-auto-complete',
        forbiddenMarkers: ['.matthew-button', '.matthew-menu', '.matthew-thinking'],
      },
      {
        path: 'dist/thinking/style.css',
        marker: '.matthew-thinking',
        forbiddenMarkers: ['.matthew-button', '.matthew-menu', '.matthew-auto-complete', '.matthew-tool-call'],
      },
      {
        path: 'dist/tool-call/style.css',
        marker: '.matthew-tool-call',
        forbiddenMarkers: ['.matthew-button', '.matthew-menu', '.matthew-auto-complete', '.matthew-thinking'],
      },
    ]

    for (const componentStyle of componentStyles) {
      const css = await readFile(join(packedRoot, componentStyle.path), 'utf8')

      assert.ok(css.includes(componentStyle.marker))
      assert.doesNotMatch(css, /:root\s*\{/)
      assert.doesNotMatch(css, /--matthew-ui-[a-z0-9-]+\s*:/)
      assert.doesNotMatch(css, /@import/)
      for (const marker of componentStyle.forbiddenMarkers) {
        assert.ok(!css.includes(marker), `${componentStyle.path} contains ${marker}`)
      }
      assert.match(css, /sourceMappingURL=style\.css\.map/)
    }
  })
  await check('packed CSS contains every public component style and Token', async () => {
    const css = await readFile(join(packedRoot, 'dist/styles.css'), 'utf8')
    const tokenCss = await readFile(join(packedRoot, 'dist/tokens.css'), 'utf8')
    const globalRootBlocks = [...css.matchAll(/:root\s*\{([^}]*)\}/g)]
    const tokenRootBlocks = [...tokenCss.matchAll(/:root\s*\{([^}]*)\}/g)]
    const readVariables = (block) =>
      Object.fromEntries(
        [...block.matchAll(
          /(--matthew-ui-[a-z0-9-]+)\s*:\s*([^;]+)(?:;|$)/g,
        )].map((match) => [match[1], match[2].trim()]),
      )

    assert.ok(css.length > 0, 'dist/styles.css is empty')
    assert.equal(globalRootBlocks.length, 1)
    assert.deepEqual(
      readVariables(globalRootBlocks[0][1]),
      readVariables(tokenRootBlocks[0][1]),
    )
    assert.equal((css.match(/--matthew-ui-[a-z0-9-]+\s*:/g) ?? []).length, 23)
    assert.doesNotMatch(css, /@import/)
    for (const selector of [
      '.matthew-button',
      '.matthew-menu',
      '.matthew-auto-complete',
      '.matthew-thinking',
      '.matthew-tool-call',
    ]) {
      assert.ok(css.includes(selector), `dist/styles.css is missing ${selector}`)
    }

    for (const tokenName of [
      '--matthew-ui-shadow-overlay',
      '--matthew-ui-control-height-sm',
      '--matthew-ui-control-height-md',
      '--matthew-ui-control-height-lg',
      '--matthew-ui-font-size-sm',
      '--matthew-ui-font-size-md',
      '--matthew-ui-font-size-lg',
    ]) {
      assert.ok(
        css.includes(`${tokenName}:`),
        `dist/styles.css is missing ${tokenName}`,
      )
    }

    const globalSourceMap = JSON.parse(
      await readFile(join(packedRoot, 'dist/styles.css.map'), 'utf8'),
    )

    assert.ok(
      globalSourceMap.sources.every(
        (source) => !source.endsWith('/_tokens.scss'),
      ),
      'dist/styles.css still uses _tokens.scss as a published Token source',
    )
  })
  await check('packed source maps are valid version 3 maps', async () => {
    const sourceMapPaths = packageFiles.filter((file) =>
      file.startsWith('dist/') && file.endsWith('.map'),
    )
    let implementationMapCount = 0

    for (const mapPath of sourceMapPaths) {
      const generatedFile = basename(mapPath, '.map')
      const sourceMap = JSON.parse(
        await readFile(join(packedRoot, mapPath), 'utf8'),
      )
      const isEntryFacadeMap = /(^|\/)index\.(?:js|cjs)\.map$/.test(
        mapPath,
      )

      assert.equal(sourceMap.version, 3, `${mapPath} is not a version 3 map`)
      assert.equal(sourceMap.file, generatedFile)
      assert.ok(Array.isArray(sourceMap.sources), `${mapPath} has no sources`)
      assert.equal(typeof sourceMap.mappings, 'string')
      assert.equal(sourceMap.sourcesContent?.length, sourceMap.sources.length)
      assert.ok(
        sourceMap.sourcesContent.every((source) => typeof source === 'string'),
      )
      for (const source of sourceMap.sources) {
        assert.ok(!source.startsWith('file:'), `${mapPath} leaks a file URL`)
        assert.ok(!source.startsWith('/'), `${mapPath} leaks an absolute path`)
        assert.ok(
          !source.includes(temporaryDirectory),
          `${mapPath} leaks its temporary build directory`,
        )
      }

      if (['dist/tokens.css.map', 'dist/styles.css.map'].includes(mapPath)) {
        assert.equal(
          sourceMap.x_matthewUiGeneratedFrom,
          '../src/theme/tokens.ts',
        )
      }

      // Rollup 会把多入口的 index 产物输出为纯 re-export facade。
      // 这类文件没有可映射的实现语句，因此空 sources/mappings 是合法的；
      // 真实源码映射应由共享实现 chunk 或 CSS 产物承载。
      if (!isEntryFacadeMap) {
        implementationMapCount += 1
        assert.ok(sourceMap.sources.length > 0, `${mapPath} has no sources`)
        assert.ok(sourceMap.mappings.length > 0, `${mapPath} has no mappings`)
      }
    }

    assert.ok(
      implementationMapCount > 0,
      'package has no source map for implementation code',
    )
  })
}
