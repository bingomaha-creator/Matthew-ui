import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button, LinkButton } from '../../dist/button/index.js'
import { ThemeProvider } from '../../dist/theme/index.js'
import * as styleChecks from './style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

// 不挂 Provider，不注入 inline Token；验证发布 CSS 本身提供的默认样式。
const markup = renderToStaticMarkup(createElement(Button, null, 'Save'))
const verify = (fixture) => styleChecks.checkBrowserStyles({
  packageRoot: fixture.packedRoot,
  markup,
})


const configuredMarkup = renderToStaticMarkup(createElement('div', null,
  createElement(ThemeProvider, {
    'data-package-custom': '',
    theme: { components: { Button: {
      background: '#166534', backgroundHover: '#14532d', backgroundActive: '#052e16',
      color: '#ffffff', borderColor: '#166534', borderRadius: 20,
      minHeight: 48, fontSize: 16, paddingBlock: 10, paddingInline: 24,
    } } },
  },
  createElement(Button, null, 'Custom save'),
  createElement(LinkButton, { href: '#docs' }, 'Custom docs')),
  createElement(Button, null, 'Outside'),
))
const verifyConfigured = (fixture) => styleChecks.checkBrowserStyles({
  packageRoot: fixture.packedRoot, markup, configuredMarkup,
})

test('browser accepts configured Button and LinkButton in both CSS modes', async (t) => {
  await verifyConfigured(await createPackageFixture(t))
})

test('browser rejects equally wrong configured radius in both CSS modes', async (t) => {
  const fixture = await createPackageFixture(t)
  for (const file of ['dist/button/style.css', 'dist/styles.css']) {
    await fixture.write(file, await fixture.read(file) +
      '\n[data-package-custom] .matthew-button{border-radius:1px}')
  }
  await assert.rejects(verifyConfigured(fixture), /configured.*default/i)
})

test('browser rejects broken on-demand configured hover styles', async (t) => {
  const fixture = await createPackageFixture(t)
  const file = 'dist/button/style.css'
  await fixture.write(file, await fixture.read(file) +
    "\n[data-package-custom] .matthew-button:not(:disabled):not([aria-disabled='true']):hover{background:red}")
  await assert.rejects(verifyConfigured(fixture), /configured.*hover/i)
})

test('browser rejects a full CSS regression specific to configured links', async (t) => {
  const fixture = await createPackageFixture(t)
  const file = 'dist/styles.css'
  await fixture.write(file, await fixture.read(file) +
    '\n[data-package-custom] a.matthew-button{font-size:30px}')
  await assert.rejects(verifyConfigured(fixture), /full.*configured.*default/i)
})
test('browser accepts default Button styles in full and on-demand CSS', async (t) => {
  await verify(await createPackageFixture(t))
})

test('browser rejects on-demand CSS with missing root Tokens', async (t) => {
  const fixture = await createPackageFixture(t)
  await fixture.write('dist/tokens.css', '')
  await assert.rejects(verify(fixture), /on-demand.*default/i)
})

test('browser rejects incorrect on-demand Button height', async (t) => {
  const fixture = await createPackageFixture(t)
  await fixture.write('dist/button/style.css',
    await fixture.read('dist/button/style.css') + '\n.matthew-button--md{min-height:60px}')
  await assert.rejects(verify(fixture), /on-demand.*default/i)
})

test('browser rejects incorrect full CSS even when on-demand CSS is correct', async (t) => {
  const fixture = await createPackageFixture(t)
  await fixture.write('dist/styles.css',
    await fixture.read('dist/styles.css') + '\n.matthew-button--md{min-height:60px}')
  await assert.rejects(verify(fixture), /full.*default/i)
})

test('browser rejects equally wrong full and on-demand styles', async (t) => {
  const fixture = await createPackageFixture(t)
  // 两套 CSS 一起出错也应失败，不能只做“彼此相等”的同源比较。
  for (const file of ['dist/tokens.css', 'dist/styles.css']) {
    await fixture.write(file,
      await fixture.read(file) + '\n:root{--matthew-ui-color-text:#ff0000}')
  }
  await assert.rejects(verify(fixture), /default/i)
})
