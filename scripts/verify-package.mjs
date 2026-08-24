import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const temporaryDirectory = await mkdtemp(
  join(tmpdir(), 'matthew-ui-package-check-'),
)
const npmCache = join(temporaryDirectory, 'npm-cache')
const failures = []
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const expectedPackageFiles = [
  'LICENSE',
  'README.md',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.js.map',
  'dist/styles.css',
  'dist/styles.css.map',
  'package.json',
]
const expectedPublicExports = [
  'AutoComplete',
  'AutoCompleteOption',
  'AutoCompleteProps',
  'Button',
  'ButtonProps',
  'ButtonSize',
  'ButtonVariant',
  'LinkButton',
  'LinkButtonProps',
  'Menu',
  'MenuItemProps',
  'MenuLinkItemProps',
  'MenuMode',
  'MenuProps',
  'MenuSubMenuProps',
]

const consumerTypeFixture = `
import { createRef } from 'react'
import { AutoComplete, Button, LinkButton, Menu } from 'matthew-ui'
import type {
  AutoCompleteOption,
  AutoCompleteProps,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  LinkButtonProps,
  MenuItemProps,
  MenuLinkItemProps,
  MenuMode,
  MenuProps,
  MenuSubMenuProps,
} from 'matthew-ui'

type PlayerOption = AutoCompleteOption & {
  number: number
}

type PublicTypeContract = [
  AutoCompleteProps<PlayerOption>,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  LinkButtonProps,
  MenuItemProps,
  MenuLinkItemProps,
  MenuMode,
  MenuProps,
  MenuSubMenuProps,
]

declare const publicTypes: PublicTypeContract
void publicTypes

const players: PlayerOption[] = [
  { value: 'james', number: 23 },
  { value: 'caruso', number: 4 },
]
const buttonRef = createRef<HTMLButtonElement>()
const anchorRef = createRef<HTMLAnchorElement>()
const inputRef = createRef<HTMLInputElement>()
const divRef = createRef<HTMLDivElement>()

const validButton = <Button ref={buttonRef}>Save</Button>
const validLinkButton = (
  <LinkButton href="/docs" ref={anchorRef}>Docs</LinkButton>
)
const explicitGeneric = (
  <AutoComplete<PlayerOption>
    fetchSuggestions={() => players}
    onOptionSelect={(player) => player.number.toFixed()}
    ref={inputRef}
    renderOption={(player) => player.number}
  />
)
const inferredGeneric = (
  <AutoComplete
    fetchSuggestions={() => players}
    onOptionSelect={(player) => {
      player.number.toFixed()
      // @ts-expect-error Inference must not degrade the option to any.
      player.number.toUpperCase()
    }}
    renderOption={(player) => player.number}
  />
)
const validMenu = (
  <Menu aria-label="Navigation" mode="vertical">
    <Menu.Item value="home">Home</Menu.Item>
    <Menu.LinkItem href="/docs" value="docs">Docs</Menu.LinkItem>
    <Menu.SubMenu title="Components" value="components">
      <Menu.Item value="button">Button</Menu.Item>
    </Menu.SubMenu>
  </Menu>
)

// @ts-expect-error Button refs point to HTMLButtonElement.
const buttonWithWrongRef = <Button ref={anchorRef}>Save</Button>
// @ts-expect-error LinkButton refs point to HTMLAnchorElement.
const linkWithWrongRef = <LinkButton href="/docs" ref={buttonRef}>Docs</LinkButton>
const autoCompleteWithWrongRef = (
  <AutoComplete
    // @ts-expect-error AutoComplete refs point to HTMLInputElement.
    ref={divRef}
    fetchSuggestions={() => players}
  />
)

void [
  validButton,
  validLinkButton,
  explicitGeneric,
  inferredGeneric,
  validMenu,
  buttonWithWrongRef,
  linkWithWrongRef,
  autoCompleteWithWrongRef,
]
`

const esmFixture = `
import assert from 'node:assert/strict'

const expectedExports = ['AutoComplete', 'Button', 'LinkButton', 'Menu']
const ui = await import('matthew-ui')

assert.deepEqual(Object.keys(ui).sort(), expectedExports)
assert.match(import.meta.resolve('matthew-ui/styles.css'), /styles\\.css$/)
await assert.rejects(
  () => import('matthew-ui/dist/index.js'),
  { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' },
)
`

const cjsFixture = `
const assert = require('node:assert/strict')

const expectedExports = ['AutoComplete', 'Button', 'LinkButton', 'Menu']
const ui = require('matthew-ui')

assert.deepEqual(Object.keys(ui).sort(), expectedExports)
assert.match(require.resolve('matthew-ui/styles.css'), /styles\\.css$/)
assert.throws(
  () => require('matthew-ui/dist/index.js'),
  { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' },
)
`

const refFixture = `
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
})
const { window } = dom

for (const key of [
  'document',
  'Element',
  'Event',
  'HTMLElement',
  'HTMLAnchorElement',
  'HTMLButtonElement',
  'HTMLInputElement',
  'MutationObserver',
  'Node',
  'navigator',
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: window[key],
  })
}

globalThis.self = window
globalThis.window = window
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)

const React = await import('react')
const { createRoot } = await import('react-dom/client')
const { flushSync } = await import('react-dom')
const { AutoComplete, Button, LinkButton, Menu } = await import('matthew-ui')
const { createElement, createRef } = React

const buttonRef = createRef()
const anchorRef = createRef()
const inputRef = createRef()
const container = document.querySelector('#root')
const root = createRoot(container)

flushSync(() => {
  root.render(
    createElement(
      'div',
      null,
      createElement(
        Button,
        { 'data-ref-target': 'button', ref: buttonRef },
        'Save',
      ),
      createElement(
        LinkButton,
        { 'data-ref-target': 'link', href: '/docs', ref: anchorRef },
        'Docs',
      ),
      createElement(AutoComplete, {
        'aria-label': 'Search',
        'data-ref-target': 'input',
        fetchSuggestions: () => [],
        ref: inputRef,
      }),
      createElement(
        Menu,
        { 'aria-label': 'Navigation' },
        createElement(Menu.Item, { value: 'home' }, 'Home'),
      ),
    ),
  )
})

assert.ok(buttonRef.current instanceof window.HTMLButtonElement)
assert.ok(anchorRef.current instanceof window.HTMLAnchorElement)
assert.ok(inputRef.current instanceof window.HTMLInputElement)
assert.strictEqual(
  buttonRef.current,
  container.querySelector('[data-ref-target="button"]'),
)
assert.strictEqual(
  anchorRef.current,
  container.querySelector('[data-ref-target="link"]'),
)
assert.strictEqual(
  inputRef.current,
  container.querySelector('[data-ref-target="input"]'),
)
assert.ok(buttonRef.current.isConnected)
assert.ok(anchorRef.current.isConnected)
assert.ok(inputRef.current.isConnected)
assert.equal(container.querySelector('.matthew-menu')?.tagName, 'UL')

flushSync(() => root.unmount())
dom.window.close()
`

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

const writeJson = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`)

const getDeclarationExports = (sourceText) => {
  const sourceFile = ts.createSourceFile(
    'index.d.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const exportedNames = new Set()

  const addBindingName = (name) => {
    if (ts.isIdentifier(name)) {
      exportedNames.add(name.text)
      return
    }

    for (const element of name.elements) {
      if (!ts.isOmittedExpression(element)) {
        addBindingName(element.name)
      }
    }
  }

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      assert.ok(
        statement.exportClause && ts.isNamedExports(statement.exportClause),
        'dist/index.d.ts must use explicit named exports',
      )
      for (const element of statement.exportClause.elements) {
        exportedNames.add(element.name.text)
      }
      continue
    }

    const isExported = ts
      .getModifiers(statement)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    if (!isExported) {
      continue
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        addBindingName(declaration.name)
      }
    } else if ('name' in statement && statement.name) {
      addBindingName(statement.name)
    }
  }

  return [...exportedNames].sort()
}

const assertManifest = (manifest) => {
  assert.equal(manifest.name, 'matthew-ui')
  assert.equal(manifest.license, 'MIT')
  assert.equal(manifest.type, 'module')
  assert.equal(manifest.main, './dist/index.cjs')
  assert.equal(manifest.module, './dist/index.js')
  assert.equal(manifest.types, './dist/index.d.ts')
  assert.equal(manifest.style, './dist/styles.css')
  assert.deepEqual(manifest.files, ['dist'])
  assert.deepEqual(manifest.sideEffects, ['**/*.css'])
}

const assertPublicMetadata = (manifest) => {
  assert.equal(manifest.repository?.type, 'git')
  assert.equal(
    manifest.repository?.url,
    'git+https://github.com/bingomaha-creator/Matthew-ui.git',
  )
  assert.equal(
    manifest.homepage,
    'https://github.com/bingomaha-creator/Matthew-ui#readme',
  )
  assert.equal(
    manifest.bugs?.url,
    'https://github.com/bingomaha-creator/Matthew-ui/issues',
  )
  assert.equal(manifest.engines?.node, '^20.19.0 || >=22.12.0')
  assert.deepEqual(manifest.publishConfig, {
    access: 'public',
    registry: 'https://registry.npmjs.org/',
  })
  assert.ok(Array.isArray(manifest.keywords))
  for (const keyword of ['react', 'component-library', 'typescript']) {
    assert.ok(
      manifest.keywords.includes(keyword),
      `package keywords are missing ${keyword}`,
    )
  }
}

const assertExports = (manifest) => {
  assert.deepEqual(Object.keys(manifest.exports).sort(), ['.', './styles.css'])
  assert.deepEqual(Object.keys(manifest.exports['.']), [
    'types',
    'import',
    'require',
  ])
  assert.deepEqual(manifest.exports['.'], {
    types: './dist/index.d.ts',
    import: './dist/index.js',
    require: './dist/index.cjs',
  })
  assert.equal(manifest.exports['./styles.css'], './dist/styles.css')
}

const assertReactPeers = (manifest) => {
  const expectedRange = '^18.2.0 || ^19.0.0'

  assert.equal(manifest.peerDependencies?.react, expectedRange)
  assert.equal(manifest.peerDependencies?.['react-dom'], expectedRange)
  assert.equal(manifest.dependencies?.react, undefined)
  assert.equal(manifest.dependencies?.['react-dom'], undefined)
  assert.equal(manifest.optionalDependencies?.react, undefined)
  assert.equal(manifest.optionalDependencies?.['react-dom'], undefined)

  const bundledDependencies =
    manifest.bundleDependencies ?? manifest.bundledDependencies ?? []
  assert.ok(!bundledDependencies.includes('react'))
  assert.ok(!bundledDependencies.includes('react-dom'))
}

const createConsumer = async (directory, label) => {
  await mkdir(directory, { recursive: true })
  await writeJson(join(directory, 'package.json'), {
    name: `matthew-ui-${label}-consumer`,
    private: true,
    type: 'module',
  })
  await writeJson(join(directory, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      types: ['react', 'react-dom'],
    },
    include: ['consumer.tsx'],
  })
  await Promise.all([
    writeFile(join(directory, 'consumer.tsx'), consumerTypeFixture.trimStart()),
    writeFile(join(directory, 'esm-check.mjs'), esmFixture.trimStart()),
    writeFile(join(directory, 'cjs-check.cjs'), cjsFixture.trimStart()),
    writeFile(join(directory, 'ref-check.mjs'), refFixture.trimStart()),
  ])
}

try {
  console.log('Creating npm tarball...')
  const packOutput = await run(npmCommand, [
    'pack',
    '--json',
    '--pack-destination',
    temporaryDirectory,
  ])
  const [packResult] = JSON.parse(packOutput)

  assert.ok(packResult, 'npm pack did not return a package result')

  const tarballPath = join(temporaryDirectory, packResult.filename)
  const packageFiles = packResult.files.map(({ path }) => path).sort()

  await check('tarball contains only the public package files', () => {
    assert.deepEqual(packageFiles, expectedPackageFiles)
  })

  const extractedDirectory = join(temporaryDirectory, 'extracted')
  await mkdir(extractedDirectory)
  await run('tar', ['-xzf', tarballPath, '-C', extractedDirectory])

  const packedRoot = join(extractedDirectory, 'package')
  const packedManifest = JSON.parse(
    await readFile(join(packedRoot, 'package.json'), 'utf8'),
  )

  await check('packed manifest entry points are stable', () => {
    assertManifest(packedManifest)
  })
  await check('packed manifest exposes public npm metadata', () => {
    assertPublicMetadata(packedManifest)
  })
  await check('packed license grants the MIT terms', async () => {
    const license = await readFile(join(packedRoot, 'LICENSE'), 'utf8')

    assert.match(license, /^MIT License$/m)
    assert.match(license, /Permission is hereby granted, free of charge/)
    assert.match(
      license,
      /The above copyright notice and this permission notice shall be included/,
    )
    assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/)
  })
  await check('packed README documents the public consumer contract', async () => {
    const readme = await readFile(join(packedRoot, 'README.md'), 'utf8')

    assert.match(readme, /\bnpm\s+(?:install|i)\s+matthew-ui(?=\s|$)/)
    assert.match(readme, /from\s+['"]matthew-ui['"]/)
    assert.match(readme, /import\s+['"]matthew-ui\/styles\.css['"]/)
    assert.ok(readme.includes(packedManifest.peerDependencies.react))
    assert.ok(readme.includes(packedManifest.engines.node))
    for (const componentName of ['Button', 'Menu', 'AutoComplete']) {
      assert.match(
        readme,
        new RegExp(
          `import\\s*\\{[^}]*\\b${componentName}\\b[^}]*\\}\\s*from\\s*['"]matthew-ui['"]`,
        ),
      )
    }
  })
  await check('packed exports expose only JS, types, and CSS entry points', () => {
    assertExports(packedManifest)
  })
  await check('packed React peer contract covers React 18.2 and React 19', () => {
    assertReactPeers(packedManifest)
  })
  await check('packed declaration exports only the public API', async () => {
    const declaration = await readFile(
      join(packedRoot, 'dist/index.d.ts'),
      'utf8',
    )

    assert.deepEqual(getDeclarationExports(declaration), expectedPublicExports)
  })
  await check('packed CSS contains every public component style', async () => {
    const css = await readFile(join(packedRoot, 'dist/styles.css'), 'utf8')

    assert.ok(css.length > 0, 'dist/styles.css is empty')
    for (const selector of [
      '.matthew-button',
      '.matthew-menu',
      '.matthew-auto-complete',
    ]) {
      assert.ok(css.includes(selector), `dist/styles.css is missing ${selector}`)
    }
  })
  await check('packed source maps are valid version 3 maps', async () => {
    const sourceMaps = new Map([
      ['dist/index.js.map', 'index.js'],
      ['dist/index.cjs.map', 'index.cjs'],
      ['dist/styles.css.map', 'styles.css'],
    ])

    for (const [mapPath, generatedFile] of sourceMaps) {
      const sourceMap = JSON.parse(
        await readFile(join(packedRoot, mapPath), 'utf8'),
      )

      assert.equal(sourceMap.version, 3, `${mapPath} is not a version 3 map`)
      assert.equal(sourceMap.file, generatedFile)
      assert.ok(Array.isArray(sourceMap.sources) && sourceMap.sources.length > 0)
      assert.equal(typeof sourceMap.mappings, 'string')
      assert.ok(sourceMap.mappings.length > 0, `${mapPath} has no mappings`)
      assert.equal(sourceMap.sourcesContent?.length, sourceMap.sources.length)
      assert.ok(sourceMap.sourcesContent.every((source) => typeof source === 'string'))
    }
  })

  const consumers = [
    {
      label: 'React 18.2',
      packageLabel: 'react-18',
      directoryName: 'consumer-react-18',
      reactVersion: '18.2.0',
      reactDomVersion: '18.2.0',
      reactTypesVersion: '18.2.0',
      reactDomTypesVersion: '18.2.0',
      additionalPackages: ['@types/scheduler@0.16.8'],
    },
    {
      label: 'React 19',
      packageLabel: 'react-19',
      directoryName: 'consumer-react-19',
      reactVersion: '19.0.0',
      reactDomVersion: '19.0.0',
      reactTypesVersion: '19.0.0',
      reactDomTypesVersion: '19.0.0',
      additionalPackages: [],
    },
  ]

  for (const consumer of consumers) {
    const consumerDirectory = join(
      temporaryDirectory,
      consumer.directoryName,
    )
    await createConsumer(consumerDirectory, consumer.packageLabel)

    console.log(`Installing ${consumer.label} consumer...`)
    const installed = await check(
      `${consumer.label} consumer installs the real tarball`,
      () =>
        run(
          npmCommand,
          [
            'install',
            '--no-audit',
            '--no-fund',
            '--package-lock=false',
            '--save-exact',
            tarballPath,
            `react@${consumer.reactVersion}`,
            `react-dom@${consumer.reactDomVersion}`,
            `@types/react@${consumer.reactTypesVersion}`,
            `@types/react-dom@${consumer.reactDomTypesVersion}`,
            'typescript@6.0.3',
            'jsdom@26.1.0',
            ...consumer.additionalPackages,
          ],
          { cwd: consumerDirectory },
        ),
    )

    if (!installed) {
      continue
    }

    await check(`${consumer.label} public types, refs, and generics compile`, () =>
      run(npmCommand, ['exec', '--', 'tsc', '--project', 'tsconfig.json'], {
        cwd: consumerDirectory,
      }),
    )
    await check(`${consumer.label} ESM and CSS exports resolve`, () =>
      run('node', ['esm-check.mjs'], { cwd: consumerDirectory }),
    )
    await check(`${consumer.label} CommonJS and deep-import boundaries work`, () =>
      run('node', ['cjs-check.cjs'], { cwd: consumerDirectory }),
    )
    await check(`${consumer.label} forwards refs to real DOM elements`, () =>
      run('node', ['ref-check.mjs'], { cwd: consumerDirectory }),
    )
  }

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
