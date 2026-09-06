import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

// 消费端解析依赖并挂载真实 TaskList，折叠与状态图形都经过公开交互。
// 不复制全部单测：这里验证打包产物在两种CSS入口下仍满足固定合同。
export async function checkTaskListBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({
    configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false,
      lib: { entry: join(consumerDirectory, 'task-list-browser.mjs'), formats: ['es'] } },
  })
  const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = outputs.filter(output => output.type === 'chunk')
  assert.equal(chunks.length, 1, 'TaskList fixture must be self-contained')
  assert.doesNotMatch(chunks[0].code, /matthew-(?:button|menu|auto-complete|thinking|tool-call)/,
    'task-list-only entry contains another component')
  assert.equal(outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css')).length,
    0, 'TaskList emitted implicit CSS')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [mode, files] of Object.entries({
      'on-demand': ['dist/tokens.css', 'dist/task-list/style.css'], full: ['dist/styles.css'],
    })) {
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
        assert.deepEqual(errors, [], mode + ' mounted TaskList must not throw')
      } finally { await page.close() }
    }

    // reduced motion 下缺口圆环静止、箭头无过渡（TL-V05）。
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
      for (const file of ['dist/tokens.css', 'dist/task-list/style.css']) {
        await reducedPage.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
      }
      const ring = reducedPage.locator('[data-testid="task-list-ref"] .matthew-task-list__ring')
      await ring.waitFor({ state: 'visible' })
      assert.equal(await ring.evaluate(el => getComputedStyle(el).animationName),
        'none', 'reduced motion stops the ring rotation')
      assert.equal(await ring.evaluate(el => getComputedStyle(el).borderBottomColor),
        'rgba(0, 0, 0, 0)', 'reduced motion keeps the static gap visible')
      assert.equal(await reducedPage.locator('[data-testid="task-list-ref"] .matthew-task-list__arrow')
        .evaluate(el => getComputedStyle(el).transitionDuration), '0s',
        'reduced motion stops the arrow transition')
    } finally { await reducedPage.close() }

    // 宽视口 + 320px 容器：行摘要按容器查询视觉隐藏但保留辅助技术内容；
    // 总体摘要仍显示（TL-V08）。响应式按组件可用宽度而非浏览器视口判断。
    const narrowPage = await browser.newPage({ viewport: { width: 1280, height: 640 } })
    narrowPage.setDefaultTimeout(10_000)
    try {
      await narrowPage.route('http://matthew-ui.test/**', route => {
        const url = route.request().url()
        return route.fulfill(url.endsWith('/app.js')
          ? { contentType: 'text/javascript', body: chunks[0].code }
          : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' })
      })
      await narrowPage.goto('http://matthew-ui.test/')
      for (const file of ['dist/tokens.css', 'dist/task-list/style.css']) {
        await narrowPage.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
      }
      const narrowRoot = narrowPage.locator('[data-testid="narrow-list"]')
      await narrowRoot.waitFor({ state: 'visible' })
      assert.equal(await narrowRoot.evaluate(el => el.getBoundingClientRect().width),
        320, 'panel shrinks to the 320px container width')
      const summary = narrowRoot.locator('.matthew-task-list__summary')
      await summary.first().waitFor({ state: 'attached' })
      const narrowSummary = await summary.first().evaluate(el => {
        const s = getComputedStyle(el)
        return { position: s.position, clipPath: s.clipPath, width: s.width }
      })
      assert.deepEqual(narrowSummary, {
        position: 'absolute', clipPath: 'inset(50%)', width: '1px',
      }, 'narrow viewport visually hides item summaries without display:none')
      assert.notEqual(await summary.first().evaluate(el => el.textContent),
        '', 'narrow container keeps summary text in the DOM')
      // 标题、总体摘要与列表全部限定在窄容器实例内，不得由默认实例代替通过。
      assert.ok(await narrowRoot.getByText('窄容器面板').isVisible(),
        'narrow viewport keeps the title')
      assert.ok(
        await narrowRoot.locator('.matthew-task-list__progress').isVisible(),
        'narrow viewport keeps the header progress summary',
      )
      assert.equal(
        await narrowRoot.locator('ol').isVisible(),
        true,
        'narrow viewport keeps the list mounted',
      )
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

  // 默认展开 + ref 真实挂载 + 面板固定宽度合同。
  const defaultRoot = page.locator('[data-testid="task-list-ref"]')
  await defaultRoot.waitFor({ state: 'visible' })
  assert.equal(await defaultRoot.getAttribute('data-ref-mounted'), 'true', mode + ' ref forwards to the mounted root')
  await expectStyles(defaultRoot, {
    width: '480px',
    borderTopWidth: '1px', borderTopColor: 'rgb(203, 213, 225)',
    backgroundColor: 'rgb(255, 255, 255)', borderRadius: '8px', boxShadow: 'none',
  }, mode + ' default panel')
  const defaultHeader = header('实施计划 2 / 6')
  await expectStyles(defaultHeader, {
    minHeight: '40px', fontSize: '14px', fontWeight: '500', color: 'rgb(15, 23, 42)',
  }, mode + ' default header')
  await expectStyles(defaultRoot.locator('.matthew-task-list__progress'),
    { fontSize: '12px', color: 'rgb(100, 116, 139)' }, mode + ' default progress')

  // 点击折叠；折叠后列表保持挂载。
  await defaultHeader.click()
  const listId = await defaultHeader.getAttribute('aria-controls')
  const list = page.locator('[id="' + listId + '"]')
  assert.equal(await list.evaluate(el => el.hasAttribute('hidden')), true,
    mode + ' collapse hides the list')
  assert.equal(await list.evaluate(el => el.querySelectorAll('li').length), 6,
    mode + ' collapsed list stays mounted')
  await defaultHeader.click()
  assert.equal(await list.evaluate(el => el.hasAttribute('hidden')), false,
    mode + ' expand shows the list again')

  // 行合同：34px、只读、completed 弱化、running 加粗。
  const rows = list.locator('.matthew-task-list__item')
  assert.equal(await rows.count(), 6, mode + ' renders all items in caller order')
  await expectStyles(rows.nth(0), { minHeight: '34px', cursor: 'auto' }, mode + ' default row')
  await expectStyles(rows.nth(0).locator('.matthew-task-list__item-title'),
    { fontSize: '13px', fontWeight: '400', color: 'rgb(100, 116, 139)' }, mode + ' completed title')
  await expectStyles(rows.nth(2).locator('.matthew-task-list__item-title'),
    { fontWeight: '500', color: 'rgb(15, 23, 42)' }, mode + ' running title')

  // 六种图形断言（五种状态 + 圆环缺口）。
  await expectStyles(rows.nth(0).locator('.matthew-task-list__check'),
    { color: 'rgb(30, 64, 175)' }, mode + ' completed circle check')
  await expectStyles(rows.nth(2).locator('.matthew-task-list__ring'),
    { borderTopColor: 'rgb(37, 99, 235)', borderBottomColor: 'rgba(0, 0, 0, 0)' },
    mode + ' running ring color and gap')
  await expectStyles(rows.nth(3).locator('.matthew-task-list__hollow'),
    { borderTopColor: 'rgb(100, 116, 139)' }, mode + ' pending hollow')
  await expectStyles(rows.nth(4).locator('.matthew-task-list__bang'),
    { color: 'rgb(220, 38, 38)' }, mode + ' error bang')
  await expectStyles(rows.nth(5).locator('.matthew-task-list__square'),
    { backgroundColor: 'rgb(100, 116, 139)' }, mode + ' stopped square')

  // 连接线只出现在相邻条目之间。
  assert.equal(await rows.nth(0).evaluate(el => getComputedStyle(el, '::before').content),
    'none', mode + ' first row has no leading connection line')
  assert.equal(await rows.nth(1).evaluate(el => getComputedStyle(el, '::before').content),
    '""', mode + ' adjacent rows draw the connection line')
  assert.equal(await rows.nth(5).evaluate(el => getComputedStyle(el, '::after').content),
    'none', mode + ' last row has no trailing connection line')

  // 空列表：无 0 / 0，无悬空分隔线。
  const emptyRoot = page.locator('[data-testid="empty-list"]')
  assert.equal(await emptyRoot.locator('.matthew-task-list__progress').count(), 0,
    mode + ' empty list has no progress summary')
  await expectStyles(emptyRoot.locator('.matthew-task-list__list'),
    { borderTopWidth: '0px' }, mode + ' empty list has no dangling separator')

  // 组件 Token 覆盖：15 字段中的代表值。
  const configuredRoot = page.locator('[data-testid="configured-list"]')
  await expectStyles(configuredRoot, {
    backgroundColor: 'rgb(250, 250, 250)', borderTopColor: 'rgb(0, 0, 255)', borderRadius: '0px',
  }, mode + ' configured panel')
  const configuredHeader = header('定制面板 2 / 6')
  await expectStyles(configuredHeader, { minHeight: '48px', color: 'rgb(20, 20, 20)' },
    mode + ' configured header')
  await configuredHeader.hover()
  await expectStyles(configuredHeader, { backgroundColor: 'rgb(255, 255, 0)' },
    mode + ' configured hover background')
  await expectStyles(configuredRoot.locator('.matthew-task-list__progress'),
    { color: 'rgb(90, 90, 90)' }, mode + ' configured progress')
  const configuredRows = configuredRoot.locator('.matthew-task-list__item')
  await expectStyles(configuredRows.nth(0), { minHeight: '40px' }, mode + ' configured row height')
  await expectStyles(configuredRows.nth(0).locator('.matthew-task-list__check'),
    { color: 'rgb(0, 255, 255)' }, mode + ' configured completed color')
  await expectStyles(configuredRows.nth(2).locator('.matthew-task-list__ring'),
    { borderTopColor: 'rgb(255, 0, 255)' }, mode + ' configured running color')
  await expectStyles(configuredRows.nth(0).locator('.matthew-task-list__item-title'),
    { color: 'rgb(128, 128, 128)' }, mode + ' configured completed title color')

  // 暗色默认回退。
  const darkRoot = page.locator('[data-testid="dark-list"]')
  await expectStyles(darkRoot, { backgroundColor: 'rgb(30, 41, 59)' }, mode + ' dark panel')
  await expectStyles(darkRoot.locator('.matthew-task-list__ring'),
    { borderTopColor: 'rgb(59, 130, 246)' }, mode + ' dark running color')
  await expectStyles(darkRoot.locator('.matthew-task-list__progress'),
    { color: 'rgb(148, 163, 184)' }, mode + ' dark progress color')

  // 嵌套作用域：子级只改 background 时继承父级 runningColor。
  const nestedRoot = page.locator('[data-testid="nested-list"]')
  await expectStyles(nestedRoot, { backgroundColor: 'rgb(0, 255, 0)' },
    mode + ' nested child override')
  await expectStyles(nestedRoot.locator('.matthew-task-list__ring'),
    { borderTopColor: 'rgb(255, 0, 0)' }, mode + ' nested inherits parent override')
}
