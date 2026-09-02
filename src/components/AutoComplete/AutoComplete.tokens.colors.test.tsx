import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { AutoComplete, Button, Menu, ThemeProvider, darkTheme } from '../../index'
import type { MatthewThemeConfig } from '../../index'
import { createDeferred } from './AutoComplete.test-utils'
import '../../styles/_tokens.scss'
import '../Button/Button.scss'
import '../Menu/Menu.scss'
import './AutoComplete.scss'

let rootSize: string
beforeEach(() => {
  rootSize = document.documentElement.style.fontSize
  document.documentElement.style.fontSize = '16px'
})
afterEach(() => { document.documentElement.style.fontSize = rootSize })
const harness = (children: ReactNode) => <div className="auto-color-harness" style={{ width: 280 }}>
  {/* 只关闭测试夹具内的过渡；状态仍由真实输入、键盘和指针触发。 */}
  <style>{'.auto-color-harness input, .auto-color-harness li { transition: none !important; }'}</style>
  {children}
</div>
const options = [{ value: 'Alpha' }, { value: 'Beta' }]
const colors = (element: Element) => {
  const s = getComputedStyle(element)
  return [s.backgroundColor, s.color]
}
const inputTokens = {
  inputBackground: '#fafafa', inputColor: '#14532d', borderColor: '#166534',
  inputHoverBorderColor: '#052e16',
}

describe('AutoComplete Token colors and states', () => {
  test('configures input and popup independently with a shared normal border', async () => {
    const screen = await render(harness(<ThemeProvider theme={{ components: { AutoComplete: {
      ...inputTokens, popupBackground: '#f0fdf4', popupShadow: 'none',
    } } }}>
      <AutoComplete aria-label="搜索" fetchSuggestions={() => options} />
    </ThemeProvider>))
    const input = screen.getByRole('combobox')
    expect(colors(input.element())).toEqual(['rgb(250, 250, 250)', 'rgb(20, 83, 45)'])
    expect(getComputedStyle(input.element()).borderColor).toBe('rgb(22, 101, 52)')
    await input.hover()
    expect(getComputedStyle(input.element()).borderColor).toBe('rgb(5, 46, 22)')
    expect(getComputedStyle(input.element()).backgroundColor).toBe('rgb(250, 250, 250)')
    await input.fill('q')
    await expect.element(screen.getByRole('option', { name: 'Alpha' })).toBeVisible()
    const popup = getComputedStyle(screen.getByRole('listbox').element())
    expect([popup.backgroundColor, popup.borderColor, popup.boxShadow])
      .toEqual(['rgb(240, 253, 244)', 'rgb(22, 101, 52)', 'none'])
  })

  test('uses the same colors for pointer and keyboard candidates but bolds only aria-selected', async () => {
    const screen = await render(harness(<ThemeProvider theme={{ components: { AutoComplete: {
      optionColor: 'navy', optionActiveBackground: '#dcfce7', optionActiveColor: '#166534',
    } } }}>
      <AutoComplete aria-label="搜索" fetchSuggestions={() => options} />
    </ThemeProvider>))
    const input = screen.getByRole('combobox')
    await input.fill('q')
    const alpha = screen.getByRole('option', { name: 'Alpha' })
    const beta = screen.getByRole('option', { name: 'Beta' })
    await expect.element(alpha).toBeVisible()
    expect(colors(alpha.element())).toEqual(['rgba(0, 0, 0, 0)', 'rgb(0, 0, 128)'])
    await userEvent.keyboard('{ArrowDown}')
    expect(colors(alpha.element())).toEqual(['rgb(220, 252, 231)', 'rgb(22, 101, 52)'])
    expect(getComputedStyle(alpha.element()).fontWeight).toBe('600')
    await expect.element(input).toHaveValue('q')
    await beta.hover()
    await expect.element(beta).toHaveAttribute('aria-selected', 'true')
    expect(colors(beta.element())).toEqual(['rgb(220, 252, 231)', 'rgb(22, 101, 52)'])
    // 指针仍停在Beta时键盘移回Alpha：允许两项有颜色，只有当前候选加粗。
    await userEvent.keyboard('{ArrowUp}')
    expect(beta.element().matches(':hover')).toBe(true)
    await expect.element(alpha).toHaveAttribute('aria-selected', 'true')
    expect(colors(beta.element())).toEqual(['rgb(220, 252, 231)', 'rgb(22, 101, 52)'])
    expect(colors(alpha.element())).toEqual(['rgb(220, 252, 231)', 'rgb(22, 101, 52)'])
    expect([getComputedStyle(alpha.element()).fontWeight, getComputedStyle(beta.element()).fontWeight])
      .toEqual(['600', '400'])
    await expect.element(input).toHaveValue('q')
  })

  test('keeps disabled/readOnly backgrounds and suppresses hover without losing configured text/border', async () => {
    const view = (dark: boolean, disabled: boolean, readOnly: boolean) => harness(
      <ThemeProvider theme={{ ...(dark ? darkTheme : {}), components: { AutoComplete: inputTokens } }}>
        <AutoComplete aria-label="搜索" disabled={disabled} readOnly={readOnly} fetchSuggestions={() => options} />
      </ThemeProvider>,
    )
    const screen = await render(view(false, true, false))
    const input = screen.getByRole('combobox')
    for (const dark of [false, true]) {
      for (const [disabled, readOnly] of [[true, false], [false, true], [true, true]]) {
        await screen.rerender(view(dark, disabled, readOnly))
        await input.hover()
        const s = getComputedStyle(input.element())
        expect([s.backgroundColor, s.color, s.borderColor, s.opacity, s.cursor]).toEqual([
          dark ? 'rgb(51, 65, 85)' : 'rgb(241, 245, 249)', 'rgb(20, 83, 45)',
          'rgb(22, 101, 52)', disabled ? '0.6' : '1', disabled ? 'not-allowed' : 'default',
        ])
      }
    }
    await screen.rerender(view(false, false, false))
    expect(getComputedStyle(input.element()).backgroundColor).toBe('rgb(250, 250, 250)')
    expect(getComputedStyle(input.element()).borderColor).toBe('rgb(5, 46, 22)')
  })

  test('keeps an explicit active background while unconfigured colors follow preset switching and removal', async () => {
    const view = (theme: MatthewThemeConfig) => harness(<ThemeProvider theme={theme}>
      <AutoComplete aria-label="搜索" fetchSuggestions={() => options} />
    </ThemeProvider>)
    const components = { AutoComplete: { optionActiveBackground: '#dcfce7' } }
    const screen = await render(view({ components }))
    await screen.getByRole('combobox').fill('q')
    const option = screen.getByRole('option', { name: 'Alpha' })
    await expect.element(option).toBeVisible()
    await userEvent.keyboard('{ArrowDown}')
    expect(colors(option.element())).toEqual(['rgb(220, 252, 231)', 'rgb(30, 64, 175)'])
    await screen.rerender(view({ ...darkTheme, components }))
    expect(colors(option.element())).toEqual(['rgb(220, 252, 231)', 'rgb(191, 219, 254)'])
    await screen.rerender(view(darkTheme))
    expect(colors(option.element())).toEqual(['rgb(71, 85, 105)', 'rgb(191, 219, 254)'])
  })

  test('inherits business ancestor colors without leaking input-local variables or affecting other components', async () => {
    const screen = await render(harness(<>
      <div style={{ '--matthew-ui-auto-complete-option-color': 'green', '--matthew-ui-auto-complete-popup-background': '#fafafa' } as CSSProperties}>
        <ThemeProvider theme={darkTheme}>
          <AutoComplete aria-label="内部" fetchSuggestions={() => options}
            style={{ '--matthew-ui-auto-complete-input-color': 'purple', '--matthew-ui-auto-complete-popup-background': 'red' } as CSSProperties} />
          <Button>按钮</Button>
          <Menu><Menu.Item value="item">菜单</Menu.Item></Menu>
        </ThemeProvider>
      </div>
      <AutoComplete aria-label="外部" fetchSuggestions={() => options} />
    </>))
    const input = screen.getByRole('combobox', { name: '内部' })
    await input.fill('q')
    const option = screen.getByRole('option', { name: 'Alpha' })
    await expect.element(option).toBeVisible()
    expect(getComputedStyle(input.element()).color).toBe('rgb(128, 0, 128)')
    expect(getComputedStyle(option.element()).color).toBe('rgb(0, 128, 0)')
    expect(getComputedStyle(screen.getByRole('listbox').element()).backgroundColor).toBe('rgb(250, 250, 250)')
    expect(getComputedStyle(screen.getByRole('combobox', { name: '外部' }).element()).color).toBe('rgb(15, 23, 42)')
    expect(getComputedStyle(screen.getByRole('button', { name: '按钮' }).element()).color).toBe('rgb(248, 250, 252)')
    expect(getComputedStyle(screen.getByRole('button', { name: '菜单' }).element()).color).toBe('rgb(248, 250, 252)')
  })

  test('uses global popup surface and shadow in both presets independently of input background', async () => {
    const view = (dark: boolean) => harness(<ThemeProvider theme={{ ...(dark ? darkTheme : {}),
      components: { AutoComplete: { inputBackground: '#fafafa' } } }}>
      <AutoComplete aria-label="搜索" fetchSuggestions={() => options} />
    </ThemeProvider>)
    const screen = await render(view(false))
    const input = screen.getByRole('combobox')
    await input.fill('q')
    await expect.element(screen.getByRole('listbox')).toBeVisible()
    const popupStyle = () => getComputedStyle(screen.getByRole('listbox').element())
    expect([popupStyle().backgroundColor, popupStyle().boxShadow])
      .toEqual(['rgb(255, 255, 255)', 'rgba(15, 23, 42, 0.12) 0px 12px 24px 0px'])
    await screen.rerender(view(true))
    expect([popupStyle().backgroundColor, popupStyle().boxShadow])
      .toEqual(['rgb(30, 41, 59)', 'rgba(255, 255, 255, 0.12) 0px 12px 24px 0px'])
    expect(getComputedStyle(input.element()).backgroundColor).toBe('rgb(250, 250, 250)')
  })

  test('keeps placeholder and loading text muted even with candidate color overrides', async () => {
    const request = createDeferred<typeof options>()
    const view = (dark: boolean) => harness(<ThemeProvider theme={{ ...(dark ? darkTheme : {}),
      components: { AutoComplete: { inputColor: 'red', optionColor: 'green',
        optionActiveBackground: 'yellow', optionActiveColor: 'purple' } } }}>
      <AutoComplete aria-label="搜索" placeholder="关键词" fetchSuggestions={() => request.promise} />
    </ThemeProvider>)
    const screen = await render(view(false))
    const input = screen.getByRole('combobox')
    await input.fill('q')
    const status = screen.getByRole('status')
    await expect.element(status).toBeVisible()
    for (const dark of [false, true]) {
      await screen.rerender(view(dark))
      await status.hover()
      const muted = dark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)'
      expect(getComputedStyle(input.element(), '::placeholder').color).toBe(muted)
      expect(colors(status.element().closest('li')!)).toEqual(['rgba(0, 0, 0, 0)', muted])
      await expect.element(screen.getByRole('option')).not.toBeInTheDocument()
    }
    request.resolve(options)
    await expect.element(screen.getByRole('option', { name: 'Alpha' })).toBeVisible()
  })

  test('preserves the global visible keyboard focus ring with component colors', async () => {
    const screen = await render(harness(<ThemeProvider theme={{ components: { AutoComplete: inputTokens } }}>
      <button>起点</button><AutoComplete aria-label="搜索" fetchSuggestions={() => options} />
    </ThemeProvider>))
    await screen.getByRole('button', { name: '起点' }).click()
    await userEvent.keyboard('{Tab}')
    const input = screen.getByRole('combobox').element()
    expect(input.matches(':focus-visible')).toBe(true)
    const s = getComputedStyle(input)
    expect([s.outlineStyle, s.outlineWidth, s.outlineOffset, s.outlineColor])
      .toEqual(['solid', '3px', '2px', 'rgba(37, 99, 235, 0.35)'])
  })
})
