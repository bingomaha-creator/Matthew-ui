import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as styleChecks from './style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

// 浏览器必须挂载真实React组件，不能用SSR首次未注册的子菜单冒充浮层。
async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = join(fixture.packedRoot, 'consumer')
  await mkdir(consumerDirectory, { recursive: true })
  await mkdir(join(fixture.packedRoot, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/menu-browser.mjs', import.meta.url), join(consumerDirectory, 'menu-browser.mjs'))
  await symlink(fixture.packedRoot, join(fixture.packedRoot, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)),
      join(fixture.packedRoot, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = async (fixture) => styleChecks.checkMenuBrowserStyles({
  packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory,
})

test('browser accepts mounted Menu defaults and customization in both CSS modes', async (t) => {
  await verify(await prepare(t))
})

const regressions = [
  ['missing on-demand root Tokens', ['dist/tokens.css'], '', /on-demand.*default/i],
  ['equally wrong default font in both modes', ['dist/menu/style.css', 'dist/styles.css'],
    '[data-menu-default] button{font-size:30px}', /on-demand.*default/i],
  ['configured link dimensions in full CSS', ['dist/styles.css'],
    '[data-menu-custom] a{min-height:90px}', /full.*configured.*dimensions/i],
  ['selected hover background in full CSS', ['dist/styles.css'],
    '[data-menu-custom] [aria-current="true"]:hover{background:red!important}', /full.*selected.*hover/i],
  ['popup background in on-demand CSS', ['dist/menu/style.css'],
    '[data-menu-custom] ul ul{background:red!important}', /on-demand.*popup/i],
  ['ancestor title hover in full CSS', ['dist/styles.css'],
    '[data-menu-custom] button[aria-expanded]:hover{background:red!important}', /full.*ancestor.*hover/i],
]
for (const [name, files, brokenCss, error] of regressions) {
  test('browser rejects ' + name, async (t) => {
    const fixture = await prepare(t)
    for (const file of files) {
      await fixture.write(file, brokenCss ? await fixture.read(file) + '\n' + brokenCss : '')
    }
    await assert.rejects(verify(fixture), error)
  })
}
