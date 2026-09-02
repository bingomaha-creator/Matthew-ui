import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkAutoCompleteBrowserStyles } from './auto-complete-style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = join(fixture.packedRoot, 'consumer')
  await mkdir(consumerDirectory, { recursive: true })
  await mkdir(join(fixture.packedRoot, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/auto-complete-browser.mjs', import.meta.url), join(consumerDirectory, 'auto-complete-browser.mjs'))
  await symlink(fixture.packedRoot, join(fixture.packedRoot, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)),
      join(fixture.packedRoot, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = fixture => checkAutoCompleteBrowserStyles({
  packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory,
})
test('browser accepts mounted AutoComplete defaults and customization in both CSS modes', async t => {
  await verify(await prepare(t))
})
const regressions = [
  ['missing AutoComplete on-demand root Tokens', ['dist/tokens.css'], '', /on-demand.*default/i],
  ['equally wrong AutoComplete default font', ['dist/auto-complete/style.css', 'dist/styles.css'],
    '[data-ac-default] input{font-size:30px}', /on-demand.*default/i],
  ['configured AutoComplete input dimensions', ['dist/styles.css'],
    '[data-ac-custom] input{min-height:90px}', /full.*configured.*input/i],
  ['AutoComplete keyboard candidate colors', ['dist/auto-complete/style.css'],
    '[data-ac-custom] [aria-selected="true"]{background:red!important}', /on-demand.*candidate/i],
  ['AutoComplete loading dimensions', ['dist/styles.css'],
    '[data-ac-custom] li{padding-block:30px}', /full.*loading/i],
  ['AutoComplete dark popup shadow', ['dist/styles.css'],
    '[data-ac-dark] [role="listbox"]{box-shadow:none}', /full.*dark.*popup/i],
]
for (const [name, files, brokenCss, error] of regressions) {
  test('browser rejects ' + name, async t => {
    const fixture = await prepare(t)
    for (const file of files) await fixture.write(file, brokenCss ? await fixture.read(file) + '\n' + brokenCss : '')
    await assert.rejects(verify(fixture), error)
  })
}
