import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { compile, compileString } from 'sass'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const distDirectory = join(projectRoot, 'dist')

const toPosixPath = (path) => path.split(sep).join('/')

/**
 * Sass JS API 默认把 file:// 绝对地址写入 map。发布包不应暴露构建机路径，
 * 所以这里统一转换为从产物目录出发的相对 POSIX 路径。
 */
function normalizeSourceMap(sourceMap, outputPath) {
  const outputDirectory = dirname(outputPath)

  return {
    ...sourceMap,
    file: outputPath.split(sep).at(-1),
    sources: sourceMap.sources.map((source) => {
      if (!source.startsWith('file:')) {
        return source
      }

      return toPosixPath(relative(outputDirectory, fileURLToPath(source)))
    }),
  }
}

async function writeCompilation(outputPath, result, extraMapFields = {}) {
  const mapPath = `${outputPath}.map`
  const map = {
    ...normalizeSourceMap(result.sourceMap, outputPath),
    ...extraMapFields,
  }
  const css = `${result.css.trimEnd()}\n/*# sourceMappingURL=${outputPath
    .split(sep)
    .at(-1)}.map */\n`

  await mkdir(dirname(outputPath), { recursive: true })
  await Promise.all([
    writeFile(outputPath, css),
    writeFile(mapPath, JSON.stringify(map)),
  ])
}

const themeEntry = pathToFileURL(join(distDirectory, 'theme/index.js')).href
const { createTokens, lightTheme, tokensToCssVars } = await import(themeEntry)
const defaultVariables = tokensToCssVars(createTokens(lightTheme))
const tokenAdapterSource = [
  '/* Generated from src/theme/tokens.ts through the public Theme API. */',
  ':root {',
  ...Object.entries(defaultVariables).map(
    ([name, value]) => `  ${name}: ${value};`,
  ),
  '}',
].join('\n')
const tokenResult = compileString(tokenAdapterSource, {
  sourceMap: true,
  sourceMapIncludeSources: true,
  style: 'compressed',
  url: pathToFileURL(
    join(projectRoot, 'src/theme/__generated_tokens__.scss'),
  ),
})

await writeCompilation(join(distDirectory, 'tokens.css'), tokenResult, {
  x_matthewUiGeneratedFrom: '../src/theme/tokens.ts',
})

const componentStyleEntries = [
  ['Button/Button.scss', 'button/style.css'],
  ['Menu/Menu.scss', 'menu/style.css'],
  ['AutoComplete/AutoComplete.scss', 'auto-complete/style.css'],
  ['Thinking/Thinking.scss', 'thinking/style.css'],
  ['ToolCall/ToolCall.scss', 'tool-call/style.css'],
  ['TaskList/TaskList.scss', 'task-list/style.css'],
]

for (const [source, output] of componentStyleEntries) {
  const result = compile(join(projectRoot, 'src/components', source), {
    sourceMap: true,
    sourceMapIncludeSources: true,
    style: 'compressed',
  })

  await writeCompilation(join(distDirectory, output), result)
}

// Sass 的 @use 必须位于其他规则之前，所以先引入各组件源码，
// 再追加与 tokens.css 共用的生成 :root。全量包因此不再读取 _tokens.scss。
const globalAdapterSource = [
  '@use "src/components/Button/Button";',
  '@use "src/components/Menu/Menu";',
  '@use "src/components/AutoComplete/AutoComplete";',
  '@use "src/components/Thinking/Thinking";',
  '@use "src/components/ToolCall/ToolCall";',
  '@use "src/components/TaskList/TaskList";',
  tokenAdapterSource,
].join('\n')
const globalResult = compileString(globalAdapterSource, {
  loadPaths: [projectRoot],
  sourceMap: true,
  sourceMapIncludeSources: true,
  style: 'compressed',
  url: pathToFileURL(
    join(projectRoot, 'src/styles/__generated_styles__.scss'),
  ),
})

await writeCompilation(join(distDirectory, 'styles.css'), globalResult, {
  x_matthewUiGeneratedFrom: '../src/theme/tokens.ts',
})
