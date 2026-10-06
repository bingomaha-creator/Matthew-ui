import assert from 'node:assert/strict'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { createPackageFixture } from './test-support.mjs'
import { checkCodeBlockBrowserStyles } from './code-block-style-checks.mjs'

async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = fixture.packedRoot
  await mkdir(join(consumerDirectory, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/code-block-browser.mjs', import.meta.url), join(consumerDirectory, 'code-block-browser.mjs'))
  await symlink(fixture.packedRoot, join(consumerDirectory, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)), join(consumerDirectory, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = fixture => checkCodeBlockBrowserStyles({ packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory })
test('browser accepts CodeBlock copying, themes and wrapping in both CSS modes', async t => {
  await verify(await prepare(t))
})
test('browser rejects copying transformed text instead of the original snapshot', async t => {
  const fixture = await prepare(t)
  const implementation = (await fixture.files()).find(file => /^dist\/CodeBlock-.*\.js$/.test(file))
  assert.ok(implementation, 'CodeBlock implementation chunk must exist')
  const source = await fixture.read(implementation)
  const call = /navigator\.clipboard\.writeText\(\w+\)/
  assert.match(source, call, 'fault injection must change the actual clipboard call')
  await fixture.write(implementation, source.replace(call, 'navigator.clipboard.writeText("transformed")'))
  await assert.rejects(verify(fixture), /clipboard preserves exact original/)
})
for (const [name, css, error] of [
  ['border', '[data-default]{border-width:0!important}', /default panel/],
  ['code typography', '[data-default] pre{font-size:30px!important}', /default code/],
  ['live status', '[data-default] [role=status]:empty{display:none!important}', /empty status region registered/],
  ['dark theme', '[data-dark]{background:white!important}', /dark panel/],
  ['dynamic restoration', '[data-configured]{border-radius:12px!important}', /dynamic restoration/],
  ['narrow width', '[data-narrow]{width:900px!important}', /narrow width/],
  ['wrapping', '[data-wrapped] pre{white-space:pre!important;overflow-wrap:normal!important}', /wrapped no overflow/],
  ['reduced motion', '.matthew-code-block__copy{transition:background-color 1s!important}', /hover and reduced motion/],
]) {
  test('browser rejects CodeBlock ' + name, async t => {
    const fixture = await prepare(t)
    await fixture.write('dist/code-block/style.css', await fixture.read('dist/code-block/style.css') + '\n' + css)
    await assert.rejects(verify(fixture), error)
  })
}
