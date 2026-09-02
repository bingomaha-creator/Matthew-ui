import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../../', import.meta.url))

// 只修改临时发布包副本，绝不改变仓库的 dist 或组件源码。
export async function createPackageFixture(t) {
  const packedRoot = await mkdtemp(join(tmpdir(), 'matthew-ui-verifier-test-'))
  t.after(() => rm(packedRoot, { recursive: true, force: true }))
  for (const file of ['dist', 'package.json', 'README.md', 'LICENSE']) {
    await cp(join(projectRoot, file), join(packedRoot, file), { recursive: true })
  }
  const packedManifest = JSON.parse(await readFile(join(packedRoot, 'package.json'), 'utf8'))
  const write = async (file, content) => {
    await mkdir(dirname(join(packedRoot, file)), { recursive: true })
    await writeFile(join(packedRoot, file), content)
  }
  return {
    packedRoot,
    packedManifest,
    write,
    read: (file) => readFile(join(packedRoot, file), 'utf8'),
    async files() {
      const entries = await readdir(packedRoot, { recursive: true, withFileTypes: true })
      return entries.filter(entry => entry.isFile()).map(entry => {
        const absolute = join(entry.parentPath, entry.name)
        return absolute.slice(packedRoot.length + 1).split(sep).join('/')
      }).sort()
    },
    async writeModule(file, code) {
      await write(file, code + '\n//# sourceMappingURL=' + basename(file) + '.map\n')
      await write(file + '.map', JSON.stringify({
        version: 3, file: basename(file), names: [], mappings: 'AAAA',
        sources: ['fixture-input.ts'], sourcesContent: [code],
      }))
    },
  }
}
