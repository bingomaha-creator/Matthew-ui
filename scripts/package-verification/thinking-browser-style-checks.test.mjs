import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkThinkingBrowserStyles } from './thinking-style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = join(fixture.packedRoot, 'consumer')
  await mkdir(consumerDirectory, { recursive: true })
  await mkdir(join(fixture.packedRoot, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/thinking-browser.mjs', import.meta.url), join(consumerDirectory, 'thinking-browser.mjs'))
  await symlink(fixture.packedRoot, join(fixture.packedRoot, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)),
      join(fixture.packedRoot, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = fixture => checkThinkingBrowserStyles({
  packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory,
})
test('browser accepts mounted Thinking defaults and customization in both CSS modes', async t => {
  await verify(await prepare(t))
})
const regressions = [
  ['missing Thinking on-demand root Tokens', ['dist/tokens.css'], '', /on-demand.*default/i],
  ['equally wrong Thinking header height', ['dist/thinking/style.css', 'dist/styles.css'],
    '.matthew-thinking__header{min-height:90px}', /on-demand.*default/i],
  ['configured Thinking dimensions', ['dist/styles.css'],
    '[data-thinking-custom] .matthew-thinking__header{min-height:90px}', /full.*configured/i],
  ['configured Thinking hover background', ['dist/thinking/style.css'],
    '[data-thinking-custom] .matthew-thinking__header:hover{background:red!important}',
    /on-demand.*configured.*hover/i],
  ['Thinking default error color', ['dist/styles.css'],
    '[data-testid="status-error"] .matthew-thinking__bang{color:blue!important}', /full.*error/i],
  ['Thinking reduced-motion suppression', ['dist/thinking/style.css'],
    '.matthew-thinking__dots span{animation:matthew-thinking-dot-bounce 0.9s ease-in-out infinite!important}',
    /reduced motion stops the dot animation/i],
]
for (const [name, files, brokenCss, error] of regressions) {
  test('browser rejects ' + name, async t => {
    const fixture = await prepare(t)
    for (const file of files) await fixture.write(file, brokenCss ? await fixture.read(file) + '\n' + brokenCss : '')
    await assert.rejects(verify(fixture), error)
  })
}
