import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkSourceListBrowserStyles } from './source-list-style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = join(fixture.packedRoot, 'consumer')
  await mkdir(consumerDirectory, { recursive: true })
  await mkdir(join(fixture.packedRoot, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/source-list-browser.mjs', import.meta.url), join(consumerDirectory, 'source-list-browser.mjs'))
  await symlink(fixture.packedRoot, join(fixture.packedRoot, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)), join(fixture.packedRoot, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = fixture => checkSourceListBrowserStyles({ packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory })
test('browser accepts SourceList disclosure, themes, links, focus and wrapping in both CSS modes', async t => {
  await verify(await prepare(t))
})
test('browser rejects missing SourceList collapse focus return', async t => {
  const fixture = await prepare(t)
  const implementation = (await fixture.files()).find(file => /^dist\/SourceList-.*\.js$/.test(file))
  assert.ok(implementation, 'SourceList implementation chunk must exist')
  const source = await fixture.read(implementation)
  const focusCall = /\w+\.current\?\.focus\(\{ preventScroll: !0 \}\)/
  assert.match(source, focusCall, 'fault injection must remove the actual focus call')
  await fixture.write(implementation, source.replace(focusCall, 'void 0'))
  await assert.rejects(verify(fixture), /collapse focus return/)
})
for (const [name, css, error] of [
  ['panel border', '[data-default]{border-width:0!important}', /default panel/],
  ['header typography', '[data-default] .matthew-source-list__header{font-size:30px!important}', /default header/],
  ['hidden content', '[data-default] ul[hidden]{display:block!important}', /collapsed content hidden/],
  ['plain framing', '[data-plain]{background:white!important}', /plain panel/],
  ['dark link', '[data-dark] a{color:black!important}', /dark link/],
  ['focus outline', '[data-default] li{outline:none!important}', /programmatic focus outline/],
  ['reduced motion', '.matthew-source-list__arrow{transition:transform 1s!important}', /reduced motion arrow/],
  ['narrow width', '[data-narrow]{width:900px!important}', /narrow width/],
  ['narrow summary', '[data-narrow] .matthew-source-list__summary{display:none!important}', /narrow summary visible/],
]) {
  test('browser rejects SourceList ' + name, async t => {
    const fixture = await prepare(t)
    await fixture.write('dist/source-list/style.css', await fixture.read('dist/source-list/style.css') + '\n' + css)
    await assert.rejects(verify(fixture), error)
  })
}
