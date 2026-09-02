import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

// 消费端解析依赖并挂载真实组件，防抖、加载与候选均经过公开交互。
// 不复制6B全部单测：这里验证打包产物在两种CSS入口下仍满足固定合同。
export async function checkAutoCompleteBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({
    configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false,
      lib: { entry: join(consumerDirectory, 'auto-complete-browser.mjs'), formats: ['es'] } },
  })
  const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = outputs.filter(output => output.type === 'chunk')
  assert.equal(chunks.length, 1, 'AutoComplete fixture must be self-contained')
  assert.doesNotMatch(chunks[0].code, /matthew-(?:button|menu)/, 'auto-complete-only contains another component')
  assert.equal(outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css')).length,
    0, 'AutoComplete emitted implicit CSS')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [mode, files] of Object.entries({
      'on-demand': ['dist/tokens.css', 'dist/auto-complete/style.css'], full: ['dist/styles.css'],
    })) {
      const page = await browser.newPage({ reducedMotion: 'reduce' })
      page.setDefaultTimeout(10_000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        let receiveRequest
        const pendingRequest = new Promise(resolve => { receiveRequest = resolve })
        await page.route('http://matthew-ui.test/**', route => {
          const url = route.request().url()
          if (url.endsWith('/suggestions')) { receiveRequest(route); return }
          return route.fulfill(url.endsWith('/app.js')
            ? { contentType: 'text/javascript', body: chunks[0].code }
            : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' })
        })
        await page.goto('http://matthew-ui.test/')
        for (const file of files) await page.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
        await inspect(page, mode, async () => {
          const route = await pendingRequest
          await route.fulfill({ json: [{ value: 'Alpha' }, { value: 'Beta' }] })
        })
        assert.deepEqual(errors, [], mode + ' mounted AutoComplete must not throw')
      } finally { await page.close() }
    }
  } finally { await browser.close() }
}
const expectStyles = async (locator, expected, message) => {
  const actual = await locator.evaluate((el, keys) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(keys.map(key => [key, s[key]]))
  }, Object.keys(expected))
  assert.deepEqual(actual, expected, message)
}
async function inspect(page, mode, resolveSuggestions) {
  const input = name => page.getByRole('combobox', { name, exact: true })
  const option = name => page.getByRole('option', { name, exact: true })
  const baseline = { fontSize: '14px', minHeight: '40px', borderRadius: '8px', paddingBlock: '8px', paddingInline: '12px',
    backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(15, 23, 42)', borderTopColor: 'rgb(203, 213, 225)' }
  await input('Default').waitFor({ state: 'visible' })
  await expectStyles(input('Default'), baseline, mode + ' default input')
  await input('Default').fill('q')
  await option('Alpha').waitFor({ state: 'visible' })
  await expectStyles(option('Alpha'), {
    fontSize: '14px', borderRadius: '6px', paddingBlock: '10px', paddingInline: '12px',
    color: 'rgb(15, 23, 42)', backgroundColor: 'rgba(0, 0, 0, 0)',
  }, mode + ' default option')
  await expectStyles(page.getByRole('listbox'), { backgroundColor: 'rgb(255, 255, 255)',
    boxShadow: 'rgba(15, 23, 42, 0.12) 0px 12px 24px 0px' }, mode + ' default popup')
  await input('Default').press('Escape')

  await expectStyles(input('Configured'), { fontSize: '18px', minHeight: '48px', borderRadius: '12px',
    paddingBlock: '6px', paddingInline: '20px', backgroundColor: 'rgb(250, 250, 250)',
    color: 'rgb(20, 83, 45)', borderTopColor: 'rgb(22, 101, 52)' }, mode + ' configured input')
  await input('Configured').hover()
  await expectStyles(input('Configured'), { borderTopColor: 'rgb(5, 46, 22)' }, mode + ' configured input hover')
  await input('Configured').fill('q')
  const status = page.getByRole('status')
  await status.waitFor({ state: 'visible' })
  const loadingRow = status.locator('xpath=ancestor::li[1]')
  const optionGeometry = { fontSize: '18px', borderRadius: '4px', paddingBlock: '8px', paddingInline: '16px' }
  await expectStyles(loadingRow, { ...optionGeometry, color: 'rgb(100, 116, 139)', backgroundColor: 'rgba(0, 0, 0, 0)' },
    mode + ' configured loading')
  await expectStyles(page.getByRole('listbox'), { backgroundColor: 'rgb(240, 253, 244)', boxShadow: 'none',
    borderTopColor: 'rgb(22, 101, 52)', maxHeight: '240px', padding: '4px' }, mode + ' configured popup')
  await resolveSuggestions()
  await option('Alpha').waitFor({ state: 'visible' })
  await expectStyles(option('Alpha'), { ...optionGeometry, color: 'rgb(20, 83, 45)' }, mode + ' configured option')
  await input('Configured').press('ArrowDown')
  const active = { backgroundColor: 'rgb(220, 252, 231)', color: 'rgb(22, 101, 52)', fontWeight: '600' }
  assert.equal(await option('Alpha').getAttribute('aria-selected'), 'true')
  await expectStyles(option('Alpha'), active, mode + ' configured keyboard candidate')
  assert.equal(await input('Configured').inputValue(), 'q', mode + ' candidate is not committed')
  await option('Beta').hover()
  await expectStyles(option('Beta'), active, mode + ' configured pointer candidate')
  await input('Configured').press('Enter')
  assert.equal(await input('Configured').inputValue(), 'Beta', mode + ' real selection commits')
  await page.getByRole('listbox').waitFor({ state: 'hidden' })

  for (const [name, opacity, cursor] of [['Disabled', '0.6', 'not-allowed'], ['Read only', '1', 'default']]) {
    await input(name).hover()
    await expectStyles(input(name), { backgroundColor: 'rgb(241, 245, 249)', color: 'rgb(20, 83, 45)',
      borderTopColor: 'rgb(22, 101, 52)', opacity, cursor }, mode + ' configured ' + name)
  }
  await input('Dark').fill('q')
  await option('Alpha').waitFor({ state: 'visible' })
  await expectStyles(page.getByRole('listbox'), { backgroundColor: 'rgb(30, 41, 59)',
    boxShadow: 'rgba(255, 255, 255, 0.12) 0px 12px 24px 0px' }, mode + ' dark popup')
  await expectStyles(input('Default'), baseline, mode + ' default outside scope')
}
