import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const failures = []

const readJson = async (relativePath) => {
  const path = new URL(relativePath, import.meta.url)

  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push(`Cannot read ${relativePath}: ${message}`)
    return undefined
  }
}

const runGit = (args) => {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  return {
    ok: result.status === 0,
    stderr: result.stderr?.trim() ?? result.error?.message ?? '',
    stdout: result.stdout?.trim() ?? '',
  }
}

const requireGit = (args, description) => {
  const result = runGit(args)

  if (!result.ok) {
    failures.push(
      `${description}: ${result.stderr || `git ${args.join(' ')} failed`}`,
    )
    return undefined
  }

  return result.stdout
}

const packageData = await readJson('../package.json')
const lockData = await readJson('../package-lock.json')

if (packageData && lockData) {
  const versions = [
    ['package.json', packageData.version],
    ['package-lock.json', lockData.version],
    ['package-lock.json packages[""]', lockData.packages?.['']?.version],
  ]
  const expectedVersion = packageData.version

  if (
    typeof expectedVersion !== 'string' ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(expectedVersion)
  ) {
    failures.push('Only stable x.y.z package versions can be released')
  }

  for (const [source, version] of versions) {
    if (typeof version !== 'string' || version !== expectedVersion) {
      failures.push(
        `${source} version must equal package.json version ${expectedVersion}`,
      )
    }
  }

  if ('private' in packageData && packageData.private !== false) {
    failures.push(
      'package.json private must be absent or the boolean false for a release',
    )
  }

  if (packageData.publishConfig?.access !== 'public') {
    failures.push('publishConfig.access must be "public"')
  }

  if (
    packageData.publishConfig?.registry !== 'https://registry.npmjs.org/'
  ) {
    failures.push(
      'publishConfig.registry must be "https://registry.npmjs.org/"',
    )
  }

  const status = requireGit(
    ['status', '--porcelain=v1', '--untracked-files=all'],
    'Cannot inspect the Git worktree',
  )

  if (status) {
    failures.push('Git worktree must be clean before release')
  }

  const head = requireGit(['rev-parse', 'HEAD^{commit}'], 'Cannot resolve HEAD')
  const expectedTag = `v${expectedVersion}`
  const isGitHubRelease =
    process.env.GITHUB_ACTIONS === 'true' &&
    process.env.GITHUB_EVENT_NAME === 'release' &&
    process.env.GITHUB_REF_TYPE === 'tag' &&
    process.env.GITHUB_REF_NAME === expectedTag
  const expectedConfirmation = `${packageData.name}@${expectedVersion}`

  if (
    !isGitHubRelease &&
    process.env.MATTHEW_UI_RELEASE_CONFIRMATION !== expectedConfirmation
  ) {
    failures.push(
      `Set MATTHEW_UI_RELEASE_CONFIRMATION=${expectedConfirmation} for a local release`,
    )
  }

  const tagCommit = requireGit(
    ['rev-parse', '--verify', `refs/tags/${expectedTag}^{commit}`],
    `Missing release tag ${expectedTag}`,
  )

  if (head && tagCommit && head !== tagCommit) {
    failures.push(`${expectedTag} must point at the current HEAD`)
  }

  const remoteMain = requireGit(
    ['rev-parse', '--verify', 'refs/remotes/origin/main^{commit}'],
    'Cannot resolve origin/main; fetch the remote before releasing',
  )

  if (head && remoteMain && head !== remoteMain) {
    failures.push('HEAD must be fully synchronized with origin/main')
  }

  const originUrl = requireGit(
    ['remote', 'get-url', 'origin'],
    'Cannot resolve the origin remote URL',
  )
  const allowedOriginUrls = new Set([
    'git@github.com:bingomaha-creator/Matthew-ui.git',
    'https://github.com/bingomaha-creator/Matthew-ui',
    'https://github.com/bingomaha-creator/Matthew-ui.git',
    'ssh://git@github.com/bingomaha-creator/Matthew-ui.git',
  ])

  if (originUrl && !allowedOriginUrls.has(originUrl)) {
    failures.push('origin must point to bingomaha-creator/Matthew-ui on GitHub')
  }

  const branch = runGit(['symbolic-ref', '--short', '-q', 'HEAD'])

  if (branch.ok) {
    if (branch.stdout !== 'main') {
      failures.push('Local releases must run from the main branch')
    }

    const upstream = requireGit(
      ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
      'The main branch must have an upstream',
    )

    if (upstream && upstream !== 'origin/main') {
      failures.push('The main branch upstream must be origin/main')
    }
  } else {
    if (!isGitHubRelease && process.env.GITHUB_ACTIONS !== 'true') {
      failures.push('Detached HEAD releases are only allowed in GitHub Actions')
    }

    if (!isGitHubRelease && process.env.GITHUB_EVENT_NAME !== 'release') {
      failures.push('GitHub Actions releases must use the release event')
    }

    if (!isGitHubRelease) {
      failures.push(`GitHub Actions must run from the ${expectedTag} tag`)
    }
  }
}

if (failures.length > 0) {
  console.error('Release checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log(
    `Release checks passed for ${packageData.name}@${packageData.version}`,
  )
}
