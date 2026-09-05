import { renderToStaticMarkup } from 'react-dom/server'
import type { CSSProperties } from 'react'
import { render } from 'vitest-browser-react'
import { describe, expect, test } from 'vitest'
import { createTokens, darkTheme, lightTheme, ThemeProvider, tokensToCssVars } from '../index'
import type { MatthewThemeConfig } from '../index'

// 观察真实 Provider 首次 SSR 输出，不通过私有转换函数测试实现细节。
function ssrStyle(theme: MatthewThemeConfig): CSSStyleDeclaration {
  const template = document.createElement('template')
  template.innerHTML = renderToStaticMarkup(
    <ThemeProvider theme={theme}><span>内容</span></ThemeProvider>,
  )
  return (template.content.firstElementChild as HTMLElement).style
}
function menuVariables(style: CSSStyleDeclaration) {
  return Object.fromEntries(Array.from(style)
    .filter(name => name.startsWith('--matthew-ui-menu-'))
    .map(name => [name, style.getPropertyValue(name)]))
}
// 仅非法输入用例绕过类型，模拟 JS/JSON 调用方；合法配置仍由公开类型约束。
const uncheckedTheme = (Menu: Record<string, unknown>) =>
  ({ components: { Menu } }) as unknown as MatthewThemeConfig

describe('ThemeProvider Menu scope', () => {
  const radius = '--matthew-ui-menu-item-radius'
  const color = '--matthew-ui-menu-item-color'
  const buttonRadius = '--matthew-ui-button-radius'

  test('merges Menu fields through nested scopes including empty and undefined children', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: { Menu: { itemColor: 'black', itemBorderRadius: 8 } } }}>
        <ThemeProvider theme={{ components: { Menu: { itemColor: 'green', itemBorderRadius: undefined } } }} data-testid="child">
          <ThemeProvider theme={{ components: { Menu: {} } }} data-testid="empty">
            <ThemeProvider data-testid="omitted">内容</ThemeProvider>
          </ThemeProvider>
        </ThemeProvider>
      </ThemeProvider>,
    )
    for (const id of ['child', 'empty', 'omitted']) {
      expect(menuVariables((screen.getByTestId(id).element() as HTMLElement).style)).toEqual({
        [color]: 'green', [radius]: '0.5rem',
      })
    }
  })

  test('keeps Button and Menu independently when a child configures only one component', async () => {
    const screen = await render(
      <ThemeProvider theme={{ components: {
        Button: { borderRadius: 8 }, Menu: { itemColor: 'black', itemBorderRadius: 6 },
      } }}>
        <ThemeProvider theme={{ components: { Menu: { itemColor: 'green' } } }} data-testid="menu-child">Menu</ThemeProvider>
        <ThemeProvider theme={{ components: { Button: { borderRadius: 16 } } }} data-testid="button-child">Button</ThemeProvider>
      </ThemeProvider>,
    )
    const menuStyle = (screen.getByTestId('menu-child').element() as HTMLElement).style
    const buttonStyle = (screen.getByTestId('button-child').element() as HTMLElement).style
    expect(menuVariables(menuStyle)).toEqual({ [color]: 'green', [radius]: '0.375rem' })
    expect(menuStyle.getPropertyValue(buttonRadius)).toBe('0.5rem')
    expect(menuVariables(buttonStyle)).toEqual({ [color]: 'black', [radius]: '0.375rem' })
    expect(buttonStyle.getPropertyValue(buttonRadius)).toBe('1rem')
  })

  test('prioritizes configured wrapper variables and restores style values when removed', async () => {
    const view = (theme: MatthewThemeConfig) => (
      <ThemeProvider theme={theme} data-testid="scope" className="custom-menu-scope"
        aria-label="菜单主题" style={{ [radius]: '999px', [color]: 'purple', padding: 16 } as CSSProperties}
      >内容</ThemeProvider>
    )
    const screen = await render(view({ components: { Menu: { itemBorderRadius: 8 } } }))
    const element = screen.getByTestId('scope').element() as HTMLElement
    expect(menuVariables(element.style)).toEqual({ [radius]: '0.5rem', [color]: 'purple' })
    expect(element.style.padding).toBe('16px')
    expect(element.className).toBe('custom-menu-scope')
    expect(element.getAttribute('aria-label')).toBe('菜单主题')
    await screen.rerender(view({}))
    expect(menuVariables(element.style)).toEqual({ [radius]: '999px', [color]: 'purple' })
  })

  test('inherits ancestor CSS, permits local exceptions and isolates siblings without touching root', async () => {
    const before = document.documentElement.style.cssText
    const screen = await render(
      <div>
        <div className="batch5a-menu-region">
          <style>{'.batch5a-menu-region { --matthew-ui-menu-item-color: green; }'}</style>
          <ThemeProvider theme={{ ...darkTheme, components: { Menu: { itemBorderRadius: 8 } } }}>
            <span data-testid="inherited">继承</span>
            <span data-testid="local" style={{ [radius]: '999px' } as CSSProperties}>局部</span>
          </ThemeProvider>
        </div>
        <ThemeProvider theme={{ components: { Menu: { itemBorderRadius: 16 } } }}>
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

  test('updates and removes root Menu variables without mutation or stale configuration', async () => {
    const first: MatthewThemeConfig = { components: { Menu: { itemColor: 'green', itemBorderRadius: 8 } } }
    const next: MatthewThemeConfig = { components: { Menu: { itemColor: undefined, itemBorderRadius: 16 } } }
    const snapshots = [structuredClone(first), structuredClone(next)]
    const view = (theme: MatthewThemeConfig) => <ThemeProvider theme={theme} data-testid="scope">内容</ThemeProvider>
    const screen = await render(view(first))
    const element = screen.getByTestId('scope').element() as HTMLElement
    expect(menuVariables(element.style)).toEqual({ [color]: 'green', [radius]: '0.5rem' })
    await screen.rerender(view(next))
    expect(screen.getByTestId('scope').element()).toBe(element)
    expect(menuVariables(element.style)).toEqual({ [radius]: '1rem' })
    await screen.rerender(view({}))
    expect(menuVariables(element.style)).toEqual({})
    expect([first, next]).toEqual(snapshots)
  })

  test('restores parent values after child removal and follows parent changes', async () => {
    const view = (parent: MatthewThemeConfig, child: MatthewThemeConfig) => (
      <ThemeProvider theme={parent}>
        <ThemeProvider theme={child} data-testid="child">内容</ThemeProvider>
      </ThemeProvider>
    )
    const parent: MatthewThemeConfig = { components: { Menu: { itemBorderRadius: 8 } } }
    const screen = await render(view(parent, { components: { Menu: { itemBorderRadius: 16 } } }))
    const style = (screen.getByTestId('child').element() as HTMLElement).style
    expect(style.getPropertyValue(radius)).toBe('1rem')
    await screen.rerender(view(parent, { components: { Menu: { itemBorderRadius: undefined } } }))
    expect(style.getPropertyValue(radius)).toBe('0.5rem')
    await screen.rerender(view({ components: { Menu: { itemBorderRadius: 24 } } }, {}))
    expect(style.getPropertyValue(radius)).toBe('1.5rem')
    await screen.rerender(view({}, {}))
    expect(style.getPropertyValue(radius)).toBe('')
  })

  test('keeps inherited Menu customization while nested presets switch global colors', async () => {
    const view = (preset: MatthewThemeConfig) => (
      <ThemeProvider theme={{ components: { Menu: { itemColor: 'green', popupShadow: 'none' } } }}>
        <ThemeProvider theme={preset} data-testid="preset">内容</ThemeProvider>
      </ThemeProvider>
    )
    const screen = await render(view(darkTheme))
    const style = (screen.getByTestId('preset').element() as HTMLElement).style
    expect(menuVariables(style)).toEqual({ [color]: 'green', '--matthew-ui-menu-popup-shadow': 'none' })
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe('#1e293b')
    await screen.rerender(view(lightTheme))
    expect(menuVariables(style)).toEqual({ [color]: 'green', '--matthew-ui-menu-popup-shadow': 'none' })
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe('#ffffff')
  })

  test('includes merged Menu and Button overrides in SSR before any effects run', () => {
    const parent: MatthewThemeConfig = { components: {
      Menu: { itemBorderRadius: 8 }, Button: { borderRadius: 16 },
    } }
    const child: MatthewThemeConfig = { components: { Menu: { itemColor: 'green' } } }
    const snapshots = [structuredClone(parent), structuredClone(child)]
    const template = document.createElement('template')
    template.innerHTML = renderToStaticMarkup(
      <ThemeProvider theme={parent}>
        <ThemeProvider theme={child} data-ssr-child="">内容</ThemeProvider>
      </ThemeProvider>,
    )
    const style = (template.content.querySelector('[data-ssr-child]') as HTMLElement).style
    expect(menuVariables(style)).toEqual({ [color]: 'green', [radius]: '0.5rem' })
    expect(style.getPropertyValue(buttonRadius)).toBe('1rem')
    expect([parent, child]).toEqual(snapshots)
  })
})

describe('ThemeProvider Menu configuration', () => {
  test('serializes all thirteen Menu fields without changing the global Token contract', () => {
    const theme: MatthewThemeConfig = { components: { Menu: {
      background: '#ffffff', borderColor: 'rgb(20 83 45)', itemColor: 'black',
      itemHoverBackground: 'var(--business-hover)', itemSelectedBackground: '#dcfce7',
      itemSelectedColor: 'oklch(60% 0.2 150)', itemMinHeight: 48, itemFontSize: 16,
      itemBorderRadius: 8, itemPaddingBlock: 6, itemPaddingInline: 12,
      popupBackground: '#101820', popupShadow: '0 2px 8px rgb(0 0 0 / 20%)',
    } } }
    const style = ssrStyle(theme)
    expect(menuVariables(style)).toEqual({
      '--matthew-ui-menu-background': '#ffffff',
      '--matthew-ui-menu-border-color': 'rgb(20 83 45)',
      '--matthew-ui-menu-item-color': 'black',
      '--matthew-ui-menu-item-hover-background': 'var(--business-hover)',
      '--matthew-ui-menu-item-selected-background': '#dcfce7',
      '--matthew-ui-menu-item-selected-color': 'oklch(60% 0.2 150)',
      '--matthew-ui-menu-item-min-height': '3rem',
      '--matthew-ui-menu-item-font-size': '1rem',
      '--matthew-ui-menu-item-radius': '0.5rem',
      '--matthew-ui-menu-item-padding-block': '0.375rem',
      '--matthew-ui-menu-item-padding-inline': '0.75rem',
      '--matthew-ui-menu-popup-background': '#101820',
      '--matthew-ui-menu-popup-shadow': '0 2px 8px rgb(0 0 0 / 20%)',
    })
    expect(style.length).toBe(36)
    expect(style.getPropertyValue('--matthew-ui-font-size-md')).toBe('0.875rem')
    expect(style.getPropertyValue('--matthew-ui-control-height-md')).toBe('2.5rem')
    // 这里只验证组件覆盖对全局输出无副作用；转换值的预期在上表独立写出。
    const defaults = createTokens()
    expect(Object.keys(defaults)).toHaveLength(23)
    expect(createTokens(theme)).toEqual(defaults)
    expect(Object.keys(tokensToCssVars(createTokens(theme)))).toHaveLength(23)
  })

  test('omits unspecified defaults, ignores unknown fields and does not derive related colors', () => {
    expect(menuVariables(ssrStyle({}))).toEqual({})
    expect(menuVariables(ssrStyle({ components: { Menu: {} } }))).toEqual({})
    expect(menuVariables(ssrStyle(uncheckedTheme({
      itemSelectedBackground: '#dcfce7', itemSelectedColor: undefined, display: 'none',
    })))).toEqual({ '--matthew-ui-menu-item-selected-background': '#dcfce7' })
  })

  test('formats decimal dimensions and permitted zero without scientific notation', () => {
    expect(menuVariables(ssrStyle({ components: { Menu: {
      itemMinHeight: 33.333333, itemFontSize: 14.5, itemBorderRadius: -0,
      itemPaddingBlock: 0, itemPaddingInline: 1e-7,
    } } }))).toEqual({
      '--matthew-ui-menu-item-min-height': '2.083333rem',
      '--matthew-ui-menu-item-font-size': '0.90625rem',
      '--matthew-ui-menu-item-radius': '0rem',
      '--matthew-ui-menu-item-padding-block': '0rem',
      '--matthew-ui-menu-item-padding-inline': '0rem',
    })
  })

  test('rejects non-numeric Menu dimensions with TypeError', () => {
    for (const field of ['itemMinHeight', 'itemFontSize', 'itemBorderRadius', 'itemPaddingBlock', 'itemPaddingInline']) {
      for (const value of ['8px', null, true]) {
        expect(() => ssrStyle(uncheckedTheme({ [field]: value })), field).toThrow(TypeError)
      }
    }
  })

  test('rejects non-finite or negative dimensions and zero minimum height/font size', () => {
    for (const field of ['itemMinHeight', 'itemFontSize', 'itemBorderRadius', 'itemPaddingBlock', 'itemPaddingInline']) {
      for (const value of [NaN, Infinity, -Infinity, -1]) {
        expect(() => ssrStyle(uncheckedTheme({ [field]: value })), field).toThrow(RangeError)
      }
    }
    for (const field of ['itemMinHeight', 'itemFontSize']) {
      expect(() => ssrStyle(uncheckedTheme({ [field]: 0 })), field).toThrow(RangeError)
    }
  })

  test('requires strings for all color and shadow fields without validating CSS grammar', () => {
    for (const field of ['background', 'borderColor', 'itemColor', 'itemHoverBackground',
      'itemSelectedBackground', 'itemSelectedColor', 'popupBackground', 'popupShadow']) {
      for (const value of [123, null, false]) {
        expect(() => ssrStyle(uncheckedTheme({ [field]: value })), field).toThrow(TypeError)
      }
    }
    expect(() => ssrStyle(uncheckedTheme({ itemColor: 'not-a-color', popupShadow: 'not-a-shadow' }))).not.toThrow()
  })

  test('formats Menu field errors with the component name and stable text', () => {
    expect(() => ssrStyle(uncheckedTheme({ itemColor: 5 })))
      .toThrow('components.Menu.itemColor must be a CSS string')
    expect(() => ssrStyle(uncheckedTheme({ itemFontSize: '16px' })))
      .toThrow('components.Menu.itemFontSize must be a number')
    expect(() => ssrStyle(uncheckedTheme({ itemMinHeight: 0 })))
      .toThrow('components.Menu.itemMinHeight must be finite and greater than 0')
    expect(() => ssrStyle(uncheckedTheme({ itemBorderRadius: -1 })))
      .toThrow('components.Menu.itemBorderRadius must be finite and greater than or equal to 0')
  })
})
