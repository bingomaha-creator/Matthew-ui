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
// 仅非法输入用例绕过类型，模拟 JS/JSON 调用方；合法配置仍由公开类型约束。
const uncheckedTheme = (ToolCall: Record<string, unknown>) =>
  ({ components: { ToolCall } }) as unknown as MatthewThemeConfig

const nameColor = '--matthew-ui-tool-call-name-color'
const radius = '--matthew-ui-tool-call-radius'

describe('ThemeProvider ToolCall scope', () => {
  test('serializes only configured ToolCall fields without component defaults', async () => {
    expect(toolCallVariables(ssrStyle({ components: { ToolCall: {
      nameColor: 'black', headerMinHeight: 32,
    } } }))).toEqual({
      [nameColor]: 'black',
      '--matthew-ui-tool-call-header-min-height': '2rem',
    })
    expect(toolCallVariables(ssrStyle({}))).toEqual({})
  })

  test('formats decimal dimensions and permits zero radius with the shared rem precision', async () => {
    expect(toolCallVariables(ssrStyle({ components: { ToolCall: {
      borderRadius: 0, headerMinHeight: 32.5,
    } } }))).toEqual({
      [radius]: '0rem',
      '--matthew-ui-tool-call-header-min-height': '2.03125rem',
    })
  })

  test('merges ToolCall fields through nested scopes including empty and undefined children', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: { ToolCall: { nameColor: 'black', borderRadius: 8 } } }}>
        <ThemeProvider theme={{ components: { ToolCall: { nameColor: 'green', borderRadius: undefined } } }} data-testid="child">
          <ThemeProvider theme={{ components: { ToolCall: {} } }} data-testid="empty">
            <ThemeProvider data-testid="omitted">内容</ThemeProvider>
          </ThemeProvider>
        </ThemeProvider>
      </ThemeProvider>,
    )
    for (const id of ['child', 'empty', 'omitted']) {
      expect(toolCallVariables((screen.getByTestId(id).element() as HTMLElement).style)).toEqual({
        [nameColor]: 'green', [radius]: '0.5rem',
      })
    }
  })

  test('keeps Thinking and ToolCall independently when a child configures only one component', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: {
        Thinking: { titleColor: 'black' }, ToolCall: { nameColor: 'black', borderRadius: 6 },
      } }}>
        <ThemeProvider theme={{ components: { ToolCall: { nameColor: 'green' } } }} data-testid="toolcall-child">ToolCall</ThemeProvider>
        <ThemeProvider theme={{ components: { Thinking: { titleColor: 'green' } } }} data-testid="thinking-child">Thinking</ThemeProvider>
      </ThemeProvider>,
    )
    const toolCallStyle = (screen.getByTestId('toolcall-child').element() as HTMLElement).style
    const thinkingStyle = (screen.getByTestId('thinking-child').element() as HTMLElement).style
    expect(toolCallVariables(toolCallStyle)).toEqual({ [nameColor]: 'green', [radius]: '0.375rem' })
    expect(toolCallStyle.getPropertyValue('--matthew-ui-thinking-title-color')).toBe('black')
    // thinking-child 只改 Thinking，但按字段继承父层的 ToolCall 配置。
    expect(toolCallVariables(thinkingStyle)).toEqual({
      [nameColor]: 'black', [radius]: '0.375rem',
    })
    expect(thinkingStyle.getPropertyValue('--matthew-ui-thinking-title-color')).toBe('green')
  })

  test('does not change the 23 global Tokens when ToolCall is configured', async () => {
    const configured = ssrStyle({ components: { ToolCall: {
      nameColor: 'black', summaryColor: 'gray', detailColor: 'gray', borderColor: 'blue',
      headerHoverBackground: 'white', pendingColor: 'gray', runningColor: 'red',
      completedColor: 'cyan', errorColor: 'red', stoppedColor: 'gray',
      borderRadius: 8, headerMinHeight: 32,
    } } })
    const expectedGlobals = tokensToCssVars(createTokens())
    for (const [name, value] of Object.entries(expectedGlobals)) {
      expect(configured.getPropertyValue(name)).toBe(value)
    }
    expect(Object.keys(expectedGlobals)).toHaveLength(23)
  })

  test('rejects non-string colors with field-specific TypeError', () => {
    const renderWith = (ToolCall: Record<string, unknown>) => () =>
      renderToStaticMarkup(<ThemeProvider theme={uncheckedTheme(ToolCall)}><span>内容</span></ThemeProvider>)
    for (const field of ['nameColor', 'detailColor', 'headerHoverBackground']) {
      expect(renderWith({ [field]: 5 })).toThrow(TypeError)
      expect(renderWith({ [field]: 5 })).toThrow(`components.ToolCall.${field} must be a CSS string`)
    }
  })

  test('rejects non-numeric dimensions with TypeError and out-of-range values with RangeError', () => {
    const renderWith = (ToolCall: Record<string, unknown>) => () =>
      renderToStaticMarkup(<ThemeProvider theme={uncheckedTheme(ToolCall)}><span>内容</span></ThemeProvider>)
    for (const field of ['borderRadius', 'headerMinHeight']) {
      expect(renderWith({ [field]: '8px' })).toThrow(TypeError)
      expect(renderWith({ [field]: '8px' })).toThrow(`components.ToolCall.${field} must be a number`)
    }
    expect(renderWith({ borderRadius: -1 })).toThrow(RangeError)
    expect(renderWith({ borderRadius: Number.NaN })).toThrow(RangeError)
    expect(renderWith({ headerMinHeight: 0 })).toThrow(RangeError)
    expect(renderWith({ headerMinHeight: Number.POSITIVE_INFINITY })).toThrow(RangeError)
    expect(renderWith({ borderRadius: 0 })).not.toThrow()
  })

  test('ignores unknown fields instead of serializing them', async () => {
    expect(toolCallVariables(ssrStyle(({
      components: { ToolCall: { unknownField: 'value', nameColor: 'black' } },
    }) as unknown as MatthewThemeConfig))).toEqual({ [nameColor]: 'black' })
  })
})
