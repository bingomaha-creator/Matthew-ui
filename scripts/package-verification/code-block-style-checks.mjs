import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

async function styles(locator, expected, message) {
  const actual = await locator.evaluate((el, keys) => {
    const computed = getComputedStyle(el)
    return Object.fromEntries(keys.map(key => [key, computed[key]]))
  }, Object.keys(expected))
  assert.deepEqual(actual, expected, message)
}

export async function checkCodeBlockBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({ configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false, lib: { entry: join(consumerDirectory, 'code-block-browser.mjs'), formats: ['es'] } },
  })
  const output = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = output.filter(item => item.type === 'chunk')
  assert.equal(chunks.length, 1, 'CodeBlock fixture must be self-contained')
  assert.equal(output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).length, 0, 'CodeBlock must not emit implicit CSS')
  assert.doesNotMatch(chunks[0].code, /matthew-(?:button|menu|auto-complete|thinking|tool-call|task-list|select|dialog|source-list)/, 'CodeBlock entry must not include other components')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [mode, files] of Object.entries({ 'on-demand': ['dist/tokens.css', 'dist/code-block/style.css'], full: ['dist/styles.css'] })) {
      // All clipboard access is confined to this synthetic secure origin/context.
      const context = await browser.newContext({ viewport: { width: 1000, height: 800 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] })
      const page = await context.newPage()
      page.setDefaultTimeout(8000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        await page.route('https://matthew-ui.test/**', route => route.fulfill(route.request().url().endsWith('/app.js')
          ? { contentType: 'text/javascript', body: chunks[0].code }
          : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}body{margin:0;font-family:Arial}.limited pre{max-height:160px}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' }))
        await page.goto('https://matthew-ui.test/')
        for (const file of files) await page.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') })
        await inspect(page, mode)
        assert.deepEqual(errors, [], mode + ' CodeBlock must not throw')
      } finally { await context.close() }
    }
  } finally { await browser.close() }
}

async function inspect(page, mode) {
  const root = page.locator('[data-default]')
  const pre = root.locator('pre')
  const button = root.getByRole('button', { name: 'Copy', exact: true })
  assert.equal(await root.getAttribute('data-ref-mounted'), 'true', mode + ' root ref')
  await styles(root, { width: '1000px', borderTopWidth: '1px', borderTopColor: 'rgb(203, 213, 225)', borderRadius: '8px', backgroundColor: 'rgb(255, 255, 255)', boxShadow: 'none' }, mode + ' default panel')
  await styles(root.locator('.matthew-code-block__header'), { minHeight: '38px', padding: '6px 12px', backgroundColor: 'rgb(241, 245, 249)', borderBottomWidth: '1px', fontFamily: 'Arial' }, mode + ' default header')
  await styles(root.locator('.matthew-code-block__title'), { fontSize: '13px', fontWeight: '500', color: 'rgb(15, 23, 42)' }, mode + ' default title')
  await styles(root.locator('.matthew-code-block__language'), { fontSize: '12px', color: 'rgb(15, 23, 42)' }, mode + ' default language')
  await styles(pre, { fontSize: '13px', lineHeight: '20.8px', padding: '12px', whiteSpace: 'pre', overflowX: 'auto', color: 'rgb(15, 23, 42)', tabSize: '2' }, mode + ' default code')
  assert.match(await pre.evaluate(el => getComputedStyle(el).fontFamily), /monospace/, mode + ' monospace code')
  assert.equal(await pre.getAttribute('role'), 'region', mode + ' named code region')
  assert.equal(await page.locator('[data-plain] .matthew-code-block__header').count(), 0, mode + ' no empty header')
  assert.equal(await page.locator('[data-plain] code').textContent(), '<script>plain text</script>', mode + ' literal text')
  assert.equal(await page.locator('[data-empty] code').textContent(), '', mode + ' empty code')
  assert.equal(await root.getByRole('status').count(), 1, mode + ' empty status region registered')

  const original = '  synthetic <raw>\n\tvalue\n '
  await button.click()
  await page.waitForFunction(() => document.querySelector('[data-default] [role=status]').textContent === 'Copied')
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), original, mode + ' clipboard preserves exact original')
  assert.equal(await button.evaluate(el => el === document.activeElement), true, mode + ' copy focus remains')
  await page.locator('[data-update-code]').click()
  assert.equal(await root.locator('[role=status]').textContent(), '', mode + ' text change clears feedback')
  await button.click()
  await page.waitForFunction(() => document.querySelector('[data-default] [role=status]').textContent === 'Copied')
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'updated synthetic text', mode + ' latest text copied')
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('test denial')) } }))
  await button.click()
  await page.waitForFunction(() => document.querySelector('[data-default] [role=status]').textContent === 'Copy failed')
  assert.equal(await root.getByRole('status').isVisible(), true, mode + ' error feedback visible')
  await styles(root.getByRole('status'), { color: 'rgb(15, 23, 42)' }, mode + ' error feedback')
  await page.evaluate(() => Reflect.deleteProperty(navigator, 'clipboard'))
  await button.click()
  await page.waitForFunction(() => document.querySelector('[data-default] [role=status]').textContent === 'Copied')
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'updated synthetic text', mode + ' retry actual clipboard')
  await button.hover()
  await styles(button, { color: 'rgb(15, 23, 42)', backgroundColor: 'rgb(226, 232, 240)', transitionDuration: '0s' }, mode + ' hover and reduced motion')
  await button.focus(); await page.keyboard.press('Tab')
  assert.equal(await pre.evaluate(el => el === document.activeElement), true, mode + ' keyboard code focus')
  await styles(pre, { outlineStyle: 'solid', outlineWidth: '3px' }, mode + ' code focus ring')

  const dark = page.locator('[data-dark]')
  await styles(dark, { backgroundColor: 'rgb(30, 41, 59)', color: 'rgb(248, 250, 252)', borderTopColor: 'rgb(51, 65, 85)' }, mode + ' dark panel')
  const configured = page.locator('[data-configured]')
  await styles(configured, { backgroundColor: 'rgb(255, 247, 237)', color: 'rgb(34, 34, 34)', borderTopColor: 'rgb(0, 0, 255)', borderRadius: '12px' }, mode + ' configured panel')
  await styles(configured.locator('.matthew-code-block__header'), { backgroundColor: 'rgb(255, 237, 213)', color: 'rgb(128, 0, 128)' }, mode + ' configured header')
  await styles(configured.locator('pre'), { padding: '8px 20px' }, mode + ' configured padding')
  await page.locator('[data-theme-toggle]').click()
  await styles(configured, { color: 'rgb(22, 101, 52)', borderRadius: '8px', backgroundColor: 'rgb(255, 255, 255)' }, mode + ' dynamic restoration')
  await page.locator('[data-theme-toggle]').click()
  await styles(configured, { borderRadius: '12px' }, mode + ' dynamic reapply')
  await styles(page.locator('[data-inherited]'), { borderRadius: '20px' }, mode + ' ancestor CSS')
  assert.equal(await page.locator('[data-limited] pre').evaluate(el => el.scrollHeight > el.clientHeight && el.clientHeight === 160), true, mode + ' business height limit')

  const narrow = page.locator('[data-narrow]')
  const wrapped = page.locator('[data-wrapped]')
  for (const width of [1000, 375]) {
    await page.setViewportSize({ width, height: 800 })
    for (const fontSize of ['16px', '32px']) {
      await page.locator('html').evaluate((el, value) => { el.style.fontSize = value }, fontSize)
      assert.equal(await narrow.evaluate(el => el.getBoundingClientRect().width), 320, mode + ' narrow width')
      assert.equal(await narrow.evaluate(el => el.scrollWidth <= el.clientWidth), true, mode + ' narrow no overflow')
      assert.equal(await narrow.locator('.matthew-code-block__title').isVisible(), true, mode + ' narrow title visible')
      assert.equal(await narrow.getByRole('button').isVisible(), true, mode + ' narrow copy visible')
      assert.equal(await narrow.locator('pre').evaluate(el => el.scrollWidth > el.clientWidth), true, mode + ' internal horizontal scroll')
      assert.equal(await wrapped.locator('pre').evaluate(el => el.scrollWidth <= el.clientWidth), true, mode + ' wrapped no overflow')
      await styles(wrapped.locator('pre'), { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }, mode + ' wrap rules')
      assert.equal(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth), true, mode + ' page no overflow')
    }
  }
  await narrow.locator('pre').focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(() => document.querySelector('[data-narrow] pre').scrollLeft > 0)
  assert.equal(await narrow.locator('pre').evaluate(el => el.scrollLeft > 0), true, mode + ' keyboard scroll')
  for (const panel of [narrow, wrapped]) {
    await panel.getByRole('button').click()
    await page.waitForFunction(selector => document.querySelector(selector + ' [role=status]').textContent === 'Copied', panel === narrow ? '[data-narrow]' : '[data-wrapped]')
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'long'.repeat(200), mode + ' wrap-independent copy')
  }
}
