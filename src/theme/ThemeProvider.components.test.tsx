import { renderToStaticMarkup } from 'react-dom/server'
import type { CSSProperties } from 'react'
import { render } from 'vitest-browser-react'
import { describe, expect, test } from 'vitest'
import { darkTheme, lightTheme, ThemeProvider } from '../index'
import type { MatthewThemeConfig } from '../index'

// 穿过真实 Provider 的 SSR seam，既观察初始 HTML，也避免错误输入依赖 React 错误边界。
function ssrStyle(theme: MatthewThemeConfig): CSSStyleDeclaration {
  const html = renderToStaticMarkup(
    <ThemeProvider theme={theme}><span>内容</span></ThemeProvider>,
  )
  const template = document.createElement('template')
  template.innerHTML = html
  return (template.content.firstElementChild as HTMLElement).style
}

function buttonVariables(style: CSSStyleDeclaration) {
  return Object.fromEntries(Array.from(style)
    .filter(name => name.startsWith('--matthew-ui-button-'))
    .map(name => [name, style.getPropertyValue(name)]))
}

// 仅错误输入测试绕过类型，模拟 JS/JSON 调用方。正常用例必须通过公开类型检查。
const uncheckedTheme = (Button: Record<string, unknown>) =>
  ({ components: { Button } }) as unknown as MatthewThemeConfig


describe('ThemeProvider Button scope', () => {
  const radius = '--matthew-ui-button-radius'
  const background = '--matthew-ui-button-background'

  test('merges fields through nested scopes, including empty and undefined child fields', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: { Button: { borderRadius: 8, background: '#166534' } } }}>
        <ThemeProvider
          theme={{ components: { Button: { borderRadius: undefined, background: '#14532d' } } }}
          data-testid="child"
        >
          <ThemeProvider theme={{ components: { Button: {} } }} data-testid="empty">
            <ThemeProvider data-testid="omitted">内容</ThemeProvider>
          </ThemeProvider>
        </ThemeProvider>
      </ThemeProvider>,
    )
    for (const id of ['child', 'empty', 'omitted']) {
      expect(buttonVariables((screen.getByTestId(id).element() as HTMLElement).style)).toEqual({
        [radius]: '0.5rem', [background]: '#14532d',
      })
    }
  })

  test('lets configured fields own wrapper variables while preserving unconfigured style values', async () => {
    const style = {
      [radius]: '999px', '--matthew-ui-button-color': 'purple', padding: 16,
    } as CSSProperties
    const screen = await render(
      <ThemeProvider
        theme={{ components: { Button: { borderRadius: 8 } } }}
        style={style} data-testid="scope" className="custom-scope"
      >内容</ThemeProvider>,
    )
    const element = screen.getByTestId('scope').element() as HTMLElement
    expect(buttonVariables(element.style)).toEqual({
      [radius]: '0.5rem', '--matthew-ui-button-color': 'purple',
    })
    expect(element.style.padding).toBe('16px')
    expect(element.className).toBe('custom-scope')
  })

  test('supports descendant overrides and isolates siblings without touching document root', async () => {
    const before = document.documentElement.style.cssText
    const screen = await render(
      <div>
        <ThemeProvider theme={{ components: { Button: { borderRadius: 8 } } }}>
          <span data-testid="inherited">继承</span>
          <span data-testid="local" style={{ [radius]: '999px' } as CSSProperties}>局部</span>
        </ThemeProvider>
        <ThemeProvider theme={{ components: { Button: { borderRadius: 16 } } }}>
          <span data-testid="sibling">兄弟</span>
        </ThemeProvider>
        <span data-testid="outside">外部</span>
      </div>,
    )
    const value = (id: string) => getComputedStyle(screen.getByTestId(id).element()).getPropertyValue(radius)
    expect(value('inherited')).toBe('0.5rem')
    expect(value('local')).toBe('999px')
    expect(value('sibling')).toBe('1rem')
    expect(value('outside')).toBe('')
    expect(document.documentElement.style.cssText).toBe(before)
  })

  test('updates and removes root configuration without mutating inputs or retaining stale variables', async () => {
    const first: MatthewThemeConfig = {
      components: { Button: { borderRadius: 8, background: '#166534' } },
    }
    const next: MatthewThemeConfig = {
      components: { Button: { borderRadius: 16, background: undefined } },
    }
    const snapshots = [structuredClone(first), structuredClone(next)]
    const view = (theme: MatthewThemeConfig) =>
      <ThemeProvider theme={theme} data-testid="scope">内容</ThemeProvider>
    const screen = await render(view(first))
    const element = screen.getByTestId('scope').element() as HTMLElement
    expect(buttonVariables(element.style)).toEqual({ [radius]: '0.5rem', [background]: '#166534' })
    await screen.rerender(view(next))
    expect(screen.getByTestId('scope').element()).toBe(element)
    expect(buttonVariables(element.style)).toEqual({ [radius]: '1rem' })
    await screen.rerender(view({}))
    expect(buttonVariables(element.style)).toEqual({})
    expect([first, next]).toEqual(snapshots)
  })

  test('restores parent values when child fields are removed and follows subsequent parent updates', async () => {
    const view = (parent: MatthewThemeConfig, child: MatthewThemeConfig) => (
      <ThemeProvider theme={parent}>
        <ThemeProvider theme={child} data-testid="child">内容</ThemeProvider>
      </ThemeProvider>
    )
    const parent: MatthewThemeConfig = { components: { Button: { borderRadius: 8 } } }
    const screen = await render(view(parent, { components: { Button: { borderRadius: 16 } } }))
    const style = (screen.getByTestId('child').element() as HTMLElement).style
    expect(style.getPropertyValue(radius)).toBe('1rem')
    await screen.rerender(view(parent, { components: { Button: { borderRadius: undefined } } }))
    expect(style.getPropertyValue(radius)).toBe('0.5rem')
    await screen.rerender(view({ components: { Button: { borderRadius: 24 } } }, {}))
    expect(style.getPropertyValue(radius)).toBe('1.5rem')
    await screen.rerender(view({}, {}))
    expect(style.getPropertyValue(radius)).toBe('')
  })

  test('preserves explicit Button overrides across nested dark and light presets', async () => {
    const view = (preset: MatthewThemeConfig) => (
      <ThemeProvider theme={{ components: { Button: { background: '#166534' } } }}>
        <ThemeProvider theme={preset} data-testid="preset">内容</ThemeProvider>
      </ThemeProvider>
    )
    const screen = await render(view(darkTheme))
    const style = (screen.getByTestId('preset').element() as HTMLElement).style
    expect(style.getPropertyValue(background)).toBe('#166534')
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe('#1e293b')
    await screen.rerender(view(lightTheme))
    expect(style.getPropertyValue(background)).toBe('#166534')
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe('#ffffff')
  })

  test('inherits manual ancestor CSS and restores wrapper style after removing configuration', async () => {
    const view = (theme: MatthewThemeConfig) => (
      <div className="batch4a-outer">
        <style>{'.batch4a-outer { --matthew-ui-button-background: #166534; }'}</style>
        <ThemeProvider
          theme={theme} style={{ [radius]: '999px' } as CSSProperties}
          data-testid="scope"
        ><span data-testid="descendant">内容</span></ThemeProvider>
      </div>
    )
    const screen = await render(view({ components: { Button: { borderRadius: 8 } } }))
    const element = screen.getByTestId('scope').element() as HTMLElement
    expect(element.style.getPropertyValue(background)).toBe('')
    expect(getComputedStyle(screen.getByTestId('descendant').element()).getPropertyValue(background).trim()).toBe('#166534')
    expect(element.style.getPropertyValue(radius)).toBe('0.5rem')
    await screen.rerender(view({}))
    expect(element.style.getPropertyValue(radius)).toBe('999px')
  })

  test('merges explicit overrides into SSR output before any client effects run', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider theme={{ components: { Button: { borderRadius: 8 } } }}>
        <ThemeProvider theme={{ components: { Button: { color: 'white' } } }} data-ssr-child="">
          内容
        </ThemeProvider>
      </ThemeProvider>,
    )
    const template = document.createElement('template')
    template.innerHTML = html
    const child = template.content.querySelector('[data-ssr-child]') as HTMLElement
    expect(buttonVariables(child.style)).toEqual({
      [radius]: '0.5rem', '--matthew-ui-button-color': 'white',
    })
  })
})
describe('ThemeProvider Button configuration', () => {
  test('renders all ten explicit Button values in SSR without changing global defaults', () => {
    const style = ssrStyle({ components: { Button: {
      background: '#166534',
      backgroundHover: 'rgb(20 83 45)',
      backgroundActive: 'var(--custom-active)',
      color: 'white',
      borderColor: 'oklch(60% 0.2 150)',
      borderRadius: 8,
      minHeight: 48,
      fontSize: 16,
      paddingBlock: 6,
      paddingInline: 12,
    } } })
    expect(buttonVariables(style)).toEqual({
      '--matthew-ui-button-background': '#166534',
      '--matthew-ui-button-background-hover': 'rgb(20 83 45)',
      '--matthew-ui-button-background-active': 'var(--custom-active)',
      '--matthew-ui-button-color': 'white',
      '--matthew-ui-button-border-color': 'oklch(60% 0.2 150)',
      '--matthew-ui-button-radius': '0.5rem',
      '--matthew-ui-button-min-height': '3rem',
      '--matthew-ui-button-font-size': '1rem',
      '--matthew-ui-button-padding-block': '0.375rem',
      '--matthew-ui-button-padding-inline': '0.75rem',
    })
    expect(style.length).toBe(33)
    expect(style.getPropertyValue('--matthew-ui-control-height-md')).toBe('2.5rem')
    expect(style.getPropertyValue('--matthew-ui-color-primary')).toBe('#2563eb')
  })

  test('does not populate unspecified component defaults or derive other colors', () => {
    expect(buttonVariables(ssrStyle({}))).toEqual({})
    expect(buttonVariables(ssrStyle({ components: { Button: {} } }))).toEqual({})
    expect(buttonVariables(ssrStyle({
      components: { Button: { background: '#166534' } },
    }))).toEqual({ '--matthew-ui-button-background': '#166534' })
  })

  test('formats decimal dimensions and zero using the existing design-unit convention', () => {
    const style = ssrStyle({ components: { Button: {
      borderRadius: -0,
      minHeight: 33.333333,
      fontSize: 14.5,
      paddingBlock: 0,
      paddingInline: 1e-7,
    } } })
    expect(buttonVariables(style)).toEqual({
      '--matthew-ui-button-radius': '0rem',
      '--matthew-ui-button-min-height': '2.083333rem',
      '--matthew-ui-button-font-size': '0.90625rem',
      '--matthew-ui-button-padding-block': '0rem',
      '--matthew-ui-button-padding-inline': '0rem',
    })
  })

  test('rejects non-numeric dimension fields with TypeError', () => {
    for (const field of ['borderRadius', 'minHeight', 'fontSize', 'paddingBlock', 'paddingInline']) {
      for (const value of ['8px', null, true]) {
        expect(() => ssrStyle(uncheckedTheme({ [field]: value })), field).toThrow(TypeError)
      }
    }
  })

  test('rejects non-finite or negative dimensions and zero height/font size', () => {
    for (const field of ['borderRadius', 'minHeight', 'fontSize', 'paddingBlock', 'paddingInline']) {
      for (const value of [NaN, Infinity, -Infinity, -1]) {
        expect(() => ssrStyle(uncheckedTheme({ [field]: value })), field).toThrow(RangeError)
      }
    }
    for (const field of ['minHeight', 'fontSize']) {
      expect(() => ssrStyle(uncheckedTheme({ [field]: 0 })), field).toThrow(RangeError)
    }
  })

  test('rejects non-string colors with TypeError without validating CSS color grammar', () => {
    for (const field of ['background', 'backgroundHover', 'backgroundActive', 'color', 'borderColor']) {
      for (const value of [123, null, false]) {
        expect(() => ssrStyle(uncheckedTheme({ [field]: value })), field).toThrow(TypeError)
      }
    }
    expect(() => ssrStyle(uncheckedTheme({ color: 'not-a-color' }))).not.toThrow()
  })
})
