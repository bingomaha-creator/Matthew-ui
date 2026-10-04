import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

const styles = async (locator, expected, message, pseudo) => {
  const actual = await locator.evaluate((el, { keys, pseudo }) => {
    const s = getComputedStyle(el, pseudo)
    return Object.fromEntries(keys.map(key => [key, s[key]]))
  }, { keys: Object.keys(expected), pseudo })
  assert.deepEqual(actual, expected, message)
}
const rect = locator => locator.evaluate(el => {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
})

export async function checkDialogBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({ configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false, lib: { entry: join(consumerDirectory, 'dialog-browser.mjs'), formats: ['es'] } },
  })
  const output = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = output.filter(item => item.type === 'chunk')
  assert.equal(chunks.length, 1, 'Dialog fixture must be self-contained')
  assert.equal(output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).length, 0, 'Dialog must not emit implicit CSS')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [mode, files] of Object.entries({ 'on-demand': ['dist/tokens.css', 'dist/dialog/style.css', 'dist/select/style.css', 'dist/button/style.css'], full: ['dist/styles.css'] })) {
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
        assert.deepEqual(errors, [], mode + ' Dialog must not throw')
      } finally { await page.close() }
    }
  } finally { await browser.close() }
}

async function inspect(page, mode) {
  const open = async name => {
    await page.getByRole('button', { name: 'Open ' + name, exact: true }).click()
    const dialog = page.getByRole('dialog', { name, exact: true })
    await dialog.waitFor({ state: 'visible' })
    assert.equal(await dialog.evaluate(el => el.matches(':modal')), true, mode + ' native modality')
    return dialog
  }
  let dialog = await open('Default')
  await styles(dialog, { width: '512px', fontSize: '14px', borderRadius: '8px', borderTopWidth: '1px',
    color: 'rgb(15, 23, 42)', backgroundColor: 'rgb(255, 255, 255)', fontFamily: 'Arial' }, mode + ' default panel')
  await styles(dialog.locator('h2'), { fontSize: '16px', fontWeight: '500' }, mode + ' default title')
  await styles(dialog.locator('.matthew-dialog__content'), { padding: '20px', overflowY: 'auto' }, mode + ' default content')
  await styles(dialog, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }, mode + ' default backdrop', '::backdrop')
  assert.equal(await dialog.getAttribute('data-ref-mounted'), 'true', mode + ' native ref')
  assert.equal(await dialog.locator('h2').evaluate(el => el === document.activeElement), true, mode + ' initial focus')
  await page.getByRole('button', { name: 'Open Dark', exact: true }).evaluate(el => el.focus())
  assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true, mode + ' background focus isolation')
  await dialog.getByRole('textbox').fill('Edited draft')
  await page.mouse.click(5, 5)
  assert.equal(await dialog.isVisible(), true, mode + ' backdrop is not dismissible by default')
  await styles(dialog.locator('.matthew-dialog__close'), { transitionDuration: '0s' }, mode + ' reduced motion close button')
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('button', { name: 'Open Default', exact: true }).evaluate(el => el === document.activeElement), true, mode + ' return focus')
  assert.equal(await page.locator('html').evaluate(el => el.style.overflow), '', mode + ' release scroll lock')
  dialog = await open('Default')
  assert.equal(await dialog.getByRole('textbox').inputValue(), 'Edited draft', mode + ' retained draft')
  await page.keyboard.press('Escape')

  dialog = await open('Dark')
  await styles(dialog, { backgroundColor: 'rgb(30, 41, 59)', color: 'rgb(248, 250, 252)' }, mode + ' dark scope')
  await page.keyboard.press('Escape')
  dialog = await open('Configured')
  await styles(dialog, { backgroundColor: 'rgb(255, 247, 237)', color: 'rgb(34, 34, 34)', borderTopColor: 'rgb(0, 0, 255)',
    borderRadius: '12px', boxShadow: 'none' }, mode + ' configured panel')
  await styles(dialog, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }, mode + ' configured backdrop', '::backdrop')
  await styles(dialog.locator('h2'), { color: 'rgb(128, 0, 128)', fontSize: '20px' }, mode + ' configured title')
  await styles(dialog.locator('.matthew-dialog__content'), { padding: '8px 24px' }, mode + ' configured content')
  const close = dialog.getByRole('button', { name: 'Close Configured', exact: true })
  await styles(close, { color: 'rgb(0, 128, 0)' }, mode + ' configured close')
  await close.hover()
  await styles(close, { backgroundColor: 'rgb(255, 255, 0)' }, mode + ' configured close hover')
  await dialog.getByRole('button', { name: 'Remove overrides' }).click()
  await styles(dialog, { backgroundColor: 'rgb(255, 255, 255)', borderRadius: '8px' }, mode + ' removed override')
  await styles(dialog.locator('h2'), { color: 'rgb(0, 128, 0)', fontSize: '16px' }, mode + ' inherited restoration')
  await page.keyboard.press('Escape')

  dialog = await open('Reject')
  await page.keyboard.press('Escape')
  assert.equal(await dialog.isVisible(), true, mode + ' controlled rejection stays modal')
  assert.equal(await dialog.locator('[data-calls]').textContent(), '1', mode + ' single Escape request')
  await dialog.getByRole('button', { name: 'Close Reject', exact: true }).click()
  assert.equal(await dialog.locator('[data-calls]').textContent(), '2', mode + ' close button request')
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  dialog = await open('Backdrop')
  const panel = await rect(dialog)
  await page.mouse.move(panel.left + 50, panel.top + 30); await page.mouse.down(); await page.mouse.move(5, 5); await page.mouse.up()
  assert.equal(await dialog.isVisible(), true, mode + ' inside-outside drag does not dismiss')
  await page.mouse.click(5, 5)
  assert.equal(await dialog.isVisible(), false, mode + ' opt-in backdrop dismisses')
  dialog = await open('Busy')
  assert.equal(await dialog.getByRole('button', { name: 'Close Busy', exact: true }).isDisabled(), true, mode + ' busy close disabled')
  await page.keyboard.press('Escape'); await page.mouse.click(5, 5)
  assert.equal(await dialog.locator('[data-calls]').textContent(), '0', mode + ' busy Escape and backdrop blocked')
  await dialog.getByRole('button', { name: 'Finish saving' }).click(); await page.keyboard.press('Escape')
  assert.equal(await dialog.isVisible(), false, mode + ' dismissal restores dynamically')

  dialog = await open('Initial focus')
  assert.equal(await dialog.getByRole('textbox').evaluate(el => el === document.activeElement), true, mode + ' explicit initial focus')
  await page.keyboard.press('Escape')
  dialog = await open('Source CSS')
  await styles(dialog, { backgroundColor: 'rgb(19, 32, 48)', fontFamily: 'monospace' }, mode + ' source CSS inheritance')
  await page.keyboard.press('Escape')
  dialog = await open('Select')
  await dialog.getByRole('combobox').click()
  assert.equal(await dialog.locator('[role=listbox]').isVisible(), true, mode + ' Select is inside modal')
  await styles(dialog.getByRole('combobox'), { paddingRight: '12px' }, mode + ' Select arrow right padding')
  await page.keyboard.press('Escape')
  assert.equal(await dialog.isVisible(), true, mode + ' first Escape preserves Dialog')
  assert.equal(await dialog.locator('[role=listbox]').count(), 0, mode + ' first Escape closes Select')
  await page.keyboard.press('Escape')
  assert.equal(await dialog.isVisible(), false, mode + ' second Escape closes Dialog')

  dialog = await open('Long')
  await page.setViewportSize({ width: 375, height: 650 })
  let r = await rect(dialog)
  assert.equal(r.width, 343, mode + ' narrow panel width')
  assert.ok(r.left >= 16 && r.right <= 359 && r.height <= 618, mode + ' narrow panel fits viewport')
  const content = dialog.locator('.matthew-dialog__content')
  assert.equal(await content.evaluate(el => el.scrollHeight > el.clientHeight), true, mode + ' long content scrolls')
  await content.evaluate(el => { el.scrollTop = el.scrollHeight })
  assert.equal(await dialog.locator('header').evaluate(el => el.getBoundingClientRect().top >= 16), true, mode + ' header remains visible')
  assert.equal(await dialog.getByRole('button', { name: 'Save', exact: true }).isVisible(), true, mode + ' footer remains visible')
  await page.locator('html').evaluate(el => { el.style.fontSize = '32px' })
  r = await rect(dialog)
  assert.ok(r.left >= 32 && r.right <= 343 && r.height <= 586, mode + ' 200 percent text stays within viewport')
  assert.equal(await content.evaluate(el => el.scrollWidth <= el.clientWidth), true, mode + ' 200 percent text has no horizontal overflow')
  await page.keyboard.press('Escape')
}
