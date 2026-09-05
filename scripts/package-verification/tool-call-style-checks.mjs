import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

// 消费端解析依赖并挂载真实 ToolCall，展开折叠与状态图形都经过公开交互。
// 不复制全部单测：这里验证打包产物在两种CSS入口下仍满足固定合同。
export async function checkToolCallBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({
    configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false,
      lib: { entry: join(consumerDirectory, 'tool-call-browser.mjs'), formats: ['es'] } },
  })
  const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = outputs.filter(output => output.type === 'chunk')
  assert.equal(chunks.length, 1, 'ToolCall fixture must be self-contained')
  assert.doesNotMatch(chunks[0].code, /matthew-(?:button|menu|auto-complete|thinking)/,
    'tool-call-only entry contains another component')
  assert.equal(outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css')).length,
    0, 'ToolCall emitted implicit CSS')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [mode, files] of Object.entries({
      'on-demand': ['dist/tokens.css', 'dist/tool-call/style.css'], full: ['dist/styles.css'],
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
        assert.deepEqual(errors, [], mode + ' mounted ToolCall must not throw')
      } finally { await page.close() }
    }

    // reduced motion 下缺口圆环静止、箭头无过渡（TC-V03）。
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
      for (const file of ['dist/tokens.css', 'dist/tool-call/style.css']) {
        await reducedPage.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
      }
      const ring = reducedPage.locator('[data-testid="status-running"] .matthew-tool-call__ring')
      await ring.waitFor({ state: 'visible' })
      assert.equal(await ring.evaluate(el => getComputedStyle(el).animationName),
        'none', 'reduced motion stops the ring rotation')
      assert.equal(await ring.evaluate(el => getComputedStyle(el).borderBottomColor),
        'rgba(0, 0, 0, 0)', 'reduced motion keeps the static gap visible')
      assert.equal(await ring.evaluate(el => getComputedStyle(el).borderTopColor),
        'rgb(37, 99, 235)', 'reduced motion keeps the running color readable')
      assert.equal(await reducedPage.locator('[data-testid="tool-call-ref"] .matthew-tool-call__arrow')
        .evaluate(el => getComputedStyle(el).transitionDuration), '0s',
        'reduced motion stops the arrow transition')
    } finally { await reducedPage.close() }

    // 320px 窄宽下摘要视觉隐藏但保留在可访问名称中（TC-V06）。
    const narrowPage = await browser.newPage({ viewport: { width: 320, height: 640 } })
    narrowPage.setDefaultTimeout(10_000)
    try {
      await narrowPage.route('http://matthew-ui.test/**', route => {
        const url = route.request().url()
        return route.fulfill(url.endsWith('/app.js')
          ? { contentType: 'text/javascript', body: chunks[0].code }
          : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' })
      })
      await narrowPage.goto('http://matthew-ui.test/')
      for (const file of ['dist/tokens.css', 'dist/tool-call/style.css']) {
        await narrowPage.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
      }
      const summary = narrowPage.locator('[data-testid="tool-call-ref"] .matthew-tool-call__summary')
      await summary.waitFor({ state: 'attached' })
      const narrowSummary = await summary.evaluate(el => {
        const s = getComputedStyle(el)
        return { position: s.position, clipPath: s.clipPath, width: s.width }
      })
      assert.deepEqual(narrowSummary, {
        position: 'absolute', clipPath: 'inset(50%)', width: '1px',
      }, 'narrow viewport visually hides the summary without display:none')
      const header = narrowPage.getByRole('button', { name: /正在执行…/ })
      assert.ok(await header.isVisible(), 'narrow viewport keeps the summary in the accessible name')
    } finally { await narrowPage.close() }
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
  const statusOf = testId => page.locator(`[data-testid="${testId}"] .matthew-tool-call__status`)

  // 默认折叠 + ref 真实挂载。
  const defaultRoot = page.locator('[data-testid="tool-call-ref"]')
  await defaultRoot.waitFor({ state: 'visible' })
  assert.equal(await defaultRoot.getAttribute('data-ref-mounted'), 'true', mode + ' ref forwards to the mounted root')
  // 可访问名称由 name 与可选 summary 组成（TC-B05），用完整名称匹配。
  const defaultHeader = header('读取项目文件 正在执行…')
  await expectStyles(defaultHeader, {
    minHeight: '32px', fontSize: '13px', borderRadius: '8px',
    color: 'rgb(15, 23, 42)', backgroundColor: 'rgba(0, 0, 0, 0)',
  }, mode + ' default header')
  assert.equal(await defaultRoot.evaluate(el => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)', mode + ' default root stays transparent')
  const summary = defaultRoot.locator('.matthew-tool-call__summary')
  await expectStyles(summary, { fontSize: '12px', color: 'rgb(100, 116, 139)' }, mode + ' default summary')

  const contentId = await defaultHeader.getAttribute('aria-controls')
  const detail = page.locator('[id="' + contentId + '"]')
  await expectStyles(detail, { borderLeftWidth: '1px', borderLeftColor: 'rgb(203, 213, 225)',
    color: 'rgb(100, 116, 139)', fontSize: '13px' }, mode + ' default detail')
  assert.ok(await detail.isHidden(), mode + ' detail stays collapsed by default')

  // 点击展开 + hover 背景。
  await defaultHeader.click()
  assert.ok(await detail.isVisible(), mode + ' click expands the detail')
  await defaultHeader.hover()
  await expectStyles(defaultHeader, { backgroundColor: 'rgb(241, 245, 249)' }, mode + ' default header hover')

  // 五种状态的默认颜色与图形差异（固定合同值）。
  await expectStyles(statusOf('status-pending').locator('.matthew-tool-call__hollow'),
    { borderTopColor: 'rgb(100, 116, 139)' }, mode + ' pending hollow color')
  await expectStyles(statusOf('status-running').locator('.matthew-tool-call__ring'),
    { borderTopColor: 'rgb(37, 99, 235)', borderBottomColor: 'rgba(0, 0, 0, 0)' },
    mode + ' running ring color and gap')
  await expectStyles(statusOf('status-completed').locator('.matthew-tool-call__check'),
    { color: 'rgb(30, 64, 175)' }, mode + ' completed check color')
  await expectStyles(statusOf('status-error').locator('.matthew-tool-call__bang'),
    { color: 'rgb(220, 38, 38)' }, mode + ' error bang color')
  await expectStyles(statusOf('status-stopped').locator('.matthew-tool-call__square'),
    { backgroundColor: 'rgb(100, 116, 139)' }, mode + ' stopped square color')

  // 正常动画偏好下缺口圆环使用命名空间 keyframe。
  const animationName = await statusOf('status-running').locator('.matthew-tool-call__ring')
    .evaluate(el => getComputedStyle(el).animationName)
  assert.match(animationName, /matthew-tool-call-ring-spin/, mode + ' running ring animates')

  // 无详情行不出现手型光标；有详情标签进入可访问名称。
  assert.equal(await page.locator('[data-testid="row-completed"] .matthew-tool-call__header')
    .evaluate(el => getComputedStyle(el).cursor), 'auto', mode + ' status row has no pointer cursor')
  const labeled = page.getByRole('button', { name: /带标签.*执行中|执行中.*带标签/s })
  assert.equal(await labeled.count(), 1, mode + ' status label joins the accessible name')

  // 组件 Token 覆盖：颜色、圆角、最小高度。
  const configuredHeader = header('定制工具 定制摘要')
  await expectStyles(configuredHeader, {
    minHeight: '40px', borderRadius: '0px', color: 'rgb(20, 20, 20)',
  }, mode + ' configured header')
  await configuredHeader.hover()
  await expectStyles(configuredHeader, { backgroundColor: 'rgb(255, 255, 0)' }, mode + ' configured hover background')
  const configuredDetail = page.locator(
    '[id="' + (await configuredHeader.getAttribute('aria-controls')) + '"]',
  )
  await expectStyles(configuredDetail, { color: 'rgb(0, 128, 0)', borderLeftColor: 'rgb(0, 0, 255)' },
    mode + ' configured detail')
  await expectStyles(statusOf('status-configured-error').locator('.matthew-tool-call__bang'),
    { color: 'rgb(255, 0, 0)' }, mode + ' configured error color')
  await expectStyles(page.locator('[data-testid="status-configured-error"] .matthew-tool-call__summary'),
    { color: 'rgb(90, 90, 90)' }, mode + ' configured summary color')

  // 暗色默认回退。
  const darkHeader = header('暗色标题')
  await expectStyles(darkHeader, { color: 'rgb(248, 250, 252)' }, mode + ' dark name color')
  await expectStyles(statusOf('status-dark-running').locator('.matthew-tool-call__ring'),
    { borderTopColor: 'rgb(59, 130, 246)' }, mode + ' dark running color')

  // 嵌套作用域：子级只改 stoppedColor 时继承父级 runningColor。
  await expectStyles(statusOf('status-nested-running').locator('.matthew-tool-call__ring'),
    { borderTopColor: 'rgb(255, 0, 0)' }, mode + ' nested inherits parent override')
  await expectStyles(statusOf('status-nested-stopped').locator('.matthew-tool-call__square'),
    { backgroundColor: 'rgb(0, 255, 0)' }, mode + ' nested child override')
}
