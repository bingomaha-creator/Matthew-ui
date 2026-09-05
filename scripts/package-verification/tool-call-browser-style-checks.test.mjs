import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkToolCallBrowserStyles } from './tool-call-style-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

async function prepare(t) {
  const fixture = await createPackageFixture(t)
  const consumerDirectory = join(fixture.packedRoot, 'consumer')
  await mkdir(consumerDirectory, { recursive: true })
  await mkdir(join(fixture.packedRoot, 'node_modules'), { recursive: true })
  await cp(new URL('./fixtures/tool-call-browser.mjs', import.meta.url), join(consumerDirectory, 'tool-call-browser.mjs'))
  await symlink(fixture.packedRoot, join(fixture.packedRoot, 'node_modules/matthew-ui'), 'dir')
  for (const dependency of ['react', 'react-dom', 'scheduler', 'clsx']) {
    await symlink(fileURLToPath(new URL('../../node_modules/' + dependency, import.meta.url)),
      join(fixture.packedRoot, 'node_modules', dependency), 'dir')
  }
  return { ...fixture, consumerDirectory }
}
const verify = fixture => checkToolCallBrowserStyles({
  packageRoot: fixture.packedRoot, consumerDirectory: fixture.consumerDirectory,
})
test('browser accepts mounted ToolCall defaults and customization in both CSS modes', async t => {
  await verify(await prepare(t))
})
const regressions = [
  ['missing ToolCall on-demand root Tokens', ['dist/tokens.css'], '', /on-demand.*default/i],
  ['equally wrong ToolCall header height', ['dist/tool-call/style.css', 'dist/styles.css'],
    '.matthew-tool-call__header{min-height:90px}', /on-demand.*default/i],
  ['configured ToolCall dimensions', ['dist/styles.css'],
    '[data-tool-call-custom] .matthew-tool-call__header{min-height:90px}', /full.*configured/i],
  ['configured ToolCall hover background', ['dist/tool-call/style.css'],
    '[data-tool-call-custom] .matthew-tool-call__header:hover{background:red!important}',
    /on-demand.*configured.*hover/i],
  ['ToolCall default error color', ['dist/styles.css'],
    '[data-testid="status-error"] .matthew-tool-call__bang{color:blue!important}', /full.*error/i],
  ['ToolCall running gap', ['dist/tool-call/style.css'],
    '[data-testid="status-running"] .matthew-tool-call__ring{border-bottom-color:red!important}',
    /on-demand.*running/i],
  ['ToolCall reduced-motion suppression', ['dist/tool-call/style.css'],
    '.matthew-tool-call__ring{animation:matthew-tool-call-ring-spin 0.9s linear infinite!important}',
    /reduced motion stops the ring rotation/i],
  ['ToolCall narrow-viewport summary', ['dist/tool-call/style.css'],
    '@media (max-width: 320px){.matthew-tool-call__summary{position:static;clip-path:none;width:auto;height:auto;}}',
    /narrow viewport/i],
]
for (const [name, files, brokenCss, error] of regressions) {
  test('browser rejects ' + name, async t => {
    const fixture = await prepare(t)
    for (const file of files) await fixture.write(file, brokenCss ? await fixture.read(file) + '\n' + brokenCss : '')
    await assert.rejects(verify(fixture), error)
  })
}
