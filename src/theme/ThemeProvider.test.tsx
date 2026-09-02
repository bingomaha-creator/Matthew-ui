import type { CSSProperties } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { darkTheme, lightTheme, ThemeProvider } from '../index'

describe('ThemeProvider', () => {
  test('scopes the complete default light theme to its wrapper', async () => {
    const screen = await render(
      <ThemeProvider data-testid="theme-root">
        <span>内容</span>
      </ThemeProvider>,
    )
    const wrapper = screen.getByTestId('theme-root')
    const inlineStyle = (wrapper.element() as HTMLElement).style
    const cssVariables = Object.fromEntries(
      Array.from(inlineStyle).map((name) => [
        name,
        inlineStyle.getPropertyValue(name),
      ]),
    )

    expect(cssVariables).toEqual({
      '--matthew-ui-color-primary': '#2563eb',
      '--matthew-ui-color-primary-hover': '#1d4ed8',
      '--matthew-ui-color-primary-active': '#1e40af',
      '--matthew-ui-color-danger': '#dc2626',
      '--matthew-ui-color-danger-hover': '#b91c1c',
      '--matthew-ui-color-danger-active': '#991b1b',
      '--matthew-ui-color-surface': '#ffffff',
      '--matthew-ui-color-surface-hover': '#f1f5f9',
      '--matthew-ui-color-surface-active': '#e2e8f0',
      '--matthew-ui-color-text': '#0f172a',
      '--matthew-ui-color-text-muted': '#64748b',
      '--matthew-ui-color-text-inverse': '#ffffff',
      '--matthew-ui-color-border': '#cbd5e1',
      '--matthew-ui-color-focus': 'rgb(37 99 235 / 35%)',
      '--matthew-ui-shadow-overlay':
        '0 0.75rem 1.5rem rgb(15 23 42 / 12%)',
      '--matthew-ui-radius-md': '0.5rem',
      '--matthew-ui-control-height-sm': '2rem',
      '--matthew-ui-control-height-md': '2.5rem',
      '--matthew-ui-control-height-lg': '3rem',
      '--matthew-ui-font-size-sm': '0.8125rem',
      '--matthew-ui-font-size-md': '0.875rem',
      '--matthew-ui-font-size-lg': '1rem',
      '--matthew-ui-duration-fast': '150ms',
    })
    expect(inlineStyle.length).toBe(23)
  })

  test('derives seed families and applies exact token overrides last', async () => {
    const screen = await render(
      <ThemeProvider
        theme={{
          seed: { colorPrimary: '#00B96B' },
          tokens: { colorPrimaryHover: 'oklch(60% 0.2 150)' },
        }}
        data-testid="theme-root"
      >
        <span>内容</span>
      </ThemeProvider>,
    )
    const style = (screen.getByTestId('theme-root').element() as HTMLElement)
      .style

    expect(style.getPropertyValue('--matthew-ui-color-primary')).toBe(
      '#00b96b',
    )
    expect(style.getPropertyValue('--matthew-ui-color-primary-hover')).toBe(
      'oklch(60% 0.2 150)',
    )
    expect(style.getPropertyValue('--matthew-ui-color-primary-active')).toBe(
      '#009858',
    )
    expect(style.getPropertyValue('--matthew-ui-color-focus')).toBe(
      'rgb(0 185 107 / 35%)',
    )
  })

  test('forwards wrapper attributes and lets theme own token variables', async () => {
    const tokenVariableStyle = {
      '--matthew-ui-color-primary': 'hotpink',
    } as CSSProperties
    const screen = await render(
      <ThemeProvider
        theme={{ seed: { colorPrimary: '#00b96b' } }}
        id="docs-theme"
        className="preview"
        data-testid="theme-root"
        aria-label="主题预览"
        style={{ padding: 16, ...tokenVariableStyle }}
      >
        <span>内容</span>
      </ThemeProvider>,
    )
    const wrapper = screen.getByTestId('theme-root')
    const element = wrapper.element() as HTMLElement

    await expect.element(wrapper).toHaveAttribute('id', 'docs-theme')
    await expect.element(wrapper).toHaveClass('preview')
    await expect.element(wrapper).toHaveAttribute('aria-label', '主题预览')
    expect(element.style.padding).toBe('16px')
    expect(
      element.style.getPropertyValue('--matthew-ui-color-primary'),
    ).toBe('#00b96b')
  })

  test('keeps sibling scopes isolated without changing the document root', async () => {
    const previousRootValue = document.documentElement.style.getPropertyValue(
      '--matthew-ui-color-primary',
    )
    const screen = await render(
      <>
        <ThemeProvider
          theme={{ seed: { colorPrimary: '#00b96b' } }}
          data-testid="green-theme"
        >
          <span>绿色</span>
        </ThemeProvider>
        <ThemeProvider
          theme={{ seed: { colorPrimary: '#ff0000' } }}
          data-testid="red-theme"
        >
          <span>红色</span>
        </ThemeProvider>
      </>,
    )
    const greenStyle = (
      screen.getByTestId('green-theme').element() as HTMLElement
    ).style
    const redStyle = (screen.getByTestId('red-theme').element() as HTMLElement)
      .style

    expect(greenStyle.getPropertyValue('--matthew-ui-color-primary')).toBe(
      '#00b96b',
    )
    expect(redStyle.getPropertyValue('--matthew-ui-color-primary')).toBe(
      '#ff0000',
    )
    expect(
      document.documentElement.style.getPropertyValue(
        '--matthew-ui-color-primary',
      ),
    ).toBe(previousRootValue)
  })

  test('inherits the parent theme when a nested provider omits theme', async () => {
    const screen = await render(
      <ThemeProvider
        theme={{
          seed: { colorPrimary: '#00b96b' },
          tokens: { colorSurface: '#101820' },
        }}
        data-testid="parent-theme"
      >
        <ThemeProvider data-testid="child-theme">
          <span>内容</span>
        </ThemeProvider>
      </ThemeProvider>,
    )
    const parentStyle = (
      screen.getByTestId('parent-theme').element() as HTMLElement
    ).style
    const childStyle = (
      screen.getByTestId('child-theme').element() as HTMLElement
    ).style

    expect(childStyle.getPropertyValue('--matthew-ui-color-primary')).toBe(
      parentStyle.getPropertyValue('--matthew-ui-color-primary'),
    )
    expect(childStyle.getPropertyValue('--matthew-ui-color-surface')).toBe(
      parentStyle.getPropertyValue('--matthew-ui-color-surface'),
    )
  })

  test('treats undefined nested Seed and Token fields as omitted', async () => {
    const screen = await render(
      <ThemeProvider
        theme={{
          seed: { colorPrimary: '#00b96b', borderRadius: 16 },
          tokens: { colorSurface: '#101820', colorBorder: 'orange' },
        }}
      >
        <ThemeProvider
          theme={{
            seed: { colorPrimary: undefined, borderRadius: 12 },
            tokens: { colorSurface: undefined, colorBorder: 'hotpink' },
          }}
          data-testid="child-theme"
        >
          内容
        </ThemeProvider>
      </ThemeProvider>,
    )
    const style = (screen.getByTestId('child-theme').element() as HTMLElement)
      .style

    expect(style.getPropertyValue('--matthew-ui-color-primary')).toBe(
      '#00b96b',
    )
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe('#101820')
    expect(style.getPropertyValue('--matthew-ui-radius-md')).toBe('0.75rem')
    expect(style.getPropertyValue('--matthew-ui-color-border')).toBe('hotpink')
  })

  test('re-derives a child seed while preserving parent token overrides', async () => {
    const screen = await render(
      <ThemeProvider
        theme={{
          seed: { colorPrimary: '#ff0000' },
          tokens: { colorSurface: '#101820' },
        }}
      >
        <ThemeProvider
          theme={{ seed: { colorPrimary: '#00b96b' } }}
          data-testid="child-theme"
        >
          <span>内容</span>
        </ThemeProvider>
      </ThemeProvider>,
    )
    const style = (screen.getByTestId('child-theme').element() as HTMLElement)
      .style

    expect(style.getPropertyValue('--matthew-ui-color-primary')).toBe(
      '#00b96b',
    )
    expect(style.getPropertyValue('--matthew-ui-color-primary-hover')).toBe(
      '#00a760',
    )
    expect(style.getPropertyValue('--matthew-ui-color-primary-active')).toBe(
      '#009858',
    )
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe(
      '#101820',
    )
  })

  test('applies a child token override without changing sibling tokens', async () => {
    const screen = await render(
      <ThemeProvider
        theme={{
          seed: { colorPrimary: '#00b96b' },
          tokens: { colorSurface: '#101820' },
        }}
      >
        <ThemeProvider
          theme={{ tokens: { colorBorder: 'hotpink' } }}
          data-testid="child-theme"
        >
          <span>内容</span>
        </ThemeProvider>
      </ThemeProvider>,
    )
    const style = (screen.getByTestId('child-theme').element() as HTMLElement)
      .style

    expect(style.getPropertyValue('--matthew-ui-color-border')).toBe('hotpink')
    expect(style.getPropertyValue('--matthew-ui-color-primary')).toBe(
      '#00b96b',
    )
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe(
      '#101820',
    )
  })

  test('updates the same wrapper without mutating theme inputs', async () => {
    const lightConfig = {
      seed: { colorPrimary: '#2563eb' as const },
      tokens: { colorSurface: '#ffffff' },
    }
    const darkConfig = {
      seed: { colorPrimary: '#3b82f6' as const },
      tokens: { colorSurface: '#1e293b' },
    }
    const originalLightConfig = structuredClone(lightConfig)
    const originalDarkConfig = structuredClone(darkConfig)
    const screen = await render(
      <ThemeProvider theme={lightConfig} data-testid="theme-root">
        <span>内容</span>
      </ThemeProvider>,
    )
    const wrapperBefore = screen.getByTestId('theme-root').element()

    await screen.rerender(
      <ThemeProvider theme={darkConfig} data-testid="theme-root">
        <span>内容</span>
      </ThemeProvider>,
    )

    const wrapperAfter = screen.getByTestId('theme-root').element()
    expect(wrapperAfter).toBe(wrapperBefore)
    expect(
      (wrapperAfter as HTMLElement).style.getPropertyValue(
        '--matthew-ui-color-surface',
      ),
    ).toBe('#1e293b')
    expect(lightConfig).toEqual(originalLightConfig)
    expect(darkConfig).toEqual(originalDarkConfig)
  })

  test('applies the explicit dark preset candidate', async () => {
    const screen = await render(
      <ThemeProvider theme={darkTheme} data-testid="theme-root">
        <span>内容</span>
      </ThemeProvider>,
    )
    const style = (screen.getByTestId('theme-root').element() as HTMLElement)
      .style

    expect(style.getPropertyValue('--matthew-ui-color-primary')).toBe(
      '#3b82f6',
    )
    expect(style.getPropertyValue('--matthew-ui-color-primary-hover')).toBe(
      '#60a5fa',
    )
    expect(style.getPropertyValue('--matthew-ui-color-primary-active')).toBe(
      '#bfdbfe',
    )
    expect(style.getPropertyValue('--matthew-ui-color-danger')).toBe(
      '#ef4444',
    )
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe(
      '#1e293b',
    )
    expect(style.getPropertyValue('--matthew-ui-color-surface-hover')).toBe(
      '#334155',
    )
    expect(style.getPropertyValue('--matthew-ui-color-surface-active')).toBe(
      '#475569',
    )
    expect(style.getPropertyValue('--matthew-ui-color-text')).toBe('#f8fafc')
    expect(style.getPropertyValue('--matthew-ui-color-text-muted')).toBe(
      '#94a3b8',
    )
    expect(style.getPropertyValue('--matthew-ui-color-text-inverse')).toBe(
      '#0f172a',
    )
    expect(style.getPropertyValue('--matthew-ui-color-border')).toBe(
      '#334155',
    )
    expect(style.getPropertyValue('--matthew-ui-shadow-overlay')).toBe(
      '0 0.75rem 1.5rem rgb(255 255 255 / 12%)',
    )
  })

  test('switches preset-owned colors back to light inside a dark scope', async () => {
    const screen = await render(
      <ThemeProvider theme={darkTheme}>
        <ThemeProvider theme={lightTheme} data-testid="light-theme">
          <span>亮色区域</span>
        </ThemeProvider>
      </ThemeProvider>,
    )
    const style = (screen.getByTestId('light-theme').element() as HTMLElement)
      .style

    expect(style.getPropertyValue('--matthew-ui-color-primary')).toBe(
      '#2563eb',
    )
    expect(style.getPropertyValue('--matthew-ui-color-primary-hover')).toBe(
      '#1d4ed8',
    )
    expect(style.getPropertyValue('--matthew-ui-color-primary-active')).toBe(
      '#1e40af',
    )
    expect(style.getPropertyValue('--matthew-ui-color-danger')).toBe(
      '#dc2626',
    )
    expect(style.getPropertyValue('--matthew-ui-color-surface')).toBe(
      '#ffffff',
    )
    expect(style.getPropertyValue('--matthew-ui-color-text')).toBe('#0f172a')
    expect(style.getPropertyValue('--matthew-ui-color-border')).toBe(
      '#cbd5e1',
    )
    expect(style.getPropertyValue('--matthew-ui-shadow-overlay')).toBe(
      '0 0.75rem 1.5rem rgb(15 23 42 / 12%)',
    )
  })
})
