import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  checkPackageFiles,
  checkPackage,
} from './package-verification/package-checks.mjs'
import { checkStyles } from './package-verification/style-checks.mjs'
import { checkConsumers } from './package-verification/consumer-checks.mjs'
import { packTarball } from './package-verification/pack-tarball.mjs'

// 总入口只负责临时环境、命令执行、流程编排、失败汇总和最终清理。
const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const temporaryDirectory = await mkdtemp(
  join(tmpdir(), 'matthew-ui-package-check-'),
)
const npmCache = join(temporaryDirectory, 'npm-cache')
const failures = []
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? projectRoot,
      env: {
        ...process.env,
        npm_config_cache: npmCache,
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeout ?? 300_000,
    })
    let stdout = ''
    let stderr = ''

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve(stdout)
        return
      }

      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n')
      reject(
        new Error(
          `${command} ${args.join(' ')} exited with code ${code}${
            signal ? ` after signal ${signal}` : ''
          }${
            output ? `\n${output}` : ''
          }`,
        ),
      )
    })
  })

const check = async (label, callback) => {
  try {
    await callback()
    console.log(`PASS ${label}`)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push(`${label}: ${message}`)
    console.error(`FAIL ${label}\n${message}`)
    return false
  }
}

try {
  console.log('Creating npm tarball...')
  const { tarballPath, packageFiles } = await packTarball({
    npmCommand,
    run,
    temporaryDirectory,
  })

  await checkPackageFiles({ packageFiles, check })

  const extractedDirectory = join(temporaryDirectory, 'extracted')
  await mkdir(extractedDirectory)
  await run('tar', ['-xzf', tarballPath, '-C', extractedDirectory])

  const packedRoot = join(extractedDirectory, 'package')
  const packedManifest = JSON.parse(
    await readFile(join(packedRoot, 'package.json'), 'utf8'),
  )

  await checkPackage({ packedRoot, packedManifest, packageFiles, check })
  await checkStyles({
    packedRoot, projectRoot, packageFiles, temporaryDirectory, check,
  })
  await checkConsumers({
    temporaryDirectory, tarballPath, npmCommand, run, check,
  })

  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => new Error(failure)),
      `Package verification failed with ${failures.length} error(s)`,
    )
  }

  console.log('Package verification passed for React 18.2 and React 19.')
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true })
}
