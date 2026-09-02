import assert from 'node:assert/strict'
import test from 'node:test'
import { checkPackage, checkPackageFiles } from './package-checks.mjs'
import { createPackageFixture } from './test-support.mjs'

// 调用检查模块的公开 Interface，观察整个发布包是否被接受，不测试内部遍历步骤。
async function failuresFor(fixture) {
  const failures = []
  const check = async (label, callback) => {
    try {
      await callback()
      return true
    } catch (error) {
      failures.push(label + ': ' + error.message)
      return false
    }
  }
  const context = { ...fixture, packageFiles: await fixture.files(), check }
  await checkPackageFiles(context)
  await checkPackage(context)
  return failures
}

test('current complete published file tree is accepted', async (t) => {
  const fixture = await createPackageFixture(t)
  assert.deepEqual(await failuresFor(fixture), [])
})

for (const orphan of [
  'dist/debug.txt',
  'dist/chunks/orphan.js',
  'dist/types/orphan.d.ts',
  'dist/styles/orphan.css',
  'dist/chunks/orphan.js.map',
]) {
  test('unreferenced file is rejected: ' + orphan, async (t) => {
    const fixture = await createPackageFixture(t)
    await fixture.write(orphan, 'unused fixture data')
    assert.match((await failuresFor(fixture)).join('\n'), /orphan|unreachable|unexpected/i)
  })
}

test('nested shared JS, declaration dependencies and CSS assets are accepted', async (t) => {
  const fixture = await createPackageFixture(t)
  await fixture.write('dist/index.js', await fixture.read('dist/index.js') +
    "\nimport './chunks/first.js';")
  await fixture.writeModule('dist/chunks/first.js', "export * from './second.js';")
  await fixture.writeModule('dist/chunks/second.js', 'export const answer = 42;')
  await fixture.write('dist/button/index.d.ts', await fixture.read('dist/button/index.d.ts') +
    "\nimport type { Extra } from '../types/extra.js';")
  await fixture.write('dist/types/extra.d.ts', "export type Extra = import('./base.js').Base;")
  await fixture.write('dist/types/base.d.ts', 'export type Base = string;')
  await fixture.write('dist/button/style.css', await fixture.read('dist/button/style.css') +
    "\n.matthew-button{background-image:url('../assets/icon.svg')}")
  await fixture.write('dist/assets/icon.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')
  assert.deepEqual(await failuresFor(fixture), [])
})

test('mentioning a filename only in a comment or string does not make it reachable', async (t) => {
  const fixture = await createPackageFixture(t)
  await fixture.write('dist/index.js', await fixture.read('dist/index.js') +
    "\n// import './phantom.js'\nconst ignored = \"require('./phantom.js')\";")
  await fixture.writeModule('dist/phantom.js', 'export const unused = true;')
  assert.match((await failuresFor(fixture)).join('\n'), /phantom\.js/)
})

test('a missing nested dependency is rejected even if its importer exists', async (t) => {
  const fixture = await createPackageFixture(t)
  await fixture.write('dist/index.js', await fixture.read('dist/index.js') +
    "\nimport './chunks/missing.js';")
  assert.match((await failuresFor(fixture)).join('\n'), /missing.*chunks\/missing\.js/i)
})

for (const format of ['js', 'cjs']) {
  test(format + ' chunks reachable through another chunk are accepted, including cycles', async (t) => {
    const fixture = await createPackageFixture(t)
    const root = 'dist/index.' + format
    const reference = format === 'js'
      ? "import './indirect-a.js';"
      : "require('./indirect-a.cjs');"
    await fixture.write(root, await fixture.read(root) + '\n' + reference)
    await fixture.writeModule('dist/indirect-a.' + format, format === 'js'
      ? "export * from './indirect-b.js';"
      : "module.exports = require('./indirect-b.cjs');")
    await fixture.writeModule('dist/indirect-b.' + format, format === 'js'
      ? "import './indirect-a.js'; export const value = 1;"
      : "require('./indirect-a.cjs'); exports.value = 1;")
    assert.deepEqual(await failuresFor(fixture), [])
  })
}
