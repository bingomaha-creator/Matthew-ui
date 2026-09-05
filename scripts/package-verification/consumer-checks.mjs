import assert from 'node:assert/strict'
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { checkBrowserStyles, checkMenuBrowserStyles, checkAutoCompleteBrowserStyles, checkThinkingBrowserStyles } from './style-checks.mjs'

const writeJson = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`)

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
  // Fixture 是独立消费项目源码：原样复制后，仍由该项目自己的依赖与 tsc 验证。
  await cp(new URL('./fixtures/', import.meta.url), directory, { recursive: true })
}

const readBuildOutput = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await readBuildOutput(path))
    } else {
      files.push({ path, source: await readFile(path, 'utf8') })
    }
  }

  return files
}

export async function checkConsumers({
  temporaryDirectory, tarballPath, npmCommand, run, check,
}) {
  const buildViteScenario = async (consumerDirectory, scenario) => {
    await run(
      npmCommand,
      ['exec', '--', 'vite', 'build', '--config', 'vite.config.mjs'],
      {
        cwd: consumerDirectory,
        env: { MATTHEW_UI_SCENARIO: scenario },
      },
    )

    return readBuildOutput(join(consumerDirectory, 'vite-dist', scenario))
  }

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
            'vite@7.3.6',
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
    await check(`${consumer.label} Chromium preserves default and configured full/on-demand Button styles`, async () => {
      const markup = await run('node', ['style-markup.mjs'], { cwd: consumerDirectory })
      const configuredMarkup = await run('node', ['style-markup.mjs', '--configured'], { cwd: consumerDirectory })
      await checkBrowserStyles({
        packageRoot: join(consumerDirectory, 'node_modules/matthew-ui'),
        markup,
        configuredMarkup,
      })
    })
    await check(`${consumer.label} Chromium preserves mounted full/on-demand Menu styles`, () =>
      checkMenuBrowserStyles({
        packageRoot: join(consumerDirectory, 'node_modules/matthew-ui'),
        consumerDirectory,
      }),
    )
    await check(`${consumer.label} Chromium preserves mounted full/on-demand AutoComplete styles`, () =>
      checkAutoCompleteBrowserStyles({
        packageRoot: join(consumerDirectory, 'node_modules/matthew-ui'),
        consumerDirectory,
      }),
    )
    await check(`${consumer.label} Chromium preserves mounted full/on-demand Thinking styles`, () =>
      checkThinkingBrowserStyles({
        packageRoot: join(consumerDirectory, 'node_modules/matthew-ui'),
        consumerDirectory,
      }),
    )
    await check(`${consumer.label} Vite build preserves on-demand JS and CSS`, async () => {
      for (const scenario of ['subpath-button', 'root-button']) {
        const output = await buildViteScenario(consumerDirectory, scenario)
        const javascript = output
          .filter(({ path }) => path.endsWith('.js'))
          .map(({ source }) => source)
          .join('\n')
        const cssFiles = output.filter(({ path }) => path.endsWith('.css'))

        assert.match(javascript, /matthew-button/)
        assert.doesNotMatch(javascript, /matthew-menu/)
        assert.doesNotMatch(javascript, /matthew-auto-complete/)
        assert.doesNotMatch(javascript, /matthew-thinking/)
        assert.equal(cssFiles.length, 0, `${scenario} emitted implicit CSS`)
      }

      const themeOutput = await buildViteScenario(
        consumerDirectory,
        'theme-only',
      )
      const themeJavascript = themeOutput
        .filter(({ path }) => path.endsWith('.js'))
        .map(({ source }) => source)
        .join('\n')

      assert.doesNotMatch(
        themeJavascript,
        /matthew-(?:button|menu|auto-complete|thinking)/,
      )
      assert.equal(
        themeOutput.filter(({ path }) => path.endsWith('.css')).length,
        0,
        'theme-only emitted implicit CSS',
      )

      const styleOutput = await buildViteScenario(
        consumerDirectory,
        'button-css',
      )
      const css = styleOutput
        .filter(({ path }) => path.endsWith('.css'))
        .map(({ source }) => source)
        .join('\n')

      assert.equal((css.match(/:root\s*\{/g) ?? []).length, 1)
      assert.match(css, /\.matthew-button/)
      assert.doesNotMatch(css, /\.matthew-menu/)
      assert.doesNotMatch(css, /\.matthew-auto-complete/)
      assert.doesNotMatch(css, /\.matthew-thinking/)
    })
  }
}
