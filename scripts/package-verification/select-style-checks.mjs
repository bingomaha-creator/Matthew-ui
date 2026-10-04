import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

const styles = async (locator, expected, message) => {
  const actual = await locator.evaluate((el, keys) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(keys.map(key => [key, s[key]]))
  }, Object.keys(expected))
  assert.deepEqual(actual, expected, message)
}
const rect = locator => locator.evaluate(el => {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
})

export async function checkSelectBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({ configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false, lib: { entry: join(consumerDirectory, 'select-browser.mjs'), formats: ['es'] } },
  })
  const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = outputs.filter(output => output.type === 'chunk')
  assert.equal(chunks.length, 1, 'Select fixture must be self-contained')
  assert.doesNotMatch(chunks[0].code, /matthew-(?:button|menu|auto-complete|thinking|tool-call|task-list)/,
    'select-only entry contains another component')
  assert.equal(outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css')).length, 0, 'Select emitted implicit CSS')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [mode, files] of Object.entries({ 'on-demand': ['dist/tokens.css', 'dist/select/style.css'], full: ['dist/styles.css'] })) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, reducedMotion: 'reduce' })
      page.setDefaultTimeout(8000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        await page.route('http://matthew-ui.test/**', route => route.fulfill(route.request().url().endsWith('/app.js')
          ? { contentType: 'text/javascript', body: chunks[0].code }
          : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}body{margin:0;font-family:Arial}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' }))
        await page.goto('http://matthew-ui.test/')
        for (const file of files) await page.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
        await inspect(page, mode)
        assert.deepEqual(errors, [], mode + ' Select must not throw')
      } finally { await page.close() }
    }
  } finally { await browser.close() }
}

async function inspect(page, mode) {
  const button = name => page.getByRole('combobox', { name, exact: true })
  const listFor = async trigger => page.locator('[id="' + await trigger.getAttribute('aria-controls') + '"]')
  const open = async name => { const trigger = button(name); await trigger.click(); const list = await listFor(trigger); await list.waitFor({ state: 'visible' }); return list }
  const close = () => page.keyboard.press('Escape')
  const ordinary = button('Default')
  await ordinary.waitFor({ state: 'visible' })
  assert.equal(await ordinary.getAttribute('data-ref-mounted'), 'true', mode + ' button ref')
  await styles(ordinary, { minHeight: '40px', fontSize: '14px', fontWeight: '400', borderRadius: '8px',
    color: 'rgb(15, 23, 42)', backgroundColor: 'rgb(255, 255, 255)', paddingBlock: '8px', paddingInline: '12px' }, mode + ' default trigger')
  let list = await open('Default')
  assert.equal(await list.evaluate(el => el.parentElement === document.body), true, mode + ' body Portal')
  await styles(list, { backgroundColor: 'rgb(255, 255, 255)', borderTopWidth: '1px', borderRadius: '8px',
    boxShadow: 'rgba(15, 23, 42, 0.12) 0px 12px 24px 0px' }, mode + ' default popup')
  await styles(list.getByRole('option', { name: 'All', exact: true }), { minHeight: '36px' }, mode + ' default option height')
  await page.keyboard.press('ArrowDown')
  await styles(list.getByRole('option', { name: 'Beta', exact: true }), { backgroundColor: 'rgb(241, 245, 249)' }, mode + ' active background')
  await styles(list.getByRole('option', { name: 'Alpha', exact: true }), { color: 'rgb(30, 64, 175)', fontWeight: '500' }, mode + ' selected color')
  await page.keyboard.press('Enter')
  assert.match(await ordinary.textContent(), /Beta/, mode + ' controlled commit')
  assert.equal(await ordinary.getAttribute('aria-expanded'), 'false')

  const configured = button('Configured')
  await styles(configured, { minHeight: '48px', fontSize: '16px', borderRadius: '12px', backgroundColor: 'rgb(250, 250, 250)',
    color: 'rgb(17, 17, 17)', paddingBlock: '10px', paddingInline: '20px' }, mode + ' configured trigger')
  await configured.hover()
  await styles(configured, { borderTopColor: 'rgb(0, 128, 0)' }, mode + ' configured hover')
  list = await open('Configured')
  await styles(list, { fontSize: '16px', backgroundColor: 'rgb(255, 247, 237)', boxShadow: 'none', borderRadius: '12px', borderTopColor: 'rgb(0, 0, 255)' }, mode + ' configured popup')
  await styles(list.getByRole('option', { name: 'All', exact: true }), { color: 'rgb(34, 34, 34)', minHeight: '44px' }, mode + ' configured option')
  await styles(list.getByRole('option', { name: 'Alpha', exact: true }), { color: 'rgb(128, 0, 128)', backgroundColor: 'rgb(255, 255, 0)' }, mode + ' configured selected and active')
  await styles(list.getByRole('option', { name: 'Blocked', exact: true }), { color: 'rgb(100, 116, 139)' }, mode + ' disabled option priority')
  await close()
  await styles(button('Placeholder').locator('.matthew-select__label'), { color: 'rgb(85, 85, 85)' }, mode + ' configured placeholder')
  await styles(button('Disabled'), { backgroundColor: 'rgb(241, 245, 249)', color: 'rgb(100, 116, 139)' }, mode + ' disabled trigger priority')

  list = await open('Dark')
  await styles(list, { backgroundColor: 'rgb(30, 41, 59)' }, mode + ' dark Portal theme')
  await close()
  list = await open('Nested')
  await styles(list.getByRole('option', { name: 'Alpha', exact: true }), { color: 'rgb(128, 0, 128)' }, mode + ' nested override')
  await close(); await page.getByRole('button', { name: 'Remove overrides' }).click()
  list = await open('Nested')
  await styles(button('Nested'), { minHeight: '40px' }, mode + ' dynamic height restoration')
  await styles(list.getByRole('option', { name: 'Alpha', exact: true }), { color: 'rgb(0, 128, 0)' }, mode + ' dynamic parent restoration')
  await close()

  list = await open('Source CSS')
  await styles(list, { backgroundColor: 'rgb(19, 32, 48)', fontFamily: 'monospace' }, mode + ' source CSS and inline Portal bridge')
  // 保持展开，直接更新祖先变量，验证不是只在打开时复制一次。
  await button('Source CSS').evaluate(el => el.parentElement.style.setProperty('--matthew-ui-select-option-selected-color', '#00ffff'))
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[role="listbox"] [aria-selected="true"]')).color === 'rgb(0, 255, 255)')
  await close()
  list = await open('Resize')
  const before = await rect(list)
  await button('Resize').evaluate(el => { el.parentElement.style.width = '280px' })
  await page.waitForFunction(() => document.querySelector('[role="listbox"]').getBoundingClientRect().width > 250)
  assert.ok((await rect(list)).width > before.width, mode + ' resize follows trigger')
  await close()

  list = await open('Transformed')
  let triggerRect = await rect(button('Transformed'))
  let popupRect = await rect(list)
  assert.ok(Math.abs(popupRect.left - triggerRect.left) < 1 && Math.abs(popupRect.width - triggerRect.width) < 1, mode + ' transformed host geometry')
  const previousTriggerTop = triggerRect.top
  await button('Transformed').evaluate(el => el.parentElement.scrollTop += 20)
  await page.waitForTimeout(50)
  triggerRect = await rect(button('Transformed')); popupRect = await rect(list)
  assert.ok(Math.abs(popupRect.left - triggerRect.left) < 1, mode + ' scrolling transformed host geometry')
  assert.ok(triggerRect.top < previousTriggerTop, mode + ' fixture must actually scroll')
  const gap = await list.getAttribute('data-placement') === 'top'
    ? triggerRect.top - popupRect.bottom : popupRect.top - triggerRect.bottom
  assert.ok(Math.abs(gap - 8) < 1, mode + ' scrolling popup follows vertical trigger position')
  await close()

  list = await open('Boundary')
  popupRect = await rect(list); triggerRect = await rect(button('Boundary'))
  assert.ok(popupRect.bottom <= triggerRect.top && popupRect.right <= 992 && popupRect.left >= 8, mode + ' flipped and horizontally clamped geometry')
  await styles(button('Boundary').locator('.matthew-select__arrow'), { transitionDuration: '0s' }, mode + ' reduced motion arrow')
  await styles(list.getByRole('option', { name: 'Alpha', exact: true }), { transitionDuration: '0s' }, mode + ' reduced motion option')
  await page.setViewportSize({ width: 320, height: 650 })
  await page.waitForFunction(() => {
    const r = document.querySelector('[role="listbox"]').getBoundingClientRect()
    return r.left >= 8 && r.right <= 312
  })
  popupRect = await rect(list)
  assert.ok(popupRect.left >= 8 && popupRect.right <= 312, mode + ' narrow viewport keeps popup within boundaries')
  await close()
  await page.setViewportSize({ width: 1000, height: 800 })
  await page.getByRole('button', { name: 'Open modal', exact: true }).click()
  list = await open('Modal')
  assert.equal(await list.evaluate(el => el.parentElement.tagName), 'DIALOG', mode + ' modal popupHost')
  await close()
  assert.equal(await page.locator('dialog').evaluate(el => el.open), true, mode + ' first Escape keeps native modal')
  await close()
  assert.equal(await page.locator('dialog').evaluate(el => el.open), false, mode + ' second Escape closes native modal')
}
