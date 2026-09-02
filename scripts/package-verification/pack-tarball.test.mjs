import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { packTarball } from './pack-tarball.mjs'

const projectRoot = fileURLToPath(new URL('../../', import.meta.url))

test('creates a real tarball when called inside npm publish --dry-run', async (t) => {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), 'matthew-ui-pack-tarball-test-'),
  )
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }))

  const run = async (command, args) => {
    const result = spawnSync(command, args, {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, npm_config_dry_run: 'true' },
    })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout
  }

  const { tarballPath } = await packTarball({
    npmCommand: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    run,
    temporaryDirectory,
  })

  assert.equal(
    existsSync(tarballPath),
    true,
    'npm pack must create the tarball consumed by package verification',
  )
})
