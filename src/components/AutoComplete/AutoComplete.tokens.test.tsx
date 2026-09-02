import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { AutoComplete, ThemeProvider, darkTheme } from '../../index'
import type { MatthewThemeConfig } from '../../index'
import { createDeferred } from './AutoComplete.test-utils'
import '../../styles/_tokens.scss'
import './AutoComplete.scss'

let rootSize: string
beforeEach(() => {
  rootSize = document.documentElement.style.fontSize
  document.documentElement.style.fontSize = '16px'
})
afterEach(() => { document.documentElement.style.fontSize = rootSize })
const harness = (children: ReactNode) => <div style={{ width: 280, fontSize: 20, fontFamily: 'monospace', lineHeight: 1.5 }}>{children}</div>
const options = [{ value: 'Alpha' }]
const sample = () => <AutoComplete aria-label="搜索" fetchSuggestions={() => options} />
const geometry = (element: Element) => {
  const s = getComputedStyle(element)
  return [s.fontSize, s.borderRadius, s.paddingBlock, s.paddingInline]
}

describe('AutoComplete Token dimensions and scope', () => {
  test('uses default dimensions for input, loading and options without Provider', async () => {
    const request = createDeferred<typeof options>()
    const screen = await render(harness(<AutoComplete aria-label="搜索" fetchSuggestions={() => request.promise} />))
    const input = screen.getByRole('combobox')
    expect(geometry(input.element())).toEqual(['14px', '8px', '8px', '12px'])
    expect(getComputedStyle(input.element()).minHeight).toBe('40px')
    expect(getComputedStyle(input.element()).fontFamily).toBe('monospace')
    await input.fill('a')
    const status = screen.getByRole('status')
    await expect.element(status).toBeVisible()
    expect(geometry(status.element().closest('li')!)).toEqual(['14px', '6px', '10px', '12px'])
    request.resolve(options)
    const option = screen.getByRole('option', { name: 'Alpha' })
    await expect.element(option).toBeVisible()
    expect(geometry(option.element())).toEqual(['14px', '6px', '10px', '12px'])
    const popup = screen.getByRole('listbox').element()
    const style = getComputedStyle(popup)
    expect([style.position, style.zIndex, style.maxHeight, style.padding, style.overflowY])
      .toEqual(['absolute', '10', '240px', '4px', 'auto'])
    expect(popup.getBoundingClientRect().width).toBe(input.element().getBoundingClientRect().width)
    expect(popup.getBoundingClientRect().top - input.element().getBoundingClientRect().bottom).toBe(6)
  })

  test('follows Seed and final semantic dimensions without scaling padding', async () => {
    const view = (theme: MatthewThemeConfig) => harness(<ThemeProvider theme={theme}>{sample()}</ThemeProvider>)
    const screen = await render(view({ seed: { controlHeight: 48, fontSize: 18 } }))
    const input = screen.getByRole('combobox')
    await input.fill('a')
    const option = screen.getByRole('option')
    await expect.element(option).toBeVisible()
    expect(geometry(input.element())).toEqual(['18px', '8px', '8px', '12px'])
    expect(getComputedStyle(input.element()).minHeight).toBe('48px')
    expect(geometry(option.element())).toEqual(['18px', '6px', '10px', '12px'])
    await screen.rerender(view({ tokens: { controlHeightMd: '3.25rem', fontSizeMd: '1.25rem' } }))
    expect(geometry(input.element())).toEqual(['20px', '8px', '8px', '12px'])
    expect(getComputedStyle(input.element()).minHeight).toBe('52px')
    expect(geometry(option.element())).toEqual(['20px', '6px', '10px', '12px'])
  })

  test('applies eight component dimensions with independent input/option geometry', async () => {
    const request = createDeferred<typeof options>()
    const screen = await render(harness(
      <ThemeProvider theme={{ seed: { fontSize: 22, controlHeight: 56 }, components: { AutoComplete: {
        fontSize: 18, inputMinHeight: 48, inputBorderRadius: 12, inputPaddingBlock: 0, inputPaddingInline: 24,
        optionBorderRadius: 4, optionPaddingBlock: 6, optionPaddingInline: 20,
      } } }}>
        <AutoComplete aria-label="搜索" fetchSuggestions={() => request.promise} />
      </ThemeProvider>,
    ))
    const input = screen.getByRole('combobox')
    expect(geometry(input.element())).toEqual(['18px', '12px', '0px', '24px'])
    expect(getComputedStyle(input.element()).minHeight).toBe('48px')
    await input.fill('a')
    const status = screen.getByRole('status')
    await expect.element(status).toBeVisible()
    expect(geometry(status.element().closest('li')!)).toEqual(['18px', '4px', '6px', '20px'])
    request.resolve(options)
    const option = screen.getByRole('option')
    await expect.element(option).toBeVisible()
    expect(geometry(option.element())).toEqual(['18px', '4px', '6px', '20px'])
    expect(getComputedStyle(screen.getByRole('listbox').element()).borderRadius).toBe('8px')
  })

  test('inherits ancestor variables through a nested theme while input styles cannot reach sibling options', async () => {
    const screen = await render(harness(<>
      <div style={{ '--matthew-ui-auto-complete-font-size': '18px' } as CSSProperties}>
        <ThemeProvider theme={darkTheme}>
          <AutoComplete aria-label="内部" fetchSuggestions={() => options} className="local-input"
            style={{ '--matthew-ui-auto-complete-font-size': '24px', '--matthew-ui-auto-complete-option-radius': '99px' } as CSSProperties} />
        </ThemeProvider>
      </div>
      <AutoComplete aria-label="外部" fetchSuggestions={() => options} />
    </>))
    const input = screen.getByRole('combobox', { name: '内部' })
    await input.fill('a')
    const option = screen.getByRole('option')
    await expect.element(option).toBeVisible()
    expect(input.element().classList.contains('local-input')).toBe(true)
    expect(getComputedStyle(input.element()).fontSize).toBe('24px')
    expect(geometry(option.element())).toEqual(['18px', '6px', '10px', '12px'])
    expect(getComputedStyle(screen.getByRole('combobox', { name: '外部' }).element()).fontSize).toBe('14px')
  })

  test('restores parent then global dimensions when overrides are removed', async () => {
    const view = (parent: MatthewThemeConfig, child: MatthewThemeConfig) => harness(
      <ThemeProvider theme={parent}><ThemeProvider theme={child}>{sample()}</ThemeProvider></ThemeProvider>,
    )
    const parent: MatthewThemeConfig = { components: { AutoComplete: { inputBorderRadius: 16, optionBorderRadius: 10 } } }
    const screen = await render(view(parent, { components: { AutoComplete: { inputBorderRadius: 24, optionBorderRadius: 20 } } }))
    const input = screen.getByRole('combobox')
    await input.fill('a')
    const option = screen.getByRole('option')
    await expect.element(option).toBeVisible()
    const radii = () => [getComputedStyle(input.element()).borderRadius, getComputedStyle(option.element()).borderRadius]
    expect(radii()).toEqual(['24px', '20px'])
    await screen.rerender(view(parent, {}))
    expect(radii()).toEqual(['16px', '10px'])
    await screen.rerender(view({}, {}))
    expect(radii()).toEqual(['8px', '6px'])
  })

  test('clamps derived option radius to zero and honors explicit zero', async () => {
    const view = (theme: MatthewThemeConfig) => harness(<ThemeProvider theme={theme}>{sample()}</ThemeProvider>)
    const screen = await render(view({ seed: { borderRadius: 1 } }))
    await screen.getByRole('combobox').fill('a')
    const option = screen.getByRole('option')
    await expect.element(option).toBeVisible()
    expect(getComputedStyle(option.element()).borderRadius).toBe('0px')
    await screen.rerender(view({ seed: { borderRadius: 12 } }))
    expect(getComputedStyle(option.element()).borderRadius).toBe('10px')
    await screen.rerender(view({ seed: { borderRadius: 12 }, components: { AutoComplete: { optionBorderRadius: 0 } } }))
    expect(getComputedStyle(option.element()).borderRadius).toBe('0px')
  })

  test('keeps min-height flexible and preserves custom option typography and wrapping', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ components: { AutoComplete: { inputMinHeight: 32, fontSize: 40 } } }}>
        <AutoComplete aria-label="搜索" fetchSuggestions={() => options}
          renderOption={() => <span data-testid="details" style={{ fontSize: 22, color: 'purple' }}>
            A very long suggestion with additional details that must wrap inside this narrow container
          </span>} />
      </ThemeProvider>,
    ))
    const input = screen.getByRole('combobox')
    expect(getComputedStyle(input.element()).minHeight).toBe('32px')
    expect(input.element().getBoundingClientRect().height).toBeGreaterThan(32)
    await input.fill('a')
    const option = screen.getByRole('option')
    await expect.element(option).toBeVisible()
    expect(getComputedStyle(option.element()).fontSize).toBe('40px')
    const details = getComputedStyle(screen.getByTestId('details').element())
    expect([details.fontSize, details.color]).toEqual(['22px', 'rgb(128, 0, 128)'])
    expect(option.element().scrollWidth).toBeLessThanOrEqual(option.element().clientWidth)
    expect(getComputedStyle(option.element()).minHeight).toBe('0px')
  })
})
