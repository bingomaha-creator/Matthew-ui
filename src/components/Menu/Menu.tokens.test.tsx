import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { darkTheme, Menu, ThemeProvider } from '../../index'
import type { MatthewThemeConfig } from '../../index'
import '../../styles/_tokens.scss'
import './Menu.scss'

// 固定设计单位的观察坐标；页面字号故意设20px，证明菜单字号来自Token而非继承。
let previousRootSize: string
beforeEach(() => {
  previousRootSize = document.documentElement.style.fontSize
  document.documentElement.style.fontSize = '16px'
})
afterEach(() => { document.documentElement.style.fontSize = previousRootSize })
const harness = (children: ReactNode) => (
  <div className="menu-token-harness" style={{ fontSize: 20, fontFamily: 'monospace' }}>
    <style>{'.menu-token-harness :is(button, a) { transition: none; }'}</style>
    {children}
  </div>
)
const sample = () => (
  <Menu aria-label="导航" mode="vertical" defaultOpenValues={['group']}>
    <Menu.Item value="home">首页</Menu.Item>
    <Menu.LinkItem value="docs" href="#docs">文档</Menu.LinkItem>
    <Menu.SubMenu value="group" title="组件">
      <Menu.Item value="child">子项</Menu.Item>
    </Menu.SubMenu>
  </Menu>
)
const dimensions = (element: Element) => {
  const style = getComputedStyle(element)
  return {
    minHeight: style.minHeight, fontSize: style.fontSize, borderRadius: style.borderRadius,
    paddingBlock: style.paddingBlock, paddingInline: style.paddingInline,
  }
}

describe('Menu Token dimensions and scope', () => {
  test('uses the default Token profile for Item, LinkItem and SubMenu title without Provider', async () => {
    const screen = await render(harness(sample()))
    for (const control of [
      screen.getByRole('button', { name: '首页', exact: true }),
      screen.getByRole('link', { name: '文档', exact: true }),
      screen.getByRole('button', { name: '组件', exact: true }),
    ]) {
      expect(dimensions(control.element())).toEqual({
        minHeight: '40px', fontSize: '14px', borderRadius: '6px',
        paddingBlock: '8px', paddingInline: '12px',
      })
      expect(getComputedStyle(control.element()).fontFamily).toBe('monospace')
    }
    const root = getComputedStyle(screen.getByRole('list', { name: '导航', exact: true }).element())
    expect([root.maxWidth, root.gap, root.padding, root.borderRadius]).toEqual(['288px', '4px', '4px', '8px'])
  })

  test('follows Seed and final semantic dimensions while keeping padding independent', async () => {
    const view = (theme: MatthewThemeConfig) => harness(<ThemeProvider theme={theme}>{sample()}</ThemeProvider>)
    const screen = await render(view({ seed: { controlHeight: 48, fontSize: 18 } }))
    const controls = [
      screen.getByRole('button', { name: '首页', exact: true }),
      screen.getByRole('link', { name: '文档', exact: true }),
      screen.getByRole('button', { name: '组件', exact: true }),
    ]
    for (const control of controls) {
      expect(dimensions(control.element())).toEqual({
        minHeight: '48px', fontSize: '18px', borderRadius: '6px',
        paddingBlock: '8px', paddingInline: '12px',
      })
    }
    await screen.rerender(view({ tokens: { controlHeightMd: '3.25rem', fontSizeMd: '1.25rem' } }))
    expect(dimensions(controls[0].element())).toEqual({
      minHeight: '52px', fontSize: '20px', borderRadius: '6px',
      paddingBlock: '8px', paddingInline: '12px',
    })
  })

  test('applies all five component dimensions to every control without changing container radius', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={{ seed: { controlHeight: 48 }, components: { Menu: {
        itemMinHeight: 64, itemFontSize: 18, itemBorderRadius: 12,
        itemPaddingBlock: 0, itemPaddingInline: 24,
      } } }}>{sample()}</ThemeProvider>,
    ))
    for (const control of [
      screen.getByRole('button', { name: '首页', exact: true }),
      screen.getByRole('link', { name: '文档', exact: true }),
      screen.getByRole('button', { name: '组件', exact: true }),
    ]) {
      expect(dimensions(control.element())).toEqual({
        minHeight: '64px', fontSize: '18px', borderRadius: '12px',
        paddingBlock: '0px', paddingInline: '24px',
      })
    }
    expect(getComputedStyle(screen.getByRole('list', { name: '导航', exact: true }).element()).borderRadius).toBe('8px')
  })

  test('changes minimum height independently and lets larger content exceed it', async () => {
    const view = (theme: MatthewThemeConfig) => harness(<ThemeProvider theme={theme}>{sample()}</ThemeProvider>)
    const screen = await render(view({ components: { Menu: { itemMinHeight: 64 } } }))
    const item = screen.getByRole('button', { name: '首页', exact: true })
    expect(dimensions(item.element())).toEqual({
      minHeight: '64px', fontSize: '14px', borderRadius: '6px',
      paddingBlock: '8px', paddingInline: '12px',
    })
    await screen.rerender(view({ components: { Menu: { itemMinHeight: 16, itemFontSize: 32 } } }))
    expect(getComputedStyle(item.element()).minHeight).toBe('16px')
    expect(item.element().getBoundingClientRect().height).toBeGreaterThan(16)
  })

  test('inherits ancestor CSS through a dark Provider and allows Item and SubMenu local exceptions', async () => {
    const screen = await render(harness(
      <>
        <div style={{ '--matthew-ui-menu-item-radius': '20px' } as CSSProperties}>
          <ThemeProvider theme={darkTheme}>
            <Menu mode="vertical" defaultOpenValues={['group']}>
              <Menu.Item value="inherited">继承</Menu.Item>
              <Menu.LinkItem value="local" href="#local" style={{ '--matthew-ui-menu-item-radius': '12px' } as CSSProperties}>局部链接</Menu.LinkItem>
              <Menu.SubMenu value="group" title="局部分组" style={{ '--matthew-ui-menu-item-radius': '4px' } as CSSProperties}>
                <Menu.Item value="child">局部子项</Menu.Item>
              </Menu.SubMenu>
            </Menu>
          </ThemeProvider>
        </div>
        <Menu><Menu.Item value="outside">外部</Menu.Item></Menu>
      </>,
    ))
    for (const [control, expected] of [
      [screen.getByRole('button', { name: '继承', exact: true }), '20px'],
      [screen.getByRole('link', { name: '局部链接', exact: true }), '12px'],
      [screen.getByRole('button', { name: '局部分组', exact: true }), '4px'],
      [screen.getByRole('button', { name: '局部子项', exact: true }), '4px'],
      [screen.getByRole('button', { name: '外部', exact: true }), '6px'],
    ] as const) {
      expect(getComputedStyle(control.element()).borderRadius).toBe(expected)
    }
  })

  test('restores parent dimensions and then global defaults when overrides are removed', async () => {
    const view = (parent: MatthewThemeConfig, child: MatthewThemeConfig) => harness(
      <ThemeProvider theme={parent}><ThemeProvider theme={child}>{sample()}</ThemeProvider></ThemeProvider>,
    )
    const parent: MatthewThemeConfig = { components: { Menu: { itemMinHeight: 48 } } }
    const screen = await render(view(parent, { components: { Menu: { itemMinHeight: 64 } } }))
    const item = screen.getByRole('button', { name: '首页', exact: true }).element()
    expect(getComputedStyle(item).minHeight).toBe('64px')
    await screen.rerender(view(parent, {}))
    expect(getComputedStyle(item).minHeight).toBe('48px')
    await screen.rerender(view({}, {}))
    expect(getComputedStyle(item).minHeight).toBe('40px')
  })

  test('clamps the derived item radius at zero while keeping explicit zero valid', async () => {
    const view = (theme: MatthewThemeConfig) => harness(<ThemeProvider theme={theme}>{sample()}</ThemeProvider>)
    const screen = await render(view({ seed: { borderRadius: 1 } }))
    const item = screen.getByRole('button', { name: '首页', exact: true }).element()
    expect(getComputedStyle(item).borderRadius).toBe('0px')
    await screen.rerender(view({ seed: { borderRadius: 12 } }))
    expect(getComputedStyle(item).borderRadius).toBe('10px')
    await screen.rerender(view({ seed: { borderRadius: 12 }, components: { Menu: { itemBorderRadius: 0 } } }))
    expect(getComputedStyle(item).borderRadius).toBe('0px')
  })
})
