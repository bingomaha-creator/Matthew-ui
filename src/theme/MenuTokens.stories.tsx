import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button, Menu, ThemeProvider, darkTheme, lightTheme } from '../index'
import type { MatthewThemeConfig, MenuProps } from '../index'

const stack: CSSProperties = { display: 'grid', gap: '1rem', minWidth: 0 }
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }
const panel: CSSProperties = {
  ...stack, alignContent: 'start', padding: '1.25rem',
  color: 'var(--matthew-ui-color-text)', background: 'var(--matthew-ui-color-surface)',
  border: '1px solid var(--matthew-ui-color-border)', borderRadius: 'var(--matthew-ui-radius-md)',
}
const selectedTheme = { itemSelectedBackground: '#dcfce7', itemSelectedColor: '#166534', itemBorderRadius: 8 }
const regionalTheme: MatthewThemeConfig = { components: { Menu: {
  ...selectedTheme, background: '#f0fdf4', borderColor: '#166534', itemColor: '#14532d',
  itemHoverBackground: '#bbf7d0', itemMinHeight: 48, itemFontSize: 16,
  itemPaddingBlock: 10, itemPaddingInline: 20, popupBackground: '#f0fdf4', popupShadow: 'none',
} } }

// 复用的是演示内容，不复制组件状态逻辑；真实选择/展开仍由Menu负责。
function Navigation(props: MenuProps) {
  return <Menu defaultValue="docs" defaultOpenValues={['components']} {...props}>
    <Menu.Item value="home">首页</Menu.Item>
    <Menu.SubMenu title="组件" value="components">
      <Menu.LinkItem value="docs" href="#menu-token-docs">文档</Menu.LinkItem>
      <Menu.Item value="example">示例</Menu.Item>
    </Menu.SubMenu>
    <Menu.Item disabled value="disabled">禁用项</Menu.Item>
  </Menu>
}

function SeedPreview() {
  const [spacious, setSpacious] = useState(false)
  return <div style={stack}>
    <div><Button onClick={() => setSpacious(value => !value)}>{spacious ? '恢复默认尺寸' : '使用宽松尺寸'}</Button></div>
    <ThemeProvider theme={{ seed: spacious ? { controlHeight: 48, fontSize: 18 } : {} }}>
      <section style={panel} aria-label="尺寸联动">
        <h2>菜单项统一跟随 Seed</h2>
        <p>Item、LinkItem、父标题一起变化；padding仍为8px / 12px，不随高度派生。</p>
        <Navigation mode="vertical" aria-label="尺寸导航" />
        <p aria-live="polite">{spacious ? '宽松：最小高度48px / 字号18px' : '默认：最小高度40px / 字号14px'}</p>
      </section>
    </ThemeProvider>
  </div>
}

function SwitchPreview() {
  const [dark, setDark] = useState(false)
  const [custom, setCustom] = useState(true)
  return <div style={stack}>
    <div style={row}>
      <Button onClick={() => setDark(value => !value)}>切换到{dark ? '亮色' : '暗色'}</Button>
      <Button onClick={() => setCustom(value => !value)}>{custom ? '撤销菜单定制' : '启用菜单定制'}</Button>
    </div>
    {/* 只定制选中配色与圆角：浮层、普通文字与hover仍跟随当前预设。 */}
    <ThemeProvider theme={{ ...(dark ? darkTheme : lightTheme), components: custom ? { Menu: selectedTheme } : undefined }}>
      <section style={{ ...panel, minHeight: '24rem' }} aria-label="动态菜单">
        <h2>亮暗切换与撤销</h2>
        <p aria-live="polite">当前：{dark ? '暗色' : '亮色'} / {custom ? '绿色选中态' : '预设默认'}</p>
        <p>切换预设保留显式定制；撤销后恢复当前预设。展开组件，观察浮层与选中标题。</p>
        <Navigation aria-label="主题导航" />
      </section>
    </ThemeProvider>
  </div>
}

const meta = {
  title: 'Theme/MenuTokens', component: ThemeProvider, tags: ['autodocs', 'test'], args: { children: null },
} satisfies Meta<typeof ThemeProvider>
export default meta
type Story = StoryObj<typeof meta>

export const SeedScale: Story = {
  render: () => <SeedPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '使用宽松尺寸' }))
    await waitFor(() => {
      for (const control of [
        canvas.getByRole('button', { name: '首页' }),
        canvas.getByRole('button', { name: '组件' }),
        canvas.getByRole('link', { name: '文档' }),
      ]) {
        const style = getComputedStyle(control)
        expect([style.minHeight, style.fontSize, style.paddingBlock, style.paddingInline]).toEqual(['48px', '18px', '8px', '12px'])
      }
    })
    await userEvent.click(canvas.getByRole('button', { name: '恢复默认尺寸' }))
    await waitFor(() => expect(getComputedStyle(canvas.getByRole('button', { name: '首页' })).fontSize).toBe('14px'))
  },
}

export const ScopedTokens: Story = {
  render: () => <div style={{ ...stack, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))' }}>
    <ThemeProvider theme={regionalTheme}>
      <section style={panel} aria-label="定制区域">
        <h2>区域定制：绿色菜单</h2>
        <p>悬停文档与父标题，选中配色持续保留；悬停首页则使用独立hover色。</p>
        <Navigation mode="vertical" aria-label="定制导航" />
        <Button>同域按钮</Button>
      </section>
    </ThemeProvider>
    <section style={panel} aria-label="外部区域">
      <h2>区域之外：默认菜单</h2>
      <p>Menu组件配置不修改外部菜单，也不修改同域Button的组件样式。</p>
      <Navigation mode="vertical" aria-label="外部导航" />
    </section>
  </div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const custom = within(canvas.getByRole('region', { name: '定制区域' }))
    const outside = within(canvas.getByRole('region', { name: '外部区域' }))
    // Storybook userEvent.hover是合成事件，不能证明CSS :hover；
    // 真实指针覆盖由Menu浏览器测试与真实包验收承担，这里核对演示初始选中态。
    for (const control of [custom.getByRole('link', { name: '文档' }), custom.getByRole('button', { name: '组件' })]) {
      await waitFor(() => expect(getComputedStyle(control).backgroundColor).toBe('rgb(220, 252, 231)'))
    }
    const home = custom.getByRole('button', { name: '首页' })
    expect(getComputedStyle(home).color).toBe('rgb(20, 83, 45)')
    expect(getComputedStyle(outside.getByRole('link', { name: '文档' })).fontSize).toBe('14px')
    expect(getComputedStyle(custom.getByRole('button', { name: '同域按钮' })).backgroundColor).toBe('rgb(255, 255, 255)')
    expect(custom.getByRole('button', { name: '禁用项' })).toBeDisabled()
  },
}

export const NestedOverrides: Story = {
  render: () => <ThemeProvider theme={{ components: { Menu: selectedTheme } }}>
    <section style={panel} aria-label="父级菜单">
      <h2>嵌套主题与局部例外</h2>
      <Navigation mode="vertical" aria-label="父级导航" />
      <ThemeProvider theme={{ ...darkTheme, components: { Menu: { itemFontSize: 18 } } }}>
        <section style={panel} aria-label="子级菜单">
          <h3>暗色子级继承绿色选中态，单独增大字号</h3>
          <p>普通项继承8px圆角，局部链接覆盖为胶囊；不会影响外面的父级。</p>
          <Menu mode="vertical" defaultValue="child">
            <Menu.Item value="child">继承项</Menu.Item>
            {/* 后代元素上的公开变量覆盖继承值；同样可以写在自定义class中。 */}
            <Menu.LinkItem value="local" href="#local" style={{ '--matthew-ui-menu-item-radius': '999px' } as CSSProperties}>局部胶囊链接</Menu.LinkItem>
          </Menu>
        </section>
      </ThemeProvider>
    </section>
  </ThemeProvider>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      const inherited = getComputedStyle(canvas.getByRole('button', { name: '继承项' }))
      expect([inherited.backgroundColor, inherited.borderRadius, inherited.fontSize]).toEqual(['rgb(220, 252, 231)', '8px', '18px'])
      expect(getComputedStyle(canvas.getByRole('link', { name: '局部胶囊链接' })).borderRadius).toBe('999px')
      expect(getComputedStyle(canvas.getByRole('button', { name: '首页' })).fontSize).toBe('14px')
    })
  },
}

export const ThemeSwitchAndReset: Story = {
  render: () => <SwitchPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = canvas.getByRole('button', { name: '组件' })
    await userEvent.click(canvas.getByRole('button', { name: '切换到暗色' }))
    await waitFor(() => expect(getComputedStyle(title).backgroundColor).toBe('rgb(220, 252, 231)'))
    // 控制按钮在Menu之外，点击会按现有规则关闭浮层；需要通过真实标题重新展开。
    if (title.getAttribute('aria-expanded') !== 'true') await userEvent.click(title)
    await waitFor(() => expect(canvas.getByRole('link', { name: '文档' })).toBeVisible())
    const popup = canvas.getByRole('link', { name: '文档' }).closest('ul')!
    await waitFor(() => expect([getComputedStyle(popup).backgroundColor, getComputedStyle(popup).boxShadow])
      .toEqual(['rgb(30, 41, 59)', 'rgba(255, 255, 255, 0.12) 0px 12px 24px 0px']))
    await userEvent.click(canvas.getByRole('button', { name: '撤销菜单定制' }))
    await waitFor(() => expect(getComputedStyle(title).backgroundColor).toBe('rgb(71, 85, 105)'))
    // 恢复起点，方便使用者亲手重复体验。
    await userEvent.click(canvas.getByRole('button', { name: '启用菜单定制' }))
    await userEvent.click(canvas.getByRole('button', { name: '切换到亮色' }))
    if (title.getAttribute('aria-expanded') !== 'true') await userEvent.click(title)
    await userEvent.unhover(title)
    await waitFor(() => expect(getComputedStyle(title).backgroundColor).toBe('rgb(220, 252, 231)'))
  },
}
