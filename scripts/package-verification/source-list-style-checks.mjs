import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

async function styles(locator, expected, message) {
  const actual = await locator.evaluate((element, keys) => {
    const computed = getComputedStyle(element)
    return Object.fromEntries(keys.map(key => [key, computed[key]]))
  }, Object.keys(expected))
  assert.deepEqual(actual, expected, message)
}

export async function checkSourceListBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({ configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false, lib: { entry: join(consumerDirectory, 'source-list-browser.mjs'), formats: ['es'] } },
  })
  const output = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = output.filter(item => item.type === 'chunk')
  assert.equal(chunks.length, 1, 'SourceList fixture must be self-contained')
  assert.equal(output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).length, 0, 'SourceList must not emit implicit CSS')
  assert.doesNotMatch(chunks[0].code, /matthew-(?:button|menu|auto-complete|thinking|tool-call|task-list|select|dialog)/, 'SourceList entry must not include other components')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [mode, files] of Object.entries({ 'on-demand': ['dist/tokens.css', 'dist/source-list/style.css'], full: ['dist/styles.css'] })) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, reducedMotion: 'reduce' })
      page.setDefaultTimeout(8000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        await page.route('http://matthew-ui.test/**', route => route.fulfill(route.request().url().endsWith('/app.js')
          ? { contentType: 'text/javascript', body: chunks[0].code }
          : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}body{margin:0;font-family:Arial}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' }))
        await page.goto('http://matthew-ui.test/')
        for (const file of files) await page.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') })
        await inspect(page, mode)
        assert.deepEqual(errors, [], mode + ' SourceList must not throw')
      } finally { await page.close() }
    }
  } finally { await browser.close() }
}

async function inspect(page, mode) {
  const root = page.locator('[data-default]')
  const header = root.getByRole('button', { name: 'Sources 3' })
  const list = root.locator('ul')
  assert.equal(await root.getAttribute('data-ref-mounted'), 'true', mode + ' root ref')
  await styles(root, { width: '1000px', borderTopWidth: '1px', borderTopColor: 'rgb(203, 213, 225)', borderRadius: '8px', backgroundColor: 'rgb(255, 255, 255)', boxShadow: 'none' }, mode + ' default panel')
  await styles(header, { minHeight: '40px', fontSize: '14px', fontWeight: '500', padding: '8px 12px', color: 'rgb(15, 23, 42)', fontFamily: 'Arial' }, mode + ' default header')
  await styles(root.locator('.matthew-source-list__count'), { fontSize: '12px', fontWeight: '400', fontVariantNumeric: 'tabular-nums', color: 'rgb(100, 116, 139)' }, mode + ' default count')
  await styles(root.locator('.matthew-source-list__arrow'), { boxSizing: 'border-box', width: '8px', marginLeft: '4px', marginRight: '4px' }, mode + ' 16px arrow slot')
  await styles(list, { display: 'none' }, mode + ' collapsed content hidden')
  assert.equal(await list.locator('li').count(), 3, mode + ' collapsed content mounted')
  assert.equal(await root.getByRole('link').count(), 0, mode + ' collapsed links excluded from accessibility tree')
  await header.focus(); await page.keyboard.press('Tab')
  assert.equal(await page.locator('[data-plain] a').evaluate(el => el === document.activeElement), true, mode + ' folded links excluded from Tab')
  await header.click()
  assert.equal(await header.getAttribute('aria-expanded'), 'true', mode + ' expands')
  const first = root.locator('li').first()
  await styles(first, { paddingBlockStart: '12px', paddingInlineStart: '12px', lineHeight: '22.4px' }, mode + ' default item')
  await styles(first.locator('.matthew-source-list__item-title'), { color: 'rgb(15, 23, 42)', fontSize: '14px', fontWeight: '500' }, mode + ' default item title')
  await styles(first.locator('.matthew-source-list__summary'), { fontSize: '13px', fontWeight: '400', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: '6px', color: 'rgb(15, 23, 42)' }, mode + ' default summary')
  await styles(first.locator('.matthew-source-list__source'), { fontSize: '12px', fontWeight: '400', color: 'rgb(100, 116, 139)' }, mode + ' default source')
  await styles(list, { borderTopWidth: '1px' }, mode + ' header separator')
  await styles(first, { borderTopWidth: '0px' }, mode + ' no leading separator')
  await styles(root.locator('li').nth(1), { borderTopWidth: '1px' }, mode + ' adjacent separator')
  const link = root.getByRole('link', { name: 'Web source' })
  await styles(link, { color: 'rgb(30, 64, 175)' }, mode + ' default link')
  assert.equal(await link.getAttribute('target'), '_blank', mode + ' link target')
  assert.equal(await link.getAttribute('rel'), 'noopener noreferrer', mode + ' safe link rel')
  await link.hover(); await styles(link, { textDecorationLine: 'underline' }, mode + ' link hover')
  assert.equal(await root.getByText('Invalid link').evaluate(el => el.tagName), 'SPAN', mode + ' dangerous link downgrade')

  await first.focus()
  await styles(first, { outlineStyle: 'solid' }, mode + ' programmatic focus outline')
  await page.locator('[data-toggle]').evaluate(el => el.click())
  assert.equal(await header.evaluate(el => el === document.activeElement), true, mode + ' collapse focus return')
  await page.locator('[data-toggle]').click()
  await page.locator('[data-after]').focus()
  await page.locator('[data-toggle]').evaluate(el => el.click())
  assert.equal(await page.locator('[data-after]').evaluate(el => el === document.activeElement), true, mode + ' outside focus preserved')
  await header.click()
  await first.evaluate(el => { el.dataset.identity = 'kept' })
  await page.locator('[data-reorder]').click()
  assert.equal(await root.locator('li').last().getAttribute('data-identity'), 'kept', mode + ' keyed item identity')

  const plain = page.locator('[data-plain]')
  await styles(plain, { borderTopWidth: '0px', backgroundColor: 'rgba(0, 0, 0, 0)' }, mode + ' plain panel')
  await styles(plain.locator('li').first(), { paddingInlineStart: '0px' }, mode + ' plain padding')
  await styles(page.locator('[data-empty] ul'), { borderTopWidth: '0px' }, mode + ' empty separator')
  await styles(page.locator('[data-single] li'), { borderTopWidth: '0px', borderBottomWidth: '0px' }, mode + ' single separator')
  const dark = page.locator('[data-dark]')
  await styles(dark, { backgroundColor: 'rgb(30, 41, 59)', borderTopColor: 'rgb(51, 65, 85)' }, mode + ' dark panel')
  await styles(dark.locator('a'), { color: 'rgb(191, 219, 254)' }, mode + ' dark link')
  await styles(page.locator('[data-inherited] a'), { color: 'rgb(171, 205, 239)', fontFamily: 'monospace' }, mode + ' inherited CSS')

  const configured = page.locator('[data-configured]')
  await styles(configured, { backgroundColor: 'rgb(255, 247, 237)', borderTopColor: 'rgb(0, 0, 255)', borderRadius: '12px' }, mode + ' configured panel')
  const configuredHeader = configured.locator('button')
  await styles(configuredHeader, { minHeight: '48px', color: 'rgb(128, 0, 128)' }, mode + ' configured header')
  await configuredHeader.hover(); await styles(configuredHeader, { backgroundColor: 'rgb(255, 255, 0)' }, mode + ' configured hover')
  await styles(configured.locator('li').first(), { paddingBlockStart: '8px', paddingInlineStart: '20px' }, mode + ' configured padding')
  await styles(configured.locator('li').first().locator('span'), { color: 'rgb(0, 128, 0)' }, mode + ' configured title')
  await styles(configured.locator('p').first(), { color: 'rgb(34, 34, 34)' }, mode + ' configured summary')
  await styles(configured.locator('.matthew-source-list__source').first(), { color: 'rgb(85, 85, 85)' }, mode + ' configured source')
  await styles(configured.locator('a'), { color: 'rgb(128, 0, 128)' }, mode + ' configured link')
  await styles(page.locator('[data-configured-plain]'), { backgroundColor: 'rgba(0, 0, 0, 0)', borderTopWidth: '0px' }, mode + ' configured plain stays unframed')
  await page.locator('[data-theme-toggle]').click()
  await styles(configured, { borderRadius: '8px', backgroundColor: 'rgb(255, 255, 255)' }, mode + ' dynamic default restoration')
  await styles(configured.locator('a'), { color: 'rgb(22, 101, 52)' }, mode + ' dynamic parent restoration')
  await page.locator('[data-theme-toggle]').click()
  await styles(configured, { borderRadius: '12px' }, mode + ' dynamic reapply')
  await styles(root.locator('.matthew-source-list__arrow'), { transitionDuration: '0s' }, mode + ' reduced motion arrow')
  await styles(header, { transitionDuration: '0s' }, mode + ' reduced motion header')

  const narrow = page.locator('[data-narrow]')
  for (const width of [1000, 375]) {
    await page.setViewportSize({ width, height: 800 })
    for (const fontSize of ['16px', '32px']) {
      await page.locator('html').evaluate((el, value) => { el.style.fontSize = value }, fontSize)
      assert.equal(await narrow.evaluate(el => el.getBoundingClientRect().width), 320, mode + ' narrow width')
      assert.equal(await narrow.evaluate(el => el.scrollWidth <= el.clientWidth), true, mode + ' narrow no overflow')
      assert.equal(await narrow.getByRole('button').isVisible(), true, mode + ' narrow header visible')
      assert.equal(await narrow.locator('.matthew-source-list__count').isVisible(), true, mode + ' narrow count visible')
      assert.equal(await narrow.locator('.matthew-source-list__summary').isVisible(), true, mode + ' narrow summary visible')
      assert.equal(await narrow.locator('li').evaluate(el => el.scrollWidth <= el.clientWidth), true, mode + ' narrow text wraps')
    }
  }
  await narrow.locator('li').evaluate(el => { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }) })
  assert.equal(await narrow.locator('li').evaluate(el => el === document.activeElement), true, mode + ' business evidence focus')
}
