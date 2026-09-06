import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkTaskListBrowserStyles } from './task-list-style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = join(fixture.packedRoot, 'consumer')
  await mkdir(consumerDirectory, { recursive: true })
  await mkdir(join(fixture.packedRoot, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/task-list-browser.mjs', import.meta.url), join(consumerDirectory, 'task-list-browser.mjs'))
  await symlink(fixture.packedRoot, join(fixture.packedRoot, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)),
      join(fixture.packedRoot, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = fixture => checkTaskListBrowserStyles({
  packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory,
})
test('browser accepts mounted TaskList defaults and customization in both CSS modes', async t => {
  await verify(await prepare(t))
})
const regressions = [
  ['missing TaskList on-demand root Tokens', ['dist/tokens.css'], '', /on-demand.*default/i],
  ['equally wrong TaskList header height', ['dist/task-list/style.css', 'dist/styles.css'],
    '.matthew-task-list__header{min-height:90px}', /on-demand.*default/i],
  ['configured TaskList dimensions', ['dist/styles.css'],
    '[data-task-list-custom] .matthew-task-list__header{min-height:90px}', /full.*configured/i],
  ['configured TaskList hover background', ['dist/task-list/style.css'],
    '[data-task-list-custom] .matthew-task-list__header:hover{background:red!important}',
    /on-demand.*configured.*hover/i],
  ['TaskList completed check color', ['dist/styles.css'],
    '[data-testid="task-list-ref"] .matthew-task-list__check{color:blue!important}', /full.*completed/i],
  ['TaskList running gap', ['dist/task-list/style.css'],
    '[data-testid="task-list-ref"] .matthew-task-list__ring{border-bottom-color:red!important}',
    /on-demand.*running/i],
  ['TaskList connection lines', ['dist/task-list/style.css'],
    '.matthew-task-list__item + .matthew-task-list__item::before{content:none!important}',
    /on-demand.*connection line/i],
  ['TaskList panel width constraint', ['dist/task-list/style.css'],
    '.matthew-task-list{width:100%!important}', /on-demand.*panel/i],
  ['TaskList reduced-motion suppression', ['dist/task-list/style.css'],
    '.matthew-task-list__ring{animation:matthew-task-list-ring-spin 0.9s linear infinite!important}',
    /reduced motion stops the ring rotation/i],
  ['TaskList narrow-container summary', ['dist/task-list/style.css'],
    '@container (max-width: 320px){.matthew-task-list__summary{position:static;clip-path:none;width:auto;height:auto;}}',
    /narrow viewport/i],
  // 破坏只作用于窄容器实例：若 locator 泄漏到默认实例，这些检查将不会失败。
  ['TaskList narrow-container title', ['dist/task-list/style.css'],
    '[data-task-list-narrow-container] .matthew-task-list__title{display:none!important}',
    /narrow viewport keeps the title/i],
  ['TaskList narrow-container progress', ['dist/task-list/style.css'],
    '[data-task-list-narrow-container] .matthew-task-list__progress{display:none!important}',
    /narrow viewport keeps the header progress summary/i],
  ['TaskList narrow-container list', ['dist/task-list/style.css'],
    '[data-task-list-narrow-container] .matthew-task-list__list{display:none!important}',
    /narrow viewport keeps the list mounted/i],
]
for (const [name, files, brokenCss, error] of regressions) {
  test('browser rejects ' + name, async t => {
    const fixture = await prepare(t)
    for (const file of files) await fixture.write(file, brokenCss ? await fixture.read(file) + '\n' + brokenCss : '')
    await assert.rejects(verify(fixture), error)
  })
}
