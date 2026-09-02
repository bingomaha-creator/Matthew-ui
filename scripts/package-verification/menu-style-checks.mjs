import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

// 独立于Button的静态SSR验收：Menu的注册、展开和父标题派生必须经过真实挂载。
// Vite从消费项目解析react与matthew-ui，不把库源码alias进来；只在内存生成验收bundle。
export async function checkMenuBrowserStyles({ packageRoot, consumerDirectory }) {
  const built = await build({
    configFile: false, root: consumerDirectory, logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      write: false, minify: false,
      lib: { entry: join(consumerDirectory, 'menu-browser.mjs'), formats: ['es'] },
    },
  })
  const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
  const chunks = outputs.filter(output => output.type === 'chunk')
  assert.equal(chunks.length, 1, 'Menu browser fixture must be a self-contained bundle')
  assert.doesNotMatch(chunks[0].code, /matthew-(?:button|auto-complete)/, 'menu-only JS contains another component')
  assert.equal(outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css')).length,
    0, 'Menu browser fixture emitted implicit CSS')
  const browser = await chromium.launch({ headless: true })
  const modes = { 'on-demand': ['dist/tokens.css', 'dist/menu/style.css'], full: ['dist/styles.css'] }
  try {
    for (const [mode, files] of Object.entries(modes)) {
      const page = await browser.newPage({ reducedMotion: 'reduce' })
      page.setDefaultTimeout(10_000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        // 拦截本地验收源，不启动额外网络服务，也不访问外部站点。
        await page.route('http://matthew-ui.test/**', route => route.fulfill(
          route.request().url().endsWith('/app.js')
            ? { contentType: 'text/javascript', body: chunks[0].code }
            : { contentType: 'text/html', body: '<!doctype html><html><head><style>html{font-size:16px}#app button,#app a{transition:none}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>' },
        ))
        await page.goto('http://matthew-ui.test/')
        for (const file of files) await page.addStyleTag({ content: await readFile(join(packageRoot, file), 'utf8') || '\n' })
        await inspectMenu(page, mode)
        assert.deepEqual(errors, [], mode + ' mounted Menu must not throw')
      } catch (error) {
        if (errors.length) throw new Error(mode + ' Menu browser errors: ' + errors.join('; '), { cause: error })
        throw error
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
}

const readStyles = (locator, keys) => locator.evaluate((element, names) => {
  const style = getComputedStyle(element)
  return Object.fromEntries(names.map(name => [name, style[name]]))
}, keys)
const expectStyles = async (locator, expected, message) => {
  assert.deepEqual(await readStyles(locator, Object.keys(expected)), expected, message)
}
// 最近的语义列表，不依赖a与ul之间必须有固定层数。
const popupOf = (link) => link.locator('xpath=ancestor::ul[1]')

async function inspectMenu(page, mode) {
  const defaultMenu = page.getByRole('list', { name: 'Default navigation', exact: true })
  const configured = page.getByRole('list', { name: 'Configured navigation', exact: true })
  const dark = page.getByRole('list', { name: 'Dark navigation', exact: true })
  const role = (scope, kind, name) => scope.getByRole(kind, { name, exact: true })
  const defaults = { minHeight: '40px', fontSize: '14px', borderRadius: '6px', paddingBlock: '8px', paddingInline: '12px' }
  for (const [scope, label, dimensions] of [
    [defaultMenu, 'default', defaults],
    [configured, 'configured', { minHeight: '48px', fontSize: '16px', borderRadius: '12px', paddingBlock: '10px', paddingInline: '20px' }],
  ]) {
    const link = role(scope, 'link', 'Docs')
    await link.waitFor({ state: 'visible' })
    for (const control of [role(scope, 'button', 'Home'), link, role(scope, 'button', 'Components')]) {
      await expectStyles(control, dimensions, mode + ' ' + label + ' dimensions')
    }
  }
  await expectStyles(role(defaultMenu, 'button', 'Home'), {
    backgroundColor: 'rgba(0, 0, 0, 0)', color: 'rgb(15, 23, 42)',
  }, mode + ' default colors')
  await expectStyles(popupOf(role(defaultMenu, 'link', 'Docs')), {
    backgroundColor: 'rgb(255, 255, 255)', boxShadow: 'rgba(15, 23, 42, 0.12) 0px 12px 24px 0px',
  }, mode + ' default popup')
  await expectStyles(configured, { backgroundColor: 'rgb(250, 250, 250)', borderBottomColor: 'rgb(22, 101, 52)' },
    mode + ' configured region')
  const home = role(configured, 'button', 'Home')
  await expectStyles(home, { color: 'rgb(20, 83, 45)', backgroundColor: 'rgba(0, 0, 0, 0)' }, mode + ' configured normal')
  await home.hover()
  await expectStyles(home, { backgroundColor: 'rgb(187, 247, 208)' }, mode + ' configured normal hover')
  const link = role(configured, 'link', 'Docs')
  const title = role(configured, 'button', 'Components')
  for (const [control, label] of [[link, 'selected link'], [title, 'ancestor title']]) {
    await control.hover()
    await expectStyles(control, {
      backgroundColor: 'rgb(220, 252, 231)', color: 'rgb(22, 101, 52)', fontWeight: '600',
    }, mode + ' configured ' + label + ' hover')
  }
  await expectStyles(popupOf(link), {
    backgroundColor: 'rgb(240, 253, 244)', borderTopColor: 'rgb(22, 101, 52)', boxShadow: 'none',
    position: 'absolute', minWidth: '192px',
  }, mode + ' configured popup')
  // 用公开点击选择Item，再用真实指针检查selected，而不是拼装私有class。
  const action = role(configured, 'button', 'Action')
  await action.click()
  assert.equal(await action.getAttribute('aria-current'), 'true', mode + ' configured Item must be selected')
  await expectStyles(action, { backgroundColor: 'rgb(220, 252, 231)', color: 'rgb(22, 101, 52)' },
    mode + ' configured selected Item hover')
  await role(dark, 'link', 'Docs').waitFor({ state: 'visible' })
  await expectStyles(popupOf(role(dark, 'link', 'Docs')), {
    backgroundColor: 'rgb(30, 41, 59)', boxShadow: 'rgba(255, 255, 255, 0.12) 0px 12px 24px 0px',
  }, mode + ' dark popup')
  await expectStyles(role(defaultMenu, 'button', 'Home'), {
    ...defaults, color: 'rgb(15, 23, 42)',
  }, mode + ' default outside scope')
}
