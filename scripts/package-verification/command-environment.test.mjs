import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createVerificationCommandEnvironment } from './command-environment.mjs'

test('nested npm install writes dependencies inside npm publish --dry-run', async (t) => {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), 'matthew-ui-command-environment-test-'),
  )
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }))

  const dependencyDirectory = join(temporaryDirectory, 'dependency')
  const consumerDirectory = join(temporaryDirectory, 'consumer')
  await mkdir(dependencyDirectory)
  await mkdir(consumerDirectory)
  await writeFile(
    join(dependencyDirectory, 'package.json'),
    JSON.stringify({ name: 'local-fixture', version: '1.0.0' }),
  )
  await writeFile(
    join(consumerDirectory, 'package.json'),
    JSON.stringify({
      name: 'consumer-fixture',
      private: true,
      dependencies: { 'local-fixture': 'file:../dependency' },
    }),
  )

  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['install', '--ignore-scripts', '--package-lock=false'],
    {
      cwd: consumerDirectory,
      encoding: 'utf8',
      env: createVerificationCommandEnvironment({
        npmCache: join(temporaryDirectory, 'npm-cache'),
        parentEnvironment: {
          ...process.env,
          npm_config_dry_run: 'true',
        },
      }),
    },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.equal(
    existsSync(join(consumerDirectory, 'node_modules', 'local-fixture')),
    true,
    'nested npm install must write dependencies used by consumer verification',
  )
})
