import { renderToStaticMarkup } from 'react-dom/server'
import { render } from 'vitest-browser-react'
import { describe, expect, test } from 'vitest'
import { createTokens, ThemeProvider, tokensToCssVars } from '../index'
import type { MatthewThemeConfig } from '../index'

// 观察真实 Provider 首次 SSR 输出，不通过私有转换函数测试实现细节。
function ssrStyle(theme: MatthewThemeConfig): CSSStyleDeclaration {
  const template = document.createElement('template')
  template.innerHTML = renderToStaticMarkup(
    <ThemeProvider theme={theme}><span>内容</span></ThemeProvider>,
  )
  return (template.content.firstElementChild as HTMLElement).style
}
function toolCallVariables(style: CSSStyleDeclaration) {
  return Object.fromEntries(Array.from(style)
    .filter(name => name.startsWith('--matthew-ui-tool-call-'))
    .map(name => [name, style.getPropertyValue(name)]))
}
function taskListVariables(style: CSSStyleDeclaration) {
  return Object.fromEntries(Array.from(style)
    .filter(name => name.startsWith('--matthew-ui-task-list-'))
    .map(name => [name, style.getPropertyValue(name)]))
}
// 仅非法输入用例绕过类型，模拟 JS/JSON 调用方；合法配置仍由公开类型约束。
const uncheckedTheme = (TaskList: Record<string, unknown>) =>
  ({ components: { TaskList } }) as unknown as MatthewThemeConfig

const titleColor = '--matthew-ui-task-list-title-color'
const radius = '--matthew-ui-task-list-radius'

describe('ThemeProvider TaskList scope', () => {
  test('serializes only configured TaskList fields without component defaults', async () => {
    expect(taskListVariables(ssrStyle({ components: { TaskList: {
      titleColor: 'black', headerMinHeight: 40,
    } } }))).toEqual({
      [titleColor]: 'black',
      '--matthew-ui-task-list-header-min-height': '2.5rem',
    })
    expect(taskListVariables(ssrStyle({}))).toEqual({})
  })

  test('formats decimal dimensions and permits zero radius with the shared rem precision', async () => {
    expect(taskListVariables(ssrStyle({ components: { TaskList: {
      borderRadius: 0, headerMinHeight: 40.5, itemMinHeight: 34.5,
    } } }))).toEqual({
      [radius]: '0rem',
      '--matthew-ui-task-list-header-min-height': '2.53125rem',
      '--matthew-ui-task-list-item-min-height': '2.15625rem',
    })
  })

  test('merges TaskList fields through nested scopes including empty and undefined children', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: { TaskList: { titleColor: 'black', borderRadius: 8 } } }}>
        <ThemeProvider theme={{ components: { TaskList: { titleColor: 'green', borderRadius: undefined } } }} data-testid="child">
          <ThemeProvider theme={{ components: { TaskList: {} } }} data-testid="empty">
            <ThemeProvider data-testid="omitted">内容</ThemeProvider>
          </ThemeProvider>
        </ThemeProvider>
      </ThemeProvider>,
    )
    for (const id of ['child', 'empty', 'omitted']) {
      expect(taskListVariables((screen.getByTestId(id).element() as HTMLElement).style)).toEqual({
        [titleColor]: 'green', [radius]: '0.5rem',
      })
    }
  })

  test('keeps ToolCall and TaskList independently when a child configures only one component', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: {
        ToolCall: { nameColor: 'black' }, TaskList: { titleColor: 'black', borderRadius: 6 },
      } }}>
        <ThemeProvider theme={{ components: { TaskList: { titleColor: 'green' } } }} data-testid="tasklist-child">TaskList</ThemeProvider>
        <ThemeProvider theme={{ components: { ToolCall: { nameColor: 'green' } } }} data-testid="toolcall-child">ToolCall</ThemeProvider>
      </ThemeProvider>,
    )
    const taskListStyle = (screen.getByTestId('tasklist-child').element() as HTMLElement).style
    const toolCallStyle = (screen.getByTestId('toolcall-child').element() as HTMLElement).style
    expect(taskListVariables(taskListStyle)).toEqual({
      [titleColor]: 'green', [radius]: '0.375rem',
    })
    expect(taskListStyle.getPropertyValue('--matthew-ui-tool-call-name-color')).toBe('black')
    expect(toolCallVariables(toolCallStyle)).toEqual({
      '--matthew-ui-tool-call-name-color': 'green',
    })
    expect(toolCallStyle.getPropertyValue(titleColor)).toBe('black')
    expect(toolCallStyle.getPropertyValue(radius)).toBe('0.375rem')
  })

  test('does not change the 23 global Tokens when TaskList is configured', async () => {
    const configured = ssrStyle({ components: { TaskList: {
      background: 'white', borderColor: 'blue', titleColor: 'black', progressColor: 'gray',
      itemColor: 'black', summaryColor: 'gray', headerHoverBackground: 'white',
      pendingColor: 'gray', runningColor: 'red', completedColor: 'cyan',
      errorColor: 'red', stoppedColor: 'gray', borderRadius: 8,
      headerMinHeight: 40, itemMinHeight: 34,
    } } })
    const expectedGlobals = tokensToCssVars(createTokens())
    for (const [name, value] of Object.entries(expectedGlobals)) {
      expect(configured.getPropertyValue(name)).toBe(value)
    }
    expect(Object.keys(expectedGlobals)).toHaveLength(23)
  })

  test('rejects non-string colors with field-specific TypeError', () => {
    const renderWith = (TaskList: Record<string, unknown>) => () =>
      renderToStaticMarkup(<ThemeProvider theme={uncheckedTheme(TaskList)}><span>内容</span></ThemeProvider>)
    for (const field of ['background', 'titleColor', 'progressColor', 'headerHoverBackground']) {
      expect(renderWith({ [field]: 5 })).toThrow(TypeError)
      expect(renderWith({ [field]: 5 })).toThrow(`components.TaskList.${field} must be a CSS string`)
    }
  })

  test('rejects non-numeric dimensions with TypeError and out-of-range values with RangeError', () => {
    const renderWith = (TaskList: Record<string, unknown>) => () =>
      renderToStaticMarkup(<ThemeProvider theme={uncheckedTheme(TaskList)}><span>内容</span></ThemeProvider>)
    for (const field of ['borderRadius', 'headerMinHeight', 'itemMinHeight']) {
      expect(renderWith({ [field]: '8px' })).toThrow(TypeError)
      expect(renderWith({ [field]: '8px' })).toThrow(`components.TaskList.${field} must be a number`)
    }
    expect(renderWith({ borderRadius: -1 })).toThrow(RangeError)
    expect(renderWith({ borderRadius: Number.NaN })).toThrow(RangeError)
    expect(renderWith({ headerMinHeight: 0 })).toThrow(RangeError)
    expect(renderWith({ itemMinHeight: 0 })).toThrow(RangeError)
    expect(renderWith({ headerMinHeight: Number.POSITIVE_INFINITY })).toThrow(RangeError)
    expect(renderWith({ borderRadius: 0 })).not.toThrow()
  })

  test('ignores unknown fields instead of serializing them', async () => {
    expect(taskListVariables(ssrStyle(({
      components: { TaskList: { unknownField: 'value', titleColor: 'black' } },
    }) as unknown as MatthewThemeConfig))).toEqual({ [titleColor]: 'black' })
  })
})
