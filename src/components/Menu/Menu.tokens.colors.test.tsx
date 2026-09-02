import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { Button, darkTheme, lightTheme, Menu, ThemeProvider } from '../../index'
import type { MatthewThemeConfig } from '../../index'
import '../../styles/_tokens.scss'
import '../Button/Button.scss'
import './Menu.scss'

let previousRootSize: string
beforeEach(() => {
  previousRootSize = document.documentElement.style.fontSize
  document.documentElement.style.fontSize = '16px'
})
afterEach(() => { document.documentElement.style.fontSize = previousRootSize })
const harness = (children: ReactNode) => (
  <div className="menu-color-harness">
    {/* 只关闭测试中的过渡，真实hover由浏览器指针触发，不模拟状态class。 */}
    <style>{'.menu-color-harness :is(button, a) { transition: none; }'}</style>
    {children}
  </div>
)
const colors = (element: Element) => {
  const style = getComputedStyle(element)
  return { background: style.backgroundColor, color: style.color }
}
const custom: MatthewThemeConfig = { components: { Menu: {
  background: '#fafafa', borderColor: '#166534', itemColor: '#14532d',
  itemHoverBackground: '#bbf7d0', itemSelectedBackground: '#dcfce7',
  itemSelectedColor: '#166534',
} } }
const popupMenu = (mode: 'horizontal' | 'vertical' = 'horizontal') => (
  <Menu mode={mode} aria-label="浮层导航" defaultOpenValues={['group']}>
    <Menu.SubMenu value="group" title="分组">
      <Menu.LinkItem value="docs" href="#popup-docs">子链接</Menu.LinkItem>
    </Menu.SubMenu>
  </Menu>
)
// 根据真实可见链接定位其语义列表；不拼接内部class，也不跳过子菜单挂载/展开过程。
const containingList = (element: Element) => {
  const list = element.closest('ul')
  if (!list) throw new Error('Expected a real Menu list')
  return list
}

describe('Menu Token colors and states', () => {
  test('applies regional background/border and normal/hover colors to all three controls', async () => {
    const screen = await render(harness(
      <ThemeProvider theme={custom}>
        <Menu mode="vertical" aria-label="导航">
          <Menu.Item value="home">首页</Menu.Item>
          <Menu.LinkItem value="docs" href="#docs">文档</Menu.LinkItem>
          <Menu.SubMenu value="group" title="组件"><Menu.Item value="child">子项</Menu.Item></Menu.SubMenu>
        </Menu>
      </ThemeProvider>,
    ))
    const root = getComputedStyle(screen.getByRole('list', { name: '导航', exact: true }).element())
    expect([root.backgroundColor, root.borderTopColor]).toEqual(['rgb(250, 250, 250)', 'rgb(22, 101, 52)'])
    for (const control of [
      screen.getByRole('button', { name: '首页', exact: true }),
      screen.getByRole('link', { name: '文档', exact: true }),
      screen.getByRole('button', { name: '组件', exact: true }),
    ]) {
      await control.unhover()
      expect(colors(control.element())).toEqual({ background: 'rgba(0, 0, 0, 0)', color: 'rgb(20, 83, 45)' })
      await control.hover()
      expect(control.element().matches(':hover')).toBe(true)
      expect(colors(control.element())).toEqual({ background: 'rgb(187, 247, 208)', color: 'rgb(20, 83, 45)' })
    }
  })

  test('keeps selected Item, LinkItem and ancestor title colors on hover, independently of open state', async () => {
    const view = (selected?: string) => harness(
      <ThemeProvider theme={custom}>
        <Menu mode="vertical" value={selected} defaultOpenValues={['group']}>
          <Menu.SubMenu title="组件" value="group">
            <Menu.Item value="action">操作</Menu.Item>
            <Menu.LinkItem value="docs" href="#docs">链接</Menu.LinkItem>
          </Menu.SubMenu>
        </Menu>
      </ThemeProvider>,
    )
    const screen = await render(view())
    const title = screen.getByRole('button', { name: '组件', exact: true })
    await title.unhover()
    expect(colors(title.element()).background).toBe('rgba(0, 0, 0, 0)')
    for (const [value, role, name] of [['action', 'button', '操作'], ['docs', 'link', '链接']] as const) {
      await screen.rerender(view(value))
      const selected = screen.getByRole(role, { name, exact: true })
      await expect.element(selected).toHaveAttribute('aria-current', 'true')
      for (const control of [selected, title]) {
        await control.hover()
        expect(colors(control.element())).toEqual({ background: 'rgb(220, 252, 231)', color: 'rgb(22, 101, 52)' })
        expect(getComputedStyle(control.element()).fontWeight).toBe('600')
      }
    }
    await title.click()
    await expect.element(title).toHaveAttribute('aria-expanded', 'false')
    await title.unhover()
    expect(colors(title.element())).toEqual({ background: 'rgb(220, 252, 231)', color: 'rgb(22, 101, 52)' })
  })

  test('keeps disabled Item and LinkItem out of hover effects even when selected', async () => {
    const view = (value?: string) => harness(
      <ThemeProvider theme={custom}>
        <Menu mode="vertical" value={value}>
          <Menu.Item disabled value="action">禁用操作</Menu.Item>
          <Menu.LinkItem disabled value="docs" href="#disabled-docs">禁用链接</Menu.LinkItem>
        </Menu>
      </ThemeProvider>,
    )
    const screen = await render(view())
    const controls = [
      ['action', screen.getByRole('button', { name: '禁用操作', exact: true })],
      ['docs', screen.getByRole('link', { name: '禁用链接', exact: true })],
    ] as const
    for (const selected of [undefined, 'action', 'docs']) {
      await screen.rerender(view(selected))
      for (const [value, control] of controls) {
        await control.hover()
        expect(colors(control.element())).toEqual(value === selected
          ? { background: 'rgb(220, 252, 231)', color: 'rgb(22, 101, 52)' }
          : { background: 'rgba(0, 0, 0, 0)', color: 'rgb(20, 83, 45)' })
        const style = getComputedStyle(control.element())
        expect([style.opacity, style.cursor]).toEqual(['0.55', 'not-allowed'])
      }
    }
  })

  test('keeps fields independent through preset switches and restores defaults on removal', async () => {
    const view = (preset: MatthewThemeConfig, configured: boolean) => harness(
      <ThemeProvider theme={{ ...preset, components: configured ? { Menu: { itemSelectedBackground: '#dcfce7' } } : undefined }}>
        <Menu mode="vertical" value="selected">
          <Menu.Item value="selected">选中</Menu.Item><Menu.Item value="normal">普通</Menu.Item>
        </Menu>
      </ThemeProvider>,
    )
    const screen = await render(view(lightTheme, true))
    const selected = screen.getByRole('button', { name: '选中', exact: true })
    const normal = screen.getByRole('button', { name: '普通', exact: true })
    await selected.hover()
    expect(colors(selected.element())).toEqual({ background: 'rgb(220, 252, 231)', color: 'rgb(30, 64, 175)' })
    await normal.hover()
    expect(colors(normal.element()).background).toBe('rgb(241, 245, 249)')
    await screen.rerender(view(darkTheme, true))
    await selected.hover()
    expect(colors(selected.element())).toEqual({ background: 'rgb(220, 252, 231)', color: 'rgb(191, 219, 254)' })
    await normal.hover()
    expect(colors(normal.element())).toEqual({ background: 'rgb(51, 65, 85)', color: 'rgb(248, 250, 252)' })
    await screen.rerender(view(darkTheme, false))
    await selected.hover()
    expect(colors(selected.element())).toEqual({ background: 'rgb(71, 85, 105)', color: 'rgb(191, 219, 254)' })
  })

  test('allows ancestor and local color variables through nested themes without affecting outside Menu or Button', async () => {
    const screen = await render(harness(
      <>
        <div style={{ '--matthew-ui-menu-item-color': '#166534' } as CSSProperties}>
          <ThemeProvider theme={darkTheme}>
            <Menu mode="vertical">
              <Menu.Item value="inherited">继承</Menu.Item>
              <Menu.Item value="local" style={{ '--matthew-ui-menu-item-color': '#bbf7d0' } as CSSProperties}>局部</Menu.Item>
            </Menu>
            <Button>同域按钮</Button>
          </ThemeProvider>
        </div>
        <Menu><Menu.Item value="outside">外部菜单</Menu.Item></Menu>
      </>,
    ))
    expect(colors(screen.getByRole('button', { name: '继承', exact: true }).element()).color).toBe('rgb(22, 101, 52)')
    expect(colors(screen.getByRole('button', { name: '局部', exact: true }).element()).color).toBe('rgb(187, 247, 208)')
    expect(colors(screen.getByRole('button', { name: '外部菜单', exact: true }).element()).color).toBe('rgb(15, 23, 42)')
    expect(colors(screen.getByRole('button', { name: '同域按钮', exact: true }).element()).color).toBe('rgb(248, 250, 252)')
  })

  test('uses light and dark global popup surfaces and shadows after real Menu mounting', async () => {
    const view = (theme: MatthewThemeConfig) => harness(<ThemeProvider theme={theme}>{popupMenu()}</ThemeProvider>)
    const screen = await render(view(lightTheme))
    const link = screen.getByRole('link', { name: '子链接', exact: true })
    await expect.element(link).toBeVisible()
    const popup = containingList(link.element())
    const light = getComputedStyle(popup)
    expect([light.backgroundColor, light.boxShadow]).toEqual(['rgb(255, 255, 255)', 'rgba(15, 23, 42, 0.12) 0px 12px 24px 0px'])
    await screen.rerender(view(darkTheme))
    const dark = getComputedStyle(popup)
    expect([dark.backgroundColor, dark.boxShadow]).toEqual(['rgb(30, 41, 59)', 'rgba(255, 255, 255, 0.12) 0px 12px 24px 0px'])
  })

  test('keeps popup overrides independent from root background and vertical lists while retaining layout', async () => {
    const view = (mode: 'horizontal' | 'vertical') => harness(
      <ThemeProvider theme={{ components: { Menu: {
        background: '#fafafa', borderColor: '#166534', popupBackground: '#14532d',
        popupShadow: 'none', itemBorderRadius: 24,
      } } }}>{popupMenu(mode)}</ThemeProvider>,
    )
    const screen = await render(view('horizontal'))
    const link = screen.getByRole('link', { name: '子链接', exact: true })
    await expect.element(link).toBeVisible()
    const root = screen.getByRole('list', { name: '浮层导航', exact: true }).element()
    const popup = containingList(link.element())
    const style = getComputedStyle(popup)
    expect([getComputedStyle(root).backgroundColor, getComputedStyle(root).borderBottomColor])
      .toEqual(['rgb(250, 250, 250)', 'rgb(22, 101, 52)'])
    expect([style.backgroundColor, style.borderTopColor, style.boxShadow]).toEqual(['rgb(20, 83, 45)', 'rgb(22, 101, 52)', 'none'])
    expect([style.position, style.minWidth, style.zIndex, style.borderRadius, style.gap, style.padding])
      .toEqual(['absolute', '192px', '1', '8px', '4px', '4px'])
    expect(getComputedStyle(link.element()).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await screen.rerender(view('vertical'))
    const vertical = getComputedStyle(popup)
    expect([vertical.backgroundColor, vertical.boxShadow, vertical.position]).toEqual(['rgba(0, 0, 0, 0)', 'none', 'static'])
  })

  test('retains the global keyboard focus ring on a selected customized item', async () => {
    const screen = await render(harness(
      <>
        <button>焦点起点</button>
        <ThemeProvider theme={custom}><Menu defaultValue="home"><Menu.Item value="home">首页</Menu.Item></Menu></ThemeProvider>
      </>,
    ))
    await screen.getByRole('button', { name: '焦点起点', exact: true }).click()
    await userEvent.keyboard('{Tab}')
    const item = screen.getByRole('button', { name: '首页', exact: true })
    await expect.element(item).toHaveFocus()
    expect(item.element().matches(':focus-visible')).toBe(true)
    const style = getComputedStyle(item.element())
    expect([style.outlineWidth, style.outlineStyle, style.outlineColor, style.outlineOffset])
      .toEqual(['3px', 'solid', 'rgba(37, 99, 235, 0.35)', '2px'])
  })
})
