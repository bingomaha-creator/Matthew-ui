import { renderToStaticMarkup } from 'react-dom/server'
import type { CSSProperties } from 'react'
import { render } from 'vitest-browser-react'
import { describe, expect, test } from 'vitest'
import { createTokens, darkTheme, lightTheme, ThemeProvider, tokensToCssVars } from '../index'
import type { MatthewThemeConfig } from '../index'

// 通过公开Provider的SSR输出观察变量，不直接调用私有序列化函数。
function ssrStyle(theme: MatthewThemeConfig): CSSStyleDeclaration {
  const template = document.createElement('template')
  template.innerHTML = renderToStaticMarkup(<ThemeProvider theme={theme}>内容</ThemeProvider>)
  return (template.content.firstElementChild as HTMLElement).style
}
function variables(style: CSSStyleDeclaration) {
  return Object.fromEntries(Array.from(style)
    .filter(name => name.startsWith('--matthew-ui-auto-complete-'))
    .map(name => [name, style.getPropertyValue(name)]))
}
// 仅非法输入绕过类型，用于模拟JS调用；合法配置保持公开类型检查。
const unchecked = (AutoComplete: Record<string, unknown>) =>
  ({ components: { AutoComplete } }) as unknown as MatthewThemeConfig
const dimensions = ['fontSize', 'inputMinHeight', 'inputBorderRadius', 'inputPaddingBlock',
  'inputPaddingInline', 'optionBorderRadius', 'optionPaddingBlock', 'optionPaddingInline']

describe('ThemeProvider AutoComplete scope', () => {
  const radius = '--matthew-ui-auto-complete-input-radius'
  const color = '--matthew-ui-auto-complete-input-color'
  const buttonRadius = '--matthew-ui-button-radius'

  test('merges AutoComplete fields through nested scopes including empty and undefined children', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: { AutoComplete: { inputColor: 'black', inputBorderRadius: 8 } } }}>
        <ThemeProvider theme={{ components: { AutoComplete: { inputColor: 'green', inputBorderRadius: undefined } } }} data-testid="child">
          <ThemeProvider theme={{ components: { AutoComplete: {} } }} data-testid="empty">
            <ThemeProvider data-testid="omitted">内容</ThemeProvider>
          </ThemeProvider>
        </ThemeProvider>
      </ThemeProvider>,
    )
    for (const id of ['child', 'empty', 'omitted']) {
      expect(variables((screen.getByTestId(id).element() as HTMLElement).style)).toEqual({
        [color]: 'green', [radius]: '0.5rem',
      })
    }
  })

  test('keeps all three components when a child configures only one', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: {
        Button: { borderRadius: 8 }, Menu: { itemBorderRadius: 12 },
        AutoComplete: { inputColor: 'black', inputBorderRadius: 6 },
      } }}>
        <ThemeProvider theme={{ components: { AutoComplete: { inputColor: 'green' } } }} data-testid="auto-child">AutoComplete</ThemeProvider>
        <ThemeProvider theme={{ components: { Button: { borderRadius: 16 } } }} data-testid="button-child">Button</ThemeProvider>
        <ThemeProvider theme={{ components: { Menu: { itemBorderRadius: 24 } } }} data-testid="menu-child">Menu</ThemeProvider>
      </ThemeProvider>,
    )
    for (const [id, expectedColor, expectedButton, expectedMenu] of [
      ['auto-child', 'green', '0.5rem', '0.75rem'],
      ['button-child', 'black', '1rem', '0.75rem'],
      ['menu-child', 'black', '0.5rem', '1.5rem'],
    ]) {
      const style = (screen.getByTestId(id).element() as HTMLElement).style
      expect(variables(style)).toEqual({ [color]: expectedColor, [radius]: '0.375rem' })
      expect(style.getPropertyValue(buttonRadius)).toBe(expectedButton)
      expect(style.getPropertyValue('--matthew-ui-menu-item-radius')).toBe(expectedMenu)
    }
  })

  test('prioritizes configured wrapper variables and restores style values when removed', async () => {
    const view = (theme: MatthewThemeConfig) => (
      <ThemeProvider theme={theme} data-testid="scope" className="custom-search-scope"
        aria-label="搜索主题" style={{ [radius]: '999px', [color]: 'purple', padding: 16 } as CSSProperties}
      >内容</ThemeProvider>
    )
    const screen = await render(view({ components: { AutoComplete: { inputBorderRadius: 8 } } }))
    const element = screen.getByTestId('scope').element() as HTMLElement
    expect(variables(element.style)).toEqual({ [radius]: '0.5rem', [color]: 'purple' })
    expect(element.style.padding).toBe('16px')
    expect(element.className).toBe('custom-search-scope')
    expect(element.getAttribute('aria-label')).toBe('搜索主题')
    await screen.rerender(view({}))
    expect(variables(element.style)).toEqual({ [radius]: '999px', [color]: 'purple' })
  })

  test('inherits ancestor CSS, permits local exceptions and isolates siblings without touching root', async () => {
    const before = document.documentElement.style.cssText
    const screen = await render(
      <div>
        <div className="batch6a-auto-complete-region">
          <style>{'.batch6a-auto-complete-region { --matthew-ui-auto-complete-input-color: green; }'}</style>
          <ThemeProvider theme={{ ...darkTheme, components: { AutoComplete: { inputBorderRadius: 8 } } }}>
            <span data-testid="inherited">继承</span>
            <span data-testid="local" style={{ [radius]: '999px' } as CSSProperties}>局部</span>
          </ThemeProvider>
        </div>
        <ThemeProvider theme={{ components: { AutoComplete: { inputBorderRadius: 16 } } }}>
          <span data-testid="sibling">兄弟</span>
        </ThemeProvider>
        <span data-testid="outside">外部</span>
      </div>,
    )
    const value = (id: string, variable: string) =>
      getComputedStyle(screen.getByTestId(id).element()).getPropertyValue(variable).trim()
    expect(value('inherited', color)).toBe('green')
    expect(value('inherited', radius)).toBe('0.5rem')
    expect(value('local', radius)).toBe('999px')
    expect(value('sibling', radius)).toBe('1rem')
    expect(value('sibling', color)).toBe('')
    expect(value('outside', radius)).toBe('')
    expect(document.documentElement.style.cssText).toBe(before)
  })

  test('updates and removes root AutoComplete variables without mutation or stale configuration', async () => {
    const first: MatthewThemeConfig = { components: { AutoComplete: { inputColor: 'green', inputBorderRadius: 8 } } }
    const next: MatthewThemeConfig = { components: { AutoComplete: { inputColor: undefined, inputBorderRadius: 16 } } }
    const snapshots = [structuredClone(first), structuredClone(next)]
    const view = (theme: MatthewThemeConfig) => <ThemeProvider theme={theme} data-testid="scope">内容</ThemeProvider>
    const screen = await render(view(first))
    const element = screen.getByTestId('scope').element() as HTMLElement
    expect(variables(element.style)).toEqual({ [color]: 'green', [radius]: '0.5rem' })
    await screen.rerender(view(next))
    expect(screen.getByTestId('scope').element()).toBe(element)
    expect(variables(element.style)).toEqual({ [radius]: '1rem' })
    await screen.rerender(view({}))
    expect(variables(element.style)).toEqual({})
    expect([first, next]).toEqual(snapshots)
  })

  test('restores parent values after child removal and follows parent changes', async () => {
    const view = (parent: MatthewThemeConfig, child: MatthewThemeConfig) => (
      <ThemeProvider theme={parent}>
        <ThemeProvider theme={child} data-testid="child">内容</ThemeProvider>
      </ThemeProvider>
    )
    const parent: MatthewThemeConfig = { components: { AutoComplete: { inputBorderRadius: 8 } } }
    const screen = await render(view(parent, { components: { AutoComplete: { inputBorderRadius: 16 } } }))
    const style = (screen.getByTestId('child').element() as HTMLElement).style
    expect(style.getPropertyValue(radius)).toBe('1rem')
    await screen.rerender(view(parent, { components: { AutoComplete: { inputBorderRadius: undefined } } }))
    expect(style.getPropertyValue(radius)).toBe('0.5rem')
    await screen.rerender(view({ components: { AutoComplete: { inputBorderRadius: 24 } } }, {}))
    expect(style.getPropertyValue(radius)).toBe('1.5rem')
    await screen.rerender(view({}, {}))
    expect(style.getPropertyValue(radius)).toBe('')
  })

  test('keeps inherited AutoComplete customization while nested presets switch global colors', async () => {
    const view = (preset: MatthewThemeConfig) => (
      <ThemeProvider theme={{ components: { AutoComplete: { inputColor: 'green', popupShadow: 'none' } } }}>
        <ThemeProvider theme={preset} data-testid="preset">内容</ThemeProvider>
      </ThemeProvider>
    )
    const screen = await render(view(darkTheme))
    const style = (screen.getByTestId('preset').element() as HTMLElement).style
    expect(variables(style)).toEqual({ [color]: 'green', '--matthew-ui-auto-complete-popup-shadow': 'none' })
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe('#1e293b')
    await screen.rerender(view(lightTheme))
    expect(variables(style)).toEqual({ [color]: 'green', '--matthew-ui-auto-complete-popup-shadow': 'none' })
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe('#ffffff')
  })

  test('includes all three component overrides in SSR before any effects run', () => {
    const parent: MatthewThemeConfig = { components: {
      AutoComplete: { inputBorderRadius: 8 }, Button: { borderRadius: 16 }, Menu: { itemBorderRadius: 12 },
    } }
    const child: MatthewThemeConfig = { components: { AutoComplete: { inputColor: 'green' } } }
    const snapshots = [structuredClone(parent), structuredClone(child)]
    const template = document.createElement('template')
    template.innerHTML = renderToStaticMarkup(
      <ThemeProvider theme={parent}>
        <ThemeProvider theme={child} data-ssr-child="">内容</ThemeProvider>
      </ThemeProvider>,
    )
    const style = (template.content.querySelector('[data-ssr-child]') as HTMLElement).style
    expect(variables(style)).toEqual({ [color]: 'green', [radius]: '0.5rem' })
    expect(style.getPropertyValue(buttonRadius)).toBe('1rem')
    expect(style.getPropertyValue('--matthew-ui-menu-item-radius')).toBe('0.75rem')
    expect([parent, child]).toEqual(snapshots)
  })
})

describe('ThemeProvider AutoComplete configuration', () => {
  test('serializes all seventeen fields without changing the 23 global Tokens', () => {
    const theme: MatthewThemeConfig = { components: { AutoComplete: {
      fontSize: 16, inputBackground: '#ffffff', inputColor: 'black',
      borderColor: 'rgb(20 83 45)', inputHoverBorderColor: 'var(--business-border)',
      inputMinHeight: 48, inputBorderRadius: 8, inputPaddingBlock: 6, inputPaddingInline: 12,
      optionColor: 'navy', optionActiveBackground: '#dcfce7', optionActiveColor: 'oklch(60% 0.2 150)',
      optionBorderRadius: 4, optionPaddingBlock: 10, optionPaddingInline: 16,
      popupBackground: '#101820', popupShadow: '0 2px 8px rgb(0 0 0 / 20%)',
    } } }
    const style = ssrStyle(theme)
    expect(variables(style)).toEqual({
      '--matthew-ui-auto-complete-font-size': '1rem',
      '--matthew-ui-auto-complete-input-background': '#ffffff',
      '--matthew-ui-auto-complete-input-color': 'black',
      '--matthew-ui-auto-complete-border-color': 'rgb(20 83 45)',
      '--matthew-ui-auto-complete-input-hover-border-color': 'var(--business-border)',
      '--matthew-ui-auto-complete-input-min-height': '3rem',
      '--matthew-ui-auto-complete-input-radius': '0.5rem',
      '--matthew-ui-auto-complete-input-padding-block': '0.375rem',
      '--matthew-ui-auto-complete-input-padding-inline': '0.75rem',
      '--matthew-ui-auto-complete-option-color': 'navy',
      '--matthew-ui-auto-complete-option-active-background': '#dcfce7',
      '--matthew-ui-auto-complete-option-active-color': 'oklch(60% 0.2 150)',
      '--matthew-ui-auto-complete-option-radius': '0.25rem',
      '--matthew-ui-auto-complete-option-padding-block': '0.625rem',
      '--matthew-ui-auto-complete-option-padding-inline': '1rem',
      '--matthew-ui-auto-complete-popup-background': '#101820',
      '--matthew-ui-auto-complete-popup-shadow': '0 2px 8px rgb(0 0 0 / 20%)',
    })
    expect(style.length).toBe(40)
    expect(style.getPropertyValue('--matthew-ui-font-size-md')).toBe('0.875rem')
    expect(style.getPropertyValue('--matthew-ui-control-height-md')).toBe('2.5rem')
    expect(createTokens(theme)).toEqual(createTokens())
    expect(Object.keys(tokensToCssVars(createTokens(theme)))).toHaveLength(23)
  })

  test('omits defaults and unknown fields without deriving related colors', () => {
    expect(variables(ssrStyle({}))).toEqual({})
    expect(variables(ssrStyle({ components: { AutoComplete: {} } }))).toEqual({})
    expect(variables(ssrStyle(unchecked({
      optionActiveBackground: '#dcfce7', optionActiveColor: undefined, display: 'none',
    })))).toEqual({ '--matthew-ui-auto-complete-option-active-background': '#dcfce7' })
  })

  test('formats decimal dimensions and permitted zeros with the shared rem precision', () => {
    expect(variables(ssrStyle({ components: { AutoComplete: {
      fontSize: 14.5, inputMinHeight: 33.333333, inputBorderRadius: -0,
      inputPaddingBlock: 0, inputPaddingInline: 1e-7,
      optionBorderRadius: 0, optionPaddingBlock: 0, optionPaddingInline: 0,
    } } }))).toEqual({
      '--matthew-ui-auto-complete-font-size': '0.90625rem',
      '--matthew-ui-auto-complete-input-min-height': '2.083333rem',
      '--matthew-ui-auto-complete-input-radius': '0rem',
      '--matthew-ui-auto-complete-input-padding-block': '0rem',
      '--matthew-ui-auto-complete-input-padding-inline': '0rem',
      '--matthew-ui-auto-complete-option-radius': '0rem',
      '--matthew-ui-auto-complete-option-padding-block': '0rem',
      '--matthew-ui-auto-complete-option-padding-inline': '0rem',
    })
  })

  test('rejects non-numeric dimensions with field-specific TypeError', () => {
    for (const field of dimensions) for (const value of ['8px', null, true]) {
      const action = () => ssrStyle(unchecked({ [field]: value }))
      expect(action, field).toThrow(TypeError)
      expect(action, field).toThrow('components.AutoComplete.' + field)
    }
  })

  test('rejects non-finite/negative dimensions and zero font size or minimum height', () => {
    for (const field of dimensions) for (const value of [NaN, Infinity, -Infinity, -1]) {
      const action = () => ssrStyle(unchecked({ [field]: value }))
      expect(action, field).toThrow(RangeError)
      expect(action, field).toThrow('components.AutoComplete.' + field)
    }
    for (const field of ['fontSize', 'inputMinHeight']) {
      expect(() => ssrStyle(unchecked({ [field]: 0 })), field).toThrow(RangeError)
    }
  })

  test('requires strings for nine colors/shadow fields without parsing CSS grammar', () => {
    for (const field of ['inputBackground', 'inputColor', 'borderColor', 'inputHoverBorderColor',
      'optionColor', 'optionActiveBackground', 'optionActiveColor', 'popupBackground', 'popupShadow']) {
      for (const value of [123, null, false]) {
        const action = () => ssrStyle(unchecked({ [field]: value }))
        expect(action, field).toThrow(TypeError)
        expect(action, field).toThrow('components.AutoComplete.' + field)
      }
    }
    expect(() => ssrStyle(unchecked({ inputColor: 'not-a-color', popupShadow: 'not-a-shadow' }))).not.toThrow()
  })
})
