import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

// 消费端解析依赖并挂载真实 Thinking，展开折叠与状态切换都经过公开交互。
// 不复制6B全部单测：这里验证打包产物在两种CSS入口下仍满足固定合同。
export async function checkThinkingBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({
    configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false,
      lib: { entry: join(consumerDirectory, 'thinking-browser.mjs'), formats: ['es'] } },
  })
  const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = outputs.filter(output => output.type === 'chunk')
  assert.equal(chunks.length, 1, 'Thinking fixture must be self-contained')
  assert.doesNotMatch(chunks[0].code, /matthew-(?:button|menu|auto-complete)/,
    'thinking-only entry contains another component')
  assert.equal(outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css')).length,
    0, 'Thinking emitted implicit CSS')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [mode, files] of Object.entries({
      'on-demand': ['dist/tokens.css', 'dist/thinking/style.css'], full: ['dist/styles.css'],
    })) {
      // 交互与样式验收使用正常动画偏好页面；reduced-motion 单独开页验收。
      const page = await browser.newPage()
      page.setDefaultTimeout(10_000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        await page.route('http://matthew-ui.test/**', route => {
          const url = route.request().url()
          return route.fulfill(url.endsWith('/app.js')
            ? { contentType: 'text/javascript', body: chunks[0].code }
            : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' })
        })
        await page.goto('http://matthew-ui.test/')
        for (const file of files) await page.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
        await inspect(page, mode)
        assert.deepEqual(errors, [], mode + ' mounted Thinking must not throw')
      } finally { await page.close() }
    }

    // prefers-reduced-motion: reduce 下圆点停止动画、箭头停止过渡（TH-V03）。
    const reducedPage = await browser.newPage({ reducedMotion: 'reduce' })
    reducedPage.setDefaultTimeout(10_000)
    try {
      await reducedPage.route('http://matthew-ui.test/**', route => {
        const url = route.request().url()
        return route.fulfill(url.endsWith('/app.js')
          ? { contentType: 'text/javascript', body: chunks[0].code }
          : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' })
      })
      await reducedPage.goto('http://matthew-ui.test/')
      for (const file of ['dist/tokens.css', 'dist/thinking/style.css']) {
        await reducedPage.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
      }
      const runningDots = reducedPage.locator('[data-testid="status-running"] .matthew-thinking__dots span')
      await runningDots.first().waitFor({ state: 'visible' })
      assert.equal(await runningDots.count(), 3, 'reduced motion keeps three static dots')
      assert.equal(await runningDots.first().evaluate(el => getComputedStyle(el).animationName),
        'none', 'reduced motion stops the dot animation')
      assert.equal(await runningDots.first().evaluate(el => getComputedStyle(el).backgroundColor),
        'rgb(37, 99, 235)', 'reduced motion keeps the running color readable')
      assert.equal(await reducedPage.locator('[data-testid="thinking-ref"] .matthew-thinking__arrow')
        .evaluate(el => getComputedStyle(el).transitionDuration), '0s',
        'reduced motion stops the arrow transition')
    } finally { await reducedPage.close() }
  } finally { await browser.close() }
}
const expectStyles = async (locator, expected, message) => {
  const actual = await locator.evaluate((el, keys) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(keys.map(key => [key, s[key]]))
  }, Object.keys(expected))
  assert.deepEqual(actual, expected, message)
}
async function inspect(page, mode) {
  const header = name => page.getByRole('button', { name, exact: true })
  const statusOf = testId => page.locator(`[data-testid="${testId}"] .matthew-thinking__status`)

  // 默认折叠 + ref 真实挂载。
  const defaultRoot = page.locator('[data-testid="thinking-ref"]')
  await defaultRoot.waitFor({ state: 'visible' })
  assert.equal(await defaultRoot.getAttribute('data-ref-mounted'), 'true', mode + ' ref forwards to the mounted root')
  const defaultHeader = header('正在分析项目')
  await expectStyles(defaultHeader, {
    minHeight: '40px', fontSize: '14px', fontWeight: '500', borderRadius: '8px',
    color: 'rgb(15, 23, 42)', backgroundColor: 'rgba(0, 0, 0, 0)',
  }, mode + ' default header')
  assert.equal(await defaultRoot.evaluate(el => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)', mode + ' default root stays transparent')
  const contentId = await defaultHeader.getAttribute('aria-controls')
  const content = page.locator('[id="' + contentId + '"]')
  await expectStyles(content, { borderLeftWidth: '1px', borderLeftColor: 'rgb(203, 213, 225)',
    color: 'rgb(100, 116, 139)', fontSize: '13px' }, mode + ' default content')
  assert.ok(await content.isHidden(), mode + ' content stays collapsed by default')

  // 点击展开。
  await defaultHeader.click()
  assert.ok(await content.isVisible(), mode + ' click expands the content')
  await defaultHeader.hover()
  await expectStyles(defaultHeader, { backgroundColor: 'rgb(241, 245, 249)' }, mode + ' default header hover')

  // 四种状态的默认颜色与图形差异（固定合同值）。
  await expectStyles(statusOf('status-running').locator('.matthew-thinking__dots span').first(),
    { backgroundColor: 'rgb(37, 99, 235)' }, mode + ' running dots color')
  assert.equal(await statusOf('status-running').locator('.matthew-thinking__dots span').count(), 3,
    mode + ' running renders three dots')
  await expectStyles(statusOf('status-completed').locator('.matthew-thinking__check'),
    { color: 'rgb(30, 64, 175)' }, mode + ' completed check color')
  await expectStyles(statusOf('status-stopped').locator('.matthew-thinking__square'),
    { backgroundColor: 'rgb(100, 116, 139)' }, mode + ' stopped square color')
  await expectStyles(statusOf('status-error').locator('.matthew-thinking__bang'),
    { color: 'rgb(220, 38, 38)' }, mode + ' error bang color')

  // 正常动画偏好下 running 圆点使用命名空间 keyframe。
  const animationName = await statusOf('status-running').locator('.matthew-thinking__dots span').first()
    .evaluate(el => getComputedStyle(el).animationName)
  assert.match(animationName, /matthew-thinking-dot-bounce/, mode + ' running dots animate')

  // 组件 Token 覆盖：颜色、圆角、最小高度。
  const configuredHeader = header('定制标题')
  await expectStyles(configuredHeader, {
    minHeight: '48px', borderRadius: '0px', color: 'rgb(20, 20, 20)',
  }, mode + ' configured header')
  await configuredHeader.hover()
  await expectStyles(configuredHeader, { backgroundColor: 'rgb(255, 255, 0)' }, mode + ' configured hover background')
  const configuredContent = page.locator(
    '[id="' + (await configuredHeader.getAttribute('aria-controls')) + '"]',
  )
  await expectStyles(configuredContent, { color: 'rgb(0, 128, 0)', borderLeftColor: 'rgb(0, 0, 255)' },
    mode + ' configured content')
  await expectStyles(statusOf('status-configured-error').locator('.matthew-thinking__bang'),
    { color: 'rgb(255, 0, 0)' }, mode + ' configured error color')

  // 暗色默认回退。
  const darkHeader = header('暗色标题')
  await expectStyles(darkHeader, { color: 'rgb(248, 250, 252)' }, mode + ' dark title color')
  await expectStyles(statusOf('status-dark-running').locator('.matthew-thinking__dots span').first(),
    { backgroundColor: 'rgb(59, 130, 246)' }, mode + ' dark running color')

  // 嵌套作用域：子级只改 stoppedColor 时继承父级 runningColor。
  await expectStyles(statusOf('status-nested-running').locator('.matthew-thinking__dots span').first(),
    { backgroundColor: 'rgb(255, 0, 0)' }, mode + ' nested inherits parent override')
  await expectStyles(statusOf('status-nested-stopped').locator('.matthew-thinking__square'),
    { backgroundColor: 'rgb(0, 255, 0)' }, mode + ' nested child override')
}
