import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join, posix } from 'node:path'
import ts from 'typescript'

const requiredPackageFiles = [
  'LICENSE',
  'README.md',
  'dist/auto-complete/index.cjs',
  'dist/auto-complete/index.cjs.map',
  'dist/auto-complete/index.d.ts',
  'dist/auto-complete/index.js',
  'dist/auto-complete/index.js.map',
  'dist/auto-complete/style.css',
  'dist/auto-complete/style.css.map',
  'dist/button/index.cjs',
  'dist/button/index.cjs.map',
  'dist/button/index.d.ts',
  'dist/button/index.js',
  'dist/button/index.js.map',
  'dist/button/style.css',
  'dist/button/style.css.map',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.js.map',
  'dist/menu/index.cjs',
  'dist/menu/index.cjs.map',
  'dist/menu/index.d.ts',
  'dist/menu/index.js',
  'dist/menu/index.js.map',
  'dist/menu/style.css',
  'dist/menu/style.css.map',
  'dist/styles.css',
  'dist/styles.css.map',
  'dist/thinking/index.cjs',
  'dist/thinking/index.cjs.map',
  'dist/thinking/index.d.ts',
  'dist/thinking/index.js',
  'dist/thinking/index.js.map',
  'dist/thinking/style.css',
  'dist/thinking/style.css.map',
  'dist/tool-call/index.cjs',
  'dist/tool-call/index.cjs.map',
  'dist/tool-call/index.d.ts',
  'dist/tool-call/index.js',
  'dist/tool-call/index.js.map',
  'dist/tool-call/style.css',
  'dist/tool-call/style.css.map',
  'dist/theme/index.cjs',
  'dist/theme/index.cjs.map',
  'dist/theme/index.d.ts',
  'dist/theme/index.js',
  'dist/theme/index.js.map',
  'dist/tokens.css',
  'dist/tokens.css.map',
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
  'CssVariableMap',
  'CssVariableName',
  'HexColor',
  'LinkButton',
  'LinkButtonProps',
  'MatthewSeedToken',
  'MatthewThemeConfig',
  'MatthewThemeTokens',
  'Menu',
  'MenuItemProps',
  'MenuLinkItemProps',
  'MenuMode',
  'MenuProps',
  'MenuSubMenuProps',
  'ThemeProvider',
  'ThemeProviderProps',
  'Thinking',
  'ThinkingProps',
  'ThinkingStatus',
  'ToolCall',
  'ToolCallProps',
  'ToolCallStatus',
  'createTokens',
  'darkTheme',
  'lightTheme',
  'tokensToCssVars',
]

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
  assert.deepEqual(Object.keys(manifest.exports).sort(), [
    '.',
    './auto-complete',
    './auto-complete/style.css',
    './button',
    './button/style.css',
    './menu',
    './menu/style.css',
    './styles.css',
    './theme',
    './thinking',
    './thinking/style.css',
    './tokens.css',
    './tool-call',
    './tool-call/style.css',
  ])
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
  assert.deepEqual(manifest.exports['./button'], {
    types: './dist/button/index.d.ts',
    import: './dist/button/index.js',
    require: './dist/button/index.cjs',
  })
  assert.deepEqual(manifest.exports['./auto-complete'], {
    types: './dist/auto-complete/index.d.ts',
    import: './dist/auto-complete/index.js',
    require: './dist/auto-complete/index.cjs',
  })
  assert.deepEqual(manifest.exports['./menu'], {
    types: './dist/menu/index.d.ts',
    import: './dist/menu/index.js',
    require: './dist/menu/index.cjs',
  })
  assert.deepEqual(manifest.exports['./thinking'], {
    types: './dist/thinking/index.d.ts',
    import: './dist/thinking/index.js',
    require: './dist/thinking/index.cjs',
  })
  assert.deepEqual(manifest.exports['./tool-call'], {
    types: './dist/tool-call/index.d.ts',
    import: './dist/tool-call/index.js',
    require: './dist/tool-call/index.cjs',
  })
  assert.deepEqual(manifest.exports['./theme'], {
    types: './dist/theme/index.d.ts',
    import: './dist/theme/index.js',
    require: './dist/theme/index.cjs',
  })
  assert.equal(
    manifest.exports['./auto-complete/style.css'],
    './dist/auto-complete/style.css',
  )
  assert.equal(
    manifest.exports['./button/style.css'],
    './dist/button/style.css',
  )
  assert.equal(
    manifest.exports['./menu/style.css'],
    './dist/menu/style.css',
  )
  assert.equal(
    manifest.exports['./thinking/style.css'],
    './dist/thinking/style.css',
  )
  assert.equal(
    manifest.exports['./tool-call/style.css'],
    './dist/tool-call/style.css',
  )
  assert.equal(manifest.exports['./tokens.css'], './dist/tokens.css')
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

// 保留原发布断言；这里只把文件/声明/清单检查归到同一个 Module。
export async function checkPackageFiles({ packageFiles, check }) {
  await check('tarball contains only the public package files', () => {
    for (const requiredFile of requiredPackageFiles) {
      assert.ok(
        packageFiles.includes(requiredFile),
        `tarball is missing ${requiredFile}`,
      )
    }

    for (const packageFile of packageFiles) {
      assert.ok(
        ['LICENSE', 'README.md', 'package.json'].includes(packageFile) ||
          packageFile.startsWith('dist/'),
        `tarball contains unexpected file ${packageFile}`,
      )
    }
  })
}

// 发布产物采用静态相对引用。从所有公开 JS/类型/CSS 入口出发，
// 递归检查引用与相邻 source map；map 内嵌的 sourcesContent 不属于发布依赖。
async function reachablePackageFiles({ packedRoot, packedManifest, packageFiles }) {
  const available = new Set(packageFiles)
  const visited = new Set(['package.json', 'README.md', 'LICENSE'])
  const exportTargets = (value) => {
    if (typeof value === 'string') return [value]
    if (!value || typeof value !== 'object') return []
    return Object.values(value).flatMap(exportTargets)
  }
  const pending = [
    ...exportTargets(packedManifest.exports),
    packedManifest.main, packedManifest.module, packedManifest.types, packedManifest.style,
  ].filter(Boolean).map(file => file.replace(/^\.\//, ''))

  const resolveDependency = (importer, reference, declaration = false) => {
    const cleanReference = decodeURIComponent(reference.split(/[?#]/)[0])
    const target = posix.normalize(posix.join(posix.dirname(importer), cleanReference))
    assert.ok(target.startsWith('dist/'), 'dependency escapes dist: ' + reference)
    // 声明中的 ./x.js 按 TypeScript 规则指向 ./x.d.ts，而不是运行时 JS。
    const typeTarget = target.replace(/\.(js|mjs|cjs)$/, (_, extension) =>
      ({ js: '.d.ts', mjs: '.d.mts', cjs: '.d.cts' })[extension])
    const candidates = declaration
      ? [typeTarget, target + '.d.ts', posix.join(target, 'index.d.ts'), target]
      : [target]
    const resolved = candidates.find(candidate => available.has(candidate))
    assert.ok(resolved, 'missing package dependency ' + target + ' referenced by ' + importer)
    pending.push(resolved)
  }

  while (pending.length > 0) {
    const file = pending.pop()
    if (visited.has(file)) continue
    assert.ok(available.has(file), 'missing package dependency ' + file)
    visited.add(file)
    const declaration = /\.d\.(ts|mts|cts)$/.test(file)
    const javascript = /\.(js|mjs|cjs)$/.test(file)
    const css = file.endsWith('.css')
    if (!declaration && !javascript && !css) continue

    const source = await readFile(join(packedRoot, file), 'utf8')
    if (javascript || declaration) {
      const info = ts.preProcessFile(source, true, true)
      for (const { fileName } of info.importedFiles) {
        if (fileName.startsWith('.')) resolveDependency(file, fileName, declaration)
      }
      for (const { fileName } of info.referencedFiles) {
        resolveDependency(file, fileName, declaration)
      }
    } else {
      // CSS 的本地 url 也是发布依赖；外部 URL、data URL 和片段引用不属于包文件。
      const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
      const references = [
        ...withoutComments.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/g),
        ...withoutComments.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/g),
      ]
      for (const match of references) {
        const reference = match[1] ?? match[2] ?? match[3]
        if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(reference)) continue
        resolveDependency(file, reference)
      }
    }

    if (javascript || css) {
      const mapName = posix.basename(file) + '.map'
      assert.ok(
        source.includes('sourceMappingURL=' + mapName),
        'missing adjacent sourceMappingURL in ' + file,
      )
      resolveDependency(file, mapName)
    }
  }
  return visited
}

export async function checkPackage({ packedRoot, packedManifest, packageFiles, check }) {
  await check('packed files are reachable from public JS, type, or CSS entries', async () => {
    const reachable = await reachablePackageFiles({ packedRoot, packedManifest, packageFiles })
    const orphans = packageFiles.filter(file => !reachable.has(file))
    assert.deepEqual(orphans, [], 'unreachable package files: ' + orphans.join(', '))
  })

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
    assert.match(readme, /from\s+['"]matthew-ui\/button['"]/)
    assert.match(readme, /import\s+['"]matthew-ui\/tokens\.css['"]/)
    assert.match(
      readme,
      /import\s+['"]matthew-ui\/button\/style\.css['"]/,
    )
    assert.ok(readme.includes(packedManifest.peerDependencies.react))
    assert.ok(readme.includes(packedManifest.engines.node))
    for (const componentName of [
      'Button',
      'Menu',
      'AutoComplete',
      'ThemeProvider',
    ]) {
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
}
