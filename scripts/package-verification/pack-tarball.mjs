import assert from 'node:assert/strict'
import { join } from 'node:path'

// 生成后续真实安装验证所使用的 tarball，并返回 npm 报告的公开文件清单。
export async function packTarball({ npmCommand, run, temporaryDirectory }) {
  const packOutput = await run(npmCommand, [
    'pack',
    // npm publish --dry-run 会把配置传给 prepublishOnly；这里必须生成供后续验证的真实临时包。
    '--dry-run=false',
    '--json',
    '--pack-destination',
    temporaryDirectory,
  ])
  const [packResult] = JSON.parse(packOutput)

  assert.ok(packResult, 'npm pack did not return a package result')

  return {
    packResult,
    tarballPath: join(temporaryDirectory, packResult.filename),
    packageFiles: packResult.files.map(({ path }) => path).sort(),
  }
}
