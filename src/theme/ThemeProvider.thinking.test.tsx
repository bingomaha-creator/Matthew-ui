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
function thinkingVariables(style: CSSStyleDeclaration) {
  return Object.fromEntries(Array.from(style)
    .filter(name => name.startsWith('--matthew-ui-thinking-'))
    .map(name => [name, style.getPropertyValue(name)]))
}
// 仅非法输入用例绕过类型，模拟 JS/JSON 调用方；合法配置仍由公开类型约束。
const uncheckedTheme = (Thinking: Record<string, unknown>) =>
  ({ components: { Thinking } }) as unknown as MatthewThemeConfig

const titleColor = '--matthew-ui-thinking-title-color'
const radius = '--matthew-ui-thinking-radius'
const buttonRadius = '--matthew-ui-button-radius'

describe('ThemeProvider Thinking scope', () => {
  test('serializes only configured Thinking fields without component defaults', async () => {
    expect(thinkingVariables(ssrStyle({ components: { Thinking: {
      titleColor: 'black', headerMinHeight: 48,
    } } }))).toEqual({
      [titleColor]: 'black',
      '--matthew-ui-thinking-header-min-height': '3rem',
    })
    expect(thinkingVariables(ssrStyle({}))).toEqual({})
  })

  test('formats decimal dimensions and permits zero radius with the shared rem precision', async () => {
    expect(thinkingVariables(ssrStyle({ components: { Thinking: {
      borderRadius: 0, headerMinHeight: 40.5,
    } } }))).toEqual({
      [radius]: '0rem',
      '--matthew-ui-thinking-header-min-height': '2.53125rem',
    })
  })

  test('merges Thinking fields through nested scopes including empty and undefined children', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: { Thinking: { titleColor: 'black', borderRadius: 8 } } }}>
        <ThemeProvider theme={{ components: { Thinking: { titleColor: 'green', borderRadius: undefined } } }} data-testid="child">
          <ThemeProvider theme={{ components: { Thinking: {} } }} data-testid="empty">
            <ThemeProvider data-testid="omitted">内容</ThemeProvider>
          </ThemeProvider>
        </ThemeProvider>
      </ThemeProvider>,
    )
    for (const id of ['child', 'empty', 'omitted']) {
      expect(thinkingVariables((screen.getByTestId(id).element() as HTMLElement).style)).toEqual({
        [titleColor]: 'green', [radius]: '0.5rem',
      })
    }
  })

  test('keeps Button and Thinking independently when a child configures only one component', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: {
        Button: { borderRadius: 8 }, Thinking: { titleColor: 'black', borderRadius: 6 },
      } }}>
        <ThemeProvider theme={{ components: { Thinking: { titleColor: 'green' } } }} data-testid="thinking-child">Thinking</ThemeProvider>
        <ThemeProvider theme={{ components: { Button: { borderRadius: 16 } } }} data-testid="button-child">Button</ThemeProvider>
      </ThemeProvider>,
    )
    const thinkingStyle = (screen.getByTestId('thinking-child').element() as HTMLElement).style
    const buttonStyle = (screen.getByTestId('button-child').element() as HTMLElement).style
    expect(thinkingVariables(thinkingStyle)).toEqual({ [titleColor]: 'green', [radius]: '0.375rem' })
    expect(thinkingStyle.getPropertyValue(buttonRadius)).toBe('0.5rem')
    expect(thinkingVariables(buttonStyle)).toEqual({ [titleColor]: 'black', [radius]: '0.375rem' })
    expect(buttonStyle.getPropertyValue(buttonRadius)).toBe('1rem')
  })

  test('does not change the 23 global Tokens when Thinking is configured', async () => {
    const configured = ssrStyle({ components: { Thinking: {
      titleColor: 'black', contentColor: 'gray', borderColor: 'blue', headerHoverBackground: 'white',
      runningColor: 'red', completedColor: 'cyan', stoppedColor: 'gray', errorColor: 'red',
      borderRadius: 8, headerMinHeight: 48,
    } } })
    const expectedGlobals = tokensToCssVars(createTokens())
    for (const [name, value] of Object.entries(expectedGlobals)) {
      expect(configured.getPropertyValue(name)).toBe(value)
    }
    expect(Object.keys(expectedGlobals)).toHaveLength(23)
  })

  test('rejects non-string colors with field-specific TypeError', () => {
    const renderWith = (Thinking: Record<string, unknown>) => () =>
      renderToStaticMarkup(<ThemeProvider theme={uncheckedTheme(Thinking)}><span>内容</span></ThemeProvider>)
    for (const field of ['titleColor', 'contentColor', 'borderColor', 'headerHoverBackground']) {
      expect(renderWith({ [field]: 5 })).toThrow(TypeError)
      expect(renderWith({ [field]: 5 })).toThrow(`components.Thinking.${field} must be a CSS string`)
    }
  })

  test('rejects non-numeric dimensions with TypeError and out-of-range values with RangeError', () => {
    const renderWith = (Thinking: Record<string, unknown>) => () =>
      renderToStaticMarkup(<ThemeProvider theme={uncheckedTheme(Thinking)}><span>内容</span></ThemeProvider>)
    for (const field of ['borderRadius', 'headerMinHeight']) {
      expect(renderWith({ [field]: '8px' })).toThrow(TypeError)
      expect(renderWith({ [field]: '8px' })).toThrow(`components.Thinking.${field} must be a number`)
    }
    expect(renderWith({ borderRadius: -1 })).toThrow(RangeError)
    expect(renderWith({ borderRadius: Number.NaN })).toThrow(RangeError)
    expect(renderWith({ headerMinHeight: 0 })).toThrow(RangeError)
    expect(renderWith({ headerMinHeight: Number.POSITIVE_INFINITY })).toThrow(RangeError)
  })

  test('ignores unknown fields instead of serializing them', async () => {
    expect(thinkingVariables(ssrStyle(uncheckedTheme({
      unknownField: 'value', titleColor: 'black',
    }) as MatthewThemeConfig))).toEqual({ [titleColor]: 'black' })
  })
})
