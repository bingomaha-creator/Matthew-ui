import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkDialogBrowserStyles } from './dialog-style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = join(fixture.packedRoot, 'consumer')
  await mkdir(consumerDirectory, { recursive: true })
  await mkdir(join(fixture.packedRoot, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/dialog-browser.mjs', import.meta.url), join(consumerDirectory, 'dialog-browser.mjs'))
  await symlink(fixture.packedRoot, join(fixture.packedRoot, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)), join(fixture.packedRoot, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = fixture => checkDialogBrowserStyles({ packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory })
test('browser accepts Dialog native modality, focus, themes, Select and narrow scrolling in both CSS modes', async t => {
  await verify(await prepare(t))
})
for (const [name, css, error] of [
  ['default width', '.matthew-dialog{width:900px!important}', /default panel/],
  ['title typography', '.matthew-dialog__title{font-size:40px!important}', /default title/],
  ['dark inheritance', '.matthew-dialog:has([data-calls="Dark"]){background:white!important}', /dark scope/],
  ['backdrop variable', '.matthew-dialog::backdrop{background:red!important}', /default backdrop/],
  ['initial focus', '.matthew-dialog__title{display:none!important}', /initial focus/],
  ['content scrolling', '.matthew-dialog__content{overflow:visible!important}', /default content/],
  ['reduced motion', '.matthew-dialog__close{transition:background 1s!important}', /reduced motion/],
]) {
  test('browser rejects Dialog ' + name, async t => {
    const fixture = await prepare(t)
    await fixture.write('dist/dialog/style.css', await fixture.read('dist/dialog/style.css') + '\n' + css)
    await assert.rejects(verify(fixture), error)
  })
}
