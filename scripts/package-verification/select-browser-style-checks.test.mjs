import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkSelectBrowserStyles } from './select-style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = join(fixture.packedRoot, 'consumer')
  await mkdir(consumerDirectory, { recursive: true })
  await mkdir(join(fixture.packedRoot, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/select-browser.mjs', import.meta.url), join(consumerDirectory, 'select-browser.mjs'))
  await symlink(fixture.packedRoot, join(fixture.packedRoot, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)), join(fixture.packedRoot, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = fixture => checkSelectBrowserStyles({ packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory })
test('browser accepts Select Portal styles, theme, geometry and native dialog in both CSS modes', async t => {
  await verify(await prepare(t))
})
for (const [name, css, error] of [
  ['default height', '.matthew-select{min-height:90px!important}', /default trigger/],
  ['selected color', '.matthew-select__option[aria-selected=true]{color:red!important}', /selected color/],
  ['dark Portal theme', '.matthew-select__popup[aria-label="Dark"]{background:white!important}', /dark Portal/],
  ['popup geometry', '.matthew-select__popup{left:0!important}', /transformed host geometry|flipped/],
  ['reduced motion', '.matthew-select__arrow{transition:transform 1s!important}', /reduced motion arrow/],
]) {
  test('browser rejects Select ' + name, async t => {
    const fixture = await prepare(t)
    await fixture.write('dist/select/style.css', await fixture.read('dist/select/style.css') + '\n' + css)
    await assert.rejects(verify(fixture), error)
  })
}
